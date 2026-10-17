import { describe, expect, it } from 'vitest';
import { REAGENT_BY_ID } from './data';
import { addReagent, phOf, tick, type Amount } from './actions';
import { bubbleGas, electrolysisStep, flameTest, testGas } from './apparatus';
import { buildEquations } from './equation';
import { solutionColor } from './color';
import { MAX_T } from './physics';
import { amt, newVessel, type ReactionEvent, type Vessel } from './vessel';

type Step = string | [string, Amount];

let now = 1000;
function run(steps: Step[], v: Vessel = newVessel('t', 'tube')) {
  const all: ReactionEvent[] = [];
  for (const s of steps) {
    const [id, amount] = typeof s === 'string' ? [s, {} as Amount] : s;
    const res = addReagent(v, REAGENT_BY_ID[id], { ml: amount.ml ?? 1, g: amount.g ?? 0.5, drops: amount.drops ?? 2 }, (now += 1000));
    expect(res.error).toBeUndefined();
    all.push(...res.events);
  }
  return { v, all, kinds: all.map((e) => e.kind) };
}

function wait(v: Vessel, seconds: number, heating = false) {
  v.heating = heating;
  const all: ReactionEvent[] = [];
  for (let i = 0; i < seconds * 2; i++) all.push(...tick(v, 0.5, (now += 500)));
  v.heating = false;
  return { all, kinds: all.map((e) => e.kind) };
}

const terms = (eq: ReactionEvent['eq']) => {
  const e = buildEquations(eq!)!;
  return { lhs: e.molecular.lhs.map((t) => `${t.k}${t.f}${t.mark ?? ''}`), rhs: e.molecular.rhs.map((t) => `${t.k}${t.f}${t.mark ?? ''}`), net: e.netIonic };
};

describe('gases through a delivery tube', () => {
  it('CO2 dissolves in water as a weak acid, not in hydrochloric acid', () => {
    const water = run([['H2O', { ml: 5 }]]).v;
    const r = bubbleGas(water, 'CO2', 0.5, (now += 1000));
    expect(amt(water.aq, 'CO2')).toBeGreaterThan(0.1);
    expect(amt(water.aq, 'HCO3^-')).toBe(0);
    expect(phOf(water)!).toBeLessThan(5);
    expect(r.events[0].p).toMatchObject({ gas: 'CO2', alkali: '' });
    const acid = run([['HCl', { ml: 5 }]]).v;
    bubbleGas(acid, 'CO2', 0.5, (now += 1000));
    expect(amt(acid.aq, 'CO2')).toBe(0);
    expect(acid.gasTotal.CO2).toBeCloseTo(0.5);
  });

  it('CO2 into alkali is absorbed as carbonate', () => {
    const v = run([['NaOH', { ml: 5 }]]).v;
    const r = bubbleGas(v, 'CO2', 0.5, (now += 1000));
    expect(r.events[0].p).toMatchObject({ gas: 'CO2', alkali: '1' });
    expect(amt(v.aq, 'CO3^2-')).toBeCloseTo(0.5);
  });

  it('marble chips do not dissolve at once in water with CO2', () => {
    const v = run([['H2O', { ml: 5 }], ['CaCO3', { g: 0.5 }]]).v;
    const r = bubbleGas(v, 'CO2', 2, (now += 1000));
    expect(r.events.map((e) => e.kind)).not.toContain('limewaterClears');
    expect(amt(v.solids, 'CaCO3')).toBeGreaterThan(4.9);
  });

  it('H2S and SO2 dissolve up to saturation as molecules; chlorine partly', () => {
    const v = run([['H2O', { ml: 5 }]]).v;
    bubbleGas(v, 'H2S', 2, (now += 1000));
    expect(amt(v.aq, 'H2S')).toBeCloseTo(0.5);
    expect(v.gasTotal.H2S).toBeCloseTo(1.5);
    const c = run([['H2O', { ml: 5 }]]).v;
    bubbleGas(c, 'Cl2', 1, (now += 1000));
    expect(amt(c.aq, 'Cl2')).toBeCloseTo(0.3);
    expect(c.gasTotal.Cl2).toBeCloseTo(0.7);
  });

  it('dinitrogen oxide relights a glowing splint', () => {
    expect(testGas({ N2O: 2 }, 'glowing').result).toBe('relights');
  });
});

describe('electrolysis by the activity series', () => {
  const electrolyse = (id: string, steps = 1, seconds = 60) => {
    const v = run([[id, { ml: 20 }]], newVessel('b', 'beaker')).v;
    v.electro = { cathode: {} };
    const events: ReactionEvent[] = [];
    for (let i = 0; i < steps; i++) events.push(...electrolysisStep(v, seconds, (now += 1000)));
    return { v, events };
  };

  it('iron(III) chloride is first reduced to iron(II), then iron plates out', () => {
    const { v, events } = electrolyse('FeCl3', 40);
    expect(events[0].p).toMatchObject({ cathode: 'Fe^2+', anode: 'Cl2' });
    expect(terms(events[0].eq)).toMatchObject({ lhs: ['2FeCl3'], rhs: ['2FeCl2', '1Cl2↑'] });
    expect(events.some((e) => e.p.cathode === 'Fe')).toBe(true);
    expect(v.electro!.cathode.Fe).toBeGreaterThan(0);
  });

  it('aluminium chloride gives hydrogen and aluminium hydroxide, no aluminium', () => {
    const { v, events } = electrolyse('AlCl3', 3);
    expect(events[0].p).toMatchObject({ cathode: 'H2', anode: 'Cl2' });
    expect(terms(events[0].eq).rhs).toContain('2Al(OH)3↓');
    expect(v.electro!.cathode.Al ?? 0).toBe(0);
    expect(amt(v.solids, 'Al(OH)3')).toBeGreaterThan(0);
  });

  it('zinc sulfate gives zinc with some hydrogen and acid at the anode', () => {
    const { v, events } = electrolyse('ZnSO4', 2);
    expect(events[0].p).toMatchObject({ cathode: 'Zn', anode: 'O2', h2: '1' });
    expect(v.electro!.cathode.Zn).toBeGreaterThan(0);
    expect(v.gasTotal.H2).toBeGreaterThan(0);
    expect(phOf(v)!).toBeLessThan(3);
  });

  it('bromide gives bromine in the solution, sulfide gives sulfur', () => {
    const br = electrolyse('KBr');
    expect(br.events[0].p).toMatchObject({ cathode: 'H2', anode: 'Br2' });
    const s = electrolyse('Na2S');
    expect(s.events[0].p).toMatchObject({ cathode: 'H2', anode: 'S' });
    expect(amt(s.v.solids, 'S')).toBeGreaterThan(0);
  });

  it('hydrochloric acid gives hydrogen from the acid', () => {
    const { events } = electrolyse('HCl');
    expect(events[0].p).toMatchObject({ cathode: 'H2', anode: 'Cl2', acid: '1' });
    expect(terms(events[0].eq)).toMatchObject({ lhs: ['2HCl'], rhs: ['1H2↑', '1Cl2↑'] });
  });
});

describe('flame test of solids without a listed cation', () => {
  it('malachite and blue vitriol colour the flame green', () => {
    for (const id of ['malachite', 'CuSO4s']) {
      const v = run([[id, { g: 0.2 }]]).v;
      expect(flameTest(v).ions[0]).toBe('Cu^2+');
    }
  });
});

describe('ionic equations and precipitate marks', () => {
  it('concentrated hydrochloric acid is written as ions, concentrated sulfuric acid as a molecule', () => {
    const cl = buildEquations({ reactants: ['MnO2', 'HCl'], products: ['MnCl2', 'Cl2', 'H2O'], gas: ['Cl2'], conc: 'HCl', cond: 't' })!;
    expect(cl.netIonic!.lhs.map((t) => t.f)).toEqual(['MnO2', 'H^+', 'Cl^-']);
    const s = buildEquations({ reactants: ['Cu', 'H2SO4'], products: ['CuSO4', 'SO2', 'H2O'], gas: ['SO2'], conc: 'H2SO4' })!;
    expect(s.netIonic!.lhs.map((t) => t.f)).toContain('H2SO4');
  });

  it('insoluble products of reactions in solution get an arrow, metals do not', () => {
    const pb = buildEquations({ reactants: ['Pb', 'CuSO4'], products: ['PbSO4', 'Cu'] })!;
    expect(pb.molecular.rhs.map((t) => t.mark)).toEqual(['↓', undefined]);
    const ba = buildEquations({ reactants: ['H2SO4', 'Ba(OH)2'], products: ['BaSO4', 'H2O'] })!;
    expect(ba.molecular.rhs[0].mark).toBe('↓');
    const dry = buildEquations({ reactants: ['Cu(OH)2'], products: ['CuO', 'H2O'], cond: 't' })!;
    expect(dry.molecular.rhs[0].mark).toBeUndefined();
  });

  it('a suspension marked as solid stays whole in the ionic equation', () => {
    const e = buildEquations({ reactants: ['Ca(OH)2', 'HCl'], products: ['CaCl2', 'H2O'], solid: ['Ca(OH)2'] })!;
    expect(e.netIonic!.lhs.map((t) => t.f)).toContain('Ca(OH)2');
  });

  it('an equation that cannot be read gives no equations instead of an error', () => {
    expect(buildEquations({ reactants: ['SO4(SO4)-1'], products: ['H2O'] })).toBeNull();
  });
});

describe('heating', () => {
  it('a dry tube over the flame gets far hotter than boiling water, below the softening point', () => {
    const v = run([['NaCls', { g: 0.3 }]]).v;
    wait(v, 300, true);
    expect(v.temp).toBeGreaterThan(450);
    expect(v.temp).toBeLessThanOrEqual(MAX_T);
  });

  it('a boiled-down solution leaves a dry residue and no dissolved ions', () => {
    const v = run([['CuSO4', { ml: 2 }]]).v;
    const r = wait(v, 400, true);
    expect(r.kinds).toContain('dryOut');
    expect(Object.keys(v.aq)).toEqual([]);
  });

  it('concentrated sulfuric acid is not "boiled dry" while it is still in the tube', () => {
    const v = run([['H2SO4c', { ml: 2 }], ['Fe', { g: 0.1 }]]).v;
    const r = wait(v, 120, true);
    expect(r.kinds).not.toContain('dryOut');
    expect(v.temp).toBeLessThan(340);
  });

  it('halogens do not boil out of alkali', () => {
    const v = run([['NaOH', { ml: 3 }]]).v;
    v.aq.Br2 = 0.01;
    const r = wait(v, 120, true);
    expect(r.kinds).not.toContain('gasOut');
  });
});

describe('concentrated sulfuric acid', () => {
  it('turns blue vitriol white', () => {
    const r = run(['H2SO4c', ['CuSO4s', { g: 0.5 }]]);
    expect(r.kinds).toContain('dehydration');
    expect(amt(r.v.solids, 'CuSO4')).toBeGreaterThan(1.9);
    expect(amt(r.v.solids, 'CuSO4·5H2O')).toBe(0);
  });

  it('gives nitric acid vapour from saltpetre on heating', () => {
    const r = run(['H2SO4c', ['KNO3s', { g: 0.3 }]]);
    const w = wait(r.v, 60, true);
    expect(w.kinds).toContain('nitricPrep');
    expect(r.v.gasTotal.HNO3).toBeGreaterThan(0);
    expect(amt(r.v.solids, 'KHSO4')).toBeGreaterThan(0);
  });

  it('oxidises hot charcoal and sulfur to their oxides', () => {
    const c = run(['H2SO4c', ['C', { g: 0.05 }]]);
    const w = wait(c.v, 60, true);
    const e = w.all.find((x) => x.kind === 'concOxidation')!;
    expect(e.p).toMatchObject({ acid: 'H2SO4', reducer: 'C' });
    expect(terms(e.eq).rhs).toEqual(['1CO2↑', '2SO2↑', '2H2O']);
    const s = run(['H2SO4c', ['S', { g: 0.05 }]]);
    expect(wait(s.v, 60, true).kinds).toContain('concOxidation');
    expect(s.v.gasTotal.SO2).toBeGreaterThan(0);
  });

  it('oxidises a dry bromide to bromine and an iodide to iodine with H2S', () => {
    const br = run([['KBr', { ml: 3 }]]);
    wait(br.v, 400, true);
    const e = run(['H2SO4c'], br.v).all.find((x) => x.kind === 'concOxidation')!;
    expect(e.p.reducer).toBe('Br^-');
    expect(br.v.gasTotal.Br2).toBeGreaterThan(0);
    const ki = run([['KI', { ml: 3 }]]);
    wait(ki.v, 400, true);
    run(['H2SO4c'], ki.v);
    expect(ki.v.gasTotal.H2S).toBeGreaterThan(0);
    expect(amt(ki.v.solids, 'I2')).toBeGreaterThan(0);
  });

  it('gives CO2 with baking soda and gets hot with solid alkali', () => {
    expect(run(['H2SO4c', ['NaHCO3', { g: 0.2 }]]).kinds).toContain('gasCO2');
    const r = run([['H2SO4c', { ml: 2 }], ['NaOHs', { g: 0.2 }]]);
    const e = r.all.find((x) => x.kind === 'neutralization')!;
    expect(e.dT!).toBeGreaterThan(20);
  });
});

describe('concentrated nitric acid', () => {
  it('oxidises iodide, iron(II), sulfide and sulfite, giving brown NO2', () => {
    const cases: [string, string][] = [['KI', 'I^-'], ['FeSO4', 'Fe^2+'], ['Na2S', 'S^2-'], ['Na2SO3', 'SO3^2-']];
    for (const [id, reducer] of cases) {
      const r = run([['HNO3c', { ml: 2 }], [id, { ml: 1 }]]);
      const e = r.all.find((x) => x.kind === 'concOxidation');
      expect(e?.p).toMatchObject({ acid: 'HNO3', reducer });
      expect(r.v.gasTotal.NO2).toBeGreaterThan(0);
      expect(r.v.gasTotal.H2S ?? 0).toBe(0);
      expect(r.v.gasTotal.SO2 ?? 0).toBe(0);
    }
    const fe = run([['HNO3c', { ml: 2 }], ['FeSO4', { ml: 1 }]]);
    expect(amt(fe.v.aq, 'Fe^3+')).toBeGreaterThan(0);
    expect(amt(fe.v.aq, 'Fe^2+')).toBe(0);
  });

  it('oxidises hot charcoal to CO2', () => {
    const r = run([['HNO3c', { ml: 2 }], ['C', { g: 0.05 }]]);
    expect(wait(r.v, 30, true).all.some((e) => e.kind === 'concOxidation' && e.p.reducer === 'C')).toBe(true);
    expect(r.v.gasTotal.CO2).toBeGreaterThan(0);
  });
});

describe('strong heating of dry solids', () => {
  it('silver nitrate leaves silver, lead nitrate the oxide, both with brown NO2', () => {
    const ag = run([['AgNO3', { ml: 3 }]]);
    const w = wait(ag.v, 600, true);
    const e = w.all.find((x) => x.kind === 'thermalDecomp' && x.p.solid === 'AgNO3')!;
    expect(terms(e.eq).rhs).toEqual(['2Ag', '2NO2↑', '1O2↑']);
    expect(amt(ag.v.solids, 'Ag')).toBeGreaterThan(0.25);
    const pb = run([['PbNO32', { ml: 3 }]]);
    wait(pb.v, 600, true);
    expect(amt(pb.v.solids, 'PbO')).toBeGreaterThan(0);
    expect(pb.v.gasTotal.NO2).toBeGreaterThan(0);
  });

  it('ammonium nitrate gives N2O above its melting point', () => {
    const r = run([['NH4NO3s', { g: 0.3 }]]);
    expect(wait(r.v, 120, true).kinds).toContain('thermalDecomp');
    expect(r.v.gasTotal.N2O).toBeGreaterThan(0);
  });

  it('copper blackens in air, magnesium flares up, sulfur burns', () => {
    const cu = run([['Cu', { g: 0.3 }]]);
    expect(wait(cu.v, 120, true).kinds).toContain('heatInAir');
    expect(amt(cu.v.solids, 'CuO')).toBeGreaterThan(0);
    expect(amt(cu.v.solids, 'Cu')).toBeGreaterThan(amt(cu.v.solids, 'CuO'));
    const mg = run([['Mg', { g: 0.1 }]]);
    expect(wait(mg.v, 300, true).all.some((e) => e.kind === 'heatInAir' && e.p.metal === 'Mg')).toBe(true);
    expect(amt(mg.v.solids, 'MgO')).toBeGreaterThan(0);
    const s = run([['S', { g: 0.1 }]]);
    wait(s.v, 120, true);
    expect(s.v.gasTotal.SO2).toBeGreaterThan(0);
  });
});

describe('colours on heating', () => {
  it('boiling iron(III) chloride gives a red-brown sol that acid takes back', () => {
    const r = run([['FeCl3', { ml: 3 }]]);
    const w = wait(r.v, 120, true);
    const e = w.all.find((x) => x.kind === 'solFormation')!;
    expect(e).toBeDefined();
    expect(terms(e.eq).rhs[0]).toBe('1Fe(OH)3');
    expect(amt(r.v.aq, 'Fe(OH)3')).toBeGreaterThan(0);
    run([['HCl', { ml: 2 }]], r.v);
    expect(amt(r.v.aq, 'Fe(OH)3')).toBe(0);
  });

  it('the starch–iodine blue fades when hot and is deep blue, not black, when cold', () => {
    const r = run(['starch', 'KI', 'Cl2aq']);
    const cold = solutionColor(r.v.aq, r.v.volume, r.v.inds, 7, 20)!;
    const [cr, cg, cb] = [1, 3, 5].map((i) => parseInt(cold.slice(i, i + 2), 16));
    expect(cb).toBeGreaterThan(100);
    expect(cb).toBeGreaterThan(cr + cg);
    const hot = solutionColor(r.v.aq, r.v.volume, r.v.inds, 7, 90)!;
    expect(parseInt(hot.slice(5, 7), 16)).toBeLessThan(cb);
    expect(wait(r.v, 60, true).kinds).toContain('colorFade');
  });

  it('limewater turns cloudy when heated', () => {
    const r = run([['CaOH2', { ml: 5 }]]);
    const w = wait(r.v, 120, true);
    expect(w.all.some((e) => e.kind === 'crystallize' && e.p.cause === 'heat')).toBe(true);
  });
});


import { describe, expect, it } from 'vitest';
import { balance } from './balance';
import { buildEquations } from './equation';
import { parseFormula, pretty } from './formula';
import { REAGENT_BY_ID } from './data';
import { addReagent, pour, tick, phOf, type Amount, type Dose } from './actions';
import { newVessel, type ReactionEvent, type Vessel } from './vessel';
import { indicatorColor } from './color';

type Step = string | [string, Dose | Amount];

function run(steps: Step[], v: Vessel = newVessel('t', 'tube')) {
  let events: ReactionEvent[] = [];
  const all: ReactionEvent[] = [];
  let now = 1000;
  for (const s of steps) {
    const [id, dose] = typeof s === 'string' ? [s, 1 as Dose | Amount] : s;
    const r = REAGENT_BY_ID[id];
    if (!r) throw new Error(`no reagent ${id}`);
    const res = addReagent(v, r, dose, (now += 1000));
    expect(res.error).toBeUndefined();
    events = res.events;
    all.push(...events);
  }
  return { v, events, all, kinds: all.map((e) => e.kind) };
}

const solids = (v: Vessel) => Object.keys(v.solids).filter((k) => v.solids[k] > 1e-6);
const gases = (v: Vessel) => v.fx.gas.map((g) => g.id);

function heat(v: Vessel, seconds: number) {
  v.heating = true;
  const all: ReactionEvent[] = [];
  let now = 100000;
  for (let i = 0; i < seconds * 4; i++) all.push(...tick(v, 0.25, (now += 250)));
  v.heating = false;
  return all;
}

describe('formula and balancing', () => {
  it('parses formulas with brackets, hydrates and charges', () => {
    expect(parseFormula('Ca3(PO4)2').counts).toEqual({ Ca: 3, P: 2, O: 8 });
    expect(parseFormula('Na2[Zn(OH)4]').counts).toEqual({ Na: 2, Zn: 1, O: 4, H: 4 });
    expect(parseFormula('NH3·H2O').counts).toEqual({ N: 1, H: 5, O: 1 });
    expect(parseFormula('SO4^2-')).toEqual({ counts: { S: 1, O: 4 }, charge: -2 });
    expect(pretty('Cu(OH)2')).toBe('Cu(OH)₂');
    expect(pretty('SO4^2-')).toBe('SO₄²⁻');
  });

  it('balances school equations', () => {
    expect(balance(['CuSO4', 'NaOH'], ['Cu(OH)2', 'Na2SO4'])).toEqual([1, 2, 1, 1]);
    expect(balance(['Cu', 'HNO3'], ['Cu(NO3)2', 'NO', 'H2O'])).toEqual([3, 8, 3, 2, 4]);
    expect(balance(['FeCl3', 'Na2CO3', 'H2O'], ['Fe(OH)3', 'NaCl', 'CO2'])).toEqual([2, 3, 3, 2, 6, 3]);
    expect(balance(['Al', 'NaOH', 'H2O'], ['Na[Al(OH)4]', 'H2'])).toEqual([2, 2, 6, 2, 3]);
    expect(balance(['Cu^2+', 'OH^-'], ['Cu(OH)2'])).toEqual([1, 2, 1]);
  });

  it('derives net ionic equations', () => {
    const eqs = buildEquations({ reactants: ['BaCl2', 'Na2SO4'], products: ['BaSO4', 'NaCl'], precip: ['BaSO4'] })!;
    const net = eqs.netIonic!;
    expect(net.lhs.map((t) => `${t.k}${t.f}`).sort()).toEqual(['1Ba^2+', '1SO4^2-']);
    expect(net.rhs.map((t) => t.f)).toEqual(['BaSO4']);
  });
});

describe('content-mvp experiments', () => {
  it('1. CuSO4 + NaOH -> light blue Cu(OH)2', () => {
    const { v, kinds } = run(['CuSO4', 'NaOH']);
    expect(kinds).toContain('precip');
    expect(solids(v)).toContain('Cu(OH)2');
  });

  it('2. FeCl3 + NaOH -> brown Fe(OH)3', () => {
    const { v } = run(['FeCl3', 'NaOH', 'NaOH']);
    expect(solids(v)).toContain('Fe(OH)3');
  });

  it('3. FeSO4 + NaOH -> Fe(OH)2 that browns in air', () => {
    const { v } = run(['FeSO4', 'NaOH']);
    expect(solids(v)).toContain('Fe(OH)2');
    let now = v.fx.precipAt! + 9000;
    for (let i = 0; i < 40; i++) tick(v, 1, (now += 1000));
    expect(solids(v)).toContain('Fe(OH)3');
  });

  it('4–5. silver halides', () => {
    expect(solids(run(['AgNO3', 'NaCl']).v)).toContain('AgCl');
    expect(solids(run(['AgNO3', 'KI']).v)).toContain('AgI');
  });

  it('6. BaCl2 + Na2SO4 and + H2SO4 -> BaSO4', () => {
    expect(solids(run(['BaCl2', 'Na2SO4']).v)).toContain('BaSO4');
    const { v, events } = run(['BaCl2', 'H2SO4']);
    expect(solids(v)).toContain('BaSO4');
    const eq = events.find((e) => e.kind === 'precip')!.eq!;
    expect(eq.reactants).toEqual(['BaCl2', 'H2SO4']);
    expect(eq.products).toEqual(['BaSO4', 'HCl']);
  });

  it('7. Na2CO3 + excess HCl -> CO2; a little acid gives bicarbonate first', () => {
    const a = run([['Na2CO3', 1], ['HCl', 0]]);
    expect(a.kinds).toContain('bicarbonateFirst');
    expect(gases(a.v)).not.toContain('CO2');
    const b = run([['Na2CO3', 1], ['HCl', 2]]);
    expect(b.kinds).toContain('gasCO2');
    expect(gases(b.v)).toContain('CO2');
  });

  it('8. marble + HCl -> CO2', () => {
    const { v, kinds } = run(['CaCO3', ['HCl', 2]]);
    expect(kinds).toContain('dissolveAcid');
    expect(gases(v)).toContain('CO2');
  });

  it('9-ish. Na2CO3 + limewater -> CaCO3', () => {
    expect(solids(run([['CaOH2', 2], 'Na2CO3']).v)).toContain('CaCO3');
  });

  it('10. NH4Cl + NaOH -> ammonia, gas on heating', () => {
    const { v, kinds } = run(['NH4Cl', 'NaOH']);
    expect(kinds).toContain('ammonia');
    const evs = heat(v, 15);
    expect(evs.map((e) => e.kind)).toContain('ammoniaGas');
  });

  it('11–13. metals with hydrochloric acid', () => {
    const zn = run(['HCl', 'Zn']);
    expect(zn.kinds).toContain('metalAcid');
    expect(gases(zn.v)).toContain('H2');
    const mg = run(['HCl', 'Mg']);
    expect(mg.v.temp).toBeGreaterThan(30);
    const fe = run(['HCl', 'Fe']);
    expect(fe.v.aq['Fe^2+']).toBeGreaterThan(0);
    expect(fe.v.aq['Fe^3+']).toBeUndefined();
  });

  it('14. Cu + HCl -> no reaction, explained by the activity series', () => {
    const { kinds, v } = run(['HCl', 'Cu']);
    expect(kinds).toContain('metalAcidNone');
    expect(gases(v)).toEqual([]);
  });

  it('15–17. metal displacement', () => {
    const fe = run(['CuSO4', 'Fe']);
    expect(fe.kinds).toContain('metalSalt');
    expect(solids(fe.v)).toContain('Cu');
    const zn = run(['CuSO4', 'Zn']);
    expect(solids(zn.v)).toContain('Cu');
    const cu = run([['AgNO3', 2], 'Cu']);
    expect(solids(cu.v)).toContain('Ag');
    expect(cu.v.aq['Cu^2+']).toBeGreaterThan(0);
  });

  it('18. Cu + FeSO4 -> no reaction', () => {
    expect(run(['FeSO4', 'Cu']).kinds).toContain('metalSaltNone');
  });

  it('19. Na + water with phenolphthalein turns crimson', () => {
    const { v, kinds } = run([['H2O', 2], 'phph', 'Na']);
    expect(kinds).toContain('activeMetalWater');
    expect(phOf(v)!).toBeGreaterThan(12);
    expect(indicatorColor('phph', phOf(v)!).name).toBe('crimson');
  });

  it('19b. a big piece of sodium explodes and breaks the test tube', () => {
    const { all, v } = run([['H2O', { ml: 10 }], ['Na', { g: 1.2 }]]);
    expect(all.some((e) => e.safety === 'bigSodium')).toBe(true);
    expect(v.broken).toBeDefined();
    expect(v.volume).toBe(0);
    expect(addReagent(v, REAGENT_BY_ID.H2O, { ml: 1 }, 99999).error).toBe('broken');
  });

  it('19c. a pea-sized piece of sodium only skates on the water', () => {
    const { kinds, v, all } = run([['H2O', { ml: 10 }], ['Na', { g: 0.1 }]]);
    expect(kinds).toContain('activeMetalWater');
    expect(v.broken).toBeUndefined();
    expect(all.find((e) => e.kind === 'activeMetalWater')?.p.violent).toBe('');
  });

  it('19d. half a gram of sodium spatters alkali out of a test tube but does not break it; a beaker takes it calmly', () => {
    const tube = run([['H2O', { ml: 10 }], ['Na', { g: 0.5 }]]);
    expect(tube.v.broken).toBeUndefined();
    expect(tube.all.find((e) => e.kind === 'activeMetalWater')?.p.violent).toBe('1');
    expect(tube.v.volume).toBeLessThan(8);
    const beaker = run([['H2O', { ml: 50 }], ['Na', { g: 0.5 }]], newVessel('b', 'beaker'));
    expect(beaker.v.broken).toBeUndefined();
    expect(beaker.all.find((e) => e.kind === 'activeMetalWater')?.p.violent).toBe('');
  });

  it('20–21. calcium and quicklime with water give cloudy limewater', () => {
    const ca = run([['H2O', 1], 'Ca']);
    expect(ca.kinds).toContain('activeMetalWater');
    const cao = run([['H2O', 1], 'CaO']);
    expect(cao.kinds).toContain('oxideWater');
    expect(solids(cao.v)).toContain('Ca(OH)2');
    expect(cao.v.temp).toBeGreaterThan(30);
  });

  it('22. neutralization switches phenolphthalein off', () => {
    const { v } = run(['NaOH', 'phph', ['HCl', 0]]);
    expect(indicatorColor('phph', phOf(v)!).name).toBe('crimson');
    const res = addReagent(v, REAGENT_BY_ID.HCl, 1, 99999);
    expect(indicatorColor('phph', phOf(v)!).name).toBe('colorless');
    expect(res.events.some((e) => e.signs.includes('color'))).toBe(true);
  });

  it('23. Cu(OH)2 turns into black CuO on heating', () => {
    const { v } = run(['CuSO4', 'NaOH']);
    const evs = heat(v, 60);
    expect(evs.map((e) => e.kind)).toContain('hydroxideDecomp');
    expect(solids(v)).toContain('CuO');
  });

  it('24. CuO + H2SO4 needs heating, then gives a blue solution', () => {
    const { v, kinds } = run(['CuO', 'H2SO4']);
    expect(kinds).toContain('needsHeat');
    const evs = heat(v, 15);
    expect(evs.map((e) => e.kind)).toContain('dissolveAcid');
    expect(v.aq['Cu^2+']).toBeGreaterThan(0);
  });

  it('25. H2O2 + MnO2 -> oxygen', () => {
    const { v, kinds } = run(['H2O2', 'MnO2']);
    expect(kinds).toContain('h2o2');
    expect(gases(v)).toContain('O2');
  });

  it('30. FeCl3 + KSCN -> blood red', () => {
    const { v, kinds } = run(['FeCl3', 'KSCN']);
    expect(kinds).toContain('fe3scn');
    expect(v.aq['Fe(SCN)3']).toBeGreaterThan(0);
  });

  it('31–32. amphoteric hydroxides dissolve in excess alkali but not in ammonia', () => {
    const zn = run(['ZnSO4', ['NaOH', 2]]);
    expect(zn.kinds).toContain('precip');
    expect(zn.kinds).toContain('amphoteric');
    expect(solids(zn.v)).not.toContain('Zn(OH)2');
    const al = run(['AlCl3', ['NaOH', 2]]);
    expect(al.kinds).toContain('amphoteric');
    const alNh3 = run(['AlCl3', ['NH3aq', 2]]);
    expect(solids(alNh3.v)).toContain('Al(OH)3');
  });

  it('33. water glass + acid -> silicic acid gel', () => {
    const { v, kinds } = run(['Na2SiO3', 'HCl']);
    expect(kinds).toContain('silicicGel');
    expect(solids(v)).toContain('H2SiO3');
  });

  it('35. NaCl + Na2SO4 -> nothing, all ions stay in solution', () => {
    expect(run(['NaCl', 'Na2SO4']).kinds).toContain('exchangeNone');
  });

  it('36. concentrated H2SO4 chars sugar', () => {
    const { v, kinds } = run(['sugar', 'H2SO4c']);
    expect(kinds).toContain('sugarChar');
    expect(solids(v)).toContain('C');
  });

  it('37. water poured into concentrated acid splashes; acid into water is the safe way', () => {
    const bad = run(['H2SO4c', 'H2O']);
    expect(bad.kinds).toContain('dilutionUnsafe');
    expect(bad.all.find((e) => e.kind === 'dilutionUnsafe')!.safety).toBe('acidWater');
    const good = run([['H2O', 2], 'H2SO4c']);
    expect(good.kinds).toContain('dilutionSafe');
    expect(good.v.temp).toBeGreaterThan(50);
  });
});

describe('more chemistry', () => {
  it('copper with dilute nitric acid gives NO, not hydrogen', () => {
    const { v, kinds } = run([['HNO3', 2], 'Cu']);
    expect(kinds).toContain('metalNitric');
    expect(gases(v)).toContain('NO');
    expect(gases(v)).not.toContain('H2');
  });

  it('ammonia first precipitates, then dissolves copper hydroxide into a deep blue complex', () => {
    const { v, kinds } = run(['CuSO4', ['NH3aq', 2]]);
    expect(kinds).toContain('precip');
    expect(kinds).toContain('ammine');
    expect(v.aq['[Cu(NH3)4]^2+']).toBeGreaterThan(0);
  });

  it('silver chloride dissolves in ammonia and comes back with nitric acid', () => {
    const v = run(['AgNO3', 'NaCl', ['NH3aq', 2]]).v;
    expect(solids(v)).not.toContain('AgCl');
    run([['HNO3', 2]], v);
    expect(solids(v)).toContain('AgCl');
  });

  it('copper sulfate with soda gives basic carbonate and CO2', () => {
    const { v, kinds } = run(['CuSO4', 'Na2CO3']);
    expect(kinds).toContain('jointHydrolysis');
    expect(solids(v)).toContain('(CuOH)2CO3');
  });

  it('vinegar + baking soda fizzes', () => {
    const { v, kinds } = run([['CH3COOH', 2], 'NaHCO3']);
    expect(kinds).toContain('gasCO2');
    expect(gases(v)).toContain('CO2');
  });

  it('aluminium does not displace copper from sulfate but does from chloride', () => {
    expect(run(['CuSO4', 'Al']).kinds).toContain('aluminumFilm');
    expect(run(['CuCl2', 'Al']).kinds).toContain('metalSalt');
  });

  it('copper(II) and iodide give iodine and copper(I) iodide', () => {
    expect(run(['CuSO4', 'KI']).kinds).toContain('iodideOx');
  });

  it('pouring one tube into another mixes and reacts', () => {
    const a = run(['BaCl2'], newVessel('a', 'tube')).v;
    const b = run(['Na2SO4'], newVessel('b', 'tube')).v;
    const res = pour(b, a, 5000);
    expect(res.events.map((e) => e.kind)).toContain('precip');
    expect(b.volume).toBe(0);
  });

  it('pH of common solutions is realistic', () => {
    expect(phOf(run(['HCl']).v)!).toBeCloseTo(0, 0);
    expect(phOf(run(['NaOH']).v)!).toBeCloseTo(14, 0);
    expect(phOf(run(['CH3COOH']).v)!).toBeCloseTo(2.4, 0);
    expect(phOf(run(['Na2CO3']).v)!).toBeGreaterThan(11);
    expect(phOf(run(['NH4Cl']).v)!).toBeLessThan(6);
    expect(phOf(run(['NaCl']).v)!).toBeCloseTo(7, 0);
    expect(phOf(run(['FeCl3']).v)!).toBeLessThan(3);
  });

  it('every reaction event has a balanced equation', () => {
    const scenarios: Step[][] = [
      ['CuSO4', 'NaOH'], ['FeCl3', ['NaOH', 2]], ['AgNO3', 'NaCl'], ['BaCl2', 'H2SO4'], ['Na2CO3', ['HCl', 2]],
      ['CaCO3', ['HCl', 2]], ['NH4Cl', 'NaOH'], ['HCl', 'Zn'], ['H2SO4', 'Fe'], ['CuSO4', 'Fe'], [['AgNO3', 2], 'Cu'],
      [['H2O', 2], 'Na'], [['H2O', 1], 'Ca'], [['H2O', 1], 'CaO'], ['NaOH', 'HCl'], ['H2O2', 'MnO2'], ['FeCl3', 'KSCN'],
      ['ZnSO4', ['NaOH', 2]], ['AlCl3', ['NaOH', 2]], ['Na2SiO3', 'HCl'], ['sugar', 'H2SO4c'], [['HNO3', 2], 'Cu'],
      ['CuSO4', ['NH3aq', 2]], ['AgNO3', 'NaCl', ['NH3aq', 2], ['HNO3', 2]], ['CuSO4', 'Na2CO3'], ['FeCl3', 'Na2CO3'],
      [['CH3COOH', 2], 'NaHCO3'], ['CuCl2', 'Al'], [['NaOH', 2], 'Al'], ['H3PO4', ['NaOH', 2]], ['Na3PO4', 'CaCl2'],
      ['AgNO3', 'NaOH'], ['CH3COOH', 'NaOH', ['HCl', 2]], ['NH3aq', 'HCl'], ['CaOH2', 'H3PO4'], ['Mg', 'CH3COOH']
    ];
    for (const s of scenarios) {
      const { all } = run(s);
      for (const e of all) {
        if (!e.eq || e.eq.noReaction) continue;
        const built = buildEquations(e.eq);
        expect(built, `${s.join(' + ')}: ${e.kind} ${e.eq.reactants.join('+')} -> ${e.eq.products.join('+')}`).not.toBeNull();
      }
    }
  });
});

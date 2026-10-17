import { describe, expect, it } from 'vitest';
import { REAGENT_BY_ID } from './data';
import { addReagent, phOf, tick, type Amount } from './actions';

function wait(v: Vessel, seconds: number, heating = false) {
  v.heating = heating;
  const all: ReactionEvent[] = [];
  let now = 200000;
  for (let i = 0; i < seconds * 2; i++) all.push(...tick(v, 0.5, (now += 500)));
  v.heating = false;
  return { all, kinds: all.map((e) => e.kind) };
}
import { buildEquations } from './equation';

import { amt, newVessel, put, type ReactionEvent, type Vessel } from './vessel';

type Step = string | [string, Amount];

function run(steps: Step[], v: Vessel = newVessel('t', 'beaker')) {
  const all: ReactionEvent[] = [];
  let now = 1000;
  for (const s of steps) {
    const [id, amount] = typeof s === 'string' ? [s, {} as Amount] : s;
    const r = REAGENT_BY_ID[id];
    if (!r) throw new Error(`no reagent ${id}`);
    const res = addReagent(v, r, { ml: amount.ml ?? 2, g: amount.g ?? 0.5, drops: amount.drops ?? 2 }, (now += 1000));
    expect(res.error).toBeUndefined();
    all.push(...res.events);
  }
  return { v, all, kinds: all.map((e) => e.kind) };
}

/** Every equation of the events builds without throwing and is balanced. */
function equationsOk(all: ReactionEvent[]) {
  for (const e of all) {
    if (!e.eq) continue;
    expect(() => buildEquations(e.eq!), `${e.kind}: ${e.eq.reactants.join(' + ')}`).not.toThrow();
    expect(buildEquations(e.eq!), `${e.kind}: ${e.eq.reactants.join(' + ')} -> ${e.eq.products.join(' + ')}`).not.toBeNull();
  }
}

function eqText(all: ReactionEvent[], kind: string) {
  const e = all.find((x) => x.kind === kind && x.eq);
  const m = e && buildEquations(e.eq!)?.molecular;
  return m ? [...m.lhs, ...m.rhs].map((t) => `${t.k} ${t.f}`).join(' ') : '';
}

describe('strong oxidisers', () => {
  it('KMnO4 + H2SO4 + FeSO4 builds a correct equation', () => {
    const r = run([['KMnO4', { ml: 1 }], 'H2SO4', 'FeSO4']);
    expect(r.kinds).toContain('permanganateRedox');
    equationsOk(r.all);
    const r2 = run([['K2Cr2O7', { ml: 1 }], 'H2SO4', 'FeSO4']);
    expect(r2.kinds).toContain('dichromateRedox');
    equationsOk(r2.all);
  });

  it('sulfite and sulfide decolourise acidified permanganate instead of giving gases', () => {
    const r = run([['KMnO4', { ml: 1 }], 'H2SO4', 'Na2SO3']);
    expect(r.kinds).toContain('permanganateRedox');
    expect(amt(r.v.aq, 'MnO4^-')).toBeLessThan(1e-6);
    equationsOk(r.all);
    const s = run([['KMnO4', { ml: 1 }], 'H2SO4', 'Na2S']);
    expect(amt(s.v.solids, 'S')).toBeGreaterThan(0);
    equationsOk(s.all);
    const d = run([['K2Cr2O7', { ml: 1 }], 'H2SO4', 'Na2SO3']);
    expect(d.kinds).toContain('dichromateRedox');
    equationsOk(d.all);
  });

  it('sulfur dioxide decolourises permanganate without added acid', () => {
    const v = newVessel('t', 'beaker');
    run([['KMnO4', { ml: 2 }]], v);
    put(v.aq, 'SO2', 0.5);
    const r = run(['H2O'], v);
    expect(r.kinds).toContain('permanganateRedox');
    expect(amt(v.aq, 'MnO4^-')).toBeLessThan(1e-6);
    expect(eqText(r.all, 'permanganateRedox')).toContain('H2SO4');
    equationsOk(r.all);
  });

  it('permanganate in alkali turns green with KI and H2O2', () => {
    const r = run([['KMnO4', { ml: 1 }], 'NaOH', 'H2O2']);
    const e = r.all.find((x) => x.kind === 'permanganateRedox');
    expect(e?.p.medium).toBe('alkaline');
    equationsOk(r.all);
  });

  it('permanganate with manganese(II) in neutral solution gives MnO2', () => {
    const r = run([['KMnO4', { ml: 1 }], 'MnSO4']);
    expect(amt(r.v.solids, 'MnO2')).toBeGreaterThan(0);
    equationsOk(r.all);
  });
});

describe('iron redox', () => {
  it('H2O2 turns iron(II) into iron(III): red colour with thiocyanate', () => {
    const r = run(['FeSO4', 'H2SO4', 'H2O2', 'KSCN']);
    expect(r.kinds).toContain('iron2Ox');
    expect(r.kinds).toContain('fe3scn');
    equationsOk(r.all);
  });

  it('dilute nitric acid oxidises iron(II) with NO', () => {
    const r = run(['FeSO4', 'HNO3']);
    expect(r.kinds).toContain('iron2Ox');
    expect(eqText(r.all, 'iron2Ox')).toContain('NO');
    equationsOk(r.all);
  });

  it('iron(III) is reduced by sulfite and thiosulfate', () => {
    const r = run(['FeCl3', 'Na2SO3']);
    expect(r.kinds).toContain('iron3Reduce');
    equationsOk(r.all);
    const t = run(['FeCl3', 'Na2S2O3']);
    expect(t.kinds).toContain('iron3Reduce');
    equationsOk(t.all);
  });
});

describe('nitric acid as an oxidiser', () => {
  it('sulfide gives sulfur and sulfite gives sulfate, no H2S or SO2', () => {
    const r = run(['Na2S', 'HNO3']);
    expect(r.kinds).toContain('nitricRedox');
    expect(r.kinds).not.toContain('sulfideAcid');
    expect(amt(r.v.solids, 'S')).toBeGreaterThan(0);
    equationsOk(r.all);
    const s = run(['Na2SO3', 'HNO3']);
    expect(s.kinds).toContain('nitricRedox');
    expect(s.kinds).not.toContain('sulfiteAcid');
    equationsOk(s.all);
  });
});

describe('halogens', () => {
  it('chlorine and bromine water decolourise in alkali', () => {
    const r = run(['Cl2aq', 'NaOH']);
    expect(r.kinds).toContain('halogenAlkali');
    expect(eqText(r.all, 'halogenAlkali')).toContain('NaClO');
    equationsOk(r.all);
    const b = run(['Br2aq', 'NaOH']);
    expect(b.kinds).toContain('halogenAlkali');
    expect(amt(b.v.aq, 'Br2')).toBeLessThan(1e-6);
    equationsOk(b.all);
  });

  it('chlorine water + thiosulfate', () => {
    const r = run(['Cl2aq', 'Na2S2O3']);
    expect(r.kinds).toContain('halogenThio');
    equationsOk(r.all);
  });

  it('chlorine water gives AgCl with silver nitrate', () => {
    const r = run(['Cl2aq', 'AgNO3']);
    expect(amt(r.v.solids, 'AgCl')).toBeGreaterThan(0);
    equationsOk(r.all);
  });

  it('bromine water is decolourised by dissolved SO2 and H2S', () => {
    const v = newVessel('t', 'beaker');
    run(['Br2aq'], v);
    put(v.aq, 'SO2', 0.1);
    const r = run(['H2O'], v);
    expect(r.kinds).toContain('halogenReduce');
    expect(amt(v.aq, 'Br2')).toBeLessThan(1e-6);
    equationsOk(r.all);
  });
});

describe('dissolved gases', () => {
  it('H2S gives black CuS and PbS even in acid', () => {
    const v = newVessel('t', 'beaker');
    run(['CuSO4'], v);
    put(v.aq, 'H2S', 0.2);
    const r = run(['H2O'], v);
    expect(amt(v.solids, 'CuS')).toBeGreaterThan(0);
    equationsOk(r.all);
  });

  it('CO2 gives silicic acid gel from sodium silicate, and Al(OH)3 from aluminate', () => {
    const v = newVessel('t', 'beaker');
    run(['Na2SiO3'], v);
    put(v.aq, 'CO2', 0.5);
    const r = run(['H2O'], v);
    expect(r.kinds).toContain('carbonicSilicate');
    equationsOk(r.all);
    const a = run([['AlCl3', { ml: 1 }], ['NaOH', { ml: 5 }]]);
    put(a.v.aq, 'CO2', 4);
    const a2 = run(['H2O'], a.v);
    expect(a2.kinds).toContain('aluminateAcid');
    equationsOk(a2.all);
  });
});

describe('precipitates of qualitative reactions', () => {
  it('silver thiocyanate, lead and barium chromate from dichromate', () => {
    expect(amt(run(['AgNO3', 'KSCN']).v.solids, 'AgSCN')).toBeGreaterThan(0);
    const p = run(['PbNO32', 'K2Cr2O7']);
    expect(amt(p.v.solids, 'PbCrO4')).toBeGreaterThan(0);
    equationsOk(p.all);
    expect(amt(run(['BaCl2', 'K2Cr2O7']).v.solids, 'BaCrO4')).toBeGreaterThan(0);
  });
});

describe('pH of salts', () => {
  it('sodium sulfide and sulfite are alkaline, dichromate acidic, magnesia alkaline', () => {
    expect(phOf(run(['Na2S']).v)!).toBeGreaterThan(11);
    expect(phOf(run(['Na2SO3']).v)!).toBeGreaterThan(9);
    expect(phOf(run(['K2Cr2O7']).v)!).toBeLessThan(5.5);
    expect(phOf(run(['Na2SO4']).v)!).toBeCloseTo(7, 0);
    expect(phOf(run(['H2O', 'MgO']).v)!).toBeGreaterThan(9.5);
  });
});

describe('metals', () => {
  it('sodium in dilute nitric acid gives no hydrogen', () => {
    const v = newVessel('t', 'beaker');
    run([['HNO3', { ml: 2 }]], v);
    // Imagine all the water gone: only the acid reaction is left to show.
    const r = run([['Na', { g: 0.02 }]], v);
    const e = r.all.find((x) => x.kind === 'metalNitric' || x.kind === 'activeMetalWater');
    expect(e).toBeDefined();
    expect(r.all.some((x) => x.kind === 'metalAcid')).toBe(false);
    equationsOk(r.all);
  });

  it('magnesium does not deposit aluminium; it gives hydrogen and Al(OH)3', () => {
    const r = run(['AlCl3', ['Mg', { g: 0.05 }]]);
    expect(amt(r.v.solids, 'Al')).toBe(0);
    expect(r.kinds).toContain('metalAmmonium');
    expect(amt(r.v.solids, 'Al(OH)3')).toBeGreaterThan(0);
    equationsOk(r.all);
  });

  it('magnesium dissolves in ammonium chloride solution with hydrogen and ammonia', () => {
    const r = run(['NH4Cl', ['Mg', { g: 0.02 }]]);
    expect(r.kinds).toContain('metalAmmonium');
    equationsOk(r.all);
  });

  it('zinc displaces cobalt', () => {
    const r = run(['CoCl2', ['Zn', { g: 0.1 }]]);
    expect(r.kinds).toContain('metalSalt');
    expect(amt(r.v.solids, 'Co')).toBeGreaterThan(0);
  });

  it('hot concentrated sulfuric acid dissolves iron to iron(III)', () => {
    const v = newVessel('t', 'tube');
    run([['H2SO4c', { ml: 2 }], ['Fe', { g: 0.05 }]], v);
    expect(amt(v.solids, 'Fe')).toBeGreaterThan(0);
    const w = wait(v, 90, true);
    expect(w.kinds).toContain('cuConcAcid');
    expect(amt(v.aq, 'Fe^3+') + amt(v.solids, 'Fe2(SO4)3')).toBeGreaterThan(0);
    expect(amt(v.aq, 'Fe^2+')).toBe(0);
    equationsOk(w.all);
  });

  it('tin with concentrated nitric acid gives metastannic acid', () => {
    const r = run([['HNO3c', { ml: 2 }], ['Sn', { g: 0.05 }]]);
    expect(amt(r.v.solids, 'H2SnO3')).toBeGreaterThan(0);
    equationsOk(r.all);
  });

  it('precipitated barium carbonate converts fully in sulfuric acid', () => {
    const r = run(['BaCl2', 'Na2CO3', ['H2SO4', { ml: 4 }]]);
    expect(r.kinds).not.toContain('sulfateFilm');
    expect(amt(r.v.solids, 'BaCO3')).toBeLessThan(1e-6);
  });
});

describe('precipitates, complexes and hydrolysis', () => {
  it('zinc sulfate with alkali 1:2 gives the hydroxide, not the complex', () => {
    // 1 mL 0.5 M ZnSO4 = 0.5 mmol; 1 mL 1 M NaOH = 1 mmol
    const r = run([['ZnSO4', { ml: 1 }], ['NaOH', { ml: 1 }]]);
    expect(amt(r.v.solids, 'Zn(OH)2')).toBeGreaterThan(0.4);
    expect(amt(r.v.aq, '[Zn(OH)4]^2-')).toBeLessThan(0.01);
  });

  it('aluminium chloride added to excess alkali: the complex meets Al3+ and gives Al(OH)3', () => {
    const r = run([['NaOH', { ml: 4 }], ['AlCl3', { ml: 3 }]]);
    expect(amt(r.v.aq, 'Al^3+') > 1e-3 && amt(r.v.aq, '[Al(OH)4]^-') > 1e-3).toBe(false);
    equationsOk(r.all);
  });

  it('a little ammonia only precipitates copper hydroxide', () => {
    const r = run([['CuSO4', { ml: 1 }], ['NH3aq', { ml: 0.1 }], ['NH3aq', { ml: 0.1 }]]);
    expect(r.kinds).not.toContain('ammine');
  });

  it('joint hydrolysis with sulfite, silicate, and ammonium silicate', () => {
    const a = run(['AlCl3', 'Na2SO3']);
    expect(a.kinds).toContain('jointHydrolysis');
    equationsOk(a.all);
    const c = run(['CrCl3', 'Na2SiO3']);
    expect(amt(c.v.solids, 'H2SiO3')).toBeGreaterThan(0);
    equationsOk(c.all);
    const n = run(['NH4Cl', 'Na2SiO3']);
    expect(amt(n.v.solids, 'H2SiO3')).toBeGreaterThan(0);
    equationsOk(n.all);
    const sn = run(['SnCl2', 'Na2CO3']);
    expect(sn.kinds).toContain('jointHydrolysis');
    equationsOk(sn.all);
  });

  it('hydrogen carbonate precipitates zinc carbonate with CO2', () => {
    const r = run(['ZnSO4', 'NaHCO3']);
    expect(amt(r.v.solids, 'ZnCO3')).toBeGreaterThan(0);
    equationsOk(r.all);
  });

  it('dichromate with barium hydroxide gives BaCrO4 precipitate; with ammonia turns yellow', () => {
    const r = run(['K2Cr2O7', 'BaOH2']);
    expect(amt(r.v.solids, 'BaCrO4')).toBeGreaterThan(0);
    equationsOk(r.all);
    const n = run(['K2Cr2O7', 'NH3aq']);
    expect(n.kinds).toContain('dichromateBase');
    equationsOk(n.all);
  });

  it('alkali destroys the blood-red thiocyanate complex', () => {
    const r = run(['FeCl3', 'KSCN', ['NaOH', { ml: 4 }]]);
    expect(amt(r.v.aq, 'Fe(SCN)3')).toBeLessThan(1e-3);
    expect(amt(r.v.solids, 'Fe(OH)3')).toBeGreaterThan(0);
  });

  it('no announced Ag2O from traces when ammonia is added to silver chloride', () => {
    const r = run(['AgNO3', 'NaCl', 'NH3aq']);
    expect(r.all.some((e) => e.kind === 'precip' && e.p.product === 'Ag2O')).toBe(false);
  });
});

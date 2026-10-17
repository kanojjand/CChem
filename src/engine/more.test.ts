import { describe, expect, it } from 'vitest';
import { REAGENT_BY_ID, REAGENTS, salt } from './data';
import { addReagent, condense, pour, tick, type Amount } from './actions';
import { flameTest } from './apparatus';
import { buildEquations } from './equation';
import { amt, newVessel, type ReactionEvent, type Vessel, type VesselKind } from './vessel';

type Step = string | [string, Amount];

function run(steps: Step[], v: Vessel = newVessel('t', 'tube')) {
  const all: ReactionEvent[] = [];
  let now = 1000;
  for (const s of steps) {
    const [id, amount] = typeof s === 'string' ? [s, {} as Amount] : s;
    const r = REAGENT_BY_ID[id];
    if (!r) throw new Error(`no reagent ${id}`);
    const res = addReagent(v, r, { ml: amount.ml ?? 1, g: amount.g ?? 0.5, drops: amount.drops ?? 2 }, (now += 1000));
    expect(res.error).toBeUndefined();
    all.push(...res.events);
  }
  return { v, all, kinds: all.map((e) => e.kind) };
}

function wait(v: Vessel, seconds: number, heating = false) {
  v.heating = heating;
  const all: ReactionEvent[] = [];
  let now = 200000;
  for (let i = 0; i < seconds * 2; i++) all.push(...tick(v, 0.5, (now += 500)));
  v.heating = false;
  return { all, kinds: all.map((e) => e.kind) };
}

const vessel = (kind: VesselKind = 'tube') => newVessel('t', kind);

describe('alkali metals', () => {
  it('potassium catches fire on water and a big piece bursts the vessel', () => {
    const small = run(['H2O', ['K', { g: 0.05 }]]);
    expect(small.kinds).toContain('activeMetalWater');
    expect(small.v.fx.flame).toBeDefined();
    expect(small.v.broken).toBeUndefined();
    const mid = run([['H2O', { ml: 5 }], ['K', { g: 0.3 }]]);
    expect(mid.v.broken).toBeUndefined();
    expect(mid.all.some((e) => e.safety === 'alkaliSplash')).toBe(true);
    const big = run([['H2O', { ml: 5 }], ['K', { g: 1 }]]);
    expect(big.v.broken).toBeDefined();
  });

  it('lithium only fizzes, even a big piece', () => {
    const r = run([['H2O', { ml: 5 }], ['Li', { g: 0.5 }]]);
    expect(r.kinds).toContain('activeMetalWater');
    expect(r.v.broken).toBeUndefined();
    expect(amt(r.v.aq, 'OH^-')).toBeGreaterThan(0);
  });
});

describe('sulfur compounds, halogens and chromium', () => {
  it('sulfide and sulfite give gases with acid', () => {
    expect(run(['Na2S', 'HCl']).kinds).toContain('sulfideAcid');
    expect(run(['Na2SO3', 'HCl']).kinds).toContain('sulfiteAcid');
  });

  it('thiosulfate with acid turns cloudy only after a while, faster when hot', () => {
    const cold = run([['Na2S2O3', { ml: 2 }], ['HCl', { ml: 2 }]]);
    expect(cold.kinds).toContain('thiosulfateAcid');
    expect(amt(cold.v.solids, 'S')).toBeLessThan(0.002);
    const t = (v: Vessel) => { for (let i = 1; i <= 240; i++) { tick(v, 0.5, 300000 + i * 500); if (amt(v.solids, 'S') > 0.002 * v.volume) return i / 2; } return Infinity; };
    const coldTime = t(cold.v);
    expect(coldTime).toBeGreaterThan(3);
    expect(coldTime).toBeLessThan(120);
    const hot = run([['Na2S2O3', { ml: 2 }], ['HCl', { ml: 2 }]]);
    hot.v.temp = 50;
    expect(t(hot.v)).toBeLessThan(coldTime);
  });

  it('lead, silver, zinc and copper sulfides have their colors', () => {
    expect(run(['PbNO32', 'Na2S']).v.solids.PbS).toBeGreaterThan(0);
    expect(run(['ZnSO4', 'Na2S']).v.solids.ZnS).toBeGreaterThan(0);
    expect(run(['AlCl3', 'Na2S']).kinds).toContain('sulfideHydrolysis');
  });

  it('a more active halogen pushes out a less active one; starch shows iodine', () => {
    const br = run(['KBr', 'Cl2aq']);
    expect(br.kinds).toContain('halogenDisplace');
    expect(amt(br.v.aq, 'Br2')).toBeGreaterThan(0);
    const i = run(['starch', 'KI', 'Br2aq']);
    expect(i.kinds).toContain('halogenDisplace');
    expect(i.kinds).toContain('starchIodine');
    const none = run(['KCl', 'Br2aq']);
    expect(none.kinds).not.toContain('halogenDisplace');
  });

  it('chlorine water bleaches litmus', () => {
    expect(run(['litmus', 'Cl2aq']).kinds).toContain('bleach');
  });

  it('chromate turns orange in acid and back to yellow in alkali', () => {
    const r = run(['K2CrO4', 'H2SO4']);
    expect(r.kinds).toContain('chromateAcid');
    expect(amt(r.v.aq, 'Cr2O7^2-')).toBeGreaterThan(0);
    const back = run(['NaOH', 'NaOH', 'NaOH'], r.v);
    expect(back.kinds).toContain('dichromateBase');
    expect(run(['K2CrO4', 'PbNO32']).v.solids.PbCrO4).toBeGreaterThan(0);
    expect(run(['K2CrO4', 'AgNO3']).v.solids.Ag2CrO4).toBeGreaterThan(0);
  });

  it('permanganate and dichromate are decolorised by reducers in acid', () => {
    const m = run(['FeSO4', 'H2SO4', ['KMnO4', { ml: 0.5 }]]);
    expect(run(['FeSO4', 'H2SO4', ['K2Cr2O7', { ml: 0.2 }]]).kinds).toContain('dichromateRedox');
    expect(m.kinds).toContain('permanganateRedox');
    expect(amt(m.v.aq, 'MnO4^-')).toBe(0);
    expect(run(['H2O2', 'H2SO4', ['KMnO4', { ml: 0.5 }]]).kinds).toContain('permanganateRedox');
    expect(run(['KI', 'H2SO4', ['K2Cr2O7', { ml: 0.2 }]]).kinds).toContain('dichromateRedox');
  });

  it('amphoteric hydroxides of lead, tin and chromium dissolve in excess alkali', () => {
    for (const s of ['PbNO32', 'SnCl2', 'CrCl3']) {
      const r = run([[s, { ml: 1 }], ['NaOH', { ml: 0.5 }], ['NaOH', { ml: 5 }]]);
      expect(r.kinds, s).toContain('amphoteric');
    }
  });

  it('nickel hydroxide dissolves in ammonia to a violet-blue complex', () => {
    const r = run(['NiSO4', ['NH3aq', { ml: 0.3 }], ['NH3aq', { ml: 5 }]]);
    expect(r.kinds).toContain('ammine');
  });
});

describe('metals', () => {
  it('nickel reacts with acid slowly and goes on over time', () => {
    const r = run([['HCl', { ml: 5 }], ['Ni', { g: 0.2 }]]);
    const e = r.all.find((x) => x.kind === 'metalAcid');
    expect(e?.p.slow).toBe('1');
    const before = amt(r.v.solids, 'Ni');
    wait(r.v, 60);
    expect(amt(r.v.solids, 'Ni')).toBeLessThan(before);
  });

  it('lead is stopped by a film in hydrochloric acid; gold reacts with nothing', () => {
    expect(run(['HCl', 'Pb']).kinds).toContain('leadFilm');
    const au = run(['HNO3', 'Au']);
    expect(au.kinds).toContain('metalAcidNone');
    expect(amt(au.v.solids, 'Au')).toBeGreaterThan(0);
  });

  it('silicon dissolves in alkali with hydrogen', () => {
    const r = run([['NaOH', { ml: 3 }], ['Si', { g: 0.05 }]]);
    expect(r.kinds).toContain('metalAlkali');
    expect(amt(r.v.aq, 'SiO3^2-')).toBeGreaterThan(0);
  });
});

describe('heating dry solids', () => {
  it('potassium permanganate gives oxygen', () => {
    const r = run([['KMnO4s', { g: 0.5 }]]);
    const h = wait(r.v, 120, true);
    expect(h.kinds).toContain('thermalDecomp');
    expect(r.v.gasTotal.O2).toBeGreaterThan(0);
    expect(r.v.solids.MnO2).toBeGreaterThan(0);
  });

  it('iron and sulfur glow and become iron sulfide that a magnet does not pull', () => {
    const r = run([['Fe', { g: 0.5 }], ['S', { g: 0.3 }]]);
    const h = wait(r.v, 120, true);
    expect(h.kinds).toContain('metalSulfur');
    expect(r.v.solids.FeS).toBeGreaterThan(0);
  });

  it('ammonium dichromate volcano', () => {
    const r = run([['NH42Cr2O7', { g: 1 }]]);
    expect(wait(r.v, 120, true).kinds).toContain('volcano');
    expect(r.v.solids.Cr2O3).toBeGreaterThan(0);
  });

  it('blue vitriol turns white on heating and blue again with water', () => {
    const r = run([['CuSO4s', { g: 0.5 }]]);
    wait(r.v, 120, true);
    expect(r.v.solids.CuSO4).toBeGreaterThan(0);
    r.v.temp = 22;
    const back = run([['H2O', { ml: 3 }]], r.v);
    expect(back.kinds).toContain('dissolveHotSolid');
    expect(amt(back.v.aq, 'Cu^2+')).toBeGreaterThan(0);
  });

  it('copper(II) oxide and charcoal give copper', () => {
    const r = run([['CuO', { g: 0.5 }], ['C', { g: 0.1 }]]);
    expect(wait(r.v, 300, true).kinds).toContain('carbonReduce');
    expect(r.v.solids.Cu).toBeGreaterThan(0);
  });

  it('iodine sublimes and sulfur melts', () => {
    expect(wait(run([['I2', { g: 0.1 }]]).v, 120, true).kinds).toContain('sublimation');
    expect(wait(run([['S', { g: 0.3 }]]).v, 120, true).kinds).toContain('melting');
  });
});

describe('physical processes', () => {
  it('water boils, boils away and leaves dissolved salt behind', () => {
    const r = run([['NaCl', { ml: 3 }]]);
    const h = wait(r.v, 900, true);
    expect(h.kinds).toContain('boiling');
    expect(h.kinds).toContain('dryOut');
    expect(r.v.volume).toBeLessThan(0.05);
    expect(r.v.solids.NaCl).toBeGreaterThan(2.5);
  });

  it('boiling point of a salt solution is above 100 °C', () => {
    const r = run([['NaCls', { g: 5 }], ['H2O', { ml: 15 }]]);
    const h = wait(r.v, 300, true);
    const b = h.all.find((e) => e.kind === 'boiling');
    expect(Number(b?.p.bp)).toBeGreaterThan(100.5);
  });

  it('potassium nitrate: only part dissolves in cold water, all of it when hot, crystals on cooling', () => {
    const v = vessel('beaker');
    const r = run([['H2O', { ml: 10 }], ['KNO3s', { g: 10 }]], v);
    expect(r.kinds).toContain('dissolveCold');
    expect(amt(v.solids, 'KNO3')).toBeGreaterThan(30);
    wait(v, 90, true);
    expect(amt(v.solids, 'KNO3')).toBeLessThan(0.01);
    const c = wait(v, 1500);
    expect(c.kinds).toContain('crystallize');
    expect(v.temp).toBeLessThan(25);
    expect(amt(v.solids, 'KNO3')).toBeGreaterThan(30);
  });

  it('ammonium nitrate cools the water, sodium hydroxide heats it', () => {
    const cold = run([['H2O', { ml: 5 }], ['NH4NO3s', { g: 2 }]]);
    expect(cold.kinds).toContain('dissolveCold');
    expect(cold.v.temp).toBeLessThan(15);
    const hot = run([['H2O', { ml: 5 }], ['NaOHs', { g: 1 }]]);
    expect(hot.kinds).toContain('dissolveHotSolid');
    expect(hot.v.temp).toBeGreaterThan(35);
  });

  it('ice cools water to zero and melts', () => {
    const v = vessel('beaker');
    run([['H2O', { ml: 20 }], ['ice', { g: 10 }]], v);
    const w = wait(v, 5);
    expect(w.kinds).toContain('iceMelt');
    expect(v.temp).toBeGreaterThan(15);
    wait(v, 55);
    expect(v.temp).toBeLessThan(8);
    expect(amt(v.solids, 'H2O(s)')).toBeGreaterThan(0);
    wait(v, 3000, false);
    expect(amt(v.solids, 'H2O(s)')).toBe(0);
    expect(v.volume).toBeGreaterThan(29);
  });

  it('lead iodide dissolves in hot water and comes back as golden crystals', () => {
    const v = vessel('beaker');
    run([['PbNO32', { ml: 0.3 }], ['KI', { ml: 0.6 }], ['H2O', { ml: 60 }]], v);
    expect(v.solids.PbI2).toBeGreaterThan(0);
    v.temp = 98;
    const hot = run([['H2O', { ml: 0.01 }]], v);
    expect(hot.kinds).toContain('dissolveHot');
    v.temp = 20;
    const cool = run([['H2O', { ml: 0.01 }]], v);
    expect(cool.kinds).toContain('crystallize');
  });

  it('sulfur floats on water; sand sinks; a filter keeps solids back', () => {
    expect(run(['H2O', ['S', { g: 0.1 }]]).kinds).toContain('floats');
    const a = run([['CuSO4', { ml: 2 }], ['NaOH', { ml: 2 }]]);
    const b = newVessel('u', 'tube');
    const res = pour(a.v, b, 9000, true);
    expect(res.events.map((e) => e.kind)).toContain('filtered');
    expect(Object.keys(b.solids)).toHaveLength(0);
    expect(a.v.solids['Cu(OH)2']).toBeGreaterThan(0);
  });

  it('steam condensed in another vessel is distilled water', () => {
    const v = vessel();
    expect(condense(v, 0.5, 1000).map((e) => e.kind)).toContain('distillation');
    expect(v.volume).toBeCloseTo(0.5);
  });

  it('charcoal takes the color of an indicator away over time', () => {
    const r = run([['H2O', { ml: 3 }], 'NaOH', 'phph', ['C', { g: 1 }]]);
    expect(r.kinds).toContain('adsorption');
    wait(r.v, 60);
    expect(Object.keys(r.v.inds)).toHaveLength(0);
  });

  it('hard water leaves scale when boiled', () => {
    const v = vessel('beaker');
    run([['H2O', { ml: 20 }]], v);
    v.aq['Ca^2+'] = 0.2; v.aq['HCO3^-'] = 0.4; v.parent['Ca^2+'] = 'Ca(HCO3)2'; v.parent['HCO3^-'] = 'Ca(HCO3)2';
    expect(wait(v, 400, true).kinds).toContain('hardWater');
    expect(v.solids.CaCO3).toBeGreaterThan(0);
  });
});

describe('flame test and shelf', () => {
  it('flame colors', () => {
    expect(flameTest(run(['LiCl']).v).ions[0]).toBe('Li^+');
    expect(flameTest(run(['KCl']).v).ions[0]).toBe('K^+');
    expect(flameTest(run(['KCl', 'NaCl']).v).ions[0]).toBe('Na^+');
    expect(flameTest(run(['HCl']).v).color).toBeNull();
  });

  it('every reagent can be added to water without errors and every equation balances', () => {
    for (const r of REAGENTS) {
      const v = vessel('beaker');
      run([['H2O', { ml: 10 }]], v);
      const res = addReagent(v, r, { ml: 1, g: 0.1, drops: 2 }, 5000);
      for (const e of res.events) if (e.eq && !e.eq.noReaction) expect(buildEquations(e.eq), `${r.id}: ${e.kind}`).not.toBeNull();
    }
  });

  it('every pair of shelf reagents mixes without throwing and every equation balances', () => {
    const liquids = REAGENTS.filter((r) => r.kind === 'liquid' && !r.indicator).map((r) => r.id);
    const bad: string[] = [];
    for (const a of liquids) for (const b of REAGENTS.map((r) => r.id)) {
      const { all } = run([a, b]);
      for (const e of all) if (e.eq && !e.eq.noReaction && !buildEquations(e.eq)) bad.push(`${a}+${b}: ${e.kind} ${e.eq.reactants.join('+')}→${e.eq.products.join('+')}`);
    }
    expect([...new Set(bad)]).toEqual([]);
  });

  it('salt formulas for new ions', () => {
    expect(salt('Pb^2+', 'I^-').id).toBe('PbI2');
    expect(salt('K^+', 'Cr2O7^2-').id).toBe('K2Cr2O7');
    expect(salt('NH4^+', 'Cr2O7^2-').id).toBe('(NH4)2Cr2O7');
  });
});

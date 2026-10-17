// Physical processes: heating by the lamp and cooling in air, ice melting, boiling and
// evaporation, crystals coming out of a solution, dissolving with heat or cold, melting,
// sublimation, dissolved gases leaving a hot solution, and the dry residue left after boiling.

import {
  HYDRATES, IONS, METALS, SOLUBLE_SOLIDS, compound, hasCompound, salt, solidSolubility, solubility,
  type SolubleSolid
} from './data';
import { molarMass } from './formula';
import {
  EPS, ROOM_T, addGas, amt, put, putIon, release, take, waterVolume,
  type ReactionEvent, type Vessel, type VesselKind
} from './vessel';
import { counterIon, ev, once, type Rule } from './ruleKit';

// ---------------------------------------------------------------- heat

/** Heat that reaches the contents, W: a spirit lamp under a test tube, a hot plate under larger glassware. */
export const POWER: Record<VesselKind, number> = { tube: 50, beaker: 200, beaker250: 300, flask: 300 };
/** Heat lost to the air per degree above room temperature, W/K. */
const LOSS: Record<VesselKind, number> = { tube: 0.15, beaker: 0.6, beaker250: 1.0, flask: 0.9 };
/** Heat capacity of the glass itself, J/K. */
const GLASS: Record<VesselKind, number> = { tube: 8, beaker: 40, beaker250: 80, flask: 80 };
/** Heat flow from the liquid into floating ice per degree, W/K. */
const ICE_CONTACT: Record<VesselKind, number> = { tube: 1, beaker: 4, beaker250: 6, flask: 6 };

/** Hottest a dry vessel gets over the flame, °C: glass softens above about 600 °C. */
export const MAX_T = 600;
/**
 * A spirit-lamp flame is about 900 °C. With nothing inside to boil, the glass and a dry solid
 * in it heat far above 100 °C (500–600 °C at the bottom of a test tube), so a dry vessel over
 * the flame loses less heat per degree than one cooled by evaporating liquid.
 */
const DRY_LOSS = 0.58;
/** Below this much water (mL) a solution has boiled dry: the hydrate water left is part of the crystals. */
const DRY_ML = 0.05;
const ICE = 'H2O(s)';
const ICE_G_PER_MMOL = 0.018;
const FUSION = 334;        // J/g to melt ice
const VAPOUR = 2260;       // J/g to boil water away

function massOf(id: string, mmol: number): number {
  try { return (molarMass(id) * mmol) / 1000; } catch { return mmol * 0.1; }
}

export function heatCapacity(v: Vessel): number {
  let solids = 0;
  for (const id in v.solids) if (id !== ICE) solids += massOf(id, v.solids[id]);
  return 4.18 * waterVolume(v) + 2.6 * v.concVol + 0.8 * solids + 2.1 * amt(v.solids, ICE) * ICE_G_PER_MMOL + GLASS[v.kind];
}

/** Boiling point of the liquid: dissolved particles raise it a little (0.51 °C per mol/kg). */
export function boilingPoint(v: Vessel): number {
  const water = waterVolume(v);
  if (water <= 0.01) return 100;
  let particles = 0;
  for (const id in v.aq) {
    if (id === 'H2SO4c') continue;
    particles += v.aq[id];
  }
  return 100 + 0.51 * Math.min(12, particles / water);
}

/** Melting points of solids that melt in a test tube over a spirit lamp, °C. */
export const MELTS: Record<string, number> = {
  S: 113, K: 63, Na: 98, Li: 181, Sn: 232, Pb: 327, NaOH: 318, KNO3: 334, NH4NO3: 170, 'C12H22O11': 186
};

// ---------------------------------------------------------------- dissolving and crystals

/** Data for a soluble solid: listed ones, or a generic soluble salt from the solubility table. */
export function solubleInfo(id: string): SolubleSolid | null {
  const known = SOLUBLE_SOLIDS[id];
  if (known) return known;
  if (!hasCompound(id)) return null;
  const def = compound(id);
  if (!def.cation || !def.anion || def.cation === 'H^+' || def.phase === 's') return null;
  if (solubility(def.cation, def.anion).s !== 'R') return null;
  return { ions: { [def.cation]: def.nCat || 1, [def.anion]: def.nAn || 1 }, S: 3 };
}

function dissolvedUnits(v: Vessel, info: SolubleSolid): number {
  let units = Infinity;
  for (const ion in info.ions) units = Math.min(units, amt(v.aq, ion) / info.ions[ion]);
  return Number.isFinite(units) ? units : 0;
}

/** Parent compound of the ions a solid gives: a hydrate gives the same ions as the plain salt. */
const plainSalt = (id: string) => id.split('·')[0];

export const dissolveSolid: Rule = (v, ctx) => {
  const water = waterVolume(v);
  if (water <= 0.05) return null;
  for (const s of Object.keys(v.solids)) {
    const n = amt(v.solids, s);
    if (n <= EPS) continue;
    const info = solubleInfo(s);
    if (!info) continue;
    const startT = v.temp;
    let total = 0;
    // Dissolving warms or cools the water, which changes how much more can dissolve:
    // dissolve in shrinking portions so the solution ends up just saturated.
    for (let i = 0; i < 16; i++) {
      const room = solidSolubility(info, v.temp) * waterVolume(v) - dissolvedUnits(v, info);
      const left = amt(v.solids, s);
      const e = info.heat ? Math.min(left, room * 0.5) : Math.min(left, room);
      if (e <= 1e-6) break;
      take(v.solids, s, e);
      for (const ion in info.ions) putIon(v, ion, info.ions[ion] * e, plainSalt(s));
      if (info.water) v.volume += e * info.water * ICE_G_PER_MMOL;
      if (info.heat) release(v, info.heat * e);
      total += e;
      if (amt(v.solids, s) <= EPS) break;
    }
    if (total <= 1e-6) continue;
    const dT = v.temp - startT;
    v.fx.dissolveAt = ctx.now;
    const left = amt(v.solids, s) > EPS;
    // Once all of it has dissolved, crystals coming out again are news.
    if (!left) v.seen = v.seen.filter((k) => k !== `crystals:${s}`);
    const kind = dT < -1.5 ? 'dissolveCold' : dT > 3 ? 'dissolveHotSolid' : 'dissolve';
    return ev({
      kind, importance: kind === 'dissolve' ? 1 : 2, type: 'physical', p: { solid: s, saturated: left ? '1' : '' },
      signs: Math.abs(dT) > 1.5 ? ['dissolve', 'heat'] : ['dissolve'], dT, key: `dissolve:${s}`
    });
  }
  const sugar = amt(v.solids, 'C12H22O11');
  if (sugar > EPS && amt(v.aq, 'H2SO4c') <= EPS) {
    take(v.solids, 'C12H22O11', sugar);
    put(v.aq, 'C12H22O11', sugar);
    v.fx.dissolveAt = ctx.now;
    return ev({ kind: 'dissolve', importance: 1, type: 'physical', p: { solid: 'C12H22O11' }, signs: ['dissolve'], key: 'dissolve:sugar' });
  }
  return null;
};

/** Crystals come out when a solution holds more salt than it can: after evaporation or cooling. */
const crystallize: Rule = (v, ctx) => {
  const water = waterVolume(v);
  if (water <= 0.02 || !once(ctx, 'crystallize')) return null;
  type Cand = { formula: string; solid: string; info: SolubleSolid; excess: number };
  let best: Cand | null = null;
  for (const c of Object.keys(v.aq)) {
    const ci = IONS[c];
    if (!ci || ci.charge <= 0 || c === 'H^+' || c.startsWith('[')) continue;
    for (const a of Object.keys(v.aq)) {
      const ai = IONS[a];
      if (!ai || ai.charge >= 0 || a.startsWith('[') || solubility(c, a).s !== 'R') continue;
      const formula = salt(c, a).id;
      const solid = HYDRATES[formula] ?? formula;
      const info = SOLUBLE_SOLIDS[solid] ?? SOLUBLE_SOLIDS[formula] ?? solubleInfo(formula);
      if (!info) continue;
      const excess = dissolvedUnits(v, info) - solidSolubility(info, v.temp) * water * 1.02;
      if (excess > 1e-4 && (!best || excess > best.excess)) best = { formula, solid, info, excess };
    }
  }
  if (!best) return null;
  const e = best.excess;
  const had = amt(v.solids, best.solid) > EPS;
  for (const ion in best.info.ions) take(v.aq, ion, best.info.ions[ion] * e);
  if (best.info.water) v.volume = Math.max(0, v.volume - e * best.info.water * ICE_G_PER_MMOL);
  put(v.solids, best.solid, e);
  // Crystals give back the heat that dissolving took (or take back what it gave).
  if (best.info.heat) release(v, -best.info.heat * e);
  // Crystals that already lie on the bottom just grow: nothing new to tell.
  if (had) return ev({ kind: 'minor', importance: 0, type: 'physical' });
  v.fx.precipAt = ctx.now;
  return ev({
    kind: 'crystallize', importance: 2, type: 'physical', p: { solid: best.solid, cause: v.boiling || v.heating ? 'evap' : 'cool' },
    signs: ['precip'], key: `crystals:${best.solid}`
  });
};

/** Iodine hardly dissolves in water (about 0.3 g/L) but dissolves well when iodide is present. */
const I2_S = 0.0012;

const iodineSolubility: Rule = (v, ctx) => {
  const water = waterVolume(v);
  if (water <= 0.05 || !once(ctx, 'iodine')) return null;
  const solid = amt(v.solids, 'I2');
  const dissolved = amt(v.aq, 'I2');
  const withIodide = amt(v.aq, 'I^-') > 2 * dissolved;
  const cap = withIodide ? Infinity : I2_S * water * (1 + Math.max(0, v.temp - 20) / 30);
  if (solid > EPS && dissolved < cap) {
    const e = Math.min(solid, cap - dissolved);
    if (e <= 1e-7) return null;
    take(v.solids, 'I2', e);
    put(v.aq, 'I2', e);
    return ev({ kind: 'dissolve', importance: 1, type: 'physical', p: { solid: 'I2', slight: withIodide ? '' : '1' }, signs: ['dissolve', 'color'], key: withIodide ? 'dissolve:I2-KI' : 'dissolve:I2' });
  }
  if (!withIodide && dissolved > cap * 1.05 + 1e-5) {
    const e = dissolved - cap;
    take(v.aq, 'I2', e);
    put(v.solids, 'I2', e);
    v.fx.precipAt = ctx.now;
    return ev({ kind: 'crystallize', importance: 1, type: 'physical', p: { solid: 'I2', cause: 'iodine' }, signs: ['precip'], key: 'crystals:I2' });
  }
  return null;
};

/** Gases dissolved in water leave when it gets hot. */
const VOLATILE: Record<string, number> = { Cl2: 40, Br2: 50, H2S: 45, SO2: 50 };

const gasOut: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  if (dt <= 0 || !once(ctx, 'gas-out')) return null;
  const alkaline = amt(v.aq, 'OH^-') > EPS;
  for (const gas in VOLATILE) {
    const n = amt(v.aq, gas);
    if (n <= EPS || v.temp < VOLATILE[gas]) continue;
    // In alkali halogens, H2S and SO2 are bound as salts: nothing boils out.
    if (alkaline) continue;
    const e = n < 1e-4 ? n : n * (1 - Math.exp(-0.15 * dt));
    take(v.aq, gas, e);
    addGas(v, gas, e, ctx.now);
    v.fx.smellAt = ctx.now;
    return ev({ kind: 'gasOut', importance: 2, type: 'physical', p: { gas }, signs: ['gas', 'smell'], safety: 'fumeHood', key: `gas-out:${gas}` });
  }
  return null;
};

const melting: Rule = (v, ctx) => {
  for (const s in MELTS) {
    if (amt(v.solids, s) <= EPS || v.temp < MELTS[s]) continue;
    const key = `melt:${s}`;
    if (v.seen.includes(key) || !once(ctx, key)) continue;
    return ev({ kind: 'melting', importance: 2, type: 'physical', p: { solid: s, mp: String(MELTS[s]) }, signs: [], key });
  }
  return null;
};

/** Dry iodine turns straight into violet vapour on heating. */
const sublimation: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  const n = amt(v.solids, 'I2');
  if (dt <= 0 || n <= EPS || waterVolume(v) > 0.05 || v.temp < 90 || !once(ctx, 'sublime')) return null;
  const e = n < 1e-3 ? n : n * (1 - Math.exp(-0.12 * dt));
  take(v.solids, 'I2', e);
  addGas(v, 'I2', e, ctx.now);
  v.fx.vaporAt = ctx.now;
  return ev({ kind: 'sublimation', importance: 2, type: 'physical', p: { solid: 'I2' }, signs: ['color'], key: 'sublimation:I2' });
};

export const PHYSICAL_RULES: Rule[] = [crystallize, iodineSolubility, gasOut, melting, sublimation];

// ---------------------------------------------------------------- what is left after boiling dry

/** Water is gone: dissolved substances stay behind as a dry residue; volatile ones leave. */
export function dryOut(v: Vessel, now: number): string | null {
  const aq = v.aq;
  v.aq = {};
  // Volatile molecules escape; hydrogen peroxide falls apart.
  for (const gas of ['NH3', 'Cl2', 'Br2', 'H2S', 'SO2']) if (aq[gas] > EPS) addGas(v, gas === 'NH3' ? 'NH3' : gas, aq[gas], now);
  if (aq.H2O2 > EPS) addGas(v, 'O2', aq.H2O2 / 2, now);
  for (const mol of ['C12H22O11', 'I2', 'Fe(SCN)3', 'starch', 'Fe(OH)3']) if (aq[mol] > EPS) put(v.solids, mol, aq[mol]);
  // Dissolved carbon dioxide leaves with the steam.
  if (aq.CO2 > EPS) addGas(v, 'CO2', aq.CO2, now);
  if (aq.H2SO4c > EPS) put(v.aq, 'H2SO4c', aq.H2SO4c);

  const eq: Record<string, number> = {};
  for (const id in aq) if (IONS[id] && aq[id] > EPS) eq[id] = aq[id] * Math.abs(IONS[id].charge);
  const cations = Object.keys(eq).filter((id) => IONS[id].charge > 0 && id !== 'H^+');
  const anions = Object.keys(eq).filter((id) => IONS[id].charge < 0);
  const pair = (c: string, a: string) => {
    const x = Math.min(eq[c] || 0, eq[a] || 0);
    if (x <= EPS) return;
    const def = salt(c, a);
    const units = x / ((def.nCat || 1) * IONS[c].charge);
    eq[c] -= x;
    eq[a] -= x;
    if (def.id === 'H2O') return;
    put(v.solids, HYDRATES[def.id] ?? def.id, units);
  };
  // Each cation first takes the anion it came with, then whatever is left.
  for (const c of cations) {
    const a = counterIon(v.parent[c] || '', c);
    if (a && eq[a]) pair(c, a);
  }
  for (const c of cations) for (const a of anions) pair(c, a);
  // Leftover acid: sulfuric acid stays as a concentrated oily liquid, phosphoric acid as a solid,
  // volatile acids (HCl, HNO3, ...) leave with the steam.
  const h = eq['H^+'] || 0;
  if (h > EPS) {
    const so4 = Math.min(h / 2, (eq['SO4^2-'] || 0) / 2);
    if (so4 > EPS) put(v.aq, 'H2SO4c', so4);
    const po4 = Math.min(h - 2 * so4, eq['PO4^3-'] || 0) / 3;
    if (po4 > EPS) put(v.solids, 'H3PO4', po4);
    v.fx.smellAt = now;
  }
  v.concVol = amt(v.aq, 'H2SO4c') / 18.4;
  v.volume = v.concVol;
  v.parent = {};
  let best: string | null = null;
  for (const id in v.solids) if (id !== ICE && (!best || v.solids[id] > v.solids[best])) best = id;
  return best;
}

// ---------------------------------------------------------------- one step of time

/**
 * Heat flow for `dt` seconds: lamp power in, losses to the air out, ice melting at 0 °C,
 * boiling at the boiling point with water turning into steam, and the dry residue once the
 * water is gone. Steam is logged as gas "H2O" in millilitres of liquid water.
 */
export function heatStep(v: Vessel, dt: number, now: number): ReactionEvent[] {
  const events: ReactionEvent[] = [];
  const wasBoiling = !!v.boiling;
  const C = heatCapacity(v);
  const power = v.heating ? POWER[v.kind] : 0;
  const dryHeated = v.heating && waterVolume(v) <= DRY_ML && v.concVol <= 0.01;
  const loss = LOSS[v.kind] * (dryHeated ? DRY_LOSS : 1);
  let T = v.temp + ((power - loss * (v.temp - ROOM_T)) * dt) / C;

  // Ice keeps the contents at 0 °C until it has melted.
  // Heat reaches the ice through its surface, so a cube melts over minutes, not at once.
  const ice = amt(v.solids, ICE);
  if (ice > EPS && T > 0) {
    const iceG = ice * ICE_G_PER_MMOL;
    const flow = (ICE_CONTACT[v.kind] * T + (v.heating ? POWER[v.kind] : 0)) * dt;
    const meltG = Math.min(iceG, Math.min(T * C, flow) / FUSION);
    T -= (meltG * FUSION) / C;
    take(v.solids, ICE, meltG / ICE_G_PER_MMOL);
    v.volume = Math.min(v.capacity, v.volume + meltG);
    if (meltG > 1e-4 && !v.seen.includes('ice-melt')) {
      events.push(ev({ kind: 'iceMelt', importance: 2, type: 'physical', p: { done: amt(v.solids, ICE) <= EPS ? '1' : '' }, key: 'ice-melt' }));
    }
  }

  // At the boiling point extra heat turns water into steam.
  const water = waterVolume(v);
  const bp = boilingPoint(v);
  v.boiling = false;
  if (water > DRY_ML && T >= bp) {
    const evap = Math.min(water, ((T - bp) * C) / VAPOUR);
    T = bp;
    v.volume = Math.max(v.concVol, v.volume - evap);
    v.boiling = v.heating;
    if (evap > 0) addGas(v, 'H2O', evap, now);
    if (v.boiling && !wasBoiling) {
      events.push(ev({ kind: 'boiling', importance: 1, type: 'physical', p: { bp: bp.toFixed(1) }, signs: ['gas'], key: 'boiling' }));
    }
    if (waterVolume(v) <= DRY_ML) {
      const residue = dryOut(v, now);
      v.boiling = false;
      events.push(ev({ kind: 'dryOut', importance: 2, type: 'physical', p: { residue: residue ?? '' }, signs: residue ? ['deposit'] : [], key: 'dry-out' }));
    }
  } else if (water > DRY_ML && v.heating && T > bp - 15) {
    // Close to boiling the water already evaporates noticeably.
    const evap = Math.min(water, 0.0002 * (T - (bp - 15)) * dt);
    v.volume = Math.max(v.concVol, v.volume - evap);
  }
  // A film of water left in the vessel still boils away: it does not let the solid overheat
  // while ions are dissolved in it. Concentrated sulfuric acid is a liquid of its own: what is
  // dissolved in it stays there.
  if (waterVolume(v) <= DRY_ML && v.concVol <= 0.01 && Object.keys(v.aq).some((id) => id !== 'H2SO4c') && T >= bp) {
    const residue = dryOut(v, now);
    v.boiling = false;
    events.push(ev({ kind: 'dryOut', importance: 2, type: 'physical', p: { residue: residue ?? '' }, signs: residue ? ['deposit'] : [], key: 'dry-out' }));
  }
  const liquid = waterVolume(v) > DRY_ML;
  // Concentrated sulfuric acid boils at about 337 °C.
  const cap = liquid ? bp : v.concVol > 0.01 ? 330 : MAX_T;
  v.temp = Math.max(-25, Math.min(cap, T));
  return events;
}

/** Does this vessel change by itself over time? */
export function needsTick(v: Vessel): boolean {
  if (v.broken) return false;
  if (v.heating || Math.abs(v.temp - ROOM_T) > 0.05) return true;
  const s = (id: string) => amt(v.solids, id) > EPS;
  const a = (id: string) => amt(v.aq, id) > EPS;
  if (s('Fe(OH)2') || s('Mn(OH)2') || s(ICE)) return true;
  if (a('S2O3^2-') && a('H^+')) return true;
  if (a('H2O2') && a('I^-') && !a('H^+')) return true;
  if (s('Al') && a('H^+') && !a('Cl^-')) return true;
  if ((s('Zn') || s('Si')) && a('OH^-')) return true;
  if ((a('H^+') || a('CH3COOH')) && Object.values(METALS).some((m) => m.slow && s(m.id))) return true;
  if (s('C') && v.volume > 0.05 && (a('I2') || a('Br2') || a('Fe(SCN)3') || Object.keys(v.inds).length > 0)) return true;
  return false;
}

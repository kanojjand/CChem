// What the student can do with a vessel: add a reagent, pour one vessel into another,
// heat, wash. After each action the rules settle the contents, and when nothing visible
// happens `explain` says why.

import {
  IONS, METALS, REAGENT_BY_ID, activity, compound, hasCompound, salt, solubility,
  type IndicatorId, type Reagent
} from './data';
import { indicatorColor, type ColorName } from './color';
import { solvePH, medium } from './ph';
import { basicSolid, settle, type Ctx } from './rules';
import {
  EPS, ROOM_T, amt, isEmpty, newVessel, putIon, put, waterVolume,
  type ReactionEvent, type Vessel
} from './vessel';

export type Dose = 0 | 1 | 2;
export const DOSE_ML = [0.05, 1, 5] as const;
export const DOSE_SOLID = [0.3, 1, 4] as const;
export const DOSE_DROPS = [1, 2, 5] as const;

export interface ActionResult {
  events: ReactionEvent[];
  error?: 'full' | 'empty' | 'same';
}

export const phOf = (v: Vessel) => solvePH(v.aq, v.volume);

function indicatorState(v: Vessel): { id: IndicatorId; color: ColorName } | null {
  const pH = phOf(v);
  if (pH == null) return null;
  const ids = Object.keys(v.inds) as IndicatorId[];
  const id = ids[ids.length - 1];
  if (!id) return null;
  return { id, color: indicatorColor(id, pH).name };
}

interface Before {
  empty: boolean;
  hadConc: boolean;
  temp: number;
  ind: ReturnType<typeof indicatorState>;
  cations: string[];
  anions: string[];
}

function snapshot(v: Vessel): Before {
  const ions = Object.keys(v.aq).filter((k) => amt(v.aq, k) > EPS && IONS[k]);
  return {
    empty: isEmpty(v),
    hadConc: amt(v.aq, 'H2SO4c') > EPS && waterVolume(v) <= 0.05,
    temp: v.temp,
    ind: indicatorState(v),
    cations: ions.filter((k) => IONS[k].charge > 0),
    anions: ions.filter((k) => IONS[k].charge < 0)
  };
}

function finish(v: Vessel, before: Before, events: ReactionEvent[], explainCtx: ExplainCtx | null): ActionResult {
  if (explainCtx) {
    const extra = explain(v, before, events, explainCtx);
    if (extra) events.push(extra);
  }

  // An indicator that changed color is a visible sign of the reaction.
  const after = indicatorState(v);
  if (after && before.ind && after.id === before.ind.id && after.color !== before.ind.color) {
    const main = mainEvent(events);
    const p = { ind: after.id, from: before.ind.color, to: after.color };
    if (main && main.importance >= 1 && main.kind !== 'indicator') {
      if (!main.signs.includes('color')) main.signs.push('color');
      main.importance = Math.max(main.importance, 2) as ReactionEvent['importance'];
      main.p = { ...main.p, indFrom: p.from, indTo: p.to, ind: p.ind };
    } else {
      events.push({ kind: 'indicator', importance: 2, p: { ...p, medium: medium(phOf(v) ?? 7) }, signs: ['color'], key: `indicator:${after.id}` });
    }
  }

  const dT = v.temp - before.temp;
  const main = mainEvent(events);
  if (main && dT > 4 && !main.signs.includes('heat')) main.signs.push('heat');
  if (main) main.dT = dT;

  v.lastEvents = events;
  return { events };
}

export function mainEvent(events: ReactionEvent[]): ReactionEvent | undefined {
  let best: ReactionEvent | undefined;
  for (const e of events) if (!best || e.importance > best.importance) best = e;
  return best && best.importance > 0 ? best : undefined;
}

// ---------------------------------------------------------------- actions

export function addReagent(v: Vessel, r: Reagent, dose: Dose, now: number): ActionResult {
  const before = snapshot(v);
  let ml = 0;
  if (r.indicator) ml = DOSE_DROPS[dose] * 0.05;
  else if (r.kind === 'liquid') ml = DOSE_ML[dose];
  if (v.volume + ml > v.capacity + 1e-9) return { events: [], error: 'full' };

  if (r.indicator) {
    v.inds[r.indicator] = (v.inds[r.indicator] || 0) + DOSE_DROPS[dose];
    v.volume += ml;
  } else if (r.kind === 'liquid') {
    for (const id in r.aq) {
      const n = r.aq[id] * ml;
      if (IONS[id]) putIon(v, id, n, r.parent);
      else {
        put(v.aq, id, n);
        if (r.parent) v.parent[id] = r.parent;
      }
    }
    // A cold liquid poured in pulls the temperature towards room temperature.
    if (v.volume > 0.01) v.temp = (v.temp * v.volume + ROOM_T * ml) / (v.volume + ml);
    v.volume += ml;
    if (r.concVolume) v.concVol += ml;
  } else {
    for (const id in r.solid) put(v.solids, id, r.solid[id] * DOSE_SOLID[dose]);
  }
  if (v.added[v.added.length - 1] !== r.id) v.added.push(r.id);

  const ctx: Ctx = { now, aqueousAddedToConc: before.hadConc && r.kind === 'liquid' && !r.concVolume && !r.indicator, limited: new Set() };
  const events = settle(v, ctx);
  return finish(v, before, events, { reagent: r, poured: false, dose });
}

export function pour(from: Vessel, to: Vessel, now: number): ActionResult {
  if (from.id === to.id) return { events: [], error: 'same' };
  if (isEmpty(from) && Object.keys(from.inds).length === 0) return { events: [], error: 'empty' };
  if (to.volume + from.volume > to.capacity + 1e-9) return { events: [], error: 'full' };
  const before = snapshot(to);
  const fromHasWater = waterVolume(from) > 0.05;

  for (const id in from.aq) {
    if (IONS[id]) putIon(to, id, from.aq[id], from.parent[id]);
    else {
      put(to.aq, id, from.aq[id]);
      if (from.parent[id] && !to.parent[id]) to.parent[id] = from.parent[id];
    }
  }
  for (const id in from.solids) put(to.solids, id, from.solids[id]);
  for (const k in from.inds) {
    const key = k as IndicatorId;
    to.inds[key] = (to.inds[key] || 0) + (from.inds[key] || 0);
  }
  const total = to.volume + from.volume;
  if (total > 0.01) to.temp = (to.temp * to.volume + from.temp * from.volume) / total;
  to.volume = total;
  to.concVol += from.concVol;
  for (const a of from.added) if (to.added[to.added.length - 1] !== a) to.added.push(a);
  wash(from);

  const ctx: Ctx = { now, aqueousAddedToConc: before.hadConc && fromHasWater, limited: new Set() };
  const events = settle(to, ctx);
  return finish(to, before, events, { poured: true, pouredIons: before });
}

export function wash(v: Vessel) {
  const fresh = newVessel(v.id, v.kind);
  Object.assign(v, fresh, { heating: v.heating });
}

/** Advance time: heating, cooling, slow changes. Returns events when something happened. */
export function tick(v: Vessel, dt: number, now: number): ReactionEvent[] {
  const wasTemp = v.temp;
  if (v.heating) {
    if (v.volume > 0.01) v.temp = Math.min(100, v.temp + 6 * dt);
    else v.temp = Math.min(300, v.temp + 30 * dt);
  } else if (Math.abs(v.temp - ROOM_T) > 0.05) {
    v.temp = ROOM_T + (v.temp - ROOM_T) * Math.exp(-dt / 35);
  }

  // Iron(II) hydroxide slowly turns brown in air.
  const feoh2 = amt(v.solids, 'Fe(OH)2');
  if (feoh2 > EPS && v.fx.precipAt && now - v.fx.precipAt > 8000) {
    const e = Math.min(feoh2, feoh2 * 0.03 * dt + 0.002);
    v.solids['Fe(OH)2'] = feoh2 - e;
    if (v.solids['Fe(OH)2'] <= EPS) delete v.solids['Fe(OH)2'];
    put(v.solids, 'Fe(OH)3', e);
  }

  if (!v.heating && v.temp < 60 && wasTemp < 60) return [];
  const before = snapshot(v);
  before.temp = wasTemp;
  const ctx: Ctx = { now, aqueousAddedToConc: false, limited: new Set() };
  const events = settle(v, ctx);
  if (v.heating && v.volume > 0.01 && v.temp >= 99.5 && wasTemp < 99.5) {
    events.push({ kind: 'boiling', importance: 1, type: 'physical', p: {}, signs: ['gas'], key: 'boiling' });
    v.fx.gas.push({ id: 'H2O', amount: 1, at: now, until: now + 60000 });
  }
  if (events.length === 0) return [];
  finish(v, before, events, null);
  return events;
}

// ---------------------------------------------------------------- explanations

interface ExplainCtx {
  reagent?: Reagent;
  poured: boolean;
  dose?: Dose;
  pouredIons?: Before;
}

function notModeled(v: Vessel): string | null {
  const has = (id: string) => amt(v.aq, id) > EPS;
  const solid = (id: string) => amt(v.solids, id) > EPS;
  if (has('I^-') && (has('Cu^2+') || has('Fe^3+'))) return 'iodide';
  if (has('MnO4^-') && (has('Fe^2+') || has('I^-') || has('H2O2'))) return 'permanganate';
  if (has('Fe^3+') && ['Fe', 'Cu', 'Zn', 'Mg', 'Al'].some(solid)) return 'iron3metal';
  if (amt(v.aq, 'H2SO4c') > EPS && waterVolume(v) <= 0.05 && ['Zn', 'Mg', 'Na', 'Ca'].some(solid)) return 'concActive';
  return null;
}

function explain(v: Vessel, before: Before, events: ReactionEvent[], x: ExplainCtx): ReactionEvent | null {
  const nm = notModeled(v);
  if (nm && !events.some((e) => e.importance >= 2)) return { kind: 'notModeled', importance: 2, p: { topic: nm }, signs: [] };
  if (events.some((e) => e.importance >= 1)) return null;

  const r = x.reagent;
  const solid = (id: string) => amt(v.solids, id) > EPS;
  const has = (id: string) => amt(v.aq, id) > EPS;
  const metals = Object.keys(METALS).filter(solid);
  const conc = amt(v.aq, 'H2SO4c') > EPS && waterVolume(v) <= 0.05;

  // Concentrated acid with iron or aluminium, or copper that needs heating.
  if (conc) {
    const passive = metals.find((m) => m === 'Fe' || m === 'Al');
    if (passive) return { kind: 'passivation', importance: 2, p: { metal: passive }, signs: [], eq: { reactants: [passive, 'H2SO4'], products: [], conc: 'H2SO4', noReaction: true } };
    const cu = metals.find((m) => m === 'Cu' || m === 'Ag');
    if (cu) return { kind: 'needsHeat', importance: 2, p: { what: 'cuConc', metal: cu }, signs: [] };
  }

  const strongH = has('H^+');
  if (strongH) {
    const oxide = ['CuO', 'Fe2O3'].find(solid);
    if (oxide && v.temp < 60) return { kind: 'needsHeat', importance: 2, p: { what: 'oxide', solid: oxide }, signs: [] };
    const noble = metals.find((m) => activity(m) > activity('H2'));
    if (noble && !has('NO3^-')) {
      const acidParent = v.parent['H^+'] || 'HCl';
      return { kind: 'metalAcidNone', importance: 2, p: { metal: noble, acid: acidParent }, signs: [], eq: { reactants: [noble, acidParent], products: [], noReaction: true } };
    }
  }

  if (solid('Al') && has('Cu^2+') && !has('Cl^-')) return { kind: 'aluminumFilm', importance: 2, p: { metal: 'Al' }, signs: [] };

  if (metals.length) {
    const cations = Object.keys(v.aq).filter((c) => IONS[c]?.metal && amt(v.aq, c) > EPS && !c.startsWith('['));
    const preferred = r?.parent && hasCompound(r.parent) ? compound(r.parent).cation : undefined;
    for (const m of r?.cat === 'metal' ? [r.id] : metals) {
      if (!solid(m)) continue;
      const order = preferred && cations.includes(preferred) ? [preferred, ...cations] : cations;
      for (const c of order) {
        const cm = IONS[c].metal!;
        if (cm === m) continue;
        if (activity(m) > activity(cm)) {
          const cParent = v.parent[c] || salt(c, 'Cl^-').id;
          return { kind: 'metalSaltNone', importance: 2, p: { metal: m, ion: c, salt: cParent }, signs: [], eq: { reactants: [m, cParent], products: [], noReaction: true } };
        }
      }
      if (waterVolume(v) > 0.05 && (r?.cat === 'metal' || before.empty === false)) {
        return { kind: 'metalWaterNone', importance: 1, p: { metal: m }, signs: [] };
      }
    }
  }

  if (r && (r.cat === 'oxide' || r.id === 'CaCO3') && waterVolume(v) > 0.05) {
    const s = Object.keys(r.solid || {})[0];
    if (s && solid(s) && (basicSolid(s) || s === 'MnO2')) return { kind: 'insolubleSolid', importance: 1, p: { solid: s }, signs: [] };
  }

  if (r?.indicator) {
    const st = indicatorState(v);
    const pH = phOf(v);
    if (st && pH != null) return { kind: 'indicator', importance: 2, p: { ind: st.id, to: st.color, medium: medium(pH) }, signs: ['color'], key: `indicator:${st.id}` };
  }

  if (before.empty) return { kind: 'added', importance: 1, p: { reagent: r?.id || '' }, signs: [] };
  if (r?.id === 'H2O') return { kind: 'diluted', importance: 1, p: {}, signs: [] };

  // Two solutions of electrolytes met and every possible product is soluble.
  const newCations: string[] = [];
  const newAnions: string[] = [];
  if (r?.aq && r.kind === 'liquid') {
    for (const id in r.aq) {
      if (!IONS[id]) continue;
      (IONS[id].charge > 0 ? newCations : newAnions).push(id);
    }
  } else if (x.poured) {
    for (const id of Object.keys(v.aq)) {
      if (!IONS[id] || amt(v.aq, id) <= EPS) continue;
      if (IONS[id].charge > 0 && !before.cations.includes(id)) newCations.push(id);
      if (IONS[id].charge < 0 && !before.anions.includes(id)) newAnions.push(id);
    }
  }
  const pairs: string[] = [];
  for (const c of newCations) for (const a of before.anions) if (c !== 'H^+' && solubility(c, a).s === 'R') pairs.push(salt(c, a).id);
  for (const c of before.cations) for (const a of newAnions) if (c !== 'H^+' && solubility(c, a).s === 'R') pairs.push(salt(c, a).id);
  const unique = [...new Set(pairs)].filter((f) => !(r?.parent && f === r.parent));
  if ((newCations.length || newAnions.length) && (before.cations.length || before.anions.length)) {
    return { kind: 'exchangeNone', importance: 2, p: { a: unique[0] || '', b: unique[1] || '' }, signs: [] };
  }
  return { kind: 'nothing', importance: 1, p: {}, signs: [] };
}

// ---------------------------------------------------------------- what is inside

export interface ContentItem {
  id: string;           // compound formula
  state: 'solution' | 'solid' | 'concAcid' | 'indicator';
  amount: number;       // mmol (drops for indicators)
}

export function contents(v: Vessel): ContentItem[] {
  const items: ContentItem[] = [];
  for (const id in v.solids) if (v.solids[id] > 1e-4) items.push({ id, state: 'solid', amount: v.solids[id] });
  const groups = new Map<string, number>();
  for (const id in v.aq) {
    const n = v.aq[id];
    if (n <= 1e-5) continue;
    if (id === 'H2SO4c') { items.push({ id: 'H2SO4', state: 'concAcid', amount: n }); continue; }
    let key: string;
    if (IONS[id]) key = v.parent[id] || id;
    else if (id === 'NH3') key = 'NH3·H2O';
    else key = id;
    groups.set(key, Math.max(groups.get(key) || 0, n));
  }
  for (const [id, n] of groups) items.push({ id, state: 'solution', amount: n });
  for (const k in v.inds) items.push({ id: k, state: 'indicator', amount: v.inds[k as IndicatorId] || 0 });
  if (v.volume > 0.01 && groups.size === 0 && !items.some((i) => i.state === 'concAcid')) items.push({ id: 'H2O', state: 'solution', amount: v.volume });
  return items;
}

export function reagentOf(id: string) { return REAGENT_BY_ID[id]; }

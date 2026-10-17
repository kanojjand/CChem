// What the student can do with a vessel: add a reagent, pour one vessel into another,
// heat, wash. After each action the rules settle the contents, and when nothing visible
// happens `explain` says why.

import {
  IONS, METALS, NOBLE_METALS, REAGENT_BY_ID, activity, compound, hasCompound, salt, solubility,
  type IndicatorId, type Reagent
} from './data';
import { indicatorColor, type ColorName } from './color';
import { solvePH, medium } from './ph';
import { basicSolid, settle, type Ctx } from './rules';
import { heatStep } from './physics';
import { molarMass } from './formula';
import {
  EPS, ROOM_T, amt, isEmpty, newVessel, putIon, put, waterVolume,
  type ReactionEvent, type Vessel
} from './vessel';

export type Dose = 0 | 1 | 2;
export const DOSE_ML = [0.05, 1, 5] as const;
export const DOSE_SOLID = [0.3, 1, 4] as const;
export const DOSE_DROPS = [1, 2, 5] as const;

/** How much to add: millilitres for liquids, grams for solids, drops for indicators. */
export interface Amount { ml?: number; g?: number; drops?: number }

export interface ActionResult {
  events: ReactionEvent[];
  error?: 'full' | 'empty' | 'same' | 'broken';
  added?: number;      // mL, g or drops that actually went in
  overflow?: number;   // mL that ran over the rim
  partial?: boolean;   // pour: only part of the source fitted
}

/** Millimoles in one gram of a solid. */
export const mmolPerGram = (formula: string) => 1000 / molarMass(formula);

export const phOf = (v: Vessel) => solvePH(v.aq, v.volume);

function indicatorState(v: Vessel): { id: IndicatorId; color: ColorName } | null {
  const pH = phOf(v);
  if (pH == null) return null;
  const ids = Object.keys(v.inds) as IndicatorId[];
  const id = ids[ids.length - 1];
  if (!id) return null;
  return { id, color: indicatorColor(id, pH).name };
}

export interface Before {
  empty: boolean;
  hadConc: boolean;
  temp: number;
  ind: ReturnType<typeof indicatorState>;
  cations: string[];
  anions: string[];
}

export function snapshot(v: Vessel): Before {
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

export function finish(v: Vessel, before: Before, events: ReactionEvent[], explainCtx: ExplainCtx | null): ActionResult {
  for (const e of events) if (e.key && e.importance >= 1 && !v.seen.includes(e.key)) v.seen.push(e.key);
  // A violent reaction burst the vessel: the contents are lost.
  if (v.fx.boomAt != null && !v.broken && events.some((e) => e.safety === 'bigSodium')) {
    v.broken = v.fx.boomAt;
    v.aq = {}; v.solids = {}; v.inds = {}; v.volume = 0; v.concVol = 0; v.heating = false;
  }
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

export function addReagent(v: Vessel, r: Reagent, dose: Dose | Amount, now: number): ActionResult {
  if (v.broken) return { events: [], error: 'broken' };
  const amount: Amount = typeof dose === 'number'
    ? { ml: DOSE_ML[dose], drops: DOSE_DROPS[dose] }
    : dose;
  const before = snapshot(v);
  const free = Math.max(0, v.capacity - v.volume);
  let ml = 0;
  let overflow = 0;
  let added = 0;
  if (r.indicator) ml = (amount.drops ?? 2) * 0.05;
  else if (r.kind === 'liquid') ml = Math.max(0, amount.ml ?? 1);
  if (ml > 0 && free < 0.005) return { events: [], error: 'full' };
  if (ml > free) {
    overflow = ml - free;
    ml = free;
    v.fx.spillAt = now;
  }

  if (r.indicator) {
    const drops = Math.max(1, Math.round(ml / 0.05));
    v.inds[r.indicator] = (v.inds[r.indicator] || 0) + drops;
    v.volume += ml;
    added = drops;
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
    added = ml;
  } else {
    if (typeof dose === 'number') {
      for (const id in r.solid) put(v.solids, id, r.solid[id] * DOSE_SOLID[dose]);
      added = DOSE_SOLID[dose];
    } else {
      const g = Math.max(0, amount.g ?? 1);
      for (const id in r.solid) put(v.solids, id, g * mmolPerGram(id));
      added = g;
    }
  }
  if (v.added[v.added.length - 1] !== r.id) v.added.push(r.id);

  const ctx: Ctx = { now, aqueousAddedToConc: before.hadConc && r.kind === 'liquid' && !r.concVolume && !r.indicator, limited: new Set() };
  const events = settle(v, ctx);
  const res = finish(v, before, events, { reagent: r, poured: false });
  return { ...res, added, overflow: overflow > 0.005 ? overflow : undefined };
}

export function pour(from: Vessel, to: Vessel, now: number, filter = false): ActionResult {
  if (from.id === to.id) return { events: [], error: 'same' };
  if (to.broken || from.broken) return { events: [], error: 'broken' };
  if (isEmpty(from) && Object.keys(from.inds).length === 0) return { events: [], error: 'empty' };
  // Through a filter only the liquid passes; the solids stay on the paper.
  if (filter && from.volume <= 0.005) return { events: [], error: 'empty' };
  const residue = filter ? Object.keys(from.solids).sort((a, b) => from.solids[b] - from.solids[a])[0] : undefined;
  const solidsKept = filter ? from.solids : null;
  if (solidsKept) from.solids = {};
  const free = Math.max(0, to.capacity - to.volume);
  if (from.volume > 0.005 && free < 0.005) return { events: [], error: 'full' };
  // Pour as much as fits; the rest stays in the source vessel.
  const f = from.volume > 0.005 ? Math.min(1, free / from.volume) : 1;
  const before = snapshot(to);
  const fromHasWater = waterVolume(from) > 0.05;

  for (const id in from.aq) {
    const n = from.aq[id] * f;
    if (IONS[id]) putIon(to, id, n, from.parent[id]);
    else {
      put(to.aq, id, n);
      if (from.parent[id] && !to.parent[id]) to.parent[id] = from.parent[id];
    }
  }
  for (const id in from.solids) put(to.solids, id, from.solids[id] * f);
  for (const k in from.inds) {
    const key = k as IndicatorId;
    to.inds[key] = (to.inds[key] || 0) + (from.inds[key] || 0) * f;
  }
  const ml = from.volume * f;
  const total = to.volume + ml;
  if (total > 0.01) to.temp = (to.temp * to.volume + from.temp * ml) / total;
  to.volume = total;
  to.concVol += from.concVol * f;
  for (const a of from.added) if (to.added[to.added.length - 1] !== a) to.added.push(a);
  if (f >= 0.999) wash(from);
  else {
    for (const id in from.aq) from.aq[id] *= 1 - f;
    for (const id in from.solids) from.solids[id] *= 1 - f;
    for (const k in from.inds) from.inds[k as IndicatorId] = (from.inds[k as IndicatorId] || 0) * (1 - f);
    from.volume -= ml;
    from.concVol *= 1 - f;
  }

  if (solidsKept) for (const id in solidsKept) put(from.solids, id, solidsKept[id]);

  const ctx: Ctx = { now, aqueousAddedToConc: before.hadConc && fromHasWater, limited: new Set() };
  const events = settle(to, ctx);
  if (filter) {
    const busy = events.some((e) => e.importance >= 2);
    events.unshift({ kind: 'filtered', importance: busy ? 1 : 2, type: 'physical', p: { residue: residue ?? '' }, signs: [], key: residue ? 'filter' : undefined });
  }
  const res = finish(to, before, events, filter ? null : { poured: true, pouredIons: before });
  return { ...res, added: ml, partial: f < 0.999 };
}

export function wash(v: Vessel) {
  const fresh = newVessel(v.id, v.kind);
  Object.assign(v, fresh, { heating: v.heating, electro: v.electro ? { cathode: {} } : undefined });
}

/** Advance time: heating, cooling, boiling, slow changes. Returns events when something happened. */
export function tick(v: Vessel, dt: number, now: number): ReactionEvent[] {
  const before = snapshot(v);
  const physical = heatStep(v, dt, now);

  // Iron(II) and manganese(II) hydroxides slowly turn brown in air.
  for (const [from, to] of [['Fe(OH)2', 'Fe(OH)3'], ['Mn(OH)2', 'MnO(OH)2']]) {
    const n = amt(v.solids, from);
    if (n <= EPS || !v.fx.precipAt || now - v.fx.precipAt < 8000) continue;
    const e = Math.min(n, n * 0.03 * dt + 0.002);
    v.solids[from] = n - e;
    if (v.solids[from] <= EPS) delete v.solids[from];
    put(v.solids, to, e);
  }

  const ctx: Ctx = { now, aqueousAddedToConc: false, limited: new Set(), dt };
  const events = [...physical, ...settle(v, ctx)];
  // Slow processes go on for a while: tell about each of them once.
  for (const e of events) if (e.key && e.kind !== 'boiling' && v.seen.includes(e.key)) e.importance = 0;
  if (!events.some((e) => e.importance > 0)) return [];
  finish(v, before, events, null);
  return events.filter((e) => e.importance > 0);
}

/** Condensed steam from a delivery tube collects in a vessel: distillation. */
export function condense(v: Vessel, ml: number, now: number): ReactionEvent[] {
  if (v.broken || ml <= 0) return [];
  const add = Math.min(ml, Math.max(0, v.capacity - v.volume));
  if (add <= 0) return [];
  const before = snapshot(v);
  if (v.volume > 0.01) v.temp = (v.temp * v.volume + ROOM_T * add) / (v.volume + add);
  v.volume += add;
  const events = settle(v, { now, aqueousAddedToConc: false, limited: new Set() });
  if (!v.seen.includes('distillation')) events.unshift({ kind: 'distillation', importance: 2, type: 'physical', p: {}, signs: [], key: 'distillation' });
  if (!events.some((e) => e.importance > 0)) return [];
  finish(v, before, events, null);
  return events;
}

// ---------------------------------------------------------------- explanations

export interface ExplainCtx {
  reagent?: Reagent;
  poured: boolean;
  pouredIons?: Before;
}

function notModeled(v: Vessel): string | null {
  const has = (id: string) => amt(v.aq, id) > EPS;
  const solid = (id: string) => amt(v.solids, id) > EPS;
  if (has('MnO4^-') && !has('H^+') && (has('Fe^2+') || has('I^-') || has('H2O2') || has('SO3^2-'))) return 'permanganate';
  if (amt(v.aq, 'H2SO4c') > EPS && waterVolume(v) <= 0.05 && ['Na', 'Ca', 'K', 'Li', 'Ba'].some(solid)) return 'concActive';
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

  // Iron and aluminium in cold concentrated nitric acid are passivated too.
  const nitricConc = v.volume > 0.01 && amt(v.aq, 'H^+') / v.volume >= 6 && has('NO3^-');
  if (nitricConc && v.temp < 60) {
    const passive = metals.find((m) => m === 'Fe' || m === 'Al');
    if (passive) return { kind: 'passivation', importance: 2, p: { metal: passive, acid: 'HNO3' }, signs: [], eq: { reactants: [passive, 'HNO3'], products: [], conc: 'HNO3', noReaction: true } };
  }
  const crusted = ['CaCO3', 'BaCO3', 'PbCO3'].find((c) => solid(c) && v.seen.includes(`sulfate-film:${c}`));
  if (crusted && has('H^+') && has('SO4^2-')) return { kind: 'sulfateFilm', importance: 2, p: { solid: crusted, crust: salt(compound(crusted).cation!, 'SO4^2-').id, again: '1' }, signs: [] };

  // Concentrated acid with iron or aluminium, or copper that needs heating.
  if (conc) {
    const passive = metals.find((m) => m === 'Fe' || m === 'Al');
    if (passive) return { kind: 'passivation', importance: 2, p: { metal: passive, acid: 'H2SO4' }, signs: [], eq: { reactants: [passive, 'H2SO4'], products: [], conc: 'H2SO4', noReaction: true } };
    const cu = metals.find((m) => m === 'Cu' || m === 'Ag');
    if (cu) return { kind: 'needsHeat', importance: 2, p: { what: 'cuConc', metal: cu }, signs: [] };
  }

  const strongH = has('H^+');
  if (strongH) {
    const oxide = ['CuO', 'Fe2O3'].find(solid);
    if (oxide && v.temp < 60) return { kind: 'needsHeat', importance: 2, p: { what: 'oxide', solid: oxide }, signs: [] };
    const filmed = metals.find((m) => METALS[m].film);
    const hp = v.parent['H^+'] || 'HCl';
    const acidAnion = hasCompound(hp) ? compound(hp).anion : undefined;
    if (filmed && (acidAnion === 'Cl^-' || acidAnion === 'SO4^2-') && !has('NO3^-')) {
      return { kind: 'leadFilm', importance: 2, p: { metal: filmed, acid: v.parent['H^+'] || 'HCl', salt: salt(METALS[filmed].ion, acidAnion).id }, signs: [] };
    }
    const precious = metals.find((m) => NOBLE_METALS.has(m));
    if (precious) {
      const acidParent = v.parent['H^+'] || 'HCl';
      return { kind: 'metalAcidNone', importance: 2, p: { metal: precious, acid: acidParent, noble: '1' }, signs: [], eq: { reactants: [precious, acidParent], products: [], noReaction: true } };
    }
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

  if (r && (r.cat === 'oxide' || r.cat === 'nonmetal' || r.id === 'CaCO3' || r.id === 'malachite') && r.kind === 'solid' && waterVolume(v) > 0.05) {
    const s = Object.keys(r.solid || {})[0];
    if (s === 'S' && solid(s)) return { kind: 'floats', importance: 2, p: { solid: s }, signs: [], key: 'sulfur-floats' };
    if (s && solid(s) && (basicSolid(s) || ['MnO2', 'SiO2', 'C', 'Si'].includes(s))) return { kind: 'insolubleSolid', importance: 1, p: { solid: s }, signs: [] };
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

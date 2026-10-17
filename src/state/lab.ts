// Lab state: vessels on the bench, the selected vessel, the spirit lamp, delivery tubes,
// the gas collector, the burette, the electrolyser, undo history, the experiment log and
// discovered reactions. The engine mutates vessels in place, so the store keeps plain
// objects and bumps a version number after every change.

import { REAGENT_BY_ID } from '../engine/data';
import { addReagent, condense, finish, mainEvent, phOf, pour, snapshot, tick, wash, type ActionResult, type Amount } from '../engine/actions';
import { ML_PER_MMOL, bubbleGas, electrolysisStep, flameTest, testGas, type GasTestResult, type GasTool } from '../engine/apparatus';
import { needsTick } from '../engine/physics';
import { METALS } from '../engine/data';
import { indicatorColor } from '../engine/color';
import { EPS, newVessel, type ReactionEvent, type Vessel, type VesselKind } from '../engine/vessel';

export interface JournalEntry {
  id: number;
  at: number;
  vessel: string;
  added: string[];
  event: ReactionEvent;
}

export interface Collector { gases: Record<string, number>; capacityMl: number; lastTest?: { tool: GasTool; result: GasTestResult; at: number } }

export interface Burette {
  vessel: string;
  titrant: string;
  capacity: number;
  used: number;
  flow: boolean;
  sampleMl: number;
  points: { v: number; pH: number }[];
  endpoint?: { v: number; pH: number };
  lastColor?: string;
}

interface Snapshot {
  vessels: Vessel[];
  selected: string;
  heating: string | null;
  tubes: Record<string, string>;
  collector: Collector;
  burette: Burette | null;
  electro: string | null;
}

export interface Outcome {
  result?: ActionResult;
  error?: 'full' | 'empty' | 'same' | 'nothing' | 'broken';
  discovered: string[];
  placed?: VesselKind;   // a vessel was put on the empty bench to hold the reagent
}

export const COLLECTOR_ID = 'collector';
export const SPEEDS = [1, 5, 20, 60] as const;
export const FLOW_ML_PER_S = 0.2;
export const MAX_VESSELS = 10;

const QUIET = new Set(['added', 'diluted', 'nothing', 'minor', 'gasThrough']);
const HISTORY_LIMIT = 40;
const JOURNAL_LIMIT = 150;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
}

/** A ready set of glassware (used by tests); the app starts with an empty bench. */
export const DEMO_SET: [string, VesselKind][] = [['t1', 'tube'], ['t2', 'tube'], ['t3', 'tube'], ['t4', 'tube'], ['b1', 'beaker'], ['f1', 'flask']];

/** Random concentration of the unknown acid for the titration task, mol/L. */
function unknownConcentration(): number {
  return Math.round((0.06 + Math.random() * 0.12) * 200) / 200;
}

export class Lab {
  vessels: Vessel[];
  selected: string;
  heating: string | null = null;
  tubes: Record<string, string> = {};
  collector: Collector = { gases: {}, capacityMl: 100 };
  burette: Burette | null = null;
  electro: string | null = null;
  /** Last flame test: the lamp flame shows its color for a few seconds. */
  flame: { color: string; at: number } | null = null;
  speed: number = 1;
  journal: JournalEntry[] = load<JournalEntry[]>('cchem.journal', []);
  discoveries: string[] = load<string[]>('cchem.discoveries', []);
  unknownC = unknownConcentration();
  version = 0;
  /** Called for each new journal entry, e.g. to send it to the server. */
  onRecord?: (entry: JournalEntry) => void;
  onChange?: () => void;

  private history: Snapshot[] = [];
  private listeners = new Set<() => void>();
  private counter = 1;

  constructor(initial: [string, VesselKind][] = []) {
    this.vessels = initial.map(([id, kind]) => newVessel(id, kind));
    this.selected = this.vessels[0]?.id ?? '';
    const x = REAGENT_BY_ID.HClx;
    if (x) x.aq = { 'H^+': this.unknownC, 'Cl^-': this.unknownC };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };
  getVersion = () => this.version;

  private emit() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  vessel(id: string): Vessel {
    return this.vessels.find((v) => v.id === id) ?? this.vessels[0];
  }
  has(id: string) { return this.vessels.some((v) => v.id === id); }

  private remember() {
    this.history.push(structuredClone({
      vessels: this.vessels, selected: this.selected, heating: this.heating, tubes: this.tubes,
      collector: this.collector, burette: this.burette, electro: this.electro
    }));
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
  }

  private record(v: { id: string; added: string[] }, events: ReactionEvent[], now: number): string[] {
    const fresh: string[] = [];
    for (const e of events) {
      if (e.key && !this.discoveries.includes(e.key) && e.importance >= 2 && !QUIET.has(e.kind)) {
        this.discoveries.push(e.key);
        fresh.push(e.key);
      }
    }
    if (fresh.length) save('cchem.discoveries', this.discoveries);
    const main = mainEvent(events);
    if (main && main.importance >= 2 && !QUIET.has(main.kind)) {
      const entry: JournalEntry = { id: now + Math.random(), at: now, vessel: v.id, added: [...v.added], event: main };
      this.journal.push(entry);
      if (this.journal.length > JOURNAL_LIMIT) this.journal.splice(0, this.journal.length - JOURNAL_LIMIT);
      save('cchem.journal', this.journal);
      this.onRecord?.(entry);
      this.onChange?.();
    }
    return fresh;
  }

  /** Hand gas given off in a vessel to its delivery tube; without a tube it escapes into the air. */
  private routeGas(now: number): string[] {
    const found: string[] = [];
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (const v of this.vessels) {
        if (!v.gasLog.length) continue;
        const log = v.gasLog.splice(0);
        const target = this.tubes[v.id];
        if (!target) continue;
        for (const g of log) {
          if (g.id === 'H2O') {
            // Steam condenses in the cold tube: the receiving vessel collects distilled water.
            if (target !== COLLECTOR_ID && this.has(target)) {
              const t = this.vessel(target);
              const events = condense(t, g.amount, now);
              if (events.length) found.push(...this.record(t, events, now));
            }
            continue;
          }
          if (target === COLLECTOR_ID && g.id === 'I2') continue;
          if (target === COLLECTOR_ID) {
            const room = this.collector.capacityMl / ML_PER_MMOL - Object.values(this.collector.gases).reduce((s, n) => s + n, 0);
            const n = Math.min(g.amount, Math.max(0, room));
            if (n > EPS) this.collector.gases[g.id] = (this.collector.gases[g.id] || 0) + n;
          } else if (this.has(target)) {
            const t = this.vessel(target);
            t.fx.gas = t.fx.gas.filter((x) => x.until > now);
            t.fx.gas.push({ id: 'tube', amount: g.amount, at: now, until: now + 4000 });
            const res = bubbleGas(t, g.id, g.amount, now);
            found.push(...this.record(t, res.events, now));
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    return found;
  }

  select(id: string) {
    if (this.selected === id) return;
    this.selected = id;
    this.emit();
  }

  add(reagentId: string, amount: Amount, target = this.selected, remember = true): Outcome {
    const r = REAGENT_BY_ID[reagentId];
    if (!r) return { error: 'nothing', discovered: [] };
    if (remember) this.remember();
    // On an empty bench the reagent goes into a new test tube.
    let placed: VesselKind | undefined;
    if (this.vessels.length === 0) {
      target = this.place('tube');
      placed = 'tube';
    }
    if (target === COLLECTOR_ID || !this.has(target)) {
      if (remember) this.history.pop();
      return { error: 'nothing', discovered: [] };
    }
    const v = this.vessel(target);
    const now = Date.now();
    const result = addReagent(v, r, amount, now);
    if (result.error) {
      if (remember) this.history.pop();
      if (placed) this.vessels = this.vessels.filter((x) => x.id !== target);
      return { error: result.error, discovered: [] };
    }
    this.selected = target;
    const discovered = [...this.record(v, result.events, now), ...this.routeGas(now)];
    this.emit();
    return { result, discovered, placed };
  }

  pour(fromId: string, toId: string, filter = false): Outcome {
    if (toId === COLLECTOR_ID || !this.has(fromId) || !this.has(toId)) return { error: 'nothing', discovered: [] };
    const from = this.vessel(fromId);
    const to = this.vessel(toId);
    this.remember();
    const now = Date.now();
    const result = pour(from, to, now, filter);
    if (result.error) {
      this.history.pop();
      return { error: result.error, discovered: [] };
    }
    this.selected = toId;
    const discovered = [...this.record(to, result.events, now), ...this.routeGas(now)];
    this.emit();
    return { result, discovered };
  }

  toggleHeat(id = this.selected) {
    if (id === COLLECTOR_ID || !this.has(id)) return;
    this.remember();
    const on = this.heating !== id;
    for (const v of this.vessels) v.heating = false;
    this.heating = on ? id : null;
    if (on) this.vessel(id).heating = true;
    this.selected = id;
    this.emit();
  }

  wash(id = this.selected) {
    if (id === COLLECTOR_ID) { this.emptyCollector(); return; }
    if (!this.has(id)) return;
    this.remember();
    wash(this.vessel(id));
    if (this.burette?.vessel === id) this.burette = { ...this.burette, points: [], endpoint: undefined, sampleMl: 0, used: 0, flow: false, lastColor: undefined };
    this.emit();
  }

  addVessel(kind: VesselKind): string | null {
    if (this.vessels.length >= MAX_VESSELS) return null;
    this.remember();
    const id = this.place(kind);
    this.emit();
    return id;
  }

  /** Put a new vessel on the bench and select it (no undo step, no update). */
  private place(kind: VesselKind): string {
    let id = '';
    do { id = `${kind[0]}${kind === 'beaker250' ? 'w' : ''}${++this.counter}`; } while (this.has(id));
    this.vessels.push(newVessel(id, kind));
    this.selected = id;
    return id;
  }

  /** Start over: an empty bench, nothing heating, normal speed. Progress and the journal stay. Undo brings it back. */
  reset(): boolean {
    const busy = this.vessels.length > 0 || Object.keys(this.collector.gases).length > 0 || this.speed !== 1;
    if (!busy) return false;
    this.remember();
    this.vessels = [];
    this.selected = '';
    this.heating = null;
    this.tubes = {};
    this.collector = { gases: {}, capacityMl: this.collector.capacityMl };
    this.burette = null;
    this.electro = null;
    this.flame = null;
    this.speed = 1;
    this.emit();
    return true;
  }

  removeVessel(id: string) {
    if (!this.has(id)) return;
    this.remember();
    this.vessels = this.vessels.filter((v) => v.id !== id);
    if (this.heating === id) this.heating = null;
    if (this.electro === id) this.electro = null;
    if (this.burette?.vessel === id) this.burette = null;
    for (const k of Object.keys(this.tubes)) if (k === id || this.tubes[k] === id) delete this.tubes[k];
    if (this.selected === id) this.selected = this.vessels[0]?.id ?? '';
    this.emit();
  }

  clearAll(): boolean {
    const busy = this.vessels.some((v) => v.volume >= 0.005 || Object.keys(v.solids).length > 0 || v.heating || v.broken)
      || Object.keys(this.collector.gases).length > 0 || Object.keys(this.tubes).length > 0 || this.burette || this.electro;
    if (!busy) return false;
    this.remember();
    for (const v of this.vessels) { wash(v); v.heating = false; v.electro = undefined; }
    this.heating = null;
    this.tubes = {};
    this.collector = { gases: {}, capacityMl: this.collector.capacityMl };
    this.burette = null;
    this.electro = null;
    this.emit();
    return true;
  }

  undo(): boolean {
    const snap = this.history.pop();
    if (!snap) return false;
    Object.assign(this, snap);
    this.emit();
    return true;
  }

  setSpeed(s: number) { this.speed = s; this.emit(); }

  // ---------------------------------------------------------------- delivery tube and gas collector

  /** Connect a delivery tube from a vessel to the gas collector or to another vessel; same target again removes it. */
  setTube(from: string, to: string | null) {
    if (!this.has(from) || from === to) return;
    this.remember();
    if (!to || this.tubes[from] === to) delete this.tubes[from];
    else {
      // No loops: a vessel cannot feed a vessel that feeds it back.
      if (to !== COLLECTOR_ID && this.tubes[to] === from) delete this.tubes[to];
      this.tubes[from] = to;
    }
    this.emit();
  }

  emptyCollector() {
    if (!Object.keys(this.collector.gases).length && !this.collector.lastTest) return;
    this.remember();
    this.collector = { gases: {}, capacityMl: this.collector.capacityMl };
    this.emit();
  }

  collectorMl(): number {
    return Object.values(this.collector.gases).reduce((s, n) => s + n, 0) * ML_PER_MMOL;
  }

  /** Test gas in the collector or at the mouth of a vessel. */
  testGas(target: string, tool: GasTool): { result: GasTestResult; discovered: string[] } {
    const now = Date.now();
    let sample: Record<string, number> = {};
    if (target === COLLECTOR_ID) sample = { ...this.collector.gases };
    else if (this.has(target)) {
      for (const g of this.vessel(target).fx.gas) {
        if (g.until > now && g.id !== 'H2O' && g.id !== 'tube') sample[g.id] = (sample[g.id] || 0) + g.amount;
      }
    }
    const { result, burns } = testGas(sample, tool);
    if (target === COLLECTOR_ID) {
      if (burns) {
        // Hydrogen burns to water; with oxygen present both are used up.
        const h2 = this.collector.gases.H2 || 0;
        delete this.collector.gases.H2;
        if (burns.includes('O2') && this.collector.gases.O2) {
          this.collector.gases.O2 = Math.max(0, this.collector.gases.O2 - h2 / 2);
          if (this.collector.gases.O2 <= EPS) delete this.collector.gases.O2;
        }
      }
      if (tool === 'limewater' && result === 'limewaterCloudy') delete this.collector.gases.CO2;
      this.collector.lastTest = { tool, result, at: now };
    }
    const gas = Object.entries(sample).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const event: ReactionEvent = {
      kind: 'gasTest', importance: 2, p: { tool, result, gas, target }, signs: result === 'pop' || result === 'loudPop' || result === 'relights' || result === 'burnsBrighter' ? ['light'] : [],
      key: result === 'stillGlows' || result === 'burnsAsUsual' || result === 'litmusSame' || result === 'limewaterSame' ? undefined : `test:${result}`
    };
    let discovered: string[] = [];
    if (target !== COLLECTOR_ID && this.has(target)) {
      const v = this.vessel(target);
      v.lastEvents = [event];
      discovered = this.record(v, [event], now);
    } else {
      discovered = this.record({ id: COLLECTOR_ID, added: [] }, [event], now);
    }
    this.emit();
    return { result, discovered };
  }

  /** Hold a magnet to the vessel: iron and nickel pieces jump to it. */
  magnet(id = this.selected): { grams: number; discovered: string[] } {
    if (!this.has(id)) return { grams: 0, discovered: [] };
    const v = this.vessel(id);
    const metals = Object.keys(v.solids).filter((m) => METALS[m]?.magnetic && v.solids[m] > EPS);
    this.remember();
    const now = Date.now();
    const before = snapshot(v);
    let grams = 0;
    for (const m of metals) {
      grams += (v.solids[m] * (m === 'Fe' ? 55.85 : 58.69)) / 1000;
      delete v.solids[m];
    }
    const others = Object.keys(v.solids).filter((x) => v.solids[x] > EPS);
    const event: ReactionEvent = metals.length
      ? { kind: 'magnet', importance: 2, type: 'physical', p: { metal: metals[0], g: grams.toFixed(2), left: others[0] ?? '' }, signs: [], key: 'magnet' }
      : { kind: 'magnetNone', importance: 2, type: 'physical', p: { solid: others[0] ?? '' }, signs: [] };
    finish(v, before, [event], null);
    const discovered = this.record(v, [event], now);
    this.selected = id;
    this.emit();
    return { grams, discovered };
  }

  /** Dip a wire loop into the vessel and hold it in the lamp flame. */
  flameTest(id = this.selected): { color: string | null; discovered: string[] } {
    if (!this.has(id)) return { color: null, discovered: [] };
    const v = this.vessel(id);
    const now = Date.now();
    const { ions, color } = flameTest(v);
    const event: ReactionEvent = {
      kind: 'flameTest', importance: 2, type: 'physical', p: { ion: ions[0] ?? '', others: ions.slice(1).join(','), color: color ?? '' },
      signs: color ? ['light', 'color'] : [], key: ions[0] ? `flame:${ions[0]}` : undefined
    };
    v.lastEvents = [event];
    this.flame = { color: color ?? '#F2A33A', at: now };
    const discovered = this.record(v, [event], now);
    this.selected = id;
    this.emit();
    return { color, discovered };
  }

  // ---------------------------------------------------------------- burette (titration)

  attachBurette(vesselId: string, titrant = 'NaOH01') {
    if (!this.has(vesselId)) return;
    this.remember();
    const v = this.vessel(vesselId);
    const pH = phOf(v);
    this.burette = {
      vessel: vesselId, titrant, capacity: 50, used: 0, flow: false, sampleMl: v.volume,
      points: pH != null ? [{ v: 0, pH }] : [], lastColor: this.indicatorName(v)
    };
    this.selected = vesselId;
    this.emit();
  }

  detachBurette() {
    if (!this.burette) return;
    this.remember();
    this.burette = null;
    this.emit();
  }

  setTitrant(id: string) {
    if (!this.burette || !REAGENT_BY_ID[id]) return;
    this.burette = { ...this.burette, titrant: id, used: 0, points: this.burette.points.slice(0, 1), endpoint: undefined };
    this.emit();
  }

  private indicatorName(v: Vessel): string | undefined {
    const ids = Object.keys(v.inds) as (keyof typeof v.inds)[];
    const id = ids[ids.length - 1];
    const pH = phOf(v);
    return id && pH != null ? indicatorColor(id, pH).name : undefined;
  }

  /** Add titrant from the burette. Returns true when the indicator changed color for the first time. */
  titrate(ml: number, remember = true): { endpoint: boolean; discovered: string[] } {
    const b = this.burette;
    if (!b || !this.has(b.vessel)) return { endpoint: false, discovered: [] };
    const left = b.capacity - b.used;
    const dose = Math.min(ml, left);
    if (dose <= 1e-6) { b.flow = false; this.emit(); return { endpoint: false, discovered: [] }; }
    const v = this.vessel(b.vessel);
    if (!b.points.length) {
      const pH0 = phOf(v);
      if (pH0 != null) b.points.push({ v: 0, pH: pH0 });
      b.sampleMl = v.volume;
    }
    const out = this.add(b.titrant, { ml: dose }, b.vessel, remember);
    if (out.error) { b.flow = false; this.emit(); return { endpoint: false, discovered: out.discovered }; }
    b.used = Math.round((b.used + (out.result?.added ?? dose)) * 1000) / 1000;
    const pH = phOf(v);
    if (pH != null) b.points.push({ v: b.used, pH });
    const color = this.indicatorName(v);
    let endpoint = false;
    if (color && b.lastColor && color !== b.lastColor && !b.endpoint) {
      b.endpoint = { v: b.used, pH: pH ?? 7 };
      b.flow = false;
      endpoint = true;
    }
    b.lastColor = color ?? b.lastColor;
    this.emit();
    return { endpoint, discovered: out.discovered };
  }

  setFlow(on: boolean) {
    if (!this.burette) return;
    if (on) this.remember();
    this.burette.flow = on;
    this.emit();
  }

  // ---------------------------------------------------------------- electrolyser

  toggleElectro(id = this.selected) {
    if (!this.has(id)) return;
    this.remember();
    for (const v of this.vessels) if (v.id !== id) v.electro = undefined;
    const v = this.vessel(id);
    if (this.electro === id) { v.electro = undefined; this.electro = null; }
    else { v.electro = { cathode: {} }; this.electro = id; }
    this.selected = id;
    this.emit();
  }

  // ---------------------------------------------------------------- time

  clearJournal() {
    this.journal = [];
    save('cchem.journal', this.journal);
    this.onChange?.();
    this.emit();
  }

  /** Merge progress saved on the server into the local one. */
  mergeProgress(discoveries: string[], journal: JournalEntry[]) {
    const keys = new Set([...this.discoveries, ...discoveries]);
    this.discoveries = [...keys];
    const byId = new Map<number, JournalEntry>();
    for (const e of [...journal, ...this.journal]) byId.set(e.id, e);
    this.journal = [...byId.values()].sort((a, b) => a.at - b.at).slice(-JOURNAL_LIMIT);
    save('cchem.discoveries', this.discoveries);
    save('cchem.journal', this.journal);
    this.emit();
  }

  /** Advance real time by dt seconds; lab time runs `speed` times faster. Returns newly discovered reaction keys. */
  step(dt: number): { discovered: string[]; endpoint: boolean } {
    const now = Date.now();
    const simDt = dt * this.speed;
    let changed = false;
    let endpoint = false;
    const discovered: string[] = [];
    for (const v of this.vessels) {
      if (needsTick(v)) {
        // Long steps are split so heating stays smooth at high speed.
        const n = Math.max(1, Math.ceil(simDt / 2));
        for (let i = 0; i < n; i++) {
          const events = tick(v, simDt / n, now);
          if (events.length) discovered.push(...this.record(v, events, now));
        }
        changed = true;
      }
      if (v.electro) {
        const events = electrolysisStep(v, simDt, now);
        if (events.length) discovered.push(...this.record(v, events, now));
        changed = true;
      }
    }
    if (this.burette?.flow) {
      // Small portions keep the end point accurate even when time runs fast.
      let left = FLOW_ML_PER_S * simDt;
      while (left > 1e-6 && this.burette?.flow) {
        const r = this.titrate(Math.min(0.05, left), false);
        left -= 0.05;
        discovered.push(...r.discovered);
        if (r.endpoint) { endpoint = true; break; }
      }
      changed = true;
    }
    if (this.vessels.some((v) => v.gasLog.length)) {
      discovered.push(...this.routeGas(now));
      changed = true;
    }
    if (!changed && (this.vessels.some((v) => hasActiveFx(v, now)) || (this.flame && now - this.flame.at < FX_MS))) changed = true;
    if (changed) this.emit();
    return { discovered, endpoint };
  }
}

const FX_MS = 6000;

export function hasActiveFx(v: Vessel, now: number): boolean {
  if (v.fx.gas.some((g) => g.until > now)) return true;
  const fx = v.fx;
  return [fx.precipAt, fx.splashAt, fx.boomAt, fx.charAt, fx.brownAt, fx.smellAt, fx.depositAt, fx.dissolveAt, fx.runAt, fx.spillAt,
    fx.flame?.at, fx.glowAt, fx.volcanoAt, fx.smokeAt, fx.vaporAt, fx.dropsAt]
    .some((t) => t != null && now - t < FX_MS);
}

// Lab state: vessels on the bench, the selected vessel, the spirit lamp, undo history,
// the experiment log and discovered reactions. The engine mutates vessels in place, so
// the store keeps them in plain objects and bumps a version number after every change.

import { REAGENT_BY_ID } from '../engine/data';
import { addReagent, mainEvent, pour, tick, wash, type ActionResult, type Dose } from '../engine/actions';
import { EPS, ROOM_T, amt, newVessel, type ReactionEvent, type Vessel } from '../engine/vessel';

export interface JournalEntry {
  id: number;
  at: number;
  vessel: string;
  added: string[];
  event: ReactionEvent;
}

interface Snapshot { vessels: Vessel[]; selected: string; heating: string | null }

export interface Outcome {
  result?: ActionResult;
  error?: 'full' | 'empty' | 'same' | 'nothing';
  discovered: string[];
}

const QUIET = new Set(['added', 'diluted', 'nothing', 'minor']);
const HISTORY_LIMIT = 40;
const JOURNAL_LIMIT = 120;

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

export const VESSEL_IDS = ['t1', 't2', 't3', 't4', 'b1'] as const;

export class Lab {
  vessels: Vessel[] = VESSEL_IDS.map((id) => newVessel(id, id.startsWith('t') ? 'tube' : 'beaker'));
  selected = 't1';
  heating: string | null = null;
  journal: JournalEntry[] = load<JournalEntry[]>('cchem.journal', []);
  discoveries: string[] = load<string[]>('cchem.discoveries', []);
  version = 0;

  private history: Snapshot[] = [];
  private listeners = new Set<() => void>();

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

  private remember() {
    this.history.push({ vessels: structuredClone(this.vessels), selected: this.selected, heating: this.heating });
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
  }

  private record(v: Vessel, events: ReactionEvent[], now: number): string[] {
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
      this.journal.push({ id: now + Math.random(), at: now, vessel: v.id, added: [...v.added], event: main });
      if (this.journal.length > JOURNAL_LIMIT) this.journal.splice(0, this.journal.length - JOURNAL_LIMIT);
      save('cchem.journal', this.journal);
    }
    return fresh;
  }

  select(id: string) {
    if (this.selected === id) return;
    this.selected = id;
    this.emit();
  }

  add(reagentId: string, dose: Dose, target = this.selected): Outcome {
    const r = REAGENT_BY_ID[reagentId];
    const v = this.vessel(target);
    if (!r) return { error: 'nothing', discovered: [] };
    this.remember();
    const now = Date.now();
    const result = addReagent(v, r, dose, now);
    if (result.error) {
      this.history.pop();
      return { error: result.error, discovered: [] };
    }
    this.selected = target;
    const discovered = this.record(v, result.events, now);
    this.emit();
    return { result, discovered };
  }

  pour(fromId: string, toId: string): Outcome {
    const from = this.vessel(fromId);
    const to = this.vessel(toId);
    this.remember();
    const now = Date.now();
    const result = pour(from, to, now);
    if (result.error) {
      this.history.pop();
      return { error: result.error, discovered: [] };
    }
    this.selected = toId;
    const discovered = this.record(to, result.events, now);
    this.emit();
    return { result, discovered };
  }

  toggleHeat(id = this.selected) {
    this.remember();
    const on = this.heating !== id;
    for (const v of this.vessels) v.heating = false;
    this.heating = on ? id : null;
    if (on) this.vessel(id).heating = true;
    this.selected = id;
    this.emit();
  }

  wash(id = this.selected) {
    this.remember();
    wash(this.vessel(id));
    this.emit();
  }

  clearAll(): boolean {
    if (this.vessels.every((v) => v.volume < 0.005 && Object.keys(v.solids).length === 0 && !v.heating)) return false;
    this.remember();
    for (const v of this.vessels) { wash(v); v.heating = false; }
    this.heating = null;
    this.emit();
    return true;
  }

  undo(): boolean {
    const snap = this.history.pop();
    if (!snap) return false;
    this.vessels = snap.vessels;
    this.selected = snap.selected;
    this.heating = snap.heating;
    this.emit();
    return true;
  }

  clearJournal() {
    this.journal = [];
    save('cchem.journal', this.journal);
    this.emit();
  }

  /** Advance time by dt seconds. Returns newly discovered reaction keys. */
  step(dt: number): string[] {
    const now = Date.now();
    let changed = false;
    const discovered: string[] = [];
    for (const v of this.vessels) {
      const drifting = Math.abs(v.temp - ROOM_T) > 0.05;
      const browning = amt(v.solids, 'Fe(OH)2') > EPS;
      if (v.heating || drifting || browning) {
        const events = tick(v, dt, now);
        if (events.length) discovered.push(...this.record(v, events, now));
        changed = true;
      }
      if (!changed && hasActiveFx(v, now)) changed = true;
    }
    if (changed) this.emit();
    return discovered;
  }
}

const FX_MS = 6000;

export function hasActiveFx(v: Vessel, now: number): boolean {
  if (v.fx.gas.some((g) => g.until > now)) return true;
  const fx = v.fx;
  return [fx.precipAt, fx.splashAt, fx.boomAt, fx.charAt, fx.brownAt, fx.smellAt, fx.depositAt, fx.dissolveAt, fx.runAt]
    .some((t) => t != null && now - t < FX_MS);
}

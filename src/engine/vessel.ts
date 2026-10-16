import type { IndicatorId, ColorKey } from './data';
import type { EqSpec } from './equation';

export const EPS = 1e-7;
export const ROOM_T = 22;

export type Sign = 'precip' | 'gas' | 'color' | 'heat' | 'dissolve' | 'smell' | 'deposit' | 'light';

export type EventKind =
  | 'precip' | 'saturated' | 'silicicGel' | 'jointHydrolysis' | 'fe3scn' | 'ammine' | 'complexAcid'
  | 'neutralization' | 'weakAcidOut' | 'bicarbonateFirst' | 'gasCO2' | 'ammonia' | 'ammoniaGas'
  | 'dissolveAcid' | 'amphoteric' | 'metalAlkali' | 'metalAcid' | 'activeMetalWater' | 'metalNitric'
  | 'metalSalt' | 'oxideWater' | 'h2o2' | 'dissolve' | 'dilutionSafe' | 'dilutionUnsafe' | 'sugarChar'
  | 'cuConcAcid' | 'hydroxideDecomp' | 'sugarHeat' | 'boiling' | 'minor'
  // explanations produced when nothing visible happens
  | 'added' | 'diluted' | 'indicator' | 'exchangeNone' | 'metalAcidNone' | 'metalSaltNone' | 'metalWaterNone'
  | 'aluminumFilm' | 'passivation' | 'needsHeat' | 'insolubleSolid' | 'notModeled' | 'nothing';

export type ReactionType =
  | 'exchange' | 'substitution' | 'combination' | 'decomposition' | 'neutralization' | 'redox' | 'complex' | 'physical';

export type SafetyKey = 'acidWater' | 'bigSodium' | 'fumeHood' | 'ammoniaSmell' | 'hotTube' | 'sodiumWater';

export interface ReactionEvent {
  kind: EventKind;
  importance: 0 | 1 | 2 | 3;
  type?: ReactionType;
  eq?: EqSpec;
  p: Record<string, string>;
  signs: Sign[];
  safety?: SafetyKey;
  dT?: number;
  key?: string;            // discovery key
}

export interface GasFx { id: string; amount: number; at: number; until: number }

export interface Fx {
  gas: GasFx[];
  precipAt?: number;
  splashAt?: number;
  boomAt?: number;
  charAt?: number;
  brownAt?: number;
  smellAt?: number;
  depositAt?: number;
  dissolveAt?: number;
  runAt?: number;         // sodium skating on water
}

export interface Vessel {
  id: string;
  kind: 'tube' | 'beaker';
  capacity: number;        // mL
  volume: number;          // mL of liquid
  concVol: number;         // mL of undiluted concentrated sulfuric acid within volume
  temp: number;
  heating: boolean;
  aq: Record<string, number>;      // mmol of dissolved ions and molecules
  solids: Record<string, number>;  // mmol of solids
  parent: Record<string, string>;  // ion -> compound it came from
  inds: Partial<Record<IndicatorId, number>>; // drops
  added: string[];                 // reagent ids in order of addition
  fx: Fx;
  lastEvents: ReactionEvent[];
}

export function newVessel(id: string, kind: Vessel['kind']): Vessel {
  return {
    id,
    kind,
    capacity: kind === 'tube' ? 20 : 100,
    volume: 0,
    concVol: 0,
    temp: ROOM_T,
    heating: false,
    aq: {},
    solids: {},
    parent: {},
    inds: {},
    added: [],
    fx: { gas: [] },
    lastEvents: []
  };
}

export const amt = (rec: Record<string, number>, id: string) => rec[id] || 0;

export function put(rec: Record<string, number>, id: string, n: number) {
  if (n <= 0) return;
  rec[id] = (rec[id] || 0) + n;
}

export function take(rec: Record<string, number>, id: string, n: number) {
  const left = (rec[id] || 0) - n;
  if (left <= EPS) delete rec[id];
  else rec[id] = left;
}

export function putIon(v: Vessel, id: string, n: number, parent?: string) {
  if (n <= 0) return;
  const before = v.aq[id] || 0;
  put(v.aq, id, n);
  if (parent && (!v.parent[id] || n >= before)) v.parent[id] = parent;
}

export function isEmpty(v: Vessel): boolean {
  return v.volume < 0.005 && Object.keys(v.solids).length === 0;
}

export function waterVolume(v: Vessel): number {
  return Math.max(0, v.volume - v.concVol);
}

/** Raise temperature by releasing q joules into the vessel contents. */
export function release(v: Vessel, joules: number): number {
  const mass = Math.max(0.5, waterVolume(v) + v.concVol * 1.84);
  const dT = joules / (4.18 * mass);
  v.temp = Math.min(v.volume > 0.01 ? 100 : 300, v.temp + dT);
  return dT;
}

export function addGas(v: Vessel, id: string, amount: number, now: number) {
  if (amount <= EPS) return;
  const seconds = Math.min(9, 2.5 + amount * 1.2);
  v.fx.gas = v.fx.gas.filter((g) => g.until > now);
  const prev = v.fx.gas.find((g) => g.id === id);
  if (prev) {
    prev.amount += amount;
    prev.until = Math.max(prev.until, now + seconds * 1000);
  } else {
    v.fx.gas.push({ id, amount, at: now, until: now + seconds * 1000 });
  }
}

export type PrecipColor = ColorKey;

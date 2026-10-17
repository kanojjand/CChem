// Helpers shared by the reaction rules.

import { compound, hasCompound, type ColorKey } from './data';
import { EPS, amt, putIon, take, type ReactionEvent, type Vessel } from './vessel';

export interface Ctx {
  now: number;
  aqueousAddedToConc: boolean;
  limited: Set<string>;
  /** Seconds of lab time since the last settle; 0 right after an action. Slow processes use it. */
  dt?: number;
}

export type Rule = (v: Vessel, ctx: Ctx) => ReactionEvent | null;

export function counterIon(compoundId: string, ion: string): string | undefined {
  if (!hasCompound(compoundId)) return undefined;
  const d = compound(compoundId);
  if (d.cation === ion) return d.anion;
  if (d.anion === ion) return d.cation;
  return undefined;
}

export const parentOf = (v: Vessel, ion: string, fallback: string) => v.parent[ion] || fallback;

export function acidOf(v: Vessel) {
  const parent = parentOf(v, 'H^+', 'HCl');
  return { parent, anion: counterIon(parent, 'H^+') || 'Cl^-' };
}

export function baseOf(v: Vessel) {
  const parent = parentOf(v, 'OH^-', 'NaOH');
  return { parent, cation: counterIon(parent, 'OH^-') || 'Na^+' };
}

export function setParent(v: Vessel, ions: (string | undefined)[], parent: string) {
  for (const ion of ions) if (ion && amt(v.aq, ion) > EPS) v.parent[ion] = parent;
}

export const colorOf = (formula: string): ColorKey => (hasCompound(formula) && compound(formula).color) || 'white';

export interface Donor { id: 'H^+' | 'CH3COOH'; parent: string; anion: string; amount: number }

export function donors(v: Vessel, weakOk: boolean): Donor[] {
  const out: Donor[] = [];
  const h = amt(v.aq, 'H^+');
  if (h > EPS) {
    const a = acidOf(v);
    out.push({ id: 'H^+', parent: a.parent, anion: a.anion, amount: h });
  }
  const w = amt(v.aq, 'CH3COOH');
  if (weakOk && w > EPS) out.push({ id: 'CH3COOH', parent: 'CH3COOH', anion: 'CH3COO^-', amount: w });
  return out;
}

export function consume(v: Vessel, d: Donor, n: number, saltId: string) {
  take(v.aq, d.id, n);
  if (d.id === 'CH3COOH') putIon(v, 'CH3COO^-', n, saltId);
  else setParent(v, [d.anion], saltId);
}

export const ev = (e: Omit<ReactionEvent, 'p' | 'signs'> & Partial<Pick<ReactionEvent, 'p' | 'signs'>>): ReactionEvent =>
  ({ p: {}, signs: [], ...e });

/** True once per settle for the given key: slow processes take one step per settle. */
export function once(ctx: Ctx, key: string): boolean {
  if (ctx.limited.has(key)) return false;
  ctx.limited.add(key);
  return true;
}

/** Arrhenius-like speed-up: about twice as fast for every 10 °C above 20 °C. */
export const warmth = (t: number) => Math.pow(2, (t - 20) / 10);

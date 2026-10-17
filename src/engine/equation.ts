import { balance } from './balance';
import { compound, hasCompound, IONS, METALS } from './data';

export type Cond = 't' | 'MnO2' | 'H2SO4c' | 'el';

export interface EqSpec {
  reactants: string[];
  products: string[];
  gas?: string[];
  precip?: string[];
  cond?: Cond;
  conc?: string;          // reactant written as concentrated (e.g. H2SO4)
  noReaction?: boolean;
  k?: number[];           // coefficients given by hand when the balancer has more than one answer
  dry?: boolean;          // between solids, without water: no ionic equations
  solid?: string[];       // reactants taken as a solid or a suspension: written whole in ionic equations
  colloid?: string[];     // products that stay in the liquid as a sol: no precipitate arrow
}

export interface Term { f: string; k: number; mark?: '↓' | '↑'; conc?: boolean }
export interface Side { lhs: Term[]; rhs: Term[] }
export interface Equations {
  molecular: Side & { noReaction?: boolean; cond?: Cond };
  fullIonic?: Side;
  netIonic?: Side;
}

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : Math.abs(a); }

/**
 * Ions a compound splits into in a school ionic equation, or null when it is written whole.
 * Only concentrated sulfuric acid stays a molecule: concentrated hydrochloric and nitric acids
 * are still fully dissociated and are written as ions.
 */
function ionsOf(id: string, eq: EqSpec): { ion: string; n: number }[] | null {
  if (eq.precip?.includes(id) || eq.gas?.includes(id) || eq.solid?.includes(id)) return null;
  if (eq.conc === id && id === 'H2SO4') return null;
  if (!hasCompound(id)) return null;
  const def = compound(id);
  if (def.electrolyte !== 'strong' || !def.cation || !def.anion) return null;
  return [{ ion: def.cation, n: def.nCat || 1 }, { ion: def.anion, n: def.nAn || 1 }];
}

/** Does the reaction run in solution: at least one reactant is dissolved (or is water itself)? */
function inSolution(eq: EqSpec): boolean {
  if (eq.dry) return false;
  return eq.reactants.some((f) => f === 'H2O' || (hasCompound(f) && compound(f).phase === 'aq' && !eq.solid?.includes(f)));
}

/**
 * Insoluble product of a reaction in solution: it comes out as a precipitate (↓).
 * Metals deposited on another metal or on an electrode are written without an arrow.
 */
const isMetal = (f: string) => !!METALS[f] || f === 'Co' || f === 'Cr' || f === 'Hg';

function precipitates(f: string, eq: EqSpec): boolean {
  if (eq.reactants.includes(f) || eq.colloid?.includes(f) || isMetal(f) || f === 'H2O(s)' || !hasCompound(f)) return false;
  return compound(f).phase === 's' && inSolution(eq);
}

export function buildEquations(eq: EqSpec): Equations | null {
  const mark = (f: string): Term['mark'] =>
    eq.precip?.includes(f) ? '↓' : eq.gas?.includes(f) ? '↑' : precipitates(f, eq) ? '↓' : undefined;

  if (eq.noReaction) {
    return {
      molecular: {
        lhs: eq.reactants.map((f) => ({ f, k: 1, conc: eq.conc === f })),
        rhs: [],
        noReaction: true,
        cond: eq.cond
      }
    };
  }

  let k: number[] | null;
  try { k = eq.k ?? balance(eq.reactants, eq.products); } catch { return null; }
  if (!k) return null;
  const nr = eq.reactants.length;
  const molecular: Equations['molecular'] = {
    lhs: eq.reactants.map((f, i) => ({ f, k: k[i], conc: eq.conc === f })),
    rhs: eq.products.map((f, i) => ({ f, k: k[nr + i], mark: mark(f) })),
    cond: eq.cond
  };

  // Full ionic: strong soluble electrolytes are split into ions.
  const expand = (terms: Term[]) => {
    const out: Term[] = [];
    let any = false;
    for (const t of terms) {
      const ions = ionsOf(t.f, eq);
      if (!ions) { out.push({ ...t }); continue; }
      any = true;
      for (const { ion, n } of ions) out.push({ f: ion, k: t.k * n });
    }
    return { terms: out, any };
  };
  if (eq.dry) return { molecular };
  const L = expand(molecular.lhs);
  const Rr = expand(molecular.rhs);
  if (!L.any && !Rr.any) return { molecular };

  const merge = (terms: Term[]) => {
    const m = new Map<string, Term>();
    for (const t of terms) {
      const prev = m.get(t.f);
      if (prev) prev.k += t.k;
      else m.set(t.f, { ...t });
    }
    return [...m.values()];
  };
  const fullL = merge(L.terms);
  const fullR = merge(Rr.terms);

  // Net ionic: cancel what appears unchanged on both sides.
  const netL = fullL.map((t) => ({ ...t }));
  const netR = fullR.map((t) => ({ ...t }));
  for (const a of netL) {
    const b = netR.find((x) => x.f === a.f);
    if (b) { const c = Math.min(a.k, b.k); a.k -= c; b.k -= c; }
  }
  let nl = netL.filter((t) => t.k > 0);
  let nrr = netR.filter((t) => t.k > 0);
  const g = [...nl, ...nrr].reduce((acc, t) => gcd(acc, t.k), 0) || 1;
  nl = nl.map((t) => ({ ...t, k: t.k / g }));
  nrr = nrr.map((t) => ({ ...t, k: t.k / g }));

  const hasIon = (ts: Term[]) => ts.some((t) => t.f in IONS);
  return {
    molecular,
    fullIonic: { lhs: fullL, rhs: fullR },
    netIonic: hasIon(nl) || hasIon(nrr) ? { lhs: nl, rhs: nrr } : undefined
  };
}

import { balance } from './balance';
import { compound, hasCompound, IONS } from './data';

export type Cond = 't' | 'MnO2' | 'H2SO4c' | 'el';

export interface EqSpec {
  reactants: string[];
  products: string[];
  gas?: string[];
  precip?: string[];
  cond?: Cond;
  conc?: string;          // reactant written as concentrated (e.g. H2SO4)
  noReaction?: boolean;
}

export interface Term { f: string; k: number; mark?: '↓' | '↑'; conc?: boolean }
export interface Side { lhs: Term[]; rhs: Term[] }
export interface Equations {
  molecular: Side & { noReaction?: boolean; cond?: Cond };
  fullIonic?: Side;
  netIonic?: Side;
}

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : Math.abs(a); }

/** Ions a compound splits into in a school ionic equation, or null when it is written whole. */
function ionsOf(id: string, eq: EqSpec): { ion: string; n: number }[] | null {
  if (eq.precip?.includes(id) || eq.gas?.includes(id)) return null;
  if (eq.conc === id) return null;
  if (!hasCompound(id)) return null;
  const def = compound(id);
  if (def.electrolyte !== 'strong' || !def.cation || !def.anion) return null;
  return [{ ion: def.cation, n: def.nCat || 1 }, { ion: def.anion, n: def.nAn || 1 }];
}

export function buildEquations(eq: EqSpec): Equations | null {
  const mark = (f: string): Term['mark'] =>
    eq.precip?.includes(f) ? '↓' : eq.gas?.includes(f) ? '↑' : undefined;

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

  const k = balance(eq.reactants, eq.products);
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

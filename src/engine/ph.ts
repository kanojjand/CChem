import { IONS } from './data';

// pH from a charge balance over the dissolved species.
// Free H+ and OH- are not passed in: the balance itself decides how much of them there is,
// and weak acid/base pairs are distributed by their pKa at that pH.

const KW = 1e-14;

interface WeakSystem { c: number; pKa: number[]; baseCharge: number } // charge of the fully deprotonated form

export function solvePH(aq: Record<string, number>, volumeMl: number): number | null {
  if (volumeMl < 0.01) return null;
  if ((aq['H2SO4c'] || 0) > 1e-9) return -1;

  const conc = (id: string) => (aq[id] || 0) / volumeMl; // mmol/mL == mol/L
  let fixed = 0;
  const weak: WeakSystem[] = [];

  for (const id in aq) {
    const amt = aq[id];
    if (amt <= 1e-12) continue;
    if (id === 'H^+' || id === 'OH^-') continue;
    const ion = IONS[id];
    if (!ion) continue; // neutral molecules are handled below or ignored
    if (['CH3COO^-', 'NH4^+', 'HCO3^-', 'CO3^2-', 'PO4^3-', 'SiO3^2-'].includes(id)) continue;
    if (ion.hydrolysisPKa != null) {
      // Hydrated metal ion acts as a weak monoprotic acid: M(n+) <-> MOH((n-1)+) + H+
      weak.push({ c: amt / volumeMl, pKa: [ion.hydrolysisPKa], baseCharge: ion.charge - 1 });
      continue;
    }
    fixed += ion.charge * (amt / volumeMl);
  }

  const acetate = conc('CH3COOH') + conc('CH3COO^-');
  if (acetate > 0) weak.push({ c: acetate, pKa: [4.76], baseCharge: -1 });
  const ammonia = conc('NH3') + conc('NH4^+');
  if (ammonia > 0) weak.push({ c: ammonia, pKa: [9.25], baseCharge: 0 });
  const carbonate = conc('HCO3^-') + conc('CO3^2-');
  if (carbonate > 0) weak.push({ c: carbonate, pKa: [6.35, 10.33], baseCharge: -2 });
  const phosphate = conc('PO4^3-');
  if (phosphate > 0) weak.push({ c: phosphate, pKa: [2.15, 7.2, 12.35], baseCharge: -3 });
  const silicate = conc('SiO3^2-');
  if (silicate > 0) weak.push({ c: silicate, pKa: [9.8, 12.0], baseCharge: -2 });

  // Net charge as a function of h = [H+]; increasing in h.
  const balance = (h: number): number => {
    let q = h - KW / h + fixed;
    for (const w of weak) {
      const n = w.pKa.length;
      const K = w.pKa.map((p) => Math.pow(10, -p));
      // Terms for species with i protons removed, i = 0..n
      const terms: number[] = [];
      let prod = 1;
      for (let i = 0; i <= n; i++) {
        terms.push(prod * Math.pow(h, n - i));
        if (i < n) prod *= K[i];
      }
      const D = terms.reduce((a, b) => a + b, 0);
      let avgCharge = 0;
      for (let i = 0; i <= n; i++) avgCharge += (terms[i] / D) * (w.baseCharge + (n - i));
      q += w.c * avgCharge;
    }
    return q;
  };

  let lo = -1.2; // log10 h
  let hi = 15.5;
  // balance(10^-pH) decreases with pH; find pH where it crosses zero.
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (balance(Math.pow(10, -mid)) > 0) lo = mid;
    else hi = mid;
  }
  const pH = (lo + hi) / 2;
  return Math.max(-1, Math.min(15, pH));
}

export type Medium = 'acid' | 'neutral' | 'alkaline';
export function medium(pH: number): Medium {
  if (pH < 6.5) return 'acid';
  if (pH > 7.5) return 'alkaline';
  return 'neutral';
}

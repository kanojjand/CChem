import { IONS } from './data';

// pH from a charge balance over the dissolved species.
// Free H+ and OH- are not passed in: the balance itself decides how much of them there is,
// and weak acid/base pairs are distributed by their pKa at that pH.

const KW = 1e-14;
// Ions that take part in acid/base equilibria below instead of counting as fixed charge.
const WEAK_IONS = [
  'CH3COO^-', 'NH4^+', 'HCO3^-', 'CO3^2-', 'PO4^3-', 'SiO3^2-', 'S^2-', 'SO3^2-',
  'SO4^2-', 'HSO4^-', 'CrO4^2-', 'Cr2O7^2-',
  '[Al(OH)4]^-', '[Zn(OH)4]^2-', '[Pb(OH)4]^2-', '[Sn(OH)4]^2-', '[Cr(OH)6]^3-'
];

interface WeakSystem {
  c: number;
  pKa: number[];
  baseCharge: number; // charge of the fully deprotonated form
  floor?: number;     // [H+] below which the base takes no protons at all
}

// Suspended solids that set the pH of the water around them (magnesia: phenolphthalein turns pink).
// Solubility products at 20 °C; MgO hydrates at its surface and behaves like Mg(OH)2.
const SUSPENSIONS: Record<string, { cation: string; n: number; ksp: number }> = {
  'Mg(OH)2': { cation: 'Mg^2+', n: 2, ksp: 5.6e-12 },
  MgO: { cation: 'Mg^2+', n: 2, ksp: 5.6e-12 }
};

export function solvePH(aq: Record<string, number>, volumeMl: number, solids: Record<string, number> = {}): number | null {
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
    if (WEAK_IONS.includes(id)) continue;
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
  const carbonate = conc('HCO3^-') + conc('CO3^2-') + conc('CO2');
  if (carbonate > 0) weak.push({ c: carbonate, pKa: [6.35, 10.33], baseCharge: -2 });
  const phosphate = conc('PO4^3-');
  if (phosphate > 0) weak.push({ c: phosphate, pKa: [2.15, 7.2, 12.35], baseCharge: -3 });
  const silicate = conc('SiO3^2-');
  if (silicate > 0) weak.push({ c: silicate, pKa: [9.8, 12.0], baseCharge: -2 });
  // H2S / HS- / S2- (school-book values of the constants).
  const sulfide = conc('S^2-') + conc('H2S');
  if (sulfide > 0) weak.push({ c: sulfide, pKa: [7.0, 12.9], baseCharge: -2 });
  // SO2·H2O / HSO3- / SO3^2-.
  const sulfite = conc('SO3^2-') + conc('SO2');
  if (sulfite > 0) weak.push({ c: sulfite, pKa: [1.8, 7.2], baseCharge: -2 });
  // The second step of sulfuric acid is not complete: HSO4- <-> SO4^2- + H+.
  const sulfate = conc('SO4^2-') + conc('HSO4^-');
  // Sulfate is far too weak a base to make a salt solution alkaline (Na2SO4 is neutral):
  // it only takes protons back in acidic solutions.
  if (sulfate > 0) weak.push({ c: sulfate, pKa: [1.99], baseCharge: -2, floor: 1e-6 });
  const chromate = conc('CrO4^2-');
  if (chromate > 0) weak.push({ c: chromate, pKa: [6.5], baseCharge: -2 });
  // Cr2O7^2- + H2O <-> 2CrO4^2- + 2H+ makes dichromate solutions acidic (0.1 M K2Cr2O7: pH about 4).
  const dichromate = conc('Cr2O7^2-');
  if (dichromate > 0) weak.push({ c: dichromate, pKa: [7], baseCharge: -3 });
  // Hydroxo complexes are bases: [Al(OH)4]- + H+ <-> Al(OH)3 + H2O (aluminate solutions are strongly alkaline).
  for (const [id, pKa, charge] of [['[Al(OH)4]^-', 12.3, -1], ['[Zn(OH)4]^2-', 13, -2], ['[Pb(OH)4]^2-', 13, -2], ['[Sn(OH)4]^2-', 13, -2], ['[Cr(OH)6]^3-', 13.5, -3]] as [string, number, number][]) {
    const c = conc(id);
    if (c > 0) weak.push({ c, pKa: [pKa], baseCharge: charge });
  }
  // Chlorine water: Cl2 + H2O <-> HCl + HClO.
  const chlorine = conc('Cl2');
  if (chlorine > 0) weak.push({ c: chlorine, pKa: [2.7], baseCharge: -1 });

  const suspended = Object.keys(solids)
    .filter((id) => SUSPENSIONS[id] && solids[id] > 1e-9)
    .map((id) => ({ ...SUSPENSIONS[id], max: solids[id] / volumeMl }));

  // Net charge as a function of h = [H+]; increasing in h.
  const balance = (h: number): number => {
    let q = h - KW / h + fixed;
    // A suspended hydroxide dissolves until [M][OH]^n reaches its solubility product.
    for (const sus of suspended) q += sus.n * Math.min(sus.max, sus.ksp / Math.pow(KW / h, sus.n));
    for (const w of weak) {
      const h1 = w.floor ? Math.max(0, h - w.floor) : h;
      const n = w.pKa.length;
      const K = w.pKa.map((p) => Math.pow(10, -p));
      // Terms for species with i protons removed, i = 0..n
      const terms: number[] = [];
      let prod = 1;
      for (let i = 0; i <= n; i++) {
        terms.push(prod * Math.pow(h1, n - i));
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

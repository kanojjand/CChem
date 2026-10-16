// Reaction rules. Each rule looks at a vessel, changes it when its condition holds and
// returns an event describing what happened. `settle` runs them in priority order until
// nothing changes: acid–base first, then metals, then complexes and precipitates.

import {
  IONS, METALS, SOLUBLE_SOLIDS, activity, compound, hasCompound, salt, solubility, type ColorKey
} from './data';
import {
  EPS, addGas, amt, put, putIon, release, take, waterVolume,
  type ReactionEvent, type Vessel
} from './vessel';

export interface Ctx {
  now: number;
  aqueousAddedToConc: boolean;
  limited: Set<string>;
}

type Rule = (v: Vessel, ctx: Ctx) => ReactionEvent | null;

// ---------------------------------------------------------------- helpers

function counterIon(compoundId: string, ion: string): string | undefined {
  if (!hasCompound(compoundId)) return undefined;
  const d = compound(compoundId);
  if (d.cation === ion) return d.anion;
  if (d.anion === ion) return d.cation;
  return undefined;
}

const parentOf = (v: Vessel, ion: string, fallback: string) => v.parent[ion] || fallback;

function acidOf(v: Vessel) {
  const parent = parentOf(v, 'H^+', 'HCl');
  return { parent, anion: counterIon(parent, 'H^+') || 'Cl^-' };
}

function baseOf(v: Vessel) {
  const parent = parentOf(v, 'OH^-', 'NaOH');
  return { parent, cation: counterIon(parent, 'OH^-') || 'Na^+' };
}

function setParent(v: Vessel, ions: (string | undefined)[], parent: string) {
  for (const ion of ions) if (ion && amt(v.aq, ion) > EPS) v.parent[ion] = parent;
}

const colorOf = (formula: string): ColorKey => (hasCompound(formula) && compound(formula).color) || 'white';

interface Donor { id: 'H^+' | 'CH3COOH'; parent: string; anion: string; amount: number }

function donors(v: Vessel, weakOk: boolean): Donor[] {
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

function consume(v: Vessel, d: Donor, n: number, saltId: string) {
  take(v.aq, d.id, n);
  if (d.id === 'CH3COOH') putIon(v, 'CH3COO^-', n, saltId);
  else setParent(v, [d.anion], saltId);
}

const ev = (e: Omit<ReactionEvent, 'p' | 'signs'> & Partial<Pick<ReactionEvent, 'p' | 'signs'>>): ReactionEvent =>
  ({ p: {}, signs: [], ...e });

// ---------------------------------------------------------------- concentrated sulfuric acid

const concDilution: Rule = (v, ctx) => {
  const c = amt(v.aq, 'H2SO4c');
  if (c <= EPS || waterVolume(v) <= 0.05) return null;
  take(v.aq, 'H2SO4c', c);
  putIon(v, 'H^+', 2 * c, 'H2SO4');
  putIon(v, 'SO4^2-', c, 'H2SO4');
  v.concVol = 0;
  const dT = release(v, 95 * c);
  const unsafe = ctx.aqueousAddedToConc;
  if (unsafe) v.fx.splashAt = ctx.now;
  return ev({
    kind: unsafe ? 'dilutionUnsafe' : 'dilutionSafe', importance: unsafe ? 3 : 2, type: 'physical',
    signs: ['heat'], safety: unsafe ? 'acidWater' : undefined, dT, key: unsafe ? 'dilution-unsafe' : 'dilution'
  });
};

const concSugar: Rule = (v, ctx) => {
  const sugar = amt(v.solids, 'C12H22O11');
  if (amt(v.aq, 'H2SO4c') <= EPS || waterVolume(v) > 0.05 || sugar <= EPS) return null;
  take(v.solids, 'C12H22O11', sugar);
  put(v.solids, 'C', 12 * sugar);
  v.fx.charAt = ctx.now;
  const before = v.temp;
  v.temp = Math.min(130, v.temp + 70);
  addGas(v, 'SO2', sugar * 2, ctx.now);
  v.fx.smellAt = ctx.now;
  return ev({
    kind: 'sugarChar', importance: 3, type: 'decomposition',
    eq: { reactants: ['C12H22O11'], products: ['C', 'H2O'], cond: 'H2SO4c' },
    signs: ['color', 'heat', 'gas', 'smell'], safety: 'fumeHood', dT: v.temp - before, key: 'sugar-char'
  });
};

const concMetal: Rule = (v, ctx) => {
  const acid = amt(v.aq, 'H2SO4c');
  if (acid <= EPS || waterVolume(v) > 0.05 || v.temp < 80 || ctx.limited.has('concMetal')) return null;
  for (const m of ['Cu', 'Ag']) {
    const n = amt(v.solids, m);
    if (n <= EPS) continue;
    const perMetal = m === 'Cu' ? 2 : 1;
    const e = Math.min(n, 0.4, acid / perMetal);
    if (e <= EPS) continue;
    ctx.limited.add('concMetal');
    const ion = METALS[m].ion;
    const s = salt(ion, 'SO4^2-').id;
    take(v.solids, m, e);
    take(v.aq, 'H2SO4c', perMetal * e);
    putIon(v, ion, e, s);
    putIon(v, 'SO4^2-', m === 'Cu' ? e : e / 2, s);
    addGas(v, 'SO2', m === 'Cu' ? e : e / 2, ctx.now);
    v.fx.smellAt = ctx.now;
    return ev({
      kind: 'cuConcAcid', importance: 2, type: 'redox',
      eq: { reactants: [m, 'H2SO4'], products: [s, 'SO2', 'H2O'], conc: 'H2SO4', cond: 't', gas: ['SO2'] },
      p: { metal: m }, signs: ['gas', 'smell', 'color'], safety: 'fumeHood', key: 'cu-conc-h2so4'
    });
  }
  return null;
};

// ---------------------------------------------------------------- active metals

const alkaliMetal: Rule = (v, ctx) => {
  for (const m of ['Na', 'Ca']) {
    const n = amt(v.solids, m);
    if (n <= EPS) continue;
    const hasWater = waterVolume(v) > 0.05;
    const h = amt(v.aq, 'H^+');
    if (!hasWater && h <= EPS) continue;
    const met = METALS[m];
    const z = IONS[met.ion].charge;
    const acid = acidOf(v);
    const fromAcid = Math.min(n, h / z);
    const consumed = hasWater ? n : fromAcid;
    take(v.solids, m, consumed);
    let h2 = 0;
    if (fromAcid > EPS) {
      take(v.aq, 'H^+', fromAcid * z);
      putIon(v, met.ion, fromAcid, salt(met.ion, acid.anion).id);
      h2 += (fromAcid * z) / 2;
    }
    const rest = n - fromAcid;
    const base = salt(met.ion, 'OH^-').id;
    if (rest > EPS && hasWater) {
      putIon(v, met.ion, rest, base);
      putIon(v, 'OH^-', rest * z, base);
      h2 += (rest * z) / 2;
    }
    addGas(v, 'H2', h2, ctx.now);
    const dT = release(v, met.heatWater * consumed);
    // A pea-sized piece (about 0.1 g, 4–5 mmol) skates on the water; from about 0.3 g the vessel bursts.
    const boom = m === 'Na' && consumed >= 13 && hasWater;
    if (boom) v.fx.boomAt = ctx.now;
    else if (m === 'Na') v.fx.runAt = ctx.now;
    const withWater = rest >= fromAcid;
    return ev({
      kind: withWater ? 'activeMetalWater' : 'metalAcid', importance: boom ? 3 : 2, type: 'substitution',
      eq: withWater
        ? { reactants: [m, 'H2O'], products: [base, 'H2'], gas: ['H2'] }
        : { reactants: [m, acid.parent], products: [salt(met.ion, acid.anion).id, 'H2'], gas: ['H2'] },
      p: { metal: m, acid: acid.parent }, signs: ['gas', 'heat'],
      safety: boom ? 'bigSodium' : m === 'Na' ? 'sodiumWater' : undefined, dT,
      key: withWater ? `metal-water:${m}` : `metal-acid:${m}`
    });
  }
  return null;
};

// ---------------------------------------------------------------- acids and bases

const neutralization: Rule = (v) => {
  const n = Math.min(amt(v.aq, 'H^+'), amt(v.aq, 'OH^-'));
  if (n <= EPS) return null;
  const acid = acidOf(v);
  const base = baseOf(v);
  take(v.aq, 'H^+', n);
  take(v.aq, 'OH^-', n);
  const dT = release(v, 57 * n);
  const s = salt(base.cation, acid.anion).id;
  setParent(v, [base.cation, acid.anion], s);
  return ev({
    kind: 'neutralization', importance: 1, type: 'neutralization',
    eq: { reactants: [acid.parent, base.parent], products: [s, 'H2O'] },
    p: { acid: acid.parent, base: base.parent, salt: s }, signs: dT > 2 ? ['heat'] : [], dT, key: 'neutralization'
  });
};

const weakAcidBase: Rule = (v) => {
  const n = Math.min(amt(v.aq, 'CH3COOH'), amt(v.aq, 'OH^-'));
  if (n <= EPS) return null;
  const base = baseOf(v);
  const s = salt(base.cation, 'CH3COO^-').id;
  take(v.aq, 'CH3COOH', n);
  take(v.aq, 'OH^-', n);
  putIon(v, 'CH3COO^-', n, s);
  setParent(v, [base.cation], s);
  const dT = release(v, 56 * n);
  return ev({
    kind: 'neutralization', importance: 1, type: 'neutralization',
    eq: { reactants: ['CH3COOH', base.parent], products: [s, 'H2O'] },
    p: { acid: 'CH3COOH', base: base.parent, salt: s }, signs: dT > 2 ? ['heat'] : [], dT, key: 'neutralization-weak'
  });
};

const ammoniumBase: Rule = (v, ctx) => {
  const n = Math.min(amt(v.aq, 'NH4^+'), amt(v.aq, 'OH^-'));
  if (n <= EPS) return null;
  const nh4Parent = parentOf(v, 'NH4^+', 'NH4Cl');
  const anion = counterIon(nh4Parent, 'NH4^+') || 'Cl^-';
  const base = baseOf(v);
  const s = salt(base.cation, anion).id;
  take(v.aq, 'NH4^+', n);
  take(v.aq, 'OH^-', n);
  put(v.aq, 'NH3', n);
  v.parent['NH3'] = 'NH3·H2O';
  setParent(v, [base.cation, anion], s);
  v.fx.smellAt = ctx.now;
  return ev({
    kind: 'ammonia', importance: 2, type: 'exchange',
    eq: { reactants: [nh4Parent, base.parent], products: [s, 'NH3', 'H2O'], gas: ['NH3'] },
    p: { salt: nh4Parent }, signs: ['smell'], safety: 'ammoniaSmell', key: 'ammonium-alkali'
  });
};

const ammoniaAcid: Rule = (v) => {
  const nh3 = amt(v.aq, 'NH3');
  if (nh3 <= EPS) return null;
  const h = amt(v.aq, 'H^+');
  if (h > EPS) {
    const n = Math.min(nh3, h);
    const acid = acidOf(v);
    const s = salt('NH4^+', acid.anion).id;
    take(v.aq, 'NH3', n);
    take(v.aq, 'H^+', n);
    putIon(v, 'NH4^+', n, s);
    setParent(v, [acid.anion], s);
    const dT = release(v, 52 * n);
    return ev({
      kind: 'neutralization', importance: 1, type: 'neutralization',
      eq: { reactants: ['NH3·H2O', acid.parent], products: [s, 'H2O'] },
      p: { acid: acid.parent, base: 'NH3·H2O', salt: s }, signs: dT > 2 ? ['heat'] : [], dT, key: 'neutralization-ammonia'
    });
  }
  const w = amt(v.aq, 'CH3COOH');
  if (w > EPS) {
    const n = Math.min(nh3, w);
    take(v.aq, 'NH3', n);
    take(v.aq, 'CH3COOH', n);
    putIon(v, 'NH4^+', n, 'CH3COONH4');
    putIon(v, 'CH3COO^-', n, 'CH3COONH4');
    return ev({
      kind: 'neutralization', importance: 1, type: 'neutralization',
      eq: { reactants: ['NH3·H2O', 'CH3COOH'], products: ['CH3COONH4', 'H2O'] },
      p: { acid: 'CH3COOH', base: 'NH3·H2O', salt: 'CH3COONH4' }, key: 'neutralization-ammonia'
    });
  }
  return null;
};

const bicarbonateBase: Rule = (v) => {
  const n = Math.min(amt(v.aq, 'HCO3^-'), amt(v.aq, 'OH^-'));
  if (n <= EPS) return null;
  const bParent = parentOf(v, 'HCO3^-', 'NaHCO3');
  const cat = counterIon(bParent, 'HCO3^-') || 'Na^+';
  const base = baseOf(v);
  const s = salt(cat, 'CO3^2-').id;
  take(v.aq, 'HCO3^-', n);
  take(v.aq, 'OH^-', n);
  putIon(v, 'CO3^2-', n, s);
  const products = [s];
  if (base.cation !== cat) products.push(salt(base.cation, 'CO3^2-').id);
  products.push('H2O');
  return ev({ kind: 'minor', importance: 0, type: 'neutralization', eq: { reactants: [bParent, base.parent], products } });
};

function carbonateWith(v: Vessel, ctx: Ctx, d: Donor): ReactionEvent | null {
  const a = amt(v.aq, 'CO3^2-');
  if (a <= EPS) return null;
  const cParent = parentOf(v, 'CO3^2-', 'Na2CO3');
  const cat = counterIon(cParent, 'CO3^2-') || 'Na^+';
  const s = salt(cat, d.anion).id;
  const hco3Salt = salt(cat, 'HCO3^-').id;
  const h = d.amount;
  if (h <= a + EPS) {
    take(v.aq, 'CO3^2-', h);
    consume(v, d, h, s);
    putIon(v, 'HCO3^-', h, hco3Salt);
    return ev({
      kind: 'bicarbonateFirst', importance: 1, type: 'exchange',
      eq: { reactants: [cParent, d.parent], products: [hco3Salt, s] }, p: { carbonate: cParent }, key: 'bicarbonate-first'
    });
  }
  const co2 = Math.min(a, h - a);
  take(v.aq, 'CO3^2-', a);
  consume(v, d, a + co2, s);
  if (a - co2 > EPS) putIon(v, 'HCO3^-', a - co2, hco3Salt);
  setParent(v, [cat], s);
  addGas(v, 'CO2', co2, ctx.now);
  return ev({
    kind: 'gasCO2', importance: 2, type: 'exchange',
    eq: { reactants: [cParent, d.parent], products: [s, 'H2O', 'CO2'], gas: ['CO2'] },
    p: { carbonate: cParent, acid: d.parent }, signs: ['gas'], key: 'carbonate-acid'
  });
}

function bicarbonateWith(v: Vessel, ctx: Ctx, d: Donor): ReactionEvent | null {
  const n = Math.min(amt(v.aq, 'HCO3^-'), d.amount);
  if (n <= EPS) return null;
  const bParent = parentOf(v, 'HCO3^-', 'NaHCO3');
  const cat = counterIon(bParent, 'HCO3^-') || 'Na^+';
  const s = salt(cat, d.anion).id;
  take(v.aq, 'HCO3^-', n);
  consume(v, d, n, s);
  setParent(v, [cat], s);
  addGas(v, 'CO2', n, ctx.now);
  return ev({
    kind: 'gasCO2', importance: 2, type: 'exchange',
    eq: { reactants: [bParent, d.parent], products: [s, 'H2O', 'CO2'], gas: ['CO2'] },
    p: { carbonate: bParent, acid: d.parent }, signs: ['gas'], key: 'bicarbonate-acid'
  });
}

const carbonateStrong: Rule = (v, ctx) => { const d = donors(v, false)[0]; return d ? carbonateWith(v, ctx, d) : null; };
const bicarbonateStrong: Rule = (v, ctx) => { const d = donors(v, false)[0]; return d ? bicarbonateWith(v, ctx, d) : null; };
const carbonateWeak: Rule = (v, ctx) => { const d = donors(v, true).find((x) => x.id === 'CH3COOH'); return d ? carbonateWith(v, ctx, d) : null; };
const bicarbonateWeak: Rule = (v, ctx) => { const d = donors(v, true).find((x) => x.id === 'CH3COOH'); return d ? bicarbonateWith(v, ctx, d) : null; };

const silicateAcid: Rule = (v, ctx) => {
  const si = amt(v.aq, 'SiO3^2-');
  if (si <= EPS) return null;
  for (const d of donors(v, true)) {
    const n = Math.min(si, d.amount / 2);
    if (n <= EPS) continue;
    const siParent = parentOf(v, 'SiO3^2-', 'Na2SiO3');
    const cat = counterIon(siParent, 'SiO3^2-') || 'Na^+';
    const s = salt(cat, d.anion).id;
    take(v.aq, 'SiO3^2-', n);
    consume(v, d, 2 * n, s);
    setParent(v, [cat], s);
    put(v.solids, 'H2SiO3', n);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'silicicGel', importance: 2, type: 'exchange',
      eq: { reactants: [siParent, d.parent], products: [s, 'H2SiO3'], precip: ['H2SiO3'] },
      p: { product: 'H2SiO3', color: 'clearGel' }, signs: ['precip'], key: 'silicic-acid'
    });
  }
  return null;
};

const acetateStrong: Rule = (v, ctx) => {
  const n = Math.min(amt(v.aq, 'CH3COO^-'), amt(v.aq, 'H^+'));
  if (n <= EPS) return null;
  const cParent = parentOf(v, 'CH3COO^-', 'CH3COONa');
  const cat = counterIon(cParent, 'CH3COO^-') || 'Na^+';
  const acid = acidOf(v);
  const s = salt(cat, acid.anion).id;
  take(v.aq, 'CH3COO^-', n);
  take(v.aq, 'H^+', n);
  put(v.aq, 'CH3COOH', n);
  setParent(v, [cat, acid.anion], s);
  v.fx.smellAt = ctx.now;
  return ev({
    kind: 'weakAcidOut', importance: 1, type: 'exchange',
    eq: { reactants: [cParent, acid.parent], products: [s, 'CH3COOH'] },
    p: { weak: 'CH3COOH' }, signs: ['smell'], key: 'acetate-acid'
  });
};

const phosphateStrong: Rule = (v) => {
  if (amt(v.aq, 'PO4^3-') <= EPS || amt(v.aq, 'H^+') <= EPS) return null;
  const pParent = parentOf(v, 'PO4^3-', 'Na3PO4');
  const acid = acidOf(v);
  if (pParent === 'H3PO4' || acid.parent === 'H3PO4') return null;
  const cat = counterIon(pParent, 'PO4^3-') || 'Na^+';
  const s = salt(cat, acid.anion).id;
  v.parent['PO4^3-'] = 'H3PO4';
  setParent(v, [cat, acid.anion], s);
  return ev({
    kind: 'weakAcidOut', importance: 1, type: 'exchange',
    eq: { reactants: [pParent, acid.parent], products: [s, 'H3PO4'] }, p: { weak: 'H3PO4' }, key: 'phosphate-acid'
  });
};

const complexAcid: Rule = (v, ctx) => {
  const h = amt(v.aq, 'H^+');
  if (h <= EPS) return null;
  const acid = acidOf(v);
  const hydroxo: [string, string, number][] = [['[Zn(OH)4]^2-', 'Zn(OH)2', 2], ['[Al(OH)4]^-', 'Al(OH)3', 1]];
  for (const [cx, hyd, need] of hydroxo) {
    const n = Math.min(amt(v.aq, cx), h / need);
    if (n <= EPS) continue;
    const cxParent = parentOf(v, cx, salt('Na^+', cx).id);
    const cat = counterIon(cxParent, cx) || 'Na^+';
    const s = salt(cat, acid.anion).id;
    take(v.aq, cx, n);
    take(v.aq, 'H^+', n * need);
    put(v.solids, hyd, n);
    setParent(v, [cat, acid.anion], s);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'complexAcid', importance: 2, type: 'exchange',
      eq: { reactants: [cxParent, acid.parent], products: [s, hyd, 'H2O'], precip: [hyd] },
      p: { product: hyd, color: colorOf(hyd) }, signs: ['precip'], key: `complex-acid:${hyd}`
    });
  }
  const ammines: [string, string, number][] = [['[Cu(NH3)4]^2+', 'Cu^2+', 4], ['[Zn(NH3)4]^2+', 'Zn^2+', 4], ['[Ag(NH3)2]^+', 'Ag^+', 2]];
  for (const [cx, metalIon, nh3] of ammines) {
    const n = Math.min(amt(v.aq, cx), h / nh3);
    if (n <= EPS) continue;
    const cxParent = parentOf(v, cx, salt(cx, 'OH^-').id);
    const counter = counterIon(cxParent, cx) || 'OH^-';
    take(v.aq, cx, n);
    take(v.aq, 'H^+', n * nh3);
    const metalSalt = salt(metalIon, counter === 'OH^-' ? acid.anion : counter).id;
    const ammSalt = salt('NH4^+', acid.anion).id;
    putIon(v, metalIon, n, metalSalt);
    putIon(v, 'NH4^+', n * nh3, ammSalt);
    const products = [metalSalt, ammSalt];
    if (counter === 'OH^-') products.push('H2O');
    return ev({
      kind: 'complexAcid', importance: 2, type: 'complex',
      eq: { reactants: [cxParent, acid.parent], products },
      p: { product: metalIon }, signs: metalIon === 'Cu^2+' ? ['color'] : [], key: `complex-acid:${cx}`
    });
  }
  return null;
};

interface BasicSolid { cation: string; nCat: number; h: number; kind: 'hydroxide' | 'carbonate' | 'oxide' | 'phosphate'; weak: boolean; heat?: boolean; co2?: number; po4?: number }

const BASIC_SOLIDS: Record<string, BasicSolid> = {
  'Cu(OH)2': { cation: 'Cu^2+', nCat: 1, h: 2, kind: 'hydroxide', weak: true },
  'Fe(OH)2': { cation: 'Fe^2+', nCat: 1, h: 2, kind: 'hydroxide', weak: true },
  'Fe(OH)3': { cation: 'Fe^3+', nCat: 1, h: 3, kind: 'hydroxide', weak: true },
  'Mg(OH)2': { cation: 'Mg^2+', nCat: 1, h: 2, kind: 'hydroxide', weak: true },
  'Zn(OH)2': { cation: 'Zn^2+', nCat: 1, h: 2, kind: 'hydroxide', weak: true },
  'Al(OH)3': { cation: 'Al^3+', nCat: 1, h: 3, kind: 'hydroxide', weak: true },
  'Ca(OH)2': { cation: 'Ca^2+', nCat: 1, h: 2, kind: 'hydroxide', weak: true },
  'CaCO3': { cation: 'Ca^2+', nCat: 1, h: 2, kind: 'carbonate', weak: true, co2: 1 },
  'BaCO3': { cation: 'Ba^2+', nCat: 1, h: 2, kind: 'carbonate', weak: true, co2: 1 },
  'MgCO3': { cation: 'Mg^2+', nCat: 1, h: 2, kind: 'carbonate', weak: true, co2: 1 },
  'ZnCO3': { cation: 'Zn^2+', nCat: 1, h: 2, kind: 'carbonate', weak: true, co2: 1 },
  'FeCO3': { cation: 'Fe^2+', nCat: 1, h: 2, kind: 'carbonate', weak: true, co2: 1 },
  'Ag2CO3': { cation: 'Ag^+', nCat: 2, h: 2, kind: 'carbonate', weak: true, co2: 1 },
  '(CuOH)2CO3': { cation: 'Cu^2+', nCat: 2, h: 4, kind: 'carbonate', weak: true, co2: 1 },
  'CuO': { cation: 'Cu^2+', nCat: 1, h: 2, kind: 'oxide', weak: false, heat: true },
  'CaO': { cation: 'Ca^2+', nCat: 1, h: 2, kind: 'oxide', weak: true },
  'MgO': { cation: 'Mg^2+', nCat: 1, h: 2, kind: 'oxide', weak: true },
  'ZnO': { cation: 'Zn^2+', nCat: 1, h: 2, kind: 'oxide', weak: true },
  'Fe2O3': { cation: 'Fe^3+', nCat: 2, h: 6, kind: 'oxide', weak: false, heat: true },
  'Ag2O': { cation: 'Ag^+', nCat: 2, h: 2, kind: 'oxide', weak: false },
  'Ca3(PO4)2': { cation: 'Ca^2+', nCat: 3, h: 0, kind: 'phosphate', weak: false, po4: 2 },
  'Ba3(PO4)2': { cation: 'Ba^2+', nCat: 3, h: 0, kind: 'phosphate', weak: false, po4: 2 },
  'Mg3(PO4)2': { cation: 'Mg^2+', nCat: 3, h: 0, kind: 'phosphate', weak: false, po4: 2 },
  'Zn3(PO4)2': { cation: 'Zn^2+', nCat: 3, h: 0, kind: 'phosphate', weak: false, po4: 2 },
  'Cu3(PO4)2': { cation: 'Cu^2+', nCat: 3, h: 0, kind: 'phosphate', weak: false, po4: 2 },
  'Fe3(PO4)2': { cation: 'Fe^2+', nCat: 3, h: 0, kind: 'phosphate', weak: false, po4: 2 },
  'FePO4': { cation: 'Fe^3+', nCat: 1, h: 0, kind: 'phosphate', weak: false, po4: 1 },
  'AlPO4': { cation: 'Al^3+', nCat: 1, h: 0, kind: 'phosphate', weak: false, po4: 1 },
  'Ag3PO4': { cation: 'Ag^+', nCat: 3, h: 0, kind: 'phosphate', weak: false, po4: 1 },
  'Li3PO4': { cation: 'Li^+', nCat: 3, h: 0, kind: 'phosphate', weak: false, po4: 1 }
};
export const basicSolid = (id: string) => BASIC_SOLIDS[id];

const solidAcid: Rule = (v, ctx) => {
  for (const s of Object.keys(v.solids)) {
    const info = BASIC_SOLIDS[s];
    const n = amt(v.solids, s);
    if (!info || n <= EPS) continue;
    if (info.kind === 'phosphate') {
      const h = amt(v.aq, 'H^+');
      const free = h - 3 * amt(v.aq, 'PO4^3-');
      const e = Math.min(n, free / (3 * (info.po4 || 1)));
      if (e <= EPS) continue;
      const acid = acidOf(v);
      if (acid.parent === 'H3PO4') continue;
      take(v.solids, s, e);
      putIon(v, info.cation, info.nCat * e, salt(info.cation, acid.anion).id);
      putIon(v, 'PO4^3-', (info.po4 || 1) * e, 'H3PO4');
      v.fx.dissolveAt = ctx.now;
      return ev({
        kind: 'dissolveAcid', importance: 2, type: 'exchange',
        eq: { reactants: [s, acid.parent], products: [salt(info.cation, acid.anion).id, 'H3PO4'] },
        p: { solid: s, solidKind: info.kind }, signs: ['dissolve'], key: `dissolve-acid:${s}`
      });
    }
    if (info.heat && v.temp < 60) continue;
    for (const d of donors(v, info.weak)) {
      const e = Math.min(n, d.amount / info.h);
      if (e <= EPS) continue;
      const s2 = salt(info.cation, d.anion);
      take(v.solids, s, e);
      consume(v, d, info.h * e, s2.id);
      putIon(v, info.cation, info.nCat * e, s2.id);
      const products = [s2.id, 'H2O'];
      if (info.co2) {
        products.push('CO2');
        addGas(v, 'CO2', info.co2 * e, ctx.now);
      }
      const dT = release(v, 40 * e * info.h);
      v.fx.dissolveAt = ctx.now;
      const signs: ReactionEvent['signs'] = ['dissolve'];
      if (IONS[info.cation].color) signs.push('color');
      if (info.co2) signs.push('gas');
      return ev({
        kind: 'dissolveAcid', importance: 2, type: info.kind === 'carbonate' ? 'exchange' : 'neutralization',
        eq: {
          reactants: [s, d.parent], products,
          gas: info.co2 ? ['CO2'] : undefined,
          precip: s2.phase === 's' ? [s2.id] : undefined,
          cond: info.heat ? 't' : undefined
        },
        p: { solid: s, solidKind: info.kind, salt: s2.id, acid: d.parent }, signs, dT, key: `dissolve-acid:${s}`
      });
    }
  }
  return null;
};

const amphotericBase: Rule = (v, ctx) => {
  const oh = amt(v.aq, 'OH^-');
  if (oh <= EPS) return null;
  const table: [string, number, string, boolean][] = [
    ['Zn(OH)2', 2, '[Zn(OH)4]^2-', false],
    ['Al(OH)3', 1, '[Al(OH)4]^-', false],
    ['ZnO', 2, '[Zn(OH)4]^2-', true],
    ['H2SiO3', 2, 'SiO3^2-', false]
  ];
  for (const [solid, per, product, needsWater] of table) {
    const n = amt(v.solids, solid);
    const e = Math.min(n, oh / per);
    if (e <= EPS) continue;
    const base = baseOf(v);
    const s = salt(base.cation, product).id;
    take(v.solids, solid, e);
    take(v.aq, 'OH^-', per * e);
    putIon(v, product, e, s);
    setParent(v, [base.cation], s);
    v.fx.dissolveAt = ctx.now;
    const reactants = needsWater ? [solid, base.parent, 'H2O'] : [solid, base.parent];
    const products = solid === 'H2SiO3' ? [s, 'H2O'] : [s];
    return ev({
      kind: 'amphoteric', importance: 2, type: solid === 'H2SiO3' ? 'neutralization' : 'complex',
      eq: { reactants, products }, p: { solid, product: s }, signs: ['dissolve'], key: `amphoteric:${solid}`
    });
  }
  return null;
};

// ---------------------------------------------------------------- metals

const NOBLE_ENOUGH = ['Mg', 'Al', 'Zn', 'Fe', 'Cu', 'Ag'];

const metalNitric: Rule = (v, ctx) => {
  const h = amt(v.aq, 'H^+');
  const no3 = amt(v.aq, 'NO3^-');
  if (h <= EPS || no3 <= EPS) return null;
  for (const m of NOBLE_ENOUGH) {
    const n = amt(v.solids, m);
    if (n <= EPS) continue;
    const ion = METALS[m].nitricIon;
    const z = IONS[ion].charge;
    const e = Math.min(n, (h * 3) / (4 * z), (no3 * 3) / z);
    if (e <= EPS) continue;
    const s = salt(ion, 'NO3^-').id;
    take(v.solids, m, e);
    take(v.aq, 'H^+', (4 * z * e) / 3);
    take(v.aq, 'NO3^-', (z * e) / 3);
    putIon(v, ion, e, s);
    addGas(v, 'NO', (z * e) / 3, ctx.now);
    v.fx.brownAt = ctx.now;
    const dT = release(v, 120 * e);
    return ev({
      kind: 'metalNitric', importance: 2, type: 'redox',
      eq: { reactants: [m, 'HNO3'], products: [s, 'NO', 'H2O'], gas: ['NO'] },
      p: { metal: m }, signs: ['gas', 'color'], safety: 'fumeHood', dT, key: `metal-nitric:${m}`
    });
  }
  return null;
};

const metalAcid: Rule = (v, ctx) => {
  for (const m of ['Mg', 'Al', 'Zn', 'Fe']) {
    const n = amt(v.solids, m);
    if (n <= EPS) continue;
    const ion = METALS[m].ion;
    const z = IONS[ion].charge;
    for (const d of donors(v, m !== 'Al')) {
      const e = Math.min(n, d.amount / z);
      if (e <= EPS) continue;
      const s = salt(ion, d.anion).id;
      take(v.solids, m, e);
      consume(v, d, z * e, s);
      putIon(v, ion, e, s);
      addGas(v, 'H2', (z * e) / 2, ctx.now);
      const dT = release(v, METALS[m].heatWater * e);
      return ev({
        kind: 'metalAcid', importance: 2, type: 'substitution',
        eq: { reactants: [m, d.parent], products: [s, 'H2'], gas: ['H2'] },
        p: { metal: m, acid: d.parent, salt: s }, signs: dT > 3 ? ['gas', 'heat'] : ['gas'], dT, key: `metal-acid:${m}`
      });
    }
  }
  return null;
};

const metalAlkali: Rule = (v, ctx) => {
  const oh = amt(v.aq, 'OH^-');
  if (oh <= EPS) return null;
  for (const [m, per, cx] of [['Zn', 2, '[Zn(OH)4]^2-'], ['Al', 1, '[Al(OH)4]^-']] as [string, number, string][]) {
    const n = amt(v.solids, m);
    const e = Math.min(n, oh / per);
    if (e <= EPS) continue;
    const base = baseOf(v);
    const s = salt(base.cation, cx).id;
    take(v.solids, m, e);
    take(v.aq, 'OH^-', per * e);
    putIon(v, cx, e, s);
    setParent(v, [base.cation], s);
    addGas(v, 'H2', m === 'Zn' ? e : 1.5 * e, ctx.now);
    return ev({
      kind: 'metalAlkali', importance: 2, type: 'redox',
      eq: { reactants: [m, base.parent, 'H2O'], products: [s, 'H2'], gas: ['H2'] },
      p: { metal: m }, signs: ['gas'], key: `metal-alkali:${m}`
    });
  }
  return null;
};

const metalSalt: Rule = (v, ctx) => {
  for (const m of NOBLE_ENOUGH) {
    const n = amt(v.solids, m);
    if (n <= EPS) continue;
    for (const c of Object.keys(v.aq)) {
      const ion = IONS[c];
      if (!ion?.metal || c === 'Fe^3+' || c.startsWith('[') || ion.metal === m) continue;
      if (activity(m) >= activity(ion.metal)) continue;
      if (m === 'Al' && amt(v.aq, 'Cl^-') <= EPS) continue;
      const myIon = METALS[m].ion;
      const zM = IONS[myIon].charge;
      const zC = ion.charge;
      const e = Math.min(n, (amt(v.aq, c) * zC) / zM);
      if (e <= EPS) continue;
      const cParent = parentOf(v, c, salt(c, 'SO4^2-').id);
      const anion = counterIon(cParent, c) || 'SO4^2-';
      const s = salt(myIon, anion).id;
      take(v.solids, m, e);
      take(v.aq, c, (e * zM) / zC);
      putIon(v, myIon, e, s);
      setParent(v, [anion], s);
      put(v.solids, ion.metal, (e * zM) / zC);
      v.fx.depositAt = ctx.now;
      const signs: ReactionEvent['signs'] = ['deposit'];
      if (ion.color || IONS[myIon].color) signs.push('color');
      return ev({
        kind: 'metalSalt', importance: 2, type: 'substitution',
        eq: { reactants: [m, cParent], products: [s, ion.metal] },
        p: { metal: m, ion: c, deposit: ion.metal, salt: cParent }, signs, key: `metal-salt:${m}:${ion.metal}`
      });
    }
  }
  return null;
};

// ---------------------------------------------------------------- water, oxides, solids

const oxideWater: Rule = (v) => {
  const n = amt(v.solids, 'CaO');
  if (n <= EPS || waterVolume(v) <= 0.05) return null;
  take(v.solids, 'CaO', n);
  putIon(v, 'Ca^2+', n, 'Ca(OH)2');
  putIon(v, 'OH^-', 2 * n, 'Ca(OH)2');
  const dT = release(v, 65 * n);
  return ev({
    kind: 'oxideWater', importance: 2, type: 'combination',
    eq: { reactants: ['CaO', 'H2O'], products: ['Ca(OH)2'] }, p: { oxide: 'CaO' }, signs: ['heat'], dT, key: 'oxide-water:CaO'
  });
};

const dissolveSolid: Rule = (v, ctx) => {
  const water = waterVolume(v);
  if (water <= 0.05) return null;
  for (const s in SOLUBLE_SOLIDS) {
    const n = amt(v.solids, s);
    if (n <= EPS) continue;
    const info = SOLUBLE_SOLIDS[s];
    const e = Math.min(n, info.S * water);
    if (e <= EPS) continue;
    take(v.solids, s, e);
    for (const ion in info.ions) putIon(v, ion, info.ions[ion] * e, s);
    v.fx.dissolveAt = ctx.now;
    return ev({ kind: 'dissolve', importance: 1, type: 'physical', p: { solid: s }, signs: ['dissolve'], key: `dissolve:${s}` });
  }
  const sugar = amt(v.solids, 'C12H22O11');
  if (sugar > EPS && amt(v.aq, 'H2SO4c') <= EPS) {
    take(v.solids, 'C12H22O11', sugar);
    put(v.aq, 'C12H22O11', sugar);
    v.fx.dissolveAt = ctx.now;
    return ev({ kind: 'dissolve', importance: 1, type: 'physical', p: { solid: 'C12H22O11' }, signs: ['dissolve'], key: 'dissolve:sugar' });
  }
  return null;
};

// ---------------------------------------------------------------- complexes and precipitates

const AMMONIA_PRECIP = ['Fe^3+', 'Al^3+', 'Cu^2+', 'Zn^2+', 'Fe^2+', 'Mg^2+', 'Ag^+'];

const ammoniaPrecip: Rule = (v, ctx) => {
  const nh3 = amt(v.aq, 'NH3');
  if (nh3 <= EPS) return null;
  for (const c of AMMONIA_PRECIP) {
    const a = amt(v.aq, c);
    if (a <= EPS) continue;
    const cParent = parentOf(v, c, salt(c, 'NO3^-').id);
    const anion = counterIon(cParent, c) || 'NO3^-';
    const ammSalt = salt('NH4^+', anion).id;
    if (c === 'Ag^+') {
      const e = Math.min(a / 2, nh3 / 2);
      take(v.aq, c, 2 * e);
      take(v.aq, 'NH3', 2 * e);
      put(v.solids, 'Ag2O', e);
      putIon(v, 'NH4^+', 2 * e, ammSalt);
      setParent(v, [anion], ammSalt);
      v.fx.precipAt = ctx.now;
      return ev({
        kind: 'precip', importance: 2, type: 'exchange',
        eq: { reactants: [cParent, 'NH3·H2O'], products: ['Ag2O', ammSalt, 'H2O'], precip: ['Ag2O'] },
        p: { product: 'Ag2O', color: 'darkBrown', base: 'NH3' }, signs: ['precip'], key: 'precip:Ag2O'
      });
    }
    const z = IONS[c].charge;
    const hyd = salt(c, 'OH^-').id;
    const e = Math.min(a, nh3 / z);
    take(v.aq, c, e);
    take(v.aq, 'NH3', z * e);
    put(v.solids, hyd, e);
    putIon(v, 'NH4^+', z * e, ammSalt);
    setParent(v, [anion], ammSalt);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'precip', importance: 2, type: 'exchange',
      eq: { reactants: [cParent, 'NH3·H2O'], products: [hyd, ammSalt], precip: [hyd] },
      p: { product: hyd, color: colorOf(hyd), base: 'NH3' }, signs: ['precip'], key: `precip:${hyd}`
    });
  }
  return null;
};

const AMMINE: { solid: string; need: number; complex: string; nCx: number; released?: string; nRel: number; water?: boolean }[] = [
  { solid: 'Cu(OH)2', need: 4, complex: '[Cu(NH3)4]^2+', nCx: 1, released: 'OH^-', nRel: 2 },
  { solid: 'Zn(OH)2', need: 4, complex: '[Zn(NH3)4]^2+', nCx: 1, released: 'OH^-', nRel: 2 },
  { solid: 'AgCl', need: 2, complex: '[Ag(NH3)2]^+', nCx: 1, released: 'Cl^-', nRel: 1 },
  { solid: 'Ag2O', need: 4, complex: '[Ag(NH3)2]^+', nCx: 2, released: 'OH^-', nRel: 2, water: true }
];

const ammineComplex: Rule = (v, ctx) => {
  const nh3 = amt(v.aq, 'NH3');
  if (nh3 <= EPS) return null;
  for (const a of AMMINE) {
    const n = amt(v.solids, a.solid);
    const e = Math.min(n, nh3 / a.need);
    if (e <= EPS) continue;
    const counter = a.released!;
    const cxSalt = salt(a.complex, counter).id;
    take(v.solids, a.solid, e);
    take(v.aq, 'NH3', a.need * e);
    putIon(v, a.complex, a.nCx * e, cxSalt);
    let rel = a.nRel * e;
    if (counter === 'OH^-') {
      const k = Math.min(amt(v.aq, 'NH4^+'), rel);
      if (k > EPS) {
        take(v.aq, 'NH4^+', k);
        put(v.aq, 'NH3', k);
        rel -= k;
      }
    }
    putIon(v, counter, rel, cxSalt);
    v.fx.dissolveAt = ctx.now;
    return ev({
      kind: 'ammine', importance: 2, type: 'complex',
      eq: { reactants: a.water ? [a.solid, 'NH3', 'H2O'] : [a.solid, 'NH3'], products: [cxSalt] },
      p: { solid: a.solid, complex: cxSalt }, signs: a.solid === 'Cu(OH)2' ? ['dissolve', 'color'] : ['dissolve'],
      key: `ammine:${a.solid}`
    });
  }
  return null;
};

const fe3scn: Rule = (v) => {
  const fe = amt(v.aq, 'Fe^3+');
  const scn = amt(v.aq, 'SCN^-');
  const e = Math.min(fe, scn / 3);
  if (e <= EPS) return null;
  const feParent = parentOf(v, 'Fe^3+', 'FeCl3');
  const scnParent = parentOf(v, 'SCN^-', 'KSCN');
  const feAnion = counterIon(feParent, 'Fe^3+') || 'Cl^-';
  const scnCat = counterIon(scnParent, 'SCN^-') || 'K^+';
  const s = salt(scnCat, feAnion).id;
  take(v.aq, 'Fe^3+', e);
  take(v.aq, 'SCN^-', 3 * e);
  put(v.aq, 'Fe(SCN)3', e);
  setParent(v, [feAnion, scnCat], s);
  return ev({
    kind: 'fe3scn', importance: 2, type: 'exchange',
    eq: { reactants: [feParent, scnParent], products: ['Fe(SCN)3', s] }, p: {}, signs: ['color'], key: 'fe3-scn'
  });
};

const jointHydrolysis: Rule = (v, ctx) => {
  for (const m of ['Fe^3+', 'Al^3+', 'Cu^2+']) {
    const a = amt(v.aq, m);
    if (a <= EPS) continue;
    for (const carb of ['CO3^2-', 'HCO3^-']) {
      const c = amt(v.aq, carb);
      if (c <= EPS) continue;
      const mParent = parentOf(v, m, salt(m, 'Cl^-').id);
      const cParent = parentOf(v, carb, carb === 'CO3^2-' ? 'Na2CO3' : 'NaHCO3');
      const mAnion = counterIon(mParent, m) || 'Cl^-';
      const cCat = counterIon(cParent, carb) || 'Na^+';
      const s = salt(cCat, mAnion).id;
      let product: string;
      let takeM: number, takeC: number, solid: number, co2: number;
      let reactants: string[];
      let products: string[];
      if (m === 'Cu^2+') {
        product = '(CuOH)2CO3';
        const u = carb === 'CO3^2-' ? Math.min(a / 2, c / 2) : Math.min(a / 2, c / 4);
        takeM = 2 * u; takeC = carb === 'CO3^2-' ? 2 * u : 4 * u; solid = u; co2 = carb === 'CO3^2-' ? u : 3 * u;
        reactants = carb === 'CO3^2-' ? [mParent, cParent, 'H2O'] : [mParent, cParent];
        products = carb === 'CO3^2-' ? [product, s, 'CO2'] : [product, s, 'CO2', 'H2O'];
      } else {
        product = salt(m, 'OH^-').id;
        const u = carb === 'CO3^2-' ? Math.min(a / 2, c / 3) : Math.min(a, c / 3);
        takeM = carb === 'CO3^2-' ? 2 * u : u; takeC = 3 * u; solid = takeM; co2 = 3 * u;
        reactants = carb === 'CO3^2-' ? [mParent, cParent, 'H2O'] : [mParent, cParent];
        products = [product, s, 'CO2'];
      }
      if (solid <= EPS) continue;
      take(v.aq, m, takeM);
      take(v.aq, carb, takeC);
      put(v.solids, product, solid);
      addGas(v, 'CO2', co2, ctx.now);
      setParent(v, [mAnion, cCat], s);
      v.fx.precipAt = ctx.now;
      return ev({
        kind: 'jointHydrolysis', importance: 2, type: 'exchange',
        eq: { reactants, products, precip: [product], gas: ['CO2'] },
        p: { product, color: colorOf(product) }, signs: ['precip', 'gas'], key: `joint-hydrolysis:${product}`
      });
    }
  }
  return null;
};

const silverOxide: Rule = (v, ctx) => {
  const e = Math.min(amt(v.aq, 'Ag^+'), amt(v.aq, 'OH^-')) / 2;
  if (e <= EPS) return null;
  const agParent = parentOf(v, 'Ag^+', 'AgNO3');
  const base = baseOf(v);
  const agAnion = counterIon(agParent, 'Ag^+') || 'NO3^-';
  const s = salt(base.cation, agAnion).id;
  take(v.aq, 'Ag^+', 2 * e);
  take(v.aq, 'OH^-', 2 * e);
  put(v.solids, 'Ag2O', e);
  setParent(v, [base.cation, agAnion], s);
  v.fx.precipAt = ctx.now;
  return ev({
    kind: 'precip', importance: 2, type: 'exchange',
    eq: { reactants: [agParent, base.parent], products: ['Ag2O', s, 'H2O'], precip: ['Ag2O'] },
    p: { product: 'Ag2O', color: 'darkBrown', special: 'ag2o' }, signs: ['precip'], key: 'precip:Ag2O'
  });
};

const precipitation: Rule = (v, ctx) => {
  const vol = Math.max(v.volume, 0.01);
  const acidic = amt(v.aq, 'H^+') > EPS;
  type Cand = { c: string; a: string; S: number };
  const cands: Cand[] = [];
  for (const c of Object.keys(v.aq)) {
    if (!IONS[c] || IONS[c].charge <= 0 || c === 'H^+') continue;
    for (const a of Object.keys(v.aq)) {
      if (!IONS[a] || IONS[a].charge >= 0) continue;
      const sol = solubility(c, a);
      if (sol.s !== 'N' && sol.s !== 'M') continue;
      if (acidic && (IONS[a].weakConj || a === 'PO4^3-' || a === 'OH^-')) continue;
      cands.push({ c, a, S: sol.S ?? 1e-5 });
    }
  }
  cands.sort((x, y) => x.S - y.S);
  for (const { c, a, S } of cands) {
    const def = salt(c, a);
    const nCat = def.nCat || 1;
    const nAn = def.nAn || 1;
    const units = Math.min(amt(v.aq, c) / nCat, amt(v.aq, a) / nAn);
    const p = units - S * vol;
    if (p <= EPS) continue;
    const cParent = parentOf(v, c, def.id);
    const aParent = parentOf(v, a, def.id);
    take(v.aq, c, p * nCat);
    take(v.aq, a, p * nAn);
    put(v.solids, def.id, p);
    v.fx.precipAt = ctx.now;
    // The precipitate was already announced by the reaction that released these ions.
    if (cParent === def.id || aParent === def.id) return ev({ kind: 'minor', importance: 0, type: 'exchange' });
    const cCounter = counterIon(aParent, a);
    const aCounter = counterIon(cParent, c);
    let eq: ReactionEvent['eq'];
    if (cParent !== aParent && cCounter && aCounter) {
      const spectator = salt(cCounter, aCounter).id;
      setParent(v, [cCounter, aCounter], spectator);
      eq = { reactants: [cParent, aParent], products: [def.id, spectator], precip: [def.id] };
    }
    const sameSource = cParent === aParent;
    return ev({
      kind: sameSource ? 'saturated' : 'precip', importance: sameSource ? 1 : 2, type: 'exchange', eq,
      p: { product: def.id, color: def.color || 'white', sol: S > 1e-4 ? 'M' : 'N' },
      signs: ['precip'], key: `precip:${def.id}`
    });
  }
  return null;
};

const redissolve: Rule = (v) => {
  const vol = v.volume;
  if (vol < 0.05) return null;
  for (const s of Object.keys(v.solids)) {
    if (!hasCompound(s)) continue;
    const def = compound(s);
    if (!def.cation || !def.anion) continue;
    const sol = solubility(def.cation, def.anion);
    if (sol.s !== 'M' || !sol.S) continue;
    const dissolved = Math.min(amt(v.aq, def.cation) / (def.nCat || 1), amt(v.aq, def.anion) / (def.nAn || 1));
    const room = sol.S * vol - dissolved;
    const e = Math.min(amt(v.solids, s), room);
    if (e <= 1e-4) continue;
    take(v.solids, s, e);
    putIon(v, def.cation, (def.nCat || 1) * e, s);
    putIon(v, def.anion, (def.nAn || 1) * e, s);
    return ev({ kind: 'minor', importance: 0, type: 'physical' });
  }
  return null;
};

// ---------------------------------------------------------------- catalysis and heat

const peroxide: Rule = (v, ctx) => {
  const n = amt(v.aq, 'H2O2');
  if (n <= EPS) return null;
  const catalyst = amt(v.solids, 'MnO2') > EPS;
  if (!catalyst && (v.temp < 70 || ctx.limited.has('h2o2'))) return null;
  const e = catalyst ? n : Math.min(n, 0.12);
  if (!catalyst) ctx.limited.add('h2o2');
  take(v.aq, 'H2O2', e);
  addGas(v, 'O2', e / 2, ctx.now);
  const dT = release(v, 98 * e);
  return ev({
    kind: 'h2o2', importance: 2, type: 'decomposition',
    eq: { reactants: ['H2O2'], products: ['H2O', 'O2'], gas: ['O2'], cond: catalyst ? 'MnO2' : 't' },
    p: { catalyst: catalyst ? 'MnO2' : '' }, signs: ['gas'], dT, key: catalyst ? 'h2o2-mno2' : 'h2o2-heat'
  });
};

const heatRules: Rule = (v, ctx) => {
  const cuoh2 = amt(v.solids, 'Cu(OH)2');
  if (cuoh2 > EPS && v.temp >= 80) {
    take(v.solids, 'Cu(OH)2', cuoh2);
    put(v.solids, 'CuO', cuoh2);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'hydroxideDecomp', importance: 2, type: 'decomposition',
      eq: { reactants: ['Cu(OH)2'], products: ['CuO', 'H2O'], cond: 't' }, p: { product: 'CuO' }, signs: ['color'], key: 'decomp:Cu(OH)2'
    });
  }
  const nh3 = amt(v.aq, 'NH3');
  if (nh3 > EPS && v.temp >= 60) {
    take(v.aq, 'NH3', nh3);
    addGas(v, 'NH3', nh3, ctx.now);
    v.fx.smellAt = ctx.now;
    return ev({
      kind: 'ammoniaGas', importance: 2, type: 'decomposition',
      eq: { reactants: ['NH3·H2O'], products: ['NH3', 'H2O'], gas: ['NH3'], cond: 't' },
      p: {}, signs: ['gas', 'smell'], safety: 'ammoniaSmell', key: 'ammonia-gas'
    });
  }
  const sugar = amt(v.solids, 'C12H22O11');
  if (sugar > EPS && v.volume < 0.01 && v.temp >= 180 && !ctx.limited.has('sugar')) {
    ctx.limited.add('sugar');
    const e = Math.min(sugar, 0.25);
    take(v.solids, 'C12H22O11', e);
    put(v.solids, 'C', 12 * e);
    addGas(v, 'H2O', e * 4, ctx.now);
    v.fx.charAt = ctx.now;
    return ev({
      kind: 'sugarHeat', importance: 2, type: 'decomposition',
      eq: { reactants: ['C12H22O11'], products: ['C', 'H2O'], cond: 't' }, signs: ['color', 'gas'], key: 'sugar-heat'
    });
  }
  return null;
};

export const RULES: Rule[] = [
  concDilution, concSugar, concMetal, alkaliMetal,
  neutralization, weakAcidBase, ammoniumBase, ammoniaAcid, bicarbonateBase,
  carbonateStrong, bicarbonateStrong, carbonateWeak, bicarbonateWeak, silicateAcid, acetateStrong, phosphateStrong,
  complexAcid, solidAcid, amphotericBase,
  metalNitric, metalAcid, metalAlkali, metalSalt,
  oxideWater, dissolveSolid,
  ammoniaPrecip, ammineComplex, fe3scn, jointHydrolysis, silverOxide, precipitation, redissolve,
  peroxide, heatRules
];

export function settle(v: Vessel, ctx: Ctx): ReactionEvent[] {
  const events: ReactionEvent[] = [];
  for (let i = 0; i < 60; i++) {
    let fired: ReactionEvent | null = null;
    for (const rule of RULES) {
      fired = rule(v, ctx);
      if (fired) break;
    }
    if (!fired) break;
    events.push(fired);
  }
  return events;
}

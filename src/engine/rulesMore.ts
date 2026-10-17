// More reactions: sulfides, sulfites and thiosulfate with acids, halogens pushing each other out of
// salts, chromate and dichromate, permanganate and dichromate as oxidisers in acid, joint
// hydrolysis with sulfides, and reactions of dry solids on strong heating.

import { IONS, METALS, salt } from './data';
import { EPS, addGas, amt, put, putIon, release, take, waterVolume, type ReactionEvent, type Vessel } from './vessel';
import {
  acidOf, baseOf, colorOf, consume, counterIon, donors, ev, once, parentOf, setParent, warmth,
  type Ctx, type Rule
} from './ruleKit';
import type { EqSpec } from './equation';

const uniq = (xs: string[]) => [...new Set(xs)];

/** Volume (mL) of liquid water in `mmol` of water vapour. */
export const ML_PER_MMOL_WATER = 0.018;

// ---------------------------------------------------------------- chromate and dichromate

const chromateAcid: Rule = (v) => {
  const cr = amt(v.aq, 'CrO4^2-');
  if (cr <= EPS) return null;
  for (const d of donors(v, true)) {
    const u = Math.min(cr / 2, d.amount / 2);
    if (u <= EPS) continue;
    const crParent = parentOf(v, 'CrO4^2-', 'K2CrO4');
    const cat = counterIon(crParent, 'CrO4^2-') || 'K^+';
    const dich = salt(cat, 'Cr2O7^2-').id;
    const s = salt(cat, d.anion).id;
    take(v.aq, 'CrO4^2-', 2 * u);
    consume(v, d, 2 * u, s);
    putIon(v, 'Cr2O7^2-', u, dich);
    setParent(v, [cat], dich);
    return ev({
      kind: 'chromateAcid', importance: 2, type: 'exchange',
      eq: { reactants: [crParent, d.parent], products: uniq([dich, s, 'H2O']) }, signs: ['color'], key: 'chromate-acid'
    });
  }
  return null;
};

const dichromateBase: Rule = (v, ctx) => {
  const d = amt(v.aq, 'Cr2O7^2-');
  if (d <= EPS) return null;
  const dParent = parentOf(v, 'Cr2O7^2-', 'K2Cr2O7');
  const cat = counterIon(dParent, 'Cr2O7^2-') || 'K^+';
  const chromate = salt(cat, 'CrO4^2-').id;
  // Ammonia does it too: K2Cr2O7 + 2NH3 + H2O -> K2CrO4 + (NH4)2CrO4.
  if (amt(v.aq, 'OH^-') <= EPS) {
    const u = Math.min(d, amt(v.aq, 'NH3') / 2);
    if (u <= EPS) return null;
    take(v.aq, 'Cr2O7^2-', u); take(v.aq, 'NH3', 2 * u);
    putIon(v, 'CrO4^2-', 2 * u, chromate);
    putIon(v, 'NH4^+', 2 * u, salt('NH4^+', 'CrO4^2-').id);
    return ev({
      kind: 'dichromateBase', importance: 2, type: 'exchange',
      eq: { reactants: [dParent, 'NH3', 'H2O'], products: uniq([chromate, salt('NH4^+', 'CrO4^2-').id]) }, p: { base: 'NH3' },
      signs: ['color'], key: 'dichromate-base'
    });
  }
  const u = Math.min(d, amt(v.aq, 'OH^-') / 2);
  if (u <= EPS) return null;
  const base = baseOf(v);
  take(v.aq, 'Cr2O7^2-', u);
  take(v.aq, 'OH^-', 2 * u);
  const baseChromate = salt(base.cation, 'CrO4^2-');
  if (baseChromate.phase === 's' && base.cation !== cat) {
    // Barium hydroxide: the chromate comes straight out as a yellow precipitate.
    // K2Cr2O7 + 2Ba(OH)2 -> 2BaCrO4 + 2KOH + H2O
    const n = Math.min(2 * u, amt(v.aq, base.cation) / (baseChromate.nCat || 1));
    take(v.aq, base.cation, n * (baseChromate.nCat || 1));
    put(v.solids, baseChromate.id, n);
    if (2 * u > n) putIon(v, 'CrO4^2-', 2 * u - n, chromate);
    setParent(v, [cat], salt(cat, 'OH^-').id);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'dichromateBase', importance: 2, type: 'exchange',
      eq: { reactants: [dParent, base.parent], products: [baseChromate.id, salt(cat, 'OH^-').id, 'H2O'], precip: [baseChromate.id] },
      p: { product: baseChromate.id }, signs: ['color', 'precip'], key: 'dichromate-base'
    });
  }
  putIon(v, 'CrO4^2-', 2 * u, chromate);
  setParent(v, [cat, base.cation], chromate);
  return ev({
    kind: 'dichromateBase', importance: 2, type: 'exchange',
    eq: { reactants: [dParent, base.parent], products: uniq([chromate, salt(base.cation, 'CrO4^2-').id, 'H2O']) },
    signs: ['color'], key: 'dichromate-base'
  });
};

// ---------------------------------------------------------------- sulfur compounds with acids

function gasFromAcid(v: Vessel, ctx: Ctx, anion: string, fallback: string, gas: string, kind: 'sulfideAcid' | 'sulfiteAcid'): ReactionEvent | null {
  const a = amt(v.aq, anion);
  if (a <= EPS) return null;
  for (const d of donors(v, true)) {
    const n = Math.min(a, d.amount / 2);
    if (n <= EPS) continue;
    const aParent = parentOf(v, anion, fallback);
    const cat = counterIon(aParent, anion) || 'Na^+';
    const s = salt(cat, d.anion).id;
    take(v.aq, anion, n);
    consume(v, d, 2 * n, s);
    setParent(v, [cat], s);
    addGas(v, gas, n, ctx.now);
    v.fx.smellAt = ctx.now;
    return ev({
      kind, importance: 2, type: 'exchange',
      eq: { reactants: [aParent, d.parent], products: gas === 'SO2' ? [s, 'SO2', 'H2O'] : [s, gas], gas: [gas] },
      p: { acid: d.parent }, signs: ['gas', 'smell'], safety: 'fumeHood', key: kind === 'sulfideAcid' ? 'sulfide-acid' : 'sulfite-acid'
    });
  }
  return null;
}

const sulfideAcid: Rule = (v, ctx) => gasFromAcid(v, ctx, 'S^2-', 'Na2S', 'H2S', 'sulfideAcid');
const sulfiteAcid: Rule = (v, ctx) => gasFromAcid(v, ctx, 'SO3^2-', 'Na2SO3', 'SO2', 'sulfiteAcid');

/** Thiosulfate with acid: sulfur slowly makes the solution cloudy. Faster when hot or concentrated. */
const THIO_K = 0.001;

const thiosulfateAcid: Rule = (v, ctx) => {
  const th = amt(v.aq, 'S2O3^2-');
  const h = amt(v.aq, 'H^+');
  if (th <= EPS || h <= EPS || v.volume < 0.05 || !once(ctx, 'thio')) return null;
  const thParent = parentOf(v, 'S2O3^2-', 'Na2S2O3');
  const cat = counterIon(thParent, 'S2O3^2-') || 'Na^+';
  const acid = acidOf(v);
  const s = salt(cat, acid.anion).id;
  // With sulfuric acid sulfur appears on both sides and the balancer finds more than one answer.
  const eq: EqSpec = {
    reactants: [thParent, acid.parent], products: [s, 'S', 'SO2', 'H2O'], precip: ['S'],
    k: acid.parent === 'H2SO4' && thParent === 'Na2S2O3' ? [1, 1, 1, 1, 1, 1] : undefined
  };
  const visible = 0.002 * v.volume;
  const before = amt(v.solids, 'S');
  const dt = ctx.dt ?? 0;
  if (dt <= 0) {
    if (before >= visible) return null;
    return ev({ kind: 'thiosulfateAcid', importance: 2, type: 'redox', eq, p: { stage: 'wait' }, key: 'thiosulfate-acid' });
  }
  const rate = THIO_K * (th / v.volume) * (h / v.volume) * v.volume * warmth(v.temp);
  const n = Math.min(th, h / 2, rate * dt);
  if (n <= 1e-7) return null;
  take(v.aq, 'S2O3^2-', n);
  take(v.aq, 'H^+', 2 * n);
  setParent(v, [cat, acid.anion], s);
  put(v.solids, 'S', n);
  put(v.aq, 'SO2', n);
  if (before < visible && before + n >= visible) {
    v.fx.precipAt = ctx.now;
    return ev({ kind: 'thiosulfateAcid', importance: 2, type: 'redox', eq, p: { stage: 'cloudy' }, signs: ['precip'], key: 'thiosulfate-cloudy' });
  }
  return ev({ kind: 'minor', importance: 0, type: 'redox' });
};

// ---------------------------------------------------------------- halogens and other oxidisers

const HALOGENS: [string, string, string][] = [['Cl2', 'Cl^-', 'KCl'], ['Br2', 'Br^-', 'KBr'], ['I2', 'I^-', 'KI']];

const halogenDisplace: Rule = (v, ctx) => {
  for (let i = 0; i < HALOGENS.length; i++) {
    const [ox, oxIon] = HALOGENS[i];
    const o = amt(v.aq, ox);
    if (o <= EPS) continue;
    const halSalt = (cat: string) => salt(cat, oxIon).id;

    // A more active halogen pushes a less active one out of its salt.
    for (let j = i + 1; j < HALOGENS.length; j++) {
      const [prod, ion, fallback] = HALOGENS[j];
      const n = Math.min(o, amt(v.aq, ion) / 2);
      if (n <= EPS) continue;
      const rParent = parentOf(v, ion, fallback);
      const cat = counterIon(rParent, ion) || 'K^+';
      const s = halSalt(cat);
      take(v.aq, ox, n);
      take(v.aq, ion, 2 * n);
      putIon(v, oxIon, 2 * n, s);
      put(v.aq, prod, n);
      setParent(v, [cat], s);
      return ev({
        kind: 'halogenDisplace', importance: 2, type: 'redox',
        eq: { reactants: [ox, rParent], products: [s, prod] }, p: { ox, red: ion, product: prod }, signs: ['color'], key: `halogen:${ox}:${prod}`
      });
    }

    // Iodine (and the other halogens) take sulfur(−2), sulfur(+4), thiosulfate and iron(II).
    const s2 = amt(v.aq, 'S^2-');
    if (s2 > EPS) {
      const n = Math.min(o, s2);
      const sParent = parentOf(v, 'S^2-', 'Na2S');
      const cat = counterIon(sParent, 'S^2-') || 'Na^+';
      take(v.aq, ox, n);
      take(v.aq, 'S^2-', n);
      putIon(v, oxIon, 2 * n, halSalt(cat));
      put(v.solids, 'S', n);
      v.fx.precipAt = ctx.now;
      return ev({
        kind: 'halogenDisplace', importance: 2, type: 'redox',
        eq: { reactants: [ox, sParent], products: ['S', halSalt(cat)], precip: ['S'] }, p: { ox, red: 'S^2-', product: 'S' },
        signs: ['precip', 'color'], key: `halogen:${ox}:S`
      });
    }
    const th = amt(v.aq, 'S2O3^2-');
    if (ox === 'I2' && th > EPS) {
      const n = Math.min(o, th / 2);
      const tParent = parentOf(v, 'S2O3^2-', 'Na2S2O3');
      const cat = counterIon(tParent, 'S2O3^2-') || 'Na^+';
      take(v.aq, 'I2', n);
      take(v.aq, 'S2O3^2-', 2 * n);
      putIon(v, 'I^-', 2 * n, halSalt(cat));
      putIon(v, 'S4O6^2-', n, salt(cat, 'S4O6^2-').id);
      return ev({
        kind: 'halogenDisplace', importance: 2, type: 'redox',
        eq: { reactants: ['I2', tParent], products: [halSalt(cat), salt(cat, 'S4O6^2-').id] }, p: { ox, red: 'S2O3^2-', product: 'I^-' },
        signs: ['color'], key: 'iodine-thiosulfate'
      });
    }
    const so3 = amt(v.aq, 'SO3^2-');
    if (so3 > EPS && waterVolume(v) > 0.05) {
      const n = Math.min(o, so3);
      const sParent = parentOf(v, 'SO3^2-', 'Na2SO3');
      const cat = counterIon(sParent, 'SO3^2-') || 'Na^+';
      take(v.aq, ox, n);
      take(v.aq, 'SO3^2-', n);
      putIon(v, 'SO4^2-', n, salt(cat, 'SO4^2-').id);
      putIon(v, oxIon, 2 * n, salt('H^+', oxIon).id);
      putIon(v, 'H^+', 2 * n, salt('H^+', oxIon).id);
      return ev({
        kind: 'halogenDisplace', importance: 2, type: 'redox',
        eq: { reactants: [ox, sParent, 'H2O'], products: [salt(cat, 'SO4^2-').id, salt('H^+', oxIon).id] }, p: { ox, red: 'SO3^2-', product: 'SO4^2-' },
        signs: ['color'], key: `halogen:${ox}:SO3`
      });
    }
    const fe = amt(v.aq, 'Fe^2+');
    if (ox !== 'I2' && fe > EPS) {
      const n = Math.min(o, fe / 2);
      const feParent = parentOf(v, 'Fe^2+', 'FeSO4');
      const anion = counterIon(feParent, 'Fe^2+') || 'SO4^2-';
      take(v.aq, ox, n);
      take(v.aq, 'Fe^2+', 2 * n);
      putIon(v, 'Fe^3+', 2 * n, salt('Fe^3+', anion).id);
      putIon(v, oxIon, 2 * n, salt('Fe^3+', oxIon).id);
      return ev({
        kind: 'halogenDisplace', importance: 2, type: 'redox',
        eq: { reactants: [feParent, ox], products: uniq([salt('Fe^3+', anion).id, salt('Fe^3+', oxIon).id]) }, p: { ox, red: 'Fe^2+', product: 'Fe^3+' },
        signs: ['color'], key: `halogen:${ox}:Fe`
      });
    }
  }
  return null;
};

/** Halogen water is decolourised by dissolved hydrogen sulfide (sulfur appears) and sulfur dioxide. */
const halogenReduce: Rule = (v, ctx) => {
  for (const [ox, oxIon] of HALOGENS) {
    const o = amt(v.aq, ox);
    if (o <= EPS) continue;
    const hx = salt('H^+', oxIon).id;
    const h2s = amt(v.aq, 'H2S');
    if (h2s > EPS) {
      // X2 + H2S -> S + 2HX
      const n = Math.min(o, h2s);
      take(v.aq, ox, n); take(v.aq, 'H2S', n);
      put(v.solids, 'S', n);
      putIon(v, 'H^+', 2 * n, hx); putIon(v, oxIon, 2 * n, hx);
      v.fx.precipAt = ctx.now;
      return ev({
        kind: 'halogenReduce', importance: 2, type: 'redox',
        eq: { reactants: [ox, 'H2S'], products: ['S', hx], precip: ['S'] }, p: { ox, red: 'H2S' }, signs: ['color', 'precip'], key: `halogen-red:${ox}:H2S`
      });
    }
    const so2 = amt(v.aq, 'SO2');
    if (so2 > EPS && waterVolume(v) > 0.05) {
      // X2 + SO2 + 2H2O -> H2SO4 + 2HX
      const n = Math.min(o, so2);
      take(v.aq, ox, n); take(v.aq, 'SO2', n);
      putIon(v, 'H^+', 4 * n, hx); putIon(v, oxIon, 2 * n, hx); putIon(v, 'SO4^2-', n, 'H2SO4');
      return ev({
        kind: 'halogenReduce', importance: 2, type: 'redox',
        eq: { reactants: [ox, 'SO2', 'H2O'], products: ['H2SO4', hx] }, p: { ox, red: 'SO2' }, signs: ['color'], key: `halogen-red:${ox}:SO2`
      });
    }
  }
  return null;
};

/** Chlorine and bromine oxidise thiosulfate right through to sulfate (iodine only to tetrathionate). */
const halogenThio: Rule = (v) => {
  const th = amt(v.aq, 'S2O3^2-');
  if (th <= EPS || waterVolume(v) <= 0.05) return null;
  for (const [ox, oxIon] of HALOGENS.slice(0, 2)) {
    const o = amt(v.aq, ox);
    if (o <= EPS) continue;
    // S2O3^2- + 4X2 + 5H2O -> 2SO4^2- + 8X- + 10H+
    const n = Math.min(th, o / 4);
    if (n <= EPS) continue;
    const tParent = parentOf(v, 'S2O3^2-', 'Na2S2O3');
    const cat = counterIon(tParent, 'S2O3^2-') || 'Na^+';
    const hx = salt('H^+', oxIon).id;
    take(v.aq, 'S2O3^2-', n); take(v.aq, ox, 4 * n);
    putIon(v, 'SO4^2-', 2 * n, salt(cat, 'SO4^2-').id);
    putIon(v, oxIon, 8 * n, hx); putIon(v, 'H^+', 10 * n, hx);
    return ev({
      kind: 'halogenThio', importance: 2, type: 'redox',
      eq: { reactants: [tParent, ox, 'H2O'], products: [salt(cat, 'SO4^2-').id, 'H2SO4', hx] }, p: { ox }, signs: ['color'], key: `halogen-thio:${ox}`
    });
  }
  return null;
};

/**
 * Halogens in alkali (cold): Cl2 + 2NaOH -> NaCl + NaClO + H2O (this is how bleach is made);
 * bromine likewise; iodine gives iodide and iodate.
 */
const halogenAlkali: Rule = (v) => {
  const oh = amt(v.aq, 'OH^-');
  if (oh <= EPS) return null;
  const HYPO: Record<string, [string, number]> = { Cl2: ['ClO^-', 1], Br2: ['BrO^-', 1], I2: ['IO3^-', 5] };
  for (const [ox, oxIon] of HALOGENS) {
    // Iodine survives in nearly neutral solutions; it needs a real excess of alkali.
    if (ox === 'I2' && molar(v, 'OH^-') < 0.05) continue;
    const inSolid = ox === 'I2' ? amt(v.solids, 'I2') : 0;
    const o = amt(v.aq, ox) + inSolid;
    if (o <= EPS) continue;
    const [hypo, nX] = HYPO[ox];
    const base = baseOf(v);
    const xSalt = salt(base.cation, oxIon).id;
    const hSalt = salt(base.cation, hypo).id;
    // Per halogen molecule: 2 OH- (Cl, Br); iodine 3I2 + 6OH- -> 5I- + IO3- + 3H2O, also 2 OH- per I2.
    const n = Math.min(o, oh / 2);
    if (n <= EPS) continue;
    const fromAq = Math.min(n, amt(v.aq, ox));
    take(v.aq, ox, fromAq);
    if (n > fromAq) take(v.solids, 'I2', n - fromAq);
    take(v.aq, 'OH^-', 2 * n);
    const perMol = 2 / (nX + 1); // I2: 5I- + IO3- from 3I2 -> 1/3 IO3- per I2; Cl2: 1 ClO- per Cl2
    putIon(v, oxIon, 2 * n - perMol * n, xSalt);
    putIon(v, hypo, perMol * n, hSalt);
    return ev({
      kind: 'halogenAlkali', importance: 2, type: 'redox',
      eq: { reactants: [ox, base.parent], products: [xSalt, hSalt, 'H2O'] }, p: { ox, base: base.parent }, signs: ['color'], key: `halogen-alkali:${ox}`
    });
  }
  return null;
};

/** Chlorine water holds some HCl (Cl2 + H2O <-> HCl + HClO): silver ions take the chloride out. */
const chlorineSilver: Rule = (v, ctx) => {
  const cl = amt(v.aq, 'Cl2');
  const ag = amt(v.aq, 'Ag^+');
  const n = Math.min(cl, ag);
  if (n <= EPS || waterVolume(v) <= 0.05) return null;
  const agParent = parentOf(v, 'Ag^+', 'AgNO3');
  const anion = counterIon(agParent, 'Ag^+') || 'NO3^-';
  take(v.aq, 'Cl2', n); take(v.aq, 'Ag^+', n);
  put(v.solids, 'AgCl', n);
  put(v.aq, 'HClO', n);
  putIon(v, 'H^+', n, salt('H^+', anion).id);
  setParent(v, [anion], salt('H^+', anion).id);
  v.fx.precipAt = ctx.now;
  return ev({
    kind: 'precip', importance: 2, type: 'exchange',
    eq: { reactants: ['Cl2', 'H2O', agParent], products: ['AgCl', 'HClO', salt('H^+', anion).id], precip: ['AgCl'] },
    p: { product: 'AgCl', color: 'curdy', sol: 'N', special: 'chlorineWater' }, signs: ['precip'], key: 'precip:AgCl:Cl2'
  });
};

/**
 * Dissolved hydrogen sulfide precipitates the sulfides that do not dissolve even in acid:
 * CuSO4 + H2S -> CuS + H2SO4 (black), also lead, silver, mercury and tin(II).
 */
const h2sPrecip: Rule = (v, ctx) => {
  const h2s = amt(v.aq, 'H2S');
  if (h2s <= EPS) return null;
  for (const m of ['Cu^2+', 'Pb^2+', 'Ag^+', 'Hg^2+', 'Sn^2+']) {
    const a = amt(v.aq, m);
    if (a <= EPS) continue;
    const z = IONS[m].charge;
    const def = salt(m, 'S^2-');
    const nCat = def.nCat || 1;
    const u = Math.min(a / nCat, h2s);
    if (u <= EPS) continue;
    const mParent = parentOf(v, m, salt(m, 'NO3^-').id);
    const anion = counterIon(mParent, m) || 'NO3^-';
    const acidSalt = salt('H^+', anion).id;
    take(v.aq, m, u * nCat); take(v.aq, 'H2S', u);
    put(v.solids, def.id, u);
    putIon(v, 'H^+', u * nCat * z, acidSalt);
    setParent(v, [anion], acidSalt);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'precip', importance: 2, type: 'exchange',
      eq: { reactants: [mParent, 'H2S'], products: [def.id, acidSalt], precip: [def.id] },
      p: { product: def.id, color: def.color || 'black', sol: 'N' }, signs: ['precip'], key: `precip:${def.id}:H2S`
    });
  }
  return null;
};

/** SO2 + 2H2S -> 3S + 2H2O: two gases meet in the solution and yellow sulfur appears. */
const sulfurComprop: Rule = (v, ctx) => {
  const n = Math.min(amt(v.aq, 'SO2'), amt(v.aq, 'H2S') / 2);
  if (n <= EPS) return null;
  take(v.aq, 'SO2', n); take(v.aq, 'H2S', 2 * n);
  put(v.solids, 'S', 3 * n);
  v.fx.precipAt = ctx.now;
  return ev({
    kind: 'sulfurComprop', importance: 2, type: 'redox',
    eq: { reactants: ['SO2', 'H2S'], products: ['S', 'H2O'], precip: ['S'] }, signs: ['precip'], key: 'sulfur-comprop'
  });
};

/** Dissolved weak-acid gases are neutralised by alkali: H2S -> S^2-, SO2 -> SO3^2-, CO2 -> CO3^2-. */
const gasAcidBase: Rule = (v) => {
  const oh = amt(v.aq, 'OH^-');
  if (oh <= EPS) return null;
  for (const [gas, anion] of [['H2S', 'S^2-'], ['SO2', 'SO3^2-'], ['CO2', 'CO3^2-']]) {
    const n = Math.min(amt(v.aq, gas), oh / 2);
    if (n <= EPS) continue;
    const base = baseOf(v);
    const s = salt(base.cation, anion).id;
    take(v.aq, gas, n); take(v.aq, 'OH^-', 2 * n);
    putIon(v, anion, n, s);
    setParent(v, [base.cation], s);
    return ev({
      kind: 'neutralization', importance: 1, type: 'neutralization',
      eq: { reactants: [gas, base.parent], products: [s, 'H2O'] }, p: { acid: gas, base: base.parent, salt: s }, key: `gas-base:${gas}`
    });
  }
  return null;
};

/** Carbonic acid is stronger than silicic acid: Na2SiO3 + CO2 + H2O -> H2SiO3 (gel) + Na2CO3. */
const carbonicSilicate: Rule = (v, ctx) => {
  const n = Math.min(amt(v.aq, 'CO2'), amt(v.aq, 'SiO3^2-'));
  if (n <= EPS) return null;
  const sParent = parentOf(v, 'SiO3^2-', 'Na2SiO3');
  const cat = counterIon(sParent, 'SiO3^2-') || 'Na^+';
  take(v.aq, 'CO2', n); take(v.aq, 'SiO3^2-', n);
  put(v.solids, 'H2SiO3', n);
  putIon(v, 'CO3^2-', n, salt(cat, 'CO3^2-').id);
  setParent(v, [cat], salt(cat, 'CO3^2-').id);
  v.fx.precipAt = ctx.now;
  return ev({
    kind: 'carbonicSilicate', importance: 2, type: 'exchange',
    eq: { reactants: [sParent, 'CO2', 'H2O'], products: ['H2SiO3', salt(cat, 'CO3^2-').id], precip: ['H2SiO3'] }, signs: ['precip'], key: 'carbonic-silicate'
  });
};

/**
 * Aluminate gives back Al(OH)3 with weak acids: carbon dioxide or ammonium salts.
 * Na[Al(OH)4] + CO2 -> Al(OH)3 + NaHCO3; Na[Al(OH)4] + NH4Cl -> Al(OH)3 + NaCl + NH3 + H2O.
 */
const aluminateAcid: Rule = (v, ctx) => {
  const al = amt(v.aq, '[Al(OH)4]^-');
  if (al <= EPS) return null;
  const aParent = parentOf(v, '[Al(OH)4]^-', 'Na[Al(OH)4]');
  const cat = counterIon(aParent, '[Al(OH)4]^-') || 'Na^+';
  const co2 = amt(v.aq, 'CO2');
  if (co2 > EPS) {
    const n = Math.min(al, co2);
    take(v.aq, '[Al(OH)4]^-', n); take(v.aq, 'CO2', n);
    put(v.solids, 'Al(OH)3', n);
    putIon(v, 'HCO3^-', n, salt(cat, 'HCO3^-').id);
    setParent(v, [cat], salt(cat, 'HCO3^-').id);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'aluminateAcid', importance: 2, type: 'exchange',
      eq: { reactants: [aParent, 'CO2'], products: ['Al(OH)3', salt(cat, 'HCO3^-').id], precip: ['Al(OH)3'] }, p: { acid: 'CO2' }, signs: ['precip'], key: 'aluminate:CO2'
    });
  }
  const nh4 = amt(v.aq, 'NH4^+');
  if (nh4 > EPS && amt(v.aq, 'OH^-') <= EPS) {
    const n = Math.min(al, nh4);
    const nParent = parentOf(v, 'NH4^+', 'NH4Cl');
    const anion = counterIon(nParent, 'NH4^+') || 'Cl^-';
    take(v.aq, '[Al(OH)4]^-', n); take(v.aq, 'NH4^+', n);
    put(v.solids, 'Al(OH)3', n);
    put(v.aq, 'NH3', n);
    v.parent['NH3'] = 'NH3·H2O';
    setParent(v, [cat, anion], salt(cat, anion).id);
    v.fx.precipAt = ctx.now;
    v.fx.smellAt = ctx.now;
    return ev({
      kind: 'aluminateAcid', importance: 2, type: 'exchange',
      eq: { reactants: [aParent, nParent], products: ['Al(OH)3', salt(cat, anion).id, 'NH3', 'H2O'], precip: ['Al(OH)3'] }, p: { acid: nParent }, signs: ['precip', 'smell'], key: 'aluminate:NH4'
    });
  }
  return null;
};

/** Barium and lead take chromate out of a dichromate solution: 2Ba2+ + Cr2O7^2- + H2O -> 2BaCrO4 + 2H+. */
const dichromatePrecip: Rule = (v, ctx) => {
  const d = amt(v.aq, 'Cr2O7^2-');
  if (d <= EPS) return null;
  for (const m of ['Ba^2+', 'Pb^2+']) {
    const n = Math.min(amt(v.aq, m) / 2, d);
    if (n <= EPS) continue;
    const mParent = parentOf(v, m, salt(m, 'NO3^-').id);
    const anion = counterIon(mParent, m) || 'Cl^-';
    const dParent = parentOf(v, 'Cr2O7^2-', 'K2Cr2O7');
    const cat = counterIon(dParent, 'Cr2O7^2-') || 'K^+';
    const chromate = salt(m, 'CrO4^2-');
    take(v.aq, m, 2 * n); take(v.aq, 'Cr2O7^2-', n);
    put(v.solids, chromate.id, 2 * n);
    putIon(v, 'H^+', 2 * n, salt('H^+', anion).id);
    setParent(v, [cat], salt(cat, anion).id);
    v.fx.precipAt = ctx.now;
    // When both ions are already booked to one compound, there is no honest molecular equation to show.
    const eq: EqSpec | undefined = mParent === dParent || anion === 'Cr2O7^2-' ? undefined
      : { reactants: [mParent, dParent, 'H2O'], products: [chromate.id, salt(cat, anion).id, salt('H^+', anion).id], precip: [chromate.id] };
    return ev({
      kind: 'precip', importance: 2, type: 'exchange', eq,
      p: { product: chromate.id, color: chromate.color || 'yellow', sol: 'N' }, signs: ['precip'], key: `precip:${chromate.id}:Cr2O7`
    });
  }
  return null;
};

/** Iron(III) and copper(II) take electrons from iodide: iodine turns the solution brown. */
const iodideOx: Rule = (v, ctx) => {
  const iod = amt(v.aq, 'I^-');
  if (iod <= EPS) return null;
  const iParent = parentOf(v, 'I^-', 'KI');
  const cat = counterIon(iParent, 'I^-') || 'K^+';
  const fe = amt(v.aq, 'Fe^3+');
  if (fe > EPS) {
    const n = Math.min(fe, iod);
    const feParent = parentOf(v, 'Fe^3+', 'FeCl3');
    const anion = counterIon(feParent, 'Fe^3+') || 'Cl^-';
    take(v.aq, 'Fe^3+', n);
    take(v.aq, 'I^-', n);
    putIon(v, 'Fe^2+', n, salt('Fe^2+', anion).id);
    put(v.aq, 'I2', n / 2);
    setParent(v, [cat], salt(cat, anion).id);
    return ev({
      kind: 'iodideOx', importance: 2, type: 'redox',
      eq: { reactants: [feParent, iParent], products: uniq([salt('Fe^2+', anion).id, 'I2', salt(cat, anion).id]) }, p: { ion: 'Fe^3+' },
      signs: ['color'], key: 'iodide:Fe3'
    });
  }
  const cu = amt(v.aq, 'Cu^2+');
  if (cu > EPS) {
    const n = Math.min(cu, iod / 2);
    const cuParent = parentOf(v, 'Cu^2+', 'CuSO4');
    const anion = counterIon(cuParent, 'Cu^2+') || 'SO4^2-';
    take(v.aq, 'Cu^2+', n);
    take(v.aq, 'I^-', 2 * n);
    put(v.solids, 'CuI', n);
    put(v.aq, 'I2', n / 2);
    setParent(v, [cat, anion], salt(cat, anion).id);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'iodideOx', importance: 2, type: 'redox',
      eq: { reactants: [cuParent, iParent], products: ['CuI', 'I2', salt(cat, anion).id], precip: ['CuI'] }, p: { ion: 'Cu^2+' },
      signs: ['precip', 'color'], key: 'iodide:Cu2'
    });
  }
  return null;
};

// e: electrons given by one unit of the reducer; hOut: H+ it releases (H2S -> S + 2H+ + 2e).
interface Reducer { id: string; e: number; hOut: number; fallback: string; minH?: number; molecule?: boolean }
const REDUCERS: Reducer[] = [
  { id: 'Fe^2+', e: 1, hOut: 0, fallback: 'FeSO4' },
  { id: 'I^-', e: 1, hOut: 0, fallback: 'KI' },
  { id: 'S^2-', e: 2, hOut: 0, fallback: 'Na2S' },
  { id: 'H2S', e: 2, hOut: 2, fallback: 'H2S', molecule: true },
  { id: 'SO3^2-', e: 2, hOut: 2, fallback: 'Na2SO3' },
  { id: 'SO2', e: 2, hOut: 4, fallback: 'SO2', molecule: true },
  { id: 'S2O3^2-', e: 8, hOut: 10, fallback: 'Na2S2O3' },
  { id: 'H2O2', e: 2, hOut: 2, fallback: 'H2O2', molecule: true },
  // Chloride gives chlorine only in concentrated hydrochloric acid.
  { id: 'Cl^-', e: 1, hOut: 0, fallback: 'HCl', minH: 5 }
];

/** Textbook coefficients where the balancer finds more than one answer. */
const MANUAL_K: Record<string, number[]> = {
  'MnO4^-|H2O2|SO4^2-': [2, 5, 3, 2, 5, 1, 8], 'MnO4^-|H2O2|Cl^-': [2, 5, 6, 2, 5, 2, 8],
  'Cr2O7^2-|H2O2|SO4^2-': [1, 3, 4, 1, 3, 1, 7], 'Cr2O7^2-|H2O2|Cl^-': [1, 3, 8, 2, 3, 2, 7],
  'MnO4^-|S^2-|SO4^2-': [2, 5, 8, 2, 5, 1, 5, 8], 'MnO4^-|H2S|SO4^2-': [2, 5, 3, 2, 5, 1, 8],
  'Cr2O7^2-|S^2-|SO4^2-': [1, 3, 7, 1, 3, 1, 3, 7], 'Cr2O7^2-|H2S|SO4^2-': [1, 3, 4, 1, 3, 1, 7]
};

/** Concentration in mol/L. */
const molar = (v: Vessel, id: string) => (v.volume > 0.01 ? amt(v.aq, id) / v.volume : 0);

/** Permanganate or dichromate in acid oxidise a reducer: the violet or orange color changes. */
function strongOxidiser(v: Vessel, ctx: Ctx, oxIon: string, eOx: number, hIn: number, reduced: string, nReduced: number, kind: 'permanganateRedox' | 'dichromateRedox'): ReactionEvent | null {
  const ox = amt(v.aq, oxIon);
  const h = amt(v.aq, 'H^+');
  if (ox <= EPS) return null;
  for (const r of REDUCERS) {
    const red = amt(v.aq, r.id);
    if (red <= EPS || (r.minH && molar(v, 'H^+') < r.minH)) continue;
    const ratio = eOx / r.e;                 // reducer units per oxidiser unit
    const hNet = hIn - ratio * r.hOut;       // H+ used per oxidiser unit
    // Without added acid only sulfur dioxide works: it makes its own acid (2KMnO4 + 5SO2 + 2H2O).
    if (h <= EPS && hNet > 0) continue;
    const u = Math.min(ox, red / ratio, hNet > 0 ? h / hNet : Infinity);
    if (u <= EPS) continue;
    const ownAcid = hNet <= 0;
    const acid = h > EPS && !ownAcid ? acidOf(v) : { parent: 'H2SO4', anion: 'SO4^2-' };
    const oxParent = parentOf(v, oxIon, oxIon === 'MnO4^-' ? 'KMnO4' : 'K2Cr2O7');
    const oxCat = counterIon(oxParent, oxIon) || 'K^+';
    const rParent = r.molecule ? r.id : r.id === 'Cl^-' ? acid.parent : parentOf(v, r.id, r.fallback);
    const w = u * ratio;
    take(v.aq, oxIon, u);
    take(v.aq, r.id, w);
    if (hNet > 0) take(v.aq, 'H^+', u * hNet);
    else putIon(v, 'H^+', -u * hNet, 'H2SO4');
    const reducedSalt = salt(reduced, acid.anion).id;
    putIon(v, reduced, u * nReduced, reducedSalt);
    const products = [reducedSalt];
    const signs: ReactionEvent['signs'] = ['color'];
    let precip: string[] | undefined;
    if (r.id === 'Fe^2+') { putIon(v, 'Fe^3+', w, salt('Fe^3+', acid.anion).id); products.push(salt('Fe^3+', acid.anion).id); }
    if (r.id === 'I^-') { put(v.aq, 'I2', w / 2); products.push('I2'); }
    if (r.id === 'SO3^2-' || r.id === 'SO2') putIon(v, 'SO4^2-', w, salt(oxCat, 'SO4^2-').id);
    if (r.id === 'S2O3^2-') putIon(v, 'SO4^2-', 2 * w, salt(oxCat, 'SO4^2-').id);
    if (r.id === 'S^2-' || r.id === 'H2S') {
      put(v.solids, 'S', w); products.push('S'); precip = ['S']; signs.push('precip'); v.fx.precipAt = ctx.now;
    }
    if (r.id === 'H2O2') { addGas(v, 'O2', w / 2, ctx.now); products.push('O2'); signs.push('gas'); }
    if (r.id === 'Cl^-') { addGas(v, 'Cl2', w / 2, ctx.now); products.push('Cl2'); signs.push('gas', 'smell'); v.fx.smellAt = ctx.now; }
    products.push(salt(oxCat, acid.anion).id);
    const rCat = r.molecule || r.id === 'Cl^-' ? undefined : counterIon(rParent, r.id);
    const sulfurOx = r.id === 'SO3^2-' || r.id === 'S2O3^2-';
    if (rCat && rCat.endsWith('+') && rCat !== 'H^+') products.push(salt(rCat, sulfurOx ? 'SO4^2-' : acid.anion).id);
    // Thiosulfate gives two sulfates for one: the extra sulfur leaves as sulfuric acid.
    if (ownAcid || (r.id === 'S2O3^2-' && acid.anion !== 'SO4^2-')) products.push('H2SO4');
    if (!ownAcid) products.push('H2O');
    release(v, 30 * u);
    // With hydrogen peroxide the balancer has more than one answer (peroxide can also just decompose):
    // give the textbook coefficients.
    // Sulfide and hydrogen sulfide in sulfuric acid too: sulfur is on both sides.
    const rCatOk = !rCat || rCat === 'Na^+';
    const manualK = oxCat === 'K^+' && rCatOk && !ownAcid
      ? MANUAL_K[`${oxIon}|${r.id}|${acid.anion}`]
      : undefined;
    const reactants = ownAcid ? [oxParent, rParent, 'H2O'] : uniq([oxParent, rParent, acid.parent]);
    return ev({
      kind, importance: 2, type: 'redox',
      eq: { reactants, products: uniq(products), precip, k: manualK, gas: r.id === 'H2O2' ? ['O2'] : r.id === 'Cl^-' ? ['Cl2'] : undefined, conc: r.id === 'Cl^-' ? 'HCl' : undefined },
      p: { red: r.id, medium: 'acid' }, signs, safety: r.id === 'Cl^-' ? 'fumeHood' : undefined, key: `${kind === 'permanganateRedox' ? 'permanganate' : 'dichromate'}:${r.id}`
    });
  }
  return null;
}

const permanganateRedox: Rule = (v, ctx) => strongOxidiser(v, ctx, 'MnO4^-', 5, 8, 'Mn^2+', 1, 'permanganateRedox');
const dichromateRedox: Rule = (v, ctx) => strongOxidiser(v, ctx, 'Cr2O7^2-', 6, 14, 'Cr^3+', 2, 'dichromateRedox');

/**
 * Permanganate without acid: in neutral solution it turns into a brown precipitate of MnO2,
 * in alkaline solution into green manganate. The classic "permanganate in three media".
 */
const permanganateNoAcid: Rule = (v, ctx) => {
  const mn = amt(v.aq, 'MnO4^-');
  if (mn <= EPS || amt(v.aq, 'H^+') > EPS || waterVolume(v) <= 0.05) return null;
  const oh = amt(v.aq, 'OH^-');
  const oxParent = parentOf(v, 'MnO4^-', 'KMnO4');
  const oxCat = counterIon(oxParent, 'MnO4^-') || 'K^+';
  // Alkaline (noticeable excess of alkali): MnO4- + e -> MnO4^2-, green manganate.
  const alkaline = oh > EPS && (molar(v, 'OH^-') >= 0.05 || amt(v.aq, 'SO3^2-') > EPS);
  if (alkaline) {
    // [reducer, electrons, OH- used per reducer, product of the reducer, fallback parent]
    const ALK: [string, number, number, string, string][] = [
      ['SO3^2-', 2, 2, 'SO4^2-', 'Na2SO3'], ['H2O2', 2, 2, 'O2', 'H2O2'], ['I^-', 6, 6, 'IO3^-', 'KI']
    ];
    for (const [red, e, ohPer, prod, fallback] of ALK) {
      const r = amt(v.aq, red);
      if (r <= EPS) continue;
      const w = Math.min(r, mn / e, oh / ohPer);
      if (w <= EPS) continue;
      const rParent = red === 'H2O2' ? 'H2O2' : parentOf(v, red, fallback);
      const rCat = red === 'H2O2' ? undefined : counterIon(rParent, red) || 'K^+';
      const base = baseOf(v);
      take(v.aq, 'MnO4^-', e * w); take(v.aq, red, w); take(v.aq, 'OH^-', ohPer * w);
      putIon(v, 'MnO4^2-', e * w, salt(oxCat, 'MnO4^2-').id);
      const products = [salt(oxCat, 'MnO4^2-').id];
      if (base.cation !== oxCat) products.push(salt(base.cation, 'MnO4^2-').id);
      if (prod === 'O2') { addGas(v, 'O2', w, ctx.now); products.push('O2'); }
      else { putIon(v, prod, w, salt(rCat!, prod).id); products.push(salt(rCat!, prod).id); }
      products.push('H2O');
      // Peroxide can also just break down, so the balancer needs the textbook answer.
      const k = red === 'H2O2' && oxCat === 'K^+' ? (base.cation === 'K^+' ? [2, 1, 2, 2, 1, 2] : base.cation === 'Na^+' ? [2, 1, 2, 1, 1, 1, 2] : undefined) : undefined;
      return ev({
        kind: 'permanganateRedox', importance: 2, type: 'redox',
        eq: { reactants: uniq([oxParent, rParent, base.parent]), products: uniq(products), gas: prod === 'O2' ? ['O2'] : undefined, k },
        p: { red, medium: 'alkaline' }, signs: prod === 'O2' ? ['color', 'gas'] : ['color'], key: 'permanganate:alkaline'
      });
    }
  }
  // Neutral: MnO4- + 3e -> MnO2 (brown precipitate); OH- is left in the solution
  // (or H+ when manganese(II) itself is the reducer: 2MnO4- + 3Mn2+ + 2H2O -> 5MnO2 + 4H+).
  // [reducer, electrons, OH- per MnO4-, fallback parent]
  const NEUTRAL: [string, number, number, string][] = [
    ['SO3^2-', 2, 1, 'Na2SO3'], ['I^-', 1, 4, 'KI'], ['H2O2', 2, 1, 'H2O2'], ['H2S', 2, 1, 'H2S'],
    ['S^2-', 2, 4, 'Na2S'], ['S2O3^2-', 8, 0.25, 'Na2S2O3'], ['Mn^2+', 2, -2, 'MnSO4']
  ];
  for (const [red, e, ohPerMn, fallback] of NEUTRAL) {
    const r = amt(v.aq, red);
    if (r <= EPS) continue;
    const u = Math.min(mn, (r * e) / 3);
    if (u <= EPS) continue;
    const w = (u * 3) / e;
    const molecule = red === 'H2O2' || red === 'H2S';
    const rParent = molecule ? red : parentOf(v, red, fallback);
    const rCat = molecule ? undefined : counterIon(rParent, red) || 'K^+';
    take(v.aq, 'MnO4^-', u); take(v.aq, red, w);
    put(v.solids, 'MnO2', red === 'Mn^2+' ? u + w : u);
    const products = ['MnO2'];
    const precip = ['MnO2'];
    if (ohPerMn > 0) putIon(v, 'OH^-', ohPerMn * u, salt(oxCat, 'OH^-').id);
    else putIon(v, 'H^+', -ohPerMn * u, 'H2SO4');
    if (red === 'SO3^2-') { putIon(v, 'SO4^2-', w, salt(rCat!, 'SO4^2-').id); products.push(salt(rCat!, 'SO4^2-').id); }
    if (red === 'S2O3^2-') {
      putIon(v, 'SO4^2-', 2 * w, salt(rCat!, 'SO4^2-').id);
      products.push(salt(rCat!, 'SO4^2-').id, salt(oxCat, 'SO4^2-').id);
    }
    if (red === 'I^-') { put(v.aq, 'I2', w / 2); products.push('I2'); }
    if (red === 'H2O2') { addGas(v, 'O2', w / 2, ctx.now); products.push('O2'); }
    if (red === 'H2S' || red === 'S^2-') { put(v.solids, 'S', w); products.push('S'); precip.push('S'); }
    if (red === 'Mn^2+') {
      const anion = counterIon(rParent, red) || 'SO4^2-';
      products.push(salt(oxCat, anion).id, salt('H^+', anion).id);
    } else {
      products.push(salt(oxCat, 'OH^-').id);
      if (rCat && rCat !== oxCat && red !== 'SO3^2-' && red !== 'S2O3^2-') products.push(salt(rCat, 'OH^-').id);
    }
    if (red === 'H2O2' || red === 'H2S') products.push('H2O');
    v.fx.precipAt = ctx.now;
    const reactants = uniq([oxParent, rParent]);
    if (red !== 'H2O2' && red !== 'H2S') reactants.push('H2O');
    return ev({
      kind: 'permanganateRedox', importance: 2, type: 'redox',
      eq: { reactants, products: uniq(products), precip, gas: red === 'H2O2' ? ['O2'] : undefined, k: red === 'H2O2' && oxCat === 'K^+' ? [2, 3, 2, 3, 2, 2] : undefined },
      p: { red, medium: 'neutral' }, signs: red === 'H2O2' ? ['precip', 'color', 'gas'] : ['precip', 'color'], key: `permanganate:neutral:${red}`
    });
  }
  return null;
};

/** Hydrogen peroxide takes electrons from iodide: the solution turns yellow-brown with iodine. */
const peroxideIodide: Rule = (v, ctx) => {
  const p2 = amt(v.aq, 'H2O2');
  const iod = amt(v.aq, 'I^-');
  if (p2 <= EPS || iod <= EPS) return null;
  const iParent = parentOf(v, 'I^-', 'KI');
  const cat = counterIon(iParent, 'I^-') || 'K^+';
  const h = amt(v.aq, 'H^+');
  if (h > EPS) {
    const u = Math.min(p2, iod / 2, h / 2);
    const acid = acidOf(v);
    take(v.aq, 'H2O2', u); take(v.aq, 'I^-', 2 * u); take(v.aq, 'H^+', 2 * u);
    put(v.aq, 'I2', u);
    setParent(v, [cat, acid.anion], salt(cat, acid.anion).id);
    return ev({
      kind: 'iodideOx', importance: 2, type: 'redox',
      eq: { reactants: uniq(['H2O2', iParent, acid.parent]), products: ['I2', salt(cat, acid.anion).id, 'H2O'] }, p: { ion: 'H2O2' },
      signs: ['color'], key: 'iodide:H2O2'
    });
  }
  // Without acid the reaction is slow: the solution yellows gradually, and iodide also makes the
  // peroxide break down, so small oxygen bubbles rise.
  if (!once(ctx, 'h2o2-iodide')) return null;
  const dt = ctx.dt ?? 0;
  const first = !v.seen.includes('iodide:H2O2');
  const most = Math.min(p2, iod / 2);
  const vol = Math.max(v.volume, 0.05);
  const u = dt <= 0
    ? (first ? most * 0.05 : 0)
    : Math.min(most, 0.004 * (p2 / vol) * (iod / vol) * vol * warmth(v.temp) * dt);
  if (u <= 1e-7) return null;
  take(v.aq, 'H2O2', u); take(v.aq, 'I^-', 2 * u);
  put(v.aq, 'I2', u);
  putIon(v, 'OH^-', 2 * u, salt(cat, 'OH^-').id);
  const o2 = Math.min(amt(v.aq, 'H2O2'), 2 * u);
  take(v.aq, 'H2O2', o2);
  addGas(v, 'O2', o2 / 2, ctx.now);
  if (!first) return ev({ kind: 'minor', importance: 0, type: 'redox' });
  return ev({
    kind: 'iodideOx', importance: 2, type: 'redox',
    eq: { reactants: ['H2O2', iParent], products: ['I2', salt(cat, 'OH^-').id] }, p: { ion: 'H2O2', slow: '1' }, signs: ['color', 'gas'], key: 'iodide:H2O2'
  });
};

/** Iron(II) is oxidised to iron(III): by hydrogen peroxide, or by dilute nitric acid (NO comes off). */
const iron2Ox: Rule = (v, ctx) => {
  const p2 = amt(v.aq, 'H2O2');
  const feOH = amt(v.solids, 'Fe(OH)2');
  if (p2 > EPS && feOH > EPS) {
    // 2Fe(OH)2 + H2O2 -> 2Fe(OH)3: the green precipitate turns brown at once.
    const n = Math.min(feOH, 2 * p2);
    take(v.solids, 'Fe(OH)2', n); take(v.aq, 'H2O2', n / 2);
    put(v.solids, 'Fe(OH)3', n);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'iron2Ox', importance: 2, type: 'redox',
      eq: { reactants: ['Fe(OH)2', 'H2O2'], products: ['Fe(OH)3'], precip: ['Fe(OH)3'] },
      p: { ox: 'H2O2', solid: '1' }, signs: ['color'], key: 'iron2:H2O2:solid'
    });
  }
  const fe = amt(v.aq, 'Fe^2+');
  if (fe <= EPS) return null;
  const feParent = parentOf(v, 'Fe^2+', 'FeSO4');
  const anion = counterIon(feParent, 'Fe^2+') || 'SO4^2-';
  const h = amt(v.aq, 'H^+');
  if (p2 > EPS) {
    if (h > EPS) {
      // 2Fe2+ + H2O2 + 2H+ -> 2Fe3+ + 2H2O
      const n = Math.min(fe, 2 * p2, h);
      const acid = acidOf(v);
      take(v.aq, 'Fe^2+', n); take(v.aq, 'H2O2', n / 2); take(v.aq, 'H^+', n);
      putIon(v, 'Fe^3+', n, salt('Fe^3+', anion).id);
      setParent(v, [acid.anion], salt('Fe^3+', acid.anion).id);
      return ev({
        kind: 'iron2Ox', importance: 2, type: 'redox',
        eq: { reactants: uniq([feParent, 'H2O2', acid.parent]), products: uniq([salt('Fe^3+', anion).id, salt('Fe^3+', acid.anion).id, 'H2O']) },
        p: { ox: 'H2O2', acid: acid.parent }, signs: ['color'], key: 'iron2:H2O2'
      });
    }
    // Without acid part of the iron comes out as brown Fe(OH)3: 6Fe2+ + 3H2O2 -> 4Fe3+ + 2Fe(OH)3.
    const n = Math.min(fe, 2 * p2);
    take(v.aq, 'Fe^2+', n); take(v.aq, 'H2O2', n / 2);
    putIon(v, 'Fe^3+', (2 * n) / 3, salt('Fe^3+', anion).id);
    put(v.solids, 'Fe(OH)3', n / 3);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'iron2Ox', importance: 2, type: 'redox',
      eq: { reactants: [feParent, 'H2O2'], products: [salt('Fe^3+', anion).id, 'Fe(OH)3'], precip: ['Fe(OH)3'] },
      p: { ox: 'H2O2' }, signs: ['color', 'precip'], key: 'iron2:H2O2'
    });
  }
  // Dilute nitric acid (concentrated acid is handled with the other concentrated acids):
  // 3Fe2+ + NO3- + 4H+ -> 3Fe3+ + NO + 2H2O; slow in the cold when the acid is weak.
  const no3 = amt(v.aq, 'NO3^-');
  const hM = molar(v, 'H^+');
  if (no3 > EPS && h > EPS && hM < 6 && (hM >= 1 || v.temp >= 50) && acidOf(v).parent === 'HNO3') {
    const n = Math.min(fe, 3 * no3, (3 * h) / 4);
    if (n <= EPS) return null;
    take(v.aq, 'Fe^2+', n); take(v.aq, 'NO3^-', n / 3); take(v.aq, 'H^+', (4 * n) / 3);
    putIon(v, 'Fe^3+', n, salt('Fe^3+', anion).id);
    addGas(v, 'NO', n / 3, ctx.now);
    return ev({
      kind: 'iron2Ox', importance: 2, type: 'redox',
      eq: { reactants: [feParent, 'HNO3'], products: uniq([salt('Fe^3+', anion).id, salt('Fe^3+', 'NO3^-').id, 'NO', 'H2O']), gas: ['NO'] },
      p: { ox: 'HNO3' }, signs: ['color', 'gas'], key: 'iron2:HNO3'
    });
  }
  return null;
};

/** Iron(III) takes electrons from sulfite, thiosulfate, hydrogen sulfide and sulfur dioxide. */
const iron3Reduce: Rule = (v, ctx) => {
  const fe = amt(v.aq, 'Fe^3+');
  if (fe <= EPS || waterVolume(v) <= 0.05) return null;
  const feParent = parentOf(v, 'Fe^3+', 'FeCl3');
  const anion = counterIon(feParent, 'Fe^3+') || 'Cl^-';
  const fe2 = salt('Fe^2+', anion).id;
  const acidSalt = salt('H^+', anion).id;
  // [reducer, Fe3+ per reducer, H+ released per reducer, fallback]
  const LIST: [string, number, number, string][] = [['SO3^2-', 2, 2, 'Na2SO3'], ['S2O3^2-', 1, 0, 'Na2S2O3'], ['H2S', 2, 2, 'H2S'], ['SO2', 2, 4, 'SO2']];
  for (const [red, k, hOut, fallback] of LIST) {
    const r = amt(v.aq, red);
    const w = Math.min(r, fe / k);
    if (w <= EPS) continue;
    const molecule = red === 'H2S' || red === 'SO2';
    const rParent = molecule ? red : parentOf(v, red, fallback);
    const rCat = molecule ? undefined : counterIon(rParent, red) || 'Na^+';
    take(v.aq, 'Fe^3+', k * w); take(v.aq, red, w);
    putIon(v, 'Fe^2+', k * w, fe2);
    if (hOut) putIon(v, 'H^+', hOut * w, acidSalt);
    const products = [fe2];
    const reactants = [feParent, rParent];
    const signs: ReactionEvent['signs'] = ['color'];
    let precip: string[] | undefined;
    if (red === 'SO3^2-') { putIon(v, 'SO4^2-', w, salt(rCat!, 'SO4^2-').id); products.push(salt(rCat!, 'SO4^2-').id, acidSalt); reactants.push('H2O'); }
    if (red === 'S2O3^2-') {
      // Thiosulfate pairs up into tetrathionate: 2Fe3+ + 2S2O3^2- -> 2Fe2+ + S4O6^2-.
      putIon(v, 'S4O6^2-', w / 2, salt(rCat!, 'S4O6^2-').id);
      products.push(salt(rCat!, 'S4O6^2-').id, salt(rCat!, anion).id);
    }
    if (red === 'H2S') { put(v.solids, 'S', w); products.push('S', acidSalt); precip = ['S']; signs.push('precip'); v.fx.precipAt = ctx.now; }
    if (red === 'SO2') { products.push('H2SO4', acidSalt); reactants.push('H2O'); }
    return ev({
      kind: 'iron3Reduce', importance: 2, type: 'redox',
      eq: { reactants, products: uniq(products), precip }, p: { red }, signs, key: `iron3:${red}`
    });
  }
  return null;
};

/**
 * Dilute nitric acid is an oxidiser, not just an acid: sulfide gives sulfur, sulfite gives sulfate,
 * iodide gives iodine, and nitrogen(II) oxide comes off instead of H2S or SO2.
 */
const nitricRedox: Rule = (v, ctx) => {
  const h = amt(v.aq, 'H^+');
  const no3 = amt(v.aq, 'NO3^-');
  if (h <= EPS || no3 <= EPS || molar(v, 'H^+') >= 6 || acidOf(v).parent !== 'HNO3') return null;
  // [reducer, reducer units per NO, H+ per NO, product, fallback]
  const LIST: [string, number, number, string, string][] = [
    ['S^2-', 1.5, 4, 'S', 'Na2S'], ['SO3^2-', 1.5, 1, 'SO4^2-', 'Na2SO3'], ['I^-', 3, 4, 'I2', 'KI']
  ];
  for (const [red, perNO, hPerNO, prod, fallback] of LIST) {
    const r = amt(v.aq, red);
    if (r <= EPS) continue;
    if (red === 'I^-' && molar(v, 'H^+') < 1 && v.temp < 50) continue;
    const nNO = Math.min(r / perNO, no3, h / hPerNO);
    if (nNO <= EPS) continue;
    const rParent = parentOf(v, red, fallback);
    const cat = counterIon(rParent, red) || 'Na^+';
    take(v.aq, red, nNO * perNO); take(v.aq, 'NO3^-', nNO); take(v.aq, 'H^+', nNO * hPerNO);
    addGas(v, 'NO', nNO, ctx.now);
    const products: string[] = [];
    const signs: ReactionEvent['signs'] = ['gas'];
    let precip: string[] | undefined;
    if (prod === 'S') { put(v.solids, 'S', nNO * perNO); precip = ['S']; signs.push('precip'); v.fx.precipAt = ctx.now; products.push(salt(cat, 'NO3^-').id, 'S'); }
    if (prod === 'SO4^2-') { putIon(v, 'SO4^2-', nNO * perNO, salt(cat, 'SO4^2-').id); products.push(salt(cat, 'SO4^2-').id); }
    if (prod === 'I2') { put(v.aq, 'I2', (nNO * perNO) / 2); signs.push('color'); products.push(salt(cat, 'NO3^-').id, 'I2'); }
    setParent(v, [cat], prod === 'SO4^2-' ? salt(cat, 'SO4^2-').id : salt(cat, 'NO3^-').id);
    products.push('NO', 'H2O');
    return ev({
      kind: 'nitricRedox', importance: 2, type: 'redox',
      eq: { reactants: [rParent, 'HNO3'], products, precip, gas: ['NO'] }, p: { red, product: prod }, signs, key: `nitric:${red}`
    });
  }
  return null;
};

/** Iron(III) salts dissolve metals, even copper (this is how circuit boards are etched). */
const iron3Metal: Rule = (v) => {
  const fe = amt(v.aq, 'Fe^3+');
  if (fe <= EPS || waterVolume(v) <= 0.05) return null;
  for (const m of ['Mg', 'Al', 'Mn', 'Zn', 'Fe', 'Co', 'Ni', 'Sn', 'Pb', 'Cu']) {
    const n = amt(v.solids, m);
    if (n <= EPS) continue;
    const ion = METALS[m].ion;
    const z = IONS[ion].charge;
    const e = Math.min(n, fe / z);
    if (e <= EPS) continue;
    const feParent = parentOf(v, 'Fe^3+', 'FeCl3');
    const anion = counterIon(feParent, 'Fe^3+') || 'Cl^-';
    const mySalt = salt(ion, anion);
    take(v.solids, m, e);
    take(v.aq, 'Fe^3+', z * e);
    putIon(v, 'Fe^2+', z * e, salt('Fe^2+', anion).id);
    if (mySalt.phase === 's') put(v.solids, mySalt.id, e); else putIon(v, ion, e, mySalt.id);
    return ev({
      kind: 'iron3Metal', importance: 2, type: 'redox',
      eq: { reactants: [m, feParent], products: uniq([mySalt.id, salt('Fe^2+', anion).id]) }, p: { metal: m },
      signs: IONS[ion].color ? ['dissolve', 'color'] : ['dissolve', 'color'], key: `iron3:${m}`
    });
  }
  return null;
};

/** Sulfide with aluminium, chromium(III) or iron(III): no sulfide precipitates, water takes part. */
const sulfideHydrolysis: Rule = (v, ctx) => {
  const s2 = amt(v.aq, 'S^2-');
  if (s2 <= EPS) return null;
  for (const m of ['Al^3+', 'Cr^3+', 'Fe^3+']) {
    const a = amt(v.aq, m);
    const u = Math.min(a / 2, s2 / 3);
    if (u <= EPS) continue;
    const mParent = parentOf(v, m, salt(m, 'Cl^-').id);
    const sParent = parentOf(v, 'S^2-', 'Na2S');
    const mAnion = counterIon(mParent, m) || 'Cl^-';
    const sCat = counterIon(sParent, 'S^2-') || 'Na^+';
    const spectator = salt(sCat, mAnion).id;
    take(v.aq, m, 2 * u);
    take(v.aq, 'S^2-', 3 * u);
    setParent(v, [mAnion, sCat], spectator);
    v.fx.precipAt = ctx.now;
    if (m === 'Fe^3+') {
      put(v.solids, 'FeS', 2 * u);
      put(v.solids, 'S', u);
      return ev({
        kind: 'sulfideHydrolysis', importance: 2, type: 'redox',
        eq: { reactants: [mParent, sParent], products: ['FeS', 'S', spectator], precip: ['FeS', 'S'] }, p: { ion: m, product: 'FeS' },
        signs: ['precip'], key: 'sulfide:Fe3'
      });
    }
    const hyd = salt(m, 'OH^-').id;
    put(v.solids, hyd, 2 * u);
    addGas(v, 'H2S', 3 * u, ctx.now);
    v.fx.smellAt = ctx.now;
    return ev({
      kind: 'sulfideHydrolysis', importance: 2, type: 'exchange',
      eq: { reactants: [mParent, sParent, 'H2O'], products: [hyd, 'H2S', spectator], precip: [hyd], gas: ['H2S'] }, p: { ion: m, product: hyd },
      signs: ['precip', 'gas', 'smell'], safety: 'fumeHood', key: `sulfide:${m}`
    });
  }
  return null;
};

/** Chlorine water bleaches indicator dyes. */
const bleach: Rule = (v) => {
  const cl = amt(v.aq, 'Cl2');
  // Phenolphthalein is colourless in chlorine water (it is acidic): nothing to bleach.
  const ids = Object.keys(v.inds).filter((id) => id !== 'phph');
  if (cl <= EPS || ids.length === 0) return null;
  const drops = ids.reduce((s, k) => s + (v.inds[k as keyof typeof v.inds] || 0), 0);
  v.inds = {};
  take(v.aq, 'Cl2', Math.min(cl, drops * 0.002));
  return ev({ kind: 'bleach', importance: 2, type: 'redox', p: { ind: ids[ids.length - 1] }, signs: ['color'], key: 'chlorine-bleach' });
};

/** Starch turns deep blue with iodine. */
const starchIodine: Rule = (v, ctx) => {
  const st = amt(v.aq, 'starch') > EPS;
  const i2 = amt(v.aq, 'I2') > 1e-5;
  if (st && !i2 && v.fx.iodineBlue) { delete v.fx.iodineBlue; return null; }
  if (!st || !i2 || v.fx.iodineBlue) return null;
  v.fx.iodineBlue = ctx.now;
  return ev({ kind: 'starchIodine', importance: 2, type: 'complex', signs: ['color'], key: 'starch-iodine' });
};

export const MORE_EARLY: Rule[] = [
  chromateAcid, dichromateBase, dichromatePrecip, gasAcidBase,
  // Oxidation and reduction come before the acids push weak-acid gases out (sulfide + HNO3 gives sulfur, not H2S).
  nitricRedox, iron2Ox, iron3Reduce, halogenDisplace, halogenReduce, halogenThio, halogenAlkali, chlorineSilver,
  iodideOx, permanganateRedox, dichromateRedox, permanganateNoAcid, peroxideIodide, iron3Metal,
  sulfideAcid, sulfiteAcid, thiosulfateAcid, h2sPrecip, sulfurComprop, carbonicSilicate, aluminateAcid,
  sulfideHydrolysis, bleach
];

// ---------------------------------------------------------------- concentrated acids, preparing gases

/** Concentrated sulfuric acid drives hydrogen chloride out of table salt: the lab way to get HCl. */
const hclFromSalt: Rule = (v, ctx) => {
  const acid = amt(v.aq, 'H2SO4c');
  if (acid <= EPS || waterVolume(v) > 0.05) return null;
  for (const s of ['NaCl', 'KCl']) {
    const e = Math.min(amt(v.solids, s), acid);
    if (e <= EPS) continue;
    const cat = s === 'NaCl' ? 'Na^+' : 'K^+';
    const hs = salt(cat, 'HSO4^-').id;
    take(v.solids, s, e);
    take(v.aq, 'H2SO4c', e);
    v.concVol = Math.max(0, v.concVol - e / 18.4);
    v.volume = Math.max(0, v.volume - e / 18.4);
    put(v.solids, hs, e);
    addGas(v, 'HCl', e, ctx.now);
    v.fx.smokeAt = ctx.now;
    v.fx.smellAt = ctx.now;
    return ev({
      kind: 'hclPrep', importance: 2, type: 'exchange',
      eq: { reactants: [s, 'H2SO4'], products: [hs, 'HCl'], gas: ['HCl'], conc: 'H2SO4', dry: true }, p: { salt: s },
      signs: ['gas', 'smell'], safety: 'fumeHood', key: 'hcl-prep'
    });
  }
  return null;
};

/** A dry ammonium salt heated with slaked lime or sodium hydroxide gives ammonia: the lab way to get NH3. */
const ammoniaFromSalt: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  if (dt <= 0 || !dry(v) || v.temp < 40 || !once(ctx, 'nh3-prep')) return null;
  for (const [nh4, anion] of [['NH4Cl', 'Cl^-'], ['NH4NO3', 'NO3^-']] as [string, string][]) {
    const ns = amt(v.solids, nh4);
    if (ns <= EPS) continue;
    for (const [base, cat, z] of [['Ca(OH)2', 'Ca^2+', 2], ['CaO', 'Ca^2+', 2], ['NaOH', 'Na^+', 1]] as [string, string, number][]) {
      const nb = amt(v.solids, base);
      const max = Math.min(ns / z, nb);
      if (max <= EPS) continue;
      const u = max < 1e-3 ? max : max * (1 - Math.exp(-0.25 * dt));
      const product = salt(cat, anion).id;
      take(v.solids, nh4, z * u);
      take(v.solids, base, u);
      put(v.solids, product, u);
      addGas(v, 'NH3', z * u, ctx.now);
      addGas(v, 'H2O', z * u * ML_PER_MMOL_WATER, ctx.now);
      v.fx.dropsAt = ctx.now;
      v.fx.smellAt = ctx.now;
      return ev({
        kind: 'ammoniaPrep', importance: 2, type: 'exchange',
        eq: { reactants: [nh4, base], products: [product, 'NH3', 'H2O'], gas: ['NH3'], cond: 't', dry: true }, p: { salt: nh4, base },
        signs: ['gas', 'smell'], safety: 'ammoniaSmell', key: 'ammonia-prep'
      });
    }
  }
  return null;
};

/** Manganese(IV) oxide heated with concentrated hydrochloric acid gives chlorine. */
const chlorineFromMnO2: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  const mno2 = amt(v.solids, 'MnO2');
  if (dt <= 0 || mno2 <= EPS || v.temp < 50 || molar(v, 'H^+') < 5 || amt(v.aq, 'Cl^-') <= EPS || !once(ctx, 'cl2-mno2')) return null;
  const max = Math.min(mno2, amt(v.aq, 'H^+') / 4, amt(v.aq, 'Cl^-') / 4);
  const u = max < 1e-3 ? max : max * (1 - Math.exp(-0.1 * dt));
  if (u <= EPS) return null;
  take(v.solids, 'MnO2', u);
  take(v.aq, 'H^+', 4 * u);
  take(v.aq, 'Cl^-', 2 * u);
  putIon(v, 'Mn^2+', u, 'MnCl2');
  addGas(v, 'Cl2', u, ctx.now);
  v.fx.smellAt = ctx.now;
  return ev({
    kind: 'chlorinePrep', importance: 2, type: 'redox',
    eq: { reactants: ['MnO2', 'HCl'], products: ['MnCl2', 'Cl2', 'H2O'], gas: ['Cl2'], conc: 'HCl', cond: 't' },
    signs: ['gas', 'smell', 'color'], safety: 'fumeHood', key: 'chlorine-prep'
  });
};

/** Magnesium hardly reacts with cold water, but slowly gives hydrogen with hot water. */
const magnesiumHotWater: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  const mg = amt(v.solids, 'Mg');
  if (dt <= 0 || mg <= EPS || waterVolume(v) <= 0.05 || v.temp < 70 || amt(v.aq, 'H^+') > EPS || !once(ctx, 'mg-hot')) return null;
  const e = Math.min(mg, 0.003 * dt * Math.min(1, mg));
  take(v.solids, 'Mg', e);
  put(v.solids, 'Mg(OH)2', e);
  addGas(v, 'H2', e, ctx.now);
  return ev({
    kind: 'metalHotWater', importance: 2, type: 'substitution',
    eq: { reactants: ['Mg', 'H2O'], products: ['Mg(OH)2', 'H2'], gas: ['H2'], cond: 't' }, p: { metal: 'Mg' }, signs: ['gas'], key: 'metal-hot-water:Mg'
  });
};

export const MORE_PREP: Rule[] = [hclFromSalt];
export const MORE_HEAT: Rule[] = [ammoniaFromSalt, chlorineFromMnO2, magnesiumHotWater];

// ---------------------------------------------------------------- strong heating

const dry = (v: Vessel) => waterVolume(v) <= 0.05;

interface Decomp {
  solid: string;
  t: number;                        // °C at which it starts
  out: [string, number][];          // solids formed per unit
  gases: [string, number][];        // gases formed per unit (water as vapour)
  eq: string[];
  rate?: number;                    // share decomposing per second
  volcano?: boolean;
  smoke?: boolean;
}

const DECOMP: Decomp[] = [
  { solid: '(NH4)2Cr2O7', t: 180, out: [['Cr2O3', 1]], gases: [['N2', 1], ['H2O', 4]], eq: ['Cr2O3', 'N2', 'H2O'], rate: 0.9, volcano: true },
  { solid: 'KMnO4', t: 200, out: [['K2MnO4', 0.5], ['MnO2', 0.5]], gases: [['O2', 0.5]], eq: ['K2MnO4', 'MnO2', 'O2'] },
  { solid: 'NaHCO3', t: 110, out: [['Na2CO3', 0.5]], gases: [['CO2', 0.5], ['H2O', 0.5]], eq: ['Na2CO3', 'H2O', 'CO2'] },
  { solid: '(CuOH)2CO3', t: 200, out: [['CuO', 2]], gases: [['CO2', 1], ['H2O', 1]], eq: ['CuO', 'H2O', 'CO2'] },
  { solid: 'NH4Cl', t: 250, out: [], gases: [], eq: ['NH3', 'HCl'], smoke: true },
  { solid: 'KNO3', t: 340, out: [['KNO2', 1]], gases: [['O2', 0.5]], eq: ['KNO2', 'O2'] },
  { solid: 'CuSO4·5H2O', t: 120, out: [['CuSO4', 1]], gases: [['H2O', 5]], eq: ['CuSO4', 'H2O'] },
  { solid: 'CoCl2·6H2O', t: 110, out: [['CoCl2', 1]], gases: [['H2O', 6]], eq: ['CoCl2', 'H2O'] },
  { solid: 'Fe(OH)3', t: 300, out: [['Fe2O3', 0.5]], gases: [['H2O', 1.5]], eq: ['Fe2O3', 'H2O'] },
  { solid: 'Zn(OH)2', t: 200, out: [['ZnO', 1]], gases: [['H2O', 1]], eq: ['ZnO', 'H2O'] },
  { solid: 'Mg(OH)2', t: 340, out: [['MgO', 1]], gases: [['H2O', 1]], eq: ['MgO', 'H2O'] },
  { solid: 'Ag2O', t: 300, out: [['Ag', 2]], gases: [['O2', 0.5]], eq: ['Ag', 'O2'] }
];

const thermalDecomp: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  if (dt <= 0 || !dry(v)) return null;
  for (const d of DECOMP) {
    const n = amt(v.solids, d.solid);
    if (n <= EPS || v.temp < d.t || !once(ctx, `decomp:${d.solid}`)) continue;
    const e = n <= 1e-3 ? n : n * (1 - Math.exp(-(d.rate ?? 0.15) * dt));
    take(v.solids, d.solid, e);
    for (const [id, k] of d.out) put(v.solids, id, k * e);
    for (const [id, k] of d.gases) addGas(v, id, id === 'H2O' ? k * e * ML_PER_MMOL_WATER : k * e, ctx.now);
    if (d.gases.some(([id]) => id === 'H2O')) v.fx.dropsAt = ctx.now;
    if (d.volcano) { v.fx.volcanoAt = ctx.now; release(v, 300 * e); }
    if (d.smoke) v.fx.smokeAt = ctx.now;
    const gas = d.gases.map(([id]) => id).filter((id) => id !== 'H2O');
    const colorBefore = colorOf(d.solid);
    const changes = d.out.some(([id]) => colorOf(id) !== colorBefore);
    const signs: ReactionEvent['signs'] = changes ? ['color'] : [];
    if (gas.length) signs.push('gas');
    if (d.volcano) signs.push('light', 'heat');
    if (d.smoke) signs.splice(0, signs.length, 'smell');
    return ev({
      kind: d.volcano ? 'volcano' : 'thermalDecomp', importance: 2, type: 'decomposition',
      eq: { reactants: [d.solid], products: d.eq, gas: d.eq.filter((x) => x !== 'H2O' && (gas.includes(x) || x === 'NH3' || x === 'HCl')), cond: 't', dry: true },
      p: { solid: d.solid }, signs, safety: d.volcano ? 'toxic' : d.smoke ? 'fumeHood' : undefined, key: `decomp:${d.solid}`
    });
  }
  // Limestone needs about 900 °C: a spirit lamp is not enough.
  if (amt(v.solids, 'CaCO3') > EPS && v.temp >= 300 && !v.seen.includes('calcination-hint') && once(ctx, 'calcination')) {
    v.seen.push('calcination-hint');
    return ev({ kind: 'needsHeat', importance: 2, p: { what: 'calcination', solid: 'CaCO3' } });
  }
  return null;
};

/** Hard water: on boiling, dissolved calcium hydrogen carbonate turns into scale. Baking soda solution gives off CO2. */
const bicarbonateBoil: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  const hco3 = amt(v.aq, 'HCO3^-');
  if (dt <= 0 || hco3 <= EPS || dry(v) || v.temp < 85 || !once(ctx, 'hco3-boil')) return null;
  const ca = amt(v.aq, 'Ca^2+');
  if (ca > EPS) {
    const u = Math.min(ca, hco3 / 2) * (1 - Math.exp(-0.12 * dt));
    if (u <= 1e-7) return null;
    take(v.aq, 'Ca^2+', u);
    take(v.aq, 'HCO3^-', 2 * u);
    put(v.solids, 'CaCO3', u);
    addGas(v, 'CO2', u, ctx.now);
    v.fx.precipAt = ctx.now;
    return ev({
      kind: 'hardWater', importance: 2, type: 'decomposition',
      eq: { reactants: ['Ca(HCO3)2'], products: ['CaCO3', 'CO2', 'H2O'], precip: ['CaCO3'], gas: ['CO2'], cond: 't' },
      signs: ['precip', 'gas'], key: 'hard-water'
    });
  }
  if (v.temp < 95) return null;
  const u = (hco3 / 2) * (1 - Math.exp(-0.03 * dt));
  if (u <= 1e-7) return null;
  const bParent = parentOf(v, 'HCO3^-', 'NaHCO3');
  const cat = counterIon(bParent, 'HCO3^-') || 'Na^+';
  take(v.aq, 'HCO3^-', 2 * u);
  putIon(v, 'CO3^2-', u, salt(cat, 'CO3^2-').id);
  addGas(v, 'CO2', u, ctx.now);
  return ev({
    kind: 'thermalDecomp', importance: 2, type: 'decomposition',
    eq: { reactants: [bParent], products: [salt(cat, 'CO3^2-').id, 'H2O', 'CO2'], gas: ['CO2'], cond: 't' },
    p: { solid: bParent, inSolution: '1' }, signs: ['gas'], key: 'decomp:bicarbonate-solution'
  });
};

/** A dry mixture of a metal and sulfur glows when heated and turns into a sulfide. */
const metalSulfur: Rule = (v, ctx) => {
  const s = amt(v.solids, 'S');
  if (s <= EPS || !dry(v) || v.temp < 250) return null;
  // [metal, metal atoms per formula, sulfur atoms per formula, product]
  for (const [m, per, sPer, product] of [['Fe', 1, 1, 'FeS'], ['Zn', 1, 1, 'ZnS'], ['Cu', 2, 1, 'Cu2S'], ['Mg', 1, 1, 'MgS'], ['Al', 2, 3, 'Al2S3']] as [string, number, number, string][]) {
    const u = Math.min(amt(v.solids, m) / per, s / sPer);
    if (u <= EPS) continue;
    take(v.solids, m, u * per);
    take(v.solids, 'S', u * sPer);
    if (m === 'Mg' || m === 'Al') salt(METALS[m].ion, 'S^2-'); // registers the compound and its name
    put(v.solids, product, u);
    v.fx.glowAt = ctx.now;
    release(v, 100 * u);
    return ev({
      kind: 'metalSulfur', importance: 2, type: 'combination',
      eq: { reactants: [m, 'S'], products: [product], cond: 't', dry: true }, p: { metal: m, product },
      signs: ['light', 'heat', 'color'], key: `metal-sulfur:${m}`
    });
  }
  return null;
};

/** Charcoal takes oxygen from copper(II) oxide on strong heating: red copper appears. */
const carbonReduce: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  const c = amt(v.solids, 'C');
  const cuo = amt(v.solids, 'CuO');
  if (dt <= 0 || c <= EPS || cuo <= EPS || !dry(v) || v.temp < 330 || !once(ctx, 'carbon-reduce')) return null;
  const u = Math.min(cuo / 2, c) * (1 - Math.exp(-0.2 * dt)) + 1e-6;
  const e = Math.min(u, cuo / 2, c);
  take(v.solids, 'CuO', 2 * e);
  take(v.solids, 'C', e);
  put(v.solids, 'Cu', 2 * e);
  addGas(v, 'CO2', e, ctx.now);
  return ev({
    kind: 'carbonReduce', importance: 2, type: 'redox',
    eq: { reactants: ['CuO', 'C'], products: ['Cu', 'CO2'], gas: ['CO2'], cond: 't', dry: true }, p: { oxide: 'CuO' },
    signs: ['color', 'gas'], key: 'carbon-reduce:CuO'
  });
};

/** Activated charcoal soaks up dyes and halogens: the color fades. */
const ADSORBED = ['I2', 'Br2', 'Fe(SCN)3'];

const adsorption: Rule = (v, ctx) => {
  const c = amt(v.solids, 'C');
  if (c <= EPS || v.volume < 0.05 || !once(ctx, 'adsorb')) return null;
  const present = ADSORBED.filter((id) => amt(v.aq, id) > 1e-6);
  const inds = Object.keys(v.inds) as (keyof typeof v.inds)[];
  if (!present.length && !inds.length) return null;
  const dt = ctx.dt ?? 0;
  if (dt <= 0) {
    if (v.seen.includes('adsorption')) return null;
    return ev({ kind: 'adsorption', importance: 2, type: 'physical', p: { what: present[0] || inds[0] || '' }, key: 'adsorption' });
  }
  const k = (0.02 * c) / Math.max(1, v.volume);
  const f = 1 - Math.exp(-k * dt);
  for (const id of present) {
    const n = amt(v.aq, id) * f;
    take(v.aq, id, amt(v.aq, id) < 1e-5 ? amt(v.aq, id) : n);
  }
  for (const id of inds) {
    const left = (v.inds[id] || 0) * (1 - f);
    if (left < 0.05) delete v.inds[id];
    else v.inds[id] = left;
  }
  return ev({ kind: 'minor', importance: 0, type: 'physical' });
};

export const MORE_LATE: Rule[] = [...MORE_HEAT, thermalDecomp, bicarbonateBoil, metalSulfur, carbonReduce, starchIodine, adsorption];


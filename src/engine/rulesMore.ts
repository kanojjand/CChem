// More reactions: sulfides, sulfites and thiosulfate with acids, halogens pushing each other out of
// salts, chromate and dichromate, permanganate and dichromate as oxidisers in acid, joint
// hydrolysis with sulfides, and reactions of dry solids on strong heating.

import { IONS, METALS, salt } from './data';
import { EPS, addGas, amt, put, putIon, release, take, waterVolume, type ReactionEvent, type Vessel } from './vessel';
import {
  acidOf, baseOf, consume, counterIon, donors, ev, once, parentOf, setParent, warmth,
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

const dichromateBase: Rule = (v) => {
  const u = Math.min(amt(v.aq, 'Cr2O7^2-'), amt(v.aq, 'OH^-') / 2);
  if (u <= EPS) return null;
  const dParent = parentOf(v, 'Cr2O7^2-', 'K2Cr2O7');
  const cat = counterIon(dParent, 'Cr2O7^2-') || 'K^+';
  const base = baseOf(v);
  take(v.aq, 'Cr2O7^2-', u);
  take(v.aq, 'OH^-', 2 * u);
  const chromate = salt(cat, 'CrO4^2-').id;
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

interface Reducer { id: string; e: number; hOut: number; fallback: string; minH?: number }
const REDUCERS: Reducer[] = [
  { id: 'Fe^2+', e: 1, hOut: 0, fallback: 'FeSO4' },
  { id: 'I^-', e: 1, hOut: 0, fallback: 'KI' },
  { id: 'SO3^2-', e: 2, hOut: 2, fallback: 'Na2SO3' },
  { id: 'H2O2', e: 2, hOut: 2, fallback: 'H2O2' },
  // Chloride gives chlorine only in concentrated hydrochloric acid.
  { id: 'Cl^-', e: 1, hOut: 0, fallback: 'HCl', minH: 5 }
];

/** Concentration in mol/L. */
const molar = (v: Vessel, id: string) => (v.volume > 0.01 ? amt(v.aq, id) / v.volume : 0);

/** Permanganate or dichromate in acid oxidise a reducer: the violet or orange color changes. */
function strongOxidiser(v: Vessel, ctx: Ctx, oxIon: string, eOx: number, hIn: number, reduced: string, nReduced: number, kind: 'permanganateRedox' | 'dichromateRedox'): ReactionEvent | null {
  const ox = amt(v.aq, oxIon);
  const h = amt(v.aq, 'H^+');
  if (ox <= EPS || h <= EPS) return null;
  for (const r of REDUCERS) {
    const red = amt(v.aq, r.id);
    if (red <= EPS || (r.minH && molar(v, 'H^+') < r.minH)) continue;
    const ratio = eOx / r.e;                 // reducer units per oxidiser unit
    const hNet = hIn - ratio * r.hOut;       // H+ used per oxidiser unit
    const u = Math.min(ox, red / ratio, hNet > 0 ? h / hNet : Infinity);
    if (u <= EPS) continue;
    const acid = acidOf(v);
    const oxParent = parentOf(v, oxIon, oxIon === 'MnO4^-' ? 'KMnO4' : 'K2Cr2O7');
    const oxCat = counterIon(oxParent, oxIon) || 'K^+';
    const rParent = r.id === 'H2O2' ? 'H2O2' : r.id === 'Cl^-' ? acid.parent : parentOf(v, r.id, r.fallback);
    const w = u * ratio;
    take(v.aq, oxIon, u);
    take(v.aq, r.id, w);
    take(v.aq, 'H^+', u * hNet);
    const reducedSalt = salt(reduced, acid.anion).id;
    putIon(v, reduced, u * nReduced, reducedSalt);
    const products = [reducedSalt];
    const signs: ReactionEvent['signs'] = ['color'];
    if (r.id === 'Fe^2+') { putIon(v, 'Fe^3+', w, salt('Fe^3+', acid.anion).id); products.push(salt('Fe^3+', acid.anion).id); }
    if (r.id === 'I^-') { put(v.aq, 'I2', w / 2); products.push('I2'); }
    if (r.id === 'SO3^2-') putIon(v, 'SO4^2-', w, salt(oxCat, 'SO4^2-').id);
    if (r.id === 'H2O2') { addGas(v, 'O2', w / 2, ctx.now); products.push('O2'); signs.push('gas'); }
    if (r.id === 'Cl^-') { addGas(v, 'Cl2', w / 2, ctx.now); products.push('Cl2'); signs.push('gas', 'smell'); v.fx.smellAt = ctx.now; }
    products.push(salt(oxCat, acid.anion).id);
    const rCat = r.id === 'H2O2' || r.id === 'Cl^-' ? undefined : counterIon(rParent, r.id);
    if (rCat && rCat !== 'H^+' && rCat !== 'Fe^2+') products.push(salt(rCat, acid.anion).id);
    products.push('H2O');
    release(v, 30 * u);
    // With hydrogen peroxide the balancer has more than one answer (peroxide can also just decompose):
    // give the textbook coefficients.
    const peroxideK = r.id === 'H2O2' && oxCat === 'K^+'
      ? ({ 'MnO4^-|SO4^2-': [2, 5, 3, 2, 5, 1, 8], 'MnO4^-|Cl^-': [2, 5, 6, 2, 5, 2, 8], 'Cr2O7^2-|SO4^2-': [1, 3, 4, 1, 3, 1, 7], 'Cr2O7^2-|Cl^-': [1, 3, 8, 2, 3, 2, 7] } as Record<string, number[]>)[`${oxIon}|${acid.anion}`]
      : undefined;
    return ev({
      kind, importance: 2, type: 'redox',
      eq: { reactants: uniq([oxParent, rParent, acid.parent]), products: uniq(products), k: peroxideK, gas: r.id === 'H2O2' ? ['O2'] : r.id === 'Cl^-' ? ['Cl2'] : undefined, conc: r.id === 'Cl^-' ? 'HCl' : undefined },
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
  const so3 = amt(v.aq, 'SO3^2-');
  if (so3 > EPS && oh > EPS) {
    // 2MnO4- + SO3^2- + 2OH- -> 2MnO4^2- + SO4^2- + H2O
    const u = Math.min(mn / 2, so3, oh / 2);
    if (u <= EPS) return null;
    const sParent = parentOf(v, 'SO3^2-', 'Na2SO3');
    const sCat = counterIon(sParent, 'SO3^2-') || 'Na^+';
    const base = baseOf(v);
    take(v.aq, 'MnO4^-', 2 * u); take(v.aq, 'SO3^2-', u); take(v.aq, 'OH^-', 2 * u);
    putIon(v, 'MnO4^2-', 2 * u, salt(oxCat, 'MnO4^2-').id);
    putIon(v, 'SO4^2-', u, salt(sCat, 'SO4^2-').id);
    return ev({
      kind: 'permanganateRedox', importance: 2, type: 'redox',
      eq: { reactants: uniq([oxParent, sParent, base.parent]), products: uniq([salt(oxCat, 'MnO4^2-').id, salt(base.cation, 'MnO4^2-').id, salt(sCat, 'SO4^2-').id, 'H2O']) },
      p: { red: 'SO3^2-', medium: 'alkaline' }, signs: ['color'], key: 'permanganate:alkaline'
    });
  }
  // Neutral: MnO4- + 3e -> MnO2 (brown precipitate) and OH- in the solution.
  for (const [red, e, ohPerMn, fallback] of [['SO3^2-', 2, 1, 'Na2SO3'], ['I^-', 1, 4, 'KI'], ['H2O2', 2, 1, 'H2O2']] as [string, number, number, string][]) {
    const r = amt(v.aq, red);
    if (r <= EPS) continue;
    const u = Math.min(mn, (r * e) / 3);
    if (u <= EPS) continue;
    const w = (u * 3) / e;
    const rParent = red === 'H2O2' ? 'H2O2' : parentOf(v, red, fallback);
    const rCat = red === 'H2O2' ? undefined : counterIon(rParent, red) || 'K^+';
    take(v.aq, 'MnO4^-', u); take(v.aq, red, w);
    put(v.solids, 'MnO2', u);
    putIon(v, 'OH^-', ohPerMn * u, salt(oxCat, 'OH^-').id);
    const products = ['MnO2'];
    if (red === 'SO3^2-') { putIon(v, 'SO4^2-', w, salt(rCat!, 'SO4^2-').id); products.push(salt(rCat!, 'SO4^2-').id); }
    if (red === 'I^-') { put(v.aq, 'I2', w / 2); products.push('I2'); }
    if (red === 'H2O2') { addGas(v, 'O2', w / 2, ctx.now); products.push('O2'); }
    products.push(salt(oxCat, 'OH^-').id);
    if (rCat && rCat !== oxCat && red !== 'SO3^2-') products.push(salt(rCat, 'OH^-').id);
    if (red === 'H2O2') products.push('H2O');
    v.fx.precipAt = ctx.now;
    const reactants = uniq([oxParent, rParent]);
    if (red !== 'H2O2') reactants.push('H2O');
    return ev({
      kind: 'permanganateRedox', importance: 2, type: 'redox',
      eq: { reactants, products: uniq(products), precip: ['MnO2'], gas: red === 'H2O2' ? ['O2'] : undefined, k: red === 'H2O2' && oxCat === 'K^+' ? [2, 3, 2, 3, 2, 2] : undefined },
      p: { red, medium: 'neutral' }, signs: red === 'H2O2' ? ['precip', 'color', 'gas'] : ['precip', 'color'], key: 'permanganate:neutral'
    });
  }
  return null;
};

/** Hydrogen peroxide takes electrons from iodide: the solution turns yellow-brown with iodine. */
const peroxideIodide: Rule = (v) => {
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
  const u = Math.min(p2, iod / 2);
  take(v.aq, 'H2O2', u); take(v.aq, 'I^-', 2 * u);
  put(v.aq, 'I2', u);
  putIon(v, 'OH^-', 2 * u, salt(cat, 'OH^-').id);
  return ev({
    kind: 'iodideOx', importance: 2, type: 'redox',
    eq: { reactants: ['H2O2', iParent], products: ['I2', salt(cat, 'OH^-').id] }, p: { ion: 'H2O2' }, signs: ['color'], key: 'iodide:H2O2'
  });
};

/** Iron(III) salts dissolve metals, even copper (this is how circuit boards are etched). */
const iron3Metal: Rule = (v) => {
  const fe = amt(v.aq, 'Fe^3+');
  if (fe <= EPS) return null;
  for (const m of ['Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Sn', 'Pb', 'Cu']) {
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
  const ids = Object.keys(v.inds);
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
  chromateAcid, dichromateBase, sulfideAcid, sulfiteAcid, thiosulfateAcid,
  halogenDisplace, iodideOx, permanganateRedox, dichromateRedox, permanganateNoAcid, peroxideIodide, iron3Metal,
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
    for (const [base, cat, z] of [['Ca(OH)2', 'Ca^2+', 2], ['NaOH', 'Na^+', 1]] as [string, string, number][]) {
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
    const signs: ReactionEvent['signs'] = ['color'];
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
  for (const [m, per, product] of [['Fe', 1, 'FeS'], ['Zn', 1, 'ZnS'], ['Cu', 2, 'Cu2S']] as [string, number, string][]) {
    const u = Math.min(amt(v.solids, m) / per, s);
    if (u <= EPS) continue;
    take(v.solids, m, u * per);
    take(v.solids, 'S', u);
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


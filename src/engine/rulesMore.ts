// More reactions: sulfides, sulfites and thiosulfate with acids, halogens pushing each other out of
// salts, chromate and dichromate, permanganate and dichromate as oxidisers in acid, joint
// hydrolysis with sulfides, and reactions of dry solids on strong heating.

import { salt } from './data';
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

interface Reducer { id: string; e: number; hOut: number; fallback: string }
const REDUCERS: Reducer[] = [
  { id: 'Fe^2+', e: 1, hOut: 0, fallback: 'FeSO4' },
  { id: 'I^-', e: 1, hOut: 0, fallback: 'KI' },
  { id: 'SO3^2-', e: 2, hOut: 2, fallback: 'Na2SO3' },
  { id: 'H2O2', e: 2, hOut: 2, fallback: 'H2O2' }
];

/** Permanganate or dichromate in acid oxidise a reducer: the violet or orange color changes. */
function strongOxidiser(v: Vessel, ctx: Ctx, oxIon: string, eOx: number, hIn: number, reduced: string, nReduced: number, kind: 'permanganateRedox' | 'dichromateRedox'): ReactionEvent | null {
  const ox = amt(v.aq, oxIon);
  const h = amt(v.aq, 'H^+');
  if (ox <= EPS || h <= EPS) return null;
  for (const r of REDUCERS) {
    const red = amt(v.aq, r.id);
    if (red <= EPS) continue;
    const ratio = eOx / r.e;                 // reducer units per oxidiser unit
    const hNet = hIn - ratio * r.hOut;       // H+ used per oxidiser unit
    const u = Math.min(ox, red / ratio, hNet > 0 ? h / hNet : Infinity);
    if (u <= EPS) continue;
    const acid = acidOf(v);
    const oxParent = parentOf(v, oxIon, oxIon === 'MnO4^-' ? 'KMnO4' : 'K2Cr2O7');
    const oxCat = counterIon(oxParent, oxIon) || 'K^+';
    const rParent = r.id === 'H2O2' ? 'H2O2' : parentOf(v, r.id, r.fallback);
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
    products.push(salt(oxCat, acid.anion).id);
    const rCat = r.id === 'H2O2' ? undefined : counterIon(rParent, r.id);
    if (rCat && rCat.endsWith('+') && rCat !== 'Fe^2+') products.push(salt(rCat, acid.anion).id);
    else if (r.id === 'SO3^2-' || r.id === 'I^-') products.push(salt(counterIon(rParent, r.id) || 'Na^+', acid.anion).id);
    products.push('H2O');
    release(v, 30 * u);
    return ev({
      kind, importance: 2, type: 'redox',
      eq: { reactants: uniq([oxParent, rParent, acid.parent]), products: uniq(products), gas: r.id === 'H2O2' ? ['O2'] : undefined },
      p: { red: r.id }, signs, key: `${kind === 'permanganateRedox' ? 'permanganate' : 'dichromate'}:${r.id}`
    });
  }
  return null;
}

const permanganateRedox: Rule = (v, ctx) => strongOxidiser(v, ctx, 'MnO4^-', 5, 8, 'Mn^2+', 1, 'permanganateRedox');
const dichromateRedox: Rule = (v, ctx) => strongOxidiser(v, ctx, 'Cr2O7^2-', 6, 14, 'Cr^3+', 2, 'dichromateRedox');

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
  halogenDisplace, iodideOx, permanganateRedox, dichromateRedox, sulfideHydrolysis, bleach
];

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

export const MORE_LATE: Rule[] = [thermalDecomp, bicarbonateBoil, metalSulfur, carbonReduce, starchIodine, adsorption];


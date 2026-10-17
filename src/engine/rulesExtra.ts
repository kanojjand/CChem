// Concentrated acids as oxidisers, dehydration by sulfuric acid, nitric acid from nitrates,
// nitrates breaking down on strong heating, metals and sulfur heated in air, the iron(III)
// hydroxide sol from boiling iron(III) chloride, the starch–iodine colour fading when hot,
// and limewater turning cloudy on heating.

import { IONS, compound, hasCompound, salt } from './data';
import { EPS, addGas, amt, put, putIon, release, take, waterVolume, type ReactionEvent, type Vessel } from './vessel';
import { counterIon, ev, once, parentOf, setParent, type Rule } from './ruleKit';
import { STARCH_FADE_T } from './color';

/** Volume (mL) of liquid water in one millimole of water vapour. */
const ML_PER_MMOL_WATER = 0.018;
/** Millimoles of sulfuric acid in a millilitre of the 98 % acid. */
const CONC_MMOL_PER_ML = 18.4;

const molar = (v: Vessel, id: string) => (v.volume > 0.01 ? amt(v.aq, id) / v.volume : 0);
/** Pure concentrated sulfuric acid with no water to dilute it. */
const concSulfuric = (v: Vessel) => amt(v.aq, 'H2SO4c') > EPS && waterVolume(v) <= 0.05;
/** Concentrated nitric acid: at least 6 mol/L of it. */
const concNitric = (v: Vessel) => molar(v, 'H^+') >= 6 && amt(v.aq, 'NO3^-') > EPS;
/** Nothing liquid in the vessel: a dry solid over the flame, open to the air. */
const dryInAir = (v: Vessel) => waterVolume(v) <= 0.05 && v.concVol <= 0.01;

/** Use up concentrated sulfuric acid, together with the volume it took. */
function useConc(v: Vessel, n: number) {
  take(v.aq, 'H2SO4c', n);
  v.concVol = Math.max(0, v.concVol - n / CONC_MMOL_PER_ML);
  v.volume = Math.max(v.concVol, v.volume - n / CONC_MMOL_PER_ML);
}

/** Share of a slow reaction done in this step: about `rate` of what is left per second. */
const portion = (n: number, rate: number, dt: number) => (n < 1e-3 ? n : n * (1 - Math.exp(-rate * dt)));

/** Units of the sulfate of `cation` holding `nCation` mmol of the cation. */
function sulfateOf(cation: string, nCation: number) {
  const s = salt(cation, 'SO4^2-');
  return { id: s.id, units: nCation / (s.nCat || 1) };
}

/** Solid salts in the vessel with the given anion, with the number of cations and anions per formula unit. */
function solidSalts(v: Vessel, anion: string): { id: string; cation: string; nCat: number; nAn: number; units: number }[] {
  const out: { id: string; cation: string; nCat: number; nAn: number; units: number }[] = [];
  for (const id of Object.keys(v.solids)) {
    const units = amt(v.solids, id);
    if (units <= EPS || !hasCompound(id)) continue;
    const d = compound(id);
    if (d.anion !== anion || !d.cation || d.cation === 'H^+') continue;
    out.push({ id, cation: d.cation, nCat: d.nCat || 1, nAn: d.nAn || 1, units });
  }
  return out;
}

// ---------------------------------------------------------------- concentrated sulfuric acid

/** Concentrated sulfuric acid takes the water out of crystal hydrates: blue vitriol turns white. */
const HYDRATE_WATER: Record<string, [string, number]> = { 'CuSO4·5H2O': ['CuSO4', 5], 'CoCl2·6H2O': ['CoCl2', 6] };

const concDehydrate: Rule = (v) => {
  if (!concSulfuric(v)) return null;
  for (const hyd in HYDRATE_WATER) {
    const n = amt(v.solids, hyd);
    if (n <= EPS) continue;
    const [plain, w] = HYDRATE_WATER[hyd];
    take(v.solids, hyd, n);
    put(v.solids, plain, n);
    // The water joins the acid and warms it; there is far too little of it to dilute the acid.
    release(v, 2 * w * n);
    return ev({
      kind: 'dehydration', importance: 2, type: 'physical',
      eq: { reactants: [hyd], products: [plain, 'H2O'], cond: 'H2SO4c', dry: true },
      p: { solid: hyd, product: plain }, signs: ['color', 'heat'], key: `dehydration:${hyd}`
    });
  }
  return null;
};

/** Bromides and iodides are oxidised by concentrated sulfuric acid; a sulfide gives sulfur. */
const concHalide: Rule = (v, ctx) => {
  if (!concSulfuric(v)) return null;
  const acid = amt(v.aq, 'H2SO4c');
  for (const [anion, per] of [['Br^-', 1], ['I^-', 5 / 8], ['S^2-', 2]] as [string, number][]) {
    for (const s of solidSalts(v, anion)) {
      const ions = Math.min(s.units * s.nAn, acid / per);
      if (ions <= EPS) continue;
      const units = ions / s.nAn;
      const nCation = units * s.nCat;
      const sulfate = sulfateOf(s.cation, nCation);
      take(v.solids, s.id, units);
      useConc(v, ions * per);
      put(v.solids, sulfate.id, sulfate.units);
      let products: string[];
      if (anion === 'Br^-') {
        // 2KBr + 2H2SO4 -> K2SO4 + Br2 + SO2 + 2H2O: brown bromine vapour.
        addGas(v, 'Br2', ions / 2, ctx.now);
        addGas(v, 'SO2', ions / 2, ctx.now);
        v.fx.vaporAt = ctx.now;
        products = [sulfate.id, 'Br2', 'SO2', 'H2O'];
      } else if (anion === 'I^-') {
        // 8KI + 5H2SO4 -> 4K2SO4 + 4I2 + H2S + 4H2O: dark iodine and a smell of rotten eggs.
        put(v.solids, 'I2', ions / 2);
        addGas(v, 'H2S', ions / 8, ctx.now);
        products = [sulfate.id, 'I2', 'H2S', 'H2O'];
      } else {
        // Na2S + 2H2SO4 -> Na2SO4 + S + SO2 + 2H2O.
        put(v.solids, 'S', ions);
        addGas(v, 'SO2', ions, ctx.now);
        products = [sulfate.id, 'S', 'SO2', 'H2O'];
      }
      v.fx.smellAt = ctx.now;
      release(v, 40 * ions);
      return ev({
        kind: 'concOxidation', importance: 2, type: 'redox',
        eq: { reactants: [s.id, 'H2SO4'], products, gas: products.filter((x) => x === 'SO2' || x === 'H2S' || x === 'Br2'), conc: 'H2SO4', dry: true },
        p: { acid: 'H2SO4', reducer: anion, solid: s.id }, signs: ['color', 'gas', 'smell'], safety: 'fumeHood', key: `conc-ox:H2SO4:${anion}`
      });
    }
  }
  return null;
};

/** Hot concentrated sulfuric acid burns charcoal and sulfur to their oxides. */
const concNonmetalSulfuric: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  if (dt <= 0 || !concSulfuric(v) || v.temp < 150) return null;
  const acid = amt(v.aq, 'H2SO4c');
  for (const el of ['C', 'S']) {
    const n = amt(v.solids, el);
    if (n <= EPS || !once(ctx, `conc-h2so4:${el}`)) continue;
    // C + 2H2SO4 -> CO2 + 2SO2 + 2H2O;  S + 2H2SO4 -> 3SO2 + 2H2O
    const e = Math.min(portion(n, 0.05, dt), acid / 2);
    if (e <= EPS) continue;
    take(v.solids, el, e);
    useConc(v, 2 * e);
    if (el === 'C') addGas(v, 'CO2', e, ctx.now);
    addGas(v, 'SO2', el === 'C' ? 2 * e : 3 * e, ctx.now);
    v.fx.smellAt = ctx.now;
    const products = el === 'C' ? ['CO2', 'SO2', 'H2O'] : ['SO2', 'H2O'];
    return ev({
      kind: 'concOxidation', importance: 2, type: 'redox',
      eq: { reactants: [el, 'H2SO4'], products, gas: products.filter((x) => x !== 'H2O'), conc: 'H2SO4', cond: 't', dry: true },
      p: { acid: 'H2SO4', reducer: el }, signs: ['gas', 'smell'], safety: 'fumeHood', key: `conc-ox:H2SO4:${el}`
    });
  }
  return null;
};

/** Saltpetre heated with concentrated sulfuric acid gives nitric acid vapour: the lab way to get HNO3. */
const nitricFromSalt: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  if (dt <= 0 || !concSulfuric(v) || v.temp < 60) return null;
  for (const s of solidSalts(v, 'NO3^-')) {
    if (s.cation !== 'Na^+' && s.cation !== 'K^+') continue;
    if (!once(ctx, `nitric-prep:${s.id}`)) continue;
    const e = Math.min(portion(s.units, 0.1, dt), amt(v.aq, 'H2SO4c'));
    if (e <= EPS) continue;
    const hs = salt(s.cation, 'HSO4^-').id;
    take(v.solids, s.id, e);
    useConc(v, e);
    put(v.solids, hs, e);
    // Part of the hot acid breaks down: 4HNO3 -> 4NO2 + O2 + 2H2O, the fumes are brownish.
    addGas(v, 'HNO3', 0.9 * e, ctx.now);
    addGas(v, 'NO2', 0.1 * e, ctx.now);
    addGas(v, 'O2', 0.025 * e, ctx.now);
    v.fx.smellAt = ctx.now;
    return ev({
      kind: 'nitricPrep', importance: 2, type: 'exchange',
      eq: { reactants: [s.id, 'H2SO4'], products: [hs, 'HNO3'], gas: ['HNO3'], conc: 'H2SO4', cond: 't', dry: true },
      p: { salt: s.id }, signs: ['gas', 'smell', 'color'], safety: 'fumeHood', key: 'nitric-prep'
    });
  }
  return null;
};

/** Concentrated sulfuric acid with dry carbonates and alkalis. */
const concSaltBase: Rule = (v, ctx) => {
  if (!concSulfuric(v)) return null;
  const acid = amt(v.aq, 'H2SO4c');
  // 2NaHCO3 + H2SO4 -> Na2SO4 + 2CO2 + 2H2O;  Na2CO3 + H2SO4 -> Na2SO4 + CO2 + H2O
  for (const [anion, perAcid] of [['HCO3^-', 0.5], ['CO3^2-', 1]] as [string, number][]) {
    for (const s of solidSalts(v, anion)) {
      if (s.cation !== 'Na^+' && s.cation !== 'K^+') continue;
      const ions = Math.min(s.units * s.nAn, acid / perAcid);
      if (ions <= EPS) continue;
      const units = ions / s.nAn;
      const sulfate = sulfateOf(s.cation, units * s.nCat);
      take(v.solids, s.id, units);
      useConc(v, ions * perAcid);
      put(v.solids, sulfate.id, sulfate.units);
      addGas(v, 'CO2', ions, ctx.now);
      return ev({
        kind: 'gasCO2', importance: 2, type: 'exchange',
        eq: { reactants: [s.id, 'H2SO4'], products: [sulfate.id, 'CO2', 'H2O'], gas: ['CO2'], conc: 'H2SO4', dry: true },
        p: { carbonate: s.id, conc: '1' }, signs: ['gas'], key: `conc-co2:${s.id}`
      });
    }
  }
  // Solid alkali: violent neutralisation, the acid gets very hot and may spatter.
  for (const s of solidSalts(v, 'OH^-')) {
    if (s.cation !== 'Na^+' && s.cation !== 'K^+') continue;
    const n = Math.min(s.units, 2 * acid);
    if (n <= EPS) continue;
    const sulfate = sulfateOf(s.cation, n);
    take(v.solids, s.id, n);
    useConc(v, n / 2);
    put(v.solids, sulfate.id, sulfate.units);
    const dT = release(v, 110 * n);
    if (dT > 40) v.fx.splashAt = ctx.now;
    return ev({
      kind: 'neutralization', importance: 2, type: 'neutralization',
      eq: { reactants: [s.id, 'H2SO4'], products: [sulfate.id, 'H2O'], conc: 'H2SO4', dry: true },
      p: { acid: 'H2SO4', base: s.id, salt: sulfate.id, conc: '1' }, signs: ['heat'], safety: 'hotTube', dT, key: `conc-base:${s.id}`
    });
  }
  return null;
};

// ---------------------------------------------------------------- concentrated nitric acid

/**
 * Concentrated nitric acid oxidises iodide, iron(II), sulfide, sulfite and dissolved H2S and SO2
 * at once, and charcoal and sulfur when hot. It is reduced to brown nitrogen dioxide.
 * Dilute nitric acid (below 6 mol/L) gives NO instead: that is handled with the other redox rules.
 */
const concNitricRedox: Rule = (v, ctx) => {
  if (!concNitric(v)) return null;
  const h = amt(v.aq, 'H^+');
  const no3 = amt(v.aq, 'NO3^-');
  const acidParent = 'HNO3';
  const brown = (n: number) => { addGas(v, 'NO2', n, ctx.now); v.fx.smellAt = ctx.now; v.fx.brownAt = ctx.now; };
  const done = (reducer: string, eq: ReactionEvent['eq'], signs: ReactionEvent['signs'], extra: Record<string, string> = {}) => ev({
    kind: 'concOxidation', importance: 2, type: 'redox', eq, p: { acid: 'HNO3', reducer, ...extra },
    signs: ['gas', 'smell', ...signs], safety: 'fumeHood', key: `conc-ox:HNO3:${reducer}`
  });

  // 2I- + 4H+ + 2NO3- -> I2 + 2NO2 + 2H2O
  const iod = amt(v.aq, 'I^-');
  if (iod > 1e-5) {
    const n = Math.min(iod, h / 2, no3);
    if (n > EPS) {
      const parent = parentOf(v, 'I^-', 'KI');
      const cat = counterIon(parent, 'I^-') || 'K^+';
      const nitrate = salt(cat, 'NO3^-').id;
      take(v.aq, 'I^-', n); take(v.aq, 'H^+', 2 * n); take(v.aq, 'NO3^-', n);
      put(v.aq, 'I2', n / 2);
      setParent(v, [cat], nitrate);
      brown(n);
      return done('I^-', { reactants: [parent, acidParent], products: [nitrate, 'I2', 'NO2', 'H2O'], gas: ['NO2'], conc: 'HNO3' }, ['color'], { salt: parent });
    }
  }
  // Fe2+ + 2H+ + NO3- -> Fe3+ + NO2 + H2O
  const fe = amt(v.aq, 'Fe^2+');
  if (fe > 1e-5) {
    const n = Math.min(fe, h / 2, no3);
    if (n > EPS) {
      const parent = parentOf(v, 'Fe^2+', 'FeSO4');
      const anion = counterIon(parent, 'Fe^2+') || 'SO4^2-';
      take(v.aq, 'Fe^2+', n); take(v.aq, 'H^+', 2 * n); take(v.aq, 'NO3^-', n);
      putIon(v, 'Fe^3+', n, salt('Fe^3+', 'NO3^-').id);
      brown(n);
      const products = [salt('Fe^3+', 'NO3^-').id, 'NO2', ...(anion === 'NO3^-' ? [] : [salt('H^+', anion).id]), 'H2O'];
      return done('Fe^2+', { reactants: [parent, acidParent], products, gas: ['NO2'], conc: 'HNO3' }, ['color'], { salt: parent });
    }
  }
  // S2- + 4H+ + 2NO3- -> S + 2NO2 + 2H2O;  H2S + 2H+ + 2NO3- -> S + 2NO2 + 2H2O
  for (const id of ['S^2-', 'H2S']) {
    const have = amt(v.aq, id);
    if (have <= 1e-5) continue;
    const hPer = id === 'S^2-' ? 4 : 2;
    const n = Math.min(have, h / hPer, no3 / 2);
    if (n <= EPS) continue;
    take(v.aq, id, n); take(v.aq, 'H^+', hPer * n); take(v.aq, 'NO3^-', 2 * n);
    put(v.solids, 'S', n);
    v.fx.precipAt = ctx.now;
    brown(2 * n);
    if (id === 'H2S') return done('H2S', { reactants: ['H2S', acidParent], products: ['S', 'NO2', 'H2O'], gas: ['NO2'], precip: ['S'], conc: 'HNO3' }, ['precip']);
    const parent = parentOf(v, 'S^2-', 'Na2S');
    const cat = counterIon(parent, 'S^2-') || 'Na^+';
    const nitrate = salt(cat, 'NO3^-').id;
    setParent(v, [cat], nitrate);
    return done('S^2-', { reactants: [parent, acidParent], products: [nitrate, 'S', 'NO2', 'H2O'], gas: ['NO2'], precip: ['S'], conc: 'HNO3' }, ['precip'], { salt: parent });
  }
  // SO3^2- + 2H+ + 2NO3- -> SO4^2- + 2NO2 + H2O;  SO2 + 2NO3- -> SO4^2- + 2NO2
  for (const id of ['SO3^2-', 'SO2']) {
    const have = amt(v.aq, id);
    if (have <= 1e-5) continue;
    const hPer = id === 'SO3^2-' ? 2 : 0;
    const n = Math.min(have, hPer ? h / hPer : Infinity, no3 / 2);
    if (n <= EPS) continue;
    take(v.aq, id, n); take(v.aq, 'H^+', hPer * n); take(v.aq, 'NO3^-', 2 * n);
    brown(2 * n);
    if (id === 'SO2') {
      putIon(v, 'SO4^2-', n, 'H2SO4');
      return done('SO2', { reactants: ['SO2', acidParent], products: ['H2SO4', 'NO2'], gas: ['NO2'], conc: 'HNO3' }, []);
    }
    const parent = parentOf(v, 'SO3^2-', 'Na2SO3');
    const cat = counterIon(parent, 'SO3^2-') || 'Na^+';
    const sulfate = salt(cat, 'SO4^2-').id;
    putIon(v, 'SO4^2-', n, sulfate);
    return done('SO3^2-', { reactants: [parent, acidParent], products: [sulfate, 'NO2', 'H2O'], gas: ['NO2'], conc: 'HNO3' }, [], { salt: parent });
  }
  // Hot: C + 4H+ + 4NO3- -> CO2 + 4NO2 + 2H2O;  S + 4H+ + 6NO3- -> SO4^2- + 6NO2 + 2H2O
  const dt = ctx.dt ?? 0;
  if (dt > 0 && v.temp >= 60) {
    for (const [el, hPer, nPer] of [['C', 4, 4], ['S', 4, 6]] as [string, number, number][]) {
      const have = amt(v.solids, el);
      if (have <= EPS || !once(ctx, `conc-hno3:${el}`)) continue;
      const n = Math.min(portion(have, 0.05, dt), h / hPer, no3 / nPer);
      if (n <= EPS) continue;
      take(v.solids, el, n); take(v.aq, 'H^+', hPer * n); take(v.aq, 'NO3^-', nPer * n);
      brown(nPer * n);
      if (el === 'C') {
        addGas(v, 'CO2', n, ctx.now);
        return done('C', { reactants: ['C', acidParent], products: ['CO2', 'NO2', 'H2O'], gas: ['CO2', 'NO2'], conc: 'HNO3', cond: 't' }, []);
      }
      putIon(v, 'SO4^2-', n, 'H2SO4');
      return done('S', { reactants: ['S', acidParent], products: ['H2SO4', 'NO2', 'H2O'], gas: ['NO2'], conc: 'HNO3', cond: 't' }, []);
    }
  }
  return null;
};

// ---------------------------------------------------------------- strong heating

/** Oxide left by a nitrate of a metal between magnesium and copper. */
const NITRATE_OXIDE: Record<string, [string, number]> = {
  'Mg^2+': ['MgO', 1], 'Ca^2+': ['CaO', 1], 'Ba^2+': ['BaO', 1], 'Zn^2+': ['ZnO', 1], 'Cu^2+': ['CuO', 1], 'Pb^2+': ['PbO', 1],
  'Ni^2+': ['NiO', 1], 'Co^2+': ['CoO', 1], 'Mn^2+': ['MnO2', 1], 'Fe^2+': ['Fe2O3', 0.5], 'Fe^3+': ['Fe2O3', 0.5],
  'Al^3+': ['Al2O3', 0.5], 'Cr^3+': ['Cr2O3', 0.5], 'Li^+': ['Li2O', 0.5]
};
/** Temperature at which a dry nitrate starts to break down, °C. */
const NITRATE_T: Record<string, number> = {
  'Na^+': 380, 'Li^+': 600, 'Ag^+': 440, 'Hg^2+': 400, 'Cu^2+': 200, 'Pb^2+': 470, 'Zn^2+': 250, 'Mg^2+': 330, 'Ca^2+': 500,
  'Ba^2+': 590, 'Fe^2+': 150, 'Fe^3+': 150, 'Al^3+': 200, 'Cr^3+': 150, 'Ni^2+': 250, 'Co^2+': 250, 'Mn^2+': 200
};

/**
 * Nitrates break down on strong heating, and how depends on the metal:
 * active metals (Na) leave the nitrite and give oxygen, metals from Mg to Cu leave the oxide and give
 * brown NO2 and oxygen, silver leaves the metal itself. Ammonium nitrate gives N2O and water.
 * (Potassium nitrate is in the list of thermal decompositions with the other shelf solids.)
 */
const nitrateDecomp: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  if (dt <= 0 || !dryInAir(v)) return null;
  for (const s of solidSalts(v, 'NO3^-')) {
    const t = s.cation === 'NH4^+' ? 210 : NITRATE_T[s.cation];
    if (t == null || v.temp < t || !once(ctx, `nitrate:${s.id}`)) continue;
    const e = portion(s.units, 0.15, dt);
    if (e <= EPS) continue;
    const nCat = e * s.nCat;
    const nNO3 = e * s.nAn;
    take(v.solids, s.id, e);
    let products: string[];
    const gas: string[] = [];
    if (s.cation === 'NH4^+') {
      // NH4NO3 -> N2O + 2H2O
      addGas(v, 'N2O', e, ctx.now);
      addGas(v, 'H2O', 2 * e * ML_PER_MMOL_WATER, ctx.now);
      v.fx.dropsAt = ctx.now;
      products = ['N2O', 'H2O'];
      gas.push('N2O');
    } else if (s.cation === 'Na^+') {
      // 2NaNO3 -> 2NaNO2 + O2
      put(v.solids, 'NaNO2', e);
      addGas(v, 'O2', e / 2, ctx.now);
      products = ['NaNO2', 'O2'];
      gas.push('O2');
    } else if (s.cation === 'Ag^+' || s.cation === 'Hg^2+') {
      // 2AgNO3 -> 2Ag + 2NO2 + O2
      const metal = s.cation === 'Ag^+' ? 'Ag' : 'Hg';
      if (metal === 'Ag') put(v.solids, 'Ag', nCat);
      addGas(v, 'NO2', nNO3, ctx.now);
      addGas(v, 'O2', nNO3 / 4, ctx.now);
      products = [metal, 'NO2', 'O2'];
      gas.push('NO2', 'O2');
    } else {
      const ox = NITRATE_OXIDE[s.cation];
      if (!ox) continue;
      // 2Cu(NO3)2 -> 2CuO + 4NO2 + O2;  4Fe(NO3)3 -> 2Fe2O3 + 12NO2 + 3O2
      put(v.solids, ox[0], nCat * ox[1]);
      addGas(v, 'NO2', nNO3, ctx.now);
      const charge = IONS[s.cation].charge;
      // Oxygen balance: each NO3- gives NO2 + O; the oxide keeps charge/2 O per metal ion.
      const o2 = (nNO3 - (ox[0] === 'MnO2' ? 2 : ox[0] === 'Fe2O3' && s.cation === 'Fe^2+' ? 1.5 : charge / 2) * nCat) / 2;
      if (o2 > EPS) addGas(v, 'O2', o2, ctx.now);
      products = o2 > EPS ? [ox[0], 'NO2', 'O2'] : [ox[0], 'NO2'];
      gas.push(...products.filter((x) => x === 'NO2' || x === 'O2'));
    }
    if (gas.includes('NO2')) { v.fx.brownAt = ctx.now; v.fx.smellAt = ctx.now; }
    const signs: ReactionEvent['signs'] = ['gas'];
    if (gas.includes('NO2') || s.cation === 'Ag^+' || NITRATE_OXIDE[s.cation]) signs.push('color');
    return ev({
      kind: 'thermalDecomp', importance: 2, type: 'decomposition',
      eq: { reactants: [s.id], products, gas, cond: 't', dry: true },
      p: { solid: s.id, nitrate: s.cation === 'NH4^+' ? 'ammonium' : s.cation === 'Na^+' ? 'active' : s.cation === 'Ag^+' ? 'noble' : 'middle' },
      signs, safety: gas.includes('NO2') ? 'fumeHood' : undefined, key: `decomp:${s.id}`
    });
  }
  return null;
};

/**
 * Heated in air: copper gets a black coat of copper(II) oxide, magnesium catches fire with a
 * blinding white flame, sulfur burns with a small blue flame and gives sulfur dioxide.
 */
const heatInAir: Rule = (v, ctx) => {
  const dt = ctx.dt ?? 0;
  if (dt <= 0 || !dryInAir(v) || v.temp < 280) return null;
  const cu = amt(v.solids, 'Cu');
  if (cu > EPS && v.temp >= 300 && once(ctx, 'air:Cu')) {
    // Only the surface oxidises, and slowly.
    const e = portion(cu, 0.004, dt);
    take(v.solids, 'Cu', e);
    put(v.solids, 'CuO', e);
    if (!v.seen.includes('heat-in-air:Cu')) {
      return ev({
        kind: 'heatInAir', importance: 2, type: 'combination',
        eq: { reactants: ['Cu', 'O2'], products: ['CuO'], cond: 't', dry: true }, p: { metal: 'Cu' }, signs: ['color'], key: 'heat-in-air:Cu'
      });
    }
    return ev({ kind: 'minor', importance: 0, type: 'combination' });
  }
  const mg = amt(v.solids, 'Mg');
  if (mg > EPS && v.temp >= 470) {
    take(v.solids, 'Mg', mg);
    put(v.solids, 'MgO', mg);
    v.fx.flame = { at: ctx.now, color: '#FFFFFF' };
    release(v, 600 * mg);
    return ev({
      kind: 'heatInAir', importance: 3, type: 'combination',
      eq: { reactants: ['Mg', 'O2'], products: ['MgO'], cond: 't', dry: true }, p: { metal: 'Mg' }, signs: ['light', 'heat', 'color'], key: 'heat-in-air:Mg'
    });
  }
  const s = amt(v.solids, 'S');
  if (s > EPS && once(ctx, 'air:S')) {
    const e = portion(s, 0.1, dt);
    take(v.solids, 'S', e);
    addGas(v, 'SO2', e, ctx.now);
    v.fx.flame = { at: ctx.now, color: '#5A7BFF' };
    v.fx.smellAt = ctx.now;
    if (!v.seen.includes('heat-in-air:S')) {
      return ev({
        kind: 'heatInAir', importance: 2, type: 'combination',
        eq: { reactants: ['S', 'O2'], products: ['SO2'], gas: ['SO2'], cond: 't', dry: true }, p: { metal: 'S' },
        signs: ['light', 'gas', 'smell'], safety: 'fumeHood', key: 'heat-in-air:S'
      });
    }
    return ev({ kind: 'minor', importance: 0, type: 'combination' });
  }
  return null;
};

/**
 * Boiling a solution of iron(III) chloride: Fe3+ + 3H2O -> Fe(OH)3 (sol) + 3H+. The colloid stays
 * in the liquid and turns it dark red-brown; acid dissolves it back. It goes through a filter.
 */
const SOL = 'Fe(OH)3';

const ironSol: Rule = (v, ctx) => {
  const sol = amt(v.aq, SOL);
  if (sol > EPS && molar(v, 'H^+') > 0.3) {
    // Strong acid takes the sol back into solution.
    const n = Math.min(sol, amt(v.aq, 'H^+') / 3);
    take(v.aq, SOL, n);
    take(v.aq, 'H^+', 3 * n);
    putIon(v, 'Fe^3+', n);
    return ev({ kind: 'minor', importance: 0, type: 'exchange' });
  }
  const dt = ctx.dt ?? 0;
  const fe = amt(v.aq, 'Fe^3+');
  if (dt <= 0 || fe <= 1e-4 || waterVolume(v) <= 0.05 || v.temp < 95 || molar(v, 'H^+') > 0.05 || !once(ctx, 'fe-sol')) return null;
  // Hydrolysis goes only part of the way: the acid it makes holds it back.
  if (sol >= fe) return null;
  const e = Math.min(portion(fe, 0.01, dt), fe - sol);
  if (e <= EPS) return null;
  const anion = counterIon(v.parent['Fe^3+'] || 'FeCl3', 'Fe^3+') || 'Cl^-';
  take(v.aq, 'Fe^3+', e);
  put(v.aq, SOL, e);
  putIon(v, 'H^+', 3 * e, salt('H^+', anion).id);
  if (v.seen.includes('sol:Fe(OH)3')) return ev({ kind: 'minor', importance: 0, type: 'exchange' });
  return ev({
    kind: 'solFormation', importance: 2, type: 'exchange',
    eq: { reactants: [salt('Fe^3+', anion).id, 'H2O'], products: [SOL, salt('H^+', anion).id], cond: 't', colloid: [SOL] },
    p: { salt: salt('Fe^3+', anion).id }, signs: ['color'], key: 'sol:Fe(OH)3'
  });
};

/** The blue colour of starch with iodine disappears in a hot solution and comes back on cooling. */
const starchFade: Rule = (v, ctx) => {
  if (v.temp < STARCH_FADE_T || amt(v.aq, 'starch') <= 1e-6 || amt(v.aq, 'I2') <= 1e-7) return null;
  if (v.seen.includes('color-fade:starch') || !once(ctx, 'color-fade')) return null;
  return ev({ kind: 'colorFade', importance: 2, type: 'physical', p: { what: 'starch' }, signs: ['color'], key: 'color-fade:starch' });
};

/** Calcium hydroxide dissolves worse in hot water: clear limewater turns cloudy when heated. */
const limewaterHeat: Rule = (v, ctx) => {
  if (v.temp < 50 || amt(v.solids, 'Ca(OH)2') <= 1e-4 || v.added.includes('CaOH2s')) return null;
  if (!v.added.includes('CaOH2') || v.seen.includes('retrograde:Ca(OH)2') || !once(ctx, 'retrograde')) return null;
  v.fx.precipAt = ctx.now;
  return ev({ kind: 'crystallize', importance: 2, type: 'physical', p: { solid: 'Ca(OH)2', cause: 'heat' }, signs: ['precip'], key: 'retrograde:Ca(OH)2' });
};

/** Run before the dilute-acid rules (concentrated acids). */
export const EXTRA_PREP: Rule[] = [concDehydrate, concHalide, concSaltBase, concNitricRedox];
/** Run with the heating rules. */
export const EXTRA_LATE: Rule[] = [concNonmetalSulfuric, nitricFromSalt, nitrateDecomp, heatInAir, ironSol, starchFade, limewaterHeat];


// Laboratory apparatus on top of the reaction rules: gas passed through a delivery tube
// into another vessel, gas tests (glowing and burning splint, damp litmus, limewater),
// electrical conductivity and electrolysis with inert (graphite) electrodes.

import { IONS, METALS, compound, hasCompound, salt } from './data';
import { finish, snapshot, type ActionResult } from './actions';
import { settle, type Ctx } from './rules';
import { EPS, addGas, amt, put, putIon, take, waterVolume, type ReactionEvent, type Vessel } from './vessel';
import type { EqSpec } from './equation';

/** Millilitres of gas in one millimole at room temperature (24 L/mol at 20 °C). */
export const ML_PER_MMOL = 24;
/** CO2 that stays dissolved in water, mmol per mL (about 1.5 g/L). */
const CO2_SOLUBILITY = 0.033;

const ev = (e: Omit<ReactionEvent, 'p' | 'signs'> & Partial<Pick<ReactionEvent, 'p' | 'signs'>>): ReactionEvent =>
  ({ p: {}, signs: [], ...e });

// ---------------------------------------------------------------- gas through a delivery tube

/** Bubble gas into the liquid of a vessel. Returns what the liquid did with it. */
export function bubbleGas(v: Vessel, gas: string, mmol: number, now: number): ActionResult {
  if (v.broken || mmol <= EPS) return { events: [] };
  const water = waterVolume(v);
  if (water <= 0.05) {
    addGas(v, gas, mmol, now);
    return { events: [] };
  }
  const before = snapshot(v);
  const events: ReactionEvent[] = [];
  const ctx: Ctx = { now, aqueousAddedToConc: false, limited: new Set() };

  if (gas === 'CO2') {
    const caBefore = amt(v.solids, 'CaCO3') + amt(v.solids, 'BaCO3');
    let left = mmol;
    // CO2 + 2OH- -> CO3^2- + H2O
    const oh = amt(v.aq, 'OH^-');
    const toCarbonate = Math.min(left, oh / 2);
    if (toCarbonate > EPS) {
      take(v.aq, 'OH^-', toCarbonate * 2);
      putIon(v, 'CO3^2-', toCarbonate);
      left -= toCarbonate;
    }
    events.push(...settle(v, ctx));
    // Excess CO2 turns carbonate into soluble hydrogen carbonate: the cloudy limewater clears.
    if (left > EPS) {
      const solid = amt(v.solids, 'CaCO3');
      const back = Math.min(left, solid);
      if (back > EPS) {
        take(v.solids, 'CaCO3', back);
        putIon(v, 'Ca^2+', back, 'Ca(HCO3)2');
        putIon(v, 'HCO3^-', back * 2, 'Ca(HCO3)2');
        left -= back;
        if (amt(v.solids, 'CaCO3') <= EPS) {
          events.push(ev({ kind: 'limewaterClears', importance: 2, type: 'combination',
            eq: { reactants: ['CaCO3', 'CO2', 'H2O'], products: ['Ca(HCO3)2'] }, signs: ['dissolve'], key: 'co2:clears' }));
        }
      }
      const co3 = amt(v.aq, 'CO3^2-');
      const toHco3 = Math.min(left, co3);
      if (toHco3 > EPS) {
        take(v.aq, 'CO3^2-', toHco3);
        putIon(v, 'HCO3^-', toHco3 * 2);
        left -= toHco3;
      }
      // What is left dissolves as carbonic acid up to saturation, the rest escapes.
      const room = Math.max(0, CO2_SOLUBILITY * water - amt(v.aq, 'HCO3^-'));
      const dissolve = Math.min(left, room);
      if (dissolve > EPS) { put(v.aq, 'HCO3^-', dissolve); left -= dissolve; }
      if (left > EPS) addGas(v, 'CO2', left, now);
    }
    const caAfter = amt(v.solids, 'CaCO3') + amt(v.solids, 'BaCO3');
    if (caAfter > caBefore + EPS) {
      const s = amt(v.solids, 'CaCO3') > caBefore ? 'CaCO3' : 'BaCO3';
      // Replace the generic precipitate event with the limewater test.
      const i = events.findIndex((e) => e.kind === 'precip');
      if (i >= 0) events.splice(i, 1);
      events.push(ev({ kind: 'co2Limewater', importance: 2, type: 'exchange',
        eq: { reactants: [s === 'CaCO3' ? 'Ca(OH)2' : 'Ba(OH)2', 'CO2'], products: [s, 'H2O'], precip: [s] },
        p: { product: s }, signs: ['precip'], key: 'co2:limewater' }));
      v.fx.precipAt = now;
    } else if (!events.some((e) => e.importance >= 2)) {
      events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas }, signs: [], key: `absorb:${gas}` }));
    }
  } else if (gas === 'NH3') {
    // Ammonia dissolves very well and makes the solution alkaline.
    put(v.aq, 'NH3', mmol);
    events.push(...settle(v, ctx));
    if (!events.some((e) => e.importance >= 2)) events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas }, signs: [], key: 'absorb:NH3' }));
  } else if (gas === 'I2') {
    // Iodine vapour settles as crystals on the cold glass or dissolves a little in water.
    put(v.solids, 'I2', mmol);
    events.push(...settle(v, ctx));
  } else if (gas === 'H2S' || gas === 'SO2') {
    // Both dissolve fairly well; with alkali they form salts.
    const oh = amt(v.aq, 'OH^-');
    const n = Math.min(mmol, oh / 2);
    const anion = gas === 'H2S' ? 'S^2-' : 'SO3^2-';
    if (n > EPS) {
      take(v.aq, 'OH^-', 2 * n);
      const cat = Object.keys(v.aq).find((id) => IONS[id]?.charge > 0 && id !== 'H^+') || 'Na^+';
      putIon(v, anion, n, salt(cat, anion).id);
    }
    const rest = mmol - n;
    if (rest > EPS) put(v.aq, gas, rest);
    events.push(...settle(v, ctx));
    if (!events.some((e) => e.importance >= 2)) events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas }, signs: [], key: `absorb:${gas}` }));
  } else if (gas === 'Cl2') {
    // Chlorine water: a little dissolves, the rest escapes with a sharp smell.
    addGas(v, gas, mmol * 0.7, now);
    v.fx.smellAt = now;
    events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas }, signs: ['smell'], key: 'absorb:Cl2' }));
  } else {
    // Hydrogen, oxygen and nitrogen oxides hardly dissolve: they bubble through.
    addGas(v, gas, mmol, now);
    events.push(ev({ kind: 'gasThrough', importance: 1, p: { gas }, signs: ['gas'] }));
  }
  return finish(v, before, events, null);
}

// ---------------------------------------------------------------- gas tests

export type GasTool = 'glowing' | 'burning' | 'litmus' | 'limewater';
export type GasTestResult =
  | 'relights' | 'burnsBrighter' | 'pop' | 'loudPop' | 'goesOut' | 'burnsAsUsual' | 'stillGlows'
  | 'litmusBlue' | 'litmusRed' | 'litmusBleached' | 'litmusSame'
  | 'limewaterCloudy' | 'limewaterSame' | 'noGas';

/** Test a gas sample (mmol of each gas). Air fills whatever the sample does not. */
export function testGas(sample: Record<string, number>, tool: GasTool): { result: GasTestResult; burns?: string[] } {
  const total = Object.values(sample).reduce((s, n) => s + n, 0);
  if (total <= EPS) return { result: tool === 'burning' ? 'burnsAsUsual' : tool === 'glowing' ? 'stillGlows' : tool === 'litmus' ? 'litmusSame' : 'limewaterSame' };
  const x = (id: string) => (sample[id] || 0) / total;
  const o2 = x('O2');
  const h2 = x('H2');
  const co2 = x('CO2');
  const nh3 = x('NH3');
  const cl2 = x('Cl2');
  const inert = x('N2');
  switch (tool) {
    case 'glowing':
      if (o2 > 0.35) return { result: 'relights' };
      if (h2 > 0.05 && o2 > 0.05) return { result: 'loudPop', burns: ['H2'] };
      if (co2 + nh3 + inert > 0.5) return { result: 'goesOut' };
      return { result: 'stillGlows' };
    case 'burning':
      if (h2 > 0.05 && o2 > 0.1) return { result: 'loudPop', burns: ['H2', 'O2'] };
      if (h2 > 0.05) return { result: 'pop', burns: ['H2'] };
      if (o2 > 0.35) return { result: 'burnsBrighter' };
      if (co2 + nh3 + cl2 + inert > 0.4) return { result: 'goesOut' };
      return { result: 'burnsAsUsual' };
    case 'litmus':
      if (cl2 > 0.1) return { result: 'litmusBleached' };
      if (nh3 > 0.05) return { result: 'litmusBlue' };
      if (co2 > 0.2 || x('SO2') > 0.05 || x('NO2') > 0.05 || x('H2S') > 0.05) return { result: 'litmusRed' };
      return { result: 'litmusSame' };
    case 'limewater':
      return { result: co2 > 0.05 ? 'limewaterCloudy' : 'limewaterSame' };
  }
}

// ---------------------------------------------------------------- conductivity and electrolysis

export type Conductivity = 'none' | 'weak' | 'strong';

export function conductivity(v: Vessel): Conductivity {
  if (v.volume < 0.05) return 'none';
  let ions = 0;
  for (const id in v.aq) if (IONS[id] && v.aq[id] > EPS) ions += v.aq[id] * Math.abs(IONS[id].charge);
  const c = ions / v.volume;
  if (c > 0.005) return 'strong';
  const weak = amt(v.aq, 'CH3COOH') + amt(v.aq, 'NH3') + amt(v.aq, 'H2SO4c');
  if (c > 0.0002 || weak > EPS) return 'weak';
  return 'none';
}

const CURRENT_A = 1;                         // school power supply
const MMOL_E_PER_S = (CURRENT_A / 96485) * 1000;

function firstPresent(v: Vessel, ids: string[]): string | undefined {
  return ids.find((id) => amt(v.aq, id) > 1e-5);
}

/** Electrolysis equation for the main salt and the products now forming. */
function electroEq(v: Vessel, cathode: string, anode: string): EqSpec | undefined {
  const cation = cathode === 'Cu' ? 'Cu^2+' : cathode === 'Ag' ? 'Ag^+' : cathode === 'Zn' ? 'Zn^2+' : cathode === 'Fe' ? 'Fe^2+'
    : firstPresent(v, ['H^+', 'Na^+', 'K^+', 'Ca^2+', 'Mg^2+', 'Ba^2+', 'Al^3+', 'Li^+']);
  const anion = anode === 'Cl2' ? 'Cl^-' : anode === 'I2' ? 'I^-' : firstPresent(v, ['SO4^2-', 'NO3^-', 'OH^-', 'PO4^3-']);
  if (!cation) return { reactants: ['H2O'], products: ['H2', 'O2'], gas: ['H2', 'O2'], cond: 'el' };
  const water = !(cathode !== 'H2' && (anode === 'Cl2' || anode === 'I2')) && !(cation === 'H^+' && anode !== 'O2');
  const saltId = anion ? salt(cation, anion).id : undefined;
  if (!saltId || (cathode === 'H2' && anode === 'O2')) return { reactants: ['H2O'], products: ['H2', 'O2'], gas: ['H2', 'O2'], cond: 'el' };
  const products: string[] = [cathode, anode];
  if (water) {
    if (cathode === 'H2') products.push(salt(cation, 'OH^-').id);
    if (anode === 'O2' && anion) products.push(salt('H^+', anion).id);
  }
  return {
    reactants: water ? [saltId, 'H2O'] : [saltId],
    products,
    gas: ['H2', 'O2', 'Cl2'].filter((g) => products.includes(g)),
    cond: 'el'
  };
}

/** Run electrolysis for `seconds` of lab time. Returns events when the products change. */
export function electrolysisStep(v: Vessel, seconds: number, now: number): ReactionEvent[] {
  if (!v.electro || v.broken) return [];
  const cond = conductivity(v);
  if (cond === 'none') {
    if (v.electro.state !== 'none') {
      v.electro.state = 'none';
      const e = ev({ kind: 'noCurrent', importance: 2, signs: [], key: 'electro:none' });
      v.lastEvents = [e];
      return [e];
    }
    return [];
  }
  let ne = MMOL_E_PER_S * seconds * (cond === 'weak' ? 0.05 : 1);
  const startNe = ne;

  // Cathode: silver and copper plate out; zinc and iron plate out together with hydrogen;
  // active metals stay in solution and water gives hydrogen.
  let cathode = 'H2';
  const ag = amt(v.aq, 'Ag^+');
  const cu = amt(v.aq, 'Cu^2+');
  const zn = amt(v.aq, 'Zn^2+');
  const fe = amt(v.aq, 'Fe^2+') + amt(v.aq, 'Fe^3+');
  if (ag > 1e-5) {
    const n = Math.min(ag, ne);
    take(v.aq, 'Ag^+', n); put(v.electro.cathode, 'Ag', n); ne -= n; cathode = 'Ag';
  } else if (cu > 1e-5) {
    const n = Math.min(cu, ne / 2);
    take(v.aq, 'Cu^2+', n); put(v.electro.cathode, 'Cu', n); ne -= n * 2; cathode = 'Cu';
  } else if (zn > 1e-5 || fe > 1e-5) {
    const ion = zn > 1e-5 ? 'Zn^2+' : amt(v.aq, 'Fe^3+') > 1e-5 ? 'Fe^3+' : 'Fe^2+';
    const metal = zn > 1e-5 ? 'Zn' : 'Fe';
    const z = IONS[ion].charge;
    const n = Math.min(amt(v.aq, ion), ne / 2 / z);
    take(v.aq, ion, n); put(v.electro.cathode, metal, n); ne -= n * z; cathode = metal;
  }
  if (ne > EPS) {
    const h = amt(v.aq, 'H^+');
    const fromAcid = Math.min(h, ne);
    if (fromAcid > EPS) { take(v.aq, 'H^+', fromAcid); }
    const fromWater = ne - fromAcid;
    if (fromWater > EPS) {
      const cation = firstPresent(v, ['Na^+', 'K^+', 'Li^+', 'Ca^2+', 'Ba^2+', 'Mg^2+', 'Al^3+']) || 'Na^+';
      putIon(v, 'OH^-', fromWater, salt(cation, 'OH^-').id);
    }
    addGas(v, 'H2', ne / 2, now);
  }

  // Anode (graphite): chloride and iodide give the halogen; otherwise water gives oxygen.
  let anode = 'O2';
  let me = startNe;
  const cl = amt(v.aq, 'Cl^-');
  const iod = amt(v.aq, 'I^-');
  if (iod > 1e-5) {
    const n = Math.min(iod, me);
    take(v.aq, 'I^-', n); put(v.aq, 'I2', n / 2); me -= n; anode = 'I2';
  } else if (cl > 1e-5) {
    const n = Math.min(cl, me);
    take(v.aq, 'Cl^-', n); addGas(v, 'Cl2', n / 2, now); me -= n; anode = 'Cl2';
    v.fx.smellAt = now;
  }
  if (me > EPS) {
    const oh = amt(v.aq, 'OH^-');
    const fromOh = Math.min(oh, me);
    if (fromOh > EPS) take(v.aq, 'OH^-', fromOh);
    const fromWater = me - fromOh;
    if (fromWater > EPS) {
      const anion = firstPresent(v, ['SO4^2-', 'NO3^-', 'Cl^-', 'PO4^3-']) || 'SO4^2-';
      putIon(v, 'H^+', fromWater, salt('H^+', anion).id);
    }
    addGas(v, 'O2', me / 4, now);
  }
  v.temp += 0.002 * seconds;

  const state = `${cathode}|${anode}`;
  if (state === v.electro.state) return [];
  v.electro.state = state;
  const signs: ReactionEvent['signs'] = ['gas'];
  if (cathode !== 'H2') signs.push('deposit');
  if (anode === 'I2' || cathode === 'Cu') signs.push('color');
  if (anode === 'Cl2') signs.push('smell');
  const e = ev({
    kind: 'electrolysis', importance: 2, type: 'redox', eq: electroEq(v, cathode, anode),
    p: { cathode, anode }, signs, key: `electro:${state}`
  });
  v.lastEvents = [e];
  return [e];
}

// ---------------------------------------------------------------- flame test

/** Colors that metal ions give to a flame. */
export const FLAME_COLORS: Record<string, string> = {
  'Li^+': '#E0203A', 'Na^+': '#FFB000', 'K^+': '#B07CE0', 'Ca^2+': '#F05A28', 'Ba^2+': '#A8D84A', 'Cu^2+': '#2EC4A0'
};

/** Dip a clean wire loop into the vessel and hold it in the flame. */
export function flameTest(v: Vessel): { ions: string[]; color: string | null } {
  const found = new Map<string, number>();
  const add = (ion: string | undefined, n: number) => {
    if (ion && FLAME_COLORS[ion] && n > 1e-5) found.set(ion, (found.get(ion) || 0) + n);
  };
  for (const id in v.aq) add(id, v.aq[id]);
  for (const id in v.solids) {
    if (METALS[id]) add(METALS[id].ion, v.solids[id]);
    else if (hasCompound(id)) add(compound(id).cation, v.solids[id]);
  }
  const ions = [...found.entries()].sort((a, b) => b[1] - a[1]).map(([ion]) => ion);
  // Sodium's bright yellow hides the other colors.
  const main = ions.includes('Na^+') ? 'Na^+' : ions[0];
  return { ions: main ? [main, ...ions.filter((i) => i !== main)] : [], color: main ? FLAME_COLORS[main] : null };
}

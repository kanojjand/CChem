// Laboratory apparatus on top of the reaction rules: gas passed through a delivery tube
// into another vessel, gas tests (glowing and burning splint, damp litmus, limewater),
// electrical conductivity and electrolysis with inert (graphite) electrodes.

import { IONS, METALS, compound, hasCompound, salt } from './data';
import { GASES, SOLUTE_SMELLS, type Smell } from './gases';
import { finish, snapshot, type ActionResult } from './actions';
import { settle, type Ctx } from './rules';
import { counterIon } from './ruleKit';
import { EPS, addGas, amt, put, putIon, take, waterVolume, type ReactionEvent, type Vessel } from './vessel';
import type { EqSpec } from './equation';

/** Millilitres of gas in one millimole at room temperature (24 L/mol at 20 °C). */
export const ML_PER_MMOL = 24;
/** CO2 that stays dissolved in water, mmol per mL (0.88 volume of gas in one volume of water). */
const CO2_SOLUBILITY = 0.036;
/** Hydrogen sulfide (2.6 volumes) and sulfur dioxide (40 volumes) a millilitre of water holds, mmol. */
const GAS_SOLUBILITY: Record<string, number> = { H2S: 0.1, SO2: 1.6 };

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
    let alkali = false;
    // CO2 + 2OH- -> CO3^2- + H2O
    const oh = amt(v.aq, 'OH^-');
    const toCarbonate = Math.min(left, oh / 2);
    if (toCarbonate > EPS) {
      take(v.aq, 'OH^-', toCarbonate * 2);
      putIon(v, 'CO3^2-', toCarbonate);
      left -= toCarbonate;
      alkali = true;
    }
    events.push(...settle(v, ctx));
    // Excess CO2 turns carbonate into soluble hydrogen carbonate: the cloudy limewater clears.
    // Marble chips from the shelf are another matter: they dissolve in carbonic acid only very slowly.
    if (left > EPS) {
      const solid = amt(v.solids, 'CaCO3');
      const chips = v.added.includes('CaCO3');
      const back = chips ? Math.min(left * 0.1, solid * 0.01) : Math.min(left, solid);
      if (back > EPS) {
        take(v.solids, 'CaCO3', back);
        putIon(v, 'Ca^2+', back, 'Ca(HCO3)2');
        putIon(v, 'HCO3^-', back * 2, 'Ca(HCO3)2');
        left -= back;
        if (!chips && amt(v.solids, 'CaCO3') <= EPS) {
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
        alkali = true;
      }
      // What is left dissolves as carbon dioxide (carbonic acid) up to saturation, the rest escapes.
      // Acids keep it from dissolving.
      const room = amt(v.aq, 'H^+') > EPS ? 0 : Math.max(0, CO2_SOLUBILITY * water - amt(v.aq, 'CO2'));
      const dissolve = Math.min(left, room);
      if (dissolve > EPS) { put(v.aq, 'CO2', dissolve); left -= dissolve; }
      if (left > EPS) addGas(v, 'CO2', left, now);
      // Carbonic acid is weak, but it is stronger than silicic acid and takes aluminium hydroxide out of aluminate.
      events.push(...settle(v, ctx));
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
      events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas, alkali: alkali ? '1' : '' }, signs: [], key: `absorb:${gas}${alkali ? ':alkali' : ''}` }));
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
    // Both dissolve fairly well as weak acids (H2S, SO2·H2O); with alkali they form salts.
    // What the water cannot hold any more escapes.
    const oh = amt(v.aq, 'OH^-');
    const n = Math.min(mmol, oh / 2);
    const anion = gas === 'H2S' ? 'S^2-' : 'SO3^2-';
    if (n > EPS) {
      take(v.aq, 'OH^-', 2 * n);
      const cat = Object.keys(v.aq).find((id) => IONS[id]?.charge > 0 && id !== 'H^+') || 'Na^+';
      putIon(v, anion, n, salt(cat, anion).id);
    }
    const rest = mmol - n;
    const dissolve = Math.min(rest, Math.max(0, GAS_SOLUBILITY[gas] * water - amt(v.aq, gas)));
    if (dissolve > EPS) put(v.aq, gas, dissolve);
    if (rest - dissolve > EPS) { addGas(v, gas, rest - dissolve, now); v.fx.smellAt = now; }
    events.push(...settle(v, ctx));
    if (!events.some((e) => e.importance >= 2)) events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas }, signs: [], key: `absorb:${gas}` }));
  } else if (gas === 'HCl') {
    // Hydrogen chloride dissolves completely: the water becomes hydrochloric acid.
    putIon(v, 'H^+', mmol, 'HCl');
    putIon(v, 'Cl^-', mmol, 'HCl');
    events.push(...settle(v, ctx));
    if (!events.some((e) => e.importance >= 2)) events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas }, signs: [], key: 'absorb:HCl' }));
  } else if (gas === 'NO2') {
    // 3NO2 + H2O -> 2HNO3 + NO: the water turns acidic, colourless NO bubbles out.
    putIon(v, 'H^+', (2 * mmol) / 3, 'HNO3');
    putIon(v, 'NO3^-', (2 * mmol) / 3, 'HNO3');
    addGas(v, 'NO', mmol / 3, now);
    events.push(...settle(v, ctx));
    if (!events.some((e) => e.importance >= 2)) events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas }, signs: [], key: 'absorb:NO2' }));
  } else if (gas === 'Cl2') {
    // Chlorine water: about a third dissolves, the rest escapes with a sharp smell.
    // Alkali takes up all of it (chloride and hypochlorite); so do solutions it reacts with.
    const alkaline = amt(v.aq, 'OH^-') > EPS;
    const kept = alkaline ? mmol : mmol * 0.3;
    put(v.aq, 'Cl2', kept);
    if (mmol - kept > EPS) { addGas(v, gas, mmol - kept, now); v.fx.smellAt = now; }
    events.push(...settle(v, ctx));
    if (!events.some((e) => e.importance >= 2)) {
      events.push(ev({ kind: 'gasAbsorbed', importance: 2, p: { gas }, signs: alkaline ? [] : ['smell'], key: 'absorb:Cl2' }));
    }
  } else {
    // Hydrogen, oxygen and nitrogen oxides hardly dissolve: they bubble through.
    addGas(v, gas, mmol, now);
    events.push(ev({ kind: 'gasThrough', importance: 1, p: { gas }, signs: ['gas'] }));
  }
  return finish(v, before, events, null);
}

// ---------------------------------------------------------------- gas tests

export type GasTool = 'glowing' | 'burning' | 'litmus' | 'limewater' | 'smell' | 'starchKI' | 'leadPaper' | 'hclRod';
export const GAS_TOOLS: GasTool[] = ['smell', 'glowing', 'burning', 'litmus', 'limewater', 'starchKI', 'leadPaper', 'hclRod'];
export type GasTestResult =
  | 'relights' | 'burnsBrighter' | 'pop' | 'loudPop' | 'goesOut' | 'burnsAsUsual' | 'stillGlows' | 'h2sBurns'
  | 'litmusBlue' | 'litmusRed' | 'litmusBleached' | 'litmusSame'
  | 'limewaterCloudy' | 'limewaterSame' | 'noGas'
  | `smell:${Smell}` | 'kiBlue' | 'kiSame' | 'leadBlack' | 'leadSame' | 'whiteSmoke' | 'noSmoke';

const NOTHING: Record<GasTool, GasTestResult> = {
  glowing: 'stillGlows', burning: 'burnsAsUsual', litmus: 'litmusSame', limewater: 'limewaterSame',
  smell: 'smell:none', starchKI: 'kiSame', leadPaper: 'leadSame', hclRod: 'noSmoke'
};

/** Smell of a gas sample and of volatile substances in the solution, the strongest first. */
export function smellOf(sample: Record<string, number>, solutes: Record<string, number> = {}): Smell {
  let best: Smell = 'none';
  let score = 0;
  const consider = (smell: Smell | undefined, n: number) => {
    if (!smell || smell === 'none' || n <= 1e-6) return;
    // Hydrogen sulfide and ammonia are noticed at tiny amounts.
    const k = smell === 'rottenEggs' ? 50 : smell === 'ammonia' || smell === 'chlorine' ? 5 : 1;
    if (n * k > score) { score = n * k; best = smell; }
  };
  for (const id in sample) consider(GASES[id]?.smell, sample[id]);
  for (const id in solutes) consider(SOLUTE_SMELLS[id], solutes[id]);
  return best;
}

/** Test a gas sample (mmol of each gas). Air fills whatever the sample does not. */
export function testGas(sample: Record<string, number>, tool: GasTool, solutes: Record<string, number> = {}): { result: GasTestResult; burns?: string[] } {
  if (tool === 'smell') return { result: `smell:${smellOf(sample, solutes)}` };
  const total = Object.values(sample).reduce((s, n) => s + n, 0);
  if (total <= EPS) {
    // Paper and the glass rod still react with vapour over the solution.
    if (tool === 'starchKI' && ((solutes.Cl2 || 0) + (solutes.Br2 || 0) > 1e-5)) return { result: 'kiBlue' };
    if (tool === 'leadPaper' && (solutes.H2S || 0) > 1e-6) return { result: 'leadBlack' };
    if (tool === 'hclRod' && (solutes.NH3 || 0) > 1e-4) return { result: 'whiteSmoke' };
    return { result: NOTHING[tool] };
  }
  const x = (id: string) => (sample[id] || 0) / total;
  const o2 = x('O2');
  const h2 = x('H2');
  const co2 = x('CO2');
  const nh3 = x('NH3');
  const cl2 = x('Cl2');
  const inert = x('N2');
  const h2s = x('H2S');
  // Dinitrogen oxide gives up its oxygen in the flame: a glowing splint relights in it as in oxygen.
  const n2o = x('N2O');
  switch (tool) {
    case 'glowing':
      if (o2 + n2o > 0.35) return { result: 'relights' };
      if (h2 > 0.05 && o2 > 0.05) return { result: 'loudPop', burns: ['H2'] };
      if (co2 + nh3 + inert + x('SO2') + x('HCl') + h2s > 0.5) return { result: 'goesOut' };
      return { result: 'stillGlows' };
    case 'burning':
      if (h2 > 0.05 && o2 > 0.1) return { result: 'loudPop', burns: ['H2', 'O2'] };
      if (h2 > 0.05) return { result: 'pop', burns: ['H2'] };
      if (h2s > 0.1) return { result: 'h2sBurns', burns: ['H2S'] };
      if (o2 + n2o > 0.35) return { result: 'burnsBrighter' };
      if (co2 + nh3 + cl2 + inert + x('SO2') + x('HCl') > 0.4) return { result: 'goesOut' };
      return { result: 'burnsAsUsual' };
    case 'litmus':
      if (cl2 > 0.1) return { result: 'litmusBleached' };
      if (nh3 > 0.05) return { result: 'litmusBlue' };
      if (co2 > 0.2 || x('SO2') > 0.05 || x('NO2') > 0.05 || h2s > 0.05 || x('HCl') > 0.02) return { result: 'litmusRed' };
      return { result: 'litmusSame' };
    case 'limewater':
      // Sulfur dioxide also turns limewater cloudy (calcium sulfite).
      return { result: co2 > 0.05 || x('SO2') > 0.05 ? 'limewaterCloudy' : 'limewaterSame' };
    case 'starchKI':
      return { result: cl2 + x('Br2') + x('NO2') + (solutes.Cl2 ? 0.1 : 0) > 0.02 ? 'kiBlue' : 'kiSame' };
    case 'leadPaper':
      return { result: h2s > 0.001 || (solutes.H2S || 0) > 1e-6 ? 'leadBlack' : 'leadSame' };
    case 'hclRod':
      return { result: nh3 > 0.01 || (solutes.NH3 || 0) > 1e-4 ? 'whiteSmoke' : 'noSmoke' };
    default:
      return { result: 'noGas' };
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

/**
 * Cations reduced at the cathode, the most easily reduced first. `share` is the part of the
 * current that deposits the metal; the rest gives hydrogen (metals between aluminium and
 * hydrogen in the activity series). Iron(III) is first reduced to iron(II) without any metal.
 * Aluminium and the metals before it are never reduced from water: only hydrogen forms.
 */
const CATHODE: { ion: string; metal: string; share: number }[] = [
  { ion: 'Ag^+', metal: 'Ag', share: 1 },
  { ion: 'Fe^3+', metal: 'Fe^2+', share: 1 },
  { ion: 'Cu^2+', metal: 'Cu', share: 1 },
  { ion: 'Pb^2+', metal: 'Pb', share: 0.95 },
  { ion: 'Sn^2+', metal: 'Sn', share: 0.9 },
  { ion: 'Ni^2+', metal: 'Ni', share: 0.8 },
  { ion: 'Co^2+', metal: 'Co', share: 0.8 },
  { ion: 'Fe^2+', metal: 'Fe', share: 0.6 },
  { ion: 'Zn^2+', metal: 'Zn', share: 0.75 },
  { ion: 'Cr^3+', metal: 'Cr', share: 0.3 },
  { ion: 'Mn^2+', metal: 'Mn', share: 0.3 }
];
const ACTIVE = ['Na^+', 'K^+', 'Li^+', 'Ca^2+', 'Ba^2+', 'Mg^2+', 'Al^3+'];

/** Anions oxidised at a graphite anode, the most easily oxidised first; then OH- and water give oxygen. */
const ANODE: { ion: string; product: string; e: number }[] = [
  { ion: 'S^2-', product: 'S', e: 2 },
  { ion: 'I^-', product: 'I2', e: 1 },
  { ion: 'Br^-', product: 'Br2', e: 1 },
  { ion: 'Cl^-', product: 'Cl2', e: 1 }
];
const OXO = ['SO4^2-', 'NO3^-', 'PO4^3-', 'CO3^2-', 'CH3COO^-', 'F^-'];

/** Electrolysis equation for the salt being electrolysed and the products now forming. */
function electroEq(cation: string | undefined, cathode: string, anion: string | undefined, anode: string): EqSpec {
  const water: EqSpec = { reactants: ['H2O'], products: ['H2', 'O2'], gas: ['H2', 'O2'], cond: 'el' };
  if (!cation || !anion) return water;
  const gas = ['H2', 'O2', 'Cl2'];
  const saltId = salt(cation, anion).id;
  const halide = anode !== 'O2';
  if (cathode === 'H2' && !halide) return water;
  const products: string[] = [];
  let withWater = false;
  if (cathode === 'Fe^2+') products.push(salt('Fe^2+', anion).id);
  else if (cathode === 'H2') {
    products.push('H2');
    // An acid gives up its hydrogen; a salt of an active metal leaves its hydroxide behind.
    if (cation !== 'H^+') { products.push(salt(cation, 'OH^-').id); withWater = true; }
  } else products.push(cathode);
  products.push(anode);
  if (!halide) { products.push(salt('H^+', anion).id); withWater = true; }
  return { reactants: withWater ? [saltId, 'H2O'] : [saltId], products: [...new Set(products)], gas: gas.filter((g) => products.includes(g)), cond: 'el' };
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
  const startNe = MMOL_E_PER_S * seconds * (cond === 'weak' ? 0.05 : 1);
  let ne = startNe;

  // Cathode.
  let cathode = 'H2';
  let cation: string | undefined;
  let hydrogenE = 0;
  for (const c of CATHODE) {
    if (ne <= EPS) break;
    const have = amt(v.aq, c.ion);
    if (have <= 1e-5) continue;
    if (c.ion === 'Fe^3+') {
      const n = Math.min(have, ne);
      const anion = counterIon(v.parent['Fe^3+'] || '', 'Fe^3+') || 'Cl^-';
      take(v.aq, 'Fe^3+', n);
      putIon(v, 'Fe^2+', n, salt('Fe^2+', anion).id);
      ne -= n;
    } else {
      const z = IONS[c.ion].charge;
      const eMetal = Math.min(have * z, ne * c.share);
      const eH = Math.min(ne - eMetal, (eMetal * (1 - c.share)) / c.share);
      take(v.aq, c.ion, eMetal / z);
      put(v.electro.cathode, c.metal, eMetal / z);
      ne -= eMetal + eH;
      hydrogenE += eH;
    }
    if (!cation) { cation = c.ion; cathode = c.metal; }
  }
  hydrogenE += Math.max(0, ne);
  let acid = false;
  if (hydrogenE > EPS) {
    const h = amt(v.aq, 'H^+');
    const fromAcid = Math.min(h, hydrogenE);
    if (fromAcid > EPS) { take(v.aq, 'H^+', fromAcid); acid = true; }
    const fromWater = hydrogenE - fromAcid;
    const active = firstPresent(v, ACTIVE);
    if (fromWater > EPS) putIon(v, 'OH^-', fromWater, salt(active || cation || 'Na^+', 'OH^-').id);
    addGas(v, 'H2', hydrogenE / 2, now);
    if (!cation) cation = acid ? 'H^+' : active;
  }

  // Anode (graphite).
  let anode = 'O2';
  let anion: string | undefined;
  let me = startNe;
  for (const a of ANODE) {
    if (me <= EPS) break;
    const have = amt(v.aq, a.ion);
    if (have <= 1e-5) continue;
    const n = Math.min(have, me / a.e);
    take(v.aq, a.ion, n);
    me -= n * a.e;
    if (a.product === 'S') put(v.solids, 'S', n);
    else if (a.product === 'Cl2') { addGas(v, 'Cl2', n / 2, now); v.fx.smellAt = now; }
    else put(v.aq, a.product, n / 2);
    if (!anion) { anion = a.ion; anode = a.product; }
  }
  if (me > EPS) {
    const oh = amt(v.aq, 'OH^-');
    const fromOh = Math.min(oh, me);
    if (fromOh > EPS) take(v.aq, 'OH^-', fromOh);
    const fromWater = me - fromOh;
    const oxo = firstPresent(v, OXO);
    if (fromWater > EPS) putIon(v, 'H^+', fromWater, salt('H^+', oxo || 'SO4^2-').id);
    addGas(v, 'O2', me / 4, now);
    if (!anion) anion = oxo || (fromOh > EPS ? 'OH^-' : undefined);
  }
  v.temp += 0.002 * seconds;

  // What the electrodes made reacts with the solution: hydroxides come down, acid meets alkali,
  // halogens meet the alkali formed at the cathode. The electrolysis event tells about it.
  settle(v, { now, aqueousAddedToConc: false, limited: new Set() });

  const state = `${cathode}|${anode}`;
  if (state === v.electro.state) return [];
  v.electro.state = state;
  const signs: ReactionEvent['signs'] = ['gas'];
  const metal = cathode !== 'H2' && cathode !== 'Fe^2+';
  if (metal) signs.push('deposit');
  if (anode === 'I2' || anode === 'Br2' || cathode === 'Cu' || cathode === 'Fe^2+') signs.push('color');
  if (anode === 'S') signs.push('precip');
  if (anode === 'Cl2' || anode === 'Br2') signs.push('smell');
  const e = ev({
    kind: 'electrolysis', importance: 2, type: 'redox', eq: electroEq(cation, cathode, anion === 'OH^-' ? undefined : anion, anode),
    p: { cathode, anode, acid: acid ? '1' : '', h2: metal && hydrogenE > EPS ? '1' : '' }, signs, key: `electro:${state}`
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
    else if (hasCompound(id) && compound(id).cation) add(compound(id).cation, v.solids[id]);
    else {
      // Basic salts, crystal hydrates and oxides: the metal is the first element of the formula.
      const sym = /^\(?([A-Z][a-z]?)/.exec(id)?.[1];
      if (sym && METALS[sym]) add(METALS[sym].ion, v.solids[id]);
    }
  }
  const ions = [...found.entries()].sort((a, b) => b[1] - a[1]).map(([ion]) => ion);
  // Sodium's bright yellow hides the other colors.
  const main = ions.includes('Na^+') ? 'Na^+' : ions[0];
  return { ions: main ? [main, ...ions.filter((i) => i !== main)] : [], color: main ? FLAME_COLORS[main] : null };
}

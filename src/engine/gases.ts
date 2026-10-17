// Properties of the gases the lab can give off: molar mass (lighter or heavier than air),
// color, smell, solubility in water, hazards. Used for collecting gases, for the gas card
// in the panel and for smelling a gas the safe way (wafting it towards the nose).

export type Smell =
  | 'none' | 'ammonia' | 'rottenEggs' | 'burntMatch' | 'chlorine' | 'hydrogenChloride'
  | 'nitrogenDioxide' | 'vinegar' | 'bromine' | 'iodine';

export interface GasProps {
  id: string;
  M: number;            // g/mol; air is 29
  hex?: string;         // color of the gas; none when colourless
  smell: Smell;
  solubility: number;   // volumes of gas in one volume of water at 20 °C
  toxic?: boolean;
  flammable?: boolean;
  supportsBurning?: boolean;
  reactsWithWater?: boolean;
}

export const AIR_M = 29;

export const GASES: Record<string, GasProps> = {
  H2: { id: 'H2', M: 2, smell: 'none', solubility: 0.018, flammable: true },
  O2: { id: 'O2', M: 32, smell: 'none', solubility: 0.031, supportsBurning: true },
  N2: { id: 'N2', M: 28, smell: 'none', solubility: 0.015 },
  CO2: { id: 'CO2', M: 44, smell: 'none', solubility: 0.88 },
  NH3: { id: 'NH3', M: 17, smell: 'ammonia', solubility: 700, toxic: true },
  HCl: { id: 'HCl', M: 36.5, smell: 'hydrogenChloride', solubility: 450, toxic: true },
  SO2: { id: 'SO2', M: 64, smell: 'burntMatch', solubility: 40, toxic: true },
  H2S: { id: 'H2S', M: 34, smell: 'rottenEggs', solubility: 2.6, toxic: true, flammable: true },
  Cl2: { id: 'Cl2', M: 71, hex: '#C9DD5A', smell: 'chlorine', solubility: 2.3, toxic: true },
  NO: { id: 'NO', M: 30, smell: 'none', solubility: 0.047, toxic: true },
  NO2: { id: 'NO2', M: 46, hex: '#B5542A', smell: 'nitrogenDioxide', solubility: 0, toxic: true, reactsWithWater: true },
  Br2: { id: 'Br2', M: 160, hex: '#A8401E', smell: 'bromine', solubility: 0, toxic: true },
  I2: { id: 'I2', M: 254, hex: '#8A3FB8', smell: 'iodine', solubility: 0, toxic: true }
};

/** Smells of volatile substances dissolved in a solution (smelled at the mouth of the vessel). */
export const SOLUTE_SMELLS: Record<string, Smell> = {
  NH3: 'ammonia', H2S: 'rottenEggs', SO2: 'burntMatch', Cl2: 'chlorine', Br2: 'bromine',
  CH3COOH: 'vinegar', I2: 'iodine'
};

export type CollectMethod = 'water' | 'up' | 'down';

/**
 * What share of a gas ends up in the collector:
 * - over water: very soluble gases (NH3, HCl, SO2) and NO2 dissolve in the water of the trough;
 *   CO2, H2S and Cl2 partly dissolve;
 * - an upside-down tube (mouth down) keeps only gases lighter than air;
 * - an upright tube (mouth up) keeps only gases heavier than air.
 */
export function collectShare(gas: string, method: CollectMethod): number {
  const g = GASES[gas];
  if (!g) return 0;
  if (method === 'water') {
    if (g.reactsWithWater || g.solubility >= 20) return 0;
    if (g.solubility >= 2) return 0.6;
    if (g.solubility >= 0.5) return 0.85;
    return 1;
  }
  // Nitrogen (28) and NO (30) weigh about as much as air: they mix with it and cannot be collected this way.
  if (method === 'up') return g.M < 27 ? 1 : 0;
  return g.M > 31 ? 1 : 0;
}

/** Relative density of a gas to air. */
export const airDensity = (gas: string) => (GASES[gas] ? GASES[gas].M / AIR_M : 1);

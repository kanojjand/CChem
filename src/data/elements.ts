// Periodic table data: atomic number, symbol, atomic mass, category, English name.
// Kazakh and Russian names live in the language files (Strings.elements).

export type ElementCat =
  | 'alkali' | 'alkaline' | 'transition' | 'post' | 'metalloid'
  | 'nonmetal' | 'halogen' | 'noble' | 'lanthanide' | 'actinide';

export interface ElementDef {
  z: number;
  sym: string;
  mass: number;
  cat: ElementCat;
  en: string;
  period: number;
  group: number;      // 1..18; 0 for lanthanides and actinides
  row: number;        // display row: 1..7, then 9 (lanthanides) and 10 (actinides)
  col: number;        // display column 1..18
}

type Raw = [string, number, ElementCat, string];

// Period 1–3
const P1: Raw[] = [
  ['H', 1.008, 'nonmetal', 'Hydrogen'],
  ['He', 4.003, 'noble', 'Helium'],
  ['Li', 6.94, 'alkali', 'Lithium'],
  ['Be', 9.012, 'alkaline', 'Beryllium'],
  ['B', 10.81, 'metalloid', 'Boron'],
  ['C', 12.011, 'nonmetal', 'Carbon'],
  ['N', 14.007, 'nonmetal', 'Nitrogen'],
  ['O', 15.999, 'nonmetal', 'Oxygen'],
  ['F', 18.998, 'halogen', 'Fluorine'],
  ['Ne', 20.18, 'noble', 'Neon'],
  ['Na', 22.99, 'alkali', 'Sodium'],
  ['Mg', 24.305, 'alkaline', 'Magnesium'],
  ['Al', 26.982, 'post', 'Aluminium'],
  ['Si', 28.085, 'metalloid', 'Silicon'],
  ['P', 30.974, 'nonmetal', 'Phosphorus'],
  ['S', 32.06, 'nonmetal', 'Sulfur'],
  ['Cl', 35.45, 'halogen', 'Chlorine'],
  ['Ar', 39.95, 'noble', 'Argon']
];

// Period 4
const P4: Raw[] = [
  ['K', 39.098, 'alkali', 'Potassium'],
  ['Ca', 40.078, 'alkaline', 'Calcium'],
  ['Sc', 44.956, 'transition', 'Scandium'],
  ['Ti', 47.867, 'transition', 'Titanium'],
  ['V', 50.942, 'transition', 'Vanadium'],
  ['Cr', 51.996, 'transition', 'Chromium'],
  ['Mn', 54.938, 'transition', 'Manganese'],
  ['Fe', 55.845, 'transition', 'Iron'],
  ['Co', 58.933, 'transition', 'Cobalt'],
  ['Ni', 58.693, 'transition', 'Nickel'],
  ['Cu', 63.546, 'transition', 'Copper'],
  ['Zn', 65.38, 'transition', 'Zinc'],
  ['Ga', 69.723, 'post', 'Gallium'],
  ['Ge', 72.63, 'metalloid', 'Germanium'],
  ['As', 74.922, 'metalloid', 'Arsenic'],
  ['Se', 78.971, 'nonmetal', 'Selenium'],
  ['Br', 79.904, 'halogen', 'Bromine'],
  ['Kr', 83.798, 'noble', 'Krypton']
];

// Period 5
const P5: Raw[] = [
  ['Rb', 85.468, 'alkali', 'Rubidium'],
  ['Sr', 87.62, 'alkaline', 'Strontium'],
  ['Y', 88.906, 'transition', 'Yttrium'],
  ['Zr', 91.224, 'transition', 'Zirconium'],
  ['Nb', 92.906, 'transition', 'Niobium'],
  ['Mo', 95.95, 'transition', 'Molybdenum'],
  ['Tc', 98, 'transition', 'Technetium'],
  ['Ru', 101.07, 'transition', 'Ruthenium'],
  ['Rh', 102.91, 'transition', 'Rhodium'],
  ['Pd', 106.42, 'transition', 'Palladium'],
  ['Ag', 107.87, 'transition', 'Silver'],
  ['Cd', 112.41, 'transition', 'Cadmium'],
  ['In', 114.82, 'post', 'Indium'],
  ['Sn', 118.71, 'post', 'Tin'],
  ['Sb', 121.76, 'metalloid', 'Antimony'],
  ['Te', 127.6, 'metalloid', 'Tellurium'],
  ['I', 126.9, 'halogen', 'Iodine'],
  ['Xe', 131.29, 'noble', 'Xenon']
];

// Period 6, lanthanides included in order
const P6: Raw[] = [
  ['Cs', 132.91, 'alkali', 'Caesium'],
  ['Ba', 137.33, 'alkaline', 'Barium'],
  ['La', 138.91, 'lanthanide', 'Lanthanum'],
  ['Ce', 140.12, 'lanthanide', 'Cerium'],
  ['Pr', 140.91, 'lanthanide', 'Praseodymium'],
  ['Nd', 144.24, 'lanthanide', 'Neodymium'],
  ['Pm', 145, 'lanthanide', 'Promethium'],
  ['Sm', 150.36, 'lanthanide', 'Samarium'],
  ['Eu', 151.96, 'lanthanide', 'Europium'],
  ['Gd', 157.25, 'lanthanide', 'Gadolinium'],
  ['Tb', 158.93, 'lanthanide', 'Terbium'],
  ['Dy', 162.5, 'lanthanide', 'Dysprosium'],
  ['Ho', 164.93, 'lanthanide', 'Holmium'],
  ['Er', 167.26, 'lanthanide', 'Erbium'],
  ['Tm', 168.93, 'lanthanide', 'Thulium'],
  ['Yb', 173.05, 'lanthanide', 'Ytterbium'],
  ['Lu', 174.97, 'lanthanide', 'Lutetium'],
  ['Hf', 178.49, 'transition', 'Hafnium'],
  ['Ta', 180.95, 'transition', 'Tantalum'],
  ['W', 183.84, 'transition', 'Tungsten'],
  ['Re', 186.21, 'transition', 'Rhenium'],
  ['Os', 190.23, 'transition', 'Osmium'],
  ['Ir', 192.22, 'transition', 'Iridium'],
  ['Pt', 195.08, 'transition', 'Platinum'],
  ['Au', 196.97, 'transition', 'Gold'],
  ['Hg', 200.59, 'transition', 'Mercury'],
  ['Tl', 204.38, 'post', 'Thallium'],
  ['Pb', 207.2, 'post', 'Lead'],
  ['Bi', 208.98, 'post', 'Bismuth'],
  ['Po', 209, 'post', 'Polonium'],
  ['At', 210, 'halogen', 'Astatine'],
  ['Rn', 222, 'noble', 'Radon']
];

// Period 7, actinides included in order
const P7: Raw[] = [
  ['Fr', 223, 'alkali', 'Francium'],
  ['Ra', 226, 'alkaline', 'Radium'],
  ['Ac', 227, 'actinide', 'Actinium'],
  ['Th', 232.04, 'actinide', 'Thorium'],
  ['Pa', 231.04, 'actinide', 'Protactinium'],
  ['U', 238.03, 'actinide', 'Uranium'],
  ['Np', 237, 'actinide', 'Neptunium'],
  ['Pu', 244, 'actinide', 'Plutonium'],
  ['Am', 243, 'actinide', 'Americium'],
  ['Cm', 247, 'actinide', 'Curium'],
  ['Bk', 247, 'actinide', 'Berkelium'],
  ['Cf', 251, 'actinide', 'Californium'],
  ['Es', 252, 'actinide', 'Einsteinium'],
  ['Fm', 257, 'actinide', 'Fermium'],
  ['Md', 258, 'actinide', 'Mendelevium'],
  ['No', 259, 'actinide', 'Nobelium'],
  ['Lr', 266, 'actinide', 'Lawrencium'],
  ['Rf', 267, 'transition', 'Rutherfordium'],
  ['Db', 268, 'transition', 'Dubnium'],
  ['Sg', 269, 'transition', 'Seaborgium'],
  ['Bh', 270, 'transition', 'Bohrium'],
  ['Hs', 269, 'transition', 'Hassium'],
  ['Mt', 278, 'transition', 'Meitnerium'],
  ['Ds', 281, 'transition', 'Darmstadtium'],
  ['Rg', 282, 'transition', 'Roentgenium'],
  ['Cn', 285, 'transition', 'Copernicium'],
  ['Nh', 286, 'post', 'Nihonium'],
  ['Fl', 289, 'post', 'Flerovium'],
  ['Mc', 290, 'post', 'Moscovium'],
  ['Lv', 293, 'post', 'Livermorium'],
  ['Ts', 294, 'halogen', 'Tennessine'],
  ['Og', 294, 'noble', 'Oganesson']
];

const PERIOD_START = [1, 3, 11, 19, 37, 55, 87];

function place(z: number): Pick<ElementDef, 'period' | 'group' | 'row' | 'col'> {
  let period = 1;
  for (let i = 0; i < PERIOD_START.length; i++) if (z >= PERIOD_START[i]) period = i + 1;
  const k = z - PERIOD_START[period - 1]; // position within the period, from 0
  if (period === 1) return { period, group: z === 1 ? 1 : 18, row: 1, col: z === 1 ? 1 : 18 };
  if (period <= 3) {
    const group = k < 2 ? k + 1 : k + 11;
    return { period, group, row: period, col: group };
  }
  if (period <= 5) return { period, group: k + 1, row: period, col: k + 1 };
  // Periods 6 and 7: positions 2..16 are the f-block, shown in rows 9 and 10.
  if (k < 2) return { period, group: k + 1, row: period, col: k + 1 };
  if (k <= 16) return { period, group: 0, row: period + 3, col: k + 1 };
  const group = k - 13;
  return { period, group, row: period, col: group };
}

export const ELEMENTS: ElementDef[] = [...P1, ...P4, ...P5, ...P6, ...P7].map(([sym, mass, cat, en], i) => ({
  z: i + 1, sym, mass, cat, en, ...place(i + 1)
}));

export const ELEMENT_BY_SYMBOL: Record<string, ElementDef> = Object.fromEntries(ELEMENTS.map((e) => [e.sym, e]));

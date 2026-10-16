// Substance data: ions, compounds, solubility table, metals and the reagent shelf.
// Names come in three languages. Kazakh terms follow the usual school nomenclature
// and are listed in docs/content-mvp.md for review by a chemistry teacher.

export type Lang = 'kk' | 'ru' | 'en';
export type L3 = Record<Lang, string>;

// ---------------------------------------------------------------- colors

export const COLORS = {
  white: { hex: '#F4F5F2', name: { kk: 'ақ', ru: 'белый', en: 'white' } },
  curdy: { hex: '#F7F7F2', name: { kk: 'ақ ірімшік тәрізді', ru: 'белый творожистый', en: 'white curdy' } },
  gel: { hex: '#E9EEF2', name: { kk: 'ақ іркілдек', ru: 'белый студенистый', en: 'white gelatinous' } },
  clearGel: { hex: '#DCE7EE', name: { kk: 'түссіз іркілдек', ru: 'бесцветный студенистый', en: 'colorless gel' } },
  lightBlue: { hex: '#5FB2EC', name: { kk: 'көгілдір', ru: 'голубой', en: 'light blue' } },
  greyGreen: { hex: '#8EA585', name: { kk: 'сұр-жасыл', ru: 'серо-зелёный', en: 'grey-green' } },
  brown: { hex: '#9C4A1E', name: { kk: 'қоңыр', ru: 'бурый', en: 'rust-brown' } },
  yellow: { hex: '#F2D04B', name: { kk: 'сары', ru: 'жёлтый', en: 'yellow' } },
  paleYellow: { hex: '#F3E6A6', name: { kk: 'ақшыл сары', ru: 'светло-жёлтый', en: 'pale yellow' } },
  black: { hex: '#1E1E1E', name: { kk: 'қара', ru: 'чёрный', en: 'black' } },
  darkBrown: { hex: '#4A3426', name: { kk: 'қара-қоңыр', ru: 'тёмно-бурый', en: 'dark brown' } },
  blueGreen: { hex: '#3E9C88', name: { kk: 'көкшіл-жасыл', ru: 'сине-зелёный', en: 'blue-green' } },
  redBrown: { hex: '#8E2F1A', name: { kk: 'қызыл-қоңыр', ru: 'красно-бурый', en: 'red-brown' } },
  copper: { hex: '#C9652C', name: { kk: 'қызыл', ru: 'красный', en: 'copper-red' } },
  silver: { hex: '#A9AFB6', name: { kk: 'сұр', ru: 'серый', en: 'grey' } },
  greyMetal: { hex: '#9AA3AB', name: { kk: 'сұр', ru: 'серый', en: 'grey' } }
} as const;
export type ColorKey = keyof typeof COLORS;

// ---------------------------------------------------------------- ions

export interface IonDef {
  id: string;
  charge: number;
  part: string;          // formula fragment used to build compounds
  poly?: boolean;        // needs parentheses when repeated
  prefix?: boolean;      // anion written first (acetates)
  name: L3;              // ru: cation in genitive / anion; kk: cation / anion with possessive ending
  acidName?: L3;         // for anions: the acid formed with H+
  color?: string;        // color of the solution
  refC?: number;         // concentration (mol/L) at which `color` is reached
  hydrolysisPKa?: number;
  metal?: string;
  weakConj?: true;       // anion of a weak acid: cannot stay together with free H+
}

const ION_LIST: IonDef[] = [
  // cations
  { id: 'H^+', charge: 1, part: 'H', name: { kk: 'сутек', ru: 'водорода', en: 'hydrogen' } },
  { id: 'Li^+', charge: 1, part: 'Li', metal: 'Li', name: { kk: 'литий', ru: 'лития', en: 'lithium' } },
  { id: 'Na^+', charge: 1, part: 'Na', metal: 'Na', name: { kk: 'натрий', ru: 'натрия', en: 'sodium' } },
  { id: 'K^+', charge: 1, part: 'K', metal: 'K', name: { kk: 'калий', ru: 'калия', en: 'potassium' } },
  { id: 'NH4^+', charge: 1, part: 'NH4', poly: true, name: { kk: 'аммоний', ru: 'аммония', en: 'ammonium' } },
  { id: 'Ag^+', charge: 1, part: 'Ag', metal: 'Ag', name: { kk: 'күміс', ru: 'серебра', en: 'silver' } },
  { id: 'Ba^2+', charge: 2, part: 'Ba', metal: 'Ba', name: { kk: 'барий', ru: 'бария', en: 'barium' } },
  { id: 'Ca^2+', charge: 2, part: 'Ca', metal: 'Ca', name: { kk: 'кальций', ru: 'кальция', en: 'calcium' } },
  { id: 'Mg^2+', charge: 2, part: 'Mg', metal: 'Mg', name: { kk: 'магний', ru: 'магния', en: 'magnesium' } },
  { id: 'Zn^2+', charge: 2, part: 'Zn', metal: 'Zn', hydrolysisPKa: 9.0, name: { kk: 'мырыш', ru: 'цинка', en: 'zinc' } },
  { id: 'Cu^2+', charge: 2, part: 'Cu', metal: 'Cu', hydrolysisPKa: 7.5, color: '#4FA6E6', refC: 0.5, name: { kk: 'мыс(II)', ru: 'меди(II)', en: 'copper(II)' } },
  { id: 'Fe^2+', charge: 2, part: 'Fe', metal: 'Fe', hydrolysisPKa: 9.5, color: '#B9DDA2', refC: 0.5, name: { kk: 'темір(II)', ru: 'железа(II)', en: 'iron(II)' } },
  { id: 'Fe^3+', charge: 3, part: 'Fe', metal: 'Fe', hydrolysisPKa: 2.2, color: '#D99A1F', refC: 0.5, name: { kk: 'темір(III)', ru: 'железа(III)', en: 'iron(III)' } },
  { id: 'Al^3+', charge: 3, part: 'Al', metal: 'Al', hydrolysisPKa: 5.0, name: { kk: 'алюминий', ru: 'алюминия', en: 'aluminium' } },
  { id: '[Cu(NH3)4]^2+', charge: 2, part: '[Cu(NH3)4]', color: '#2338C8', refC: 0.05, name: { kk: 'тетраамминмыс(II)', ru: 'тетраамминмеди(II)', en: 'tetraamminecopper(II)' } },
  { id: '[Zn(NH3)4]^2+', charge: 2, part: '[Zn(NH3)4]', name: { kk: 'тетраамминмырыш', ru: 'тетраамминцинка', en: 'tetraamminezinc' } },
  { id: '[Ag(NH3)2]^+', charge: 1, part: '[Ag(NH3)2]', name: { kk: 'диамминкүміс', ru: 'диамминсеребра', en: 'diamminesilver' } },
  // anions
  { id: 'OH^-', charge: -1, part: 'OH', poly: true, name: { kk: 'гидроксиді', ru: 'гидроксид', en: 'hydroxide' } },
  { id: 'Cl^-', charge: -1, part: 'Cl', name: { kk: 'хлориді', ru: 'хлорид', en: 'chloride' }, acidName: { kk: 'тұз қышқылы', ru: 'соляная кислота', en: 'hydrochloric acid' } },
  { id: 'I^-', charge: -1, part: 'I', name: { kk: 'иодиді', ru: 'иодид', en: 'iodide' }, acidName: { kk: 'иодсутек қышқылы', ru: 'иодоводородная кислота', en: 'hydroiodic acid' } },
  { id: 'NO3^-', charge: -1, part: 'NO3', poly: true, name: { kk: 'нитраты', ru: 'нитрат', en: 'nitrate' }, acidName: { kk: 'азот қышқылы', ru: 'азотная кислота', en: 'nitric acid' } },
  { id: 'SO4^2-', charge: -2, part: 'SO4', poly: true, name: { kk: 'сульфаты', ru: 'сульфат', en: 'sulfate' }, acidName: { kk: 'күкірт қышқылы', ru: 'серная кислота', en: 'sulfuric acid' } },
  { id: 'CO3^2-', charge: -2, part: 'CO3', poly: true, weakConj: true, name: { kk: 'карбонаты', ru: 'карбонат', en: 'carbonate' }, acidName: { kk: 'көмір қышқылы', ru: 'угольная кислота', en: 'carbonic acid' } },
  { id: 'HCO3^-', charge: -1, part: 'HCO3', poly: true, weakConj: true, name: { kk: 'гидрокарбонаты', ru: 'гидрокарбонат', en: 'hydrogen carbonate' } },
  { id: 'PO4^3-', charge: -3, part: 'PO4', poly: true, name: { kk: 'фосфаты', ru: 'фосфат', en: 'phosphate' }, acidName: { kk: 'фосфор қышқылы', ru: 'фосфорная кислота', en: 'phosphoric acid' } },
  { id: 'SiO3^2-', charge: -2, part: 'SiO3', poly: true, weakConj: true, name: { kk: 'силикаты', ru: 'силикат', en: 'silicate' }, acidName: { kk: 'кремний қышқылы', ru: 'кремниевая кислота', en: 'silicic acid' } },
  { id: 'CH3COO^-', charge: -1, part: 'CH3COO', poly: true, prefix: true, weakConj: true, name: { kk: 'ацетаты', ru: 'ацетат', en: 'acetate' }, acidName: { kk: 'сірке қышқылы', ru: 'уксусная кислота', en: 'acetic acid' } },
  { id: 'SCN^-', charge: -1, part: 'SCN', poly: true, name: { kk: 'роданиді', ru: 'роданид', en: 'thiocyanate' } },
  { id: 'MnO4^-', charge: -1, part: 'MnO4', poly: true, color: '#8A1C83', refC: 0.004, name: { kk: 'перманганаты', ru: 'перманганат', en: 'permanganate' } },
  { id: '[Zn(OH)4]^2-', charge: -2, part: '[Zn(OH)4]', name: { kk: 'тетрагидроксоцинкаты', ru: 'тетрагидроксоцинкат', en: 'tetrahydroxozincate' } },
  { id: '[Al(OH)4]^-', charge: -1, part: '[Al(OH)4]', name: { kk: 'тетрагидроксоалюминаты', ru: 'тетрагидроксоалюминат', en: 'tetrahydroxoaluminate' } }
];

export const IONS: Record<string, IonDef> = Object.fromEntries(ION_LIST.map((i) => [i.id, i]));
export const isIon = (id: string) => id in IONS;
export const CATIONS = ION_LIST.filter((i) => i.charge > 0).map((i) => i.id);
export const ANIONS = ION_LIST.filter((i) => i.charge < 0).map((i) => i.id);

// ---------------------------------------------------------------- compounds

export type Phase = 'aq' | 's' | 'l' | 'g';

export interface CompoundDef {
  id: string;            // formula used by the engine and the balancer
  name: L3;
  phase: Phase;
  color?: ColorKey;
  cation?: string;
  anion?: string;
  nCat?: number;
  nAn?: number;
  electrolyte: 'strong' | 'weak' | 'none';
}

const C = (id: string, kk: string, ru: string, en: string, phase: Phase, extra: Partial<CompoundDef> = {}): CompoundDef =>
  ({ id, name: { kk, ru, en }, phase, electrolyte: 'none', ...extra });

const COMPOUND_LIST: CompoundDef[] = [
  C('H2O', 'су', 'вода', 'water', 'l'),
  C('CO2', 'көмірқышқыл газы', 'углекислый газ', 'carbon dioxide', 'g'),
  C('H2', 'сутек', 'водород', 'hydrogen', 'g'),
  C('O2', 'оттек', 'кислород', 'oxygen', 'g'),
  C('NO', 'азот(II) оксиді', 'оксид азота(II)', 'nitrogen(II) oxide', 'g'),
  C('NO2', 'азот(IV) оксиді', 'оксид азота(IV)', 'nitrogen dioxide', 'g'),
  C('SO2', 'күкірт(IV) оксиді', 'оксид серы(IV)', 'sulfur dioxide', 'g'),
  C('NH3', 'аммиак', 'аммиак', 'ammonia', 'g'),
  C('NH3·H2O', 'аммиак ерітіндісі', 'гидрат аммиака', 'aqueous ammonia', 'aq', { electrolyte: 'weak' }),
  C('CH3COOH', 'сірке қышқылы', 'уксусная кислота', 'acetic acid', 'aq', { electrolyte: 'weak', cation: 'H^+', anion: 'CH3COO^-', nCat: 1, nAn: 1 }),
  C('H3PO4', 'фосфор қышқылы', 'фосфорная кислота', 'phosphoric acid', 'aq', { electrolyte: 'weak', cation: 'H^+', anion: 'PO4^3-', nCat: 3, nAn: 1 }),
  C('H2SiO3', 'кремний қышқылы', 'кремниевая кислота', 'silicic acid', 's', { color: 'clearGel' }),
  C('H2SO4', 'күкірт қышқылы', 'серная кислота', 'sulfuric acid', 'aq', { electrolyte: 'strong', cation: 'H^+', anion: 'SO4^2-', nCat: 2, nAn: 1 }),
  C('H2O2', 'сутек пероксиді', 'пероксид водорода', 'hydrogen peroxide', 'aq'),
  C('C12H22O11', 'қант (сахароза)', 'сахар (сахароза)', 'sugar (sucrose)', 's', { color: 'white' }),
  C('C', 'көмір', 'уголь', 'carbon', 's', { color: 'black' }),
  C('CuO', 'мыс(II) оксиді', 'оксид меди(II)', 'copper(II) oxide', 's', { color: 'black' }),
  C('CaO', 'кальций оксиді', 'оксид кальция', 'calcium oxide', 's', { color: 'white' }),
  C('MgO', 'магний оксиді', 'оксид магния', 'magnesium oxide', 's', { color: 'white' }),
  C('ZnO', 'мырыш оксиді', 'оксид цинка', 'zinc oxide', 's', { color: 'white' }),
  C('MnO2', 'марганец(IV) оксиді', 'оксид марганца(IV)', 'manganese(IV) oxide', 's', { color: 'black' }),
  C('Fe2O3', 'темір(III) оксиді', 'оксид железа(III)', 'iron(III) oxide', 's', { color: 'redBrown' }),
  C('Ag2O', 'күміс оксиді', 'оксид серебра', 'silver oxide', 's', { color: 'darkBrown' }),
  C('(CuOH)2CO3', 'мыс(II) гидроксокарбонаты', 'гидроксокарбонат меди(II)', 'basic copper(II) carbonate', 's', { color: 'blueGreen' }),
  C('Fe(SCN)3', 'темір(III) роданиді', 'роданид железа(III)', 'iron(III) thiocyanate', 'aq', { electrolyte: 'weak' }),
  C('Na', 'натрий', 'натрий', 'sodium', 's'),
  C('Ca', 'кальций', 'кальций', 'calcium', 's'),
  C('Mg', 'магний', 'магний', 'magnesium', 's'),
  C('Al', 'алюминий', 'алюминий', 'aluminium', 's'),
  C('Zn', 'мырыш', 'цинк', 'zinc', 's'),
  C('Fe', 'темір', 'железо', 'iron', 's'),
  C('Cu', 'мыс', 'медь', 'copper', 's', { color: 'copper' }),
  C('Ag', 'күміс', 'серебро', 'silver', 's', { color: 'silver' })
];

const COMPOUNDS = new Map<string, CompoundDef>(COMPOUND_LIST.map((c) => [c.id, c]));

// ---------------------------------------------------------------- solubility

export type Sol = 'R' | 'M' | 'N' | 'D';

interface SolEntry { s: Sol; S?: number; color?: ColorKey; }

const CAT_ORDER = ['H^+', 'Li^+', 'Na^+', 'K^+', 'NH4^+', 'Ag^+', 'Ba^2+', 'Ca^2+', 'Mg^2+', 'Zn^2+', 'Cu^2+', 'Fe^2+', 'Fe^3+', 'Al^3+'];
export const TABLE_CATIONS = CAT_ORDER;
export const TABLE_ANIONS = ['OH^-', 'Cl^-', 'I^-', 'NO3^-', 'SO4^2-', 'CO3^2-', 'PO4^3-', 'SiO3^2-', 'CH3COO^-'];

const R: SolEntry = { s: 'R' };
const N = (color: ColorKey = 'white'): SolEntry => ({ s: 'N', S: 1e-5, color });
const M = (S: number, color: ColorKey = 'white'): SolEntry => ({ s: 'M', S, color });
const D: SolEntry = { s: 'D' };

// Columns follow CAT_ORDER.
const SOL_ROWS: Record<string, SolEntry[]> = {
  'OH^-':     [R, R, R, R, D, D, R, M(0.021), N(), N(), N('lightBlue'), N('greyGreen'), N('brown'), N('gel')],
  'Cl^-':     [R, R, R, R, R, N('curdy'), R, R, R, R, R, R, R, R],
  'I^-':      [R, R, R, R, R, N('yellow'), R, R, R, R, D, R, D, R],
  'NO3^-':    [R, R, R, R, R, R, R, R, R, R, R, R, R, R],
  'SO4^2-':   [R, R, R, R, R, M(0.027), N(), M(0.015), R, R, R, R, R, R],
  'CO3^2-':   [D, R, R, R, R, N('paleYellow'), N(), N(), N(), N(), D, N(), D, D],
  'PO4^3-':   [R, N(), R, R, R, N('yellow'), N(), N(), N(), N(), N('lightBlue'), N(), N('paleYellow'), N()],
  'SiO3^2-':  [D, R, R, R, D, N('paleYellow'), N(), N(), N(), N(), N('lightBlue'), N(), N('brown'), N()],
  'CH3COO^-': [R, R, R, R, R, M(0.06), R, R, R, R, R, R, R, R]
};

export function solubility(cation: string, anion: string): SolEntry {
  const row = SOL_ROWS[anion];
  const col = CAT_ORDER.indexOf(cation);
  if (!row || col === -1) return R;
  return row[col];
}

// ---------------------------------------------------------------- building compounds from ions

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : Math.abs(a); }

export function saltFormula(cation: string, anion: string): { formula: string; nCat: number; nAn: number } {
  const c = IONS[cation];
  const a = IONS[anion];
  const qc = c.charge;
  const qa = -a.charge;
  const l = (qc * qa) / gcd(qc, qa);
  const nCat = l / qc;
  const nAn = l / qa;
  if (cation === 'H^+' && anion === 'OH^-') return { formula: 'H2O', nCat: 1, nAn: 1 };
  if (cation === 'NH4^+' && anion === 'OH^-') return { formula: 'NH3·H2O', nCat: 1, nAn: 1 };
  const part = (ion: IonDef, n: number) => (n === 1 ? ion.part : ion.poly ? `(${ion.part})${n}` : `${ion.part}${n}`);
  const formula = a.prefix ? part(a, nAn) + part(c, nCat) : part(c, nCat) + part(a, nAn);
  return { formula, nCat, nAn };
}

export function saltName(cation: string, anion: string): L3 {
  const c = IONS[cation];
  const a = IONS[anion];
  if (cation === 'H^+' && a.acidName) return a.acidName;
  return { kk: `${c.name.kk} ${a.name.kk}`, ru: `${a.name.ru} ${c.name.ru}`, en: `${c.name.en} ${a.name.en}` };
}

const STRONG_ACIDS = new Set(['HCl', 'HNO3', 'H2SO4', 'HI']);

export function salt(cation: string, anion: string): CompoundDef {
  const { formula, nCat, nAn } = saltFormula(cation, anion);
  const known = COMPOUNDS.get(formula);
  if (known) return known;
  const sol = solubility(cation, anion);
  let electrolyte: CompoundDef['electrolyte'] = sol.s === 'R' || sol.s === 'M' ? 'strong' : 'none';
  if (cation === 'H^+') electrolyte = STRONG_ACIDS.has(formula) ? 'strong' : 'weak';
  const def: CompoundDef = {
    id: formula,
    name: saltName(cation, anion),
    phase: sol.s === 'N' ? 's' : 'aq',
    color: sol.color,
    cation,
    anion,
    nCat,
    nAn,
    electrolyte
  };
  COMPOUNDS.set(formula, def);
  return def;
}

// Pre-register salts for every cation/anion pair so that compound lookups by formula work.
for (const c of CATIONS) for (const a of ANIONS) {
  if (c.startsWith('[') && a.startsWith('[')) continue;
  try { salt(c, a); } catch { /* pair not meaningful */ }
}

export function compound(id: string): CompoundDef {
  const def = COMPOUNDS.get(id);
  if (!def) throw new Error(`Unknown compound ${id}`);
  return def;
}
export const hasCompound = (id: string) => COMPOUNDS.has(id);

// ---------------------------------------------------------------- metals

export const ACTIVITY = ['Li', 'K', 'Ba', 'Ca', 'Na', 'Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Sn', 'Pb', 'H2', 'Cu', 'Hg', 'Ag', 'Pt', 'Au'];
export const activity = (m: string) => ACTIVITY.indexOf(m);

export interface MetalDef {
  id: string;
  ion: string;           // ion formed with acids and salts
  nitricIon: string;     // ion formed with nitric acid
  alkali: boolean;       // reacts with water at room temperature
  heatWater: number;     // J per mmol released with water or acid
  look: 'piece' | 'granules' | 'ribbon' | 'filings' | 'wire' | 'crystals';
  color: string;
  forms: { ru: { nom: string; gen: string }; kk: { nom: string; abl: string }; en: string };
}

export const METALS: Record<string, MetalDef> = {
  Na: { id: 'Na', ion: 'Na^+', nitricIon: 'Na^+', alkali: true, heatWater: 184, look: 'piece', color: '#C9CDD2', forms: { ru: { nom: 'натрий', gen: 'натрия' }, kk: { nom: 'натрий', abl: 'натрийден' }, en: 'sodium' } },
  Ca: { id: 'Ca', ion: 'Ca^2+', nitricIon: 'Ca^2+', alkali: true, heatWater: 414, look: 'piece', color: '#D8DADC', forms: { ru: { nom: 'кальций', gen: 'кальция' }, kk: { nom: 'кальций', abl: 'кальцийден' }, en: 'calcium' } },
  Mg: { id: 'Mg', ion: 'Mg^2+', nitricIon: 'Mg^2+', alkali: false, heatWater: 467, look: 'ribbon', color: '#C4CBD2', forms: { ru: { nom: 'магний', gen: 'магния' }, kk: { nom: 'магний', abl: 'магнийден' }, en: 'magnesium' } },
  Al: { id: 'Al', ion: 'Al^3+', nitricIon: 'Al^3+', alkali: false, heatWater: 530, look: 'granules', color: '#D3D8DD', forms: { ru: { nom: 'алюминий', gen: 'алюминия' }, kk: { nom: 'алюминий', abl: 'алюминийден' }, en: 'aluminium' } },
  Zn: { id: 'Zn', ion: 'Zn^2+', nitricIon: 'Zn^2+', alkali: false, heatWater: 153, look: 'granules', color: '#A9B3BD', forms: { ru: { nom: 'цинк', gen: 'цинка' }, kk: { nom: 'мырыш', abl: 'мырыштан' }, en: 'zinc' } },
  Fe: { id: 'Fe', ion: 'Fe^2+', nitricIon: 'Fe^3+', alkali: false, heatWater: 89, look: 'filings', color: '#6E747A', forms: { ru: { nom: 'железо', gen: 'железа' }, kk: { nom: 'темір', abl: 'темірден' }, en: 'iron' } },
  Cu: { id: 'Cu', ion: 'Cu^2+', nitricIon: 'Cu^2+', alkali: false, heatWater: 0, look: 'wire', color: '#C9692C', forms: { ru: { nom: 'медь', gen: 'меди' }, kk: { nom: 'мыс', abl: 'мыстан' }, en: 'copper' } },
  Ag: { id: 'Ag', ion: 'Ag^+', nitricIon: 'Ag^+', alkali: false, heatWater: 0, look: 'crystals', color: '#B5BBC1', forms: { ru: { nom: 'серебро', gen: 'серебра' }, kk: { nom: 'күміс', abl: 'күмістен' }, en: 'silver' } }
};
export const isMetal = (id: string) => id in METALS;

// Names of cations as metals, for "less active than ..." explanations.
export const ION_METAL_FORMS: Record<string, MetalDef['forms']> = {
  'Li^+': { ru: { nom: 'литий', gen: 'лития' }, kk: { nom: 'литий', abl: 'литийден' }, en: 'lithium' },
  'K^+': { ru: { nom: 'калий', gen: 'калия' }, kk: { nom: 'калий', abl: 'калийден' }, en: 'potassium' },
  'Ba^2+': { ru: { nom: 'барий', gen: 'бария' }, kk: { nom: 'барий', abl: 'барийден' }, en: 'barium' },
  'Na^+': METALS.Na.forms,
  'Ca^2+': METALS.Ca.forms,
  'Mg^2+': METALS.Mg.forms,
  'Al^3+': METALS.Al.forms,
  'Zn^2+': METALS.Zn.forms,
  'Fe^2+': METALS.Fe.forms,
  'Fe^3+': METALS.Fe.forms,
  'Cu^2+': METALS.Cu.forms,
  'Ag^+': METALS.Ag.forms
};

// ---------------------------------------------------------------- indicators

export type IndicatorId = 'phph' | 'litmus' | 'mo' | 'univ';

// ---------------------------------------------------------------- reagents on the shelf

export type ReagentCat = 'acid' | 'base' | 'salt' | 'oxide' | 'metal' | 'ind' | 'other';

export interface Reagent {
  id: string;
  formula: string;
  name: L3;
  cat: ReagentCat;
  kind: 'liquid' | 'solid';
  note?: L3;                         // concentration or form, shown under the name
  tag?: 'conc' | 'dil';
  aq?: Record<string, number>;       // liquids: mmol per mL
  solid?: Record<string, number>;    // solids: mmol per portion
  parent?: string;                   // compound the ions come from
  concVolume?: boolean;              // undiluted concentrated acid
  indicator?: IndicatorId;
  bottle: string;                    // liquid color drawn on the bottle
  grade: number;
}

const L = (kk: string, ru: string, en: string): L3 => ({ kk, ru, en });
const M1 = L('1 М', '1 М', '1 M');
const M05 = L('0,5 М', '0,5 М', '0.5 M');
const CLEAR = '#E8F1F8';

export const REAGENTS: Reagent[] = [
  // acids
  { id: 'HCl', formula: 'HCl', cat: 'acid', kind: 'liquid', name: L('Тұз қышқылы', 'Соляная кислота', 'Hydrochloric acid'), note: M1, aq: { 'H^+': 1, 'Cl^-': 1 }, parent: 'HCl', bottle: CLEAR, grade: 8 },
  { id: 'H2SO4', formula: 'H2SO4', cat: 'acid', kind: 'liquid', tag: 'dil', name: L('Күкірт қышқылы', 'Серная кислота', 'Sulfuric acid'), note: M1, aq: { 'H^+': 2, 'SO4^2-': 1 }, parent: 'H2SO4', bottle: CLEAR, grade: 8 },
  { id: 'H2SO4c', formula: 'H2SO4', cat: 'acid', kind: 'liquid', tag: 'conc', name: L('Күкірт қышқылы', 'Серная кислота', 'Sulfuric acid'), note: L('98 %', '98 %', '98 %'), aq: { 'H2SO4c': 18.4 }, parent: 'H2SO4', concVolume: true, bottle: '#F3EFE2', grade: 9 },
  { id: 'HNO3', formula: 'HNO3', cat: 'acid', kind: 'liquid', tag: 'dil', name: L('Азот қышқылы', 'Азотная кислота', 'Nitric acid'), note: L('2 М', '2 М', '2 M'), aq: { 'H^+': 2, 'NO3^-': 2 }, parent: 'HNO3', bottle: CLEAR, grade: 9 },
  { id: 'H3PO4', formula: 'H3PO4', cat: 'acid', kind: 'liquid', name: L('Фосфор қышқылы', 'Фосфорная кислота', 'Phosphoric acid'), note: M1, aq: { 'H^+': 3, 'PO4^3-': 1 }, parent: 'H3PO4', bottle: CLEAR, grade: 8 },
  { id: 'CH3COOH', formula: 'CH3COOH', cat: 'acid', kind: 'liquid', name: L('Сірке қышқылы', 'Уксусная кислота', 'Acetic acid'), note: M1, aq: { 'CH3COOH': 1 }, parent: 'CH3COOH', bottle: CLEAR, grade: 8 },
  // bases
  { id: 'NaOH', formula: 'NaOH', cat: 'base', kind: 'liquid', name: L('Натрий гидроксиді', 'Гидроксид натрия', 'Sodium hydroxide'), note: M1, aq: { 'Na^+': 1, 'OH^-': 1 }, parent: 'NaOH', bottle: CLEAR, grade: 8 },
  { id: 'KOH', formula: 'KOH', cat: 'base', kind: 'liquid', name: L('Калий гидроксиді', 'Гидроксид калия', 'Potassium hydroxide'), note: M1, aq: { 'K^+': 1, 'OH^-': 1 }, parent: 'KOH', bottle: CLEAR, grade: 8 },
  { id: 'CaOH2', formula: 'Ca(OH)2', cat: 'base', kind: 'liquid', name: L('Әк суы', 'Известковая вода', 'Limewater'), note: L('қаныққан', 'насыщенный', 'saturated'), aq: { 'Ca^2+': 0.02, 'OH^-': 0.04 }, parent: 'Ca(OH)2', bottle: '#F1F4F6', grade: 8 },
  { id: 'BaOH2', formula: 'Ba(OH)2', cat: 'base', kind: 'liquid', name: L('Барий гидроксиді', 'Гидроксид бария', 'Barium hydroxide'), note: L('0,1 М', '0,1 М', '0.1 M'), aq: { 'Ba^2+': 0.1, 'OH^-': 0.2 }, parent: 'Ba(OH)2', bottle: CLEAR, grade: 9 },
  { id: 'NH3aq', formula: 'NH3·H2O', cat: 'base', kind: 'liquid', name: L('Аммиак ерітіндісі', 'Раствор аммиака', 'Ammonia solution'), note: L('2 М', '2 М', '2 M'), aq: { 'NH3': 2 }, parent: 'NH3·H2O', bottle: CLEAR, grade: 9 },
  // salts
  { id: 'NaCl', formula: 'NaCl', cat: 'salt', kind: 'liquid', name: L('Натрий хлориді', 'Хлорид натрия', 'Sodium chloride'), note: M1, aq: { 'Na^+': 1, 'Cl^-': 1 }, parent: 'NaCl', bottle: CLEAR, grade: 7 },
  { id: 'KCl', formula: 'KCl', cat: 'salt', kind: 'liquid', name: L('Калий хлориді', 'Хлорид калия', 'Potassium chloride'), note: M1, aq: { 'K^+': 1, 'Cl^-': 1 }, parent: 'KCl', bottle: CLEAR, grade: 9 },
  { id: 'KI', formula: 'KI', cat: 'salt', kind: 'liquid', name: L('Калий иодиді', 'Иодид калия', 'Potassium iodide'), note: M05, aq: { 'K^+': 0.5, 'I^-': 0.5 }, parent: 'KI', bottle: CLEAR, grade: 9 },
  { id: 'CuSO4', formula: 'CuSO4', cat: 'salt', kind: 'liquid', name: L('Мыс(II) сульфаты', 'Сульфат меди(II)', 'Copper(II) sulfate'), note: M05, aq: { 'Cu^2+': 0.5, 'SO4^2-': 0.5 }, parent: 'CuSO4', bottle: '#4FA6E6', grade: 8 },
  { id: 'CuCl2', formula: 'CuCl2', cat: 'salt', kind: 'liquid', name: L('Мыс(II) хлориді', 'Хлорид меди(II)', 'Copper(II) chloride'), note: M05, aq: { 'Cu^2+': 0.5, 'Cl^-': 1 }, parent: 'CuCl2', bottle: '#4FB8C9', grade: 9 },
  { id: 'FeCl3', formula: 'FeCl3', cat: 'salt', kind: 'liquid', name: L('Темір(III) хлориді', 'Хлорид железа(III)', 'Iron(III) chloride'), note: M05, aq: { 'Fe^3+': 0.5, 'Cl^-': 1.5 }, parent: 'FeCl3', bottle: '#D99A1F', grade: 9 },
  { id: 'FeSO4', formula: 'FeSO4', cat: 'salt', kind: 'liquid', name: L('Темір(II) сульфаты', 'Сульфат железа(II)', 'Iron(II) sulfate'), note: M05, aq: { 'Fe^2+': 0.5, 'SO4^2-': 0.5 }, parent: 'FeSO4', bottle: '#B9DDA2', grade: 9 },
  { id: 'AgNO3', formula: 'AgNO3', cat: 'salt', kind: 'liquid', name: L('Күміс нитраты', 'Нитрат серебра', 'Silver nitrate'), note: L('0,1 М', '0,1 М', '0.1 M'), aq: { 'Ag^+': 0.1, 'NO3^-': 0.1 }, parent: 'AgNO3', bottle: CLEAR, grade: 9 },
  { id: 'BaCl2', formula: 'BaCl2', cat: 'salt', kind: 'liquid', name: L('Барий хлориді', 'Хлорид бария', 'Barium chloride'), note: M05, aq: { 'Ba^2+': 0.5, 'Cl^-': 1 }, parent: 'BaCl2', bottle: CLEAR, grade: 8 },
  { id: 'Na2CO3', formula: 'Na2CO3', cat: 'salt', kind: 'liquid', name: L('Натрий карбонаты', 'Карбонат натрия', 'Sodium carbonate'), note: M1, aq: { 'Na^+': 2, 'CO3^2-': 1 }, parent: 'Na2CO3', bottle: CLEAR, grade: 8 },
  { id: 'NaHCO3', formula: 'NaHCO3', cat: 'salt', kind: 'solid', name: L('Ас содасы', 'Пищевая сода', 'Baking soda'), note: L('ұнтақ', 'порошок', 'powder'), solid: { 'NaHCO3': 6 }, bottle: '#FFFFFF', grade: 8 },
  { id: 'CaCO3', formula: 'CaCO3', cat: 'salt', kind: 'solid', name: L('Мәрмәр (кальций карбонаты)', 'Мрамор (карбонат кальция)', 'Marble (calcium carbonate)'), note: L('кесектер', 'кусочки', 'chips'), solid: { 'CaCO3': 5 }, bottle: '#F2F0EA', grade: 8 },
  { id: 'Na2SO4', formula: 'Na2SO4', cat: 'salt', kind: 'liquid', name: L('Натрий сульфаты', 'Сульфат натрия', 'Sodium sulfate'), note: M1, aq: { 'Na^+': 2, 'SO4^2-': 1 }, parent: 'Na2SO4', bottle: CLEAR, grade: 8 },
  { id: 'Na3PO4', formula: 'Na3PO4', cat: 'salt', kind: 'liquid', name: L('Натрий фосфаты', 'Фосфат натрия', 'Sodium phosphate'), note: M05, aq: { 'Na^+': 1.5, 'PO4^3-': 0.5 }, parent: 'Na3PO4', bottle: CLEAR, grade: 9 },
  { id: 'NH4Cl', formula: 'NH4Cl', cat: 'salt', kind: 'liquid', name: L('Аммоний хлориді', 'Хлорид аммония', 'Ammonium chloride'), note: M1, aq: { 'NH4^+': 1, 'Cl^-': 1 }, parent: 'NH4Cl', bottle: CLEAR, grade: 9 },
  { id: 'KMnO4', formula: 'KMnO4', cat: 'salt', kind: 'liquid', name: L('Калий перманганаты', 'Перманганат калия', 'Potassium permanganate'), note: L('0,02 М', '0,02 М', '0.02 M'), aq: { 'K^+': 0.02, 'MnO4^-': 0.02 }, parent: 'KMnO4', bottle: '#8A1C83', grade: 8 },
  { id: 'AlCl3', formula: 'AlCl3', cat: 'salt', kind: 'liquid', name: L('Алюминий хлориді', 'Хлорид алюминия', 'Aluminium chloride'), note: M05, aq: { 'Al^3+': 0.5, 'Cl^-': 1.5 }, parent: 'AlCl3', bottle: CLEAR, grade: 9 },
  { id: 'ZnSO4', formula: 'ZnSO4', cat: 'salt', kind: 'liquid', name: L('Мырыш сульфаты', 'Сульфат цинка', 'Zinc sulfate'), note: M05, aq: { 'Zn^2+': 0.5, 'SO4^2-': 0.5 }, parent: 'ZnSO4', bottle: CLEAR, grade: 9 },
  { id: 'CaCl2', formula: 'CaCl2', cat: 'salt', kind: 'liquid', name: L('Кальций хлориді', 'Хлорид кальция', 'Calcium chloride'), note: M05, aq: { 'Ca^2+': 0.5, 'Cl^-': 1 }, parent: 'CaCl2', bottle: CLEAR, grade: 9 },
  { id: 'KSCN', formula: 'KSCN', cat: 'salt', kind: 'liquid', name: L('Калий роданиді', 'Роданид калия', 'Potassium thiocyanate'), note: M05, aq: { 'K^+': 0.5, 'SCN^-': 0.5 }, parent: 'KSCN', bottle: CLEAR, grade: 9 },
  { id: 'Na2SiO3', formula: 'Na2SiO3', cat: 'salt', kind: 'liquid', name: L('Натрий силикаты (сұйық шыны)', 'Силикат натрия (жидкое стекло)', 'Sodium silicate (water glass)'), note: M05, aq: { 'Na^+': 1, 'SiO3^2-': 0.5 }, parent: 'Na2SiO3', bottle: '#F0F2EC', grade: 9 },
  // oxides
  { id: 'CuO', formula: 'CuO', cat: 'oxide', kind: 'solid', name: L('Мыс(II) оксиді', 'Оксид меди(II)', 'Copper(II) oxide'), note: L('қара ұнтақ', 'чёрный порошок', 'black powder'), solid: { 'CuO': 2.5 }, bottle: '#2A2A2A', grade: 8 },
  { id: 'CaO', formula: 'CaO', cat: 'oxide', kind: 'solid', name: L('Кальций оксиді', 'Оксид кальция', 'Calcium oxide'), note: L('сөндірілмеген әк', 'негашёная известь', 'quicklime'), solid: { 'CaO': 5 }, bottle: '#F4F4F0', grade: 8 },
  { id: 'MgO', formula: 'MgO', cat: 'oxide', kind: 'solid', name: L('Магний оксиді', 'Оксид магния', 'Magnesium oxide'), note: L('ақ ұнтақ', 'белый порошок', 'white powder'), solid: { 'MgO': 5 }, bottle: '#F7F7F5', grade: 8 },
  { id: 'MnO2', formula: 'MnO2', cat: 'oxide', kind: 'solid', name: L('Марганец(IV) оксиді', 'Оксид марганца(IV)', 'Manganese(IV) oxide'), note: L('катализатор', 'катализатор', 'catalyst'), solid: { 'MnO2': 0.6 }, bottle: '#2B2522', grade: 8 },
  // metals
  { id: 'Na', formula: 'Na', cat: 'metal', kind: 'solid', name: L('Натрий', 'Натрий', 'Sodium'), note: L('керосин астында', 'под керосином', 'kept under kerosene'), solid: { 'Na': 2.2 }, bottle: '#C9CDD2', grade: 8 },
  { id: 'Ca', formula: 'Ca', cat: 'metal', kind: 'solid', name: L('Кальций', 'Кальций', 'Calcium'), note: L('жаңқалар', 'стружка', 'turnings'), solid: { 'Ca': 2.5 }, bottle: '#D8DADC', grade: 8 },
  { id: 'Mg', formula: 'Mg', cat: 'metal', kind: 'solid', name: L('Магний', 'Магний', 'Magnesium'), note: L('таспа', 'лента', 'ribbon'), solid: { 'Mg': 2 }, bottle: '#C4CBD2', grade: 8 },
  { id: 'Al', formula: 'Al', cat: 'metal', kind: 'solid', name: L('Алюминий', 'Алюминий', 'Aluminium'), note: L('түйіршіктер', 'гранулы', 'granules'), solid: { 'Al': 3.7 }, bottle: '#D3D8DD', grade: 8 },
  { id: 'Zn', formula: 'Zn', cat: 'metal', kind: 'solid', name: L('Мырыш', 'Цинк', 'Zinc'), note: L('түйіршіктер', 'гранулы', 'granules'), solid: { 'Zn': 4.6 }, bottle: '#A9B3BD', grade: 8 },
  { id: 'Fe', formula: 'Fe', cat: 'metal', kind: 'solid', name: L('Темір', 'Железо', 'Iron'), note: L('үгінділер', 'опилки', 'filings'), solid: { 'Fe': 3.6 }, bottle: '#6E747A', grade: 7 },
  { id: 'Cu', formula: 'Cu', cat: 'metal', kind: 'solid', name: L('Мыс', 'Медь', 'Copper'), note: L('сым', 'проволока', 'wire'), solid: { 'Cu': 4.7 }, bottle: '#C9692C', grade: 7 },
  // indicators
  { id: 'phph', formula: 'phph', cat: 'ind', kind: 'liquid', indicator: 'phph', name: L('Фенолфталеин', 'Фенолфталеин', 'Phenolphthalein'), note: L('сілтіде таңқурай түсті', 'малиновый в щёлочи', 'crimson in alkali'), bottle: '#F6F6F4', grade: 8 },
  { id: 'litmus', formula: 'litmus', cat: 'ind', kind: 'liquid', indicator: 'litmus', name: L('Лакмус', 'Лакмус', 'Litmus'), note: L('қышқылда қызыл', 'красный в кислоте', 'red in acid'), bottle: '#7B4FB8', grade: 8 },
  { id: 'mo', formula: 'mo', cat: 'ind', kind: 'liquid', indicator: 'mo', name: L('Метилоранж', 'Метилоранж', 'Methyl orange'), note: L('қышқылда қызғылт', 'розовый в кислоте', 'pink in acid'), bottle: '#F08A24', grade: 8 },
  { id: 'univ', formula: 'univ', cat: 'ind', kind: 'liquid', indicator: 'univ', name: L('Әмбебап индикатор', 'Универсальный индикатор', 'Universal indicator'), note: L('pH шкаласы', 'шкала pH', 'pH scale'), bottle: '#59A84B', grade: 8 },
  // other
  { id: 'H2O', formula: 'H2O', cat: 'other', kind: 'liquid', name: L('Дистилденген су', 'Дистиллированная вода', 'Distilled water'), aq: {}, bottle: '#EAF4FB', grade: 7 },
  { id: 'H2O2', formula: 'H2O2', cat: 'other', kind: 'liquid', name: L('Сутек пероксиді', 'Пероксид водорода', 'Hydrogen peroxide'), note: L('3 %', '3 %', '3 %'), aq: { 'H2O2': 0.88 }, parent: 'H2O2', bottle: CLEAR, grade: 8 },
  { id: 'sugar', formula: 'C12H22O11', cat: 'other', kind: 'solid', name: L('Қант', 'Сахар', 'Sugar'), note: L('сахароза', 'сахароза', 'sucrose'), solid: { 'C12H22O11': 2.9 }, bottle: '#FFFFFF', grade: 7 }
];

export const REAGENT_BY_ID: Record<string, Reagent> = Object.fromEntries(REAGENTS.map((r) => [r.id, r]));

// Solids that dissolve in water as ions: formula -> [ions per unit, solubility mol/L].
export const SOLUBLE_SOLIDS: Record<string, { ions: Record<string, number>; S: number }> = {
  NaHCO3: { ions: { 'Na^+': 1, 'HCO3^-': 1 }, S: 1.1 }
};

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
  greyMetal: { hex: '#9AA3AB', name: { kk: 'сұр', ru: 'серый', en: 'grey' } },
  green: { hex: '#78B85E', name: { kk: 'жасыл', ru: 'зелёный', en: 'green' } },
  darkGreen: { hex: '#3F6B3A', name: { kk: 'қою жасыл', ru: 'тёмно-зелёный', en: 'dark green' } },
  pink: { hex: '#E8A3B6', name: { kk: 'қызғылт', ru: 'розовый', en: 'pink' } },
  goldYellow: { hex: '#F5C21B', name: { kk: 'алтын түстес сары', ru: 'золотисто-жёлтый', en: 'golden yellow' } },
  brickRed: { hex: '#B5442A', name: { kk: 'кірпіш-қызыл', ru: 'кирпично-красный', en: 'brick red' } },
  red: { hex: '#D2342A', name: { kk: 'қызыл', ru: 'красный', en: 'red' } },
  orange: { hex: '#F07A12', name: { kk: 'қызғылт сары', ru: 'оранжевый', en: 'orange' } },
  violetBlack: { hex: '#3C1840', name: { kk: 'қара-күлгін', ru: 'тёмно-фиолетовый', en: 'dark violet' } },
  blue: { hex: '#2F5FC8', name: { kk: 'көк', ru: 'синий', en: 'blue' } },
  sand: { hex: '#D9C49A', name: { kk: 'құм түсті', ru: 'песочный', en: 'sandy' } },
  ice: { hex: '#E4F3FB', name: { kk: 'мөлдір', ru: 'прозрачный', en: 'clear' } },
  greyViolet: { hex: '#4B4157', name: { kk: 'сұр-күлгін', ru: 'серо-фиолетовый', en: 'grey-violet' } }
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
  { id: 'Pb^2+', charge: 2, part: 'Pb', metal: 'Pb', hydrolysisPKa: 7.7, name: { kk: 'қорғасын(II)', ru: 'свинца(II)', en: 'lead(II)' } },
  { id: 'Ni^2+', charge: 2, part: 'Ni', metal: 'Ni', hydrolysisPKa: 9.9, color: '#5FBF72', refC: 0.4, name: { kk: 'никель(II)', ru: 'никеля(II)', en: 'nickel(II)' } },
  { id: 'Co^2+', charge: 2, part: 'Co', metal: 'Co', hydrolysisPKa: 9.7, color: '#E07A9C', refC: 0.4, name: { kk: 'кобальт(II)', ru: 'кобальта(II)', en: 'cobalt(II)' } },
  { id: 'Mn^2+', charge: 2, part: 'Mn', metal: 'Mn', hydrolysisPKa: 10.6, color: '#F0C8D4', refC: 1.5, name: { kk: 'марганец(II)', ru: 'марганца(II)', en: 'manganese(II)' } },
  { id: 'Cr^3+', charge: 3, part: 'Cr', metal: 'Cr', hydrolysisPKa: 4.0, color: '#4E8A62', refC: 0.25, name: { kk: 'хром(III)', ru: 'хрома(III)', en: 'chromium(III)' } },
  { id: 'Sn^2+', charge: 2, part: 'Sn', metal: 'Sn', hydrolysisPKa: 3.4, name: { kk: 'қалайы(II)', ru: 'олова(II)', en: 'tin(II)' } },
  { id: 'Hg^2+', charge: 2, part: 'Hg', metal: 'Hg', hydrolysisPKa: 3.4, name: { kk: 'сынап(II)', ru: 'ртути(II)', en: 'mercury(II)' } },
  { id: '[Ni(NH3)6]^2+', charge: 2, part: '[Ni(NH3)6]', color: '#6A73D8', refC: 0.08, name: { kk: 'гексаамминникель(II)', ru: 'гексаамминникеля(II)', en: 'hexaamminenickel(II)' } },
  { id: '[Cu(NH3)4]^2+', charge: 2, part: '[Cu(NH3)4]', color: '#2338C8', refC: 0.05, name: { kk: 'тетраамминмыс(II)', ru: 'тетраамминмеди(II)', en: 'tetraamminecopper(II)' } },
  { id: '[Zn(NH3)4]^2+', charge: 2, part: '[Zn(NH3)4]', name: { kk: 'тетраамминмырыш', ru: 'тетраамминцинка', en: 'tetraamminezinc' } },
  { id: '[Ag(NH3)2]^+', charge: 1, part: '[Ag(NH3)2]', name: { kk: 'диамминкүміс', ru: 'диамминсеребра', en: 'diamminesilver' } },
  // anions
  { id: 'OH^-', charge: -1, part: 'OH', poly: true, name: { kk: 'гидроксиді', ru: 'гидроксид', en: 'hydroxide' } },
  { id: 'Cl^-', charge: -1, part: 'Cl', name: { kk: 'хлориді', ru: 'хлорид', en: 'chloride' }, acidName: { kk: 'тұз қышқылы', ru: 'соляная кислота', en: 'hydrochloric acid' } },
  { id: 'I^-', charge: -1, part: 'I', name: { kk: 'йодиді', ru: 'иодид', en: 'iodide' }, acidName: { kk: 'йодсутек қышқылы', ru: 'иодоводородная кислота', en: 'hydroiodic acid' } },
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
  { id: '[Al(OH)4]^-', charge: -1, part: '[Al(OH)4]', name: { kk: 'тетрагидроксоалюминаты', ru: 'тетрагидроксоалюминат', en: 'tetrahydroxoaluminate' } },
  { id: 'F^-', charge: -1, part: 'F', name: { kk: 'фториді', ru: 'фторид', en: 'fluoride' }, acidName: { kk: 'фторсутек қышқылы', ru: 'плавиковая кислота', en: 'hydrofluoric acid' } },
  { id: 'Br^-', charge: -1, part: 'Br', name: { kk: 'бромиді', ru: 'бромид', en: 'bromide' }, acidName: { kk: 'бромсутек қышқылы', ru: 'бромоводородная кислота', en: 'hydrobromic acid' } },
  { id: 'S^2-', charge: -2, part: 'S', weakConj: true, name: { kk: 'сульфиді', ru: 'сульфид', en: 'sulfide' }, acidName: { kk: 'күкіртсутек қышқылы', ru: 'сероводородная кислота', en: 'hydrosulfuric acid' } },
  { id: 'SO3^2-', charge: -2, part: 'SO3', poly: true, weakConj: true, name: { kk: 'сульфиті', ru: 'сульфит', en: 'sulfite' }, acidName: { kk: 'күкіртті қышқыл', ru: 'сернистая кислота', en: 'sulfurous acid' } },
  { id: 'CrO4^2-', charge: -2, part: 'CrO4', poly: true, color: '#F2C200', refC: 0.03, name: { kk: 'хроматы', ru: 'хромат', en: 'chromate' }, acidName: { kk: 'хром қышқылы', ru: 'хромовая кислота', en: 'chromic acid' } },
  { id: 'MnO4^2-', charge: -2, part: 'MnO4', poly: true, color: '#2E8B57', refC: 0.004, name: { kk: 'манганаты', ru: 'манганат', en: 'manganate' } },
  { id: 'HSO4^-', charge: -1, part: 'HSO4', poly: true, name: { kk: 'гидросульфаты', ru: 'гидросульфат', en: 'hydrogen sulfate' } },
  { id: 'Cr2O7^2-', charge: -2, part: 'Cr2O7', poly: true, color: '#E8700C', refC: 0.025, name: { kk: 'дихроматы', ru: 'дихромат', en: 'dichromate' } },
  { id: 'S2O3^2-', charge: -2, part: 'S2O3', poly: true, name: { kk: 'тиосульфаты', ru: 'тиосульфат', en: 'thiosulfate' } },
  { id: 'S4O6^2-', charge: -2, part: 'S4O6', poly: true, name: { kk: 'тетратионаты', ru: 'тетратионат', en: 'tetrathionate' } },
  { id: '[Pb(OH)4]^2-', charge: -2, part: '[Pb(OH)4]', name: { kk: 'тетрагидроксоплюмбаты(II)', ru: 'тетрагидроксоплюмбат(II)', en: 'tetrahydroxoplumbate(II)' } },
  { id: '[Sn(OH)4]^2-', charge: -2, part: '[Sn(OH)4]', name: { kk: 'тетрагидроксостаннаты(II)', ru: 'тетрагидроксостаннат(II)', en: 'tetrahydroxostannate(II)' } },
  { id: 'ClO^-', charge: -1, part: 'ClO', poly: true, name: { kk: 'гипохлориті', ru: 'гипохлорит', en: 'hypochlorite' } },
  { id: 'BrO^-', charge: -1, part: 'BrO', poly: true, name: { kk: 'гипобромиті', ru: 'гипобромит', en: 'hypobromite' } },
  { id: 'IO3^-', charge: -1, part: 'IO3', poly: true, name: { kk: 'йодаты', ru: 'иодат', en: 'iodate' } },
  { id: '[Cr(OH)6]^3-', charge: -3, part: '[Cr(OH)6]', color: '#3F8F4E', refC: 0.12, name: { kk: 'гексагидроксохроматы(III)', ru: 'гексагидроксохромат(III)', en: 'hexahydroxochromate(III)' } }
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
  C('Cl2', 'хлор', 'хлор', 'chlorine', 'g'),
  C('I2', 'йод', 'иод', 'iodine', 'aq', { color: 'greyViolet' }),
  C('NH3·H2O', 'аммиак ерітіндісі', 'гидрат аммиака', 'aqueous ammonia', 'aq', { electrolyte: 'weak' }),
  C('CH3COOH', 'сірке қышқылы', 'уксусная кислота', 'acetic acid', 'aq', { electrolyte: 'weak', cation: 'H^+', anion: 'CH3COO^-', nCat: 1, nAn: 1 }),
  C('H3PO4', 'фосфор қышқылы', 'фосфорная кислота', 'phosphoric acid', 'aq', { electrolyte: 'weak', cation: 'H^+', anion: 'PO4^3-', nCat: 3, nAn: 1 }),
  C('H2SiO3', 'кремний қышқылы', 'кремниевая кислота', 'silicic acid', 's', { color: 'clearGel' }),
  C('H2SO4', 'күкірт қышқылы', 'серная кислота', 'sulfuric acid', 'aq', { electrolyte: 'strong', cation: 'H^+', anion: 'SO4^2-', nCat: 2, nAn: 1 }),
  C('H2O2', 'сутек пероксиді', 'пероксид водорода', 'hydrogen peroxide', 'aq'),
  C('H2SnO3', 'метақалайы қышқылы', 'метаоловянная кислота', 'metastannic acid', 's', { color: 'white' }),
  C('HClO', 'хлорлылау қышқыл', 'хлорноватистая кислота', 'hypochlorous acid', 'aq', { electrolyte: 'weak' }),
  C('N2O', 'азот(I) оксиді', 'оксид азота(I)', 'nitrogen(I) oxide', 'g'),
  C('C12H22O11', 'қант (сахароза)', 'сахар (сахароза)', 'sugar (sucrose)', 's', { color: 'white' }),
  C('C', 'көмір', 'уголь', 'carbon', 's', { color: 'black' }),
  C('CuO', 'мыс(II) оксиді', 'оксид меди(II)', 'copper(II) oxide', 's', { color: 'black' }),
  C('CaO', 'кальций оксиді', 'оксид кальция', 'calcium oxide', 's', { color: 'white' }),
  C('MgO', 'магний оксиді', 'оксид магния', 'magnesium oxide', 's', { color: 'white' }),
  C('ZnO', 'мырыш оксиді', 'оксид цинка', 'zinc oxide', 's', { color: 'white' }),
  C('MnO2', 'марганец(IV) оксиді', 'оксид марганца(IV)', 'manganese(IV) oxide', 's', { color: 'darkBrown' }),
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
  C('Ag', 'күміс', 'серебро', 'silver', 's', { color: 'silver' }),
  C('K', 'калий', 'калий', 'potassium', 's'),
  C('Li', 'литий', 'литий', 'lithium', 's'),
  C('Ba', 'барий', 'барий', 'barium', 's'),
  C('Sn', 'қалайы', 'олово', 'tin', 's'),
  C('Pb', 'қорғасын', 'свинец', 'lead', 's'),
  C('Ni', 'никель', 'никель', 'nickel', 's'),
  C('Mn', 'марганец', 'марганец', 'manganese', 's'),
  C('Au', 'алтын', 'золото', 'gold', 's'),
  C('Pt', 'платина', 'платина', 'platinum', 's'),
  C('Co', 'кобальт', 'кобальт', 'cobalt', 's', { color: 'greyMetal' }),
  C('Cr', 'хром', 'хром', 'chromium', 's', { color: 'silver' }),
  // simple substances of nonmetals and their companions
  C('S', 'күкірт', 'сера', 'sulfur', 's', { color: 'yellow' }),
  C('Si', 'кремний', 'кремний', 'silicon', 's', { color: 'greyMetal' }),
  C('Br2', 'бром', 'бром', 'bromine', 'aq'),
  C('H2S', 'күкіртсутек', 'сероводород', 'hydrogen sulfide', 'g'),
  C('N2', 'азот', 'азот', 'nitrogen', 'g'),
  C('SiO2', 'құм (кремний(IV) оксиді)', 'песок (оксид кремния(IV))', 'sand (silicon dioxide)', 's', { color: 'sand' }),
  C('H2O(s)', 'мұз', 'лёд', 'ice', 's', { color: 'ice' }),
  C('starch', 'крахмал', 'крахмал', 'starch', 'aq'),
  C('Cr2O3', 'хром(III) оксиді', 'оксид хрома(III)', 'chromium(III) oxide', 's', { color: 'darkGreen' }),
  C('KNO2', 'калий нитриті', 'нитрит калия', 'potassium nitrite', 's', { color: 'white' }),
  C('CuI', 'мыс(I) йодиді', 'иодид меди(I)', 'copper(I) iodide', 's', { color: 'white' }),
  C('Cu2S', 'мыс(I) сульфиді', 'сульфид меди(I)', 'copper(I) sulfide', 's', { color: 'black' }),
  C('CuSO4·5H2O', 'мыс купоросы', 'медный купорос', 'blue vitriol (copper sulfate crystals)', 's', { color: 'lightBlue' }),
  C('CoCl2·6H2O', 'кобальт(II) хлоридінің кристалгидраты', 'кристаллогидрат хлорида кобальта(II)', 'cobalt(II) chloride hexahydrate', 's', { color: 'pink' }),
  C('MnO(OH)2', 'марганец(IV) оксогидроксиді', 'оксогидроксид марганца(IV)', 'manganese(IV) oxyhydroxide', 's', { color: 'brown' })
];

const COMPOUNDS = new Map<string, CompoundDef>(COMPOUND_LIST.map((c) => [c.id, c]));

// ---------------------------------------------------------------- solubility

export type Sol = 'R' | 'M' | 'N' | 'D';

interface SolEntry { s: Sol; S?: number; color?: ColorKey; }

// Cation and anion order of the school solubility table.
const CAT_ORDER = ['H^+', 'Li^+', 'K^+', 'Na^+', 'NH4^+', 'Ba^2+', 'Ca^2+', 'Mg^2+', 'Al^3+', 'Cr^3+', 'Fe^2+', 'Fe^3+', 'Ni^2+', 'Co^2+', 'Mn^2+', 'Zn^2+', 'Ag^+', 'Hg^2+', 'Pb^2+', 'Sn^2+', 'Cu^2+'];
export const TABLE_CATIONS = CAT_ORDER;
export const TABLE_ANIONS = ['OH^-', 'F^-', 'Cl^-', 'Br^-', 'I^-', 'S^2-', 'SO3^2-', 'SO4^2-', 'NO3^-', 'PO4^3-', 'CO3^2-', 'SiO3^2-', 'CrO4^2-', 'CH3COO^-'];

const R: SolEntry = { s: 'R' };
const N = (color: ColorKey = 'white'): SolEntry => ({ s: 'N', S: 1e-5, color });
const M = (S: number, color: ColorKey = 'white'): SolEntry => ({ s: 'M', S, color });
const D: SolEntry = { s: 'D' };

// One row per anion, one cell per cation in CAT_ORDER.
// R soluble, D decomposes in water or does not exist, N insoluble (white unless a color follows),
// M:S slightly soluble with solubility S in mol/L, optionally followed by a color.
const SOL_ROWS_RAW: Record<string, string> = {
  //            H    Li       K  Na NH4 Ba        Ca         Mg  Al       Cr          Fe2         Fe3          Ni          Co          Mn          Zn         Ag             Hg       Pb                  Sn          Cu
  'OH^-':     'R    R        R  R  R   R         M:0.021    N   N:gel    N:greyGreen N:greyGreen N:brown      N:green     N:pink      N           N          D              D        N                   N           N:lightBlue',
  'F^-':      'R    M:0.05   R  R  R   M:0.007   N          N   M:0.06   M:0.05:green M:0.05     M:0.05       R           R           R           R          R              D        M:0.003             R           R',
  'Cl^-':     'R    R        R  R  R   R         R          R   R        R           R           R            R           R           R           R          N:curdy        R        M:0.036             R           R',
  'Br^-':     'R    R        R  R  R   R         R          R   R        R           R           R            R           R           R           R          N:paleYellow   M:0.017  M:0.026             R           R',
  'I^-':      'R    R        R  R  R   R         R          R   R        R           R           D            R           R           R           R          N:yellow       N:red    M:0.0016:goldYellow M:0.03:orange D',
  'S^2-':     'M:0.1 R       R  R  R   R         D          D   D        D           N:black     D            N:black     N:black     N:pink      N          N:black        N:black  N:black             N:brown     N:black',
  'SO3^2-':   'R    R        R  R  R   N         N          M:0.05 D     D           N           D            N:green     N:pink      N           M:0.01     N              D        N                   D           D',
  'SO4^2-':   'R    R        R  R  R   N         M:0.015    R   R        R           R           R            R           R           R           R          M:0.027        R        N                   R           R',
  'NO3^-':    'R    R        R  R  R   R         R          R   R        R           R           R            R           R           R           R          R              R        R                   R           R',
  'PO4^3-':   'R    N        R  R  R   N         N          N   N        N:green     N           N:paleYellow N:green     N:pink      N           N          N:yellow       N        N                   N           N:lightBlue',
  'CO3^2-':   'R    R        R  R  R   N         N          M:0.013 D        D           N           D            N:green     N:pink      N           N          N:paleYellow   D        N                   D           D',
  'SiO3^2-':  'N:clearGel R   R  R  D   N         N          N   D        D           N           D            N:green     N:pink      N           N          N:paleYellow   D        N                   D           N:lightBlue',
  'CrO4^2-':  'R    R        R  R  R   N:yellow  M:0.1:yellow R  D        D           D           D            N:brown     N:brown     N:brown     N:yellow   N:brickRed     N:red    N:yellow            D           N:brown',
  'CH3COO^-': 'R    R        R  R  R   R         R          R   R        R           R           R            R           R           R           R          M:0.06         R        R                   D           R',
  // Not shown in the school table, but needed for qualitative reactions.
  'SCN^-':    'R    R        R  R  R   R         R          R   R        R           R           R            R           R           R           R          N              M:0.002  M:0.0015            R           N:black',
  'S2O3^2-':  'D    R        R  R  R   M:0.008   R          R   D        D           R           D            R           R           R           R          N              D        N                   D           D',
  // Ba2+ and Pb2+ take chromate out of a dichromate solution (BaCrO4, PbCrO4): marked D here.
  'Cr2O7^2-': 'R    R        R  R  R   D         R          R   R        R           D           R            R           R           R           R          N:brickRed     R        D                   D           R'
};

function parseCell(t: string): SolEntry {
  const [s, a, b] = t.split(':');
  if (s === 'R') return R;
  if (s === 'D') return D;
  if (s === 'N') return N((a as ColorKey) || 'white');
  return M(parseFloat(a), (b as ColorKey) || 'white');
}

const SOL_ROWS: Record<string, SolEntry[]> = Object.fromEntries(
  Object.entries(SOL_ROWS_RAW).map(([an, row]) => {
    const cells = row.trim().split(/\s+/).map(parseCell);
    if (cells.length !== CAT_ORDER.length) throw new Error(`Solubility row ${an} has ${cells.length} cells`);
    return [an, cells];
  })
);

/** How much more soluble a slightly soluble salt is at 100 °C than at 20 °C (linear in between). */
const SOL_AT_100: Record<string, number> = { PbI2: 5.6, PbCl2: 3.3, PbBr2: 4.5, 'Ca(OH)2': 0.45, CaSO4: 0.9, Ag2SO4: 1.9 };

export function solubility(cation: string, anion: string): SolEntry {
  const row = SOL_ROWS[anion];
  const col = CAT_ORDER.indexOf(cation);
  if (!row || col === -1) return R;
  return row[col];
}

/** Solubility (mol/L) of a slightly soluble salt at temperature t, °C. */
export function solubilityAt(cation: string, anion: string, t: number): number {
  const e = solubility(cation, anion);
  const S = e.S ?? 1e-5;
  const k = SOL_AT_100[saltFormula(cation, anion).formula];
  if (!k) return S;
  const f = Math.max(0, Math.min(1, (t - 20) / 80));
  return S * (1 + (k - 1) * f);
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

const STRONG_ACIDS = new Set(['HCl', 'HNO3', 'H2SO4', 'HI', 'HBr', 'H2CrO4']);

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

export const ACTIVITY = ['Li', 'K', 'Ba', 'Ca', 'Na', 'Mg', 'Al', 'Mn', 'Zn', 'Cr', 'Fe', 'Co', 'Ni', 'Sn', 'Pb', 'H2', 'Cu', 'Hg', 'Ag', 'Pt', 'Au'];
export const activity = (m: string) => ACTIVITY.indexOf(m);

export interface MetalDef {
  id: string;
  ion: string;           // ion formed with acids and salts
  nitricIon: string;     // ion formed with nitric acid
  alkali: boolean;       // reacts with water at room temperature
  heatWater: number;     // J per mmol released with water or acid
  look: 'piece' | 'granules' | 'ribbon' | 'filings' | 'wire' | 'crystals' | 'foil';
  color: string;
  forms: { ru: { nom: string; gen: string }; kk: { nom: string; abl: string }; en: string };
  floats?: boolean;      // lighter than water
  flame?: string;        // hydrogen catches fire on water; color of the flame
  violentAt?: number;    // mmol at which a piece in a test tube of water spatters hot alkali out
  boomAt?: number;       // mmol at which a piece in a test tube of water bursts it (larger vessels take more)
  density?: number;      // g/cm³, to tell how big a piece is
  slow?: boolean;        // reacts with dilute acids slowly
  film?: boolean;        // an insoluble salt film stops the reaction with HCl and H2SO4
  magnetic?: boolean;
}

const F = (ru: string, gen: string, kk: string, abl: string, en: string): MetalDef['forms'] => ({ ru: { nom: ru, gen }, kk: { nom: kk, abl }, en });

export const METALS: Record<string, MetalDef> = {
  Li: { id: 'Li', ion: 'Li^+', nitricIon: 'Li^+', alkali: true, heatWater: 222, look: 'piece', color: '#BFC4C8', floats: true, density: 0.53, forms: F('литий', 'лития', 'литий', 'литийден', 'lithium') },
  Na: { id: 'Na', ion: 'Na^+', nitricIon: 'Na^+', alkali: true, heatWater: 184, look: 'piece', color: '#C9CDD2', floats: true, violentAt: 9, boomAt: 45, density: 0.97, forms: F('натрий', 'натрия', 'натрий', 'натрийден', 'sodium') },
  K: { id: 'K', ion: 'K^+', nitricIon: 'K^+', alkali: true, heatWater: 196, look: 'piece', color: '#C3C9D0', floats: true, flame: '#B07CE0', violentAt: 3, boomAt: 20, density: 0.86, forms: F('калий', 'калия', 'калий', 'калийден', 'potassium') },
  Ca: { id: 'Ca', ion: 'Ca^2+', nitricIon: 'Ca^2+', alkali: true, heatWater: 414, look: 'piece', color: '#D8DADC', density: 1.55, forms: F('кальций', 'кальция', 'кальций', 'кальцийден', 'calcium') },
  Ba: { id: 'Ba', ion: 'Ba^2+', nitricIon: 'Ba^2+', alkali: true, heatWater: 372, look: 'piece', color: '#D3D6CF', density: 3.5, forms: F('барий', 'бария', 'барий', 'барийден', 'barium') },
  Mg: { id: 'Mg', ion: 'Mg^2+', nitricIon: 'Mg^2+', alkali: false, heatWater: 467, look: 'ribbon', color: '#C4CBD2', forms: F('магний', 'магния', 'магний', 'магнийден', 'magnesium') },
  Al: { id: 'Al', ion: 'Al^3+', nitricIon: 'Al^3+', alkali: false, heatWater: 530, look: 'granules', color: '#D3D8DD', forms: F('алюминий', 'алюминия', 'алюминий', 'алюминийден', 'aluminium') },
  Mn: { id: 'Mn', ion: 'Mn^2+', nitricIon: 'Mn^2+', alkali: false, heatWater: 220, look: 'granules', color: '#A7A79E', forms: F('марганец', 'марганца', 'марганец', 'марганецтен', 'manganese') },
  Zn: { id: 'Zn', ion: 'Zn^2+', nitricIon: 'Zn^2+', alkali: false, heatWater: 153, look: 'granules', color: '#A9B3BD', forms: F('цинк', 'цинка', 'мырыш', 'мырыштан', 'zinc') },
  Fe: { id: 'Fe', ion: 'Fe^2+', nitricIon: 'Fe^3+', alkali: false, heatWater: 89, look: 'filings', color: '#6E747A', magnetic: true, forms: F('железо', 'железа', 'темір', 'темірден', 'iron') },
  Co: { id: 'Co', ion: 'Co^2+', nitricIon: 'Co^2+', alkali: false, heatWater: 58, look: 'granules', color: '#9DA3AE', slow: true, magnetic: true, forms: F('кобальт', 'кобальта', 'кобальт', 'кобальттан', 'cobalt') },
  Ni: { id: 'Ni', ion: 'Ni^2+', nitricIon: 'Ni^2+', alkali: false, heatWater: 54, look: 'granules', color: '#B9B6A9', slow: true, magnetic: true, forms: F('никель', 'никеля', 'никель', 'никельден', 'nickel') },
  Sn: { id: 'Sn', ion: 'Sn^2+', nitricIon: 'Sn^2+', alkali: false, heatWater: 10, look: 'granules', color: '#C9CED3', slow: true, forms: F('олово', 'олова', 'қалайы', 'қалайыдан', 'tin') },
  Pb: { id: 'Pb', ion: 'Pb^2+', nitricIon: 'Pb^2+', alkali: false, heatWater: 2, look: 'granules', color: '#7D838A', slow: true, film: true, forms: F('свинец', 'свинца', 'қорғасын', 'қорғасыннан', 'lead') },
  Cu: { id: 'Cu', ion: 'Cu^2+', nitricIon: 'Cu^2+', alkali: false, heatWater: 0, look: 'wire', color: '#C9692C', forms: F('медь', 'меди', 'мыс', 'мыстан', 'copper') },
  Ag: { id: 'Ag', ion: 'Ag^+', nitricIon: 'Ag^+', alkali: false, heatWater: 0, look: 'crystals', color: '#B5BBC1', forms: F('серебро', 'серебра', 'күміс', 'күмістен', 'silver') },
  Pt: { id: 'Pt', ion: 'Pt^2+', nitricIon: 'Pt^2+', alkali: false, heatWater: 0, look: 'wire', color: '#C9CCCF', forms: F('платина', 'платины', 'платина', 'платинадан', 'platinum') },
  Au: { id: 'Au', ion: 'Au^3+', nitricIon: 'Au^3+', alkali: false, heatWater: 0, look: 'foil', color: '#E2B13C', forms: F('золото', 'золота', 'алтын', 'алтыннан', 'gold') }
};
export const isMetal = (id: string) => id in METALS;
/** Metals that only aqua regia dissolves: they react with nothing on the shelf. */
export const NOBLE_METALS = new Set(['Pt', 'Au']);

// Names of cations as metals, for "less active than ..." explanations.
export const ION_METAL_FORMS: Record<string, MetalDef['forms']> = {
  'Li^+': METALS.Li.forms,
  'K^+': METALS.K.forms,
  'Ba^2+': METALS.Ba.forms,
  'Na^+': METALS.Na.forms,
  'Ca^2+': METALS.Ca.forms,
  'Mg^2+': METALS.Mg.forms,
  'Al^3+': METALS.Al.forms,
  'Mn^2+': METALS.Mn.forms,
  'Zn^2+': METALS.Zn.forms,
  'Cr^3+': F('хром', 'хрома', 'хром', 'хромнан', 'chromium'),
  'Fe^2+': METALS.Fe.forms,
  'Fe^3+': METALS.Fe.forms,
  'Co^2+': F('кобальт', 'кобальта', 'кобальт', 'кобальттан', 'cobalt'),
  'Ni^2+': METALS.Ni.forms,
  'Sn^2+': METALS.Sn.forms,
  'Pb^2+': METALS.Pb.forms,
  'Cu^2+': METALS.Cu.forms,
  'Hg^2+': F('ртуть', 'ртути', 'сынап', 'сынаптан', 'mercury'),
  'Ag^+': METALS.Ag.forms
};

// ---------------------------------------------------------------- indicators

export type IndicatorId = 'phph' | 'litmus' | 'mo' | 'univ';

// ---------------------------------------------------------------- reagents on the shelf

export type ReagentCat = 'acid' | 'base' | 'salt' | 'oxide' | 'metal' | 'nonmetal' | 'ind' | 'other';

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
  { id: 'HCl01', formula: 'HCl', cat: 'acid', kind: 'liquid', name: L('Тұз қышқылы', 'Соляная кислота', 'Hydrochloric acid'), note: L('0,1 М · титрлеуге', '0,1 М · для титрования', '0.1 M · for titration'), aq: { 'H^+': 0.1, 'Cl^-': 0.1 }, parent: 'HCl', bottle: CLEAR, grade: 9 },
  { id: 'HClx', formula: 'HCl', cat: 'acid', kind: 'liquid', name: L('Тұз қышқылы X', 'Соляная кислота X', 'Hydrochloric acid X'), note: L('концентрациясы белгісіз', 'концентрация неизвестна', 'unknown concentration'), aq: { 'H^+': 0.1, 'Cl^-': 0.1 }, parent: 'HCl', bottle: '#E6EEF9', grade: 9 },
  { id: 'HClc', formula: 'HCl', cat: 'acid', kind: 'liquid', tag: 'conc', name: L('Тұз қышқылы', 'Соляная кислота', 'Hydrochloric acid'), note: L('36 % · түтіндейді', '36 % · дымит', '36 % · fuming'), aq: { 'H^+': 11.6, 'Cl^-': 11.6 }, parent: 'HCl', bottle: '#F2F6E6', grade: 9 },
  { id: 'H2SO4', formula: 'H2SO4', cat: 'acid', kind: 'liquid', tag: 'dil', name: L('Күкірт қышқылы', 'Серная кислота', 'Sulfuric acid'), note: M1, aq: { 'H^+': 2, 'SO4^2-': 1 }, parent: 'H2SO4', bottle: CLEAR, grade: 8 },
  { id: 'H2SO4c', formula: 'H2SO4', cat: 'acid', kind: 'liquid', tag: 'conc', name: L('Күкірт қышқылы', 'Серная кислота', 'Sulfuric acid'), note: L('98 %', '98 %', '98 %'), aq: { 'H2SO4c': 18.4 }, parent: 'H2SO4', concVolume: true, bottle: '#F3EFE2', grade: 9 },
  { id: 'HNO3', formula: 'HNO3', cat: 'acid', kind: 'liquid', tag: 'dil', name: L('Азот қышқылы', 'Азотная кислота', 'Nitric acid'), note: L('2 М', '2 М', '2 M'), aq: { 'H^+': 2, 'NO3^-': 2 }, parent: 'HNO3', bottle: CLEAR, grade: 9 },
  { id: 'HNO3c', formula: 'HNO3', cat: 'acid', kind: 'liquid', tag: 'conc', name: L('Азот қышқылы', 'Азотная кислота', 'Nitric acid'), note: L('65 %', '65 %', '65 %'), aq: { 'H^+': 14.4, 'NO3^-': 14.4 }, parent: 'HNO3', bottle: '#F6F1D8', grade: 9 },
  { id: 'H3PO4', formula: 'H3PO4', cat: 'acid', kind: 'liquid', name: L('Фосфор қышқылы', 'Фосфорная кислота', 'Phosphoric acid'), note: M1, aq: { 'H^+': 3, 'PO4^3-': 1 }, parent: 'H3PO4', bottle: CLEAR, grade: 8 },
  { id: 'CH3COOH', formula: 'CH3COOH', cat: 'acid', kind: 'liquid', name: L('Сірке қышқылы', 'Уксусная кислота', 'Acetic acid'), note: M1, aq: { 'CH3COOH': 1 }, parent: 'CH3COOH', bottle: CLEAR, grade: 8 },
  // bases
  { id: 'NaOH', formula: 'NaOH', cat: 'base', kind: 'liquid', name: L('Натрий гидроксиді', 'Гидроксид натрия', 'Sodium hydroxide'), note: M1, aq: { 'Na^+': 1, 'OH^-': 1 }, parent: 'NaOH', bottle: CLEAR, grade: 8 },
  { id: 'NaOH01', formula: 'NaOH', cat: 'base', kind: 'liquid', name: L('Натрий гидроксиді', 'Гидроксид натрия', 'Sodium hydroxide'), note: L('0,1 М · титрлеуге', '0,1 М · для титрования', '0.1 M · for titration'), aq: { 'Na^+': 0.1, 'OH^-': 0.1 }, parent: 'NaOH', bottle: CLEAR, grade: 9 },
  { id: 'KOH', formula: 'KOH', cat: 'base', kind: 'liquid', name: L('Калий гидроксиді', 'Гидроксид калия', 'Potassium hydroxide'), note: M1, aq: { 'K^+': 1, 'OH^-': 1 }, parent: 'KOH', bottle: CLEAR, grade: 8 },
  { id: 'CaOH2', formula: 'Ca(OH)2', cat: 'base', kind: 'liquid', name: L('Әк суы', 'Известковая вода', 'Limewater'), note: L('қаныққан', 'насыщенный', 'saturated'), aq: { 'Ca^2+': 0.02, 'OH^-': 0.04 }, parent: 'Ca(OH)2', bottle: '#F1F4F6', grade: 8 },
  { id: 'CaOH2s', formula: 'Ca(OH)2', cat: 'base', kind: 'solid', name: L('Сөндірілген әк', 'Гашёная известь', 'Slaked lime'), note: L('кальций гидроксиді, ұнтақ', 'гидроксид кальция, порошок', 'calcium hydroxide, powder'), solid: { 'Ca(OH)2': 5 }, bottle: '#F4F4F0', grade: 8 },
  { id: 'BaOH2', formula: 'Ba(OH)2', cat: 'base', kind: 'liquid', name: L('Барий гидроксиді', 'Гидроксид бария', 'Barium hydroxide'), note: L('0,1 М', '0,1 М', '0.1 M'), aq: { 'Ba^2+': 0.1, 'OH^-': 0.2 }, parent: 'Ba(OH)2', bottle: CLEAR, grade: 9 },
  { id: 'NaOHs', formula: 'NaOH', cat: 'base', kind: 'solid', name: L('Натрий гидроксиді', 'Гидроксид натрия', 'Sodium hydroxide'), note: L('түйіршіктер', 'гранулы', 'pellets'), solid: { 'NaOH': 5 }, bottle: '#FAFAF7', grade: 8 },
  { id: 'NH3aq', formula: 'NH3·H2O', cat: 'base', kind: 'liquid', name: L('Аммиак ерітіндісі', 'Раствор аммиака', 'Ammonia solution'), note: L('2 М', '2 М', '2 M'), aq: { 'NH3': 2 }, parent: 'NH3·H2O', bottle: CLEAR, grade: 9 },
  // salts
  { id: 'NaCl', formula: 'NaCl', cat: 'salt', kind: 'liquid', name: L('Натрий хлориді', 'Хлорид натрия', 'Sodium chloride'), note: M1, aq: { 'Na^+': 1, 'Cl^-': 1 }, parent: 'NaCl', bottle: CLEAR, grade: 7 },
  { id: 'NaCls', formula: 'NaCl', cat: 'salt', kind: 'solid', name: L('Ас тұзы', 'Поваренная соль', 'Table salt'), note: L('кристалдар', 'кристаллы', 'crystals'), solid: { 'NaCl': 17 }, bottle: '#FFFFFF', grade: 7 },
  { id: 'KCl', formula: 'KCl', cat: 'salt', kind: 'liquid', name: L('Калий хлориді', 'Хлорид калия', 'Potassium chloride'), note: M1, aq: { 'K^+': 1, 'Cl^-': 1 }, parent: 'KCl', bottle: CLEAR, grade: 9 },
  { id: 'KI', formula: 'KI', cat: 'salt', kind: 'liquid', name: L('Калий йодиді', 'Иодид калия', 'Potassium iodide'), note: M05, aq: { 'K^+': 0.5, 'I^-': 0.5 }, parent: 'KI', bottle: CLEAR, grade: 9 },
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
  { id: 'KBr', formula: 'KBr', cat: 'salt', kind: 'liquid', name: L('Калий бромиді', 'Бромид калия', 'Potassium bromide'), note: M05, aq: { 'K^+': 0.5, 'Br^-': 0.5 }, parent: 'KBr', bottle: CLEAR, grade: 9 },
  { id: 'LiCl', formula: 'LiCl', cat: 'salt', kind: 'liquid', name: L('Литий хлориді', 'Хлорид лития', 'Lithium chloride'), note: M05, aq: { 'Li^+': 0.5, 'Cl^-': 0.5 }, parent: 'LiCl', bottle: CLEAR, grade: 9 },
  { id: 'MgSO4', formula: 'MgSO4', cat: 'salt', kind: 'liquid', name: L('Магний сульфаты', 'Сульфат магния', 'Magnesium sulfate'), note: M05, aq: { 'Mg^2+': 0.5, 'SO4^2-': 0.5 }, parent: 'MgSO4', bottle: CLEAR, grade: 8 },
  { id: 'Na2S', formula: 'Na2S', cat: 'salt', kind: 'liquid', name: L('Натрий сульфиді', 'Сульфид натрия', 'Sodium sulfide'), note: M05, aq: { 'Na^+': 1, 'S^2-': 0.5 }, parent: 'Na2S', bottle: '#F6F3E2', grade: 9 },
  { id: 'Na2SO3', formula: 'Na2SO3', cat: 'salt', kind: 'liquid', name: L('Натрий сульфиті', 'Сульфит натрия', 'Sodium sulfite'), note: M05, aq: { 'Na^+': 1, 'SO3^2-': 0.5 }, parent: 'Na2SO3', bottle: CLEAR, grade: 9 },
  { id: 'Na2S2O3', formula: 'Na2S2O3', cat: 'salt', kind: 'liquid', name: L('Натрий тиосульфаты', 'Тиосульфат натрия', 'Sodium thiosulfate'), note: M05, aq: { 'Na^+': 1, 'S2O3^2-': 0.5 }, parent: 'Na2S2O3', bottle: CLEAR, grade: 9 },
  { id: 'K2CrO4', formula: 'K2CrO4', cat: 'salt', kind: 'liquid', name: L('Калий хроматы', 'Хромат калия', 'Potassium chromate'), note: L('0,1 М', '0,1 М', '0.1 M'), aq: { 'K^+': 0.2, 'CrO4^2-': 0.1 }, parent: 'K2CrO4', bottle: '#F2C200', grade: 9 },
  { id: 'K2Cr2O7', formula: 'K2Cr2O7', cat: 'salt', kind: 'liquid', name: L('Калий дихроматы', 'Дихромат калия', 'Potassium dichromate'), note: L('0,1 М', '0,1 М', '0.1 M'), aq: { 'K^+': 0.2, 'Cr2O7^2-': 0.1 }, parent: 'K2Cr2O7', bottle: '#E8700C', grade: 9 },
  { id: 'PbNO32', formula: 'Pb(NO3)2', cat: 'salt', kind: 'liquid', name: L('Қорғасын(II) нитраты', 'Нитрат свинца(II)', 'Lead(II) nitrate'), note: M05, aq: { 'Pb^2+': 0.5, 'NO3^-': 1 }, parent: 'Pb(NO3)2', bottle: CLEAR, grade: 9 },
  { id: 'NiSO4', formula: 'NiSO4', cat: 'salt', kind: 'liquid', name: L('Никель(II) сульфаты', 'Сульфат никеля(II)', 'Nickel(II) sulfate'), note: M05, aq: { 'Ni^2+': 0.5, 'SO4^2-': 0.5 }, parent: 'NiSO4', bottle: '#5FBF72', grade: 9 },
  { id: 'CoCl2', formula: 'CoCl2', cat: 'salt', kind: 'liquid', name: L('Кобальт(II) хлориді', 'Хлорид кобальта(II)', 'Cobalt(II) chloride'), note: M05, aq: { 'Co^2+': 0.5, 'Cl^-': 1 }, parent: 'CoCl2', bottle: '#E07A9C', grade: 9 },
  { id: 'MnSO4', formula: 'MnSO4', cat: 'salt', kind: 'liquid', name: L('Марганец(II) сульфаты', 'Сульфат марганца(II)', 'Manganese(II) sulfate'), note: M05, aq: { 'Mn^2+': 0.5, 'SO4^2-': 0.5 }, parent: 'MnSO4', bottle: '#F3DCE2', grade: 9 },
  { id: 'CrCl3', formula: 'CrCl3', cat: 'salt', kind: 'liquid', name: L('Хром(III) хлориді', 'Хлорид хрома(III)', 'Chromium(III) chloride'), note: M05, aq: { 'Cr^3+': 0.5, 'Cl^-': 1.5 }, parent: 'CrCl3', bottle: '#4E8A62', grade: 9 },
  { id: 'SnCl2', formula: 'SnCl2', cat: 'salt', kind: 'liquid', name: L('Қалайы(II) хлориді', 'Хлорид олова(II)', 'Tin(II) chloride'), note: M05, aq: { 'Sn^2+': 0.5, 'Cl^-': 1 }, parent: 'SnCl2', bottle: CLEAR, grade: 9 },
  { id: 'KNO3s', formula: 'KNO3', cat: 'salt', kind: 'solid', name: L('Калий селитрасы', 'Калийная селитра', 'Potassium nitrate'), note: L('кристалдар', 'кристаллы', 'crystals'), solid: { 'KNO3': 5 }, bottle: '#FFFFFF', grade: 8 },
  { id: 'NH4NO3s', formula: 'NH4NO3', cat: 'salt', kind: 'solid', name: L('Аммиак селитрасы', 'Аммиачная селитра', 'Ammonium nitrate'), note: L('түйіршіктер', 'гранулы', 'prills'), solid: { 'NH4NO3': 6 }, bottle: '#FFFFFF', grade: 8 },
  { id: 'NH4Cls', formula: 'NH4Cl', cat: 'salt', kind: 'solid', name: L('Нашатыр', 'Нашатырь', 'Sal ammoniac'), note: L('аммоний хлориді, ұнтақ', 'хлорид аммония, порошок', 'ammonium chloride, powder'), solid: { 'NH4Cl': 6 }, bottle: '#FFFFFF', grade: 9 },
  { id: 'CuSO4s', formula: 'CuSO4·5H2O', cat: 'salt', kind: 'solid', name: L('Мыс купоросы', 'Медный купорос', 'Blue vitriol'), note: L('көк кристалдар', 'синие кристаллы', 'blue crystals'), solid: { 'CuSO4·5H2O': 2 }, bottle: '#5FB2EC', grade: 8 },
  { id: 'KMnO4s', formula: 'KMnO4', cat: 'salt', kind: 'solid', name: L('Калий перманганаты', 'Перманганат калия', 'Potassium permanganate'), note: L('кристалдар («марганцовка»)', 'кристаллы («марганцовка»)', 'crystals'), solid: { 'KMnO4': 2 }, bottle: '#3C1840', grade: 8 },
  { id: 'malachite', formula: '(CuOH)2CO3', cat: 'salt', kind: 'solid', name: L('Малахит', 'Малахит', 'Malachite'), note: L('мыс(II) гидроксокарбонаты', 'гидроксокарбонат меди(II)', 'basic copper(II) carbonate'), solid: { '(CuOH)2CO3': 2 }, bottle: '#3E9C88', grade: 8 },
  { id: 'NH42Cr2O7', formula: '(NH4)2Cr2O7', cat: 'salt', kind: 'solid', name: L('Аммоний дихроматы', 'Дихромат аммония', 'Ammonium dichromate'), note: L('қызғылт сары кристалдар', 'оранжевые кристаллы', 'orange crystals'), solid: { '(NH4)2Cr2O7': 2 }, bottle: '#E8700C', grade: 9 },
  // oxides
  { id: 'CuO', formula: 'CuO', cat: 'oxide', kind: 'solid', name: L('Мыс(II) оксиді', 'Оксид меди(II)', 'Copper(II) oxide'), note: L('қара ұнтақ', 'чёрный порошок', 'black powder'), solid: { 'CuO': 2.5 }, bottle: '#2A2A2A', grade: 8 },
  { id: 'CaO', formula: 'CaO', cat: 'oxide', kind: 'solid', name: L('Кальций оксиді', 'Оксид кальция', 'Calcium oxide'), note: L('сөндірілмеген әк', 'негашёная известь', 'quicklime'), solid: { 'CaO': 5 }, bottle: '#F4F4F0', grade: 8 },
  { id: 'MgO', formula: 'MgO', cat: 'oxide', kind: 'solid', name: L('Магний оксиді', 'Оксид магния', 'Magnesium oxide'), note: L('ақ ұнтақ', 'белый порошок', 'white powder'), solid: { 'MgO': 5 }, bottle: '#F7F7F5', grade: 8 },
  { id: 'MnO2', formula: 'MnO2', cat: 'oxide', kind: 'solid', name: L('Марганец(IV) оксиді', 'Оксид марганца(IV)', 'Manganese(IV) oxide'), note: L('катализатор', 'катализатор', 'catalyst'), solid: { 'MnO2': 0.6 }, bottle: '#2B2522', grade: 8 },
  { id: 'ZnO', formula: 'ZnO', cat: 'oxide', kind: 'solid', name: L('Мырыш оксиді', 'Оксид цинка', 'Zinc oxide'), note: L('ақ ұнтақ', 'белый порошок', 'white powder'), solid: { 'ZnO': 2.5 }, bottle: '#F7F7F5', grade: 8 },
  { id: 'Fe2O3', formula: 'Fe2O3', cat: 'oxide', kind: 'solid', name: L('Темір(III) оксиді', 'Оксид железа(III)', 'Iron(III) oxide'), note: L('қызыл-қоңыр ұнтақ (тот)', 'красно-бурый порошок (ржавчина)', 'red-brown powder (rust)'), solid: { 'Fe2O3': 1.2 }, bottle: '#8E2F1A', grade: 8 },
  { id: 'SiO2', formula: 'SiO2', cat: 'oxide', kind: 'solid', name: L('Құм', 'Песок', 'Sand'), note: L('кремний(IV) оксиді', 'оксид кремния(IV)', 'silicon dioxide'), solid: { 'SiO2': 8 }, bottle: '#D9C49A', grade: 7 },
  // metals
  { id: 'Li', formula: 'Li', cat: 'metal', kind: 'solid', name: L('Литий', 'Литий', 'Lithium'), note: L('вазелин астында', 'под вазелином', 'kept under petroleum jelly'), solid: { 'Li': 7 }, bottle: '#BFC4C8', grade: 9 },
  { id: 'Na', formula: 'Na', cat: 'metal', kind: 'solid', name: L('Натрий', 'Натрий', 'Sodium'), note: L('керосин астында', 'под керосином', 'kept under kerosene'), solid: { 'Na': 2.2 }, bottle: '#C9CDD2', grade: 8 },
  { id: 'K', formula: 'K', cat: 'metal', kind: 'solid', name: L('Калий', 'Калий', 'Potassium'), note: L('керосин астында', 'под керосином', 'kept under kerosene'), solid: { 'K': 1.3 }, bottle: '#C3C9D0', grade: 9 },
  { id: 'Ca', formula: 'Ca', cat: 'metal', kind: 'solid', name: L('Кальций', 'Кальций', 'Calcium'), note: L('жаңқалар', 'стружка', 'turnings'), solid: { 'Ca': 2.5 }, bottle: '#D8DADC', grade: 8 },
  { id: 'Ba', formula: 'Ba', cat: 'metal', kind: 'solid', name: L('Барий', 'Барий', 'Barium'), note: L('керосин астында', 'под керосином', 'kept under kerosene'), solid: { 'Ba': 1.5 }, bottle: '#D3D6CF', grade: 9 },
  { id: 'Mg', formula: 'Mg', cat: 'metal', kind: 'solid', name: L('Магний', 'Магний', 'Magnesium'), note: L('таспа', 'лента', 'ribbon'), solid: { 'Mg': 2 }, bottle: '#C4CBD2', grade: 8 },
  { id: 'Al', formula: 'Al', cat: 'metal', kind: 'solid', name: L('Алюминий', 'Алюминий', 'Aluminium'), note: L('түйіршіктер', 'гранулы', 'granules'), solid: { 'Al': 3.7 }, bottle: '#D3D8DD', grade: 8 },
  { id: 'Zn', formula: 'Zn', cat: 'metal', kind: 'solid', name: L('Мырыш', 'Цинк', 'Zinc'), note: L('түйіршіктер', 'гранулы', 'granules'), solid: { 'Zn': 4.6 }, bottle: '#A9B3BD', grade: 8 },
  { id: 'Fe', formula: 'Fe', cat: 'metal', kind: 'solid', name: L('Темір', 'Железо', 'Iron'), note: L('үгінділер', 'опилки', 'filings'), solid: { 'Fe': 3.6 }, bottle: '#6E747A', grade: 7 },
  { id: 'Cu', formula: 'Cu', cat: 'metal', kind: 'solid', name: L('Мыс', 'Медь', 'Copper'), note: L('сым', 'проволока', 'wire'), solid: { 'Cu': 4.7 }, bottle: '#C9692C', grade: 7 },
  { id: 'Mn', formula: 'Mn', cat: 'metal', kind: 'solid', name: L('Марганец', 'Марганец', 'Manganese'), note: L('кесектер', 'кусочки', 'pieces'), solid: { 'Mn': 3.6 }, bottle: '#A7A79E', grade: 9 },
  { id: 'Ni', formula: 'Ni', cat: 'metal', kind: 'solid', name: L('Никель', 'Никель', 'Nickel'), note: L('түйіршіктер', 'гранулы', 'granules'), solid: { 'Ni': 3.4 }, bottle: '#B9B6A9', grade: 9 },
  { id: 'Sn', formula: 'Sn', cat: 'metal', kind: 'solid', name: L('Қалайы', 'Олово', 'Tin'), note: L('түйіршіктер', 'гранулы', 'granules'), solid: { 'Sn': 2.5 }, bottle: '#C9CED3', grade: 9 },
  { id: 'Pb', formula: 'Pb', cat: 'metal', kind: 'solid', name: L('Қорғасын', 'Свинец', 'Lead'), note: L('бытыра', 'дробь', 'shot'), solid: { 'Pb': 2.4 }, bottle: '#7D838A', grade: 9 },
  { id: 'Ag', formula: 'Ag', cat: 'metal', kind: 'solid', name: L('Күміс', 'Серебро', 'Silver'), note: L('сым', 'проволока', 'wire'), solid: { 'Ag': 2.8 }, bottle: '#B5BBC1', grade: 9 },
  { id: 'Pt', formula: 'Pt', cat: 'metal', kind: 'solid', name: L('Платина', 'Платина', 'Platinum'), note: L('сым', 'проволока', 'wire'), solid: { 'Pt': 0.5 }, bottle: '#C9CCCF', grade: 9 },
  { id: 'Au', formula: 'Au', cat: 'metal', kind: 'solid', name: L('Алтын', 'Золото', 'Gold'), note: L('жұқа жапырақ', 'тонкая фольга', 'thin leaf'), solid: { 'Au': 0.5 }, bottle: '#E2B13C', grade: 9 },
  // nonmetals
  { id: 'S', formula: 'S', cat: 'nonmetal', kind: 'solid', name: L('Күкірт', 'Сера', 'Sulfur'), note: L('ұнтақ', 'порошок', 'powder'), solid: { 'S': 15 }, bottle: '#F2D04B', grade: 7 },
  { id: 'C', formula: 'C', cat: 'nonmetal', kind: 'solid', name: L('Белсендірілген көмір', 'Активированный уголь', 'Activated charcoal'), note: L('көміртек, ұнтақ', 'углерод, порошок', 'carbon, powder'), solid: { 'C': 40 }, bottle: '#1E1E1E', grade: 7 },
  { id: 'I2', formula: 'I2', cat: 'nonmetal', kind: 'solid', name: L('Йод', 'Иод', 'Iodine'), note: L('кристалдар', 'кристаллы', 'crystals'), solid: { 'I2': 0.8 }, bottle: '#4B4157', grade: 9 },
  { id: 'Si', formula: 'Si', cat: 'nonmetal', kind: 'solid', name: L('Кремний', 'Кремний', 'Silicon'), note: L('кесектер', 'кусочки', 'pieces'), solid: { 'Si': 4 }, bottle: '#9AA3AB', grade: 9 },
  { id: 'Cl2aq', formula: 'Cl2', cat: 'nonmetal', kind: 'liquid', name: L('Хлорлы су', 'Хлорная вода', 'Chlorine water'), note: L('Cl₂ судағы ерітіндісі', 'раствор Cl₂ в воде', 'Cl₂ dissolved in water'), aq: { 'Cl2': 0.05 }, parent: 'Cl2', bottle: '#E3EDB0', grade: 9 },
  { id: 'Br2aq', formula: 'Br2', cat: 'nonmetal', kind: 'liquid', name: L('Бромды су', 'Бромная вода', 'Bromine water'), note: L('Br₂ судағы ерітіндісі', 'раствор Br₂ в воде', 'Br₂ dissolved in water'), aq: { 'Br2': 0.05 }, parent: 'Br2', bottle: '#E8A14A', grade: 9 },
  // indicators
  { id: 'phph', formula: 'phph', cat: 'ind', kind: 'liquid', indicator: 'phph', name: L('Фенолфталеин', 'Фенолфталеин', 'Phenolphthalein'), note: L('сілтіде таңқурай түсті', 'малиновый в щёлочи', 'crimson in alkali'), bottle: '#F6F6F4', grade: 8 },
  { id: 'litmus', formula: 'litmus', cat: 'ind', kind: 'liquid', indicator: 'litmus', name: L('Лакмус', 'Лакмус', 'Litmus'), note: L('қышқылда қызыл', 'красный в кислоте', 'red in acid'), bottle: '#7B4FB8', grade: 8 },
  { id: 'mo', formula: 'mo', cat: 'ind', kind: 'liquid', indicator: 'mo', name: L('Метилоранж', 'Метилоранж', 'Methyl orange'), note: L('қышқылда қызғылт', 'розовый в кислоте', 'pink in acid'), bottle: '#F08A24', grade: 8 },
  { id: 'univ', formula: 'univ', cat: 'ind', kind: 'liquid', indicator: 'univ', name: L('Әмбебап индикатор', 'Универсальный индикатор', 'Universal indicator'), note: L('pH шкаласы', 'шкала pH', 'pH scale'), bottle: '#59A84B', grade: 8 },
  // other
  { id: 'H2O', formula: 'H2O', cat: 'other', kind: 'liquid', name: L('Дистилденген су', 'Дистиллированная вода', 'Distilled water'), aq: {}, bottle: '#EAF4FB', grade: 7 },
  { id: 'H2O2', formula: 'H2O2', cat: 'other', kind: 'liquid', name: L('Сутек пероксиді', 'Пероксид водорода', 'Hydrogen peroxide'), note: L('3 %', '3 %', '3 %'), aq: { 'H2O2': 0.88 }, parent: 'H2O2', bottle: CLEAR, grade: 8 },
  { id: 'starch', formula: 'starch', cat: 'other', kind: 'liquid', name: L('Крахмал клейстері', 'Крахмальный клейстер', 'Starch solution'), note: L('йодты анықтайды', 'обнаруживает иод', 'detects iodine'), aq: { 'starch': 0.02 }, parent: 'starch', bottle: '#F4F4EE', grade: 9 },
  { id: 'ice', formula: 'H2O(s)', cat: 'other', kind: 'solid', name: L('Мұз', 'Лёд', 'Ice'), note: L('мұз кесектері', 'кубики льда', 'ice cubes'), solid: { 'H2O(s)': 280 }, bottle: '#E4F3FB', grade: 7 },
  { id: 'sugar', formula: 'C12H22O11', cat: 'other', kind: 'solid', name: L('Қант', 'Сахар', 'Sugar'), note: L('сахароза', 'сахароза', 'sucrose'), solid: { 'C12H22O11': 2.9 }, bottle: '#FFFFFF', grade: 7 }
];

export const REAGENT_BY_ID: Record<string, Reagent> = Object.fromEntries(REAGENTS.map((r) => [r.id, r]));

// Solids that dissolve in water as ions: formula -> ions per unit, solubility (mol per litre of
// water) at 20 °C and 100 °C, heat released on dissolving (J per mmol; negative cools the
// solution) and water of crystallisation. Salts not listed here use a generic solubility.
export interface SolubleSolid { ions: Record<string, number>; S: number; S100?: number; heat?: number; water?: number }

export const SOLUBLE_SOLIDS: Record<string, SolubleSolid> = {
  NaCl: { ions: { 'Na^+': 1, 'Cl^-': 1 }, S: 6.1, S100: 6.7, heat: -3.9 },
  KCl: { ions: { 'K^+': 1, 'Cl^-': 1 }, S: 4.6, S100: 7.6, heat: -17.2 },
  NaHCO3: { ions: { 'Na^+': 1, 'HCO3^-': 1 }, S: 1.1, S100: 2.8, heat: -18.7 },
  KNO3: { ions: { 'K^+': 1, 'NO3^-': 1 }, S: 3.1, S100: 24.3, heat: -34.9 },
  NH4NO3: { ions: { 'NH4^+': 1, 'NO3^-': 1 }, S: 24, S100: 120, heat: -25.7 },
  NH4Cl: { ions: { 'NH4^+': 1, 'Cl^-': 1 }, S: 7.0, S100: 14.4, heat: -14.8 },
  NaOH: { ions: { 'Na^+': 1, 'OH^-': 1 }, S: 27, S100: 80, heat: 44.5 },
  CuSO4: { ions: { 'Cu^2+': 1, 'SO4^2-': 1 }, S: 1.3, S100: 4.7, heat: 66.5 },
  'CuSO4·5H2O': { ions: { 'Cu^2+': 1, 'SO4^2-': 1 }, S: 1.3, S100: 4.7, heat: -11.5, water: 5 },
  CoCl2: { ions: { 'Co^2+': 1, 'Cl^-': 2 }, S: 4.1, S100: 8.1, heat: 79 },
  'CoCl2·6H2O': { ions: { 'Co^2+': 1, 'Cl^-': 2 }, S: 4.1, S100: 8.1, heat: -8, water: 6 },
  KMnO4: { ions: { 'K^+': 1, 'MnO4^-': 1 }, S: 0.4, S100: 2.4, heat: -43.6 },
  '(NH4)2Cr2O7': { ions: { 'NH4^+': 2, 'Cr2O7^2-': 1 }, S: 1.4, S100: 6, heat: -51 },
  K2Cr2O7: { ions: { 'K^+': 2, 'Cr2O7^2-': 1 }, S: 0.4, S100: 3.4, heat: -70 },
  Na2CO3: { ions: { 'Na^+': 2, 'CO3^2-': 1 }, S: 2.0, S100: 4.2, heat: 26.7 }
};

/** Crystals that come out of a solution of these salts carry water of crystallisation. */
export const HYDRATES: Record<string, string> = { CuSO4: 'CuSO4·5H2O', CoCl2: 'CoCl2·6H2O' };

/** Solubility of a soluble solid at temperature t, mol per litre of water. */
export function solidSolubility(info: SolubleSolid, t: number): number {
  const f = Math.max(0, Math.min(1, (t - 20) / 80));
  const S100 = info.S100 ?? info.S;
  return info.S + (S100 - info.S) * f;
}

// Colors of salts that crystallise from solution or come from the shelf as crystals.
const CRYSTAL_COLORS: Record<string, ColorKey> = {
  KMnO4: 'violetBlack', K2MnO4: 'darkGreen', NaHSO4: 'white', K2Cr2O7: 'orange', '(NH4)2Cr2O7': 'orange', K2CrO4: 'yellow', Na2CrO4: 'yellow',
  CoCl2: 'blue', NiSO4: 'green', NiCl2: 'green', 'Ni(NO3)2': 'green', MnSO4: 'pink', MnCl2: 'pink',
  CrCl3: 'darkGreen', 'Cr2(SO4)3': 'darkGreen', FeSO4: 'green', FeCl3: 'brown', 'Fe2(SO4)3': 'paleYellow',
  CuCl2: 'blueGreen', 'Cu(NO3)2': 'lightBlue', CuSO4: 'white', 'Co(NO3)2': 'pink', CoSO4: 'pink'
};
for (const id in CRYSTAL_COLORS) {
  const c = COMPOUNDS.get(id);
  if (c) c.color = CRYSTAL_COLORS[id];
}

// Element cards: physical properties, discovery, electron configuration and a short
// everyday fact in Kazakh, Russian and English for every element of the periodic table.
// Numbers are rounded handbook values. Values that nobody has measured (superheavy
// elements) are left out rather than guessed.

import type { L3, Lang } from '../engine/data';
import { ELEMENTS, ELEMENT_BY_SYMBOL, type ElementDef } from './elements';

export type ElState = 's' | 'l' | 'g' | '?';
export type ElFlag = 'toxic' | 'radioactive' | 'reactive' | 'flammable';

export interface ElementFacts {
  st: ElState;          // state at 20 °C
  mp?: number;          // melting point, °C
  bp?: number;          // boiling point, °C
  sub?: number;         // turns straight into vapour at this temperature instead of melting, °C
  d?: number;           // density: g/cm³ for solids and liquids, g/L for gases at 0 °C
  year?: number | 'ancient';
  chi?: number;         // Pauling electronegativity
  ox?: string;          // common oxidation states
  fact: L3;
  flags: ElFlag[];
}

// ---------------------------------------------------------------- electron configuration

const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const CAP: Record<string, number> = { s: 2, p: 6, d: 10, f: 14 };
const L_ORDER = 'spdf';

// Elements whose ground state differs from the simple filling order.
const EXCEPTIONS: Record<number, Record<string, number>> = {
  24: { '3d': 5, '4s': 1 },            // Cr
  29: { '3d': 10, '4s': 1 },           // Cu
  41: { '4d': 4, '5s': 1 },            // Nb
  42: { '4d': 5, '5s': 1 },            // Mo
  44: { '4d': 7, '5s': 1 },            // Ru
  45: { '4d': 8, '5s': 1 },            // Rh
  46: { '4d': 10, '5s': 0 },           // Pd
  47: { '4d': 10, '5s': 1 },           // Ag
  57: { '4f': 0, '5d': 1 },            // La
  58: { '4f': 1, '5d': 1 },            // Ce
  64: { '4f': 7, '5d': 1 },            // Gd
  78: { '5d': 9, '6s': 1 },            // Pt
  79: { '5d': 10, '6s': 1 },           // Au
  89: { '5f': 0, '6d': 1 },            // Ac
  90: { '5f': 0, '6d': 2 },            // Th
  91: { '5f': 2, '6d': 1 },            // Pa
  92: { '5f': 3, '6d': 1 },            // U
  93: { '5f': 4, '6d': 1 },            // Np
  96: { '5f': 7, '6d': 1 },            // Cm
  103: { '6d': 0, '7p': 1 }            // Lr
};

const NOBLE: [number, string][] = [[86, 'Rn'], [54, 'Xe'], [36, 'Kr'], [18, 'Ar'], [10, 'Ne'], [2, 'He']];
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n: number) => String(n).split('').map((c) => SUP[Number(c)]).join('');

/** Electrons in each subshell, e.g. { '1s': 2, '2s': 1 } for lithium. */
export function occupancy(z: number): Record<string, number> {
  const occ: Record<string, number> = {};
  let left = z;
  for (const sub of ORDER) {
    if (left <= 0) break;
    const n = Math.min(left, CAP[sub[1]]);
    occ[sub] = n;
    left -= n;
  }
  Object.assign(occ, EXCEPTIONS[z]);
  for (const k of Object.keys(occ)) if (!occ[k]) delete occ[k];
  return occ;
}

const bySubshell = (a: string, b: string) => (a[0] === b[0] ? L_ORDER.indexOf(a[1]) - L_ORDER.indexOf(b[1]) : Number(a[0]) - Number(b[0]));

/** Short electron configuration with a noble-gas core, e.g. "[Ne] 3s¹". */
export function electronConfig(z: number): string {
  const occ = occupancy(z);
  const core = NOBLE.find(([n]) => n < z);
  if (core) {
    const inner = occupancy(core[0]);
    for (const k of Object.keys(inner)) {
      const left = (occ[k] || 0) - inner[k];
      if (left > 0) occ[k] = left;
      else delete occ[k];
    }
  }
  const outer = Object.keys(occ).sort(bySubshell).map((k) => `${k}${sup(occ[k])}`).join(' ');
  return core ? `[${core[1]}] ${outer}`.trim() : outer;
}

/** Electrons on each energy level, from the nucleus outwards: sodium → [2, 8, 1]. */
export function shellCounts(z: number): number[] {
  const occ = occupancy(z);
  const shells: number[] = [];
  for (const k of Object.keys(occ)) {
    const n = Number(k[0]);
    shells[n - 1] = (shells[n - 1] || 0) + occ[k];
  }
  return Array.from({ length: shells.length }, (_, i) => shells[i] || 0);
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** Group in the short-table notation used in school: "IA", "VIIIB"; f-block elements sit in group IIIB. */
export function romanGroup(el: ElementDef): string {
  const g = el.group || 3;
  if (g <= 2) return `${ROMAN[g - 1]}A`;
  if (g >= 13) return `${ROMAN[g - 11]}A`;
  if (g <= 7) return `${ROMAN[g - 1]}B`;
  if (g <= 10) return 'VIIIB';
  return `${ROMAN[g - 11]}B`;
}

export const isRadioactive = (z: number) => z === 43 || z === 61 || z >= 84;

// ---------------------------------------------------------------- labels

export interface ElementLabels {
  states: Record<ElState, string>;
  state: string;
  number: string;
  mass: string;
  period: string;
  group: string;
  config: string;
  shells: string;
  outer: string;
  mp: string;
  bp: string;
  sub: string;
  density: string;
  gcm3: string;
  gL: string;
  gasNote: string;
  discovered: string;
  ancient: string;
  chi: string;
  ox: string;
  fact: string;
  add: string;
  unknown: string;
  flags: Record<ElFlag, string>;
}

export const ELEMENT_LABELS: Record<Lang, ElementLabels> = {
  kk: {
    states: { s: 'қатты', l: 'сұйық', g: 'газ', '?': 'белгісіз' },
    state: 'Күйі (20 °C)',
    number: 'Реттік нөмірі',
    mass: 'Атомдық массасы',
    period: 'Период',
    group: 'Топ',
    config: 'Электрондық формуласы',
    shells: 'Деңгейлердегі электрондар',
    outer: 'Сыртқы деңгейдегі электрондар',
    mp: 'Балқу температурасы',
    bp: 'Қайнау температурасы',
    sub: 'Балқымай буға айналады',
    density: 'Тығыздығы',
    gcm3: 'г/см³',
    gL: 'г/л',
    gasNote: '0 °C кезінде',
    discovered: 'Ашылған жылы',
    ancient: 'ежелден белгілі',
    chi: 'Электртерістілігі',
    ox: 'Тотығу дәрежелері',
    fact: 'Қызықты',
    add: 'Сөреде бар — ыдысқа қосу',
    unknown: 'белгісіз',
    flags: { toxic: 'Улы', radioactive: 'Радиоактивті', reactive: 'Сумен қатты әрекеттеседі', flammable: 'Оңай тұтанады' }
  },
  ru: {
    states: { s: 'твёрдое', l: 'жидкость', g: 'газ', '?': 'неизвестно' },
    state: 'Состояние (20 °C)',
    number: 'Порядковый номер',
    mass: 'Атомная масса',
    period: 'Период',
    group: 'Группа',
    config: 'Электронная конфигурация',
    shells: 'Электроны по уровням',
    outer: 'Электронов на внешнем уровне',
    mp: 'Температура плавления',
    bp: 'Температура кипения',
    sub: 'Возгоняется, не плавясь',
    density: 'Плотность',
    gcm3: 'г/см³',
    gL: 'г/л',
    gasNote: 'при 0 °C',
    discovered: 'Открыт',
    ancient: 'известен с древности',
    chi: 'Электроотрицательность',
    ox: 'Степени окисления',
    fact: 'Интересно',
    add: 'Есть на полке — добавить в сосуд',
    unknown: 'неизвестно',
    flags: { toxic: 'Ядовит', radioactive: 'Радиоактивен', reactive: 'Бурно реагирует с водой', flammable: 'Легко воспламеняется' }
  },
  en: {
    states: { s: 'solid', l: 'liquid', g: 'gas', '?': 'unknown' },
    state: 'State at 20 °C',
    number: 'Atomic number',
    mass: 'Atomic mass',
    period: 'Period',
    group: 'Group',
    config: 'Electron configuration',
    shells: 'Electrons per shell',
    outer: 'Outer-shell electrons',
    mp: 'Melting point',
    bp: 'Boiling point',
    sub: 'Turns to vapour without melting',
    density: 'Density',
    gcm3: 'g/cm³',
    gL: 'g/L',
    gasNote: 'at 0 °C',
    discovered: 'Discovered',
    ancient: 'known since ancient times',
    chi: 'Electronegativity',
    ox: 'Oxidation states',
    fact: 'Did you know?',
    add: 'On the shelf — add to the vessel',
    unknown: 'unknown',
    flags: { toxic: 'Toxic', radioactive: 'Radioactive', reactive: 'Reacts violently with water', flammable: 'Catches fire easily' }
  }
};

// ---------------------------------------------------------------- data

const INFO: Record<string, ElementFacts> = {};

type Num = number | null;

/** One element: state, mp, bp, density, year, electronegativity, oxidation states, fact (kk, ru, en), flags. */
function E(sym: string, st: ElState, mp: Num, bp: Num, d: Num, year: number | 'ancient' | null, chi: Num, ox: string | null,
  kk: string, ru: string, en: string, flags: ElFlag[] = []) {
  INFO[sym] = {
    st, mp: mp ?? undefined, bp: bp ?? undefined, d: d ?? undefined, year: year ?? undefined,
    chi: chi ?? undefined, ox: ox ?? undefined, fact: { kk, ru, en }, flags
  };
}

/** Facts for an element by symbol; radioactivity is added from the atomic number. */
export function elementFacts(sym: string): ElementFacts | undefined {
  const f = INFO[sym];
  const el = ELEMENT_BY_SYMBOL[sym];
  if (!f || !el) return f;
  const flags = isRadioactive(el.z) && !f.flags.includes('radioactive') ? ['radioactive' as const, ...f.flags] : f.flags;
  return { ...f, flags, sub: SUBLIMES[sym] ?? f.sub };
}

export const elementCount = () => Object.keys(INFO).length;
export const allElementFacts = () => ELEMENTS.map((el) => elementFacts(el.sym));

// Elements that turn into vapour without melting at normal pressure, °C.
const SUBLIMES: Record<string, number> = { C: 3642, As: 615 };

// Period 1–2
E('H', 'g', -259, -253, 0.0899, 1766, 2.2, '−1, +1',
  'Ең жеңіл газ. Күн мен жұлдыздар негізінен сутектен тұрады, ал оттекпен қосылып су түзеді.',
  'Самый лёгкий газ. Солнце и звёзды в основном состоят из водорода, а с кислородом он образует воду.',
  'The lightest gas. The Sun and stars are mostly hydrogen, and with oxygen it forms water.', ['flammable']);
E('He', 'g', null, -269, 0.179, 1868, null, '0',
  'Ауадан жеңіл және жанбайды, сондықтан әуе шарлары мен дирижабльдерді гелиймен толтырады. Сұйық гелий МРТ аппараттарының магниттерін салқындатады.',
  'Легче воздуха и не горит, поэтому им наполняют воздушные шары и дирижабли. Жидкий гелий охлаждает магниты аппаратов МРТ.',
  'Lighter than air and does not burn, so it fills party balloons and airships. Liquid helium cools the magnets of MRI scanners.');
E('Li', 's', 181, 1342, 0.534, 1817, 0.98, '+1',
  'Ең жеңіл металл — тіпті керосинде қалқиды. Телефондар мен электромобильдердің литий-иондық аккумуляторларында бар.',
  'Самый лёгкий металл — плавает даже в керосине. Есть в литий-ионных аккумуляторах телефонов и электромобилей.',
  'The lightest metal — it even floats on kerosene. It is in the lithium-ion batteries of phones and electric cars.', ['reactive']);
E('Be', 's', 1287, 2469, 1.85, 1798, 1.57, '+2',
  'Жеңіл әрі берік металл: ұшақтарда, ғарыш телескоптарында және рентген түтіктерінің терезелерінде қолданылады. Өскемендегі Үлбі металлургия зауыты — әлемдегі санаулы бериллий өндірушілердің бірі. Шаңы өте улы.',
  'Лёгкий и прочный металл для самолётов, космических телескопов и окошек рентгеновских трубок. Ульбинский металлургический завод в Усть-Каменогорске — один из немногих в мире производителей бериллия. Его пыль очень ядовита.',
  'A light, stiff metal used in aircraft, space telescopes and X-ray tube windows. The Ulba Metallurgical Plant in Ust-Kamenogorsk is one of the few beryllium producers in the world. Its dust is very toxic.', ['toxic']);
E('B', 's', 2076, 3927, 2.34, 1808, 2.04, '+3',
  'Бор қышқылы — дәріханадағы әлсіз антисептик. Борлы шыныдан ыстыққа төзімді ыдыстар мен зертханалық шыны жасалады.',
  'Борная кислота — слабый антисептик из аптеки. Из боросиликатного стекла делают жаропрочную посуду и лабораторную стеклотару.',
  'Boric acid is a mild antiseptic sold in pharmacies. Borosilicate glass, which survives heating, is used for oven dishes and lab glassware.');
E('C', 's', null, null, 2.27, 'ancient', 2.55, '−4, +2, +4',
  'Алмас пен графит (қарындаштың өзегі) — бір ғана элемент, тек атомдары әртүрлі орналасқан. Барлық тірі ағзалардың негізі. Екібастұз — Қазақстандағы ірі көмір бассейні.',
  'Алмаз и графит (грифель карандаша) — один и тот же элемент, только атомы уложены по-разному. Основа всего живого. Экибастуз — крупный угольный бассейн Казахстана.',
  'Diamond and graphite (pencil lead) are the same element with atoms arranged differently. It is the basis of all life. Ekibastuz is one of Kazakhstan\'s biggest coal fields.');
E('N', 'g', -210, -196, 1.251, 1772, 3.04, '−3, +1, +2, +3, +4, +5',
  'Ауаның шамамен 78 %-ы азоттан тұрады. Сұйық азот −196 °C-та қайнайды және оған батырылған затты лезде қатырады. Азот тыңайтқыштары өсімдіктерге қажет.',
  'Около 78 % воздуха — азот. Жидкий азот кипит при −196 °C и мгновенно замораживает всё, что в него опустить. Азотные удобрения нужны растениям.',
  'About 78% of air is nitrogen. Liquid nitrogen boils at −196 °C and instantly freezes anything dipped in it. Plants need nitrogen fertilisers.');
E('O', 'g', -218, -183, 1.429, 1774, 3.44, '−2, −1',
  'Ауаның шамамен 21 %-ы. Тыныс алуға және жануға қажет. Жер қыртысында ең көп таралған элемент — құм мен тастардың құрамында болады.',
  'Около 21 % воздуха. Нужен для дыхания и горения. Самый распространённый элемент земной коры — входит в состав песка и камней.',
  'About 21% of air. We need it to breathe, and fire needs it to burn. It is the most common element in the Earth\'s crust, locked in sand and rocks.');
E('F', 'g', -220, -188, 1.696, 1886, 3.98, '−1',
  'Ең белсенді бейметалл: көптеген заттармен жарқ етіп әрекеттеседі. Фторидтер тіс пастасында тіс кіреукесін нығайтады, тефлон табалардың жабынында да фтор бар. Газ түріндегі фтор өте улы.',
  'Самый активный неметалл: со многими веществами реагирует со вспышкой. Фториды в зубной пасте укрепляют эмаль, фтор есть и в тефлоновом покрытии сковородок. Газообразный фтор очень ядовит.',
  'The most reactive non-metal: it reacts with many substances in a flash. Fluoride in toothpaste strengthens enamel, and Teflon pan coatings contain fluorine. Fluorine gas is very poisonous.', ['toxic']);
E('Ne', 'g', -249, -246, 0.9, 1898, null, '0',
  'Шыны түтікте ток өткенде қызғылт сары жарық береді — жарнамалардағы «неон» жазулардың атауы осыдан шыққан.',
  'В стеклянной трубке под током светится красно-оранжевым — отсюда «неоновые» вывески.',
  'Glows red-orange in a glass tube when current flows — that is where neon signs got their name.');

// Period 3
E('Na', 's', 98, 883, 0.97, 1807, 0.93, '+1',
  'Жұмсақ металл, пышақпен оңай кесіледі; ауамен әрекеттеспеуі үшін керосин астында сақталады. Ас тұзы — натрий хлориді. Көшедегі сары шамдар натрий буымен жарқырайды.',
  'Мягкий металл, режется ножом; хранят под керосином, чтобы не реагировал с воздухом. Поваренная соль — хлорид натрия. Жёлтые уличные фонари светятся парами натрия.',
  'A soft metal you can cut with a knife; kept under kerosene so air cannot reach it. Table salt is sodium chloride. Yellow street lamps glow with sodium vapour.', ['reactive']);
E('Mg', 's', 650, 1090, 1.74, 1808, 1.31, '+2',
  'Жанғанда көз қарықтыратын ақ жалын береді — отшашуларда қолданылады. Одан жеңіл қорытпалар жасалады. Өскемен титан-магний комбинаты магний шығарады.',
  'Горит ослепительно белым пламенем — его используют в фейерверках. Из него делают лёгкие сплавы. Усть-Каменогорский титано-магниевый комбинат выпускает магний.',
  'Burns with a dazzling white flame and is used in fireworks. It makes light alloys. The Ust-Kamenogorsk Titanium-Magnesium Plant produces magnesium.');
E('Al', 's', 660, 2519, 2.7, 1825, 1.61, '+3',
  'Жер қыртысында ең көп таралған металл. Одан фольга, сусын банкалары және ұшақтар жасалады. Павлодардағы Қазақстан электролиз зауыты алюминий балқытады.',
  'Самый распространённый металл земной коры. Из него делают фольгу, банки для напитков и самолёты. Казахстанский электролизный завод в Павлодаре выплавляет алюминий.',
  'The most common metal in the Earth\'s crust, used for foil, drink cans and aircraft. The Kazakhstan Electrolysis Plant in Pavlodar smelts aluminium.');
E('Si', 's', 1414, 3265, 2.33, 1824, 1.9, '−4, +4',
  'Құм мен кварц — кремний диоксиді. Таза кремнийден компьютер чиптері мен күн батареялары жасалады.',
  'Песок и кварц — это диоксид кремния. Из чистого кремния делают компьютерные чипы и солнечные батареи.',
  'Sand and quartz are silicon dioxide. Pure silicon is made into computer chips and solar panels.');
E('P', 's', 44, 280, 1.82, 1669, 2.19, '−3, +3, +5',
  'Ақ фосфор қараңғыда жарқырайды, өздігінен тұтанады және улы; қызыл фосфор сіріңке қорабының қырында болады. Жамбыл облысындағы Қаратау фосфориттерінен тыңайтқыш алынады.',
  'Белый фосфор светится в темноте, самовоспламеняется и ядовит; красный — на тёрке спичечного коробка. Из фосфоритов Каратау (Жамбылская область) делают удобрения.',
  'White phosphorus glows in the dark, catches fire by itself and is poisonous; red phosphorus is on the striking strip of a matchbox. Phosphate rock from Karatau in the Zhambyl region is made into fertiliser.', ['toxic', 'flammable']);

E('S', 's', 115, 445, 2.07, 'ancient', 2.58, '−2, +4, +6',
  'Сары ұнтақ, оны су суландырмайды. Резеңкеге, сіріңкеге және күкірт қышқылын алуға қажет. Теңіз кен орнының мұнайын тазалағанда күкірттің орасан зор қоры жиналады.',
  'Жёлтый порошок, вода его не смачивает. Нужна для резины, спичек и получения серной кислоты. При очистке нефти месторождения Тенгиз накапливаются огромные запасы серы.',
  'A yellow powder that water does not wet. Used for rubber, matches and making sulfuric acid. Cleaning the oil from the Tengiz field leaves huge stockpiles of sulfur.');
E('Cl', 'g', -102, -34, 3.21, 1774, 3.16, '−1, +1, +3, +5, +7',
  'Сарғыш-жасыл улы газ. Аз мөлшерде ауыз су мен бассейн суын зарарсыздандырады. Ағартқыштардың құрамында болады.',
  'Жёлто-зелёный ядовитый газ. В малых дозах обеззараживает водопроводную воду и воду в бассейнах. Входит в отбеливатели.',
  'A yellow-green poisonous gas. In small doses it disinfects tap water and swimming pools. It is in household bleach.', ['toxic']);
E('Ar', 'g', -189, -186, 1.784, 1894, null, '0',
  'Ауаның шамамен 1 %-ы. Ешнәрсемен әрекеттеспейді, сондықтан қыздыру шамдарына толтырылады және дәнекерлеу кезінде металды ауадан қорғайды.',
  'Около 1 % воздуха. Ни с чем не реагирует, поэтому им заполняют лампы накаливания и защищают металл от воздуха при сварке.',
  'About 1% of air. It reacts with nothing, so it fills light bulbs and shields metal from air during welding.');

// Period 4
E('K', 's', 63, 759, 0.86, 1807, 0.82, '+1',
  'Натрийден де белсенді: су бетінде күлгін жалынмен жанады. Калий тыңайтқыштары өсімдіктерге қажет; банан мен өрік қақта калий көп.',
  'Ещё активнее натрия: на воде горит фиолетовым пламенем. Калийные удобрения нужны растениям; много калия в бананах и кураге.',
  'Even more reactive than sodium: on water it burns with a violet flame. Plants need potash fertilisers; bananas and dried apricots are rich in potassium.', ['reactive']);
E('Ca', 's', 842, 1484, 1.55, 1808, 1.0, '+2',
  'Сүйек пен тістің негізі. Бор, мәрмәр және әктас — кальций карбонаты. Әк құрылыста қолданылады.',
  'Основа костей и зубов. Мел, мрамор и известняк — карбонат кальция. Известь используют в строительстве.',
  'The basis of bones and teeth. Chalk, marble and limestone are calcium carbonate, and lime is used in building.');
E('Sc', 's', 1541, 2836, 2.99, 1879, 1.36, '+3',
  'Менделеев оны ашылмай тұрып «экабор» деп болжаған. Алюминиймен қорытпасынан жеңіл велосипед рамалары мен спорт құралдары жасалады.',
  'Менделеев предсказал его ещё до открытия как «экабор». Сплавы с алюминием идут на лёгкие велосипедные рамы и спортивный инвентарь.',
  'Mendeleev predicted it as "eka-boron" before it was found. Its alloys with aluminium make light bicycle frames and sports gear.');
E('Ti', 's', 1668, 3287, 4.51, 1791, 1.54, '+2, +3, +4',
  'Берік, жеңіл және тот баспайды: ұшақтар, зымырандар және сүйек импланттары жасалады. Титан диоксиді — ақ бояу мен күннен қорғайтын кремнің негізі. Өскемен титан-магний комбинаты титан шығарады.',
  'Прочный, лёгкий и не ржавеет: идёт на самолёты, ракеты и имплантаты. Диоксид титана — основа белой краски и солнцезащитного крема. Усть-Каменогорский титано-магниевый комбинат производит титан.',
  'Strong, light and rust-proof: used in aircraft, rockets and bone implants. Titanium dioxide is the white in paint and sunscreen. The Ust-Kamenogorsk Titanium-Magnesium Plant produces titanium.');
E('V', 's', 1910, 3407, 6.11, 1801, 1.63, '+2, +3, +4, +5',
  'Болатқа аздап қосса, кілттер мен құралдар өте берік болады. Ванадий оксиді күкірт қышқылын өндіруде катализатор қызметін атқарады.',
  'Небольшая добавка к стали делает гаечные ключи и инструменты очень прочными. Оксид ванадия — катализатор при производстве серной кислоты.',
  'A little vanadium in steel makes spanners and tools very tough. Vanadium oxide is the catalyst for making sulfuric acid.');
E('Cr', 's', 1907, 2671, 7.19, 1797, 1.66, '+2, +3, +6',
  'Жылтыр хром жабыны мен тот баспайтын болаттың негізі. Ақтөбе облысындағы Хромтау маңында хром кенінің әлемдегі ең ірі қорларының бірі бар. Хромның (VI) қосылыстары улы.',
  'Блестящее хромовое покрытие и основа нержавеющей стали. У Хромтау (Актюбинская область) — одни из крупнейших в мире запасов хромовой руды. Соединения хрома(VI) ядовиты.',
  'Gives the shine of chrome plating and makes steel stainless. Near Khromtau in the Aktobe region lie some of the world\'s largest chromium ore reserves. Chromium(VI) compounds are toxic.');
E('Mn', 's', 1246, 2061, 7.21, 1774, 1.55, '+2, +4, +6, +7',
  'Болатты берік етеді. Калий перманганаты («марганцовка») — күлгін антисептик. Марганец диоксиді кәдімгі батареялардың ішінде болады.',
  'Делает сталь прочнее. Перманганат калия («марганцовка») — фиолетовый антисептик. Диоксид марганца есть внутри обычных батареек.',
  'Makes steel tougher. Potassium permanganate is a purple antiseptic, and manganese dioxide is inside ordinary batteries.');
E('Fe', 's', 1538, 2861, 7.87, 'ancient', 1.83, '+2, +3',
  'Болат пен шойынның негізі — ең көп қолданылатын металл. Қандағы гемоглобиннің құрамында болады. Рудный маңындағы Соколов-Сарыбай кен орнында темір кені өндіріледі. Ылғалды ауада тот басады.',
  'Основа стали и чугуна — самый используемый металл. Входит в гемоглобин крови. Железную руду добывают на Соколовско-Сарбайском месторождении у Рудного. Во влажном воздухе ржавеет.',
  'The basis of steel and cast iron, the most used metal. It is in the haemoglobin of blood. Iron ore is mined at the Sokolovsko-Sarbai deposit near Rudny. It rusts in damp air.');
E('Co', 's', 1495, 2927, 8.9, 1735, 1.88, '+2, +3',
  'Шыны мен керамиканы терең көк түске бояйды («кобальт көгі»). B12 дәруменінің құрамында болады; магниттер мен аккумуляторларға қажет.',
  'Окрашивает стекло и керамику в глубокий синий цвет («кобальтовая синь»). Входит в витамин B12; нужен для магнитов и аккумуляторов.',
  'Colours glass and pottery deep blue ("cobalt blue"). It is part of vitamin B12 and is used in magnets and batteries.');
E('Ni', 's', 1455, 2913, 8.91, 1751, 1.91, '+2, +3',
  'Тиындар, тот баспайтын болат және жылтыр никель жабыны жасалады. Кейбір адамдарда никельге аллергия болады.',
  'Из него делают монеты, нержавеющую сталь и блестящие никелевые покрытия. У некоторых людей бывает аллергия на никель.',
  'Used in coins, stainless steel and shiny nickel plating. Some people are allergic to nickel.');
E('Cu', 's', 1085, 2562, 8.96, 'ancient', 1.9, '+1, +2',
  'Электр тогын жақсы өткізеді — сымдардың негізгі металы. Қола (мыс + қалайы) мен жез (мыс + мырыш) адамдарға ертеден таныс. Жезқазған мен Балқаш — Қазақстандағы мыс өндірісінің орталықтары.',
  'Отлично проводит ток — главный металл проводов. Бронза (медь + олово) и латунь (медь + цинк) известны людям с древности. Жезказган и Балхаш — центры медной промышленности Казахстана.',
  'Conducts electricity very well, so most wires are copper. Bronze (copper + tin) and brass (copper + zinc) have been made since ancient times. Zhezkazgan and Balkhash are Kazakhstan\'s copper centres.');
E('Zn', 's', 420, 907, 7.14, 1746, 1.65, '+2',
  'Болат тот баспауы үшін оны мырышпен қаптайды (мырыштау). Батареяларда қолданылады. Риддер мен Өскеменде мырыш өндіріледі.',
  'Сталь покрывают цинком, чтобы она не ржавела (оцинковка). Используется в батарейках. Цинк производят в Риддере и Усть-Каменогорске.',
  'Steel is coated with zinc to stop rust (galvanising). It is used in batteries. Zinc is produced in Ridder and Ust-Kamenogorsk.');

E('Ga', 's', 30, 2229, 5.91, 1875, 1.81, '+3',
  'Алақанда ериді — 30 °C-та балқиды. Жарық диодтары мен лазерлерде қолданылады. Менделеев оны «экаалюминий» деп болжаған.',
  'Тает на ладони — плавится при 30 °C. Используется в светодиодах и лазерах. Менделеев предсказал его как «экаалюминий».',
  'Melts in your hand at 30 °C. Used in LEDs and lasers. Mendeleev predicted it as "eka-aluminium".');
E('Ge', 's', 938, 2833, 5.32, 1886, 2.01, '+2, +4',
  'Алғашқы транзисторлар германийден жасалған. Қазір оптикалық талшықтар мен түнгі көру құралдарының линзаларына қажет. Бұл — Менделеевтің «экакремнийі».',
  'Первые транзисторы делали из германия. Сейчас он нужен для оптоволокна и линз приборов ночного видения. Это «экасилиций» Менделеева.',
  'The first transistors were made of germanium. Today it is used in optical fibres and night-vision lenses. It is Mendeleev\'s "eka-silicon".');
E('As', 's', null, null, 5.73, 1250, 2.18, '−3, +3, +5',
  'Ең белгілі улардың бірі. Аз мөлшерде жартылай өткізгіштерде (галлий арсениді) қолданылады. Қыздырғанда балқымай, бірден буға айналады.',
  'Один из самых известных ядов. В малых количествах используется в полупроводниках (арсенид галлия). При нагревании не плавится, а сразу возгоняется.',
  'One of the best-known poisons. Small amounts are used in semiconductors (gallium arsenide). When heated it does not melt but turns straight into vapour.', ['toxic']);
E('Se', 's', 221, 685, 4.81, 1817, 2.55, '−2, +4, +6',
  'Жарық түскенде ток өткізетіндіктен көшіру аппараттарында қолданылған. Ағзаға өте аз мөлшерде қажет, ал көп мөлшерде улы.',
  'Проводит ток на свету, поэтому применялся в копировальных аппаратах. Организму нужен в крошечных дозах, а в больших — ядовит.',
  'Light makes it conduct electricity, so it was used in photocopiers. The body needs a tiny amount, but larger doses are poisonous.');
E('Br', 'l', -7, 59, 3.1, 1826, 2.96, '−1, +1, +5',
  'Бөлме температурасында сұйық болатын жалғыз бейметалл. Қызыл-қоңыр, иісі өткір — атауы гректің «сасық иіс» деген сөзінен шыққан. Жанбайтын материалдарға қосылады. Улы, теріні күйдіреді.',
  'Единственный неметалл, жидкий при комнатной температуре. Красно-бурый, с резким запахом — название от греческого «зловоние». Добавляют в огнезащитные материалы. Ядовит, обжигает кожу.',
  'The only non-metal that is liquid at room temperature. Red-brown with a sharp smell; its name comes from the Greek for "stench". Used in flame retardants. Toxic and burns skin.', ['toxic']);
E('Kr', 'g', -157, -153, 3.75, 1898, 3.0, '0, +2',
  'Жылуды жақсы сақтайтын терезелердің әйнектері арасына толтырылады. Фотоаппараттың жарқыл шамдарында қолданылады.',
  'Им заполняют промежуток между стёклами энергосберегающих окон. Используется в лампах-вспышках.',
  'Fills the gap between panes in energy-saving windows and is used in photo flash lamps.');

// Period 5
E('Rb', 's', 39, 688, 1.53, 1861, 0.82, '+1',
  'Ыстық күні балқиды (39 °C), ауада өздігінен тұтанады. Атомдық сағаттарда қолданылады.',
  'Плавится в жаркий день (39 °C) и самовоспламеняется на воздухе. Используется в атомных часах.',
  'Melts on a hot day (39 °C) and catches fire in air. Used in atomic clocks.', ['reactive']);
E('Sr', 's', 777, 1377, 2.64, 1790, 0.95, '+2',
  'Отшашулар мен сигнал алауларына қызыл түс береді. Атауы Шотландиядағы Стронтиан ауылынан шыққан.',
  'Даёт красный цвет фейерверкам и сигнальным огням. Назван по шотландской деревне Стронциан.',
  'Gives fireworks and signal flares their red colour. Named after the village of Strontian in Scotland.');
E('Y', 's', 1526, 3345, 4.47, 1794, 1.22, '+3',
  'Лазерлер мен жарық диодтарында қолданылады. Швециядағы Иттербю ауылының атымен аталған — сол ауылдың құрметіне төрт элемент аталған.',
  'Используется в лазерах и светодиодах. Назван по шведской деревне Иттербю — в её честь назвали целых четыре элемента.',
  'Used in lasers and LEDs. Named after the Swedish village of Ytterby, which gave its name to four elements.');
E('Zr', 's', 1855, 4409, 6.52, 1789, 1.33, '+4',
  'Атом реакторларының отын элементтерінің қабығы цирконийден жасалады. Цирконий оксидінен керамикалық пышақтар мен тіс қаптамалары, ал фианиттен алмастың арзан баламасы жасалады.',
  'Из него делают оболочки тепловыделяющих элементов атомных реакторов. Из оксида циркония — керамические ножи и зубные коронки, а фианиты — дешёвая замена алмазу.',
  'Used for the fuel-rod cases in nuclear reactors. Zirconia makes ceramic knives and dental crowns, and cubic zirconia is a cheap diamond look-alike.');
E('Nb', 's', 2477, 4744, 8.57, 1801, 1.6, '+3, +5',
  'Аса өткізгіш магниттерде (МРТ, бөлшектер үдеткіштері) қолданылады. Өскемендегі Үлбі зауыты ниобий шығарады.',
  'Используется в сверхпроводящих магнитах (МРТ, ускорители частиц). Ульбинский завод в Усть-Каменогорске выпускает ниобий.',
  'Used in superconducting magnets for MRI scanners and particle accelerators. The Ulba plant in Ust-Kamenogorsk produces niobium.');
E('Mo', 's', 2623, 4639, 10.3, 1778, 2.16, '+4, +6',
  'Болатты ыстыққа төзімді әрі берік етеді. Өсімдіктерге өте аз мөлшерде қажет: азотты сіңіруге көмектеседі.',
  'Делает сталь жаропрочной и крепкой. В крошечных дозах нужен растениям — помогает им усваивать азот.',
  'Makes steel strong and heat-resistant. Plants need a trace of it to take up nitrogen.');
E('Tc', 's', 2157, 4265, 11.5, 1937, 1.9, '+4, +7',
  'Жасанды жолмен алынған алғашқы элемент — атауы «жасанды» дегенді білдіреді. Медицинада ішкі ағзаларды тексеру үшін қолданылады.',
  'Первый элемент, полученный искусственно, — его название значит «искусственный». В медицине используется для обследования внутренних органов.',
  'The first element made artificially; its name means "artificial". Doctors use it to scan internal organs.');
E('Ru', 's', 2334, 4150, 12.4, 1844, 2.2, '+3, +4, +8',
  'Қазан университетінде Карл Клаус ашқан, Ресейдің латынша атымен аталған. Электр түйіспелеріне және платинаны қатайтуға қолданылады.',
  'Открыт Карлом Клаусом в Казанском университете и назван в честь России. Нужен для электрических контактов и упрочнения платины.',
  'Discovered by Karl Klaus at Kazan University and named after Russia. Used in electrical contacts and to harden platinum.');
E('Rh', 's', 1964, 3695, 12.4, 1803, 2.28, '+3',
  'Автокөліктердің пайдаланылған газды тазартатын катализаторларында жұмыс істейді, зергерлік бұйымдарға жылтыр қабат береді. Ең қымбат металдардың бірі.',
  'Работает в автомобильных катализаторах выхлопа и даёт блестящее покрытие ювелирным изделиям. Один из самых дорогих металлов.',
  'Works in car exhaust catalysts and gives jewellery a bright finish. One of the most expensive metals.');

E('Pd', 's', 1555, 2963, 12.0, 1803, 2.2, '+2, +4',
  'Өз көлемінен жүздеген есе көп сутекті сіңіре алады. Автокатализаторларда және «ақ алтын» зергерлік бұйымдарында қолданылады.',
  'Может поглотить водорода в сотни раз больше собственного объёма. Используется в автокатализаторах и ювелирном «белом золоте».',
  'Can soak up hundreds of times its own volume of hydrogen. Used in car catalysts and "white gold" jewellery.');
E('Ag', 's', 962, 2162, 10.5, 'ancient', 1.93, '+1',
  'Электр мен жылуды ең жақсы өткізетін металл. Зергерлік бұйымдар мен айналар жасалады. Ауадағы күкірт қосылыстарынан қараяды.',
  'Лучше всех металлов проводит ток и тепло. Из него делают украшения и зеркала. Темнеет от соединений серы в воздухе.',
  'Conducts electricity and heat better than any other metal. Used for jewellery and mirrors. It tarnishes black from sulfur compounds in air.');
E('Cd', 's', 321, 767, 8.65, 1817, 1.69, '+2',
  'Никель-кадмий аккумуляторлары мен сары бояуларда қолданылған. Өте улы, сондықтан қазір одан бас тартып жатыр.',
  'Использовался в никель-кадмиевых аккумуляторах и жёлтых красках. Очень ядовит, поэтому от него постепенно отказываются.',
  'Used in nickel-cadmium batteries and yellow paints. It is very toxic, so its use is being phased out.', ['toxic']);
E('In', 's', 157, 2072, 7.31, 1863, 1.78, '+3',
  'Индий-қалайы оксиді смартфон экранын мөлдір әрі ток өткізгіш етеді. Өте жұмсақ — тырнақпен сызылады.',
  'Оксид индия-олова делает экраны смартфонов прозрачными и проводящими ток. Очень мягкий — царапается ногтем.',
  'Indium tin oxide makes phone touchscreens both transparent and conductive. It is so soft a fingernail scratches it.');
E('Sn', 's', 232, 2602, 7.27, 'ancient', 1.96, '+2, +4',
  'Консерві банкалары — қалайымен қапталған болат; қалайы дәнекерлеуге және қола жасауға жұмсалады. Қатты аязда ақ қалайы сұр ұнтаққа айналуы мүмкін — «қалайы обасы».',
  'Жестяные банки — это сталь, покрытая оловом; олово идёт на припой и бронзу. На сильном морозе белое олово может рассыпаться в серый порошок — «оловянная чума».',
  'Tin cans are steel coated with tin; tin is also used for solder and bronze. In hard frost white tin can crumble into grey powder — "tin pest".');
E('Sb', 's', 631, 1587, 6.7, 'ancient', 2.05, '−3, +3, +5',
  'Ежелгі Мысырда оның сульфидімен көзді бояған. Аккумулятордағы қорғасынды қатайтады, жанбайтын материалдарға қосылады. Қосылыстары улы.',
  'В Древнем Египте его сульфидом подводили глаза. Упрочняет свинец в аккумуляторах, входит в огнезащитные материалы. Соединения ядовиты.',
  'In ancient Egypt its sulfide was used as eye make-up. It hardens lead in car batteries and is used in flame retardants. Its compounds are toxic.', ['toxic']);
E('Te', 's', 450, 988, 6.24, 1782, 2.1, '−2, +4, +6',
  'Кадмий теллуриді күн батареяларында қолданылады. Аздаған теллурдың өзі адамның тынысына сарымсақ иісін береді.',
  'Теллурид кадмия используют в солнечных батареях. Даже немного теллура придаёт дыханию запах чеснока.',
  'Cadmium telluride is used in solar panels. Even a little tellurium gives the breath a garlic smell.');
E('I', 's', 114, 184, 4.93, 1811, 2.66, '−1, +1, +5, +7',
  'Қара-күлгін кристалдар, қыздырғанда күлгін буға айналады. Йод тұнбасы жараны залалсыздандырады. Қазақстанда ас тұзы міндетті түрде йодталады — йод қалқанша безге қажет.',
  'Тёмно-фиолетовые кристаллы, при нагревании превращаются в фиолетовый пар. Йодная настойка обеззараживает ранки. В Казахстане поваренную соль обязательно йодируют — йод нужен щитовидной железе.',
  'Dark violet crystals that turn into violet vapour when heated. Iodine tincture disinfects cuts. In Kazakhstan table salt must be iodised, because the thyroid gland needs iodine.');
E('Xe', 'g', -112, -108, 5.89, 1898, 2.6, '0, +2, +4, +6',
  'Автокөліктердің жарқын фаралары мен кинопроекторларда жарқырайды. Химиялық қосылыстары табылған алғашқы инертті газ.',
  'Светится в ярких автомобильных фарах и кинопроекторах. Первый инертный газ, у которого нашли химические соединения.',
  'Lights up bright car headlights and cinema projectors. It was the first noble gas found to form compounds.');

// Period 6
E('Cs', 's', 28, 671, 1.93, 1860, 0.79, '+1',
  'Ең белсенді металдардың бірі — сумен жарылыс бере әрекеттеседі. Цезий атомдық сағаттары секундтың ұзақтығын анықтайды. 28 °C-та балқиды.',
  'Один из самых активных металлов — с водой реагирует со взрывом. Цезиевые атомные часы задают длину секунды. Плавится при 28 °C.',
  'One of the most reactive metals — it explodes in water. Caesium atomic clocks define the length of a second. It melts at 28 °C.', ['reactive']);
E('Ba', 's', 727, 1897, 3.51, 1808, 0.89, '+2',
  'Отшашуларға жасыл түс береді. Ерімейтін барий сульфатын асқазанды рентгенге түсірер алдында ішеді, ал еритін барий тұздары улы.',
  'Даёт зелёный цвет фейерверкам. Нерастворимый сульфат бария пьют перед рентгеном желудка, а растворимые соли бария ядовиты.',
  'Gives fireworks their green colour. Insoluble barium sulfate is swallowed before stomach X-rays, but soluble barium salts are poisonous.', ['toxic']);
E('La', 's', 920, 3464, 6.15, 1839, 1.1, '+3',
  'Фотоаппарат линзаларының шынысына және гибрид автокөліктердің аккумуляторларына қосылады. Лантаноидтар тобына атын берген.',
  'Добавляют в стекло объективов и в аккумуляторы гибридных автомобилей. Дал имя всей группе лантаноидов.',
  'Added to camera-lens glass and hybrid car batteries. It gives its name to the lanthanides.');
E('Ce', 's', 795, 3443, 6.77, 1803, 1.12, '+3, +4',
  'Оттықтың шақпақ тасы цериймен қорытпадан жасалады — үйкегенде ұшқын шашады. Церий оксидімен шыныны жылтыратады.',
  'Кремни зажигалок делают из сплава с церием — он искрит при трении. Оксидом церия полируют стекло.',
  'Lighter flints are an alloy rich in cerium that sparks when scraped. Cerium oxide is used to polish glass.');
E('Pr', 's', 931, 3520, 6.77, 1885, 1.13, '+3',
  'Шыныға сары-жасыл түс береді; дәнекерлеушілердің көзілдірігінде қолданылады. Күшті магниттерге қосылады.',
  'Окрашивает стекло в жёлто-зелёный цвет; используется в очках сварщиков. Добавляют в сильные магниты.',
  'Tints glass yellow-green and is used in welders\' goggles. It is also added to strong magnets.');
E('Nd', 's', 1024, 3074, 7.01, 1885, 1.14, '+3',
  'Ең күшті тұрақты магниттер неодим-темір-бор қорытпасынан жасалады: олар құлаққаптарда, жел турбиналарында және электромобильдерде бар.',
  'Самые сильные постоянные магниты делают из сплава неодим-железо-бор: они стоят в наушниках, ветряках и электромобилях.',
  'The strongest permanent magnets are neodymium-iron-boron, found in headphones, wind turbines and electric cars.');

E('Pm', 's', 1042, 3000, 7.26, 1945, null, '+3',
  'Тұрақты изотоптары жоқ жалғыз лантаноид. Шағын атомдық батареяларда қолданылған.',
  'Единственный лантаноид без стабильных изотопов. Применялся в маленьких атомных батарейках.',
  'The only lanthanide with no stable isotopes. It has been used in tiny nuclear batteries.');
E('Sm', 's', 1072, 1794, 7.52, 1879, 1.17, '+2, +3',
  'Самарий-кобальт магниттері қатты қызғанда да күшін жоғалтпайды. Атауы тау-кен инженері Самарский-Быховецтің атымен аталған минерал — самарскиттен шыққан.',
  'Самарий-кобальтовые магниты не теряют силу даже при сильном нагреве. Назван по минералу самарскиту, который носит имя горного инженера Самарского-Быховца.',
  'Samarium-cobalt magnets keep their strength even when hot. Named after the mineral samarskite, which honours the mining engineer Samarsky-Bykhovets.');
E('Eu', 's', 826, 1529, 5.24, 1901, 1.2, '+2, +3',
  'Еуро банкноттарындағы ультракүлгін сәуледе жарқырайтын бояуда бар — жалғандықтан қорғайды. Экрандар мен шамдарға қызыл түс береді.',
  'Есть в краске на банкнотах евро, которая светится в ультрафиолете, — это защита от подделок. Даёт красный цвет экранов и ламп.',
  'It is in the ink on euro banknotes that glows under UV light to stop forgery, and gives the red in screens and lamps.');
E('Gd', 's', 1312, 3273, 7.9, 1880, 1.2, '+3',
  'МРТ суретін анығырақ ету үшін енгізілетін контрастты заттардың құрамында болады.',
  'Входит в контрастные препараты для МРТ, которые делают снимок чётче.',
  'Used in contrast agents that make MRI scans clearer.');
E('Tb', 's', 1356, 3230, 8.23, 1843, null, '+3, +4',
  'Шамдар мен экрандарға жасыл жарық береді. Бұл да Иттербю ауылының атымен аталған элемент.',
  'Даёт зелёное свечение лампам и экранам. Ещё один элемент, названный по деревне Иттербю.',
  'Gives lamps and screens their green glow. Another element named after Ytterby.');
E('Dy', 's', 1407, 2567, 8.55, 1886, 1.22, '+3',
  'Неодим магниттеріне қосылады — сонда олар электромобильдің ыстық қозғалтқышында да жұмыс істейді. Атауы гректің «қолжетімсіз» деген сөзінен шыққан.',
  'Его добавляют в неодимовые магниты, чтобы они работали в горячих двигателях электромобилей. Название от греческого «труднодоступный».',
  'Added to neodymium magnets so they keep working in hot electric car motors. Its name is Greek for "hard to get".');
E('Ho', 's', 1474, 2700, 8.8, 1878, 1.23, '+3',
  'Бүйректегі тастарды ұсататын медициналық лазерлерде қолданылады. Стокгольмның латынша атымен аталған.',
  'Используется в медицинских лазерах, которые дробят камни в почках. Назван по латинскому имени Стокгольма.',
  'Used in medical lasers that break up kidney stones. Named after the Latin name for Stockholm.');
E('Er', 's', 1529, 2868, 9.07, 1843, 1.24, '+3',
  'Интернеттің оптикалық талшықты кабельдерінде сигналды күшейтеді. Шыныға қызғылт түс береді.',
  'Усиливает сигнал в оптоволоконных кабелях интернета. Окрашивает стекло в розовый цвет.',
  'Boosts the signal in fibre-optic internet cables and tints glass pink.');
E('Tm', 's', 1545, 1950, 9.32, 1879, 1.25, '+2, +3',
  'Ең сирек лантаноидтардың бірі. Тасымалды рентген аппараттарында қолданылады.',
  'Один из самых редких лантаноидов. Используется в переносных рентгеновских аппаратах.',
  'One of the rarest lanthanides, used in portable X-ray machines.');
E('Yb', 's', 824, 1196, 6.9, 1878, null, '+2, +3',
  'Өте дәл атомдық сағаттар мен металл кесетін лазерлерде қолданылады. Бұл да Иттербю ауылының атымен аталған.',
  'Работает в сверхточных атомных часах и лазерах для резки металла. Тоже назван по деревне Иттербю.',
  'Used in ultra-precise atomic clocks and metal-cutting lasers. Also named after Ytterby.');
E('Lu', 's', 1652, 3402, 9.84, 1907, 1.27, '+3',
  'Лантаноидтардың ішіндегі ең тығызы және ең қаттысы. ПЭТ-томографтардың детекторларында қолданылады. Парижнің ежелгі атымен аталған.',
  'Самый плотный и твёрдый из лантаноидов. Используется в детекторах ПЭТ-томографов. Назван по древнему имени Парижа.',
  'The densest and hardest lanthanide, used in PET scanner detectors. Named after the ancient name of Paris.');
E('Hf', 's', 2233, 4603, 13.3, 1923, 1.3, '+4',
  'Нейтрондарды жақсы жұтады, сондықтан одан атом реакторларын басқаратын таяқшалар жасалады. Копенгагеннің латынша атымен аталған.',
  'Хорошо поглощает нейтроны, поэтому из него делают регулирующие стержни реакторов. Назван по латинскому имени Копенгагена.',
  'Absorbs neutrons well, so it is used in reactor control rods. Named after the Latin name for Copenhagen.');
E('Ta', 's', 3017, 5458, 16.7, 1802, 1.5, '+5',
  'Телефондар мен ноутбуктардағы шағын конденсаторлар танталдан жасалады. Ағзаға зиянсыз, сондықтан импланттарға қолданылады. Үлбі металлургия зауыты — ірі тантал өндірушісі.',
  'Из него делают крошечные конденсаторы для телефонов и ноутбуков. Безвреден для тканей — идёт на имплантаты. Ульбинский металлургический завод — крупный производитель тантала.',
  'Tiny capacitors in phones and laptops are made of tantalum. It is harmless to the body, so it is used in implants. The Ulba Metallurgical Plant is a major tantalum producer.');
E('W', 's', 3422, 5555, 19.3, 1783, 2.36, '+4, +6',
  'Металдардың ішінде балқу температурасы ең жоғары. Қыздыру шамдарының қылы, ал вольфрам карбидінен бұрғылар жасалады. Қарағанды облысындағы Жоғарғы Қайрақты — әлемдегі ірі вольфрам кен орындарының бірі.',
  'Самый тугоплавкий металл. Из него делают нити ламп накаливания, а из карбида вольфрама — свёрла. Верхнее Кайракты в Карагандинской области — одно из крупнейших месторождений вольфрама в мире.',
  'The metal with the highest melting point, used for light-bulb filaments, and as tungsten carbide for drill bits. Verkhnee Kairakty in the Karaganda region is one of the world\'s largest tungsten deposits.');
E('Re', 's', 3186, 5596, 21.0, 1925, 1.9, '+4, +7',
  'Реактивті қозғалтқыштардың турбина қалақтарына арналған ыстыққа төзімді қорытпаларға қосылады. Қазақстанда рений Жезқазғанда мыс кенінен алынады.',
  'Входит в жаропрочные сплавы для лопаток турбин реактивных двигателей. В Казахстане рений извлекают из медной руды в Жезказгане.',
  'Used in heat-resistant alloys for jet-engine turbine blades. In Kazakhstan rhenium is recovered from copper ore at Zhezkazgan.');

E('Os', 's', 3033, 5012, 22.6, 1803, 2.2, '+4, +8',
  'Ең тығыз элемент. Одан қаламұштардың ұшы жасалады. Оксиді улы және иісі өткір — атауы гректің «иіс» деген сөзінен шыққан.',
  'Самый плотный элемент. Из него делают кончики перьевых ручек. Его оксид ядовит и резко пахнет — название от греческого «запах».',
  'The densest element. Used for the tips of fountain-pen nibs. Its oxide is toxic and smelly; the name comes from the Greek for "smell".', ['toxic']);
E('Ir', 's', 2446, 4428, 22.6, 1803, 2.2, '+3, +4',
  'Тот пен қышқылға ең төзімді металл. Тау жыныстарындағы иридийге бай жұқа қабат динозаврларды жойған астероидтың құлағанының ізі.',
  'Самый стойкий к коррозии металл. Тонкий слой, богатый иридием, в горных породах — след падения астероида, погубившего динозавров.',
  'The most corrosion-resistant metal. A thin iridium-rich layer in rocks marks the asteroid impact that wiped out the dinosaurs.');
E('Pt', 's', 1768, 3825, 21.4, 1748, 2.28, '+2, +4',
  'Зергерлік бұйымдар, автокатализаторлар және ісікке қарсы дәрі жасалады. Тек «патша арағында» — тұз және азот қышқылдарының қоспасында ериді.',
  'Идёт на украшения, автокатализаторы и противоопухолевые лекарства. Растворяется только в «царской водке» — смеси соляной и азотной кислот.',
  'Used in jewellery, car catalysts and anti-cancer medicine. It dissolves only in aqua regia, a mix of hydrochloric and nitric acids.');
E('Au', 's', 1064, 2856, 19.3, 'ancient', 2.54, '+1, +3',
  'Тот баспайды және күңгірттенбейді. 1 г алтыннан шамамен 1 м² жұқа жапырақ соғуға болады. Электрониканың түйіспелерінде қолданылады. Көкшетау маңындағы Васильков кен орны — Қазақстанның ірі алтын кен орындарының бірі.',
  'Не ржавеет и не тускнеет. Из 1 г золота можно расковать лист площадью около 1 м². Используется в контактах электроники. Васильковское месторождение у Кокшетау — одно из крупнейших золоторудных в Казахстане.',
  'Never rusts or tarnishes. One gram can be beaten into a leaf of about one square metre. Used in electronic contacts. The Vasilkovskoye deposit near Kokshetau is one of Kazakhstan\'s largest gold deposits.');
E('Hg', 'l', -39, 357, 13.5, 'ancient', 2.0, '+1, +2',
  'Бөлме температурасында сұйық болатын жалғыз металл. Бұрын термометрлерге құйылған. Буы өте улы — сынған термометрді мамандар жинауы керек.',
  'Единственный металл, жидкий при комнатной температуре. Раньше его наливали в термометры. Пары очень ядовиты — разбитый градусник должны убирать специалисты.',
  'The only metal that is liquid at room temperature. It used to be in thermometers. Its vapour is very poisonous, so a broken thermometer should be cleaned up by specialists.', ['toxic']);
E('Tl', 's', 304, 1473, 11.9, 1861, 1.62, '+1, +3',
  'Өте улы металл. Спектріндегі жасыл сызық үшін гректің «жасыл бұтақ» деген сөзімен аталған. Инфрақызыл оптикада қолданылады.',
  'Очень ядовитый металл. Назван от греческого «зелёная ветвь» по зелёной линии в спектре. Применяется в инфракрасной оптике.',
  'A very poisonous metal, named from the Greek for "green twig" after its green spectral line. Used in infrared optics.', ['toxic']);
E('Pb', 's', 327, 1749, 11.3, 'ancient', 2.33, '+2, +4',
  'Автокөлік аккумуляторлары мен рентгеннен қорғайтын алжапқыштар жасалады. Бұрын бояу мен бензинге қосылған, бірақ улы болғандықтан тыйым салынды. Өскемен мен Риддерде қорғасын өндіріледі.',
  'Из него делают автомобильные аккумуляторы и фартуки для защиты от рентгена. Раньше добавляли в краски и бензин, но запретили, потому что он ядовит. Свинец производят в Усть-Каменогорске и Риддере.',
  'Used in car batteries and X-ray protective aprons. It used to be added to paint and petrol but was banned because it is poisonous. Lead is produced in Ust-Kamenogorsk and Ridder.', ['toxic']);
E('Bi', 's', 271, 1564, 9.78, 1753, 2.02, '+3, +5',
  'Кемпірқосақ түстес, баспалдақ тәрізді кристалдар түзеді. Асқазан дәрілерінде болады, балық аулайтын салмақтарда қорғасынның орнына қолданылады.',
  'Образует радужные кристаллы-«лесенки». Входит в лекарства для желудка и заменяет свинец в рыболовных грузилах.',
  'Forms rainbow-coloured, stair-step crystals. It is in some stomach medicines and replaces lead in fishing weights.');
E('Po', 's', 254, 962, 9.2, 1898, 2.0, '+2, +4',
  'Мария мен Пьер Кюри ашқан, Польшаның құрметіне аталған. Өте радиоактивті және улы.',
  'Открыт Марией и Пьером Кюри и назван в честь Польши. Очень радиоактивен и ядовит.',
  'Discovered by Marie and Pierre Curie and named after Poland. Extremely radioactive and poisonous.', ['toxic']);
E('At', 's', null, null, null, 1940, 2.2, '−1, +1',
  'Табиғатта кездесетін ең сирек элементтердің бірі: жер қыртысында кез келген сәтте оның өте аз мөлшері ғана болады. Ісікті емдеу үшін зерттелуде.',
  'Один из самых редких природных элементов: в земной коре в каждый момент его ничтожно мало. Изучается для лечения опухолей.',
  'One of the rarest natural elements: at any moment the Earth\'s crust holds only a tiny trace of it. Studied for treating tumours.');
E('Rn', 'g', -71, -62, 9.73, 1899, 2.2, '0, +2',
  'Тау жыныстарындағы ураннан бөлінетін радиоактивті газ. Жертөлелерде жиналуы мүмкін, сондықтан бөлмелерді желдету керек.',
  'Радиоактивный газ, выделяющийся из урана в горных породах. Может скапливаться в подвалах, поэтому помещения нужно проветривать.',
  'A radioactive gas given off by uranium in rocks. It can build up in basements, so rooms should be aired.');

// Period 7
E('Fr', 's', null, null, null, 1939, null, '+1',
  'Маргерит Перей ашқан, Францияның құрметіне аталған. Өте тез ыдырайтындықтан, оның көзге көрінетін кесегі ешқашан жиналмаған.',
  'Открыт Маргерит Перей и назван в честь Франции. Распадается так быстро, что видимый кусочек его никогда не получали.',
  'Discovered by Marguerite Perey and named after France. It decays so fast that a visible piece has never been collected.', ['reactive']);
E('Ra', 's', 700, 1737, 5.5, 1898, 0.9, '+2',
  'Кюрилер ашқан. Қараңғыда әлсіз жарқырайды, сондықтан бір кездері сағат тілдерін радиймен бояған — кейін бұл қауіпті екені анықталды.',
  'Открыт супругами Кюри. Слабо светится в темноте, поэтому раньше им красили стрелки часов, пока не поняли, насколько это опасно.',
  'Discovered by the Curies. It glows faintly in the dark, so it was once painted on watch hands, until people realised how dangerous it was.', ['toxic']);
E('Ac', 's', 1050, 3200, 10.1, 1899, 1.1, '+3',
  'Радиоактивтілігінен қараңғыда көгілдір жарқырайды. Актиноидтар тобына атын берген.',
  'Из-за радиоактивности светится в темноте голубым. Дал имя группе актиноидов.',
  'Glows blue in the dark because of its radioactivity, and gives its name to the actinides.');
E('Th', 's', 1750, 4788, 11.7, 1829, 1.3, '+4',
  'Скандинавиялық найзағай құдайы Тордың атымен аталған. Болашақ атом электр станцияларының отыны ретінде зерттелуде.',
  'Назван в честь скандинавского бога грома Тора. Изучается как топливо будущих атомных станций.',
  'Named after Thor, the Norse god of thunder. Studied as a fuel for future nuclear power plants.');

E('Pa', 's', 1572, null, 15.4, 1913, 1.5, '+5',
  'Табиғаттағы ең сирек әрі ең қымбат элементтердің бірі; негізінен ғылыми зерттеулерге қолданылады.',
  'Один из самых редких и дорогих природных элементов; нужен в основном для научных исследований.',
  'One of the rarest and most expensive natural elements, used mainly for research.');
E('U', 's', 1132, 4131, 19.1, 1789, 1.38, '+3, +4, +6',
  'Атом электр станцияларының отыны. Қазақстан — әлемдегі ең ірі уран өндіруші, ал Үлбі зауыты реакторларға арналған отын таблеткаларын шығарады.',
  'Топливо атомных электростанций. Казахстан — крупнейший в мире производитель урана, а Ульбинский завод выпускает топливные таблетки для реакторов.',
  'The fuel of nuclear power stations. Kazakhstan is the world\'s largest uranium producer, and the Ulba plant makes fuel pellets for reactors.', ['toxic']);
E('Np', 's', 644, null, 20.5, 1940, 1.36, '+3, +4, +5, +6',
  'Ураннан кейін тұрған алғашқы элемент. Уран Уран планетасының атымен аталғандай, нептуний Нептун планетасының атымен аталған.',
  'Первый элемент после урана. Как уран назван по планете Уран, так нептуний — по Нептуну.',
  'The first element after uranium. Uranium is named after the planet Uranus, and neptunium after Neptune.');
E('Pu', 's', 640, 3228, 19.8, 1940, 1.28, '+3, +4, +5, +6',
  'Кейбір реакторлардың отыны. Плутоний-238 Curiosity және Perseverance марсоходтарының атомдық батареяларын қуаттайды. Улы.',
  'Топливо некоторых реакторов. Плутоний-238 питает атомные батареи марсоходов Curiosity и Perseverance. Ядовит.',
  'Fuel for some reactors. Plutonium-238 powers the nuclear batteries of the Mars rovers Curiosity and Perseverance. It is toxic.', ['toxic']);
E('Am', 's', 1176, 2011, 12, 1944, null, '+3',
  'Үйдегі түтін датчиктерінің ішінде өте аз мөлшерде жұмыс істейді.',
  'Крошечное количество америция работает внутри бытовых дымовых датчиков.',
  'A tiny amount of americium works inside household smoke detectors.');
E('Cm', 's', 1340, 3110, 13.5, 1944, null, '+3',
  'Мария мен Пьер Кюридің құрметіне аталған. Марсоходтардың тау жыныстарының құрамын зерттейтін құралдарында қолданылады.',
  'Назван в честь Марии и Пьера Кюри. Используется в приборах марсоходов, которые изучают состав камней.',
  'Named after Marie and Pierre Curie. Used in instruments on Mars rovers that analyse rocks.');
E('Bk', 's', 986, null, 14.8, 1949, null, '+3, +4',
  'Беркли қаласының атымен аталған. 117-элемент — теннессинді алу үшін нысана ретінде қолданылған.',
  'Назван в честь города Беркли. Из него сделали мишень для получения 117-го элемента — теннессина.',
  'Named after the city of Berkeley. It was used as the target to make element 117, tennessine.');
E('Cf', 's', 900, null, 15.1, 1950, null, '+3',
  'Нейтрондардың қуатты көзі: реакторларды іске қосуға және жер қойнауынан мұнай мен кен іздеуге қолданылады. Калифорнияның атымен аталған.',
  'Мощный источник нейтронов: помогает запускать реакторы и искать нефть и руды в недрах. Назван в честь Калифорнии.',
  'A powerful neutron source used to start reactors and to search for oil and ores underground. Named after California.');
E('Es', 's', 860, null, 8.84, 1952, null, '+3',
  'Алғашқы сутек бомбасы сынағының (1952) қалдықтарынан табылған. Альберт Эйнштейннің құрметіне аталған.',
  'Найден в продуктах первого испытания водородной бомбы (1952). Назван в честь Альберта Эйнштейна.',
  'Found in the debris of the first hydrogen-bomb test in 1952. Named after Albert Einstein.');
E('Fm', '?', null, null, null, 1952, null, '+2, +3',
  'Бұл да сутек бомбасының сынағынан кейін табылған. Энрико Фермидің құрметіне аталған.',
  'Тоже найден после испытания водородной бомбы. Назван в честь Энрико Ферми.',
  'Also found after the hydrogen-bomb test. Named after Enrico Fermi.');
E('Md', '?', null, null, null, 1955, null, '+2, +3',
  'Периодтық кестені жасаған Дмитрий Менделеевтің құрметіне аталған. Оны бір мезгілде бірнеше атом ғана етіп алады.',
  'Назван в честь Дмитрия Менделеева — создателя периодической таблицы. Его получают буквально по нескольку атомов.',
  'Named after Dmitri Mendeleev, who created the periodic table. It is made only a few atoms at a time.');
E('No', '?', null, null, null, 1966, null, '+2, +3',
  'Альфред Нобельдің құрметіне аталған. Оны кім бірінші ашқаны туралы Швеция, АҚШ және КСРО ғалымдары ұзақ дауласқан.',
  'Назван в честь Альфреда Нобеля. О том, кто открыл его первым, долго спорили учёные Швеции, США и СССР.',
  'Named after Alfred Nobel. Scientists in Sweden, the USA and the USSR argued for years over who found it first.');
E('Lr', '?', null, null, null, 1961, null, '+3',
  'Циклотронды ойлап тапқан Эрнест Лоуренстің құрметіне аталған. Актиноидтардың соңғысы.',
  'Назван в честь Эрнеста Лоуренса, изобретателя циклотрона. Последний из актиноидов.',
  'Named after Ernest Lawrence, inventor of the cyclotron. The last of the actinides.');
E('Rf', '?', null, null, null, 1964, null, null,
  'Атом ядросын ашқан Эрнест Резерфордтың құрметіне аталған. Үдеткіштерде бірнеше атом түрінде ғана алынады.',
  'Назван в честь Эрнеста Резерфорда, открывшего атомное ядро. Получают лишь по нескольку атомов на ускорителях.',
  'Named after Ernest Rutherford, who discovered the atomic nucleus. Only a few atoms at a time are made in accelerators.');
E('Db', '?', null, null, null, 1968, null, null,
  'Біріккен ядролық зерттеулер институты орналасқан Дубна қаласының атымен аталған. Қазақстан да осы институтқа мүше елдердің бірі.',
  'Назван по городу Дубна, где работает Объединённый институт ядерных исследований. Казахстан — одна из стран-участниц этого института.',
  'Named after Dubna, home of the Joint Institute for Nuclear Research. Kazakhstan is one of the institute\'s member states.');

E('Sg', '?', null, null, null, 1974, null, null,
  'Гленн Сиборгтың құрметіне аталған — ол өз атымен элемент аталған кезде әлі тірі болған алғашқы ғалымдардың бірі.',
  'Назван в честь Гленна Сиборга — одного из первых учёных, в честь которых элемент назвали ещё при жизни.',
  'Named after Glenn Seaborg, one of the first scientists to have an element named after them while still alive.');
E('Bh', '?', null, null, null, 1981, null, null,
  'Атом құрылысын зерттеген Нильс Бордың құрметіне аталған. Германиядағы Дармштадт қаласында алынған.',
  'Назван в честь Нильса Бора, изучавшего строение атома. Получен в Дармштадте (Германия).',
  'Named after Niels Bohr, who studied the structure of the atom. First made in Darmstadt, Germany.');
E('Hs', '?', null, null, null, 1984, null, null,
  'Германиядағы Гессен жерінің латынша атымен аталған. Борий сияқты Дармштадтта алынған.',
  'Назван по латинскому имени германской земли Гессен. Как и борий, получен в Дармштадте.',
  'Named after the Latin name of the German state of Hesse. Like bohrium, it was made in Darmstadt.');
E('Mt', '?', null, null, null, 1982, null, null,
  'Ядроның бөлінуін түсіндіруге көмектескен физик Лиза Мейтнердің құрметіне аталған.',
  'Назван в честь Лизы Мейтнер — физика, которая помогла объяснить деление ядра.',
  'Named after Lise Meitner, the physicist who helped explain nuclear fission.');
E('Ds', '?', null, null, null, 1994, null, null,
  'Өзі алынған Дармштадт қаласының атымен аталған.',
  'Назван по городу Дармштадт, где его получили.',
  'Named after Darmstadt, the city where it was made.');
E('Rg', '?', null, null, null, 1994, null, null,
  'Рентген сәулелерін ашқан Вильгельм Рентгеннің құрметіне аталған.',
  'Назван в честь Вильгельма Рентгена, открывшего рентгеновские лучи.',
  'Named after Wilhelm Röntgen, who discovered X-rays.');
E('Cn', '?', null, null, null, 1996, null, null,
  'Күн жүйесінің ортасында Күн тұрғанын көрсеткен Николай Коперниктің құрметіне аталған.',
  'Назван в честь Николая Коперника, который поместил Солнце в центр Солнечной системы.',
  'Named after Nicolaus Copernicus, who put the Sun at the centre of the solar system.');
E('Nh', '?', null, null, null, 2004, null, null,
  'Жапонияда ашылған — Азияда ашылған алғашқы элемент. Атауы «Нихон», яғни «Жапония» сөзінен шыққан.',
  'Открыт в Японии — первый элемент, открытый в Азии. Название от «Нихон», то есть «Япония».',
  'Discovered in Japan, the first element found in Asia. Its name comes from "Nihon", Japan.');
E('Fl', '?', null, null, null, 1998, null, null,
  'Дубнадағы Флёров атындағы ядролық реакциялар зертханасының құрметіне аталған.',
  'Назван в честь Лаборатории ядерных реакций имени Флёрова в Дубне.',
  'Named after the Flerov Laboratory of Nuclear Reactions in Dubna.');
E('Mc', '?', null, null, null, 2003, null, null,
  'Дубна орналасқан Мәскеу облысының атымен аталған.',
  'Назван по Московской области, где находится Дубна.',
  'Named after the Moscow region, where Dubna is located.');
E('Lv', '?', null, null, null, 2000, null, null,
  'АҚШ-тағы Ливермор ұлттық зертханасының атымен аталған.',
  'Назван в честь Ливерморской национальной лаборатории в США.',
  'Named after the Lawrence Livermore National Laboratory in the USA.');
E('Ts', '?', null, null, null, 2010, null, null,
  'Ғалымдары оны ашуға көмектескен АҚШ-тың Теннесси штатының атымен аталған.',
  'Назван по штату Теннесси (США), учёные которого помогли его открыть.',
  'Named after the US state of Tennessee, whose scientists helped discover it.');
E('Og', '?', null, null, null, 2002, null, null,
  'Белгілі элементтердің ішіндегі ең ауыры, кестенің 7-периодын аяқтайды. Физик Юрий Оганесянның құрметіне аталған.',
  'Самый тяжёлый из известных элементов, завершает 7-й период. Назван в честь физика Юрия Оганесяна.',
  'The heaviest known element; it completes period 7. Named after the physicist Yuri Oganessian.');

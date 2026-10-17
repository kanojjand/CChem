// Texts for the gas card (colour, smell, how to recognise it, hazard) and for collecting gases.

import type { Lang } from '../engine/data';
import type { CollectMethod } from '../engine/gases';

export interface GasText { color: string; smell: string; test: string; hazard?: string }

export interface GasLabels {
  title: string; color: string; smell: string; density: string; lighter: string; heavier: string; same: string;
  solubility: string; test: string; hazard: string;
  /** Solubility in water: `v` volumes of gas per volume of water; `gas` picks the special cases (Br2, I2, NO2). */
  sol: (v: number, gas?: string) => string;
  method: { title: string; hint: string; names: Record<CollectMethod, string>; notes: Record<CollectMethod, string> };
  lost: {
    /** `partly`: some of the gas is still collected over water (CO2, H2S, Cl2). */
    dissolved: (gas: string, partly: boolean) => string;
    /** `density`: density relative to air. */
    escaped: (gas: string, density: number) => string;
  };
  gases: Record<string, GasText>;
}

const c = (v: number) => String(v).replace('.', ',');

// Density relative to air: lighter, heavier, or about the same (nitrogen, NO).
const side = (d: number) => (d < 0.93 ? 'lighter' : d > 1.07 ? 'heavier' : 'same');

const ru: GasLabels = {
  title: 'Газ', color: 'Цвет', smell: 'Запах', density: 'Плотность по воздуху', lighter: 'легче воздуха', heavier: 'тяжелее воздуха', same: 'почти как воздух',
  solubility: 'Растворимость в воде', test: 'Как узнать', hazard: 'Опасность',
  sol: (v, gas) => (gas === 'NO2' ? 'реагирует с водой: получаются азотная кислота и NO'
    : gas === 'Br2' ? 'заметная: около 3,5 г в 100 г воды («бромная вода»)'
    : gas === 'I2' ? 'очень плохая: около 0,03 г в 100 г воды'
    : v >= 100 ? `очень хорошая: ${c(v)} объёмов газа в 1 объёме воды`
    : v >= 10 ? `хорошая: ${c(v)} объёмов газа в 1 объёме воды`
    : v >= 0.5 ? `умеренная: ${c(v)} объёма газа в 1 объёме воды`
    : v > 0 ? `плохая: ${c(v)} объёма в 1 объёме воды`
    : 'NO₂ реагирует с водой, бром растворяется заметно, иод — очень плохо'),
  method: {
    title: 'Как собирать газ', hint: 'Способ зависит от того, растворяется ли газ в воде и легче он или тяжелее воздуха.',
    names: { water: 'Над водой', up: 'Пробирка вверх дном', down: 'Пробирка отверстием вверх' },
    notes: {
      water: 'Вытеснением воды: так собирают газы, которые плохо растворяются в воде — водород, кислород, азот.',
      up: 'Вытеснением воздуха, сосуд перевёрнут: так собирают газы легче воздуха — водород, аммиак.',
      down: 'Вытеснением воздуха, сосуд стоит отверстием вверх: так собирают газы тяжелее воздуха — кислород, углекислый газ, хлор.'
    }
  },
  lost: {
    dissolved: (g, partly) => partly
      ? `${g} частично растворяется в воде, и часть газа теряется. Лучше собирать его вытеснением воздуха.`
      : `${g} очень хорошо растворяется в воде (или реагирует с ней), поэтому над водой его не собрать. Собери его вытеснением воздуха.`,
    escaped: (g, d) => side(d) === 'same'
      ? `${g} почти такой же плотности, как воздух, и смешивается с ним — собирай его над водой.`
      : side(d) === 'lighter'
        ? `${g} легче воздуха и уходит из такой пробирки. Переверни пробирку вверх дном.`
        : `${g} тяжелее воздуха и уходит из такой пробирки. Поставь пробирку отверстием вверх.`
  },
  gases: {
    H2: { color: 'бесцветный', smell: 'без запаха', test: 'горит с хлопком (проба горящей лучинкой)', hazard: 'с воздухом образует взрывчатую смесь' },
    O2: { color: 'бесцветный', smell: 'без запаха', test: 'тлеющая лучинка вспыхивает' },
    N2: { color: 'бесцветный', smell: 'без запаха', test: 'лучинка гаснет, известковая вода не мутнеет' },
    CO2: { color: 'бесцветный', smell: 'без запаха', test: 'известковая вода мутнеет, горящая лучинка гаснет', hazard: 'в большом количестве вызывает удушье' },
    NH3: { color: 'бесцветный', smell: 'резкий, нашатырного спирта', test: 'влажный лакмус синеет, палочка с соляной кислотой «дымит»', hazard: 'ядовит, раздражает глаза и дыхательные пути' },
    HCl: { color: 'бесцветный, «дымит» во влажном воздухе', smell: 'резкий, кислый', test: 'влажный лакмус краснеет, с аммиаком даёт белый дым', hazard: 'ядовит, разъедает слизистые' },
    SO2: { color: 'бесцветный', smell: 'резкий, горелой спички', test: 'влажный лакмус краснеет, обесцвечивает раствор перманганата', hazard: 'ядовит' },
    H2S: { color: 'бесцветный', smell: 'тухлых яиц', test: 'бумажка с ацетатом свинца чернеет', hazard: 'очень ядовит; при большой концентрации запах перестаёт чувствоваться' },
    Cl2: { color: 'жёлто-зелёный', smell: 'резкий, удушливый, «хлорки»', test: 'иодкрахмальная бумажка синеет, влажный лакмус обесцвечивается', hazard: 'очень ядовит, работать только под тягой' },
    NO: { color: 'бесцветный, на воздухе сразу буреет', smell: 'на воздухе — резкий (превращается в NO₂)', test: 'на воздухе становится бурым', hazard: 'ядовит' },
    NO2: { color: 'бурый', smell: 'резкий, раздражающий', test: 'бурый цвет, иодкрахмальная бумажка синеет', hazard: 'очень ядовит' },
    Br2: { color: 'красно-бурые пары', smell: 'резкий, удушливый', test: 'иодкрахмальная бумажка синеет', hazard: 'пары ядовиты; жидкий бром обжигает кожу' },
    I2: { color: 'фиолетовые пары', smell: 'слабый, характерный', test: 'крахмал синеет', hazard: 'пары вредны' }
  }
};

const kk: GasLabels = {
  title: 'Газ', color: 'Түсі', smell: 'Иісі', density: 'Ауа бойынша тығыздығы', lighter: 'ауадан жеңіл', heavier: 'ауадан ауыр', same: 'ауамен шамалас',
  solubility: 'Судағы ерігіштігі', test: 'Қалай анықталады', hazard: 'Қауіптілігі',
  sol: (v, gas) => (gas === 'NO2' ? 'сумен әрекеттеседі: азот қышқылы мен NO түзіледі'
    : gas === 'Br2' ? 'айтарлықтай: 100 г суда шамамен 3,5 г («бромды су»)'
    : gas === 'I2' ? 'өте нашар: 100 г суда шамамен 0,03 г'
    : v >= 100 ? `өте жақсы: 1 көлем суда ${c(v)} көлем газ`
    : v >= 10 ? `жақсы: 1 көлем суда ${c(v)} көлем газ`
    : v >= 0.5 ? `орташа: 1 көлем суда ${c(v)} көлем газ`
    : v > 0 ? `нашар: 1 көлем суда ${c(v)} көлем`
    : 'NO₂ сумен әрекеттеседі, бром айтарлықтай ериді, йод — өте нашар'),
  method: {
    title: 'Газды қалай жинау керек', hint: 'Тәсіл газдың суда ерігіштігіне және ауадан жеңіл не ауыр болуына байланысты.',
    names: { water: 'Су үстінде', up: 'Пробирка төңкерулі', down: 'Пробирка аузы жоғары' },
    notes: {
      water: 'Суды ығыстыру арқылы: суда нашар еритін газдарды осылай жинайды — сутек, оттек, азот.',
      up: 'Ауаны ығыстыру арқылы, ыдыс төңкерулі: ауадан жеңіл газдарды осылай жинайды — сутек, аммиак.',
      down: 'Ауаны ығыстыру арқылы, ыдыстың аузы жоғары: ауадан ауыр газдарды осылай жинайды — оттек, көмірқышқыл газ, хлор.'
    }
  },
  lost: {
    dissolved: (g, partly) => partly
      ? `${g} суда ішінара ериді, газдың бір бөлігі жоғалады. Оны ауаны ығыстыру арқылы жинаған дұрыс.`
      : `${g} суда өте жақсы ериді (немесе сумен әрекеттеседі), сондықтан оны су үстінде жинау мүмкін емес. Оны ауаны ығыстыру арқылы жина.`,
    escaped: (g, d) => side(d) === 'same'
      ? `${g} тығыздығы ауамен шамалас, онымен араласып кетеді — оны су үстінде жина.`
      : side(d) === 'lighter'
        ? `${g} ауадан жеңіл, сондықтан мұндай пробиркадан шығып кетеді. Пробирканы төңкеріп қой.`
        : `${g} ауадан ауыр, сондықтан мұндай пробиркадан шығып кетеді. Пробирканы аузын жоғары қаратып қой.`
  },
  gases: {
    H2: { color: 'түссіз', smell: 'иіссіз', test: 'тарс етіп жанады (жанып тұрған шырпымен сынама)', hazard: 'ауамен жарылғыш қоспа түзеді' },
    O2: { color: 'түссіз', smell: 'иіссіз', test: 'бықсыған шырпы жалындап кетеді' },
    N2: { color: 'түссіз', smell: 'иіссіз', test: 'шырпы сөнеді, әк суы лайланбайды' },
    CO2: { color: 'түссіз', smell: 'иіссіз', test: 'әк суы лайланады, жанып тұрған шырпы сөнеді', hazard: 'көп мөлшерде тұншықтырады' },
    NH3: { color: 'түссіз', smell: 'өткір, нашатыр спиртінің иісі', test: 'дымқыл лакмус көгереді, тұз қышқылы малынған таяқша «түтіндейді»', hazard: 'улы, көз бен тыныс жолдарын тітіркендіреді' },
    HCl: { color: 'түссіз, дымқыл ауада «түтіндейді»', smell: 'өткір, қышқыл', test: 'дымқыл лакмус қызарады, аммиакпен ақ түтін береді', hazard: 'улы, шырышты қабықты күйдіреді' },
    SO2: { color: 'түссіз', smell: 'өткір, жанған сіріңкенің иісі', test: 'дымқыл лакмус қызарады, перманганат ерітіндісін түссіздендіреді', hazard: 'улы' },
    H2S: { color: 'түссіз', smell: 'шіріген жұмыртқаның иісі', test: 'қорғасын ацетаты сіңген қағаз қараяды', hazard: 'өте улы; концентрациясы жоғары болса, иісі сезілмей қалады' },
    Cl2: { color: 'сары-жасыл', smell: 'өткір, тұншықтырғыш, «хлорка» иісі', test: 'йодкрахмал қағазы көгереді, дымқыл лакмус түссізденеді', hazard: 'өте улы, тек тартпа шкафта жұмыс істеу керек' },
    NO: { color: 'түссіз, ауада бірден қоңырланады', smell: 'ауада — өткір (NO₂-ге айналады)', test: 'ауада қоңыр түске енеді', hazard: 'улы' },
    NO2: { color: 'қоңыр', smell: 'өткір, тітіркендіргіш', test: 'қоңыр түсі, йодкрахмал қағазы көгереді', hazard: 'өте улы' },
    Br2: { color: 'қызыл-қоңыр булар', smell: 'өткір, тұншықтырғыш', test: 'йодкрахмал қағазы көгереді', hazard: 'булары улы; сұйық бром теріні күйдіреді' },
    I2: { color: 'күлгін булар', smell: 'әлсіз, өзіне тән', test: 'крахмал көгереді', hazard: 'булары зиянды' }
  }
};

const en: GasLabels = {
  title: 'Gas', color: 'Colour', smell: 'Smell', density: 'Density relative to air', lighter: 'lighter than air', heavier: 'heavier than air', same: 'about as heavy as air',
  solubility: 'Solubility in water', test: 'How to recognise it', hazard: 'Hazard',
  sol: (v, gas) => (gas === 'NO2' ? 'reacts with water, giving nitric acid and NO'
    : gas === 'Br2' ? 'noticeable: about 3.5 g per 100 g of water ("bromine water")'
    : gas === 'I2' ? 'very poor: about 0.03 g per 100 g of water'
    : v >= 100 ? `very high: ${v} volumes of gas in 1 volume of water`
    : v >= 10 ? `good: ${v} volumes of gas in 1 volume of water`
    : v >= 0.5 ? `moderate: ${v} volumes of gas in 1 volume of water`
    : v > 0 ? `poor: ${v} volumes in 1 volume of water`
    : 'NO₂ reacts with water, bromine dissolves noticeably, iodine very poorly'),
  method: {
    title: 'How to collect the gas', hint: 'The method depends on whether the gas dissolves in water and whether it is lighter or heavier than air.',
    names: { water: 'Over water', up: 'Tube upside down', down: 'Tube mouth up' },
    notes: {
      water: 'By displacing water: for gases that hardly dissolve in water, such as hydrogen, oxygen and nitrogen.',
      up: 'By displacing air with the tube upside down: for gases lighter than air, such as hydrogen and ammonia.',
      down: 'By displacing air with the tube mouth up: for gases heavier than air, such as oxygen, carbon dioxide and chlorine.'
    }
  },
  lost: {
    dissolved: (g, partly) => partly
      ? `${g} partly dissolves in water, so some of it is lost. Better collect it by displacing air.`
      : `${g} dissolves very well in water (or reacts with it), so it cannot be collected over water. Collect it by displacing air.`,
    escaped: (g, d) => side(d) === 'same'
      ? `${g} weighs about the same as air and mixes with it, so collect it over water.`
      : side(d) === 'lighter'
        ? `${g} is lighter than air and leaves a tube held this way. Turn the tube upside down.`
        : `${g} is heavier than air and leaves a tube held this way. Hold the tube mouth up.`
  },
  gases: {
    H2: { color: 'colourless', smell: 'odourless', test: 'burns with a pop (burning splint)', hazard: 'forms an explosive mixture with air' },
    O2: { color: 'colourless', smell: 'odourless', test: 'relights a glowing splint' },
    N2: { color: 'colourless', smell: 'odourless', test: 'puts out a splint, does not turn limewater cloudy' },
    CO2: { color: 'colourless', smell: 'odourless', test: 'turns limewater cloudy, puts out a burning splint', hazard: 'in large amounts it suffocates' },
    NH3: { color: 'colourless', smell: 'sharp, of smelling salts', test: 'turns damp litmus blue; a rod with hydrochloric acid gives white smoke', hazard: 'toxic, irritates eyes and airways' },
    HCl: { color: 'colourless, fumes in moist air', smell: 'sharp, acidic', test: 'turns damp litmus red; gives white smoke with ammonia', hazard: 'toxic, corrodes mucous membranes' },
    SO2: { color: 'colourless', smell: 'sharp, of a struck match', test: 'turns damp litmus red, decolourises permanganate solution', hazard: 'toxic' },
    H2S: { color: 'colourless', smell: 'of rotten eggs', test: 'blackens lead acetate paper', hazard: 'very toxic; at high levels you stop smelling it' },
    Cl2: { color: 'yellow-green', smell: 'sharp, choking, like bleach', test: 'turns starch-iodide paper blue, bleaches damp litmus', hazard: 'very toxic, fume hood only' },
    NO: { color: 'colourless, turns brown in air at once', smell: 'sharp in air (turns into NO₂)', test: 'turns brown in air', hazard: 'toxic' },
    NO2: { color: 'brown', smell: 'sharp, irritating', test: 'brown colour; turns starch-iodide paper blue', hazard: 'very toxic' },
    Br2: { color: 'red-brown vapour', smell: 'sharp, choking', test: 'turns starch-iodide paper blue', hazard: 'the vapour is toxic; liquid bromine burns the skin' },
    I2: { color: 'violet vapour', smell: 'faint, characteristic', test: 'turns starch blue', hazard: 'the vapour is harmful' }
  }
};

export const GAS_TEXTS: Record<Lang, GasLabels> = { ru, kk, en };

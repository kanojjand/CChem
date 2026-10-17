// Interface labels for the separation tools (filter, magnet, flame test) and the new vessel states.

import type { Lang } from '../engine/data';

export interface LabMore {
  sep: {
    title: string; hint: string;
    filter: string; filterHint: string; filterInto: string;
    magnet: string; magnetHint: string;
    flame: string; flameHint: string; flameNone: string;
  };
  state: { boiling: string; bp: (t: string) => string; dry: string; melted: string; ice: string; steam: string };
  inVessel: string;
  ui: {
    reset: string; resetDone: string; nothingToReset: string;
    pickTitle: string; pickHint: string; capacity: (ml: number) => string; placedTube: string;
    focus: string; focusHint: string; overview: string; ionic: string;
    amountHint: string;
  };
  pt: { period: string; group: string; lanthanides: string; actinides: string; showAll: string };
}

export const LAB_MORE: Record<Lang, LabMore> = {
  ru: {
    sep: {
      title: 'Разделение и пробы', hint: 'Фильтрование, магнит и окрашивание пламени — способы разделить смесь и узнать, что в ней.',
      filter: 'Профильтровать в…', filterHint: 'Через фильтр проходит только жидкость, твёрдые частицы остаются на бумаге.', filterInto: 'Фильтрат в',
      magnet: 'Поднести магнит', magnetHint: 'Магнит притягивает железо и никель.',
      flame: 'Внести в пламя', flameHint: 'Проволочку смачивают раствором и вносят в пламя: ионы металлов окрашивают его.', flameNone: 'Пламя не изменилось'
    },
    state: { boiling: 'кипит', bp: (t) => `кипит при ${t} °C`, dry: 'вода выкипела', melted: 'расплав', ice: 'лёд', steam: 'пар' },
    inVessel: 'В сосуде',
    ui: {
      reset: 'Начать заново', resetDone: 'Стол пуст — выбери посуду. Передумал? Нажми «Отменить».', nothingToReset: 'Стол и так пуст',
      pickTitle: 'Выбери посуду', pickHint: 'Нажми, чтобы поставить на стол. Можно поставить несколько.', capacity: (ml) => `до ${ml} мл`,
      placedTube: 'На стол поставлена пробирка',
      focus: 'Крупно', focusHint: 'Показать выбранный сосуд крупно в центре (или двойной щелчок по сосуду)', overview: 'Весь стол',
      ionic: 'Ионные уравнения', amountHint: 'Сколько наливать и насыпать за одно нажатие на банку. Индикатор — 2 капли.'
    },
    pt: { period: 'Период', group: 'Группа', lanthanides: 'Лантаноиды', actinides: 'Актиноиды', showAll: 'Показать все' }
  },
  kk: {
    sep: {
      title: 'Бөлу және сынамалар', hint: 'Сүзу, магнит және жалынның боялуы — қоспаны бөлу және оның құрамын анықтау тәсілдері.',
      filter: 'Сүзіп құю…', filterHint: 'Сүзгіден тек сұйықтық өтеді, қатты бөлшектер қағазда қалады.', filterInto: 'Фильтрат',
      magnet: 'Магнит жақындату', magnetHint: 'Магнит темір мен никельді тартады.',
      flame: 'Жалынға енгізу', flameHint: 'Сымды ерітіндіге малып, жалынға енгізеді: металл иондары жалынды бояйды.', flameNone: 'Жалын өзгерген жоқ'
    },
    state: { boiling: 'қайнап жатыр', bp: (t) => `${t} °C-та қайнайды`, dry: 'су буланып кетті', melted: 'балқыма', ice: 'мұз', steam: 'бу' },
    inVessel: 'Ыдыста',
    ui: {
      reset: 'Басынан бастау', resetDone: 'Үстел бос — ыдыс таңда. Ойыңнан қайттың ба? «Болдырмау» бас.', nothingToReset: 'Үстел онсыз да бос',
      pickTitle: 'Ыдыс таңда', pickHint: 'Үстелге қою үшін бас. Бірнешеуін қоюға болады.', capacity: (ml) => `${ml} мл-ге дейін`,
      placedTube: 'Үстелге сынауық қойылды',
      focus: 'Ірі', focusHint: 'Таңдалған ыдысты ортада ірі көрсету (немесе ыдысты екі рет шерту)', overview: 'Бүкіл үстел',
      ionic: 'Иондық теңдеулер', amountHint: 'Банкаға бір басқанда қанша құйылады және себіледі. Индикатор — 2 тамшы.'
    },
    pt: { period: 'Период', group: 'Топ', lanthanides: 'Лантаноидтар', actinides: 'Актиноидтар', showAll: 'Барлығын көрсету' }
  },
  en: {
    sep: {
      title: 'Separation and tests', hint: 'Filtering, a magnet and flame colors: ways to separate a mixture and find out what is in it.',
      filter: 'Filter into…', filterHint: 'Only the liquid passes through the filter; solid bits stay on the paper.', filterInto: 'Filtrate into',
      magnet: 'Hold a magnet', magnetHint: 'A magnet pulls iron and nickel.',
      flame: 'Flame test', flameHint: 'A wire loop is dipped into the solution and held in the flame: metal ions color it.', flameNone: 'The flame did not change'
    },
    state: { boiling: 'boiling', bp: (t) => `boils at ${t} °C`, dry: 'boiled dry', melted: 'melt', ice: 'ice', steam: 'steam' },
    inVessel: 'In the vessel',
    ui: {
      reset: 'Start over', resetDone: 'The bench is empty: choose glassware. Changed your mind? Press Undo.', nothingToReset: 'The bench is already empty',
      pickTitle: 'Choose glassware', pickHint: 'Tap to put it on the bench. You can add several.', capacity: (ml) => `up to ${ml} mL`,
      placedTube: 'A test tube was put on the bench',
      focus: 'Zoom', focusHint: 'Show the selected vessel large in the middle (or double-click a vessel)', overview: 'Whole bench',
      ionic: 'Ionic equations', amountHint: 'How much one tap on a bottle pours or adds. Indicators: 2 drops.'
    },
    pt: { period: 'Period', group: 'Group', lanthanides: 'Lanthanides', actinides: 'Actinides', showAll: 'Show all' }
  }
};

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
}

export const LAB_MORE: Record<Lang, LabMore> = {
  ru: {
    sep: {
      title: 'Разделение и пробы', hint: 'Фильтрование, магнит и окрашивание пламени — способы разделить смесь и узнать, что в ней.',
      filter: 'Профильтровать в…', filterHint: 'Через фильтр проходит только жидкость, твёрдые частицы остаются на бумаге.', filterInto: 'Фильтрат в',
      magnet: 'Поднести магнит', magnetHint: 'Магнит притягивает железо и никель.',
      flame: 'Внести в пламя', flameHint: 'Проволочку смачивают раствором и вносят в пламя: ионы металлов окрашивают его.', flameNone: 'Пламя не изменилось'
    },
    state: { boiling: 'кипит', bp: (t) => `кипит при ${t} °C`, dry: 'вода выкипела', melted: 'расплав', ice: 'лёд', steam: 'пар' }
  },
  kk: {
    sep: {
      title: 'Бөлу және сынамалар', hint: 'Сүзу, магнит және жалынның боялуы — қоспаны бөлу және оның құрамын анықтау тәсілдері.',
      filter: 'Сүзіп құю…', filterHint: 'Сүзгіден тек сұйықтық өтеді, қатты бөлшектер қағазда қалады.', filterInto: 'Фильтрат',
      magnet: 'Магнит жақындату', magnetHint: 'Магнит темір мен никельді тартады.',
      flame: 'Жалынға енгізу', flameHint: 'Сымды ерітіндіге малып, жалынға енгізеді: металл иондары жалынды бояйды.', flameNone: 'Жалын өзгерген жоқ'
    },
    state: { boiling: 'қайнап жатыр', bp: (t) => `${t} °C-та қайнайды`, dry: 'су буланып кетті', melted: 'балқыма', ice: 'мұз', steam: 'бу' }
  },
  en: {
    sep: {
      title: 'Separation and tests', hint: 'Filtering, a magnet and flame colors: ways to separate a mixture and find out what is in it.',
      filter: 'Filter into…', filterHint: 'Only the liquid passes through the filter; solid bits stay on the paper.', filterInto: 'Filtrate into',
      magnet: 'Hold a magnet', magnetHint: 'A magnet pulls iron and nickel.',
      flame: 'Flame test', flameHint: 'A wire loop is dipped into the solution and held in the flame: metal ions color it.', flameNone: 'The flame did not change'
    },
    state: { boiling: 'boiling', bp: (t) => `boils at ${t} °C`, dry: 'boiled dry', melted: 'melt', ice: 'ice', steam: 'steam' }
  }
};

// Interface texts for the apparatus, accounts and the admin panel, in three languages.

import type { Lang } from '../engine/data';
import type { VesselKind } from '../engine/vessel';
import type { GasTool } from '../engine/apparatus';

export interface Extra {
  amount: { liquid: string; solid: string; ml: string; g: string; drops: string; hint: string };
  compareLiquid: (ml: number) => string;
  compareSolid: (g: number) => string;
  speed: { label: string; hint: string };
  vessel: Record<VesselKind, string>;
  vesselShort: Record<VesselKind, string>;
  addVessel: string;
  removeVessel: string;
  noRoom: string;
  broken: { title: string; text: string; replace: string };
  spill: (ml: string) => string;
  partialPour: (ml: string) => string;
  tube: { label: string; none: string; to: string; hint: string; badge: (to: string) => string };
  collector: { name: string; empty: string; volume: string; of: string; composition: string; release: string; how: string; connect: string };
  tools: { title: string; hint: string; names: Record<GasTool, string> };
  burette: {
    name: string; attach: string; detach: string; titrant: string; used: string; left: string;
    drop: string; half: string; one: string; open: string; close: string; curve: string; axisV: string;
    endpoint: (v: string) => string; calc: string; formula: string; unknown: string; check: string;
    right: (c: string) => string; wrong: string; start: string; noIndicator: string;
  };
  electro: { name: string; on: string; off: string; bulb: Record<'none' | 'weak' | 'strong', string>; cathode: string; anode: string; plated: string; hint: string };
  numbers: { title: string; formed: string; gasOut: string };
  life: string;
  info: { open: string; life: string; hazard: string; molar: string; grade: (n: number) => string; concentration: string };
  account: {
    login: string; register: string; nickname: string; password: string; grade: string; submit: string; logout: string;
    haveAccount: string; noAccount: string; privacy: string; saved: string; guest: string; admin: string;
    adminCode: string; adminClaim: string; adminOk: string; welcome: (n: string) => string;
    errors: Record<'nickname' | 'password' | 'taken' | 'wrong' | 'locked' | 'network' | 'code', string>;
    offline: string;
  };
  admin: {
    title: string; back: string; period: string; days: (n: number) => string; refresh: string; forbidden: string; loading: string;
    visitsToday: string; visitors: string; visits: string; accounts: string; active7: string; experiments: string; newAccounts: string;
    chartVisits: string; chartActivity: string; devices: string; langs: string; grades: string; topReactions: string; users: string;
    nickname: string; role: string; lastSeen: string; created: string; discoveries: string; count: string; none: string;
    roles: Record<'student' | 'teacher' | 'admin', string>; deviceNames: Record<'phone' | 'tablet' | 'desktop' | 'unknown', string>;
    legendVisits: string; legendVisitors: string; legendExperiments: string; legendSignups: string; unknown: string;
    kinds: Record<string, string>;
  };
}

const n1 = (x: number, lang: Lang) => {
  const s = x >= 10 ? Math.round(x).toString() : (Math.round(x * 100) / 100).toString();
  return lang === 'en' ? s : s.replace('.', ',');
};

// Everyday comparisons for amounts (1 mL ≈ 20 drops, teaspoon ≈ 5 mL, glass ≈ 200 mL;
// teaspoon of salt ≈ 6 g, a pea-sized piece ≈ 0.1–0.2 g).
function liquidRu(ml: number) {
  if (ml <= 0.07) return '≈ 1 капля';
  if (ml < 0.9) return `≈ ${Math.round(ml * 20)} капель`;
  if (ml < 2.5) return `≈ ${Math.round(ml * 20)} капель`;
  if (ml < 10) return '≈ чайная ложка';
  if (ml < 30) return '≈ столовая ложка';
  if (ml < 75) return '≈ четверть стакана';
  if (ml < 150) return '≈ полстакана';
  return '≈ стакан';
}
function solidRu(g: number) {
  if (g < 0.08) return '≈ крупинка';
  if (g < 0.3) return '≈ горошина';
  if (g < 0.8) return '≈ щепотка';
  if (g < 3) return '≈ треть чайной ложки';
  if (g < 8) return '≈ чайная ложка';
  if (g < 25) return '≈ столовая ложка';
  return '≈ горсть';
}
function liquidKk(ml: number) {
  if (ml <= 0.07) return '≈ 1 тамшы';
  if (ml < 2.5) return `≈ ${Math.round(ml * 20)} тамшы`;
  if (ml < 10) return '≈ шай қасық';
  if (ml < 30) return '≈ ас қасық';
  if (ml < 75) return '≈ стақанның төрттен бірі';
  if (ml < 150) return '≈ жарты стақан';
  return '≈ бір стақан';
}
function solidKk(g: number) {
  if (g < 0.08) return '≈ бір түйір';
  if (g < 0.3) return '≈ бұршақтай';
  if (g < 0.8) return '≈ бір шымшым';
  if (g < 3) return '≈ шай қасықтың үштен бірі';
  if (g < 8) return '≈ шай қасық';
  if (g < 25) return '≈ ас қасық';
  return '≈ бір уыс';
}
function liquidEn(ml: number) {
  if (ml <= 0.07) return '≈ 1 drop';
  if (ml < 2.5) return `≈ ${Math.round(ml * 20)} drops`;
  if (ml < 10) return '≈ a teaspoon';
  if (ml < 30) return '≈ a tablespoon';
  if (ml < 75) return '≈ a quarter of a glass';
  if (ml < 150) return '≈ half a glass';
  return '≈ a glass';
}
function solidEn(g: number) {
  if (g < 0.08) return '≈ a grain';
  if (g < 0.3) return '≈ a pea';
  if (g < 0.8) return '≈ a pinch';
  if (g < 3) return '≈ a third of a teaspoon';
  if (g < 8) return '≈ a teaspoon';
  if (g < 25) return '≈ a tablespoon';
  return '≈ a handful';
}

const ru: Extra = {
  amount: { liquid: 'Налить', solid: 'Насыпать', ml: 'мл', g: 'г', drops: 'Индикатор — 2 капли', hint: 'Сколько добавлять, когда нажимаешь на банку' },
  compareLiquid: liquidRu,
  compareSolid: solidRu,
  speed: { label: 'Время', hint: 'Ускорь время: нагрев, электролиз и титрование пойдут быстрее' },
  vessel: { tube: 'Пробирка, 20 мл', beaker: 'Стакан, 100 мл', beaker250: 'Стакан, 250 мл', flask: 'Колба, 250 мл' },
  vesselShort: { tube: 'Пробирка', beaker: 'Стакан', beaker250: 'Стакан', flask: 'Колба' },
  addVessel: 'Посуда',
  removeVessel: 'Убрать со стола',
  noRoom: 'На столе больше нет места',
  broken: { title: 'Сосуд разбился', text: 'Реакция была слишком бурной, и стекло не выдержало. Содержимое разлилось. Возьми новый сосуд.', replace: 'Взять новый' },
  spill: (ml) => `Не поместилось ${ml} мл — жидкость перелилась через край`,
  partialPour: (ml) => `Перелито ${ml} мл — больше не поместилось`,
  tube: { label: 'Газоотводная трубка', none: 'Нет', to: 'Газ пойдёт в', hint: 'Газ из этого сосуда пойдёт по трубке в газосборник или в другой сосуд.', badge: (to) => `трубка → ${to}` },
  collector: { name: 'Газосборник', empty: 'Газ ещё не собран', volume: 'Собрано газа', of: 'из 100 мл', composition: 'Состав', release: 'Выпустить газ', how: 'Газ собирают вытеснением воды: цилиндр с водой перевёрнут в кювете, газ поднимается и вытесняет воду.', connect: 'Подключи газоотводную трубку к сосуду, где выделяется газ: открой сосуд и выбери «Газоотводная трубка → Газосборник».' },
  tools: { title: 'Проверить газ', hint: 'Проверка газа, который сейчас выделяется', names: { glowing: 'Тлеющая лучинка', burning: 'Горящая лучинка', litmus: 'Влажный лакмус', limewater: 'Известковая вода', smell: 'Понюхать (направляя рукой)', starchKI: 'Йодкрахмальная бумажка', leadPaper: 'Бумажка с ацетатом свинца', hclRod: 'Палочка с конц. HCl' } },
  burette: {
    name: 'Бюретка', attach: 'Поставить бюретку', detach: 'Убрать бюретку', titrant: 'В бюретке', used: 'Израсходовано', left: 'Осталось',
    drop: '1 капля', half: '+0,5 мл', one: '+1 мл', open: 'Открыть кран', close: 'Закрыть кран', curve: 'Кривая титрования', axisV: 'мл',
    endpoint: (v) => `Индикатор изменил цвет при ${v} мл`, calc: 'Расчёт',
    formula: 'C(кислоты) = C(щёлочи) × V(щёлочи) ÷ V(кислоты) (для HCl и NaOH)', unknown: 'Твой ответ: концентрация кислоты X, моль/л', check: 'Проверить',
    right: (c) => `Верно! Концентрация кислоты X — ${c} моль/л`, wrong: 'Пока неточно. Проверь расчёт по формуле.',
    start: 'Налей в колбу кислоту, добавь индикатор и открывай кран понемногу.', noIndicator: 'Добавь индикатор, например фенолфталеин, иначе момент нейтрализации не увидеть.'
  },
  electro: { name: 'Электроды', on: 'Опустить электроды', off: 'Вынуть электроды', bulb: { none: 'Лампочка не горит', weak: 'Лампочка горит тускло', strong: 'Лампочка горит ярко' }, cathode: 'Катод (−)', anode: 'Анод (+)', plated: 'На катоде осело', hint: 'Графитовые электроды, ток 1 А. Ускорь время, чтобы увидеть результат быстрее.' },
  numbers: { title: 'В числах', formed: 'Образовалось', gasOut: 'Выделилось газа' },
  life: 'В жизни',
  info: { open: 'О веществе', life: 'В быту', hazard: 'Осторожно', molar: 'Молярная масса', grade: (n) => `В программе с ${n} класса`, concentration: 'Концентрация' },
  account: {
    login: 'Войти', register: 'Регистрация', nickname: 'Никнейм', password: 'Пароль (от 6 символов)', grade: 'Класс', submit: 'Готово', logout: 'Выйти',
    haveAccount: 'Уже есть аккаунт? Войти', noAccount: 'Нет аккаунта? Зарегистрироваться',
    privacy: 'Мы не просим почту, телефон и настоящее имя. Сохраняются только никнейм, класс и твои открытия.',
    saved: 'Прогресс сохранён', guest: 'Войти', admin: 'Админ-панель', adminCode: 'Код администратора', adminClaim: 'Получить права администратора',
    adminOk: 'Готово: теперь у тебя есть доступ к админ-панели', welcome: (n) => `Привет, ${n}!`,
    errors: { nickname: 'Никнейм — от 3 до 24 символов, без @, < > и /', password: 'Пароль — от 6 до 72 символов', taken: 'Такой никнейм уже занят', wrong: 'Неверный никнейм или пароль', locked: 'Слишком много попыток. Подожди 10 минут', network: 'Нет связи с сервером. Проверь интернет', code: 'Неверный код' },
    offline: 'Аккаунты недоступны: сервер не настроен'
  },
  admin: {
    title: 'Админ-панель', back: 'В лабораторию', period: 'Период', days: (n) => `${n} дн.`, refresh: 'Обновить', forbidden: 'Нужны права администратора. Войди под аккаунтом администратора.', loading: 'Загрузка…',
    visitsToday: 'Визитов сегодня', visitors: 'Посетителей', visits: 'Визитов', accounts: 'Аккаунтов', active7: 'Активны за 7 дней', experiments: 'Опытов', newAccounts: 'Новых аккаунтов',
    chartVisits: 'Посещаемость по дням', chartActivity: 'Опыты по дням', devices: 'Устройства', langs: 'Языки', grades: 'Классы', topReactions: 'Популярные реакции', users: 'Пользователи',
    nickname: 'Никнейм', role: 'Роль', lastSeen: 'Последний визит', created: 'Регистрация', discoveries: 'Открытий', count: 'Раз', none: 'Пока нет данных',
    roles: { student: 'ученик', teacher: 'учитель', admin: 'админ' }, deviceNames: { phone: 'телефон', tablet: 'планшет', desktop: 'компьютер', unknown: 'неизвестно' },
    legendVisits: 'визиты', legendVisitors: 'посетители', legendExperiments: 'опыты', legendSignups: 'регистрации', unknown: 'не указан',
    kinds: { precip: 'Осадок', neutralization: 'Нейтрализация', gasCO2: 'Углекислый газ', metalAcid: 'Металл + кислота', activeMetalWater: 'Металл + вода', metalSalt: 'Металл + соль', indicator: 'Индикатор', electrolysis: 'Электролиз', gasTest: 'Проверка газа', co2Limewater: 'CO₂ + известковая вода', limewaterClears: 'Избыток CO₂', gasAbsorbed: 'Поглощение газа', fe3scn: 'Fe³⁺ + роданид', ammine: 'Аммиакат', amphoteric: 'Амфотерность', dissolveAcid: 'Растворение в кислоте', h2o2: 'Разложение H₂O₂', oxideWater: 'Оксид + вода', hydroxideDecomp: 'Разложение при нагреве', sugarChar: 'Обугливание сахара', dilutionSafe: 'Разбавление кислоты', dilutionUnsafe: 'Вода в кислоту', exchangeNone: 'Нет обмена', metalAcidNone: 'Металл не реагирует', metalSaltNone: 'Нет вытеснения', noCurrent: 'Нет тока', boiling: 'Кипение', dissolve: 'Растворение', ammonia: 'Аммиак', metalNitric: 'Металл + HNO₃', sulfideAcid: 'Сульфид + кислота', sulfiteAcid: 'Сульфит + кислота', thiosulfateAcid: 'Тиосульфат + кислота', chromateAcid: 'Хромат → дихромат', dichromateBase: 'Дихромат → хромат', halogenDisplace: 'Вытеснение галогена', iodideOx: 'Окисление иодида', starchIodine: 'Иод + крахмал', bleach: 'Отбеливание хлором', permanganateRedox: 'Перманганат в кислоте', dichromateRedox: 'Дихромат в кислоте', sulfideHydrolysis: 'Гидролиз сульфида', metalSulfur: 'Металл + сера', carbonReduce: 'Восстановление углём', thermalDecomp: 'Разложение при нагреве', volcano: 'Вулкан', hardWater: 'Накипь', adsorption: 'Адсорбция', leadFilm: 'Плёнка на свинце', dissolveHot: 'Растворение в горячей воде', flameTest: 'Окрашивание пламени', magnet: 'Магнит', filtered: 'Фильтрование', dryOut: 'Выпаривание', crystallize: 'Кристаллизация', melting: 'Плавление', sublimation: 'Возгонка', distillation: 'Перегонка', iceMelt: 'Таяние льда', gasOut: 'Газ из раствора', floats: 'Флотация', dissolveCold: 'Растворение с охлаждением', dissolveHotSolid: 'Растворение с нагревом',
      iron3Metal: 'Fe³⁺ + металл', hclPrep: 'Получение HCl', ammoniaPrep: 'Получение аммиака', chlorinePrep: 'Получение хлора', metalHotWater: 'Металл + горячая вода', sulfateFilm: 'Сульфатная корка', iron2Ox: 'Fe²⁺ → Fe³⁺', iron3Reduce: 'Fe³⁺ → Fe²⁺', halogenAlkali: 'Галоген + щёлочь', halogenThio: 'Галоген + тиосульфат', halogenReduce: 'Обесцвечивание галогена', sulfurComprop: 'SO₂ + H₂S → S', carbonicSilicate: 'CO₂ + силикат', aluminateAcid: 'Алюминат → Al(OH)₃', metalAmmonium: 'Металл + соль аммония', nitricRedox: 'HNO₃ — окислитель', hydroxideAir: 'Окисление на воздухе', concOxidation: 'Конц. кислота — окислитель', dehydration: 'Дегидратация', nitricPrep: 'HNO₃ из нитрата', heatInAir: 'Нагревание на воздухе', solFormation: 'Золь', colorFade: 'Окраска бледнеет при нагреве' }
  }
};

const kk: Extra = {
  amount: { liquid: 'Құю', solid: 'Салу', ml: 'мл', g: 'г', drops: 'Индикатор — 2 тамшы', hint: 'Банканы басқанда қанша қосылатыны' },
  compareLiquid: liquidKk,
  compareSolid: solidKk,
  speed: { label: 'Уақыт', hint: 'Уақытты жеделдет: қыздыру, электролиз және титрлеу тезірек жүреді' },
  vessel: { tube: 'Пробирка, 20 мл', beaker: 'Стакан, 100 мл', beaker250: 'Стакан, 250 мл', flask: 'Колба, 250 мл' },
  vesselShort: { tube: 'Пробирка', beaker: 'Стакан', beaker250: 'Стакан', flask: 'Колба' },
  addVessel: 'Ыдыс',
  removeVessel: 'Үстелден алу',
  noRoom: 'Үстелде орын қалмады',
  broken: { title: 'Ыдыс сынды', text: 'Реакция тым қарқынды болды, шыны шыдамады. Ішіндегісі төгілді. Жаңа ыдыс ал.', replace: 'Жаңасын алу' },
  spill: (ml) => `${ml} мл сыймады — сұйықтық жиектен асып төгілді`,
  partialPour: (ml) => `${ml} мл құйылды — артығы сыймады`,
  tube: { label: 'Газ өткізгіш түтік', none: 'Жоқ', to: 'Газ мұнда барады', hint: 'Бұл ыдыстағы газ түтік арқылы газ жинағышқа немесе басқа ыдысқа барады.', badge: (to) => `түтік → ${to}` },
  collector: { name: 'Газ жинағыш', empty: 'Газ әлі жиналған жоқ', volume: 'Жиналған газ', of: '100 мл-ден', composition: 'Құрамы', release: 'Газды шығару', how: 'Газды суды ығыстыру арқылы жинайды: суы бар цилиндр кюветада төңкеріліп тұрады, газ көтеріліп, суды ығыстырады.', connect: 'Газ бөлінетін ыдысқа газ өткізгіш түтік жалға: ыдысты ашып, «Газ өткізгіш түтік → Газ жинағыш» таңда.' },
  tools: { title: 'Газды тексеру', hint: 'Қазір бөлініп жатқан газды тексеру', names: { glowing: 'Бықсыған шырпы', burning: 'Жанып тұрған шырпы', litmus: 'Дымқыл лакмус', limewater: 'Әк суы', smell: 'Иіскеу (қолмен желпіп)', starchKI: 'Йодкрахмал қағазы', leadPaper: 'Қорғасын ацетаты сіңген қағаз', hclRod: 'Конц. HCl малынған таяқша' } },
  burette: {
    name: 'Бюретка', attach: 'Бюретканы орнату', detach: 'Бюретканы алу', titrant: 'Бюреткада', used: 'Жұмсалды', left: 'Қалды',
    drop: '1 тамшы', half: '+0,5 мл', one: '+1 мл', open: 'Кранды ашу', close: 'Кранды жабу', curve: 'Титрлеу қисығы', axisV: 'мл',
    endpoint: (v) => `Индикатор ${v} мл-де түсін өзгертті`, calc: 'Есептеу',
    formula: 'C(қышқыл) = C(сілті) × V(сілті) ÷ V(қышқыл) (HCl мен NaOH үшін)', unknown: 'Сенің жауабың: X қышқылының концентрациясы, моль/л', check: 'Тексеру',
    right: (c) => `Дұрыс! X қышқылының концентрациясы — ${c} моль/л`, wrong: 'Әзірге дәл емес. Формула бойынша есепті тексер.',
    start: 'Колбаға қышқыл құй, индикатор қос та, кранды аздап аш.', noIndicator: 'Индикатор қос, мысалы фенолфталеин, әйтпесе бейтараптану сәтін көре алмайсың.'
  },
  electro: { name: 'Электродтар', on: 'Электродтарды түсіру', off: 'Электродтарды шығару', bulb: { none: 'Шам жанбайды', weak: 'Шам күңгірт жанады', strong: 'Шам жарқырап жанады' }, cathode: 'Катод (−)', anode: 'Анод (+)', plated: 'Катодқа қонды', hint: 'Графит электродтар, ток 1 А. Нәтижені тезірек көру үшін уақытты жеделдет.' },
  numbers: { title: 'Сандармен', formed: 'Түзілді', gasOut: 'Бөлінген газ' },
  life: 'Өмірде',
  info: { open: 'Зат туралы', life: 'Тұрмыста', hazard: 'Абай бол', molar: 'Молярлық масса', grade: (n) => `Бағдарламада ${n}-сыныптан бастап`, concentration: 'Концентрация' },
  account: {
    login: 'Кіру', register: 'Тіркелу', nickname: 'Никнейм', password: 'Құпиясөз (6 таңбадан бастап)', grade: 'Сынып', submit: 'Дайын', logout: 'Шығу',
    haveAccount: 'Аккаунтың бар ма? Кіру', noAccount: 'Аккаунтың жоқ па? Тіркелу',
    privacy: 'Біз поштаны, телефонды және шын атыңды сұрамаймыз. Тек никнейм, сынып және ашқан жаңалықтарың сақталады.',
    saved: 'Прогресс сақталды', guest: 'Кіру', admin: 'Әкімші панелі', adminCode: 'Әкімші коды', adminClaim: 'Әкімші құқығын алу',
    adminOk: 'Дайын: енді әкімші панеліне кіре аласың', welcome: (n) => `Сәлем, ${n}!`,
    errors: { nickname: 'Никнейм — 3-тен 24 таңбаға дейін, @, < > және / белгілерінсіз', password: 'Құпиясөз — 6-дан 72 таңбаға дейін', taken: 'Бұл никнейм бос емес', wrong: 'Никнейм немесе құпиясөз қате', locked: 'Тым көп әрекет. 10 минут күте тұр', network: 'Сервермен байланыс жоқ. Интернетті тексер', code: 'Код қате' },
    offline: 'Аккаунттар қолжетімсіз: сервер бапталмаған'
  },
  admin: {
    title: 'Әкімші панелі', back: 'Зертханаға', period: 'Кезең', days: (n) => `${n} күн`, refresh: 'Жаңарту', forbidden: 'Әкімші құқығы керек. Әкімші аккаунтымен кір.', loading: 'Жүктелуде…',
    visitsToday: 'Бүгінгі кірулер', visitors: 'Келушілер', visits: 'Кірулер', accounts: 'Аккаунттар', active7: '7 күнде белсенді', experiments: 'Тәжірибелер', newAccounts: 'Жаңа аккаунттар',
    chartVisits: 'Күн сайынғы қатысу', chartActivity: 'Күн сайынғы тәжірибелер', devices: 'Құрылғылар', langs: 'Тілдер', grades: 'Сыныптар', topReactions: 'Танымал реакциялар', users: 'Пайдаланушылар',
    nickname: 'Никнейм', role: 'Рөлі', lastSeen: 'Соңғы кіруі', created: 'Тіркелген', discoveries: 'Жаңалықтар', count: 'Рет', none: 'Әзірге дерек жоқ',
    roles: { student: 'оқушы', teacher: 'мұғалім', admin: 'әкімші' }, deviceNames: { phone: 'телефон', tablet: 'планшет', desktop: 'компьютер', unknown: 'белгісіз' },
    legendVisits: 'кірулер', legendVisitors: 'келушілер', legendExperiments: 'тәжірибелер', legendSignups: 'тіркелулер', unknown: 'көрсетілмеген',
    kinds: { precip: 'Тұнба', neutralization: 'Бейтараптану', gasCO2: 'Көмірқышқыл газ', metalAcid: 'Металл + қышқыл', activeMetalWater: 'Металл + су', metalSalt: 'Металл + тұз', indicator: 'Индикатор', electrolysis: 'Электролиз', gasTest: 'Газды тексеру', co2Limewater: 'CO₂ + әк суы', limewaterClears: 'CO₂ артық', gasAbsorbed: 'Газдың сіңірілуі', fe3scn: 'Fe³⁺ + роданид', ammine: 'Аммиакат', amphoteric: 'Амфотерлік', dissolveAcid: 'Қышқылда еру', h2o2: 'H₂O₂ ыдырауы', oxideWater: 'Оксид + су', hydroxideDecomp: 'Қыздырғанда ыдырау', sugarChar: 'Қанттың көмірленуі', dilutionSafe: 'Қышқылды сұйылту', dilutionUnsafe: 'Қышқылға су', exchangeNone: 'Алмасу жоқ', metalAcidNone: 'Металл әрекеттеспейді', metalSaltNone: 'Ығыстыру жоқ', noCurrent: 'Ток жоқ', boiling: 'Қайнау', dissolve: 'Еру', ammonia: 'Аммиак', metalNitric: 'Металл + HNO₃', sulfideAcid: 'Сульфид + қышқыл', sulfiteAcid: 'Сульфит + қышқыл', thiosulfateAcid: 'Тиосульфат + қышқыл', chromateAcid: 'Хромат → дихромат', dichromateBase: 'Дихромат → хромат', halogenDisplace: 'Галогеннің ығысуы', iodideOx: 'Йодидтің тотығуы', starchIodine: 'Йод + крахмал', bleach: 'Хлормен ағарту', permanganateRedox: 'Перманганат қышқылда', dichromateRedox: 'Дихромат қышқылда', sulfideHydrolysis: 'Сульфид гидролизі', metalSulfur: 'Металл + күкірт', carbonReduce: 'Көмірмен тотықсыздану', thermalDecomp: 'Қыздырғанда ыдырау', volcano: 'Жанартау', hardWater: 'Қақ', adsorption: 'Адсорбция', leadFilm: 'Қорғасындағы қабыршақ', dissolveHot: 'Ыстық суда еру', flameTest: 'Жалынның боялуы', magnet: 'Магнит', filtered: 'Сүзу', dryOut: 'Буландыру', crystallize: 'Кристалдану', melting: 'Балқу', sublimation: 'Сублимация', distillation: 'Айдау', iceMelt: 'Мұздың еруі', gasOut: 'Ерітіндіден газ', floats: 'Флотация', dissolveCold: 'Салқындай еру', dissolveHotSolid: 'Қыза еру',
      iron3Metal: 'Fe³⁺ + металл', hclPrep: 'HCl алу', ammoniaPrep: 'Аммиак алу', chlorinePrep: 'Хлор алу', metalHotWater: 'Металл + ыстық су', sulfateFilm: 'Сульфат қабыршағы', iron2Ox: 'Fe²⁺ → Fe³⁺', iron3Reduce: 'Fe³⁺ → Fe²⁺', halogenAlkali: 'Галоген + сілті', halogenThio: 'Галоген + тиосульфат', halogenReduce: 'Галогеннің түссізденуі', sulfurComprop: 'SO₂ + H₂S → S', carbonicSilicate: 'CO₂ + силикат', aluminateAcid: 'Алюминат → Al(OH)₃', metalAmmonium: 'Металл + аммоний тұзы', nitricRedox: 'HNO₃ — тотықтырғыш', hydroxideAir: 'Ауада тотығу', concOxidation: 'Конц. қышқыл — тотықтырғыш', dehydration: 'Дегидратация', nitricPrep: 'Нитраттан HNO₃', heatInAir: 'Ауада қыздыру', solFormation: 'Золь', colorFade: 'Қыздырғанда түс солғындайды' }
  }
};

const en: Extra = {
  amount: { liquid: 'Pour', solid: 'Add', ml: 'mL', g: 'g', drops: 'Indicator — 2 drops', hint: 'How much goes in when you click a bottle' },
  compareLiquid: liquidEn,
  compareSolid: solidEn,
  speed: { label: 'Time', hint: 'Speed up time: heating, electrolysis and titration go faster' },
  vessel: { tube: 'Test tube, 20 mL', beaker: 'Beaker, 100 mL', beaker250: 'Beaker, 250 mL', flask: 'Conical flask, 250 mL' },
  vesselShort: { tube: 'Tube', beaker: 'Beaker', beaker250: 'Beaker', flask: 'Flask' },
  addVessel: 'Glassware',
  removeVessel: 'Remove from bench',
  noRoom: 'There is no more room on the bench',
  broken: { title: 'The vessel broke', text: 'The reaction was too violent and the glass gave way. The contents spilled. Take a new vessel.', replace: 'Take a new one' },
  spill: (ml) => `${ml} mL did not fit and ran over the rim`,
  partialPour: (ml) => `Poured ${ml} mL — the rest did not fit`,
  tube: { label: 'Delivery tube', none: 'None', to: 'Gas goes to', hint: 'Gas from this vessel goes through the tube to the gas collector or to another vessel.', badge: (to) => `tube → ${to}` },
  collector: { name: 'Gas collector', empty: 'No gas collected yet', volume: 'Gas collected', of: 'of 100 mL', composition: 'Contents', release: 'Release the gas', how: 'The gas is collected over water: a cylinder full of water stands upside down in a trough, and the gas rises and pushes the water out.', connect: 'Connect a delivery tube to a vessel where gas is given off: open the vessel and choose "Delivery tube → Gas collector".' },
  tools: { title: 'Test the gas', hint: 'Tests the gas being given off right now', names: { glowing: 'Glowing splint', burning: 'Burning splint', litmus: 'Damp litmus', limewater: 'Limewater', smell: 'Smell it (waft with your hand)', starchKI: 'Starch-iodide paper', leadPaper: 'Lead acetate paper', hclRod: 'Rod dipped in conc. HCl' } },
  burette: {
    name: 'Burette', attach: 'Set up a burette', detach: 'Remove the burette', titrant: 'In the burette', used: 'Used', left: 'Left',
    drop: '1 drop', half: '+0.5 mL', one: '+1 mL', open: 'Open the tap', close: 'Close the tap', curve: 'Titration curve', axisV: 'mL',
    endpoint: (v) => `The indicator changed colour at ${v} mL`, calc: 'Calculation',
    formula: 'C(acid) = C(alkali) × V(alkali) ÷ V(acid) (for HCl and NaOH)', unknown: 'Your answer: concentration of acid X, mol/L', check: 'Check',
    right: (c) => `Correct! Acid X is ${c} mol/L`, wrong: 'Not quite. Check your calculation with the formula.',
    start: 'Put acid into the flask, add an indicator and open the tap a little at a time.', noIndicator: 'Add an indicator such as phenolphthalein, or you will not see the end point.'
  },
  electro: { name: 'Electrodes', on: 'Put the electrodes in', off: 'Take the electrodes out', bulb: { none: 'The bulb is off', weak: 'The bulb glows dimly', strong: 'The bulb glows brightly' }, cathode: 'Cathode (−)', anode: 'Anode (+)', plated: 'Plated on the cathode', hint: 'Graphite electrodes, 1 A current. Speed up time to see the result sooner.' },
  numbers: { title: 'In numbers', formed: 'Formed', gasOut: 'Gas given off' },
  life: 'In everyday life',
  info: { open: 'About the substance', life: 'At home and around us', hazard: 'Careful', molar: 'Molar mass', grade: (n) => `In the curriculum from grade ${n}`, concentration: 'Concentration' },
  account: {
    login: 'Log in', register: 'Sign up', nickname: 'Nickname', password: 'Password (6+ characters)', grade: 'Grade', submit: 'Done', logout: 'Log out',
    haveAccount: 'Have an account? Log in', noAccount: 'No account? Sign up',
    privacy: 'We do not ask for e-mail, phone or real name. Only your nickname, grade and discoveries are saved.',
    saved: 'Progress saved', guest: 'Log in', admin: 'Admin panel', adminCode: 'Admin code', adminClaim: 'Get admin rights',
    adminOk: 'Done: you now have access to the admin panel', welcome: (n) => `Hi, ${n}!`,
    errors: { nickname: 'Nickname: 3 to 24 characters, no @, < > or /', password: 'Password: 6 to 72 characters', taken: 'This nickname is taken', wrong: 'Wrong nickname or password', locked: 'Too many attempts. Wait 10 minutes', network: 'No connection to the server. Check the internet', code: 'Wrong code' },
    offline: 'Accounts are unavailable: the server is not configured'
  },
  admin: {
    title: 'Admin panel', back: 'Back to the lab', period: 'Period', days: (n) => `${n} days`, refresh: 'Refresh', forbidden: 'Admin rights needed. Log in with an admin account.', loading: 'Loading…',
    visitsToday: 'Visits today', visitors: 'Visitors', visits: 'Visits', accounts: 'Accounts', active7: 'Active in 7 days', experiments: 'Experiments', newAccounts: 'New accounts',
    chartVisits: 'Visits per day', chartActivity: 'Experiments per day', devices: 'Devices', langs: 'Languages', grades: 'Grades', topReactions: 'Popular reactions', users: 'Users',
    nickname: 'Nickname', role: 'Role', lastSeen: 'Last seen', created: 'Signed up', discoveries: 'Discoveries', count: 'Times', none: 'No data yet',
    roles: { student: 'student', teacher: 'teacher', admin: 'admin' }, deviceNames: { phone: 'phone', tablet: 'tablet', desktop: 'computer', unknown: 'unknown' },
    legendVisits: 'visits', legendVisitors: 'visitors', legendExperiments: 'experiments', legendSignups: 'sign-ups', unknown: 'not set',
    kinds: { precip: 'Precipitate', neutralization: 'Neutralisation', gasCO2: 'Carbon dioxide', metalAcid: 'Metal + acid', activeMetalWater: 'Metal + water', metalSalt: 'Metal + salt', indicator: 'Indicator', electrolysis: 'Electrolysis', gasTest: 'Gas test', co2Limewater: 'CO₂ + limewater', limewaterClears: 'Excess CO₂', gasAbsorbed: 'Gas absorbed', fe3scn: 'Fe³⁺ + thiocyanate', ammine: 'Ammine complex', amphoteric: 'Amphoteric', dissolveAcid: 'Dissolving in acid', h2o2: 'H₂O₂ breakdown', oxideWater: 'Oxide + water', hydroxideDecomp: 'Breakdown on heating', sugarChar: 'Sugar charring', dilutionSafe: 'Diluting acid', dilutionUnsafe: 'Water into acid', exchangeNone: 'No exchange', metalAcidNone: 'Metal does not react', metalSaltNone: 'No displacement', noCurrent: 'No current', boiling: 'Boiling', dissolve: 'Dissolving', ammonia: 'Ammonia', metalNitric: 'Metal + HNO₃', sulfideAcid: 'Sulfide + acid', sulfiteAcid: 'Sulfite + acid', thiosulfateAcid: 'Thiosulfate + acid', chromateAcid: 'Chromate → dichromate', dichromateBase: 'Dichromate → chromate', halogenDisplace: 'Halogen displacement', iodideOx: 'Iodide oxidised', starchIodine: 'Iodine + starch', bleach: 'Chlorine bleach', permanganateRedox: 'Permanganate in acid', dichromateRedox: 'Dichromate in acid', sulfideHydrolysis: 'Sulfide hydrolysis', metalSulfur: 'Metal + sulfur', carbonReduce: 'Reduction by carbon', thermalDecomp: 'Breakdown on heating', volcano: 'Volcano', hardWater: 'Kettle scale', adsorption: 'Adsorption', leadFilm: 'Film on lead', dissolveHot: 'Dissolving when hot', flameTest: 'Flame test', magnet: 'Magnet', filtered: 'Filtering', dryOut: 'Evaporation', crystallize: 'Crystallisation', melting: 'Melting', sublimation: 'Sublimation', distillation: 'Distillation', iceMelt: 'Ice melting', gasOut: 'Gas leaves solution', floats: 'Flotation', dissolveCold: 'Dissolving with cooling', dissolveHotSolid: 'Dissolving with heating',
      iron3Metal: 'Fe³⁺ + metal', hclPrep: 'Making HCl', ammoniaPrep: 'Making ammonia', chlorinePrep: 'Making chlorine', metalHotWater: 'Metal + hot water', sulfateFilm: 'Sulfate crust', iron2Ox: 'Fe²⁺ → Fe³⁺', iron3Reduce: 'Fe³⁺ → Fe²⁺', halogenAlkali: 'Halogen + alkali', halogenThio: 'Halogen + thiosulfate', halogenReduce: 'Halogen decolourised', sulfurComprop: 'SO₂ + H₂S → S', carbonicSilicate: 'CO₂ + silicate', aluminateAcid: 'Aluminate → Al(OH)₃', metalAmmonium: 'Metal + ammonium salt', nitricRedox: 'HNO₃ as oxidiser', hydroxideAir: 'Oxidation in air', concOxidation: 'Conc. acid as oxidiser', dehydration: 'Dehydration', nitricPrep: 'HNO₃ from nitrate', heatInAir: 'Heating in air', solFormation: 'Sol', colorFade: 'Colour fades on heating' }
  }
};

export const EXTRA: Record<Lang, Extra> = { ru, kk, en };
export { n1 as numText };

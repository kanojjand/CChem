// Texts for the laboratory ways of getting gases, iron(III) with metals, the sulfate crust on
// marble, magnesium in hot water, and variants of earlier events: permanganate in neutral and
// alkaline solution, chlorine from concentrated hydrochloric acid, iodine from H2O2, concentrated
// nitric and sulfuric acids, passivation.

import type { Lang } from '../engine/data';
import type { EventText, EventTexts, H } from './types';

type NewKinds = 'iron3Metal' | 'hclPrep' | 'ammoniaPrep' | 'chlorinePrep' | 'metalHotWater' | 'sulfateFilm';
type Fn = (p: Record<string, string>, h: H) => EventText;

const RU: Record<NewKinds, Fn> = {
  iron3Metal: (p, h) => ({
    title: p.metal === 'Cu' ? 'Медь растворяется в растворе железа(III)' : `${h.cap(h.metal(p.metal))} растворяется, раствор светлеет`,
    say: p.metal === 'Cu'
      ? `Ионы железа(III) окисляют медь: она переходит в раствор, а жёлто-бурый раствор становится зеленовато-голубым — образуются соли железа(II) и меди(II).`
      : `Ионы железа(III) окисляют ${h.metal(p.metal)}. Жёлто-бурая окраска железа(III) сменяется бледно-зелёной окраской ионов железа(II) ${h.F('Fe^2+')}.`,
    why7: 'Соль железа(III) отнимает у металла электроны, и металл растворяется.',
    why: 'Ионы Fe³⁺ — окислитель: Fe³⁺ + e⁻ → Fe²⁺. Раствором хлорида железа(III) травят медные дорожки печатных плат.'
  }),
  hclPrep: (_p, h) => ({
    title: 'Выделяется хлороводород',
    say: `Концентрированная серная кислота вытесняет из соли хлороводород ${h.F('HCl')} — бесцветный газ с резким запахом. Во влажном воздухе он «дымит»: образуется туман из капелек соляной кислоты. Остаётся гидросульфат натрия.`,
    why7: 'Из поваренной соли и серной кислоты получают газ, а из него — соляную кислоту.',
    why: 'Нелетучая серная кислота вытесняет летучую соляную кислоту из её солей. Хлороводород очень хорошо растворяется в воде (около 450 объёмов в одном объёме): над водой его не собирают, а растворив в воде, получают соляную кислоту.'
  }),
  ammoniaPrep: (_p, h) => ({
    title: 'Выделяется аммиак',
    say: `При нагревании смеси соли аммония со щёлочью выделяется аммиак ${h.F('NH3')} с резким запахом нашатыря. На холодных стенках пробирки появляются капли воды.`,
    why7: 'Так в лаборатории получают аммиак.',
    why: 'Щёлочь вытесняет из солей аммония аммиак. Аммиак легче воздуха и очень хорошо растворяется в воде, поэтому его собирают в пробирку, перевёрнутую вверх дном. Влажная лакмусовая бумажка у отверстия синеет.'
  }),
  chlorinePrep: (_p, h) => ({
    title: 'Выделяется жёлто-зелёный хлор',
    say: `При нагревании оксид марганца(IV) окисляет концентрированную соляную кислоту, и выделяется хлор ${h.F('Cl2')} — жёлто-зелёный газ с резким удушливым запахом.`,
    why7: 'Хлор очень ядовит, этот опыт проводят только под тягой.',
    why: 'MnO₂ — окислитель: хлорид-ионы отдают электроны и превращаются в хлор. Хлор в 2,5 раза тяжелее воздуха, его собирают в сосуд, стоящий отверстием вверх.'
  }),
  metalHotWater: (_p, h) => ({
    title: 'Магний реагирует с горячей водой',
    say: `С холодной водой магний почти не реагирует, а в горячей на нём медленно появляются пузырьки водорода и образуется гидроксид магния ${h.F('Mg(OH)2')}. Фенолфталеин покажет малиновую окраску.`,
    why: 'Магний активен, но слабее натрия и кальция: без нагревания его защищает плёнка гидроксида.'
  }),
  sulfateFilm: (p, h) => ({
    title: p.again ? 'Реакция не идёт' : 'Реакция быстро прекратилась',
    say: p.again
      ? `Кусочки ${h.N(p.solid)} покрыты коркой ${h.N(p.crust)} ${h.F(p.crust)}, и кислота до карбоната больше не достаёт.`
      : `Сначала появились пузырьки углекислого газа, но реакция почти сразу остановилась: кусочки покрылись коркой малорастворимого ${h.N(p.crust)} ${h.F(p.crust)}.`,
    why: 'Поэтому углекислый газ в лаборатории получают из мрамора и соляной кислоты, а не серной.'
  })
};

const KK: Record<NewKinds, Fn> = {
  iron3Metal: (p, h) => ({
    title: p.metal === 'Cu' ? 'Мыс темір(III) ерітіндісінде ериді' : `${h.cap(h.metal(p.metal))} ериді, ерітінді ағарады`,
    say: p.metal === 'Cu'
      ? 'Темір(III) иондары мысты тотықтырады: мыс ерітіндіге өтеді, ал сары-қоңыр ерітінді жасылдау-көгілдір болады — темір(II) және мыс(II) тұздары түзіледі.'
      : `Темір(III) иондары ${h.metal(p.metal)} металын тотықтырады. Темір(III)-тің сары-қоңыр түсі темір(II) иондарының ${h.F('Fe^2+')} ақшыл жасыл түсіне ауысады.`,
    why7: 'Темір(III) тұзы металдан электрон тартып алады, сондықтан металл ериді.',
    why: 'Fe³⁺ иондары — тотықтырғыш: Fe³⁺ + e⁻ → Fe²⁺. Темір(III) хлоридінің ерітіндісімен баспа платаларының мыс жолақтарын өңдейді.'
  }),
  hclPrep: (_p, h) => ({
    title: 'Хлорсутек бөлінеді',
    say: `Концентрлі күкірт қышқылы тұздан хлорсутекті ${h.F('HCl')} ығыстырады — өткір иісті түссіз газ. Дымқыл ауада ол «түтіндейді»: тұз қышқылының тамшыларынан тұман түзіледі. Натрий гидросульфаты қалады.`,
    why7: 'Ас тұзы мен күкірт қышқылынан газ алады, ал одан — тұз қышқылын.',
    why: 'Ұшпайтын күкірт қышқылы ұшқыш тұз қышқылын оның тұздарынан ығыстырады. Хлорсутек суда өте жақсы ериді (бір көлем суда шамамен 450 көлем): оны су үстінде жинамайды, ал суда ерітіп, тұз қышқылын алады.'
  }),
  ammoniaPrep: (_p, h) => ({
    title: 'Аммиак бөлінеді',
    say: `Аммоний тұзы мен сілті қоспасын қыздырғанда нашатырдың өткір иісі бар аммиак ${h.F('NH3')} бөлінеді. Сынауықтың суық қабырғаларында су тамшылары пайда болады.`,
    why7: 'Зертханада аммиакты осылай алады.',
    why: 'Сілті аммоний тұздарынан аммиакты ығыстырады. Аммиак ауадан жеңіл және суда өте жақсы ериді, сондықтан оны төңкерілген сынауыққа жинайды. Ауызындағы дымқыл лакмус қағазы көгереді.'
  }),
  chlorinePrep: (_p, h) => ({
    title: 'Сары-жасыл хлор бөлінеді',
    say: `Қыздырғанда марганец(IV) оксиді концентрлі тұз қышқылын тотықтырады да, хлор ${h.F('Cl2')} бөлінеді — өткір, тұншықтырғыш иісті сары-жасыл газ.`,
    why7: 'Хлор өте улы, бұл тәжірибені тек тартпа шкафта жасайды.',
    why: 'MnO₂ — тотықтырғыш: хлорид-иондар электрон беріп, хлорға айналады. Хлор ауадан 2,5 есе ауыр, оны аузы жоғары қаратылған ыдысқа жинайды.'
  }),
  metalHotWater: (_p, h) => ({
    title: 'Магний ыстық сумен әрекеттеседі',
    say: `Суық сумен магний іс жүзінде әрекеттеспейді, ал ыстық суда оның бетінде сутек көпіршіктері баяу пайда болып, магний гидроксиді ${h.F('Mg(OH)2')} түзіледі. Фенолфталеин таңқурай түске боялады.`,
    why: 'Магний белсенді, бірақ натрий мен кальцийден әлсіз: қыздырмаса, оны гидроксид қабықшасы қорғайды.'
  }),
  sulfateFilm: (p, h) => ({
    title: p.again ? 'Реакция жүрмейді' : 'Реакция тез тоқтады',
    say: p.again
      ? `${h.cap(h.N(p.solid))} кесектері ${h.N(p.crust)} ${h.F(p.crust)} қабықшасымен қапталған, қышқыл карбонатқа енді жете алмайды.`
      : `Алдымен көмірқышқыл газының көпіршіктері шықты, бірақ реакция бірден дерлік тоқтады: кесектер аз еритін ${h.N(p.crust)} ${h.F(p.crust)} қабықшасымен қапталды.`,
    why: 'Сондықтан зертханада көмірқышқыл газын мәрмәр мен күкірт қышқылынан емес, тұз қышқылынан алады.'
  })
};

const EN: Record<NewKinds, Fn> = {
  iron3Metal: (p, h) => ({
    title: p.metal === 'Cu' ? 'Copper dissolves in the iron(III) solution' : `${h.cap(h.metal(p.metal))} dissolves, the solution gets paler`,
    say: p.metal === 'Cu'
      ? 'Iron(III) ions oxidise copper: it goes into solution, and the yellow-brown solution turns greenish-blue as iron(II) and copper(II) salts form.'
      : `Iron(III) ions oxidise ${h.metal(p.metal)}. The yellow-brown colour of iron(III) gives way to the pale green of iron(II) ions ${h.F('Fe^2+')}.`,
    why7: 'The iron(III) salt takes electrons from the metal, so the metal dissolves.',
    why: 'Fe³⁺ ions are an oxidiser: Fe³⁺ + e⁻ → Fe²⁺. Iron(III) chloride solution is used to etch the copper tracks of circuit boards.'
  }),
  hclPrep: (_p, h) => ({
    title: 'Hydrogen chloride is given off',
    say: `Concentrated sulfuric acid drives hydrogen chloride ${h.F('HCl')} out of the salt: a colourless gas with a sharp smell. In moist air it fumes, forming a mist of hydrochloric acid droplets. Sodium hydrogen sulfate is left behind.`,
    why7: 'Salt and sulfuric acid give this gas, and the gas dissolved in water gives hydrochloric acid.',
    why: 'Non-volatile sulfuric acid drives the volatile hydrochloric acid out of its salts. Hydrogen chloride dissolves extremely well in water (about 450 volumes in one): it is never collected over water, and dissolving it in water gives hydrochloric acid.'
  }),
  ammoniaPrep: (_p, h) => ({
    title: 'Ammonia is given off',
    say: `Heating an ammonium salt with an alkali gives ammonia ${h.F('NH3')} with the sharp smell of smelling salts. Drops of water appear on the cool walls of the tube.`,
    why7: 'This is how ammonia is made in the lab.',
    why: 'An alkali drives ammonia out of ammonium salts. Ammonia is lighter than air and very soluble in water, so it is collected in a tube held upside down. Damp litmus paper at the mouth turns blue.'
  }),
  chlorinePrep: (_p, h) => ({
    title: 'Yellow-green chlorine is given off',
    say: `On heating, manganese(IV) oxide oxidises concentrated hydrochloric acid and chlorine ${h.F('Cl2')} is given off: a yellow-green gas with a sharp, choking smell.`,
    why7: 'Chlorine is very toxic; this experiment is done only in a fume hood.',
    why: 'MnO₂ is an oxidiser: chloride ions give up electrons and become chlorine. Chlorine is 2.5 times heavier than air and is collected in a vessel standing mouth up.'
  }),
  metalHotWater: (_p, h) => ({
    title: 'Magnesium reacts with hot water',
    say: `Magnesium hardly reacts with cold water, but in hot water bubbles of hydrogen slowly appear on it and magnesium hydroxide ${h.F('Mg(OH)2')} forms. Phenolphthalein would turn crimson.`,
    why: 'Magnesium is active, but less so than sodium and calcium: without heat a film of hydroxide protects it.'
  }),
  sulfateFilm: (p, h) => ({
    title: p.again ? 'No reaction' : 'The reaction soon stopped',
    say: p.again
      ? `The pieces of ${h.N(p.solid)} are covered with a crust of ${h.N(p.crust)} ${h.F(p.crust)}, so the acid can no longer reach the carbonate.`
      : `At first bubbles of carbon dioxide appeared, but the reaction stopped almost at once: the pieces got covered with a crust of slightly soluble ${h.N(p.crust)} ${h.F(p.crust)}.`,
    why: 'That is why carbon dioxide is made in the lab from marble and hydrochloric acid, not sulfuric acid.'
  })
};

export function chemEvents(lang: Lang): Pick<EventTexts, NewKinds> {
  return lang === 'kk' ? KK : lang === 'en' ? EN : RU;
}

// ---------------------------------------------------------------- variants of earlier events

type Variant = (p: Record<string, string>, h: H) => EventText | null;

const VARIANTS: Record<Lang, Partial<Record<keyof EventTexts, Variant>>> = {
  ru: {
    permanganateRedox: (p, h) => p.red === 'Cl^-'
      ? { title: 'Выделяется хлор', say: `Перманганат калия окисляет концентрированную соляную кислоту: выделяется жёлто-зелёный хлор ${h.F('Cl2')} с резким удушливым запахом, малиновая окраска исчезает.`, why: 'Так хлор получают в лаборатории без нагревания. Только под тягой: хлор очень ядовит.' }
      : p.medium === 'neutral'
      ? { title: 'Выпал бурый осадок', say: `В нейтральной среде перманганат восстанавливается не до бесцветных ионов марганца(II), а до бурого осадка оксида марганца(IV) ${h.F('MnO2')}. ${p.red === 'I^-' ? 'Иодид окисляется до иода.' : p.red === 'H2O2' ? 'Пероксид водорода окисляется — выделяется кислород.' : 'Сульфит окисляется до сульфата.'}`, why7: 'Окраска исчезла, и выпал бурый осадок — признаки реакции.', why: 'Продукт зависит от среды: в кислой — ионы Mn²⁺ (раствор обесцвечивается), в нейтральной — бурый MnO₂, в щелочной — зелёный манганат MnO₄²⁻.' }
      : p.medium === 'alkaline'
      ? { title: 'Раствор стал зелёным', say: `В щелочной среде перманганат восстанавливается до манганата ${h.F('MnO4^2-')} — раствор из малинового становится зелёным. Сульфит окисляется до сульфата.`, why: 'Продукт зависит от среды: в кислой — Mn²⁺ (бесцветный раствор), в нейтральной — бурый осадок MnO₂, в щелочной — зелёный манганат.' }
      : null,
    dichromateRedox: (p, h) => p.red === 'Cl^-'
      ? { title: 'Выделяется хлор, раствор позеленел', say: `Дихромат окисляет концентрированную соляную кислоту до хлора ${h.F('Cl2')} — газа с резким запахом, а сам превращается в зелёные ионы хрома(III).`, why: 'Хром меняет степень окисления с +6 до +3. Опыт — только под тягой.' }
      : null,
    iodideOx: (p, h) => p.ion === 'H2O2'
      ? { title: 'Раствор побурел — выделился иод', say: `Пероксид водорода окисляет иодид-ионы до иода ${h.F('I2')}: раствор желтеет, потом буреет. В кислой среде реакция идёт быстрее.`, why: 'Пероксид водорода — окислитель. Добавь крахмал — раствор станет тёмно-синим.' }
      : null,
    metalNitric: (p, h) => p.conc
      ? { title: 'Выделяется бурый газ', say: `Концентрированная азотная кислота окисляет ${h.metal(p.metal)}; выделяется бурый ядовитый газ — оксид азота(IV) ${h.F('NO2')} с резким запахом. Водород не выделяется.`, why: 'Чем концентрированнее азотная кислота, тем меньше она восстанавливается: концентрированная даёт NO₂, разбавленная — NO.' }
      : null,
    passivation: (p, h) => p.acid === 'HNO3'
      ? { title: `${h.cap(h.metal(p.metal))} не растворяется`, say: 'Холодная концентрированная азотная кислота покрывает этот металл прочной оксидной плёнкой, и реакция прекращается.', why: 'Это пассивация. Поэтому концентрированную азотную кислоту можно перевозить в алюминиевых цистернах.' }
      : null,
    cuConcAcid: (p, h) => p.metal === 'Zn' || p.metal === 'Mg'
      ? { title: `${h.cap(h.metal(p.metal))} растворяется в концентрированной серной кислоте`, say: `Концентрированная серная кислота окисляет ${h.metal(p.metal)} даже без нагревания. Водород не выделяется: выделяется сернистый газ ${h.F('SO2')} с запахом горелой спички, смесь разогревается.`, why: 'Концентрированная серная кислота — окислитель за счёт серы(+6). С активными металлами она восстанавливается до SO₂, а при большом избытке металла — даже до серы или сероводорода.' }
      : null
  },
  kk: {
    permanganateRedox: (p, h) => p.red === 'Cl^-'
      ? { title: 'Хлор бөлінеді', say: `Калий перманганаты концентрлі тұз қышқылын тотықтырады: өткір, тұншықтырғыш иісті сары-жасыл хлор ${h.F('Cl2')} бөлінеді, таңқурай түс жоғалады.`, why: 'Зертханада хлорды қыздырмай осылай алады. Тек тартпа шкафта: хлор өте улы.' }
      : p.medium === 'neutral'
      ? { title: 'Қоңыр тұнба түсті', say: `Бейтарап ортада перманганат түссіз марганец(II) иондарына дейін емес, марганец(IV) оксидінің ${h.F('MnO2')} қоңыр тұнбасына дейін тотықсызданады. ${p.red === 'I^-' ? 'Иодид йодқа дейін тотығады.' : p.red === 'H2O2' ? 'Сутек пероксиді тотығады — оттек бөлінеді.' : 'Сульфит сульфатқа дейін тотығады.'}`, why7: 'Түс жоғалып, қоңыр тұнба түсті — реакция белгілері.', why: 'Өнім ортаға байланысты: қышқылдық ортада — Mn²⁺ иондары (ерітінді түссізденеді), бейтарап ортада — қоңыр MnO₂, сілтілік ортада — жасыл манганат MnO₄²⁻.' }
      : p.medium === 'alkaline'
      ? { title: 'Ерітінді жасыл түске енді', say: `Сілтілік ортада перманганат манганатқа ${h.F('MnO4^2-')} дейін тотықсызданады — ерітінді таңқурай түстен жасылға ауысады. Сульфит сульфатқа дейін тотығады.`, why: 'Өнім ортаға байланысты: қышқылдық ортада — Mn²⁺ (түссіз ерітінді), бейтарап ортада — қоңыр MnO₂ тұнбасы, сілтілік ортада — жасыл манганат.' }
      : null,
    dichromateRedox: (p, h) => p.red === 'Cl^-'
      ? { title: 'Хлор бөлінеді, ерітінді жасылданды', say: `Дихромат концентрлі тұз қышқылын хлорға ${h.F('Cl2')} дейін тотықтырады — өткір иісті газ, ал өзі жасыл хром(III) иондарына айналады.`, why: 'Хромның тотығу дәрежесі +6-дан +3-ке өзгереді. Тәжірибе — тек тартпа шкафта.' }
      : null,
    iodideOx: (p, h) => p.ion === 'H2O2'
      ? { title: 'Ерітінді қоңырқайланды — йод бөлінді', say: `Сутек пероксиді иодид-иондарды йодқа ${h.F('I2')} дейін тотықтырады: ерітінді сарғайып, кейін қоңырқайланады. Қышқылдық ортада реакция тезірек жүреді.`, why: 'Сутек пероксиді — тотықтырғыш. Крахмал қос — ерітінді қою көк түске енеді.' }
      : null,
    metalNitric: (p, h) => p.conc
      ? { title: 'Қоңыр газ бөлінеді', say: `Концентрлі азот қышқылы ${h.metal(p.metal)} металын тотықтырады; өткір иісті улы қоңыр газ — азот(IV) оксиді ${h.F('NO2')} бөлінеді. Сутек бөлінбейді.`, why: 'Азот қышқылы неғұрлым концентрлі болса, соғұрлым аз тотықсызданады: концентрлісі NO₂, сұйылтылғаны NO береді.' }
      : null,
    passivation: (p, h) => p.acid === 'HNO3'
      ? { title: `${h.cap(h.metal(p.metal))} ерімейді`, say: 'Суық концентрлі азот қышқылы бұл металды берік оксид қабықшасымен қаптайды да, реакция тоқтайды.', why: 'Бұл — пассивация. Сондықтан концентрлі азот қышқылын алюминий цистерналарда тасымалдауға болады.' }
      : null,
    cuConcAcid: (p, h) => p.metal === 'Zn' || p.metal === 'Mg'
      ? { title: `${h.cap(h.metal(p.metal))} концентрлі күкірт қышқылында ериді`, say: `Концентрлі күкірт қышқылы ${h.metal(p.metal)} металын қыздырмай-ақ тотықтырады. Сутек бөлінбейді: жанған сіріңке иісті күкірт(IV) оксиді ${h.F('SO2')} бөлінеді, қоспа қызады.`, why: 'Концентрлі күкірт қышқылы күкірт(+6) есебінен тотықтырғыш. Белсенді металдармен ол SO₂-ге дейін, металл көп болса — күкіртке не күкіртсутекке дейін тотықсызданады.' }
      : null
  },
  en: {
    permanganateRedox: (p, h) => p.red === 'Cl^-'
      ? { title: 'Chlorine is given off', say: `Potassium permanganate oxidises concentrated hydrochloric acid: yellow-green chlorine ${h.F('Cl2')} with a sharp, choking smell is given off and the purple colour disappears.`, why: 'This is how chlorine is made in the lab without heating. Fume hood only: chlorine is very toxic.' }
      : p.medium === 'neutral'
      ? { title: 'A brown precipitate formed', say: `In neutral solution permanganate is reduced not to colourless manganese(II) ions but to a brown precipitate of manganese(IV) oxide ${h.F('MnO2')}. ${p.red === 'I^-' ? 'Iodide is oxidised to iodine.' : p.red === 'H2O2' ? 'Hydrogen peroxide is oxidised and oxygen is given off.' : 'Sulfite is oxidised to sulfate.'}`, why7: 'The colour disappeared and a brown precipitate formed: signs of a reaction.', why: 'The product depends on the medium: in acid Mn²⁺ ions (the solution goes colourless), in neutral solution brown MnO₂, in alkali green manganate MnO₄²⁻.' }
      : p.medium === 'alkaline'
      ? { title: 'The solution turned green', say: `In alkaline solution permanganate is reduced to manganate ${h.F('MnO4^2-')}: the purple solution turns green. Sulfite is oxidised to sulfate.`, why: 'The product depends on the medium: in acid Mn²⁺ (colourless), in neutral solution a brown MnO₂ precipitate, in alkali green manganate.' }
      : null,
    dichromateRedox: (p, h) => p.red === 'Cl^-'
      ? { title: 'Chlorine is given off, the solution turned green', say: `Dichromate oxidises concentrated hydrochloric acid to chlorine ${h.F('Cl2')}, a gas with a sharp smell, and turns into green chromium(III) ions.`, why: 'Chromium goes from +6 to +3. Fume hood only.' }
      : null,
    iodideOx: (p, h) => p.ion === 'H2O2'
      ? { title: 'The solution turned brown: iodine formed', say: `Hydrogen peroxide oxidises iodide ions to iodine ${h.F('I2')}: the solution turns yellow, then brown. In acid it goes faster.`, why: 'Hydrogen peroxide is an oxidiser. Add starch and the solution turns dark blue.' }
      : null,
    metalNitric: (p, h) => p.conc
      ? { title: 'A brown gas is given off', say: `Concentrated nitric acid oxidises ${h.metal(p.metal)}; a toxic brown gas with a sharp smell is given off: nitrogen dioxide ${h.F('NO2')}. No hydrogen forms.`, why: 'The more concentrated nitric acid is, the less it is reduced: concentrated acid gives NO₂, dilute acid gives NO.' }
      : null,
    passivation: (p, h) => p.acid === 'HNO3'
      ? { title: `${h.cap(h.metal(p.metal))} does not dissolve`, say: 'Cold concentrated nitric acid covers this metal with a tough oxide film and the reaction stops.', why: 'This is passivation. That is why concentrated nitric acid can be carried in aluminium tanks.' }
      : null,
    cuConcAcid: (p, h) => p.metal === 'Zn' || p.metal === 'Mg'
      ? { title: `${h.cap(h.metal(p.metal))} dissolves in concentrated sulfuric acid`, say: `Concentrated sulfuric acid oxidises ${h.metal(p.metal)} even without heating. No hydrogen forms: sulfur dioxide ${h.F('SO2')}, smelling of a struck match, is given off, and the mixture gets hot.`, why: 'Concentrated sulfuric acid is an oxidiser because of sulfur(+6). With active metals it is reduced to SO₂, and with a lot of metal even to sulfur or hydrogen sulfide.' }
      : null
  }
};

/** Wrap event texts so that the variants above take over for their parameters. */
export function patchEvents(events: EventTexts, lang: Lang) {
  const vs = VARIANTS[lang];
  for (const k of Object.keys(vs) as (keyof EventTexts)[]) {
    const base = events[k];
    const variant = vs[k]!;
    events[k] = (p, h, e) => variant(p, h) ?? base(p, h, e);
  }
}

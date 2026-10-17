// Texts for apparatus events: gas through a delivery tube, gas tests, electrolysis.
// Kept apart from the main language files; each language spreads its part into `events`.

import type { Lang } from '../engine/data';
import type { EventText, EventTexts, H } from './types';

type Kinds = 'gasAbsorbed' | 'gasThrough' | 'co2Limewater' | 'limewaterClears' | 'gasTest' | 'electrolysis' | 'noCurrent';
type T = { title: string; say: string; why?: string };

const TESTS: Record<Lang, Record<string, T>> = {
  ru: {
    relights: { title: 'Лучинка вспыхнула', say: 'Тлеющая лучинка ярко вспыхнула — это кислород ⟦O2⟧.', why: 'Кислород поддерживает горение. Так проверяют, что газ — кислород.' },
    burnsBrighter: { title: 'Пламя стало ярче', say: 'В кислороде лучинка горит ярче, чем на воздухе.', why: 'Чем больше кислорода, тем быстрее и ярче идёт горение.' },
    pop: { title: 'Хлопок!', say: 'Газ сгорел с характерным хлопком — это водород ⟦H2⟧.', why: 'Водород горит, соединяясь с кислородом воздуха, и получается вода. Чистый водород сгорает с тихим хлопком.' },
    loudPop: { title: 'Громкий хлопок!', say: 'Смесь водорода с кислородом («гремучий газ») взрывается при поджигании.', why: 'Поэтому перед поджиганием водород всегда проверяют на чистоту.' },
    goesOut: { title: 'Лучинка погасла', say: 'Этот газ не поддерживает горение. Так ведёт себя углекислый газ (а также азот и аммиак).', why: 'Углекислым газом тушат пожары — так работают углекислотные огнетушители.' },
    burnsAsUsual: { title: 'Ничего особенного', say: 'Лучинка горит как на воздухе: заметного количества газа здесь нет.' },
    stillGlows: { title: 'Лучинка просто тлеет', say: 'Кислорода здесь не больше, чем в обычном воздухе.' },
    litmusBlue: { title: 'Лакмусовая бумажка посинела', say: 'Влажная бумажка посинела — у газа щелочные свойства. Это аммиак ⟦NH3⟧.', why: 'Аммиак растворяется в воде на бумажке и образует слабое основание.' },
    litmusRed: { title: 'Лакмусовая бумажка покраснела', say: 'Газ растворяется в воде и образует кислоту — например, углекислый газ.', why: 'Кислотные оксиды с водой дают кислоты.' },
    litmusBleached: { title: 'Бумажка обесцветилась', say: 'Хлор обесцвечивает влажную лакмусовую бумажку.', why: 'Хлорная вода разрушает красители — поэтому хлор используют для отбеливания.' },
    litmusSame: { title: 'Бумажка не изменилась', say: 'Этот газ не образует с водой ни кислоту, ни щёлочь.' },
    limewaterCloudy: { title: 'Известковая вода помутнела', say: 'В пробе есть углекислый газ ⟦CO2⟧.', why: 'Углекислый газ с известковой водой даёт нерастворимый карбонат кальция.' },
    limewaterSame: { title: 'Известковая вода осталась прозрачной', say: 'Углекислого газа в пробе нет.' },
    h2sBurns: { title: 'Газ горит голубоватым пламенем', say: 'Сероводород ⟦H2S⟧ горит, появляется запах сернистого газа.', why: 'При горении сероводорода образуются сернистый газ и вода.' },
    'smell:none': { title: 'Запаха нет', say: 'Газ без запаха — так пахнут (точнее, не пахнут) водород, кислород, азот и углекислый газ.', why: 'Нюхают осторожно: не наклоняясь над сосудом, а направляя воздух к себе движением ладони.' },
    'smell:ammonia': { title: 'Резкий запах нашатыря', say: 'Так пахнет аммиак ⟦NH3⟧ — запах нашатырного спирта, от него щиплет в носу и слезятся глаза.', why: 'Нюхают, направляя воздух ладонью к себе. Аммиак ядовит: долго вдыхать его нельзя.' },
    'smell:rottenEggs': { title: 'Запах тухлых яиц', say: 'Так пахнет сероводород ⟦H2S⟧. Нос чувствует его даже в ничтожных количествах.', why: 'Сероводород очень ядовит: при большой концентрации запах перестаёт ощущаться — это особенно опасно. Опыты с ним проводят под тягой.' },
    'smell:burntMatch': { title: 'Запах горелой спички', say: 'Так пахнет сернистый газ ⟦SO2⟧: резкий, удушливый, как от только что зажжённой спички.', why: 'Сернистый газ ядовит и раздражает дыхательные пути. Опыты с ним — под тягой.' },
    'smell:chlorine': { title: 'Резкий удушливый запах хлора', say: 'Так пахнет хлор ⟦Cl2⟧ — похоже на отбеливатель («хлорку»), но гораздо сильнее.', why: 'Хлор ядовит: даже немного его раздражает горло и лёгкие. Работают только под тягой.' },
    'smell:hydrogenChloride': { title: 'Резкий кислый запах', say: 'Так пахнет хлороводород ⟦HCl⟧. Во влажном воздухе он «дымит» — образует туман из капелек соляной кислоты.', why: 'Хлороводород очень хорошо растворяется в воде. Нюхают только направляя воздух к себе ладонью.' },
    'smell:nitrogenDioxide': { title: 'Резкий раздражающий запах', say: 'Так пахнет бурый газ ⟦NO2⟧ — оксид азота(IV). Он очень ядовит.', why: 'С оксидами азота работают только под тягой: их нельзя вдыхать.' },
    'smell:vinegar': { title: 'Запах уксуса', say: 'Так пахнет уксусная кислота ⟦CH3COOH⟧ — как столовый уксус, только резче.', why: 'Уксусная кислота летучая, поэтому её запах чувствуется над раствором.' },
    'smell:bromine': { title: 'Резкий удушливый запах брома', say: 'Над раствором пахнет бромом ⟦Br2⟧ — резко и неприятно. Само название «бром» по-гречески значит «зловонный».', why: 'Пары брома ядовиты и разъедают кожу. Работают под тягой.' },
    'smell:iodine': { title: 'Слабый запах йода', say: 'Чувствуется характерный запах йода ⟦I2⟧ — как у аптечной йодной настойки.', why: 'Йод понемногу испаряется даже при комнатной температуре.' },
    kiBlue: { title: 'Бумажка посинела', say: 'Газ вытесняет иод из иодида калия, и иод окрашивает крахмал в синий цвет. Так обнаруживают хлор, бром и оксид азота(IV).', why: 'Это окислители: они отнимают электроны у иодид-ионов, и образуется иод.' },
    kiSame: { title: 'Бумажка не изменилась', say: 'В газе нет окислителей вроде хлора или брома.' },
    leadBlack: { title: 'Бумажка почернела', say: 'Сероводород с ацетатом свинца даёт чёрный сульфид свинца ⟦PbS⟧. Это проба на сероводород.', why: 'Сульфид свинца не растворяется в воде и в слабых кислотах.' },
    leadSame: { title: 'Бумажка не почернела', say: 'Сероводорода в газе нет.' },
    whiteSmoke: { title: 'Белый «дым»', say: 'Аммиак встречается с парами хлороводорода, и образуются мельчайшие кристаллики хлорида аммония ⟦NH4Cl⟧ — белый дым.', why: '⟦NH3⟧ + ⟦HCl⟧ → ⟦NH4Cl⟧. Так обнаруживают аммиак.' },
    noSmoke: { title: 'Дыма нет', say: 'Аммиака здесь нет: палочка с соляной кислотой не дымит.' },
    noGas: { title: 'Газа нет', say: 'Проверять пока нечего.' }
  },
  kk: {
    relights: { title: 'Шақпақ жалындап кетті', say: 'Бықсыған шақпақ жарқ етіп жанды — бұл оттек ⟦O2⟧.', why: 'Оттек жануды қолдайды. Газдың оттек екенін осылай тексереді.' },
    burnsBrighter: { title: 'Жалын жарқырай түсті', say: 'Оттекте шақпақ ауадағыдан жарқырақ жанады.', why: 'Оттек неғұрлым көп болса, жану соғұрлым тез әрі жарқын жүреді.' },
    pop: { title: 'Тарс!', say: 'Газ өзіне тән тарс еткен дыбыспен жанды — бұл сутек ⟦H2⟧.', why: 'Сутек ауадағы оттекпен қосылып жанады, су түзіледі. Таза сутек ақырын тарс етіп жанады.' },
    loudPop: { title: 'Қатты тарс етті!', say: 'Сутек пен оттек қоспасы («гүрілдек газ») тұтатқанда жарылады.', why: 'Сондықтан сутекті тұтатар алдында оның тазалығын әрдайым тексереді.' },
    goesOut: { title: 'Шақпақ сөнді', say: 'Бұл газ жануды қолдамайды. Көмірқышқыл газ (сондай-ақ азот пен аммиак) осылай әсер етеді.', why: 'Өртті көмірқышқыл газымен сөндіреді — көмірқышқыл өрт сөндіргіштер осылай жұмыс істейді.' },
    burnsAsUsual: { title: 'Ерекше ештеңе жоқ', say: 'Шақпақ ауадағыдай жанады: мұнда байқалатын газ жоқ.' },
    stillGlows: { title: 'Шақпақ бықсып тұр', say: 'Мұнда оттек кәдімгі ауадағыдан көп емес.' },
    litmusBlue: { title: 'Лакмус қағазы көгерді', say: 'Дымқыл қағаз көгерді — газдың сілтілік қасиеті бар. Бұл аммиак ⟦NH3⟧.', why: 'Аммиак қағаздағы суда еріп, әлсіз негіз түзеді.' },
    litmusRed: { title: 'Лакмус қағазы қызарды', say: 'Газ суда еріп, қышқыл түзеді — мысалы, көмірқышқыл газ.', why: 'Қышқылдық оксидтер сумен қышқыл береді.' },
    litmusBleached: { title: 'Қағаз түссізденді', say: 'Хлор дымқыл лакмус қағазын түссіздендіреді.', why: 'Хлорлы су бояғыштарды бұзады — сондықтан хлорды ағарту үшін қолданады.' },
    litmusSame: { title: 'Қағаз өзгерген жоқ', say: 'Бұл газ сумен қышқыл да, сілті де түзбейді.' },
    limewaterCloudy: { title: 'Әк суы лайланды', say: 'Сынамада көмірқышқыл газ ⟦CO2⟧ бар.', why: 'Көмірқышқыл газ әк суымен ерімейтін кальций карбонатын береді.' },
    limewaterSame: { title: 'Әк суы мөлдір күйінде қалды', say: 'Сынамада көмірқышқыл газ жоқ.' },
    h2sBurns: { title: 'Газ көгілдір жалынмен жанады', say: 'Күкіртсутек ⟦H2S⟧ жанады, күкірт(IV) оксидінің иісі шығады.', why: 'Күкіртсутек жанғанда күкірт(IV) оксиді мен су түзіледі.' },
    'smell:none': { title: 'Иісі жоқ', say: 'Газдың иісі жоқ — сутек, оттек, азот және көмірқышқыл газ осындай.', why: 'Абайлап иіскейді: ыдысқа еңкеймей, ауаны алақанмен өзіне қарай желпиді.' },
    'smell:ammonia': { title: 'Нашатырдың өткір иісі', say: 'Аммиак ⟦NH3⟧ осылай иіс береді — нашатыр спиртінің иісі, мұрынды шымшып, көзден жас ағызады.', why: 'Ауаны алақанмен өзіне қарай желпіп иіскейді. Аммиак улы: оны ұзақ жұтуға болмайды.' },
    'smell:rottenEggs': { title: 'Шіріген жұмыртқаның иісі', say: 'Күкіртсутек ⟦H2S⟧ осылай иіс береді. Мұрын оны өте аз мөлшерде де сезеді.', why: 'Күкіртсутек өте улы: концентрациясы жоғары болғанда иіс сезілмей қалады — бұл әсіресе қауіпті. Онымен тартпа шкафта жұмыс істейді.' },
    'smell:burntMatch': { title: 'Жанған сіріңкенің иісі', say: 'Күкірт(IV) оксиді ⟦SO2⟧ осылай иіс береді: өткір, тұншықтырғыш, жаңа тұтанған сіріңке сияқты.', why: 'Күкірт(IV) оксиді улы, тыныс жолдарын тітіркендіреді. Онымен тартпа шкафта жұмыс істейді.' },
    'smell:chlorine': { title: 'Хлордың өткір тұншықтырғыш иісі', say: 'Хлор ⟦Cl2⟧ осылай иіс береді — ағартқышқа ұқсас, бірақ әлдеқайда күшті.', why: 'Хлор улы: аз мөлшері де тамақ пен өкпені тітіркендіреді. Тек тартпа шкафта жұмыс істейді.' },
    'smell:hydrogenChloride': { title: 'Өткір қышқыл иіс', say: 'Хлорсутек ⟦HCl⟧ осылай иіс береді. Дымқыл ауада ол «түтіндейді» — тұз қышқылының тамшыларынан тұман түзеді.', why: 'Хлорсутек суда өте жақсы ериді. Тек ауаны алақанмен өзіне қарай желпіп иіскейді.' },
    'smell:nitrogenDioxide': { title: 'Өткір тітіркендіргіш иіс', say: 'Қоңыр газ ⟦NO2⟧ — азот(IV) оксиді осылай иіс береді. Ол өте улы.', why: 'Азот оксидтерімен тек тартпа шкафта жұмыс істейді: оларды жұтуға болмайды.' },
    'smell:vinegar': { title: 'Сірке суының иісі', say: 'Сірке қышқылы ⟦CH3COOH⟧ осылай иіс береді — ас сірке суы сияқты, бірақ өткірірек.', why: 'Сірке қышқылы ұшқыш, сондықтан оның иісі ерітіндінің үстінде сезіледі.' },
    'smell:bromine': { title: 'Бромның өткір тұншықтырғыш иісі', say: 'Ерітіндінің үстінде бром ⟦Br2⟧ иісі шығады — өткір әрі жағымсыз. «Бром» сөзі грекше «сасық» дегенді білдіреді.', why: 'Бром булары улы, теріні күйдіреді. Тартпа шкафта жұмыс істейді.' },
    'smell:iodine': { title: 'Йодтың әлсіз иісі', say: 'Йодтың ⟦I2⟧ өзіне тән иісі сезіледі — дәріханадағы йод тұнбасы сияқты.', why: 'Йод бөлме температурасында да біртіндеп буланады.' },
    kiBlue: { title: 'Қағаз көгерді', say: 'Газ калий иодидінен йодты ығыстырады, ал йод крахмалды көк түске бояйды. Хлор, бром және азот(IV) оксиді осылай анықталады.', why: 'Бұлар — тотықтырғыштар: иодид-иондардан электрон алады, нәтижесінде йод түзіледі.' },
    kiSame: { title: 'Қағаз өзгерген жоқ', say: 'Газда хлор немесе бром сияқты тотықтырғыштар жоқ.' },
    leadBlack: { title: 'Қағаз қарайды', say: 'Күкіртсутек қорғасын ацетатымен қара қорғасын сульфидін ⟦PbS⟧ береді. Бұл — күкіртсутекке сынама.', why: 'Қорғасын сульфиді суда және әлсіз қышқылдарда ерімейді.' },
    leadSame: { title: 'Қағаз қараймады', say: 'Газда күкіртсутек жоқ.' },
    whiteSmoke: { title: 'Ақ «түтін»', say: 'Аммиак хлорсутек буымен кездесіп, аммоний хлоридінің ⟦NH4Cl⟧ ұсақ кристалдарын түзеді — ақ түтін.', why: '⟦NH3⟧ + ⟦HCl⟧ → ⟦NH4Cl⟧. Аммиак осылай анықталады.' },
    noSmoke: { title: 'Түтін жоқ', say: 'Мұнда аммиак жоқ: тұз қышқылы малынған таяқша түтіндемейді.' },
    noGas: { title: 'Газ жоқ', say: 'Әзірге тексеретін ештеңе жоқ.' }
  },
  en: {
    relights: { title: 'The glowing splint relit', say: 'The glowing splint burst into flame — the gas is oxygen ⟦O2⟧.', why: 'Oxygen supports burning. This is the test for oxygen.' },
    burnsBrighter: { title: 'The flame got brighter', say: 'In oxygen a splint burns brighter than in air.', why: 'The more oxygen there is, the faster and brighter things burn.' },
    pop: { title: 'Pop!', say: 'The gas burned with a squeaky pop — it is hydrogen ⟦H2⟧.', why: 'Hydrogen burns with oxygen from the air and forms water. Pure hydrogen burns with a quiet pop.' },
    loudPop: { title: 'A loud bang!', say: 'A mixture of hydrogen and oxygen explodes when lit.', why: 'That is why hydrogen is always checked for purity before it is lit.' },
    goesOut: { title: 'The splint went out', say: 'This gas does not support burning. Carbon dioxide behaves like this (so do nitrogen and ammonia).', why: 'Carbon dioxide puts out fires — that is how CO₂ extinguishers work.' },
    burnsAsUsual: { title: 'Nothing special', say: 'The splint burns as in air: there is no noticeable gas here.' },
    stillGlows: { title: 'The splint just glows', say: 'There is no more oxygen here than in ordinary air.' },
    litmusBlue: { title: 'The litmus paper turned blue', say: 'The damp paper turned blue — the gas is alkaline. It is ammonia ⟦NH3⟧.', why: 'Ammonia dissolves in the water on the paper and forms a weak base.' },
    litmusRed: { title: 'The litmus paper turned red', say: 'The gas dissolves in water to form an acid — for example carbon dioxide.', why: 'Acidic oxides form acids with water.' },
    litmusBleached: { title: 'The paper was bleached', say: 'Chlorine bleaches damp litmus paper.', why: 'Chlorine water destroys dyes — that is why chlorine is used as a bleach.' },
    litmusSame: { title: 'The paper did not change', say: 'This gas forms neither an acid nor an alkali with water.' },
    limewaterCloudy: { title: 'The limewater turned cloudy', say: 'The sample contains carbon dioxide ⟦CO2⟧.', why: 'Carbon dioxide and limewater give insoluble calcium carbonate.' },
    limewaterSame: { title: 'The limewater stayed clear', say: 'There is no carbon dioxide in the sample.' },
    h2sBurns: { title: 'The gas burns with a bluish flame', say: 'Hydrogen sulfide ⟦H2S⟧ burns, and a smell of sulfur dioxide appears.', why: 'Burning hydrogen sulfide gives sulfur dioxide and water.' },
    'smell:none': { title: 'No smell', say: 'The gas has no smell, like hydrogen, oxygen, nitrogen and carbon dioxide.', why: 'Smell carefully: do not lean over the vessel, waft the air towards your nose with your hand.' },
    'smell:ammonia': { title: 'A sharp smell of smelling salts', say: 'That is ammonia ⟦NH3⟧: the smell of household ammonia, it stings the nose and makes the eyes water.', why: 'Waft the air towards you with your hand. Ammonia is toxic: do not breathe it for long.' },
    'smell:rottenEggs': { title: 'A smell of rotten eggs', say: 'That is hydrogen sulfide ⟦H2S⟧. The nose notices even tiny traces of it.', why: 'Hydrogen sulfide is very toxic: at high levels you stop smelling it, which makes it especially dangerous. Work with it in a fume hood.' },
    'smell:burntMatch': { title: 'A smell of a struck match', say: 'That is sulfur dioxide ⟦SO2⟧: sharp and choking, like a freshly struck match.', why: 'Sulfur dioxide is toxic and irritates the airways. Work in a fume hood.' },
    'smell:chlorine': { title: 'A sharp, choking smell of chlorine', say: 'That is chlorine ⟦Cl2⟧: like bleach, but much stronger.', why: 'Chlorine is toxic: even a little irritates the throat and lungs. Work only in a fume hood.' },
    'smell:hydrogenChloride': { title: 'A sharp acid smell', say: 'That is hydrogen chloride ⟦HCl⟧. In moist air it "fumes", forming a mist of hydrochloric acid droplets.', why: 'Hydrogen chloride dissolves extremely well in water. Only waft it towards you.' },
    'smell:nitrogenDioxide': { title: 'A sharp, irritating smell', say: 'That is the brown gas ⟦NO2⟧, nitrogen dioxide. It is very toxic.', why: 'Nitrogen oxides are handled only in a fume hood: never breathe them.' },
    'smell:vinegar': { title: 'A smell of vinegar', say: 'That is acetic acid ⟦CH3COOH⟧: like table vinegar, only sharper.', why: 'Acetic acid is volatile, so you can smell it above the solution.' },
    'smell:bromine': { title: 'A sharp, choking smell of bromine', say: 'Bromine ⟦Br2⟧ smells sharp and nasty above the solution. Its name comes from the Greek for "stench".', why: 'Bromine vapour is toxic and burns the skin. Work in a fume hood.' },
    'smell:iodine': { title: 'A faint smell of iodine', say: 'There is the typical smell of iodine ⟦I2⟧, like tincture of iodine from a pharmacy.', why: 'Iodine slowly evaporates even at room temperature.' },
    kiBlue: { title: 'The paper turned blue', say: 'The gas pushes iodine out of potassium iodide, and the iodine turns the starch blue. This detects chlorine, bromine and nitrogen dioxide.', why: 'These are oxidisers: they take electrons from iodide ions, which gives iodine.' },
    kiSame: { title: 'The paper did not change', say: 'There is no oxidiser like chlorine or bromine in the gas.' },
    leadBlack: { title: 'The paper turned black', say: 'Hydrogen sulfide and lead acetate give black lead sulfide ⟦PbS⟧. This is the test for hydrogen sulfide.', why: 'Lead sulfide does not dissolve in water or weak acids.' },
    leadSame: { title: 'The paper did not darken', say: 'There is no hydrogen sulfide in the gas.' },
    whiteSmoke: { title: 'White "smoke"', say: 'Ammonia meets hydrogen chloride vapour and forms tiny crystals of ammonium chloride ⟦NH4Cl⟧: white smoke.', why: '⟦NH3⟧ + ⟦HCl⟧ → ⟦NH4Cl⟧. This is how ammonia is detected.' },
    noSmoke: { title: 'No smoke', say: 'There is no ammonia here: the rod with hydrochloric acid does not smoke.' },
    noGas: { title: 'No gas', say: 'There is nothing to test yet.' }
  }
};

const ABSORB: Record<Lang, Record<string, T>> = {
  ru: {
    CO2: { title: 'Углекислый газ поглотился', say: 'Газ из трубки растворился в щёлочи и превратился в карбонат. Внешне ничего не видно.', why: 'Углекислый газ — кислотный оксид: он реагирует со щелочами, образуя соль и воду.' },
    NH3: { title: 'Аммиак растворился', say: 'Аммиак очень хорошо растворяется в воде, и раствор становится щелочным. Добавь фенолфталеин — он станет малиновым.', why: 'В одном литре воды растворяется около 700 литров аммиака. Раствор аммиака — слабое основание.' },
    Cl2: { title: 'Хлор частично растворился', say: 'Часть хлора растворилась в воде — получилась хлорная вода. Остальной газ уходит с резким запахом.', why: 'Хлорная вода обесцвечивает красители. Хлор ядовит, опыты с ним проводят под тягой.' },
    H2S: { title: 'Сероводород поглотился', say: 'Сероводород растворился в жидкости. В щёлочи он превращается в сульфид — запах исчезает.', why: 'Сероводород — кислотный газ: его раствор называют сероводородной кислотой. Щёлочь связывает его в соль.' },
    SO2: { title: 'Сернистый газ поглотился', say: 'Сернистый газ хорошо растворяется в воде. В щёлочи он превращается в сульфит.', why: 'Сернистый газ — кислотный оксид: с водой он даёт сернистую кислоту, со щёлочью — соль сульфит.' }
  },
  kk: {
    CO2: { title: 'Көмірқышқыл газ сіңірілді', say: 'Түтіктен келген газ сілтіде еріп, карбонатқа айналды. Сырттай ештеңе байқалмайды.', why: 'Көмірқышқыл газ — қышқылдық оксид: ол сілтілермен әрекеттесіп, тұз бен су түзеді.' },
    NH3: { title: 'Аммиак еріді', say: 'Аммиак суда өте жақсы ериді, ерітінді сілтілік болады. Фенолфталеин қос — ол таңқурай түске боялады.', why: 'Бір литр суда шамамен 700 литр аммиак ериді. Аммиак ерітіндісі — әлсіз негіз.' },
    Cl2: { title: 'Хлор ішінара еріді', say: 'Хлордың бір бөлігі суда еріп, хлорлы су түзілді. Қалған газ өткір иіспен шығады.', why: 'Хлорлы су бояғыштарды түссіздендіреді. Хлор улы, онымен тәжірибені тартпа шкафта жасайды.' },
    H2S: { title: 'Күкіртсутек сіңірілді', say: 'Күкіртсутек сұйықтықта еріді. Сілтіде ол сульфидке айналады — иіс жоғалады.', why: 'Күкіртсутек — қышқылдық газ: оның ерітіндісін күкіртсутек қышқылы деп атайды. Сілті оны тұзға айналдырады.' },
    SO2: { title: 'Күкірт(IV) оксиді сіңірілді', say: 'Күкірт(IV) оксиді суда жақсы ериді. Сілтіде ол сульфитке айналады.', why: 'Күкірт(IV) оксиді — қышқылдық оксид: сумен күкіртті қышқыл, сілтімен сульфит тұзын береді.' }
  },
  en: {
    CO2: { title: 'Carbon dioxide was absorbed', say: 'The gas from the tube dissolved in the alkali and turned into carbonate. Nothing is visible.', why: 'Carbon dioxide is an acidic oxide: it reacts with alkalis to form a salt and water.' },
    NH3: { title: 'Ammonia dissolved', say: 'Ammonia dissolves very well in water and the solution turns alkaline. Add phenolphthalein and it turns crimson.', why: 'About 700 litres of ammonia dissolve in one litre of water. Ammonia solution is a weak base.' },
    Cl2: { title: 'Some chlorine dissolved', say: 'Part of the chlorine dissolved, giving chlorine water. The rest escapes with a sharp smell.', why: 'Chlorine water bleaches dyes. Chlorine is toxic, so it is handled in a fume hood.' },
    H2S: { title: 'Hydrogen sulfide was absorbed', say: 'Hydrogen sulfide dissolved in the liquid. In alkali it turns into sulfide and the smell goes.', why: 'Hydrogen sulfide is an acidic gas: its solution is called hydrosulfuric acid. An alkali turns it into a salt.' },
    SO2: { title: 'Sulfur dioxide was absorbed', say: 'Sulfur dioxide dissolves well in water. In alkali it turns into sulfite.', why: 'Sulfur dioxide is an acidic oxide: with water it gives sulfurous acid, with an alkali a sulfite salt.' }
  }
};

interface ElectroWords {
  title: Record<string, string>;
  cathode: Record<string, string>;
  anode: Record<string, string>;
  say: (c: string, a: string) => string;
  why: string;
}

const ELECTRO: Record<Lang, ElectroWords> = {
  ru: {
    title: { Cu: 'На катоде оседает медь', Ag: 'На катоде оседает серебро', Zn: 'На катоде оседает цинк', Fe: 'На катоде оседает железо', 'H2|Cl2': 'Выделяются водород и хлор', 'H2|O2': 'Разлагается вода', 'H2|I2': 'Раствор буреет — выделяется иод' },
    cathode: { Cu: 'восстанавливается медь — электрод покрывается красным налётом', Ag: 'восстанавливается серебро', Zn: 'выделяются цинк и немного водорода', Fe: 'выделяются железо и немного водорода', H2: 'выделяется водород ⟦H2⟧: металл слишком активный, поэтому восстанавливается вода' },
    anode: { Cl2: 'выделяется хлор ⟦Cl2⟧ с резким запахом', I2: 'образуется иод, и раствор буреет', O2: 'выделяется кислород ⟦O2⟧: кислородсодержащие ионы не окисляются, окисляется вода' },
    say: (c, a) => `Через раствор идёт ток. На катоде (−) ${c}. На аноде (+) ${a}.`,
    why: 'Электролиз — окислительно-восстановительная реакция под действием тока. Катионы движутся к катоду и принимают электроны, анионы движутся к аноду и отдают электроны.'
  },
  kk: {
    title: { Cu: 'Катодта мыс бөлінеді', Ag: 'Катодта күміс бөлінеді', Zn: 'Катодта мырыш бөлінеді', Fe: 'Катодта темір бөлінеді', 'H2|Cl2': 'Сутек пен хлор бөлінеді', 'H2|O2': 'Су ыдырайды', 'H2|I2': 'Ерітінді қоңырқайланады — иод бөлінеді' },
    cathode: { Cu: 'мыс тотықсызданады — электрод қызыл қабатпен жабылады', Ag: 'күміс тотықсызданады', Zn: 'мырыш пен аздаған сутек бөлінеді', Fe: 'темір мен аздаған сутек бөлінеді', H2: 'сутек ⟦H2⟧ бөлінеді: металл тым белсенді, сондықтан су тотықсызданады' },
    anode: { Cl2: 'өткір иісті хлор ⟦Cl2⟧ бөлінеді', I2: 'иод түзіліп, ерітінді қоңырқайланады', O2: 'оттек ⟦O2⟧ бөлінеді: оттекті иондар тотықпайды, су тотығады' },
    say: (c, a) => `Ерітінді арқылы ток өтеді. Катодта (−) ${c}. Анодта (+) ${a}.`,
    why: 'Электролиз — ток әсерінен жүретін тотығу-тотықсыздану реакциясы. Катиондар катодқа қарай қозғалып, электрон қосып алады, аниондар анодқа қарай қозғалып, электрон береді.'
  },
  en: {
    title: { Cu: 'Copper is deposited on the cathode', Ag: 'Silver is deposited on the cathode', Zn: 'Zinc is deposited on the cathode', Fe: 'Iron is deposited on the cathode', 'H2|Cl2': 'Hydrogen and chlorine are given off', 'H2|O2': 'Water is being split', 'H2|I2': 'The solution turns brown — iodine forms' },
    cathode: { Cu: 'copper is reduced and coats the electrode red', Ag: 'silver is deposited', Zn: 'zinc and some hydrogen form', Fe: 'iron and some hydrogen form', H2: 'hydrogen ⟦H2⟧ is given off: the metal is too active, so water is reduced' },
    anode: { Cl2: 'chlorine ⟦Cl2⟧ with a sharp smell is given off', I2: 'iodine forms and the solution turns brown', O2: 'oxygen ⟦O2⟧ is given off: oxygen-containing ions are not oxidized, water is' },
    say: (c, a) => `Current flows through the solution. At the cathode (−) ${c}. At the anode (+) ${a}.`,
    why: 'Electrolysis is a redox reaction driven by an electric current. Cations move to the cathode and gain electrons; anions move to the anode and lose electrons.'
  }
};

const MISC: Record<Lang, { through: (gas: string) => T; limewater: T & { why7: string }; clears: T; noCurrent: T }> = {
  ru: {
    through: (gas) => ({ title: `${gas} проходит через воду`, say: 'Пузырьки газа поднимаются через жидкость: этот газ почти не растворяется в воде.', why: 'Поэтому водород и кислород собирают методом вытеснения воды.' }),
    limewater: { title: 'Известковая вода помутнела', say: 'Углекислый газ ⟦CO2⟧ реагирует с известковой водой: выпадает белый осадок карбоната кальция ⟦CaCO3⟧.', why7: 'Помутнение известковой воды доказывает, что газ — углекислый.', why: 'Это качественная реакция на углекислый газ. Если пропускать газ дальше, осадок растворится: получится растворимый гидрокарбонат кальция.' },
    clears: { title: 'Муть исчезла', say: 'При избытке углекислого газа карбонат кальция превращается в растворимый гидрокарбонат ⟦Ca(HCO3)2⟧, и раствор снова прозрачный.', why: 'Так в природе образуются пещеры: вода с углекислым газом растворяет известняк.' },
    noCurrent: { title: 'Ток не идёт', say: 'Лампочка не горит: в жидкости нет ионов, которые переносят заряд. Добавь соль, кислоту или щёлочь.', why: 'Дистиллированная вода и раствор сахара — неэлектролиты. Растворы солей, кислот и щелочей — электролиты: в них есть свободные ионы.' }
  },
  kk: {
    through: (gas) => ({ title: `${gas} судан өтіп жатыр`, say: 'Газ көпіршіктері сұйықтық арқылы көтеріледі: бұл газ суда іс жүзінде ерімейді.', why: 'Сондықтан сутек пен оттекті суды ығыстыру әдісімен жинайды.' }),
    limewater: { title: 'Әк суы лайланды', say: 'Көмірқышқыл газ ⟦CO2⟧ әк суымен әрекеттеседі: кальций карбонатының ⟦CaCO3⟧ ақ тұнбасы түседі.', why7: 'Әк суының лайлануы газдың көмірқышқыл газ екенін дәлелдейді.', why: 'Бұл көмірқышқыл газға сапалық реакция. Газды әрі қарай өткізсе, тұнба ериді: еритін кальций гидрокарбонаты түзіледі.' },
    clears: { title: 'Лай жоғалды', say: 'Көмірқышқыл газ артық болғанда кальций карбонаты еритін гидрокарбонатқа ⟦Ca(HCO3)2⟧ айналады, ерітінді қайтадан мөлдір болады.', why: 'Табиғатта үңгірлер осылай пайда болады: көмірқышқыл газы бар су әктасты ерітеді.' },
    noCurrent: { title: 'Ток өтпейді', say: 'Шам жанбайды: сұйықтықта заряд тасымалдайтын иондар жоқ. Тұз, қышқыл немесе сілті қос.', why: 'Дистилденген су мен қант ерітіндісі — бейэлектролиттер. Тұздардың, қышқылдардың және сілтілердің ерітінділері — электролиттер: оларда бос иондар бар.' }
  },
  en: {
    through: (gas) => ({ title: `${gas} bubbles through the water`, say: 'Gas bubbles rise through the liquid: this gas hardly dissolves in water.', why: 'That is why hydrogen and oxygen are collected over water.' }),
    limewater: { title: 'The limewater turned cloudy', say: 'Carbon dioxide ⟦CO2⟧ reacts with limewater: a white precipitate of calcium carbonate ⟦CaCO3⟧ forms.', why7: 'Cloudy limewater proves that the gas is carbon dioxide.', why: 'This is the test for carbon dioxide. If you keep bubbling the gas, the precipitate dissolves as soluble calcium hydrogen carbonate forms.' },
    clears: { title: 'The cloudiness disappeared', say: 'With excess carbon dioxide, calcium carbonate turns into soluble calcium hydrogen carbonate ⟦Ca(HCO3)2⟧ and the solution clears again.', why: 'This is how caves form: water with carbon dioxide dissolves limestone.' },
    noCurrent: { title: 'No current', say: 'The bulb stays off: there are no ions in the liquid to carry the charge. Add a salt, an acid or an alkali.', why: 'Distilled water and sugar solution are non-electrolytes. Solutions of salts, acids and alkalis are electrolytes: they contain free ions.' }
  }
};

export function apparatusEvents(lang: Lang): Pick<EventTexts, Kinds> {
  const misc = MISC[lang];
  const el = ELECTRO[lang];
  return {
    gasAbsorbed: (p): EventText => ABSORB[lang][p.gas] ?? ABSORB[lang].CO2,
    gasThrough: (p, h: H): EventText => misc.through(h.cap(h.N(p.gas))),
    co2Limewater: (): EventText => misc.limewater,
    limewaterClears: (): EventText => misc.clears,
    gasTest: (p): EventText => TESTS[lang][p.result] ?? TESTS[lang].noGas,
    electrolysis: (p): EventText => {
      const metal = p.cathode !== 'H2';
      return {
        title: (metal ? el.title[p.cathode] : el.title[`H2|${p.anode}`]) ?? el.title['H2|O2'],
        say: el.say(el.cathode[p.cathode] ?? el.cathode.H2, el.anode[p.anode] ?? el.anode.O2),
        why: el.why
      };
    },
    noCurrent: (): EventText => misc.noCurrent
  };
}

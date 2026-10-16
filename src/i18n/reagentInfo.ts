// Everyday facts and hazards for reagents on the shelf, in three languages.

import type { L3 } from '../engine/data';

export interface ReagentInfo { life: L3; hazard?: L3 }

const L = (kk: string, ru: string, en: string): L3 => ({ kk, ru, en });

const CORROSIVE = L('Күйдіргіш: теріге және көзге тисе, көп сумен жу.', 'Едкое: при попадании на кожу или в глаза промыть большим количеством воды.', 'Corrosive: if it gets on skin or in the eyes, rinse with plenty of water.');
const CAUTION = L('Ауызға алма, көзді қорға.', 'Не пробовать на вкус, беречь глаза.', 'Do not taste, protect your eyes.');

export const REAGENT_INFO: Record<string, ReagentInfo> = {
  HCl: {
    life: L('Асқазан сөлінде болады — тағамды қорытуға көмектеседі. Сантехниканы тазалайтын құралдарға қосылады.', 'Есть в желудочном соке — помогает переваривать пищу. Входит в средства для чистки сантехники.', 'Found in stomach juice, where it helps digest food. Used in toilet and tile cleaners.'),
    hazard: CORROSIVE
  },
  HCl01: { life: L('Сұйылтылған ерітінді: титрлеуде концентрациясы дәл белгілі болуы керек.', 'Разбавленный раствор с точно известной концентрацией — нужен для титрования.', 'A dilute solution of exactly known strength, used for titration.'), hazard: CAUTION },
  HClx: { life: L('Концентрациясын титрлеу арқылы өзің анықта.', 'Концентрацию этой кислоты нужно определить самому — титрованием.', 'Find the strength of this acid yourself by titration.'), hazard: CAUTION },
  H2SO4: {
    life: L('Автомобиль аккумуляторында сұйылтылған күкірт қышқылы бар. Тыңайтқыш өндірісінде ең көп қолданылатын қышқыл.', 'Разбавленная серная кислота залита в автомобильные аккумуляторы. Больше всего её тратят на производство удобрений.', 'Dilute sulfuric acid is the liquid in car batteries. Most of it goes into making fertilisers.'),
    hazard: CORROSIVE
  },
  H2SO4c: {
    life: L('Өте күшті су тартқыш: қағазды, қантты және матаны көмірге айналдырады.', 'Очень сильно отнимает воду: обугливает бумагу, сахар и ткань.', 'Pulls water out of things so strongly that it chars paper, sugar and cloth.'),
    hazard: L('Өте күйдіргіш! Тек суға қышқылды құй, керісінше емес.', 'Очень едкая! Лить только кислоту в воду, никогда наоборот.', 'Very corrosive! Always pour acid into water, never the other way round.')
  },
  HNO3: {
    life: L('Тыңайтқыштар (селитра) мен бояулар алу үшін қолданылады.', 'Из неё делают удобрения (селитру) и красители.', 'Used to make fertilisers (nitrates) and dyes.'),
    hazard: L('Күйдіргіш, теріні сарғайтады.', 'Едкая, оставляет на коже жёлтые пятна.', 'Corrosive and stains skin yellow.')
  },
  H3PO4: {
    life: L('Кейбір газдалған сусындарға қышқылдық беру үшін қосылады. Тот кетіргіштерде бар.', 'Добавляют в некоторые газированные напитки для кислого вкуса. Входит в средства от ржавчины.', 'Added to some fizzy drinks for a sour taste, and used in rust removers.'),
    hazard: CAUTION
  },
  CH3COOH: {
    life: L('Ас сірке суы — оның 9%-дық ерітіндісі. Тағамға және тазалауға қолданылады.', 'Столовый уксус — это её 9-процентный раствор. Используют в кулинарии и для чистки накипи.', 'Table vinegar is a 9% solution of it, used in cooking and to remove limescale.'),
    hazard: L('Концентрлі сірке қышқылы күйдіреді, иісі өткір.', 'Концентрированная уксусная кислота обжигает, у неё резкий запах.', 'Concentrated acetic acid burns and has a sharp smell.')
  },
  NaOH: {
    life: L('Каустикалық сода: құбыр тазалағыштарда және сабын жасауда қолданылады.', 'Каустическая сода: из неё делают средства для прочистки труб и мыло.', 'Caustic soda: used in drain cleaners and to make soap.'),
    hazard: L('Өте күйдіргіш сілті, әсіресе көзге қауіпті.', 'Очень едкая щёлочь, особенно опасна для глаз.', 'A very caustic alkali, especially dangerous for the eyes.')
  },
  NaOH01: { life: L('Титрлеуге арналған дәл концентрациялы ерітінді.', 'Раствор с точной концентрацией для титрования.', 'A solution of exact strength for titration.'), hazard: CAUTION },
  KOH: {
    life: L('Сұйық сабын мен сілтілік батарейкаларда қолданылады.', 'Используется в жидком мыле и щелочных батарейках.', 'Used in liquid soap and alkaline batteries.'),
    hazard: L('Күйдіргіш сілті.', 'Едкая щёлочь.', 'A caustic alkali.')
  },
  CaOH2: {
    life: L('Сөндірілген әк: ағаш діңін ақтауға және құрылыста қолданылады. Әк суы көмірқышқыл газды анықтайды.', 'Гашёная известь: ею белят стволы деревьев и используют в стройке. Известковая вода помогает обнаружить углекислый газ.', 'Slaked lime: used to whitewash tree trunks and in building. Limewater detects carbon dioxide.'),
    hazard: CAUTION
  },
  BaOH2: { life: L('Сульфат-иондарды анықтау үшін зертханада қолданылады.', 'В лаборатории помогает обнаружить сульфат-ионы.', 'Used in the lab to detect sulfate ions.'), hazard: L('Барий қосылыстары улы.', 'Соединения бария ядовиты.', 'Barium compounds are toxic.') },
  NH3aq: {
    life: L('Нашатыр спирті — аммиактың 10%-дық ерітіндісі. Есінен танғанда иіскетеді, терезе жуатын құралдарға қосылады.', 'Нашатырный спирт — 10-процентный раствор аммиака. Его дают понюхать при обмороке, добавляют в средства для стёкол.', 'Household ammonia is about a 10% solution. It is used for fainting and in glass cleaners.'),
    hazard: L('Иісі өткір — тікелей иіскеме.', 'Резкий запах — не нюхать прямо из сосуда.', 'Sharp smell — never sniff it straight from the bottle.')
  },
  NaCl: {
    life: L('Ас тұзы. Қанда және теңіз суында болады. Тұздалған судан «физиологиялық ерітінді» жасайды.', 'Поваренная соль. Есть в крови и морской воде. Из её раствора делают физраствор для капельниц.', 'Table salt. Found in blood and seawater; its solution is used as saline in hospitals.')
  },
  NaCls: {
    life: L('Ас тұзы. Бір шай қасықта шамамен 6 г тұз бар.', 'Обычная поваренная соль. В чайной ложке примерно 6 г.', 'Ordinary table salt. A teaspoon holds about 6 g.')
  },
  KCl: { life: L('Калийлі тыңайтқыш. Кейбір «тұзсыз» тұздардың құрамында бар.', 'Калийное удобрение. Входит в «соль с пониженным содержанием натрия».', 'A potash fertiliser, also used in low-sodium salt.') },
  KI: { life: L('Йодталған тұзға қосылады — қалқанша безге йод керек.', 'Добавляют в йодированную соль: щитовидной железе нужен йод.', 'Added to iodised salt, because the thyroid gland needs iodine.') },
  CuSO4: {
    life: L('Мыс купоросы: бау-бақшада өсімдік ауруларына қарсы бүркеді.', 'Медный купорос: им опрыскивают сад от болезней растений.', 'Blue vitriol: gardeners spray it to protect plants from disease.'),
    hazard: L('Жұтса улы.', 'Ядовит при проглатывании.', 'Poisonous if swallowed.')
  },
  CuCl2: { life: L('Отшашулар жалынды көк-жасыл түске бояйды.', 'В фейерверках окрашивает пламя в сине-зелёный цвет.', 'Gives fireworks a blue-green flame.'), hazard: L('Жұтса улы.', 'Ядовит при проглатывании.', 'Poisonous if swallowed.') },
  FeCl3: { life: L('Суды тазалау кезінде лайды тұндырады. Баспа платаларын улауға қолданылады.', 'Очищает воду от мути на водопроводных станциях. Им травят печатные платы.', 'Clears muddy water at treatment plants and etches circuit boards.'), hazard: CAUTION },
  FeSO4: { life: L('Темір купоросы: бақшада мүкке қарсы, дәрілерде қан аздықта қолданылады.', 'Железный купорос: в саду — против мха, в таблетках — при нехватке железа в крови.', 'Iron sulfate: used against moss in gardens and in iron tablets for anaemia.') },
  AgNO3: {
    life: L('Ляпис: бұрын сүйелдерді күйдірген. Хлорид-иондарды анықтайды.', 'Ляпис: раньше им прижигали бородавки. Помогает найти хлорид-ионы.', 'Lunar caustic: once used to burn off warts. Detects chloride ions.'),
    hazard: L('Теріні қара дақтармен бояйды.', 'Оставляет на коже чёрные пятна.', 'Leaves black stains on skin.')
  },
  BaCl2: { life: L('Сульфат-иондарға сапалық реакция үшін қолданылады.', 'Нужен для качественной реакции на сульфат-ионы.', 'Used for the sulfate ion test.'), hazard: L('Улы — ауызға алма.', 'Ядовит — не пробовать на вкус.', 'Toxic — never taste it.') },
  Na2CO3: { life: L('Кальцийленген сода: кір жуғанда суды жұмсартады, шыны өндірісінде қолданылады.', 'Кальцинированная сода: смягчает воду при стирке, из неё делают стекло.', 'Washing soda: softens water for laundry and is used to make glass.'), hazard: CAUTION },
  NaHCO3: { life: L('Ас содасы: қамырды көпсітеді, қыжылды басады.', 'Пищевая сода: делает тесто пышным, помогает от изжоги.', 'Baking soda: makes dough rise and eases heartburn.') },
  CaCO3: { life: L('Бор, мәрмәр, әктас және жұмыртқа қабығы. Шәйнектегі қақ та — кальций карбонаты.', 'Мел, мрамор, известняк и яичная скорлупа. Накипь в чайнике — тоже карбонат кальция.', 'Chalk, marble, limestone and eggshells. Kettle scale is calcium carbonate too.') },
  Na2SO4: { life: L('Глаубер тұзы: шыны мен жуғыш ұнтақтар өндірісінде қолданылады.', 'Глауберова соль: используется в производстве стекла и стиральных порошков.', 'Glauber’s salt: used to make glass and washing powders.') },
  Na3PO4: { life: L('Қақты кетіретін құралдарда бар.', 'Входит в средства для удаления накипи.', 'Used in limescale removers.'), hazard: CAUTION },
  NH4Cl: { life: L('Нашатыр: дәнекерлеу кезінде металды тазалайды, батарейкаларда бар.', 'Нашатырь: очищает металл при пайке, есть в батарейках.', 'Sal ammoniac: cleans metal when soldering, found in batteries.') },
  KMnO4: { life: L('Марганцовка: жараны жуу үшін әлсіз күлгін ерітінді жасайды.', 'Марганцовка: слабым розовым раствором промывают раны.', 'Potassium permanganate: a weak pink solution is used to wash wounds.'), hazard: L('Күшті тотықтырғыш, теріні қоңыр түске бояйды.', 'Сильный окислитель, окрашивает кожу в коричневый цвет.', 'A strong oxidizer that stains skin brown.') },
  AlCl3: { life: L('Тер иісіне қарсы құралдарда (дезодоранттарда) бар.', 'Входит в антиперспиранты.', 'Used in antiperspirants.') },
  ZnSO4: { life: L('Мырыш тапшылығында дәрумендерге қосылады.', 'Добавляют в витамины при нехватке цинка.', 'Added to vitamin supplements for zinc.') },
  CaCl2: { life: L('Қыста жолдағы мұзды ерітеді. Дәріханада «кальций хлориді» деп сатылады.', 'Зимой им посыпают дороги от льда. Продаётся в аптеке.', 'Spread on roads in winter to melt ice; also sold in pharmacies.') },
  KSCN: { life: L('Темір(III) иондарын анықтайды — «қанды» түс береді.', 'Обнаруживает ионы железа(III) — даёт «кровавую» окраску.', 'Detects iron(III) ions with a blood-red color.'), hazard: CAUTION },
  Na2SiO3: { life: L('Сұйық шыны: кеңсе желімі мен отқа төзімді жабындар.', 'Жидкое стекло: канцелярский клей и огнезащитные пропитки.', 'Water glass: office glue and fireproof coatings.') },
  CuO: { life: L('Мыс заттары ауада қарайғанда бетінде мыс(II) оксиді түзіледі.', 'Когда медные вещи темнеют на воздухе, на них образуется оксид меди(II).', 'When copper objects darken in air, copper(II) oxide forms on them.') },
  CaO: { life: L('Сөндірілмеген әк: сумен қатты қызады. Ақтау мен құрылыс ерітінділеріне қолданылады.', 'Негашёная известь: с водой сильно греется. Нужна для побелки и строительных растворов.', 'Quicklime: gets very hot with water. Used for whitewash and mortar.'), hazard: L('Сумен әрекеттесіп, күйдіреді.', 'Реагирует с влагой кожи и обжигает.', 'Reacts with moisture on skin and burns.') },
  MgO: { life: L('Күйдірілген магнезия: асқазан қышқылын бейтараптайтын дәрілерде, спортшылардың қол ұнтағында.', 'Жжёная магнезия: в лекарствах от изжоги и в спортивной магнезии для рук.', 'Used in antacids and as climbers’ and gymnasts’ chalk.') },
  MnO2: { life: L('Батарейкаларда болады. Сутек пероксидінің ыдырауын жылдамдатады.', 'Есть в батарейках. Ускоряет разложение пероксида водорода.', 'Found in batteries; speeds up the breakdown of hydrogen peroxide.') },
  Na: { life: L('Натрий бу шамдары көшені сары жарықпен жарықтандырады.', 'Натриевые лампы освещают улицы жёлтым светом.', 'Sodium lamps light streets with yellow light.'), hazard: L('Сумен қопарылыс беруі мүмкін. Тек бұршақтай кесегін ал.', 'С водой может взорваться. Брать только кусочек размером с горошину.', 'Can explode with water. Use only a pea-sized piece.') },
  Ca: { life: L('Сүйек пен тіс құрамында кальций қосылыстары бар.', 'Соединения кальция — основа костей и зубов.', 'Calcium compounds make up bones and teeth.'), hazard: L('Сумен әрекеттесіп, сутек бөледі.', 'Реагирует с водой с выделением водорода.', 'Reacts with water, giving off hydrogen.') },
  Mg: { life: L('Бенгал оттары мен жарқыл шамдары ақ жарықпен жанады.', 'Горит ослепительным белым светом — в бенгальских огнях и фейерверках.', 'Burns with dazzling white light in sparklers and fireworks.') },
  Al: { life: L('Фольга, ыдыс-аяқ, ұшақ пен сусын банкілері.', 'Фольга, посуда, самолёты и банки для напитков.', 'Foil, cookware, aircraft and drink cans.') },
  Zn: { life: L('Мырышталған шелек пен шатыр темірі тот баспайды.', 'Оцинкованные вёдра и кровля не ржавеют.', 'Galvanised buckets and roofing do not rust.') },
  Fe: { life: L('Шеге, болат, көпір. Қандағы гемоглобинде темір бар.', 'Гвозди, сталь, мосты. Железо есть в гемоглобине крови.', 'Nails, steel and bridges. Iron is also in haemoglobin in blood.') },
  Cu: { life: L('Электр сымдары, монеталар, қола мен жез.', 'Электрические провода, монеты, бронза и латунь.', 'Electric wires, coins, bronze and brass.') },
  phph: { life: L('Сілтіде таңқурай түске боялады. Бұрын ішті жүргізетін дәріге қосылған.', 'В щёлочи становится малиновым. Раньше входил в слабительное.', 'Turns crimson in alkali. It was once used as a laxative.') },
  litmus: { life: L('Қыналардан алынады. «Лакмус сынағы» деген сөз осыдан шыққан.', 'Его получают из лишайников. Отсюда выражение «лакмусовая бумажка».', 'Made from lichens — hence the phrase "litmus test".') },
  mo: { life: L('Қышқылдықты анықтауға арналған бояғыш.', 'Краситель для определения кислотности.', 'A dye used to tell how acidic a solution is.') },
  univ: { life: L('Индикатор қағазы бассейн суын және топырақты тексеруге қолданылады.', 'Бумажками с ним проверяют воду в бассейнах и кислотность почвы.', 'Test strips with it check pool water and soil acidity.') },
  H2O: { life: L('Дистилденген суда тұздар жоқ — оны үтікке және автомобиль аккумуляторына құяды.', 'В дистиллированной воде нет солей — её заливают в утюги и аккумуляторы.', 'Distilled water has no dissolved salts — it goes into irons and car batteries.') },
  H2O2: { life: L('Дәрі қобдишасындағы «перекись» — жараны залалсыздандырады, көпіршіктенеді.', '«Перекись» из аптечки: обеззараживает ранки и пенится на них.', 'The peroxide in a first-aid kit: it disinfects cuts and fizzes on them.'), hazard: CAUTION },
  sugar: { life: L('Кәдімгі қант. Бір шай қасықта шамамен 5 г.', 'Обычный сахар. В чайной ложке примерно 5 г.', 'Ordinary sugar. A teaspoon holds about 5 g.') }
};

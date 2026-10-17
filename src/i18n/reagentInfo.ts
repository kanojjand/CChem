// Everyday facts and hazards for reagents on the shelf, in three languages.

import type { L3 } from '../engine/data';

export interface ReagentInfo { life: L3; hazard?: L3 }

const L = (kk: string, ru: string, en: string): L3 => ({ kk, ru, en });

const CORROSIVE = L('Күйдіргіш: теріге және көзге тисе, көп сумен жу.', 'Едкое: при попадании на кожу или в глаза промыть большим количеством воды.', 'Corrosive: if it gets on skin or in the eyes, rinse with plenty of water.');
const CAUTION = L('Ауызға алма, көзді қорға.', 'Не пробовать на вкус, беречь глаза.', 'Do not taste, protect your eyes.');

const HEAVY = L('Улы: ауызға, теріге тигізбе, қолғаппен жұмыс істе, қалдығын арнайы ыдысқа төк.', 'Ядовито: не допускать попадания в рот и на кожу, работать в перчатках, остатки сливать в отдельную банку.', 'Toxic: keep away from mouth and skin, wear gloves, pour leftovers into a waste jar.');
const CR6 = L('Хром(VI) қосылыстары улы және ісік тудыруы мүмкін: тек қолғаппен, тартпа шкафында.', 'Соединения хрома(VI) ядовиты и могут вызывать рак: только в перчатках и под тягой.', 'Chromium(VI) compounds are toxic and can cause cancer: gloves and fume hood only.');
const ALKALI_METAL = L('Сумен қатты әрекеттеседі: тек пинцетпен, бұршақтай кесекпен, экран артында.', 'Бурно реагирует с водой: брать только пинцетом, кусочком с горошину, за экраном.', 'Reacts violently with water: tweezers only, a pea-sized piece, behind a screen.');
const FUME = L('Буы улы әрі тітіркендіргіш: тек тартпа шкафында жұмыс істе.', 'Пары ядовиты и раздражают дыхательные пути: работать только под тягой.', 'Toxic, irritating fumes: work only in a fume hood.');

export const REAGENT_INFO: Record<string, ReagentInfo> = {
  HClc: {
    life: L('Концентрлі тұз қышқылы ауада «түтіндейді»: хлорсутек буланып, ауадағы ылғалмен тұман түзеді. Зертханада хлор алу үшін қолданылады.', 'Концентрированная соляная кислота «дымит» на воздухе: хлороводород испаряется и с влагой воздуха образует туман. В лаборатории из неё получают хлор.', 'Concentrated hydrochloric acid fumes in air: hydrogen chloride escapes and forms a mist with moisture. In the lab it is used to make chlorine.'),
    hazard: L('Өте күйдіргіш, булары тыныс жолдарын тітіркендіреді. Тек тартпа шкафта.', 'Очень едкая, пары раздражают дыхательные пути. Только под тягой.', 'Very corrosive; the fumes irritate the airways. Fume hood only.')
  },
  HNO3c: {
    life: L('Концентрлі азот қышқылы — күшті тотықтырғыш: мысты да ерітеді, ал темір мен алюминийді суықта пассивтейді. Тыңайтқыштар мен жарылғыш заттар өндірісінде қолданылады.', 'Концентрированная азотная кислота — сильный окислитель: растворяет даже медь, а железо и алюминий на холоде пассивирует. Из неё делают удобрения и взрывчатые вещества.', 'Concentrated nitric acid is a strong oxidiser: it dissolves even copper but passivates iron and aluminium in the cold. It is used to make fertilisers and explosives.'),
    hazard: L('Өте күйдіргіш, теріні сарғайтады; металдармен улы қоңыр газ NO₂ береді. Тек тартпа шкафта.', 'Очень едкая, оставляет жёлтые пятна на коже; с металлами даёт ядовитый бурый газ NO₂. Только под тягой.', 'Very corrosive, stains skin yellow; with metals it gives toxic brown NO₂. Fume hood only.')
  },
  CaOH2s: {
    life: L('Сөндірілген әк: құрылыс ерітінділеріне, ағаш діңдерін ақтауға және қышқыл топырақты бейтараптауға қолданылады. Аммоний тұзымен қыздырғанда аммиак береді.', 'Гашёная известь: её добавляют в строительные растворы, белят ею стволы деревьев и раскисляют почву. С солями аммония при нагревании даёт аммиак.', 'Slaked lime: used in mortar, for whitewashing tree trunks and to make acid soil less acidic. Heated with ammonium salts it gives ammonia.'),
    hazard: L('Сілті: көзге тисе, көп сумен жу.', 'Щёлочь: при попадании в глаза промыть большим количеством воды.', 'An alkali: rinse eyes with plenty of water if it gets in them.')
  },
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
  sugar: { life: L('Кәдімгі қант. Бір шай қасықта шамамен 5 г.', 'Обычный сахар. В чайной ложке примерно 5 г.', 'Ordinary sugar. A teaspoon holds about 5 g.') },
  NaOHs: {
    life: L('Қатты сілті түйіршіктері. Суда ерігенде қатты қызады; ауадан ылғал мен көмірқышқыл газды сіңіреді.', 'Твёрдая щёлочь в гранулах. При растворении сильно нагревается; на воздухе впитывает влагу и углекислый газ.', 'Solid alkali pellets. They get very hot when dissolved and soak up moisture and carbon dioxide from the air.'),
    hazard: L('Өте күйдіргіш! Суық суға аз-аздан сал, көзілдірікпен жұмыс істе.', 'Очень едкая! Добавлять в холодную воду понемногу, работать в очках.', 'Very caustic! Add to cold water a little at a time and wear goggles.')
  },
  KBr: { life: L('Бұрын тыныштандыратын дәрі ретінде қолданылған. Фотопленкаларда күміс бромиді жарыққа сезімтал.', 'Раньше применялся как успокоительное. В фотоплёнке бромид серебра чувствителен к свету.', 'Once used as a sedative. Silver bromide in photographic film is sensitive to light.'), hazard: CAUTION },
  LiCl: { life: L('Литий тұздары жалынды қызыл түске бояйды — отшашуда қолданылады. Литий батареяларда маңызды.', 'Соли лития окрашивают пламя в красный цвет — их используют в салютах. Литий важен для аккумуляторов.', 'Lithium salts turn a flame red and are used in fireworks. Lithium is key to rechargeable batteries.'), hazard: CAUTION },
  MgSO4: { life: L('Ағылшын тұзы: ваннаға қосады, медицинада қолданылады. Магний өсімдіктерге тыңайтқыш ретінде керек.', 'Английская соль: её добавляют в ванны и применяют в медицине. Магний нужен растениям как удобрение.', 'Epsom salt: added to baths and used in medicine. Plants need magnesium as a fertiliser.') },
  Na2S: {
    life: L('Былғары өңдеуде жүнді кетіру үшін қолданылады. Қышқылмен күкіртсутек бөледі.', 'Применяется при выделке кожи, чтобы удалить шерсть. С кислотой выделяет сероводород.', 'Used in leather making to remove hair. With acid it gives off hydrogen sulfide.'),
    hazard: L('Күйдіргіш; қышқылмен араласқанда улы күкіртсутек бөлінеді.', 'Едкий; при смешивании с кислотой выделяется ядовитый сероводород.', 'Corrosive; with acid it releases toxic hydrogen sulfide.')
  },
  Na2SO3: { life: L('Консервант (E221) және фотоэрітінділерде қолданылады. Судағы оттекті байланыстырады.', 'Консервант (E221), используется в фоторастворах. Связывает кислород в воде.', 'A preservative (E221) also used in photo developers. It removes oxygen from water.'), hazard: CAUTION },
  Na2S2O3: { life: L('Фотосуретті бекіту үшін қолданылған («гипосульфит»). Йод дақтарын кетіреді.', 'Использовался для закрепления фотографий («гипосульфит»). Выводит пятна иода.', 'Used to fix photographs ("hypo"). It removes iodine stains.') },
  K2CrO4: { life: L('Сары пигменттер мен күміс иондарын анықтауда қолданылады.', 'Применяется для жёлтых пигментов и для обнаружения ионов серебра.', 'Used for yellow pigments and to detect silver ions.'), hazard: CR6 },
  K2Cr2O7: { life: L('Хромпик: бұрын терілерді илеуге және ағашты бояуға қолданылған. Ерітіндісі қызғылт сары.', 'Хромпик: раньше применялся для дубления кожи и окраски дерева. Раствор оранжевый.', 'Once used to tan leather and stain wood. Its solution is orange.'), hazard: CR6 },
  PbNO32: { life: L('Иодидпен әдемі алтын түсті тұнба береді — «алтын жаңбыр» тәжірибесі.', 'С иодидом даёт красивый золотистый осадок — опыт «золотой дождь».', 'With iodide it gives a beautiful golden precipitate — the "golden rain" experiment.'), hazard: HEAVY },
  NiSO4: { life: L('Металды никельмен қаптау (никельдеу) үшін ваннада қолданылады. Ерітіндісі жасыл.', 'Используется в ваннах для никелирования металла. Раствор зелёный.', 'Used in baths for nickel plating. Its solution is green.'), hazard: HEAVY },
  CoCl2: { life: L('Ылғалдылық индикаторы: құрғақ кезде көк, ылғалда қызғылт. Кобальт көк шыны мен бояуларда бар.', 'Индикатор влажности: сухой — синий, влажный — розовый. Кобальт даёт синий цвет стеклу и краскам.', 'A humidity indicator: blue when dry, pink when damp. Cobalt gives glass and paints a blue color.'), hazard: HEAVY },
  MnSO4: { life: L('Марганец өсімдіктерге керек микротыңайтқыш. Ерітіндісі ақшыл қызғылт.', 'Марганец — микроудобрение, нужное растениям. Раствор бледно-розовый.', 'Manganese is a trace fertiliser for plants. The solution is pale pink.'), hazard: CAUTION },
  CrCl3: { life: L('Хром(III) қосылыстары жасыл түсті. Металды хромдау және бояулар үшін қолданылады.', 'Соединения хрома(III) зелёные. Применяются для хромирования и в красках.', 'Chromium(III) compounds are green. Used for chrome plating and paints.'), hazard: CAUTION },
  SnCl2: { life: L('Металды қалайымен қаптау және айнаға күміс жалату алдында шыныны өңдеу үшін қолданылады.', 'Применяется для лужения и при изготовлении зеркал — для подготовки стекла.', 'Used for tin plating and to prepare glass before silvering mirrors.'), hazard: CAUTION },
  KNO3s: { life: L('Калий селитрасы: тыңайтқыш және қара дәрінің бөлігі. Ерігенде суды салқындатады.', 'Калийная селитра: удобрение и часть чёрного пороха. Растворяясь, охлаждает воду.', 'Saltpetre: a fertiliser and part of black powder. It cools water as it dissolves.'), hazard: L('Тотықтырғыш: жанатын заттардан алыс сақта.', 'Окислитель: хранить вдали от горючих веществ.', 'An oxidizer: keep away from things that burn.') },
  NH4NO3s: { life: L('Аммиак селитрасы — кең тараған азот тыңайтқышы. Суық компрестерде қолданылады.', 'Аммиачная селитра — самое распространённое азотное удобрение. Используется в холодных компрессах.', 'Ammonium nitrate is a common nitrogen fertiliser and is used in instant cold packs.'), hazard: L('Тотықтырғыш: қыздырма, жанатын заттармен араластырма.', 'Окислитель: не нагревать и не смешивать с горючими веществами.', 'An oxidizer: do not heat it or mix it with things that burn.') },
  NH4Cls: { life: L('Нашатыр: дәнекерлегенде металды тазалайды. Қыздырғанда «айдалып», суық жерге қонады.', 'Нашатырь: очищает металл при пайке. При нагревании «возгоняется» и оседает на холодных стенках.', 'Sal ammoniac: cleans metal for soldering. On heating it seems to sublime and settles on cool glass.'), hazard: CAUTION },
  CuSO4s: { life: L('Мыс купоросы: бау-бақшада өсімдік ауруларына қарсы бүркеді. Кристалдарды өсіруге ыңғайлы.', 'Медный купорос: им опрыскивают сады от болезней растений. Из него удобно выращивать кристаллы.', 'Blue vitriol: sprayed in gardens against plant diseases and great for growing crystals.'), hazard: L('Жұтса улы, көзді тітіркендіреді.', 'Ядовит при проглатывании, раздражает глаза.', 'Harmful if swallowed, irritates the eyes.') },
  KMnO4s: { life: L('«Марганцовка» кристалдары. Қыздырғанда оттек бөледі — мектепте оттекті осылай алады.', 'Кристаллы «марганцовки». При нагревании выделяют кислород — так его получают в школе.', 'Permanganate crystals. On heating they give off oxygen — the school way to make it.'), hazard: L('Күшті тотықтырғыш, теріні қоңыр түске бояйды.', 'Сильный окислитель, окрашивает кожу в бурый цвет.', 'A strong oxidizer that stains skin brown.') },
  malachite: { life: L('Жасыл малахит тасы — әшекейлер жасалады. Ескі мыс заттардағы жасыл қабат та осындай зат.', 'Камень малахит — из него делают украшения. Зелёный налёт на старой меди — похожее вещество.', 'Malachite is a green gemstone used in jewellery. The green coating on old copper is a similar substance.'), hazard: CAUTION },
  NH42Cr2O7: { life: L('Қыздырғанда «жанартау» береді: ұшқын шашып, жасыл хром(III) оксидіне айналады.', 'При нагревании даёт «вулкан»: с искрами превращается в зелёный оксид хрома(III).', 'On heating it makes a "volcano", turning into green chromium(III) oxide with sparks.'), hazard: CR6 },
  ZnO: { life: L('Мырыш ақтығы: күннен қорғайтын кремдерде, балалар ұнтағында және ақ бояуда бар.', 'Цинковые белила: есть в солнцезащитных кремах, детской присыпке и белой краске.', 'Zinc white: found in sunscreen, baby powder and white paint.') },
  Fe2O3: { life: L('Тоттың негізі. Қызыл-қоңыр пигмент ретінде бояу мен кірпіште қолданылады.', 'Основа ржавчины. Красно-бурый пигмент в красках и кирпиче.', 'The main part of rust. A red-brown pigment in paints and bricks.') },
  SiO2: { life: L('Өзен құмы мен кварц. Шыны, бетон және кремний чиптері құмнан жасалады.', 'Речной песок и кварц. Из песка делают стекло, бетон и кремниевые чипы.', 'River sand and quartz. Glass, concrete and silicon chips are made from sand.') },
  Li: { life: L('Ең жеңіл металл — судан да, керосиннен де жеңіл. Телефон мен электромобиль батареяларында бар.', 'Самый лёгкий металл — легче воды и даже керосина. Есть в аккумуляторах телефонов и электромобилей.', 'The lightest metal, lighter than water and even kerosene. Found in phone and electric car batteries.'), hazard: ALKALI_METAL },
  K: { life: L('Калий қосылыстары — өсімдіктерге керек тыңайтқыштар. Металдың өзі сумен тұтанып кетеді.', 'Соединения калия — удобрения, нужные растениям. Сам металл с водой воспламеняется.', 'Potassium compounds are plant fertilisers. The metal itself catches fire with water.'), hazard: L('Өте қауіпті: сумен тұтанып, жарылуы мүмкін. Тәжірибені тек мұғалім көрсетеді.', 'Очень опасен: с водой воспламеняется и может взорваться. Опыт показывает только учитель.', 'Very dangerous: it catches fire with water and may explode. Only the teacher shows this.') },
  Ba: { life: L('Барий қосылыстары жалынды жасыл түске бояйды. Барий сульфаты асқазан рентгенінде қолданылады.', 'Соединения бария окрашивают пламя в зелёный цвет. Сульфат бария применяют при рентгене желудка.', 'Barium compounds turn a flame green. Barium sulfate is used for stomach X-rays.'), hazard: ALKALI_METAL },
  Mn: { life: L('Болатқа беріктік береді — темір жол рельстері марганецті болаттан жасалады.', 'Делает сталь прочнее — из марганцовистой стали делают рельсы.', 'Makes steel tougher; railway rails are made of manganese steel.'), hazard: CAUTION },
  Ni: { life: L('Тиындар, тот баспайтын болат және никельдеу. Магнитке тартылады.', 'Монеты, нержавеющая сталь, никелирование. Притягивается магнитом.', 'Coins, stainless steel and nickel plating. It is attracted by a magnet.'), hazard: L('Кейбір адамдарда аллергия тудырады; ұнтағын жұтпа.', 'У некоторых людей вызывает аллергию; не вдыхать порошок.', 'Can cause allergies in some people; do not breathe in the powder.') },
  Sn: { life: L('Консерві құтылары қалайымен қапталады. Дәнекерлеуге арналған сымның негізі.', 'Консервные банки покрывают оловом. Основа припоя для пайки.', 'Food cans are coated with tin, and it is the main part of solder.') },
  Pb: { life: L('Ауыр, жұмсақ металл. Автомобиль аккумуляторларында және радиациядан қорғауда қолданылады.', 'Тяжёлый мягкий металл. Используется в автомобильных аккумуляторах и для защиты от радиации.', 'A heavy, soft metal used in car batteries and for radiation shielding.'), hazard: HEAVY },
  Ag: { life: L('Әшекейлер мен күміс қасықтар. Металдардың ішінде электр тогын ең жақсы өткізеді.', 'Украшения и серебряные ложки. Лучше всех металлов проводит электрический ток.', 'Jewellery and silver spoons. It conducts electricity better than any other metal.') },
  Pt: { life: L('Асыл металл: автомобиль катализаторлары мен әшекейлерде. Ешбір қышқылда ерімейді.', 'Благородный металл: в автомобильных катализаторах и украшениях. Не растворяется ни в одной кислоте.', 'A precious metal used in car catalytic converters and jewellery. No single acid dissolves it.') },
  Au: { life: L('Алтын тотықпайды және қараймайды. Оны тек «патша сұйығы» ерітеді. Қазақстанда Васильковское кен орны бар.', 'Золото не окисляется и не тускнеет. Его растворяет только «царская водка». В Казахстане есть Васильковское месторождение.', 'Gold does not rust or tarnish; only aqua regia dissolves it. Kazakhstan has the Vasilkovskoye gold deposit.') },
  S: { life: L('Сары ұнтақ. Сіріңке, резеңке және күкірт қышқылын алу үшін қажет. Көп күкіртті мұнай мен газды тазартқанда алады — Теңіз кен орнында оның үлкен үйінділері бар.', 'Жёлтый порошок. Нужна для спичек, резины и серной кислоты. Много серы получают при очистке нефти и газа — на месторождении Тенгиз её огромные запасы.', 'A yellow powder used for matches, rubber and sulfuric acid. A lot of sulfur comes from cleaning oil and gas; the Tengiz field holds huge stockpiles.'), hazard: L('Жанғыш; жанғанда улы күкірт(IV) оксиді түзіледі.', 'Горюча; при горении образуется ядовитый сернистый газ.', 'Flammable; burning sulfur gives toxic sulfur dioxide.') },
  C: { life: L('Белсендірілген көмір таблеткалары уды сіңіреді, көмір сүзгілер суды тазартады.', 'Таблетки активированного угля поглощают яды, угольные фильтры очищают воду.', 'Activated charcoal tablets soak up poisons and charcoal filters clean water.') },
  I2: { life: L('Дәріханадағы йод тұнбасы — спирттегі ерітіндісі. Йод қалқанша безге керек, сондықтан тұзды йодтайды.', 'Аптечная «йодная настойка» — его раствор в спирте. Иод нужен щитовидной железе, поэтому соль йодируют.', 'Tincture of iodine from the pharmacy is iodine in alcohol. The thyroid needs iodine, so table salt is iodised.'), hazard: L('Буы тітіркендіреді, теріні қоңыр түске бояйды.', 'Пары раздражают, окрашивает кожу в бурый цвет.', 'The vapour is irritating and it stains skin brown.') },
  Si: { life: L('Компьютер чиптері мен күн батареялары таза кремнийден жасалады.', 'Компьютерные чипы и солнечные батареи делают из чистого кремния.', 'Computer chips and solar panels are made of pure silicon.') },
  Cl2aq: { life: L('Хлорлы су ауыз суды залалсыздандырады және матаны ағартады.', 'Хлорной водой обеззараживают питьевую воду и отбеливают ткань.', 'Chlorine water disinfects drinking water and bleaches cloth.'), hazard: FUME },
  Br2aq: { life: L('Бром — бөлме температурасында сұйық болатын жалғыз бейметалл. Бромды су қанықпаған заттарды анықтайды.', 'Бром — единственный неметалл, который при комнатной температуре жидкий. Бромная вода обнаруживает непредельные вещества.', 'Bromine is the only nonmetal that is liquid at room temperature. Bromine water detects unsaturated compounds.'), hazard: FUME },
  starch: { life: L('Картоп, нан, күріш крахмалға бай. Йодпен қою көк түс береді.', 'Крахмалом богаты картофель, хлеб и рис. С иодом даёт тёмно-синий цвет.', 'Potatoes, bread and rice are rich in starch. It turns dark blue with iodine.') },
  ice: { life: L('Мұз 0 °C-та ериді және еру үшін көп жылу алады — сондықтан сусынды жақсы салқындатады.', 'Лёд тает при 0 °C и забирает много тепла на таяние — поэтому хорошо охлаждает напитки.', 'Ice melts at 0 °C and takes in a lot of heat as it melts, which is why it cools drinks so well.') }
};

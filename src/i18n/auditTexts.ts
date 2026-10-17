// Texts for redox of iron, halogens with alkali and thiosulfate, dissolved H2S and SO2,
// carbonic acid with silicate, aluminate with weak acids, magnesium with ammonium salts,
// nitric acid as an oxidiser and hydroxides darkening in air. Also variants of earlier events
// for the new cases: more reducers for permanganate and dichromate, joint hydrolysis with
// sulfites, silicates and sulfides, active metals in nitric acid, and so on.

import { IONS, type Lang } from '../engine/data';
import type { EventText, EventTexts, H } from './types';

type NewKinds =
  | 'iron2Ox' | 'iron3Reduce' | 'halogenAlkali' | 'halogenThio' | 'halogenReduce' | 'sulfurComprop'
  | 'carbonicSilicate' | 'aluminateAcid' | 'metalAmmonium' | 'nitricRedox' | 'hydroxideAir';
type Fn = (p: Record<string, string>, h: H) => EventText;

const HAL_ION: Record<string, string> = { Cl2: 'Cl^-', Br2: 'Br^-', I2: 'I^-' };

// ---------------------------------------------------------------- Russian

const RU_HAL: Record<string, { nom: string; acc: string }> = {
  Cl2: { nom: 'хлор', acc: 'хлор' }, Br2: { nom: 'бром', acc: 'бром' }, I2: { nom: 'иод', acc: 'иод' }
};

const RU: Record<NewKinds, Fn> = {
  iron2Ox: (p, h) => p.solid
    ? {
        title: 'Зеленоватый осадок побурел',
        say: `Пероксид водорода сразу окислил ${h.NF('Fe(OH)2')} до бурого ${h.NF('Fe(OH)3')}. На воздухе это заняло бы много минут.`,
        why: 'Железо(II) легко окисляется до железа(III): Fe²⁺ − e⁻ → Fe³⁺. Пероксид водорода — сильный окислитель.'
      }
    : p.ox === 'HNO3'
      ? {
          title: 'Раствор пожелтел, выделяется газ',
          say: `Разбавленная азотная кислота окислила ионы железа(II) до железа(III) ${h.F('Fe^3+')}. Выделяется бесцветный ${h.NF('NO')}, который у горлышка буреет на воздухе.`,
          why7: 'Цвет раствора изменился — появилось новое вещество.',
          why: 'Азотная кислота — окислитель не только для металлов, но и для ионов железа(II). Добавь роданид калия: ионы Fe³⁺ дадут кроваво-красную окраску.'
        }
      : {
          title: 'Бледно-зелёный раствор пожелтел',
          say: `Пероксид водорода окислил ионы железа(II) до железа(III) ${h.F('Fe^3+')}.` +
            (p.acid ? '' : ' Без кислоты часть железа(III) сразу выпадает бурым осадком Fe(OH)₃.'),
          why7: 'Цвет раствора изменился — появилось новое вещество.',
          why: 'Проверь роданидом калия KSCN: с ионами Fe³⁺ раствор станет кроваво-красным, а с Fe²⁺ — нет. Так отличают соли железа(II) от солей железа(III).'
        },
  iron3Reduce: (p, h) => ({
    title: p.red === 'H2S' ? 'Выпала сера, раствор посветлел' : p.red === 'S2O3^2-' ? 'Раствор обесцветился' : 'Жёлто-бурый раствор посветлел',
    say: `Ионы железа(III) окислили ${({ 'SO3^2-': 'сульфит до сульфата', 'S2O3^2-': 'тиосульфат до тетратионата', H2S: 'сероводород до серы', SO2: 'сернистый газ до серной кислоты' } as Record<string, string>)[p.red] ?? 'восстановитель'}, а сами стали бледно-зелёными ионами железа(II) ${h.F('Fe^2+')}.` +
      (p.red === 'H2S' ? ' Мелкая сера делает раствор мутным.' : '') +
      (p.red === 'S2O3^2-' ? ' Сначала раствор на миг темнеет до фиолетового, потом обесцвечивается.' : ''),
    why: 'Fe³⁺ — окислитель: Fe³⁺ + e⁻ → Fe²⁺. Сульфит, тиосульфат, сероводород и сернистый газ — восстановители, поэтому вместо обмена идёт окислительно-восстановительная реакция.'
  }),
  halogenAlkali: (p, h) => ({
    title: p.ox === 'Cl2' ? 'Окраска и запах хлора исчезли' : p.ox === 'Br2' ? 'Бромная вода обесцветилась' : 'Иод обесцветился',
    say: p.ox === 'Cl2'
      ? `Хлор реагирует со щёлочью: получаются хлорид и гипохлорит ${h.F('ClO^-')}. Желтоватая окраска и резкий запах исчезают.`
      : p.ox === 'Br2'
        ? `Бром реагирует со щёлочью: получаются бромид и гипобромит ${h.F('BrO^-')}, раствор обесцвечивается.`
        : `В щёлочи иод превращается в бесцветные иодид и иодат ${h.F('IO3^-')}.`,
    why7: 'Окраска исчезла — галоген превратился в бесцветные соли.',
    why: 'Галоген здесь и окислитель, и восстановитель: часть атомов получает степень окисления −1, часть — +1 (у иода +5). Раствор гипохлорита натрия NaClO — бытовой отбеливатель и средство для дезинфекции.'
  }),
  halogenThio: (p, h) => ({
    title: 'Окраска галогена исчезла',
    say: `Тиосульфат восстановил ${RU_HAL[p.ox]?.acc ?? p.ox} до бесцветных ионов ${h.F(HAL_ION[p.ox] ?? 'Cl^-')}, а сам окислился до сульфата — в растворе появилась серная кислота.`,
    why: 'Хлор и бром — более сильные окислители, чем иод: иод окисляет тиосульфат только до тетратионата, а они — до сульфата. Поэтому тиосульфат называли «антихлором»: им удаляли остатки хлора из отбеленных тканей.'
  }),
  halogenReduce: (p, h) => p.red === 'H2S'
    ? {
        title: 'Галоген обесцветился, выпала сера',
        say: `Сероводород восстановил ${RU_HAL[p.ox]?.acc ?? p.ox} до бесцветных ионов ${h.F(HAL_ION[p.ox] ?? 'Cl^-')}, а сам окислился до серы ${h.F('S')} — раствор помутнел.`,
        why: 'Сероводород — сильный восстановитель: сера в нём имеет степень окисления −2 и отдаёт электроны.'
      }
    : {
        title: p.ox === 'Br2' ? 'Бромная вода обесцветилась' : p.ox === 'I2' ? 'Окраска иода исчезла' : 'Окраска хлорной воды исчезла',
        say: `Сернистый газ восстановил ${RU_HAL[p.ox]?.acc ?? p.ox} до бесцветных ионов ${h.F(HAL_ION[p.ox] ?? 'Cl^-')}, а сам окислился до серной кислоты.`,
        why: 'Обесцвечивание бромной воды — качественная реакция на сернистый газ: сера(+4) окисляется до серы(+6).'
      },
  sulfurComprop: (_p, h) => ({
    title: 'Выпала жёлтая сера',
    say: `Сернистый газ и сероводород встретились в растворе: ${h.F('SO2')} окислил ${h.F('H2S')}, и оба превратились в мелкую жёлтую серу ${h.F('S')}.`,
    why: 'Сера в SO₂ имеет степень окисления +4, в H₂S — −2, а в продукте 0. Так у вулканов из газов откладывается самородная сера.'
  }),
  carbonicSilicate: (_p, h) => ({
    title: 'Выпал студенистый осадок',
    say: `Углекислый газ вытеснил из силиката кремниевую кислоту ${h.F('H2SiO3')}: раствор превратился в прозрачный студень. В растворе остался карбонат.`,
    why7: 'Более сильная кислота вытесняет более слабую из её соли.',
    why: 'Угольная кислота слабая, но кремниевая ещё слабее. Поэтому раствор силиката натрия («жидкое стекло») мутнеет даже на воздухе — от углекислого газа.'
  }),
  aluminateAcid: (p, h) => ({
    title: 'Выпал белый студенистый осадок',
    say: p.acid === 'CO2'
      ? `Углекислый газ разрушил тетрагидроксоалюминат: выпал ${h.NF('Al(OH)3')}, в растворе остался гидрокарбонат.`
      : `Соль аммония разрушила тетрагидроксоалюминат: выпал ${h.NF('Al(OH)3')}, выделяется аммиак с резким запахом.`,
    why: 'Сильная кислота сразу растворила бы гидроксид алюминия снова. Слабые кислоты — угольная кислота и ион аммония — этого не могут, поэтому так получают чистый Al(OH)₃.'
  }),
  metalAmmonium: (p, h) => p.ion === 'NH4^+'
    ? {
        title: 'Магний растворяется, выделяются газы',
        say: `Магний растворяется в растворе соли аммония: выделяется водород, и чувствуется запах аммиака ${h.F('NH3')}.`,
        why: 'Раствор соли аммония слабокислый: ионы NH₄⁺ отдают ионы водорода. Активный магний забирает их, и выделяется водород.'
      }
    : {
        title: 'Выделяется водород, выпал осадок',
        say: `Магний не вытесняет ${h.ionMetal(p.ion)} из раствора. Раствор этой соли кислый из-за гидролиза: магний забирает ионы водорода, выделяется водород, а ${h.NF(p.product)} выпадает в осадок.`,
        why: 'Алюминий, хром и более активные металлы из водных растворов не восстанавливаются: вместо металла получается водород.'
      },
  nitricRedox: (p, h) => p.red === 'S^2-'
    ? {
        title: 'Выпала сера, выделяется газ',
        say: `Азотная кислота окислила сульфид до серы ${h.F('S')}, а сама восстановилась до ${h.NF('NO')}; у горлышка он буреет. Сероводород не выделяется.`,
        why: 'Азотная кислота — не только кислота, но и сильный окислитель за счёт азота(+5). Поэтому с сульфидами она ведёт себя иначе, чем соляная.'
      }
    : p.red === 'SO3^2-'
      ? {
          title: 'Выделяется бесцветный газ',
          say: `Азотная кислота окислила сульфит до сульфата ${h.F('SO4^2-')}. Вместо сернистого газа выделяется ${h.NF('NO')}, у горлышка он буреет.`,
          why: 'Азотная кислота — окислитель за счёт азота(+5): сера(+4) в сульфите окисляется до серы(+6).'
        }
      : {
          title: 'Раствор побурел — выделился иод',
          say: `Азотная кислота окислила иодид до иода ${h.F('I2')}, выделяется ${h.NF('NO')}.`,
          why: 'Азотная кислота — окислитель. Добавь крахмал — раствор станет тёмно-синим.'
        },
  hydroxideAir: (p, h) => p.solid === 'Fe(OH)2'
    ? {
        title: 'Осадок буреет',
        say: `Зеленоватый ${h.NF('Fe(OH)2')} постепенно, начиная с поверхности, окисляется кислородом воздуха до бурого ${h.NF('Fe(OH)3')}.`,
        why: 'Так же ржавеет железо: железо(II) переходит в железо(III). Поэтому растворы солей железа(II) хранят плотно закрытыми.'
      }
    : {
        title: 'Осадок темнеет',
        say: `Светлый ${h.NF('Mn(OH)2')} на воздухе постепенно темнеет: кислород окисляет его до бурого ${h.F('MnO(OH)2')}.`,
        why: 'Марганец(II) окисляется кислородом воздуха до марганца(IV).'
      }
};

// ---------------------------------------------------------------- Kazakh

const KK_HAL: Record<string, string> = { Cl2: 'хлорды', Br2: 'бромды', I2: 'йодты' };

const KK: Record<NewKinds, Fn> = {
  iron2Ox: (p, h) => p.solid
    ? {
        title: 'Жасылдау тұнба қоңырқайланды',
        say: `Сутек пероксиді ${h.NF('Fe(OH)2')} тұнбасын бірден қоңыр ${h.NF('Fe(OH)3')} тұнбасына дейін тотықтырды. Ауада бұл көп минутқа созылар еді.`,
        why: 'Темір(II) темір(III)-ке оңай тотығады: Fe²⁺ − e⁻ → Fe³⁺. Сутек пероксиді — күшті тотықтырғыш.'
      }
    : p.ox === 'HNO3'
      ? {
          title: 'Ерітінді сарғайды, газ бөлінеді',
          say: `Сұйылтылған азот қышқылы темір(II) иондарын темір(III) иондарына ${h.F('Fe^3+')} дейін тотықтырды. Түссіз ${h.NF('NO')} бөлінеді, ол пробирканың аузында ауада қоңырқайланады.`,
          why7: 'Ерітіндінің түсі өзгерді — жаңа зат пайда болды.',
          why: 'Азот қышқылы металдарды ғана емес, темір(II) иондарын да тотықтырады. Калий роданидін қос: Fe³⁺ иондары қан-қызыл түс береді.'
        }
      : {
          title: 'Ақшыл-жасыл ерітінді сарғайды',
          say: `Сутек пероксиді темір(II) иондарын темір(III) иондарына ${h.F('Fe^3+')} дейін тотықтырды.` +
            (p.acid ? '' : ' Қышқыл болмаса, темір(III)-тің бір бөлігі бірден қоңыр Fe(OH)₃ тұнбасына түседі.'),
          why7: 'Ерітіндінің түсі өзгерді — жаңа зат пайда болды.',
          why: 'Калий роданидімен (KSCN) тексер: Fe³⁺ иондарымен ерітінді қан-қызыл болады, ал Fe²⁺-пен — болмайды. Темір(II) мен темір(III) тұздарын осылай ажыратады.'
        },
  iron3Reduce: (p, h) => ({
    title: p.red === 'H2S' ? 'Күкірт түсті, ерітінді ағарды' : p.red === 'S2O3^2-' ? 'Ерітінді түссізденді' : 'Сары-қоңыр ерітінді ағарды',
    say: `Темір(III) иондары ${({ 'SO3^2-': 'сульфитті сульфатқа дейін', 'S2O3^2-': 'тиосульфатты тетратионатқа дейін', H2S: 'күкіртсутекті күкіртке дейін', SO2: 'күкірт(IV) оксидін күкірт қышқылына дейін' } as Record<string, string>)[p.red] ?? 'тотықсыздандырғышты'} тотықтырды, ал өздері ақшыл-жасыл темір(II) иондарына ${h.F('Fe^2+')} айналды.` +
      (p.red === 'H2S' ? ' Ұсақ күкірт ерітіндіні лайлайды.' : '') +
      (p.red === 'S2O3^2-' ? ' Алдымен ерітінді бір сәтке күлгін түске енеді, сосын түссізденеді.' : ''),
    why: 'Fe³⁺ — тотықтырғыш: Fe³⁺ + e⁻ → Fe²⁺. Сульфит, тиосульфат, күкіртсутек және күкірт(IV) оксиді — тотықсыздандырғыштар, сондықтан алмасудың орнына тотығу-тотықсыздану реакциясы жүреді.'
  }),
  halogenAlkali: (p, h) => ({
    title: p.ox === 'Cl2' ? 'Хлордың түсі мен иісі жоғалды' : p.ox === 'Br2' ? 'Бромды су түссізденді' : 'Йод түссізденді',
    say: p.ox === 'Cl2'
      ? `Хлор сілтімен әрекеттеседі: хлорид пен гипохлорит ${h.F('ClO^-')} түзіледі. Сарғыш түс пен өткір иіс жоғалады.`
      : p.ox === 'Br2'
        ? `Бром сілтімен әрекеттеседі: бромид пен гипобромит ${h.F('BrO^-')} түзіледі, ерітінді түссізденеді.`
        : `Сілтіде йод түссіз йодид пен йодатқа ${h.F('IO3^-')} айналады.`,
    why7: 'Түс жоғалды — галоген түссіз тұздарға айналды.',
    why: 'Мұнда галоген әрі тотықтырғыш, әрі тотықсыздандырғыш: атомдардың бір бөлігі −1, бір бөлігі +1 (йодта +5) тотығу дәрежесін алады. Натрий гипохлоритінің NaClO ерітіндісі — тұрмыстық ағартқыш әрі зарарсыздандыратын зат.'
  }),
  halogenThio: (p, h) => ({
    title: 'Галогеннің түсі жоғалды',
    say: `Тиосульфат ${KK_HAL[p.ox] ?? p.ox} түссіз ${h.F(HAL_ION[p.ox] ?? 'Cl^-')} иондарына дейін тотықсыздандырды, ал өзі сульфатқа дейін тотықты — ерітіндіде күкірт қышқылы пайда болды.`,
    why: 'Хлор мен бром йодтан күшті тотықтырғыштар: йод тиосульфатты тек тетратионатқа дейін, ал олар сульфатқа дейін тотықтырады. Сондықтан тиосульфатты «антихлор» деп атаған: ағартылған матадан хлор қалдығын онымен кетірген.'
  }),
  halogenReduce: (p, h) => p.red === 'H2S'
    ? {
        title: 'Галоген түссізденді, күкірт түсті',
        say: `Күкіртсутек ${KK_HAL[p.ox] ?? p.ox} түссіз ${h.F(HAL_ION[p.ox] ?? 'Cl^-')} иондарына дейін тотықсыздандырды, ал өзі күкіртке ${h.F('S')} дейін тотықты — ерітінді лайланды.`,
        why: 'Күкіртсутек — күшті тотықсыздандырғыш: ондағы күкірттің тотығу дәрежесі −2, ол электрон береді.'
      }
    : {
        title: p.ox === 'Br2' ? 'Бромды су түссізденді' : p.ox === 'I2' ? 'Йодтың түсі жоғалды' : 'Хлорлы судың түсі жоғалды',
        say: `Күкірт(IV) оксиді ${KK_HAL[p.ox] ?? p.ox} түссіз ${h.F(HAL_ION[p.ox] ?? 'Cl^-')} иондарына дейін тотықсыздандырды, ал өзі күкірт қышқылына дейін тотықты.`,
        why: 'Бромды судың түссізденуі — күкірт(IV) оксидіне сапалық реакция: күкірт(+4) күкірт(+6)-ға дейін тотығады.'
      },
  sulfurComprop: (_p, h) => ({
    title: 'Сары күкірт түсті',
    say: `Күкірт(IV) оксиді мен күкіртсутек ерітіндіде кездесті: ${h.F('SO2')} ${h.F('H2S')}-ті тотықтырды, екеуі де ұсақ сары күкіртке ${h.F('S')} айналды.`,
    why: 'SO₂-дегі күкірттің тотығу дәрежесі +4, H₂S-те −2, ал өнімде 0. Жанартаулардың маңында газдардан табиғи күкірт осылай жиналады.'
  }),
  carbonicSilicate: (_p, h) => ({
    title: 'Қоймалжың тұнба түсті',
    say: `Көмірқышқыл газ силикаттан кремний қышқылын ${h.F('H2SiO3')} ығыстырды: ерітінді мөлдір қоймалжыңға айналды. Ерітіндіде карбонат қалды.`,
    why7: 'Күштірек қышқыл әлсіз қышқылды оның тұзынан ығыстырады.',
    why: 'Көмір қышқылы әлсіз, бірақ кремний қышқылы одан да әлсіз. Сондықтан натрий силикатының ерітіндісі («сұйық шыны») ауада да көмірқышқыл газдан лайланады.'
  }),
  aluminateAcid: (p, h) => ({
    title: 'Ақ қоймалжың тұнба түсті',
    say: p.acid === 'CO2'
      ? `Көмірқышқыл газ тетрагидроксоалюминатты бұзды: ${h.NF('Al(OH)3')} тұнбаға түсті, ерітіндіде гидрокарбонат қалды.`
      : `Аммоний тұзы тетрагидроксоалюминатты бұзды: ${h.NF('Al(OH)3')} тұнбаға түсті, өткір иісті аммиак бөлінеді.`,
    why: 'Күшті қышқыл алюминий гидроксидін қайтадан ерітіп жіберер еді. Әлсіз қышқылдар — көмір қышқылы мен аммоний ионы — оны ерітпейді, сондықтан таза Al(OH)₃ осылай алынады.'
  }),
  metalAmmonium: (p, h) => p.ion === 'NH4^+'
    ? {
        title: 'Магний ериді, газдар бөлінеді',
        say: `Магний аммоний тұзының ерітіндісінде ериді: сутек бөлінеді, аммиактың ${h.F('NH3')} иісі сезіледі.`,
        why: 'Аммоний тұзының ерітіндісі әлсіз қышқылдық: NH₄⁺ иондары сутек иондарын береді. Белсенді магний оларды алады да, сутек бөлінеді.'
      }
    : {
        title: 'Сутек бөлінеді, тұнба түсті',
        say: `Магний ${h.ionMetal(p.ion)} металын ерітіндіден ығыстырмайды. Бұл тұздың ерітіндісі гидролиз салдарынан қышқылдық: магний сутек иондарын алады, сутек бөлінеді, ал ${h.NF(p.product)} тұнбаға түседі.`,
        why: 'Алюминий, хром және одан белсенді металдар сулы ерітіндіден тотықсызданбайды: металдың орнына сутек шығады.'
      },
  nitricRedox: (p, h) => p.red === 'S^2-'
    ? {
        title: 'Күкірт түсті, газ бөлінеді',
        say: `Азот қышқылы сульфидті күкіртке ${h.F('S')} дейін тотықтырды, ал өзі ${h.NF('NO')}-ке дейін тотықсызданды; ол пробирка аузында қоңырқайланады. Күкіртсутек бөлінбейді.`,
        why: 'Азот қышқылы — тек қышқыл емес, азот(+5) есебінен күшті тотықтырғыш. Сондықтан сульфидтермен ол тұз қышқылынан басқаша әрекеттеседі.'
      }
    : p.red === 'SO3^2-'
      ? {
          title: 'Түссіз газ бөлінеді',
          say: `Азот қышқылы сульфитті сульфатқа ${h.F('SO4^2-')} дейін тотықтырды. Күкірт(IV) оксидінің орнына ${h.NF('NO')} бөлінеді, ол пробирка аузында қоңырқайланады.`,
          why: 'Азот қышқылы азот(+5) есебінен тотықтырғыш: сульфиттегі күкірт(+4) күкірт(+6)-ға дейін тотығады.'
        }
      : {
          title: 'Ерітінді қоңырқайланды — йод бөлінді',
          say: `Азот қышқылы йодидті йодқа ${h.F('I2')} дейін тотықтырды, ${h.NF('NO')} бөлінеді.`,
          why: 'Азот қышқылы — тотықтырғыш. Крахмал қос — ерітінді қою көк түске енеді.'
        },
  hydroxideAir: (p, h) => p.solid === 'Fe(OH)2'
    ? {
        title: 'Тұнба қоңырқайланады',
        say: `Жасылдау ${h.NF('Fe(OH)2')} бетінен бастап ауа оттегімен біртіндеп қоңыр ${h.NF('Fe(OH)3')} тұнбасына дейін тотығады.`,
        why: 'Темір де осылай таттанады: темір(II) темір(III)-ке ауысады. Сондықтан темір(II) тұздарының ерітінділерін тығыз жабып сақтайды.'
      }
    : {
        title: 'Тұнба қараяды',
        say: `Ақшыл ${h.NF('Mn(OH)2')} ауада біртіндеп қараяды: оттек оны қоңыр ${h.F('MnO(OH)2')}-ге дейін тотықтырады.`,
        why: 'Марганец(II) ауа оттегімен марганец(IV)-ке дейін тотығады.'
      }
};

// ---------------------------------------------------------------- English

const EN_HAL: Record<string, string> = { Cl2: 'chlorine', Br2: 'bromine', I2: 'iodine' };

const EN: Record<NewKinds, Fn> = {
  iron2Ox: (p, h) => p.solid
    ? {
        title: 'The greenish precipitate turned brown',
        say: `Hydrogen peroxide at once oxidised ${h.NF('Fe(OH)2')} to brown ${h.NF('Fe(OH)3')}. In air this would take many minutes.`,
        why: 'Iron(II) is easily oxidised to iron(III): Fe²⁺ − e⁻ → Fe³⁺. Hydrogen peroxide is a strong oxidiser.'
      }
    : p.ox === 'HNO3'
      ? {
          title: 'The solution turned yellow and a gas is given off',
          say: `Dilute nitric acid oxidised iron(II) ions to iron(III) ${h.F('Fe^3+')}. Colourless ${h.NF('NO')} is given off and turns brown in the air at the mouth of the tube.`,
          why7: 'The colour of the solution changed: a new substance formed.',
          why: 'Nitric acid oxidises not only metals but iron(II) ions too. Add potassium thiocyanate: Fe³⁺ ions give a blood-red colour.'
        }
      : {
          title: 'The pale green solution turned yellow',
          say: `Hydrogen peroxide oxidised iron(II) ions to iron(III) ${h.F('Fe^3+')}.` +
            (p.acid ? '' : ' Without acid part of the iron(III) comes out at once as a brown Fe(OH)₃ precipitate.'),
          why7: 'The colour of the solution changed: a new substance formed.',
          why: 'Test with potassium thiocyanate KSCN: with Fe³⁺ ions the solution turns blood-red, with Fe²⁺ it does not. This is how iron(II) and iron(III) salts are told apart.'
        },
  iron3Reduce: (p, h) => ({
    title: p.red === 'H2S' ? 'Sulfur appeared and the solution went paler' : p.red === 'S2O3^2-' ? 'The solution went colourless' : 'The yellow-brown solution went paler',
    say: `Iron(III) ions oxidised ${({ 'SO3^2-': 'sulfite to sulfate', 'S2O3^2-': 'thiosulfate to tetrathionate', H2S: 'hydrogen sulfide to sulfur', SO2: 'sulfur dioxide to sulfuric acid' } as Record<string, string>)[p.red] ?? 'the reducing agent'} and became pale green iron(II) ions ${h.F('Fe^2+')}.` +
      (p.red === 'H2S' ? ' Fine sulfur makes the solution cloudy.' : '') +
      (p.red === 'S2O3^2-' ? ' For a moment the solution turns dark violet, then it goes colourless.' : ''),
    why: 'Fe³⁺ is an oxidiser: Fe³⁺ + e⁻ → Fe²⁺. Sulfite, thiosulfate, hydrogen sulfide and sulfur dioxide are reducing agents, so a redox reaction takes place instead of an exchange.'
  }),
  halogenAlkali: (p, h) => ({
    title: p.ox === 'Cl2' ? 'The colour and smell of chlorine disappeared' : p.ox === 'Br2' ? 'The bromine water went colourless' : 'The iodine went colourless',
    say: p.ox === 'Cl2'
      ? `Chlorine reacts with the alkali, giving chloride and hypochlorite ${h.F('ClO^-')}. The yellowish colour and sharp smell disappear.`
      : p.ox === 'Br2'
        ? `Bromine reacts with the alkali, giving bromide and hypobromite ${h.F('BrO^-')}; the solution goes colourless.`
        : `In alkali iodine turns into colourless iodide and iodate ${h.F('IO3^-')}.`,
    why7: 'The colour disappeared: the halogen turned into colourless salts.',
    why: 'Here the halogen is both oxidised and reduced: some atoms go to oxidation state −1, others to +1 (+5 for iodine). Sodium hypochlorite NaClO solution is household bleach and a disinfectant.'
  }),
  halogenThio: (p, h) => ({
    title: 'The colour of the halogen disappeared',
    say: `Thiosulfate reduced ${EN_HAL[p.ox] ?? p.ox} to colourless ${h.F(HAL_ION[p.ox] ?? 'Cl^-')} ions and was itself oxidised to sulfate: sulfuric acid is now in the solution.`,
    why: 'Chlorine and bromine are stronger oxidisers than iodine: iodine takes thiosulfate only to tetrathionate, they take it all the way to sulfate. That is why thiosulfate was called "antichlor": it removed the last chlorine from bleached cloth.'
  }),
  halogenReduce: (p, h) => p.red === 'H2S'
    ? {
        title: 'The halogen went colourless and sulfur appeared',
        say: `Hydrogen sulfide reduced ${EN_HAL[p.ox] ?? p.ox} to colourless ${h.F(HAL_ION[p.ox] ?? 'Cl^-')} ions and was itself oxidised to sulfur ${h.F('S')}: the solution went cloudy.`,
        why: 'Hydrogen sulfide is a strong reducing agent: its sulfur is in oxidation state −2 and gives electrons away.'
      }
    : {
        title: p.ox === 'Br2' ? 'The bromine water went colourless' : p.ox === 'I2' ? 'The iodine colour disappeared' : 'The chlorine water lost its colour',
        say: `Sulfur dioxide reduced ${EN_HAL[p.ox] ?? p.ox} to colourless ${h.F(HAL_ION[p.ox] ?? 'Cl^-')} ions and was itself oxidised to sulfuric acid.`,
        why: 'Decolourising bromine water is a test for sulfur dioxide: sulfur(+4) is oxidised to sulfur(+6).'
      },
  sulfurComprop: (_p, h) => ({
    title: 'Yellow sulfur appeared',
    say: `Sulfur dioxide and hydrogen sulfide met in the solution: ${h.F('SO2')} oxidised ${h.F('H2S')}, and both turned into fine yellow sulfur ${h.F('S')}.`,
    why: 'Sulfur is +4 in SO₂ and −2 in H₂S, and 0 in the product. This is how native sulfur builds up from the gases near volcanoes.'
  }),
  carbonicSilicate: (_p, h) => ({
    title: 'A jelly-like precipitate formed',
    say: `Carbon dioxide pushed silicic acid ${h.F('H2SiO3')} out of the silicate: the solution turned into a clear jelly. Carbonate is left in the solution.`,
    why7: 'A stronger acid pushes a weaker one out of its salt.',
    why: 'Carbonic acid is weak, but silicic acid is weaker still. That is why sodium silicate solution ("water glass") goes cloudy even in air, from carbon dioxide.'
  }),
  aluminateAcid: (p, h) => ({
    title: 'A white jelly-like precipitate formed',
    say: p.acid === 'CO2'
      ? `Carbon dioxide broke up the tetrahydroxoaluminate: ${h.NF('Al(OH)3')} came out, and hydrogen carbonate is left in the solution.`
      : `The ammonium salt broke up the tetrahydroxoaluminate: ${h.NF('Al(OH)3')} came out and ammonia with its sharp smell is given off.`,
    why: 'A strong acid would dissolve aluminium hydroxide again at once. Weak acids, carbonic acid and the ammonium ion, cannot, so this is how pure Al(OH)₃ is made.'
  }),
  metalAmmonium: (p, h) => p.ion === 'NH4^+'
    ? {
        title: 'Magnesium dissolves and gases are given off',
        say: `Magnesium dissolves in the ammonium salt solution: hydrogen is given off and you can smell ammonia ${h.F('NH3')}.`,
        why: 'An ammonium salt solution is slightly acidic: NH₄⁺ ions give up hydrogen ions. Active magnesium takes them, and hydrogen is given off.'
      }
    : {
        title: 'Hydrogen is given off and a precipitate formed',
        say: `Magnesium does not displace ${h.ionMetal(p.ion)} from the solution. The salt solution is acidic because of hydrolysis: magnesium takes the hydrogen ions, hydrogen is given off and ${h.NF(p.product)} precipitates.`,
        why: 'Aluminium, chromium and more active metals cannot be reduced out of water: hydrogen forms instead of the metal.'
      },
  nitricRedox: (p, h) => p.red === 'S^2-'
    ? {
        title: 'Sulfur appeared and a gas is given off',
        say: `Nitric acid oxidised the sulfide to sulfur ${h.F('S')} and was itself reduced to ${h.NF('NO')}, which turns brown at the mouth of the tube. No hydrogen sulfide comes off.`,
        why: 'Nitric acid is not just an acid but a strong oxidiser, because of nitrogen(+5). So it behaves differently from hydrochloric acid with sulfides.'
      }
    : p.red === 'SO3^2-'
      ? {
          title: 'A colourless gas is given off',
          say: `Nitric acid oxidised the sulfite to sulfate ${h.F('SO4^2-')}. Instead of sulfur dioxide, ${h.NF('NO')} is given off and turns brown at the mouth of the tube.`,
          why: 'Nitric acid is an oxidiser because of nitrogen(+5): sulfur(+4) in sulfite is oxidised to sulfur(+6).'
        }
      : {
          title: 'The solution turned brown: iodine formed',
          say: `Nitric acid oxidised the iodide to iodine ${h.F('I2')}, and ${h.NF('NO')} is given off.`,
          why: 'Nitric acid is an oxidiser. Add starch and the solution turns dark blue.'
        },
  hydroxideAir: (p, h) => p.solid === 'Fe(OH)2'
    ? {
        title: 'The precipitate is turning brown',
        say: `Greenish ${h.NF('Fe(OH)2')} is slowly oxidised by oxygen in the air, starting at the surface, to brown ${h.NF('Fe(OH)3')}.`,
        why: 'Iron rusts the same way: iron(II) turns into iron(III). That is why iron(II) salt solutions are kept tightly closed.'
      }
    : {
        title: 'The precipitate is darkening',
        say: `Pale ${h.NF('Mn(OH)2')} slowly darkens in air: oxygen oxidises it to brown ${h.F('MnO(OH)2')}.`,
        why: 'Manganese(II) is oxidised by the oxygen of the air to manganese(IV).'
      }
};

export function auditEvents(lang: Lang): Pick<EventTexts, NewKinds> {
  return { ru: RU, kk: KK, en: EN }[lang];
}

// ---------------------------------------------------------------- variants of earlier events

type Variant = (p: Record<string, string>, h: H) => EventText | null;

const RU_RED_ACID: Record<string, string> = {
  'Fe^2+': 'ионы железа(II) до железа(III)', 'I^-': 'иодид — раствор побурел от иода', 'SO3^2-': 'сульфит до сульфата',
  SO2: 'сернистый газ до серной кислоты', H2S: 'сероводород до серы — раствор помутнел', 'S^2-': 'сульфид до серы — раствор помутнел',
  'S2O3^2-': 'тиосульфат до сульфата', H2O2: 'пероксид водорода — выделяется кислород'
};
const RU_RED_NEUTRAL: Record<string, string> = {
  'I^-': 'Иодид окисляется до иода.', H2O2: 'Пероксид водорода окисляется — выделяется кислород.', 'SO3^2-': 'Сульфит окисляется до сульфата.',
  H2S: 'Сероводород окисляется до серы.', 'S^2-': 'Сульфид окисляется до серы.', 'S2O3^2-': 'Тиосульфат окисляется до сульфата.'
};
const RU_RED_ALK: Record<string, string> = {
  'SO3^2-': 'Сульфит окисляется до сульфата.', H2O2: 'Пероксид водорода окисляется — выделяется кислород.', 'I^-': `Иодид окисляется до иодата IO₃⁻.`
};
const KK_RED_ACID: Record<string, string> = {
  'Fe^2+': 'темір(II) иондарын темір(III)-ке дейін', 'I^-': 'йодидті тотықтырды — ерітінді йодтан қоңырқайланды, ал', 'SO3^2-': 'сульфитті сульфатқа дейін',
  SO2: 'күкірт(IV) оксидін күкірт қышқылына дейін', H2S: 'күкіртсутекті күкіртке дейін (ерітінді лайланды)', 'S^2-': 'сульфидті күкіртке дейін (ерітінді лайланды)',
  'S2O3^2-': 'тиосульфатты сульфатқа дейін', H2O2: 'сутек пероксидін тотықтырды — оттек бөлінеді, ал'
};
const KK_RED_NEUTRAL: Record<string, string> = {
  'I^-': 'Йодид йодқа дейін тотығады.', H2O2: 'Сутек пероксиді тотығады — оттек бөлінеді.', 'SO3^2-': 'Сульфит сульфатқа дейін тотығады.',
  H2S: 'Күкіртсутек күкіртке дейін тотығады.', 'S^2-': 'Сульфид күкіртке дейін тотығады.', 'S2O3^2-': 'Тиосульфат сульфатқа дейін тотығады.'
};
const KK_RED_ALK: Record<string, string> = {
  'SO3^2-': 'Сульфит сульфатқа дейін тотығады.', H2O2: 'Сутек пероксиді тотығады — оттек бөлінеді.', 'I^-': 'Йодид йодатқа IO₃⁻ дейін тотығады.'
};
const EN_RED_ACID: Record<string, string> = {
  'Fe^2+': 'iron(II) ions to iron(III)', 'I^-': 'iodide (the solution turned brown with iodine)', 'SO3^2-': 'sulfite to sulfate',
  SO2: 'sulfur dioxide to sulfuric acid', H2S: 'hydrogen sulfide to sulfur (the solution went cloudy)', 'S^2-': 'sulfide to sulfur (the solution went cloudy)',
  'S2O3^2-': 'thiosulfate to sulfate', H2O2: 'hydrogen peroxide (oxygen is given off)'
};
const EN_RED_NEUTRAL: Record<string, string> = {
  'I^-': 'Iodide is oxidised to iodine.', H2O2: 'Hydrogen peroxide is oxidised and oxygen is given off.', 'SO3^2-': 'Sulfite is oxidised to sulfate.',
  H2S: 'Hydrogen sulfide is oxidised to sulfur.', 'S^2-': 'Sulfide is oxidised to sulfur.', 'S2O3^2-': 'Thiosulfate is oxidised to sulfate.'
};
const EN_RED_ALK: Record<string, string> = {
  'SO3^2-': 'Sulfite is oxidised to sulfate.', H2O2: 'Hydrogen peroxide is oxidised and oxygen is given off.', 'I^-': 'Iodide is oxidised to iodate IO₃⁻.'
};

/** Russian names of anions in joint hydrolysis, in the nominative. */
const anionName = (anion: string, lang: Lang) => IONS[anion]?.name[lang] ?? anion;

const VARIANTS: Record<Lang, Partial<Record<keyof EventTexts, Variant>>> = {
  ru: {
    permanganateRedox: (p, h) => {
      if (p.red === 'Cl^-') return null;
      if (p.medium === 'neutral') return p.red === 'Mn^2+'
        ? { title: 'Выпал бурый осадок', say: `Перманганат и ионы марганца(II) встретились: марганец(+7) и марганец(+2) переходят в общий продукт — бурый оксид марганца(IV) ${h.F('MnO2')}.`, why: 'Это реакция «встречного» окисления-восстановления: один и тот же элемент и окислитель, и восстановитель.' }
        : { title: 'Выпал бурый осадок', say: `В нейтральной среде перманганат восстанавливается не до бесцветных ионов марганца(II), а до бурого осадка оксида марганца(IV) ${h.F('MnO2')}. ${RU_RED_NEUTRAL[p.red] ?? ''}`, why7: 'Окраска исчезла, и выпал бурый осадок — признаки реакции.', why: 'Продукт зависит от среды: в кислой — ионы Mn²⁺ (раствор обесцвечивается), в нейтральной — бурый MnO₂, в щелочной — зелёный манганат MnO₄²⁻.' };
      if (p.medium === 'alkaline') return { title: 'Раствор стал зелёным', say: `В щелочной среде перманганат восстанавливается до манганата ${h.F('MnO4^2-')} — раствор из малинового становится зелёным. ${RU_RED_ALK[p.red] ?? ''}`, why: 'Продукт зависит от среды: в кислой — Mn²⁺ (бесцветный раствор), в нейтральной — бурый осадок MnO₂, в щелочной — зелёный манганат.' };
      return {
        title: 'Малиновая окраска исчезла',
        say: `${p.red === 'SO2' ? 'Сернистый газ обесцвечивает перманганат даже без добавленной кислоты: он сам образует кислоту. ' : ''}Перманганат окислил ${RU_RED_ACID[p.red] ?? 'восстановитель'}, а сам превратился в почти бесцветные ионы ${h.F('Mn^2+')}.`,
        why7: 'Раствор обесцветился — значит, перманганат вступил в реакцию.',
        why: 'Перманганат калия — сильный окислитель, особенно в кислой среде. Марганец меняет степень окисления с +7 до +2.' + (p.red === 'SO2' ? ' Обесцвечивание перманганата — качественная реакция на сернистый газ.' : '')
      };
    },
    dichromateRedox: (p, h) => ['S^2-', 'H2S', 'S2O3^2-', 'SO2'].includes(p.red)
      ? { title: p.red === 'S^2-' || p.red === 'H2S' ? 'Раствор позеленел, выпала сера' : 'Оранжевый раствор позеленел', say: `Дихромат в кислой среде окислил ${RU_RED_ACID[p.red]} и превратился в зелёные ионы хрома(III) ${h.F('Cr^3+')}.`, why: 'Хром меняет степень окисления с +6 до +3.' }
      : null,
    metalNitric: (p, h) => p.product === 'H2SnO3'
      ? { title: 'Выпал белый осадок, выделяется бурый газ', say: `Концентрированная азотная кислота окисляет олово до олова(IV): соль не образуется, выпадает белая метаоловянная кислота ${h.F('H2SnO3')}, выделяется бурый ${h.NF('NO2')}.`, why: 'Олово(IV) не образует нитрата в такой кислоте, а сразу даёт нерастворимый оксид-гидрат.' }
      : p.product === 'NH4NO3' || p.product === 'N2O'
        ? { title: `${h.cap(h.metal(p.metal))} растворяется в азотной кислоте`, say: `Очень активный металл восстанавливает азотную кислоту глубоко: ${p.product === 'NH4NO3' ? `разбавленная кислота даёт нитрат аммония ${h.F('NH4NO3')} — газ почти не выделяется` : `концентрированная кислота даёт оксид азота(I) ${h.F('N2O')}`}. Водород не выделяется.`, why: 'Азотная кислота с металлами никогда не даёт водорода. Чем активнее металл и чем разбавленнее кислота, тем глубже восстанавливается азот: NO₂ → NO → N₂O → N₂ → NH₄⁺.' }
        : null,
    jointHydrolysis: (p, h) => p.ion && p.anion
      ? {
          title: p.gas === 'H2SiO3' ? 'Выпал студенистый осадок' : p.gas === 'NH3' ? 'Выпал студень, запахло аммиаком' : `Выпал ${h.color(p.color)} осадок, выделяется газ`,
          say: `${h.cap(anionName(p.anion, 'ru'))} ${IONS[p.ion]?.name.ru ?? ''} в воде не существует: вместо него выпадает ${h.NF(p.product)}` +
            (p.gas === 'H2SiO3' ? ` вместе со студнем кремниевой кислоты ${h.F('H2SiO3')}.` : p.gas === 'CO2' ? ' и выделяется углекислый газ.' : p.gas === 'SO2' ? ` и выделяется сернистый газ ${h.F('SO2')} с запахом горелой спички.` : p.gas === 'H2S' ? ` и выделяется сероводород ${h.F('H2S')} с запахом тухлых яиц.` : '.'),
          why: 'В таблице растворимости на месте этой соли стоит прочерк: она разлагается водой. Это совместный гидролиз: слабое основание и слабая кислота «отбирают» друг у друга воду.'
        }
      : p.gas === 'NH3'
        ? { title: 'Выпал студень, запахло аммиаком', say: `Силиката аммония в воде нет: выпадает кремниевая кислота ${h.F('H2SiO3')}, выделяется аммиак.`, why: 'Это совместный гидролиз: ион аммония — слабая кислота, силикат — соль очень слабой кислоты.' }
        : null,
    iodideOx: (p, h) => p.ion === 'H2O2' && p.slow
      ? { title: 'Раствор медленно желтеет', say: `Без кислоты пероксид водорода окисляет иодид медленно: раствор постепенно желтеет, потом буреет от иода ${h.F('I2')}. Иодид ещё и ускоряет разложение пероксида — поднимаются мелкие пузырьки кислорода.`, why: 'В кислой среде эта реакция идёт гораздо быстрее. Добавь крахмал — даже немного иода окрасит раствор в синий цвет.' }
      : null,
    dichromateBase: (p, h) => p.product
      ? { title: 'Выпал жёлтый осадок', say: `Щёлочь превратила оранжевый дихромат в хромат, и ионы бария сразу осадили его: выпал жёлтый ${h.NF(p.product)}.`, why: 'Хромат бария не растворяется в воде. Это качественная реакция на ионы бария.' }
      : null,
    precip: (p, h) => p.special === 'chlorineWater'
      ? { title: 'Выпал белый творожистый осадок', say: `В хлорной воде есть немного соляной кислоты (Cl₂ + H₂O ⇄ HCl + HClO). Ионы серебра связывают хлорид-ионы в ${h.NF('AgCl')}, и хлор продолжает реагировать с водой.`, why: 'Поэтому хлорная вода даёт осадок с нитратом серебра, как и растворы хлоридов.' }
      : p.special === 'scnFade'
        ? { title: 'Красная окраска исчезла, выпал бурый осадок', say: `Щёлочь разрушила роданид железа(III): кроваво-красная окраска исчезла, выпал бурый ${h.NF('Fe(OH)3')}.`, why: 'Гидроксид железа(III) нерастворим, поэтому ионы Fe³⁺ уходят в осадок и комплекс распадается.' }
        : p.gas === 'CO2'
          ? { title: `Выпал ${h.color(p.color)} осадок, выделяется газ`, say: `Гидрокарбонат осадил ${h.NF(p.product)}; при этом выделяется углекислый газ.`, why: 'Ион HCO₃⁻ отдаёт ион водорода и становится карбонатом, а лишний водород уходит вместе с CO₂.' }
          : null,
    notModeled: (p) => p.topic === 'cuSulfite' || p.topic === 'cuThiosulfate'
      ? { title: 'Эту реакцию CC Hexa пока не показывает', say: p.topic === 'cuSulfite' ? 'Сульфит восстанавливает медь(II): получается смесь соединений меди(I) и меди(II), часть их выпадает в осадок.' : 'Тиосульфат восстанавливает медь(II) до меди(I): голубая окраска исчезает, со временем выпадает тёмный осадок.', why: 'Мы не показываем реакцию, пока не можем показать её правильно.' }
      : null,
    aluminumFilm: (p) => ({
      title: 'Алюминий почти не реагирует',
      say: p.acid === 'CH3COOH' ? 'Алюминий покрыт прочной оксидной плёнкой, и слабая уксусная кислота её почти не разрушает.' : 'Алюминий покрыт прочной оксидной плёнкой, поэтому в растворе этой соли реакция почти не идёт, хотя по ряду активности алюминий должен вытеснять металл.',
      why: 'Хлорид-ионы разрушают оксидную плёнку: попробуй соль с хлоридом (например, CuCl₂) — алюминий начнёт вытеснять металл.'
    }),
    cuConcAcid: (p, h) => p.metal === 'Al'
      ? { title: 'Алюминий растворяется в горячей серной кислоте', say: `На холоде алюминий пассивируется, но при сильном нагревании концентрированная серная кислота окисляет его до сульфата ${h.F('Al2(SO4)3')}. Выделяется сернистый газ ${h.F('SO2')} с запахом горелой спички, водород не выделяется.`, why: 'При нагревании защитная плёнка разрушается. Опыт — только под тягой.' }
      : null
  },
  kk: {
    permanganateRedox: (p, h) => {
      if (p.red === 'Cl^-') return null;
      if (p.medium === 'neutral') return p.red === 'Mn^2+'
        ? { title: 'Қоңыр тұнба түсті', say: `Перманганат пен марганец(II) иондары кездесті: марганец(+7) пен марганец(+2) ортақ өнімге — марганец(IV) оксидінің ${h.F('MnO2')} қоңыр тұнбасына айналады.`, why: 'Бұл — «қарсы» тотығу-тотықсыздану: бір элемент әрі тотықтырғыш, әрі тотықсыздандырғыш.' }
        : { title: 'Қоңыр тұнба түсті', say: `Бейтарап ортада перманганат түссіз марганец(II) иондарына дейін емес, марганец(IV) оксидінің ${h.F('MnO2')} қоңыр тұнбасына дейін тотықсызданады. ${KK_RED_NEUTRAL[p.red] ?? ''}`, why7: 'Түс жоғалып, қоңыр тұнба түсті — реакция белгілері.', why: 'Өнім ортаға байланысты: қышқылдық ортада — Mn²⁺ иондары (ерітінді түссізденеді), бейтарап ортада — қоңыр MnO₂, сілтілік ортада — жасыл манганат MnO₄²⁻.' };
      if (p.medium === 'alkaline') return { title: 'Ерітінді жасыл түске енді', say: `Сілтілік ортада перманганат манганатқа ${h.F('MnO4^2-')} дейін тотықсызданады — ерітінді таңқурай түстен жасылға ауысады. ${KK_RED_ALK[p.red] ?? ''}`, why: 'Өнім ортаға байланысты: қышқылдық ортада — Mn²⁺ (түссіз ерітінді), бейтарап ортада — қоңыр MnO₂ тұнбасы, сілтілік ортада — жасыл манганат.' };
      const red = KK_RED_ACID[p.red] ?? 'тотықсыздандырғышты';
      return {
        title: 'Таңқурай түс жоғалды',
        say: `${p.red === 'SO2' ? 'Күкірт(IV) оксиді перманганатты қышқыл қоспай-ақ түссіздендіреді: ол өзі қышқыл түзеді. ' : ''}Перманганат ${red}${red.endsWith(', ал') ? '' : ' тотықтырды, ал'} өзі түссізге жуық ${h.F('Mn^2+')} иондарына айналды.`,
        why7: 'Ерітінді түссізденді — демек, перманганат реакцияға түсті.',
        why: 'Калий перманганаты — күшті тотықтырғыш, әсіресе қышқылдық ортада. Марганецтің тотығу дәрежесі +7-ден +2-ге өзгереді.' + (p.red === 'SO2' ? ' Перманганаттың түссізденуі — күкірт(IV) оксидіне сапалық реакция.' : '')
      };
    },
    dichromateRedox: (p, h) => ['S^2-', 'H2S', 'S2O3^2-', 'SO2'].includes(p.red)
      ? { title: p.red === 'S^2-' || p.red === 'H2S' ? 'Ерітінді жасылданды, күкірт түсті' : 'Қызғылт сары ерітінді жасылданды', say: `Қышқылдық ортада дихромат ${KK_RED_ACID[p.red]} тотықтырып, жасыл хром(III) иондарына ${h.F('Cr^3+')} айналды.`, why: 'Хромның тотығу дәрежесі +6-дан +3-ке өзгереді.' }
      : null,
    metalNitric: (p, h) => p.product === 'H2SnO3'
      ? { title: 'Ақ тұнба түсті, қоңыр газ бөлінеді', say: `Концентрлі азот қышқылы қалайыны қалайы(IV)-ке дейін тотықтырады: тұз түзілмейді, ақ метақалайы қышқылы ${h.F('H2SnO3')} тұнбаға түседі, қоңыр ${h.NF('NO2')} бөлінеді.`, why: 'Мұндай қышқылда қалайы(IV) нитрат түзбейді, бірден ерімейтін оксид-гидратқа айналады.' }
      : p.product === 'NH4NO3' || p.product === 'N2O'
        ? { title: `${h.cap(h.metal(p.metal))} азот қышқылында ериді`, say: `Өте белсенді металл азот қышқылын терең тотықсыздандырады: ${p.product === 'NH4NO3' ? `сұйылтылған қышқыл аммоний нитратын ${h.F('NH4NO3')} береді — газ дерлік бөлінбейді` : `концентрлі қышқыл азот(I) оксидін ${h.F('N2O')} береді`}. Сутек бөлінбейді.`, why: 'Азот қышқылы металдармен ешқашан сутек бермейді. Металл неғұрлым белсенді, қышқыл неғұрлым сұйылтылған болса, азот соғұрлым терең тотықсызданады: NO₂ → NO → N₂O → N₂ → NH₄⁺.' }
        : null,
    jointHydrolysis: (p, h) => p.ion && p.anion
      ? {
          title: p.gas === 'H2SiO3' ? 'Қоймалжың тұнба түсті' : `${h.cap(h.color(p.color))} тұнба түсті, газ бөлінеді`,
          say: `${h.cap(IONS[p.ion]?.name.kk ?? '')} ${anionName(p.anion, 'kk')} суда болмайды: оның орнына ${h.NF(p.product)} тұнбаға түседі` +
            (p.gas === 'H2SiO3' ? `, онымен бірге кремний қышқылының ${h.F('H2SiO3')} қоймалжыңы түзіледі.` : p.gas === 'CO2' ? ', көмірқышқыл газ бөлінеді.' : p.gas === 'SO2' ? `, жанған сіріңке иісті күкірт(IV) оксиді ${h.F('SO2')} бөлінеді.` : p.gas === 'H2S' ? `, шіріген жұмыртқа иісті күкіртсутек ${h.F('H2S')} бөлінеді.` : '.'),
          why: 'Ерімділік кестесінде бұл тұздың орнында сызықша тұр: ол сумен ыдырайды. Бұл — бірлескен гидролиз: әлсіз негіз бен әлсіз қышқыл бір-бірінен суды «тартып алады».'
        }
      : p.gas === 'NH3'
        ? { title: 'Қоймалжың түсті, аммиак иісі шықты', say: `Аммоний силикаты суда болмайды: кремний қышқылы ${h.F('H2SiO3')} тұнбаға түседі, аммиак бөлінеді.`, why: 'Бұл — бірлескен гидролиз: аммоний ионы — әлсіз қышқыл, силикат — өте әлсіз қышқылдың тұзы.' }
        : null,
    iodideOx: (p, h) => p.ion === 'H2O2' && p.slow
      ? { title: 'Ерітінді баяу сарғаяды', say: `Қышқылсыз сутек пероксиді йодидті баяу тотықтырады: ерітінді біртіндеп сарғайып, сосын йодтан ${h.F('I2')} қоңырқайланады. Йодид пероксидтің ыдырауын да тездетеді — ұсақ оттек көпіршіктері көтеріледі.`, why: 'Қышқылдық ортада бұл реакция әлдеқайда тез жүреді. Крахмал қос — аз ғана йодтың өзі ерітіндіні көк түске бояйды.' }
      : null,
    dichromateBase: (p, h) => p.product
      ? { title: 'Сары тұнба түсті', say: `Сілті қызғылт сары дихроматты хроматқа айналдырды, ал барий иондары оны бірден тұнбаға түсірді: сары ${h.NF(p.product)} түзілді.`, why: 'Барий хроматы суда ерімейді. Бұл — барий иондарына сапалық реакция.' }
      : null,
    precip: (p, h) => p.special === 'chlorineWater'
      ? { title: 'Ақ ірімшік тәрізді тұнба түсті', say: `Хлорлы суда аздап тұз қышқылы бар (Cl₂ + H₂O ⇄ HCl + HClO). Күміс иондары хлорид-иондарды ${h.NF('AgCl')} түрінде байланыстырады, ал хлор сумен әрекеттесуін жалғастырады.`, why: 'Сондықтан хлорлы су хлоридтер ерітінділері сияқты күміс нитратымен тұнба береді.' }
      : p.special === 'scnFade'
        ? { title: 'Қызыл түс жоғалды, қоңыр тұнба түсті', say: `Сілті темір(III) роданидін бұзды: қан-қызыл түс жоғалып, қоңыр ${h.NF('Fe(OH)3')} тұнбаға түсті.`, why: 'Темір(III) гидроксиді ерімейді, сондықтан Fe³⁺ иондары тұнбаға кетіп, комплекс ыдырайды.' }
        : p.gas === 'CO2'
          ? { title: `${h.cap(h.color(p.color))} тұнба түсті, газ бөлінеді`, say: `Гидрокарбонат ${h.NF(p.product)} тұнбасын түзді; бұл кезде көмірқышқыл газ бөлінеді.`, why: 'HCO₃⁻ ионы сутек ионын беріп, карбонатқа айналады, ал артық сутек CO₂-мен бірге кетеді.' }
          : null,
    notModeled: (p) => p.topic === 'cuSulfite' || p.topic === 'cuThiosulfate'
      ? { title: 'Бұл реакцияны CC Hexa әзірге көрсетпейді', say: p.topic === 'cuSulfite' ? 'Сульфит мыс(II)-ні тотықсыздандырады: мыс(I) мен мыс(II) қосылыстарының қоспасы түзіледі, бір бөлігі тұнбаға түседі.' : 'Тиосульфат мыс(II)-ні мыс(I)-ге дейін тотықсыздандырады: көк түс жоғалады, уақыт өте келе қара тұнба түседі.', why: 'Реакцияны дұрыс көрсете алмайынша, біз оны көрсетпейміз.' }
      : null,
    aluminumFilm: (p) => ({
      title: 'Алюминий дерлік әрекеттеспейді',
      say: p.acid === 'CH3COOH' ? 'Алюминий берік оксид қабықшасымен қапталған, ал әлсіз сірке қышқылы оны дерлік бұза алмайды.' : 'Алюминий берік оксид қабықшасымен қапталған, сондықтан бұл тұздың ерітіндісінде реакция дерлік жүрмейді, дегенмен белсенділік қатары бойынша алюминий металды ығыстыруы тиіс.',
      why: 'Хлорид-иондар оксид қабықшасын бұзады: хлоридті тұзды (мысалы, CuCl₂) қолданып көр — алюминий металды ығыстыра бастайды.'
    }),
    cuConcAcid: (p, h) => p.metal === 'Al'
      ? { title: 'Алюминий ыстық күкірт қышқылында ериді', say: `Суықта алюминий пассивтенеді, бірақ қатты қыздырғанда концентрлі күкірт қышқылы оны сульфатқа ${h.F('Al2(SO4)3')} дейін тотықтырады. Жанған сіріңке иісті күкірт(IV) оксиді ${h.F('SO2')} бөлінеді, сутек бөлінбейді.`, why: 'Қыздырғанда қорғаныш қабықша бұзылады. Тәжірибе — тек тартпа шкафта.' }
      : null
  },
  en: {
    permanganateRedox: (p, h) => {
      if (p.red === 'Cl^-') return null;
      if (p.medium === 'neutral') return p.red === 'Mn^2+'
        ? { title: 'A brown precipitate formed', say: `Permanganate met manganese(II) ions: manganese(+7) and manganese(+2) meet in one product, brown manganese(IV) oxide ${h.F('MnO2')}.`, why: 'Here the same element is both the oxidiser and the reducing agent.' }
        : { title: 'A brown precipitate formed', say: `In neutral solution permanganate is reduced not to colourless manganese(II) ions but to a brown precipitate of manganese(IV) oxide ${h.F('MnO2')}. ${EN_RED_NEUTRAL[p.red] ?? ''}`, why7: 'The colour disappeared and a brown precipitate formed: signs of a reaction.', why: 'The product depends on the medium: in acid Mn²⁺ ions (the solution goes colourless), in neutral solution brown MnO₂, in alkali green manganate MnO₄²⁻.' };
      if (p.medium === 'alkaline') return { title: 'The solution turned green', say: `In alkaline solution permanganate is reduced to manganate ${h.F('MnO4^2-')}: the purple solution turns green. ${EN_RED_ALK[p.red] ?? ''}`, why: 'The product depends on the medium: in acid Mn²⁺ (colourless), in neutral solution a brown MnO₂ precipitate, in alkali green manganate.' };
      return {
        title: 'The purple colour disappeared',
        say: `${p.red === 'SO2' ? 'Sulfur dioxide decolourises permanganate even without added acid: it makes its own acid. ' : ''}Permanganate oxidised ${EN_RED_ACID[p.red] ?? 'the reducing agent'} and turned into almost colourless ${h.F('Mn^2+')} ions.`,
        why7: 'The solution went colourless, so the permanganate has reacted.',
        why: 'Potassium permanganate is a strong oxidiser, especially in acid. Manganese goes from +7 to +2.' + (p.red === 'SO2' ? ' Decolourising permanganate is a test for sulfur dioxide.' : '')
      };
    },
    dichromateRedox: (p, h) => ['S^2-', 'H2S', 'S2O3^2-', 'SO2'].includes(p.red)
      ? { title: p.red === 'S^2-' || p.red === 'H2S' ? 'The solution turned green and sulfur appeared' : 'The orange solution turned green', say: `In acid, dichromate oxidised ${EN_RED_ACID[p.red]} and turned into green chromium(III) ions ${h.F('Cr^3+')}.`, why: 'Chromium goes from +6 to +3.' }
      : null,
    metalNitric: (p, h) => p.product === 'H2SnO3'
      ? { title: 'A white precipitate formed and a brown gas is given off', say: `Concentrated nitric acid oxidises tin to tin(IV): no salt forms, white metastannic acid ${h.F('H2SnO3')} precipitates and brown ${h.NF('NO2')} is given off.`, why: 'Tin(IV) does not form a nitrate in such acid; it gives an insoluble hydrated oxide at once.' }
      : p.product === 'NH4NO3' || p.product === 'N2O'
        ? { title: `${h.cap(h.metal(p.metal))} dissolves in nitric acid`, say: `A very active metal reduces nitric acid a long way: ${p.product === 'NH4NO3' ? `dilute acid gives ammonium nitrate ${h.F('NH4NO3')}, so hardly any gas comes off` : `concentrated acid gives nitrogen(I) oxide ${h.F('N2O')}`}. No hydrogen forms.`, why: 'Nitric acid never gives hydrogen with metals. The more active the metal and the more dilute the acid, the further nitrogen is reduced: NO₂ → NO → N₂O → N₂ → NH₄⁺.' }
        : null,
    jointHydrolysis: (p, h) => p.ion && p.anion
      ? {
          title: p.gas === 'H2SiO3' ? 'A jelly-like precipitate formed' : `A ${h.color(p.color)} precipitate formed and a gas is given off`,
          say: `${h.cap(IONS[p.ion]?.name.en ?? '')} ${anionName(p.anion, 'en')} does not exist in water: instead ${h.NF(p.product)} precipitates` +
            (p.gas === 'H2SiO3' ? ` together with a jelly of silicic acid ${h.F('H2SiO3')}.` : p.gas === 'CO2' ? ' and carbon dioxide is given off.' : p.gas === 'SO2' ? `, and sulfur dioxide ${h.F('SO2')}, smelling of a struck match, is given off.` : p.gas === 'H2S' ? `, and hydrogen sulfide ${h.F('H2S')}, smelling of rotten eggs, is given off.` : '.'),
          why: 'The solubility table has a dash for this salt: water breaks it down. This is joint hydrolysis: a weak base and a weak acid take water apart between them.'
        }
      : p.gas === 'NH3'
        ? { title: 'A jelly formed and there is a smell of ammonia', say: `Ammonium silicate does not exist in water: silicic acid ${h.F('H2SiO3')} precipitates and ammonia is given off.`, why: 'This is joint hydrolysis: the ammonium ion is a weak acid and silicate is the salt of a very weak acid.' }
        : null,
    iodideOx: (p, h) => p.ion === 'H2O2' && p.slow
      ? { title: 'The solution slowly turns yellow', say: `Without acid hydrogen peroxide oxidises iodide slowly: the solution gradually turns yellow, then brown with iodine ${h.F('I2')}. Iodide also speeds up the breakdown of the peroxide, so small bubbles of oxygen rise.`, why: 'In acid this reaction is much faster. Add starch: even a little iodine turns the solution blue.' }
      : null,
    dichromateBase: (p, h) => p.product
      ? { title: 'A yellow precipitate formed', say: `The alkali turned orange dichromate into chromate, and barium ions took it out at once: yellow ${h.NF(p.product)} precipitated.`, why: 'Barium chromate does not dissolve in water. This is a test for barium ions.' }
      : null,
    precip: (p, h) => p.special === 'chlorineWater'
      ? { title: 'A white curdy precipitate formed', say: `Chlorine water holds a little hydrochloric acid (Cl₂ + H₂O ⇌ HCl + HClO). Silver ions bind the chloride ions as ${h.NF('AgCl')}, and the chlorine goes on reacting with water.`, why: 'That is why chlorine water gives a precipitate with silver nitrate, just like chloride solutions.' }
      : p.special === 'scnFade'
        ? { title: 'The red colour disappeared and a brown precipitate formed', say: `The alkali destroyed iron(III) thiocyanate: the blood-red colour disappeared and brown ${h.NF('Fe(OH)3')} precipitated.`, why: 'Iron(III) hydroxide is insoluble, so the Fe³⁺ ions go into the precipitate and the complex falls apart.' }
        : p.gas === 'CO2'
          ? { title: `A ${h.color(p.color)} precipitate formed and a gas is given off`, say: `Hydrogen carbonate precipitated ${h.NF(p.product)}, and carbon dioxide is given off.`, why: 'The HCO₃⁻ ion gives up a hydrogen ion and becomes carbonate; the spare hydrogen leaves with the CO₂.' }
          : null,
    notModeled: (p) => p.topic === 'cuSulfite' || p.topic === 'cuThiosulfate'
      ? { title: 'CC Hexa does not show this reaction yet', say: p.topic === 'cuSulfite' ? 'Sulfite reduces copper(II): a mixture of copper(I) and copper(II) compounds forms, and part of it precipitates.' : 'Thiosulfate reduces copper(II) to copper(I): the blue colour disappears, and in time a dark precipitate forms.', why: 'We do not show a reaction until we can show it correctly.' }
      : null,
    aluminumFilm: (p) => ({
      title: 'Aluminium hardly reacts',
      say: p.acid === 'CH3COOH' ? 'Aluminium is covered by a tough oxide film, and weak acetic acid hardly breaks it down.' : 'Aluminium is covered by a tough oxide film, so it hardly reacts in this salt solution, even though by the activity series it should displace the metal.',
      why: 'Chloride ions break down the oxide film: try a chloride salt (CuCl₂, for example) and aluminium starts to displace the metal.'
    }),
    cuConcAcid: (p, h) => p.metal === 'Al'
      ? { title: 'Aluminium dissolves in hot sulfuric acid', say: `In the cold aluminium is passivated, but on strong heating concentrated sulfuric acid oxidises it to the sulfate ${h.F('Al2(SO4)3')}. Sulfur dioxide ${h.F('SO2')}, smelling of a struck match, is given off; no hydrogen forms.`, why: 'Heating breaks down the protective film. Fume hood only.' }
      : null
  }
};

export function auditPatch(events: EventTexts, lang: Lang) {
  const vs = VARIANTS[lang];
  for (const k of Object.keys(vs) as (keyof EventTexts)[]) {
    const base = events[k];
    const variant = vs[k]!;
    events[k] = (p, h, e) => variant(p, h) ?? base(p, h, e);
  }
}

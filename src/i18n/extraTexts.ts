// Texts for concentrated acids as oxidisers, dehydration, nitric acid from nitrates, heating in
// air, sols and colours that fade on heating; and variants of earlier events: nitrates breaking
// down on heating, limewater clouding when hot, electrolysis of more salts.

import type { Lang } from '../engine/data';
import type { EventText, EventTexts, H } from './types';

type NewKinds = 'concOxidation' | 'dehydration' | 'nitricPrep' | 'heatInAir' | 'solFormation' | 'colorFade';
type Fn = (p: Record<string, string>, h: H) => EventText;

const RU: Record<NewKinds, Fn> = {
  concOxidation: (p, h) => {
    if (p.acid === 'H2SO4') {
      switch (p.reducer) {
        case 'Br^-': return {
          title: 'Поднимаются бурые пары брома',
          say: `Концентрированная серная кислота окисляет бромид до брома ${h.F('Br2')}: над солью поднимаются бурые пары с резким запахом, выделяется и сернистый газ ${h.F('SO2')}.`,
          why7: 'Кислота отняла электроны у бромид-ионов, и получился бром.',
          why: 'Бромид-ион — более сильный восстановитель, чем хлорид-ион, поэтому бромоводород, в отличие от хлороводорода, так получить нельзя: сера(+6) окисляет его до брома и восстанавливается до SO₂. Только под тягой.'
        };
        case 'I^-': return {
          title: 'Появился иод, пахнет тухлыми яйцами',
          say: `Иодид окисляется до иода ${h.F('I2')} — смесь темнеет, видны фиолетовые пары. Кислота восстанавливается очень глубоко — до сероводорода ${h.F('H2S')} с запахом тухлых яиц.`,
          why7: 'Иодид отдаёт электроны ещё легче бромида.',
          why: 'Иодид-ион — самый сильный восстановитель среди галогенид-ионов: он восстанавливает серу(+6) даже до серы(−2). Чем сильнее восстановитель, тем глубже восстанавливается кислота. Только под тягой.'
        };
        case 'S^2-': return {
          title: 'Выделяются сера и сернистый газ',
          say: `Сульфид окисляется до жёлтой серы ${h.F('S')}, а кислота восстанавливается до сернистого газа ${h.F('SO2')} с запахом горелой спички.`,
          why: 'Сера(−2) отдаёт электроны сере(+6): получаются простое вещество сера и SO₂. Только под тягой.'
        };
        case 'C': return {
          title: 'Уголь окисляется кислотой',
          say: `Горячая концентрированная серная кислота окисляет уголь до углекислого газа ${h.F('CO2')}, а сама восстанавливается до сернистого газа ${h.F('SO2')} с запахом горелой спички.`,
          why7: 'Горячая концентрированная серная кислота — сильный окислитель.',
          why: 'Окислитель здесь — сера(+6). Так же кислота окисляет серу и многие органические вещества. Только под тягой.'
        };
        default: return {
          title: 'Сера окисляется кислотой',
          say: `Горячая концентрированная серная кислота окисляет серу. И сера, и кислота превращаются в сернистый газ ${h.F('SO2')} с запахом горелой спички.`,
          why: 'Сера(0) окисляется до +4, сера(+6) восстанавливается до +4 — обе встречаются в SO₂. Только под тягой.'
        };
      }
    }
    switch (p.reducer) {
      case 'I^-': return {
        title: 'Выделились иод и бурый газ',
        say: `Концентрированная азотная кислота сразу окисляет иодид до иода ${h.F('I2')}: раствор буреет, выпадают тёмные кристаллики. Над пробиркой — бурый оксид азота(IV) ${h.F('NO2')}.`,
        why7: 'Азотная кислота отняла электроны у иодид-ионов.',
        why: 'Азотная кислота — окислитель за счёт азота(+5). Концентрированная восстанавливается до NO₂, разбавленная — до NO. Только под тягой.'
      };
      case 'Fe^2+': return {
        title: 'Железо(II) окислилось до железа(III)',
        say: `Бледно-зелёный раствор желтеет: ионы ${h.F('Fe^2+')} окисляются до ${h.F('Fe^3+')}, выделяется бурый ${h.F('NO2')}. Добавь роданид калия — появится кроваво-красная окраска.`,
        why: 'Fe²⁺ — восстановитель, азотная кислота — окислитель: Fe²⁺ − e⁻ → Fe³⁺. Только под тягой.'
      };
      case 'S^2-':
      case 'H2S': return {
        title: 'Выпала сера',
        say: `Азотная кислота окисляет ${p.reducer === 'H2S' ? 'сероводород' : 'сульфид'} до серы ${h.F('S')}: появляется жёлтая муть, выделяется бурый ${h.F('NO2')}. Сероводород при этом не выделяется.`,
        why: 'Сера(−2) — сильный восстановитель. С кислотами-окислителями сульфиды дают не сероводород, а серу. Только под тягой.'
      };
      case 'SO3^2-':
      case 'SO2': return {
        title: 'Сульфит окислился до сульфата',
        say: `Азотная кислота окисляет ${p.reducer === 'SO2' ? 'растворённый сернистый газ' : 'сульфит'} до сульфата ${h.F('SO4^2-')}, выделяется бурый ${h.F('NO2')}. Сернистый газ не выделяется.`,
        why: 'Сера(+4) окисляется до +6. Добавь хлорид бария — выпадет белый осадок сульфата бария, нерастворимый в кислотах.'
      };
      case 'C': return {
        title: 'Уголь окисляется азотной кислотой',
        say: `Горячая концентрированная азотная кислота окисляет уголь до углекислого газа ${h.F('CO2')}, выделяется много бурого ${h.F('NO2')}.`,
        why: 'Концентрированная азотная кислота окисляет многие неметаллы: углерод — до CO₂, серу — до серной кислоты, фосфор — до фосфорной. Только под тягой.'
      };
      default: return {
        title: 'Сера окисляется до серной кислоты',
        say: `Горячая концентрированная азотная кислота окисляет серу до серной кислоты, выделяется бурый ${h.F('NO2')}. Добавь хлорид бария — выпадет белый ${h.F('BaSO4')}.`,
        why: 'Концентрированная азотная кислота окисляет многие неметаллы: углерод — до CO₂, серу — до серной кислоты, фосфор — до фосфорной. Только под тягой.'
      };
    }
  },
  dehydration: (p, h) => (p.solid === 'CoCl2·6H2O'
    ? {
        title: 'Розовые кристаллы посинели',
        say: `Концентрированная серная кислота отнимает у кристаллогидрата ${h.F('CoCl2·6H2O')} воду: розовые кристаллы становятся синими — это безводный хлорид кобальта(II) ${h.F('CoCl2')}.`,
        why7: 'Серная кислота очень жадно поглощает воду.',
        why: 'По этой перемене цвета хлоридом кобальта(II) обнаруживают влагу: во влажном воздухе он снова розовеет.'
      }
    : {
        title: 'Медный купорос побелел',
        say: `Концентрированная серная кислота отнимает у синих кристаллов ${h.F('CuSO4·5H2O')} кристаллизационную воду: они превращаются в белый безводный сульфат меди(II) ${h.F('CuSO4')}.`,
        why7: 'Серная кислота очень жадно поглощает воду.',
        why: 'Концентрированная серная кислота — сильное водоотнимающее средство: ею осушают газы, а сахар и бумагу она обугливает. Капни на белый порошок водой — он снова посинеет.'
      }),
  nitricPrep: (p, h) => ({
    title: 'Отгоняется азотная кислота',
    say: `При нагревании селитры ${h.F(p.salt)} с концентрированной серной кислотой выделяются «дымящие» пары азотной кислоты ${h.F('HNO3')} с резким запахом. Часть кислоты разлагается, и пары буреют от ${h.F('NO2')}. В пробирке остаётся гидросульфат.`,
    why7: 'Так в лаборатории получают азотную кислоту.',
    why: 'Нелетучая серная кислота вытесняет летучую азотную из её солей; пары собирают в охлаждаемый приёмник. На свету и при нагревании азотная кислота разлагается (4HNO₃ → 4NO₂ + O₂ + 2H₂O), поэтому её хранят в тёмных склянках. Только под тягой.'
  }),
  heatInAir: (p) => (p.metal === 'Mg'
    ? {
        title: 'Магний вспыхнул ослепительным пламенем',
        say: 'Магний загорелся ярким белым пламенем — долго смотреть на него нельзя. Остаётся белый порошок оксида магния ⟦MgO⟧.',
        why7: 'Горение — реакция с кислородом, при которой выделяются тепло и свет.',
        why: 'Магний горит очень жарко, около 2000 °C; раньше его вспышками пользовались фотографы. Горящий магний нельзя тушить водой и углекислым газом: он горит и в них.'
      }
    : p.metal === 'S'
    ? {
        title: 'Сера горит синим пламенем',
        say: 'Расплавленная сера загорелась на воздухе маленьким синим пламенем; выделяется сернистый газ ⟦SO2⟧ с запахом горелой спички.',
        why7: 'Сера соединяется с кислородом воздуха — это горение.',
        why: 'S + O₂ → SO₂. В чистом кислороде сера горит ярче. Сернистый газ ядовит — только под тягой.'
      }
    : {
        title: 'Медь почернела',
        say: 'При нагревании на воздухе медь покрывается чёрным налётом оксида меди(II) ⟦CuO⟧: она соединяется с кислородом воздуха.',
        why7: 'Медь не горит, но окисляется — это химическая реакция.',
        why: 'Оксид образуется только на поверхности, металл под ним цел. Опусти почерневшую медь в соляную или серную кислоту — налёт растворится, и раствор станет голубым.'
      }),
  solFormation: (_p, h) => ({
    title: 'Раствор стал тёмно-красно-бурым',
    say: `При кипячении ионы железа(III) реагируют с водой: образуется гидроксид железа(III) ${h.F('Fe(OH)3')}, но не осадком, а мельчайшими частицами, взвешенными в жидкости. Это коллоидный раствор (золь): тёмно-красно-бурый, как крепкий чай, и проходит через фильтр.`,
    why7: 'Соль железа(III) частично разлагается водой — это гидролиз.',
    why: 'Fe³⁺ + 3H₂O ⇄ Fe(OH)₃ + 3H⁺. При нагревании гидролиз усиливается, а образующаяся кислота его сдерживает. Если посветить на золь фонариком сбоку, виден светящийся путь луча — это эффект Тиндаля.'
  }),
  colorFade: () => ({
    title: 'Синяя окраска исчезла',
    say: 'В горячем растворе синяя окраска крахмала с иодом пропадает. Дай раствору остыть — синий цвет вернётся.',
    why7: 'Это обратимое изменение: вещества никуда не делись.',
    why: 'Иод слабо удерживается внутри спиральных молекул крахмала; при нагревании спирали раскручиваются и отпускают иод. При охлаждении они снова захватывают его.'
  })
};

const KK: Record<NewKinds, Fn> = {
  concOxidation: (p, h) => {
    if (p.acid === 'H2SO4') {
      switch (p.reducer) {
        case 'Br^-': return {
          title: 'Бромның қоңыр булары көтеріледі',
          say: `Концентрлі күкірт қышқылы бромидті бромға ${h.F('Br2')} дейін тотықтырады: тұздың үстінен өткір иісті қоңыр бу көтеріледі, күкірт(IV) оксиді ${h.F('SO2')} де бөлінеді.`,
          why7: 'Қышқыл бромид-иондардан электрон тартып алды, бром түзілді.',
          why: 'Бромид-ион хлорид-ионнан күшті тотықсыздандырғыш, сондықтан бромсутекті хлорсутек сияқты бұлай алуға болмайды: күкірт(+6) оны бромға дейін тотықтырып, өзі SO₂-ге дейін тотықсызданады. Тек тартпа шкафта.'
        };
        case 'I^-': return {
          title: 'Йод пайда болды, шіріген жұмыртқа иісі шықты',
          say: `Йодид йодқа ${h.F('I2')} дейін тотығады — қоспа қараяды, күлгін бу көрінеді. Қышқыл өте терең тотықсызданады — шіріген жұмыртқа иісті күкіртсутекке ${h.F('H2S')} дейін.`,
          why7: 'Йодид бромидтен де оңай электрон береді.',
          why: 'Йодид-ион — галогенид-иондардың ішіндегі ең күшті тотықсыздандырғыш: ол күкірт(+6)-ны тіпті күкірт(−2)-ге дейін тотықсыздандырады. Тотықсыздандырғыш неғұрлым күшті болса, қышқыл соғұрлым терең тотықсызданады. Тек тартпа шкафта.'
        };
        case 'S^2-': return {
          title: 'Күкірт пен күкірт(IV) оксиді бөлінеді',
          say: `Сульфид сары күкіртке ${h.F('S')} дейін тотығады, ал қышқыл жанған сіріңке иісті күкірт(IV) оксидіне ${h.F('SO2')} дейін тотықсызданады.`,
          why: 'Күкірт(−2) күкірт(+6)-ға электрон береді: жай зат күкірт пен SO₂ түзіледі. Тек тартпа шкафта.'
        };
        case 'C': return {
          title: 'Көмір қышқылмен тотығады',
          say: `Ыстық концентрлі күкірт қышқылы көмірді көмірқышқыл газға ${h.F('CO2')} дейін тотықтырады, ал өзі жанған сіріңке иісті күкірт(IV) оксидіне ${h.F('SO2')} дейін тотықсызданады.`,
          why7: 'Ыстық концентрлі күкірт қышқылы — күшті тотықтырғыш.',
          why: 'Мұнда тотықтырғыш — күкірт(+6). Қышқыл күкіртті және көптеген органикалық заттарды да осылай тотықтырады. Тек тартпа шкафта.'
        };
        default: return {
          title: 'Күкірт қышқылмен тотығады',
          say: `Ыстық концентрлі күкірт қышқылы күкіртті тотықтырады. Күкірт те, қышқыл да жанған сіріңке иісті күкірт(IV) оксидіне ${h.F('SO2')} айналады.`,
          why: 'Күкірт(0) +4-ке дейін тотығады, күкірт(+6) +4-ке дейін тотықсызданады — екеуі де SO₂ құрамында кездеседі. Тек тартпа шкафта.'
        };
      }
    }
    switch (p.reducer) {
      case 'I^-': return {
        title: 'Йод пен қоңыр газ бөлінді',
        say: `Концентрлі азот қышқылы йодидті бірден йодқа ${h.F('I2')} дейін тотықтырады: ерітінді қоңырқайланып, қара кристалдар түседі. Пробирканың үстінде — қоңыр азот(IV) оксиді ${h.F('NO2')}.`,
        why7: 'Азот қышқылы йодид-иондардан электрон тартып алды.',
        why: 'Азот қышқылы азот(+5) есебінен тотықтырғыш. Концентрлісі NO₂-ге дейін, сұйылтылғаны NO-ға дейін тотықсызданады. Тек тартпа шкафта.'
      };
      case 'Fe^2+': return {
        title: 'Темір(II) темір(III)-ке дейін тотықты',
        say: `Ақшыл жасыл ерітінді сарғаяды: ${h.F('Fe^2+')} иондары ${h.F('Fe^3+')} иондарына дейін тотығады, қоңыр ${h.F('NO2')} бөлінеді. Калий роданидін қос — қан-қызыл түс пайда болады.`,
        why: 'Fe²⁺ — тотықсыздандырғыш, азот қышқылы — тотықтырғыш: Fe²⁺ − e⁻ → Fe³⁺. Тек тартпа шкафта.'
      };
      case 'S^2-':
      case 'H2S': return {
        title: 'Күкірт түсті',
        say: `Азот қышқылы ${p.reducer === 'H2S' ? 'күкіртсутекті' : 'сульфидті'} күкіртке ${h.F('S')} дейін тотықтырады: сары лай пайда болады, қоңыр ${h.F('NO2')} бөлінеді. Күкіртсутек бөлінбейді.`,
        why: 'Күкірт(−2) — күшті тотықсыздандырғыш. Тотықтырғыш қышқылдармен сульфидтер күкіртсутек емес, күкірт береді. Тек тартпа шкафта.'
      };
      case 'SO3^2-':
      case 'SO2': return {
        title: 'Сульфит сульфатқа дейін тотықты',
        say: `Азот қышқылы ${p.reducer === 'SO2' ? 'еріген күкірт(IV) оксидін' : 'сульфитті'} сульфатқа ${h.F('SO4^2-')} дейін тотықтырады, қоңыр ${h.F('NO2')} бөлінеді. Күкірт(IV) оксиді бөлінбейді.`,
        why: 'Күкірт(+4) +6-ға дейін тотығады. Барий хлоридін қос — қышқылдарда ерімейтін барий сульфатының ақ тұнбасы түседі.'
      };
      case 'C': return {
        title: 'Көмір азот қышқылымен тотығады',
        say: `Ыстық концентрлі азот қышқылы көмірді көмірқышқыл газға ${h.F('CO2')} дейін тотықтырады, қоңыр ${h.F('NO2')} көп бөлінеді.`,
        why: 'Концентрлі азот қышқылы көптеген бейметалдарды тотықтырады: көміртекті — CO₂-ге, күкіртті — күкірт қышқылына, фосфорды — фосфор қышқылына дейін. Тек тартпа шкафта.'
      };
      default: return {
        title: 'Күкірт күкірт қышқылына дейін тотығады',
        say: `Ыстық концентрлі азот қышқылы күкіртті күкірт қышқылына дейін тотықтырады, қоңыр ${h.F('NO2')} бөлінеді. Барий хлоридін қос — ақ ${h.F('BaSO4')} тұнбасы түседі.`,
        why: 'Концентрлі азот қышқылы көптеген бейметалдарды тотықтырады: көміртекті — CO₂-ге, күкіртті — күкірт қышқылына, фосфорды — фосфор қышқылына дейін. Тек тартпа шкафта.'
      };
    }
  },
  dehydration: (p, h) => (p.solid === 'CoCl2·6H2O'
    ? {
        title: 'Қызғылт кристалдар көгерді',
        say: `Концентрлі күкірт қышқылы ${h.F('CoCl2·6H2O')} кристалгидратының суын тартып алады: қызғылт кристалдар көк түске енеді — бұл сусыз кобальт(II) хлориді ${h.F('CoCl2')}.`,
        why7: 'Күкірт қышқылы суды өте құмарлықпен сіңіреді.',
        why: 'Кобальт(II) хлоридінің түсінің осылай өзгеруі бойынша ылғалды анықтайды: дымқыл ауада ол қайтадан қызғылт болады.'
      }
    : {
        title: 'Мыс купоросы ағарды',
        say: `Концентрлі күкірт қышқылы көк ${h.F('CuSO4·5H2O')} кристалдарының кристалдық суын тартып алады: олар ақ сусыз мыс(II) сульфатына ${h.F('CuSO4')} айналады.`,
        why7: 'Күкірт қышқылы суды өте құмарлықпен сіңіреді.',
        why: 'Концентрлі күкірт қышқылы — күшті су тартқыш зат: онымен газдарды кептіреді, ал қант пен қағазды ол көмірге айналдырады. Ақ ұнтаққа су тамызсаң, ол қайтадан көгереді.'
      }),
  nitricPrep: (p, h) => ({
    title: 'Азот қышқылы айдалады',
    say: `Селитраны ${h.F(p.salt)} концентрлі күкірт қышқылымен қыздырғанда өткір иісті, «түтіндейтін» азот қышқылының ${h.F('HNO3')} булары бөлінеді. Қышқылдың бір бөлігі ыдырап, булар ${h.F('NO2')} есебінен қоңырқайланады. Пробиркада гидросульфат қалады.`,
    why7: 'Зертханада азот қышқылын осылай алады.',
    why: 'Ұшпайтын күкірт қышқылы ұшқыш азот қышқылын оның тұздарынан ығыстырады; буларды салқындатылған қабылдағышқа жинайды. Жарықта және қыздырғанда азот қышқылы ыдырайды (4HNO₃ → 4NO₂ + O₂ + 2H₂O), сондықтан оны қараңғы шыны ыдыста сақтайды. Тек тартпа шкафта.'
  }),
  heatInAir: (p) => (p.metal === 'Mg'
    ? {
        title: 'Магний көз қарықтырар жалынмен тұтанды',
        say: 'Магний жарқыраған ақ жалынмен жанды — оған ұзақ қарауға болмайды. Магний оксидінің ⟦MgO⟧ ақ ұнтағы қалады.',
        why7: 'Жану — жылу мен жарық бөле жүретін оттекпен реакция.',
        why: 'Магний өте ыстық жалынмен жанады, шамамен 2000 °C; бұрын оның жарқылын фотографтар пайдаланған. Жанып жатқан магнийді сумен де, көмірқышқыл газбен де сөндіруге болмайды: ол оларда да жанады.'
      }
    : p.metal === 'S'
    ? {
        title: 'Күкірт көк жалынмен жанады',
        say: 'Балқыған күкірт ауада кішкентай көк жалынмен тұтанды; жанған сіріңке иісті күкірт(IV) оксиді ⟦SO2⟧ бөлінеді.',
        why7: 'Күкірт ауадағы оттекпен қосылады — бұл жану.',
        why: 'S + O₂ → SO₂. Таза оттекте күкірт жарқырай жанады. Күкірт(IV) оксиді улы — тек тартпа шкафта.'
      }
    : {
        title: 'Мыс қарайды',
        say: 'Ауада қыздырғанда мыстың беті мыс(II) оксидінің ⟦CuO⟧ қара қабатымен жабылады: мыс ауадағы оттекпен қосылады.',
        why7: 'Мыс жанбайды, бірақ тотығады — бұл химиялық реакция.',
        why: 'Оксид тек бетінде түзіледі, астындағы металл бүтін. Қарайған мысты тұз немесе күкірт қышқылына салсаң, қабат еріп, ерітінді көгілдір болады.'
      }),
  solFormation: (_p, h) => ({
    title: 'Ерітінді қою қызыл-қоңыр түске енді',
    say: `Қайнатқанда темір(III) иондары сумен әрекеттеседі: темір(III) гидроксиді ${h.F('Fe(OH)3')} түзіледі, бірақ тұнба болып емес, сұйықтықта қалқып жүрген өте ұсақ бөлшектер түрінде. Бұл — коллоидты ерітінді (золь): қою шайдай қызыл-қоңыр, сүзгіден өтіп кетеді.`,
    why7: 'Темір(III) тұзы сумен ішінара ыдырайды — бұл гидролиз.',
    why: 'Fe³⁺ + 3H₂O ⇄ Fe(OH)₃ + 3H⁺. Қыздырғанда гидролиз күшейеді, ал түзілген қышқыл оны тежейді. Зольге бүйірінен шам сәулесін түсірсең, сәуленің жарқыраған жолы көрінеді — бұл Тиндаль эффектісі.'
  }),
  colorFade: () => ({
    title: 'Көк түс жоғалды',
    say: 'Ыстық ерітіндіде крахмал мен йодтың көк түсі жоғалады. Ерітінді суыса — көк түс қайта оралады.',
    why7: 'Бұл қайтымды өзгеріс: заттар еш жерге жоғалған жоқ.',
    why: 'Йод крахмалдың спираль тәрізді молекулаларының ішінде әлсіз ұсталады; қыздырғанда спиральдар жазылып, йодты босатады. Суығанда олар йодты қайта қамтиды.'
  })
};

const EN: Record<NewKinds, Fn> = {
  concOxidation: (p, h) => {
    if (p.acid === 'H2SO4') {
      switch (p.reducer) {
        case 'Br^-': return {
          title: 'Brown bromine vapour rises',
          say: `Concentrated sulfuric acid oxidises the bromide to bromine ${h.F('Br2')}: brown vapour with a sharp smell rises over the salt, and sulfur dioxide ${h.F('SO2')} is given off too.`,
          why7: 'The acid took electrons from the bromide ions, and bromine formed.',
          why: 'Bromide is a stronger reducing agent than chloride, so hydrogen bromide cannot be made the way hydrogen chloride is: sulfur(+6) oxidises it to bromine and is itself reduced to SO₂. Fume hood only.'
        };
        case 'I^-': return {
          title: 'Iodine appears, with a smell of rotten eggs',
          say: `The iodide is oxidised to iodine ${h.F('I2')}: the mixture darkens and violet vapour can be seen. The acid is reduced a long way, to hydrogen sulfide ${h.F('H2S')} that smells of rotten eggs.`,
          why7: 'Iodide gives up electrons even more easily than bromide.',
          why: 'Iodide is the strongest reducing agent of the halide ions: it reduces sulfur(+6) all the way to sulfur(−2). The stronger the reducing agent, the further the acid is reduced. Fume hood only.'
        };
        case 'S^2-': return {
          title: 'Sulfur and sulfur dioxide form',
          say: `The sulfide is oxidised to yellow sulfur ${h.F('S')}, and the acid is reduced to sulfur dioxide ${h.F('SO2')}, which smells of a struck match.`,
          why: 'Sulfur(−2) gives electrons to sulfur(+6): the element sulfur and SO₂ form. Fume hood only.'
        };
        case 'C': return {
          title: 'The acid oxidises charcoal',
          say: `Hot concentrated sulfuric acid oxidises charcoal to carbon dioxide ${h.F('CO2')} and is itself reduced to sulfur dioxide ${h.F('SO2')}, which smells of a struck match.`,
          why7: 'Hot concentrated sulfuric acid is a strong oxidising agent.',
          why: 'The oxidising agent is sulfur(+6). The acid oxidises sulfur and many organic substances in the same way. Fume hood only.'
        };
        default: return {
          title: 'The acid oxidises sulfur',
          say: `Hot concentrated sulfuric acid oxidises sulfur. Both the sulfur and the acid end up as sulfur dioxide ${h.F('SO2')}, which smells of a struck match.`,
          why: 'Sulfur(0) is oxidised to +4 and sulfur(+6) is reduced to +4: they meet in SO₂. Fume hood only.'
        };
      }
    }
    switch (p.reducer) {
      case 'I^-': return {
        title: 'Iodine and a brown gas form',
        say: `Concentrated nitric acid oxidises the iodide to iodine ${h.F('I2')} at once: the solution turns brown and dark crystals settle. Brown nitrogen dioxide ${h.F('NO2')} rises from the tube.`,
        why7: 'Nitric acid took electrons from the iodide ions.',
        why: 'Nitric acid oxidises through its nitrogen(+5). The concentrated acid is reduced to NO₂, the dilute acid to NO. Fume hood only.'
      };
      case 'Fe^2+': return {
        title: 'Iron(II) is oxidised to iron(III)',
        say: `The pale green solution turns yellow: ${h.F('Fe^2+')} ions are oxidised to ${h.F('Fe^3+')}, and brown ${h.F('NO2')} is given off. Add potassium thiocyanate and a blood-red colour appears.`,
        why: 'Fe²⁺ is the reducing agent and nitric acid the oxidising agent: Fe²⁺ − e⁻ → Fe³⁺. Fume hood only.'
      };
      case 'S^2-':
      case 'H2S': return {
        title: 'Sulfur comes out',
        say: `Nitric acid oxidises the ${p.reducer === 'H2S' ? 'hydrogen sulfide' : 'sulfide'} to sulfur ${h.F('S')}: a yellow cloudiness appears and brown ${h.F('NO2')} is given off. No hydrogen sulfide escapes.`,
        why: 'Sulfur(−2) is a strong reducing agent. With oxidising acids, sulfides give sulfur rather than hydrogen sulfide. Fume hood only.'
      };
      case 'SO3^2-':
      case 'SO2': return {
        title: 'Sulfite is oxidised to sulfate',
        say: `Nitric acid oxidises the ${p.reducer === 'SO2' ? 'dissolved sulfur dioxide' : 'sulfite'} to sulfate ${h.F('SO4^2-')}, and brown ${h.F('NO2')} is given off. No sulfur dioxide escapes.`,
        why: 'Sulfur(+4) is oxidised to +6. Add barium chloride and a white precipitate of barium sulfate forms that acids do not dissolve.'
      };
      case 'C': return {
        title: 'Nitric acid oxidises charcoal',
        say: `Hot concentrated nitric acid oxidises charcoal to carbon dioxide ${h.F('CO2')}, giving off plenty of brown ${h.F('NO2')}.`,
        why: 'Concentrated nitric acid oxidises many non-metals: carbon to CO₂, sulfur to sulfuric acid, phosphorus to phosphoric acid. Fume hood only.'
      };
      default: return {
        title: 'Sulfur is oxidised to sulfuric acid',
        say: `Hot concentrated nitric acid oxidises sulfur to sulfuric acid, and brown ${h.F('NO2')} is given off. Add barium chloride and white ${h.F('BaSO4')} comes down.`,
        why: 'Concentrated nitric acid oxidises many non-metals: carbon to CO₂, sulfur to sulfuric acid, phosphorus to phosphoric acid. Fume hood only.'
      };
    }
  },
  dehydration: (p, h) => (p.solid === 'CoCl2·6H2O'
    ? {
        title: 'The pink crystals turn blue',
        say: `Concentrated sulfuric acid takes the water out of ${h.F('CoCl2·6H2O')}: the pink crystals turn blue, which is anhydrous cobalt(II) chloride ${h.F('CoCl2')}.`,
        why7: 'Sulfuric acid soaks up water very greedily.',
        why: 'This colour change makes cobalt(II) chloride a test for water: in damp air it turns pink again.'
      }
    : {
        title: 'Blue vitriol turns white',
        say: `Concentrated sulfuric acid takes the water of crystallisation out of the blue crystals of ${h.F('CuSO4·5H2O')}: they turn into white anhydrous copper(II) sulfate ${h.F('CuSO4')}.`,
        why7: 'Sulfuric acid soaks up water very greedily.',
        why: 'Concentrated sulfuric acid is a strong dehydrating agent: it is used to dry gases, and it chars sugar and paper. Add a drop of water to the white powder and it turns blue again.'
      }),
  nitricPrep: (p, h) => ({
    title: 'Nitric acid distils off',
    say: `Heating saltpetre ${h.F(p.salt)} with concentrated sulfuric acid gives fuming vapour of nitric acid ${h.F('HNO3')} with a sharp smell. Some of the acid breaks down and turns the vapour brown with ${h.F('NO2')}. A hydrogen sulfate is left in the tube.`,
    why7: 'This is how nitric acid is made in the lab.',
    why: 'Non-volatile sulfuric acid drives the volatile nitric acid out of its salts; the vapour is collected in a cooled receiver. Light and heat break nitric acid down (4HNO₃ → 4NO₂ + O₂ + 2H₂O), so it is kept in dark bottles. Fume hood only.'
  }),
  heatInAir: (p) => (p.metal === 'Mg'
    ? {
        title: 'Magnesium bursts into a blinding flame',
        say: 'Magnesium catches fire with a brilliant white flame; do not look at it for long. A white powder of magnesium oxide ⟦MgO⟧ is left.',
        why7: 'Burning is a reaction with oxygen that gives out heat and light.',
        why: 'Magnesium burns very hot, at about 2000 °C; photographers once used its flash. Burning magnesium cannot be put out with water or carbon dioxide: it keeps burning in them.'
      }
    : p.metal === 'S'
    ? {
        title: 'Sulfur burns with a blue flame',
        say: 'The molten sulfur catches fire in air with a small blue flame, giving off sulfur dioxide ⟦SO2⟧ that smells of a struck match.',
        why7: 'Sulfur combines with oxygen from the air: it burns.',
        why: 'S + O₂ → SO₂. In pure oxygen sulfur burns more brightly. Sulfur dioxide is toxic, so use a fume hood.'
      }
    : {
        title: 'The copper turns black',
        say: 'Heated in air, copper gets a black coat of copper(II) oxide ⟦CuO⟧ as it combines with oxygen from the air.',
        why7: 'Copper does not burn, but it is oxidised: a chemical reaction.',
        why: 'The oxide forms only on the surface; the metal underneath is unchanged. Dip the blackened copper in hydrochloric or sulfuric acid and the coat dissolves, turning the solution blue.'
      }),
  solFormation: (_p, h) => ({
    title: 'The solution turns dark red-brown',
    say: `On boiling, iron(III) ions react with water: iron(III) hydroxide ${h.F('Fe(OH)3')} forms, not as a precipitate but as tiny particles that stay suspended in the liquid. This is a colloidal solution (a sol): dark red-brown like strong tea, and it passes through a filter.`,
    why7: 'The iron(III) salt is partly broken down by water: hydrolysis.',
    why: 'Fe³⁺ + 3H₂O ⇌ Fe(OH)₃ + 3H⁺. Heat pushes the hydrolysis forward, and the acid it makes holds it back. A torch beam shows up in the sol as a glowing path: the Tyndall effect.'
  }),
  colorFade: () => ({
    title: 'The blue colour disappears',
    say: 'In the hot solution the blue colour of starch with iodine fades. Let the solution cool and the blue comes back.',
    why7: 'The change is reversible: nothing has gone anywhere.',
    why: 'Iodine is held only loosely inside the coiled starch molecules; heat uncoils them and they let the iodine go. On cooling they take it up again.'
  })
};

export function extraEvents(lang: Lang): Pick<EventTexts, NewKinds> {
  return lang === 'kk' ? KK : lang === 'en' ? EN : RU;
}

// ---------------------------------------------------------------- variants of earlier events

type Variant = (p: Record<string, string>, h: H) => EventText | null;

interface ElectroMore {
  metal: Record<string, string>;         // name of a metal deposited on the cathode
  deposit: (metal: string, h2: boolean) => string;
  title: (metal: string) => string;
  fe2: { title: string; cathode: string };
  h2: string;
  h2acid: string;
  anode: Record<string, string>;
  anodeTitle: Record<string, string>;
  say: (c: string, a: string) => string;
  why: string;
}

const ELECTRO: Record<Lang, ElectroMore> = {
  ru: {
    metal: { Pb: 'свинец', Sn: 'олово', Ni: 'никель', Co: 'кобальт', Cr: 'хром', Mn: 'марганец', Zn: 'цинк', Fe: 'железо', Cu: 'медь', Ag: 'серебро' },
    deposit: (m, h2) => `восстанавливается ${m}${h2 ? ', одновременно выделяется немного водорода ⟦H2⟧' : ''}`,
    title: (m) => `На катоде оседает ${m}`,
    fe2: { title: 'Жёлтый раствор становится бледно-зелёным', cathode: 'ионы железа(III) принимают по одному электрону и становятся ионами железа(II) ⟦Fe^2+⟧; металл пока не выделяется' },
    h2: 'выделяется водород ⟦H2⟧: металл слишком активный, поэтому восстанавливается вода',
    h2acid: 'выделяется водород ⟦H2⟧: восстанавливаются ионы водорода кислоты',
    anode: {
      Cl2: 'выделяется ядовитый хлор ⟦Cl2⟧ с резким запахом — опыт под тягой', I2: 'образуется иод, и раствор буреет',
      Br2: 'образуется бром ⟦Br2⟧ — раствор у анода желтеет и буреет', S: 'выделяется сера ⟦S⟧ — раствор мутнеет, появляется жёлтый осадок',
      O2: 'выделяется кислород ⟦O2⟧: кислородсодержащие ионы не окисляются, окисляется вода'
    },
    anodeTitle: { Br2: 'Раствор у анода буреет — выделяется бром', S: 'У анода выделяется сера' },
    say: (c, a) => `Через раствор идёт ток. На катоде (−) ${c}. На аноде (+) ${a}.`,
    why: 'Чем правее металл в ряду активности, тем легче его ионы восстанавливаются: серебро и медь выделяются полностью, металлы от алюминия до водорода — вместе с водородом, а катионы активных металлов не восстанавливаются — восстанавливается вода. На аноде легче всего окисляются S²⁻, затем I⁻, Br⁻, Cl⁻; кислородсодержащие ионы не окисляются.'
  },
  kk: {
    metal: { Pb: 'қорғасын', Sn: 'қалайы', Ni: 'никель', Co: 'кобальт', Cr: 'хром', Mn: 'марганец', Zn: 'мырыш', Fe: 'темір', Cu: 'мыс', Ag: 'күміс' },
    deposit: (m, h2) => `${m} тотықсызданады${h2 ? ', сонымен қатар аздаған сутек ⟦H2⟧ бөлінеді' : ''}`,
    title: (m) => `Катодта ${m} бөлінеді`,
    fe2: { title: 'Сары ерітінді ақшыл жасыл түске енеді', cathode: 'темір(III) иондары бір-бір электрон қосып алып, темір(II) иондарына ⟦Fe^2+⟧ айналады; металл әзірге бөлінбейді' },
    h2: 'сутек ⟦H2⟧ бөлінеді: металл тым белсенді, сондықтан су тотықсызданады',
    h2acid: 'сутек ⟦H2⟧ бөлінеді: қышқылдың сутек иондары тотықсызданады',
    anode: {
      Cl2: 'өткір иісті улы хлор ⟦Cl2⟧ бөлінеді — тәжірибе тартпа шкафта', I2: 'йод түзіліп, ерітінді қоңырқайланады',
      Br2: 'бром ⟦Br2⟧ түзіледі — анод маңындағы ерітінді сарғайып, қоңырқайланады', S: 'күкірт ⟦S⟧ бөлінеді — ерітінді лайланып, сары тұнба пайда болады',
      O2: 'оттек ⟦O2⟧ бөлінеді: оттекті иондар тотықпайды, су тотығады'
    },
    anodeTitle: { Br2: 'Анод маңындағы ерітінді қоңырқайланады — бром бөлінеді', S: 'Анодта күкірт бөлінеді' },
    say: (c, a) => `Ерітінді арқылы ток өтеді. Катодта (−) ${c}. Анодта (+) ${a}.`,
    why: 'Металл белсенділік қатарында неғұрлым оңда тұрса, оның иондары соғұрлым оңай тотықсызданады: күміс пен мыс толық бөлінеді, алюминийден сутекке дейінгі металдар сутекпен бірге бөлінеді, ал белсенді металдардың катиондары тотықсызданбайды — су тотықсызданады. Анодта ең оңай S²⁻, содан кейін I⁻, Br⁻, Cl⁻ тотығады; оттекті иондар тотықпайды.'
  },
  en: {
    metal: { Pb: 'lead', Sn: 'tin', Ni: 'nickel', Co: 'cobalt', Cr: 'chromium', Mn: 'manganese', Zn: 'zinc', Fe: 'iron', Cu: 'copper', Ag: 'silver' },
    deposit: (m, h2) => `${m} is deposited${h2 ? ', with a little hydrogen ⟦H2⟧ at the same time' : ''}`,
    title: (m) => `${m[0].toUpperCase()}${m.slice(1)} is deposited on the cathode`,
    fe2: { title: 'The yellow solution turns pale green', cathode: 'iron(III) ions each gain one electron and become iron(II) ions ⟦Fe^2+⟧; no metal forms yet' },
    h2: 'hydrogen ⟦H2⟧ is given off: the metal is too active, so water is reduced',
    h2acid: 'hydrogen ⟦H2⟧ is given off: the acid\'s hydrogen ions are reduced',
    anode: {
      Cl2: 'toxic chlorine ⟦Cl2⟧ with a sharp smell is given off (fume hood)', I2: 'iodine forms and the solution turns brown',
      Br2: 'bromine ⟦Br2⟧ forms and the solution near the anode turns yellow, then brown', S: 'sulfur ⟦S⟧ forms: the solution turns cloudy with a yellow precipitate',
      O2: 'oxygen ⟦O2⟧ is given off: oxygen-containing ions are not oxidised, water is'
    },
    anodeTitle: { Br2: 'The solution near the anode turns brown: bromine forms', S: 'Sulfur forms at the anode' },
    say: (c, a) => `Current flows through the solution. At the cathode (−) ${c}. At the anode (+) ${a}.`,
    why: 'The further right a metal is in the activity series, the more easily its ions are reduced: silver and copper are deposited completely, metals from aluminium to hydrogen come out together with hydrogen, and the cations of active metals are not reduced at all, so water is. At the anode S²⁻ is oxidised most easily, then I⁻, Br⁻, Cl⁻; oxygen-containing ions are not oxidised.'
  }
};

/** Electrolysis texts for products the basic texts do not cover. */
function electrolysisVariant(lang: Lang): Variant {
  const el = ELECTRO[lang];
  const basicCathode = ['Cu', 'Ag', 'Zn', 'Fe', 'H2'];
  const basicAnode = ['Cl2', 'I2', 'O2'];
  return (p) => {
    const newCathode = !basicCathode.includes(p.cathode);
    const newAnode = !basicAnode.includes(p.anode);
    if (!newCathode && !newAnode && !(p.h2 === '' && (p.cathode === 'Zn' || p.cathode === 'Fe'))) return null;
    const cathode = p.cathode === 'Fe^2+' ? el.fe2.cathode
      : p.cathode === 'H2' ? (p.acid ? el.h2acid : el.h2)
      : el.deposit(el.metal[p.cathode] ?? p.cathode, !!p.h2);
    const anode = el.anode[p.anode] ?? el.anode.O2;
    const title = p.cathode === 'Fe^2+' ? el.fe2.title
      : p.cathode !== 'H2' ? el.title(el.metal[p.cathode] ?? p.cathode)
      : el.anodeTitle[p.anode] ?? el.anodeTitle.S;
    return { title, say: el.say(cathode, anode), why: el.why };
  };
}

const VARIANTS: Record<Lang, Partial<Record<keyof EventTexts, Variant>>> = {
  ru: {
    thermalDecomp: (p, h) => {
      switch (p.nitrate) {
        case 'ammonium': return { title: 'Нитрат аммония разлагается', say: `Расплав нитрата аммония разлагается на оксид азота(I) ${h.F('N2O')} («веселящий газ») и пары воды. Тлеющая лучинка в этом газе вспыхивает, как в кислороде.`, why: 'NH₄NO₃ → N₂O + 2H₂O. Сильно нагревать много нитрата аммония опасно — возможен взрыв, поэтому греют лишь несколько крупинок.' };
        case 'active': return { title: 'Нитрат выделяет кислород', say: `${h.cap(h.N(p.solid))} при сильном нагревании плавится и выделяет кислород ${h.F('O2')}; остаётся нитрит. Тлеющая лучинка над пробиркой вспыхивает.`, why: 'Нитраты активных металлов (левее магния) разлагаются до нитрита и кислорода, металлов от магния до меди — до оксида металла, NO₂ и O₂, металлов правее меди — до самого металла, NO₂ и O₂.' };
        case 'middle': return { title: 'Выделяется бурый газ', say: `${h.cap(h.N(p.solid))} при сильном нагревании разлагается: выделяются бурый ядовитый ${h.F('NO2')} и кислород, остаётся оксид металла.`, why: 'Нитраты металлов от магния до меди разлагаются до оксида металла, NO₂ и O₂; активных металлов — до нитрита и кислорода; металлов правее меди — до самого металла. Только под тягой.' };
        case 'noble': return { title: 'Остаётся серебро, выделяется бурый газ', say: `Нитрат серебра при сильном нагревании разлагается: остаётся металлическое серебро ${h.F('Ag')}, выделяются бурый ${h.F('NO2')} и кислород.`, why: 'Нитраты металлов правее меди в ряду активности разлагаются до металла, NO₂ и O₂. Только под тягой.' };
        default: return null;
      }
    },
    crystallize: (p) => p.cause === 'heat'
      ? { title: 'Известковая вода помутнела при нагревании', say: 'Гидроксид кальция — редкое исключение: в горячей воде он растворяется хуже, чем в холодной. Поэтому при нагревании прозрачная известковая вода мутнеет. Остуди — муть понемногу исчезнет.', why: 'Растворимость большинства твёрдых веществ с ростом температуры растёт, но у Ca(OH)₂ и CaSO₄ — падает.' }
      : null,
    electrolysis: electrolysisVariant('ru')
  },
  kk: {
    thermalDecomp: (p, h) => {
      switch (p.nitrate) {
        case 'ammonium': return { title: 'Аммоний нитраты ыдырайды', say: `Аммоний нитратының балқымасы азот(I) оксиді ${h.F('N2O')} («күлдіргіш газ») мен су буына ыдырайды. Бықсыған шақпақ бұл газда оттектегідей жалындап кетеді.`, why: 'NH₄NO₃ → N₂O + 2H₂O. Аммоний нитратын көп мөлшерде қатты қыздыру қауіпті — жарылуы мүмкін, сондықтан бірнеше түйірін ғана қыздырады.' };
        case 'active': return { title: 'Нитрат оттек бөледі', say: `${h.cap(h.N(p.solid))} қатты қыздырғанда балқып, оттек ${h.F('O2')} бөледі; нитрит қалады. Пробирка үстіндегі бықсыған шақпақ жалындап кетеді.`, why: 'Белсенді металдардың (магнийден сол жақтағы) нитраттары нитрит пен оттекке, магнийден мысқа дейінгі металдардікі — металл оксиді, NO₂ және O₂-ге, мыстан оң жақтағы металдардікі — металдың өзі, NO₂ және O₂-ге ыдырайды.' };
        case 'middle': return { title: 'Қоңыр газ бөлінеді', say: `${h.cap(h.N(p.solid))} қатты қыздырғанда ыдырайды: улы қоңыр ${h.F('NO2')} пен оттек бөлінеді, металл оксиді қалады.`, why: 'Магнийден мысқа дейінгі металдардың нитраттары металл оксиді, NO₂ және O₂-ге; белсенді металдардікі — нитрит пен оттекке; мыстан оң жақтағы металдардікі — металдың өзіне дейін ыдырайды. Тек тартпа шкафта.' };
        case 'noble': return { title: 'Күміс қалады, қоңыр газ бөлінеді', say: `Күміс нитраты қатты қыздырғанда ыдырайды: металл күміс ${h.F('Ag')} қалады, қоңыр ${h.F('NO2')} пен оттек бөлінеді.`, why: 'Белсенділік қатарында мыстан оң жақта тұрған металдардың нитраттары металл, NO₂ және O₂-ге ыдырайды. Тек тартпа шкафта.' };
        default: return null;
      }
    },
    crystallize: (p) => p.cause === 'heat'
      ? { title: 'Әк суы қыздырғанда лайланды', say: 'Кальций гидроксиді — сирек ерекшелік: ыстық суда ол суық судағыдан нашар ериді. Сондықтан мөлдір әк суы қыздырғанда лайланады. Суытсаң — лай бірте-бірте жоғалады.', why: 'Қатты заттардың көпшілігінің ерігіштігі температура артқанда өседі, бірақ Ca(OH)₂ мен CaSO₄-тікі — төмендейді.' }
      : null,
    electrolysis: electrolysisVariant('kk')
  },
  en: {
    thermalDecomp: (p, h) => {
      switch (p.nitrate) {
        case 'ammonium': return { title: 'Ammonium nitrate breaks down', say: `Molten ammonium nitrate breaks down into dinitrogen oxide ${h.F('N2O')} ("laughing gas") and steam. A glowing splint relights in this gas as it does in oxygen.`, why: 'NH₄NO₃ → N₂O + 2H₂O. Strongly heating a lot of ammonium nitrate is dangerous, as it can explode, so only a few grains are heated.' };
        case 'active': return { title: 'The nitrate gives off oxygen', say: `${h.cap(h.N(p.solid))} melts on strong heating and gives off oxygen ${h.F('O2')}, leaving a nitrite. A glowing splint over the tube relights.`, why: 'Nitrates of active metals (left of magnesium) break down to a nitrite and oxygen; those of metals from magnesium to copper to the metal oxide, NO₂ and O₂; those of metals right of copper to the metal itself, NO₂ and O₂.' };
        case 'middle': return { title: 'A brown gas is given off', say: `${h.cap(h.N(p.solid))} breaks down on strong heating: toxic brown ${h.F('NO2')} and oxygen are given off, and the metal oxide is left.`, why: 'Nitrates of metals from magnesium to copper break down to the metal oxide, NO₂ and O₂; those of active metals to a nitrite and oxygen; those of metals right of copper to the metal itself. Fume hood only.' };
        case 'noble': return { title: 'Silver is left and a brown gas comes off', say: `Silver nitrate breaks down on strong heating: metallic silver ${h.F('Ag')} is left, and brown ${h.F('NO2')} and oxygen are given off.`, why: 'Nitrates of metals right of copper in the activity series break down to the metal, NO₂ and O₂. Fume hood only.' };
        default: return null;
      }
    },
    crystallize: (p) => p.cause === 'heat'
      ? { title: 'Limewater turns cloudy on heating', say: 'Calcium hydroxide is a rare exception: it dissolves less in hot water than in cold. So clear limewater turns cloudy when heated. Let it cool and the cloudiness slowly goes.', why: 'Most solids dissolve better as the temperature rises, but Ca(OH)₂ and CaSO₄ dissolve worse.' }
      : null,
    electrolysis: electrolysisVariant('en')
  }
};

/** Apply the variants above on top of the basic event texts. */
export function extraPatch(events: EventTexts, lang: Lang) {
  const vs = VARIANTS[lang];
  for (const k of Object.keys(vs) as (keyof EventTexts)[]) {
    const base = events[k];
    const variant = vs[k]!;
    events[k] = (p, h, e) => variant(p, h) ?? base(p, h, e);
  }
}

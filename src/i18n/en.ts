import type { EventText, H, Strings } from './types';
import { apparatusEvents } from './apparatusTexts';
import { moreEvents } from './moreTexts';
import { AMPHOTERIC, chemEvents } from './chemTexts';
import { auditEvents } from './auditTexts';
import { extraEvents } from './extraTexts';
import { ELEMENTS } from '../data/elements';

/** 'A' or 'An' before a colour name. */
const an = (word: string) => (/^[aeiou]/i.test(word) ? 'An' : 'A');

const JOINT_ION: Record<string, string> = { '(CuOH)2CO3': 'copper(II)', 'Fe(OH)3': 'iron(III)', 'Al(OH)3': 'aluminium', 'Cr(OH)3': 'chromium(III)' };

// A piece of an alkali metal: its size, and what happens when it is too big for the vessel.
function piece(p: Record<string, string>, h: H, t: EventText): EventText {
  const size = p.mm && p.mm !== '0' ? ` A ${h.num(Number(p.g))} g piece is a cube of about ${p.mm} mm.` : '';
  const violent = p.violent ? ' That is too much metal for this vessel: the water boils and throws hot alkali out, so part of the solution splashed away.' : '';
  return { ...t, title: p.violent ? `${h.cap(h.metal(p.metal))} reacts far too violently` : t.title, say: t.say + violent + size };
}

export const en: Strings = {
  langName: 'English',
  tagline: 'Chemistry sandbox lab',
  splashHint: 'Tap to start',
  grade: 'Grade',
  gradeNotes: {
    7: 'Explained in words, no equations',
    8: 'Reaction equations added',
    9: 'Ionic equations added',
    10: 'Organic chemistry comes later — for now explanations are as in grade 9',
    11: 'Charts and calculations come later — for now explanations are as in grade 9'
  },
  tables: 'Tables',
  journal: 'Log',
  undo: 'Undo',
  clearAll: 'Clear bench',
  theme: { bright: 'Bright', brand: 'CC Lab', label: 'Theme' },
  language: 'Language',
  reagents: 'Reagents',
  search: 'Find a reagent…',
  nothingFound: 'Nothing found',
  cats: { all: 'All', acid: 'Acids', base: 'Bases', salt: 'Salts', oxide: 'Oxides', metal: 'Metals', nonmetal: 'Nonmetals', ind: 'Indicators', other: 'Other' },
  dose: 'Portion',
  doseLiquid: ['a drop', '1 mL', '5 mL'],
  doseSolid: ['a grain', 'a piece', 'a lot'],
  doseDrops: ['1 drop', '2 drops', '5 drops'],
  hint: 'Drag a bottle onto a vessel, or just click it — the reagent goes into the selected vessel.',
  hintTouch: 'Pick a vessel, then tap a reagent on the shelf.',
  tube: 'Tube',
  beaker: 'Beaker',
  lamp: 'Spirit lamp',
  heat: 'Heat',
  stopHeat: 'Remove the lamp',
  wash: 'Wash',
  pourInto: 'Pour into',
  pourHint: 'You can also drag one vessel onto another',
  addTo: 'Add to',
  toasts: {
    full: 'The vessel is full — pick another one or wash this one',
    emptyPour: 'The vessel is empty, nothing to pour',
    washed: 'Vessel washed',
    cleared: 'Bench cleared. Undo brings everything back',
    nothingToUndo: 'Nothing to undo',
    added: 'Added',
    poured: 'Poured',
    discovery: 'New discovery!'
  },
  panel: {
    title: 'What happened',
    inside: 'In the vessel',
    empty: 'The vessel is empty',
    emptyText: 'Click a reagent on the shelf or drag a bottle here.',
    ideas: 'Ideas for a first experiment',
    signs: 'Signs of reaction',
    equation: 'Equation',
    fullIonic: 'Full ionic equation',
    netIonic: 'Net ionic equation',
    noReaction: 'no reaction',
    why: 'Why?',
    showIons: 'Show particles',
    inSolution: 'In solution',
    solids: 'Precipitate and solids',
    gasesOut: 'Gas given off',
    ph: 'pH about',
    medium: { acid: 'acidic', neutral: 'neutral', alkaline: 'alkaline' },
    temperature: 'Temperature',
    type: 'Type',
    safety: 'Lab safety',
    also: 'Also happened',
    concAcid: 'concentrated',
    indicatorDrops: 'drops',
    solution: 'solution',
    gradeHint7: 'Pick grade 8 to see reaction equations.'
  },
  signs: { precip: 'Precipitate', gas: 'Gas', color: 'Colour', heat: 'Heat', dissolve: 'Dissolving', smell: 'Smell', deposit: 'Coating', light: 'Light' },
  types: {
    exchange: 'exchange reaction',
    substitution: 'displacement reaction',
    combination: 'combination reaction',
    decomposition: 'decomposition reaction',
    neutralization: 'neutralisation',
    redox: 'redox reaction',
    complex: 'complex formation',
    physical: 'physical change'
  },
  safety: {
    acidWater: { title: 'Water first, then acid', text: 'Concentrated acid is poured into water in a thin stream while stirring. If you pour water into the acid, the water boils and sprays acid around.' },
    bigSodium: { title: 'Too big a piece of an alkali metal', text: 'Sodium is used in pieces no bigger than a pea (0.1–0.2 g), potassium even smaller, the size of a rice grain; they are dropped into a wide dish of water behind a safety screen. A piece of about a gram in a test tube explodes and shatters the glass.' },
    alkaliSplash: { title: 'Hot alkali splashes', text: 'Alkali metals are never dropped into a test tube: there is little water, it boils and throws the alkali out. The experiment is done in a wide dish with plenty of water, with a piece no bigger than a pea (0.1–0.2 g), behind a screen.' },
    sodiumWater: { title: 'Careful: sodium', text: 'Sodium is kept under kerosene and handled with tweezers. The teacher shows this experiment behind a safety screen.' },
    fumeHood: { title: 'Use the fume hood', text: 'Toxic or corrosive gases are given off. In a real lab this experiment is done in a fume hood.' },
    ammoniaSmell: { title: 'How to smell a substance', text: 'Never hold the tube under your nose. Waft the vapour towards you with your hand.' },
    hotTube: { title: 'Hot', text: 'Hold a heated tube with a holder and point its mouth away from yourself and others.' },
    alkaliFire: { title: 'Careful: potassium', text: 'Potassium reacts with water even more violently than sodium: the hydrogen catches fire and drops of alkali fly. Only the teacher shows this, with a tiny piece, behind a screen.' },
    toxic: { title: 'Toxic substances', text: 'Chromium(VI), lead, nickel and cobalt compounds and soluble barium compounds are toxic. Wear gloves, work in a fume hood and pour leftovers into a waste jar, not down the sink.' },
    hotGlass: { title: 'Hot glass', text: 'Very hot glass looks just like cold glass. Do not touch the tube until it has cooled, and never put it into cold water — it will crack.' }
  },
  conc: 'conc.',
  dil: 'dil.',
  heated: 'heated',
  tablesModal: {
    title: 'Tables',
    periodic: 'Periodic table',
    solubility: 'Solubility',
    activity: 'Activity series',
    indicators: 'Indicators',
    close: 'Close',
    sol: { R: 'S', M: 'SS', N: 'I', D: '—' },
    solLegend: { R: 'soluble', M: 'slightly soluble', N: 'insoluble', D: 'does not exist or is decomposed by water' },
    activityNote: 'Metals to the left of hydrogen displace hydrogen from acid solutions (nitric acid and concentrated sulfuric acid never give hydrogen). A more active metal displaces a less active one from solutions of its salts (not the alkali and alkaline earth metals: they react with the water instead).',
    indicatorRows: { acid: 'acidic', neutral: 'neutral', alkaline: 'alkaline' },
    indicatorNote: 'School tables often show methyl orange as orange in neutral solution, but strictly it is already yellow above pH 4.4.',
    massLabel: 'atomic mass',
    categories: {
      alkali: 'alkali metals', alkaline: 'alkaline earth metals', transition: 'transition metals', post: 'other metals',
      metalloid: 'metalloids', nonmetal: 'nonmetals', halogen: 'halogens', noble: 'noble gases', lanthanide: 'lanthanides', actinide: 'actinides'
    }
  },
  journalModal: { title: 'Experiment log', empty: 'Your experiments will appear here.', clear: 'Clear log', vessel: 'Vessel' },
  discoveries: (n) => `Reactions discovered: ${n}`,
  colors: {
    white: 'white', curdy: 'white curdy', gel: 'white gelatinous', clearGel: 'colourless gelatinous', lightBlue: 'light-blue',
    greyGreen: 'grey-green', brown: 'rust-brown', yellow: 'yellow', paleYellow: 'pale yellow', black: 'black', darkBrown: 'dark brown',
    blueGreen: 'blue-green', redBrown: 'red-brown', copper: 'copper-red', silver: 'grey', greyMetal: 'grey'
  },
  indColors: {
    colorless: 'colourless', crimson: 'crimson', red: 'red', pink: 'pink', orange: 'orange', yellow: 'yellow',
    green: 'green', blue: 'blue', violet: 'violet', paleViolet: 'pale violet'
  },
  indicators: { phph: 'phenolphthalein', litmus: 'litmus', mo: 'methyl orange', univ: 'universal indicator' },
  indicatorWhy: {
    phph: 'Phenolphthalein is colourless in acidic and neutral solutions and crimson in alkaline ones.',
    litmus: 'Litmus is red in acid, violet in neutral solution and blue in alkali.',
    mo: 'Methyl orange is red-pink below pH 3.1, orange at pH 3.1–4.4 and yellow above pH 4.4, so it is yellow in both neutral and alkaline solutions and cannot tell them apart. School tables often show it as orange for neutral solution, but strictly it is yellow above pH 4.4.',
    univ: 'Universal indicator follows the pH scale: from red in strong acid to violet in strong alkali.'
  },
  ideaList: [
    { label: 'Light-blue precipitate', steps: ['CuSO4', 'NaOH'] },
    { label: 'Zinc in acid', steps: ['HCl', 'Zn'] },
    { label: 'Crimson alkali', steps: ['NaOH', 'phph'] },
    { label: 'Blood-red', steps: ['FeCl3', 'KSCN'] },
    { label: 'Golden precipitate', steps: ['PbNO32', 'KI'] },
    { label: 'Halogens push each other out', steps: ['KBr', 'Cl2aq'] },
    { label: 'Iodine and starch', steps: ['starch', 'KI', 'Cl2aq'] },
    { label: 'Yellow turns orange', steps: ['K2CrO4', 'H2SO4'] },
    { label: 'Cloudy — speed up time', steps: ['Na2S2O3', 'HCl'] },
    { label: 'Cold pack', steps: ['H2O', 'NH4NO3s'] }
  ],
  elements: ELEMENTS.map((e) => e.en),
  events: {
    ...apparatusEvents('en'),
    ...moreEvents('en'),
    ...chemEvents('en'),
    ...auditEvents('en'),
    ...extraEvents('en'),
    precip: (p, h) => ({
      title: `${an(h.color(p.color))} ${h.color(p.color)} precipitate formed`,
      say: `${h.cap(h.NF(p.product))} formed. ` + (p.sol === 'M'
        ? 'It dissolves only slightly in water, so the excess settles out — a sign of a chemical reaction.'
        : 'It does not dissolve in water and settles out as a precipitate — a sign of a chemical reaction.') +
        (p.base === 'NH3' ? ' Ammonia solution is a weak base: it supplies hydroxide ions, so the metal hydroxide settles out.' : '') +
        (p.special === 'ag2o' ? ' Silver hydroxide is unstable and at once breaks down into silver oxide and water.' : ''),
      why7: 'Some substances do not dissolve in water. When such a substance forms as solutions are mixed, the liquid turns cloudy and a precipitate settles to the bottom.',
      why: `The solubility table lists ${h.F(p.product)} as ${p.sol === 'M' ? 'slightly soluble (SS)' : 'insoluble (I)'}. An exchange reaction goes to completion when a precipitate, a gas or water forms.` +
        (p.product === 'Fe(OH)2' ? ' In air this precipitate slowly turns brown: Fe(OH)₂ is oxidised to Fe(OH)₃.' : '')
    }),
    saturated: (p, h) => ({
      title: 'The solution turned cloudy',
      say: `${h.cap(h.N(p.product))} dissolves poorly in water. The part that did not dissolve makes the solution cloudy.`,
      why: `${h.F(p.product)} is slightly soluble (SS): only a little of it dissolves in water.`
    }),
    silicicGel: (_p, h) => ({
      title: 'A gelatinous precipitate formed',
      say: `The acid displaced silicic acid ${h.F('H2SiO3')} from the silicate. It does not dissolve in water and forms a clear jelly.`,
      why: 'Silicic acid is weak and insoluble. A stronger acid displaces it from its salt.'
    }),
    jointHydrolysis: (p, h) => ({
      title: `${an(h.color(p.color))} ${h.color(p.color)} precipitate forms and gas is given off`,
      say: `${JOINT_ION[p.product] ? `The ${JOINT_ION[p.product]} carbonate` : 'This carbonate'} cannot exist in water: instead ${h.NF(p.product)} settles out and carbon dioxide is given off.`,
      why: 'The solubility table shows a dash for this salt: water decomposes it. Both salts are hydrolysed together.'
    }),
    fe3scn: (_p, h) => ({
      title: 'The solution turned blood-red',
      say: `Iron(III) ions met thiocyanate ions and formed ${h.NF('Fe(SCN)3')}, which colours the solution blood-red.`,
      why: `This is the test for ${h.F('Fe^3+')} ions: even a tiny amount of iron(III) gives a strong colour.`
    }),
    ammine: (p, h) => ({
      title: p.solid === 'Cu(OH)2' ? 'The precipitate dissolved, the solution turned deep blue' : 'The precipitate dissolved in ammonia',
      say: p.solid === 'Cu(OH)2'
        ? `In excess ammonia copper(II) hydroxide dissolves, forming the deep-blue complex ${h.F(p.complex)}.`
        : `${h.cap(h.N(p.solid))} dissolves in ammonia solution, forming the soluble complex ${h.F(p.complex)}.` +
          (p.solid === 'AgCl' || p.solid === 'Ag2O' ? ' Never keep ammoniacal silver solution: on standing it forms an explosive compound. Acidify leftovers at once and pour them into the waste jar.' : ''),
      why: p.solid === 'AgCl'
        ? 'Ammonia molecules attach to silver ions and keep them in solution. Add nitric acid and the complex breaks down, so AgCl settles out again.'
        : p.solid === 'Ni(OH)2'
          ? 'Six ammonia molecules attach to each nickel ion, forming a soluble violet-blue complex.'
          : p.solid === 'Cu(OH)2'
            ? 'Ammonia molecules bind firmly to the copper ion and form a soluble complex ion. The deep-blue solution is the test for copper(II) ions.'
            : 'Ammonia molecules bind firmly to the metal ion and form a soluble, colourless complex ion, so the precipitate disappears.'
    }),
    complexAcid: (p, h) => (p.product.includes('(OH)')
      ? {
          title: 'The precipitate came back',
          say: `The acid neutralised the alkali, and ${h.NF(p.product)} settled out again. In excess acid it will dissolve.`,
          why: 'An amphoteric hydroxide dissolves in both alkali and acid. So when acid is added to its alkaline solution, the precipitate first appears and then disappears.'
        }
      : {
          title: p.product === 'Cu^2+' ? 'The deep-blue colour disappeared' : 'The complex broke down',
          say: `The acid turned ammonia into ammonium ions ${h.F('NH4^+')}, and the complex broke down.`,
          why: 'Ammonia is a base. The acid binds it, so it can no longer hold on to the metal ion.'
        }),
    neutralization: (p, h, e) => ({
      title: p.indTo ? `Neutralisation: the indicator is ${h.indColor(p.indTo)}` : 'Neutralisation took place',
      say: `${h.cap(h.N(p.acid))} and ${h.N(p.base)} neutralise each other, forming the salt ${h.NF(p.salt)} and water.` +
        ((e.dT ?? 0) > 2 ? ` The solution warmed up by ${h.num(e.dT!)} °C.` : p.indTo ? '' : ' Nothing is visible — an indicator helps.') +
        (p.indTo ? ` Indicator colour (${h.ind(p.ind)}): ${h.indColor(p.indFrom)} → ${h.indColor(p.indTo)}.` : ''),
      why7: 'An acid and an alkali cancel each other out, giving a salt and water. An indicator shows what the solution is like.',
      why: p.base === 'NH3·H2O'
        ? `Ammonia molecules take ${h.F('H^+')} ions from the acid and become ammonium ions ${h.F('NH4^+')}. To see neutralisation, add an indicator.`
        : `Hydrogen ions ${h.F('H^+')} from the acid and hydroxide ions ${h.F('OH^-')} from the base join into water molecules. To see neutralisation, add an indicator such as phenolphthalein.`
    }),
    weakAcidOut: (p, h) => (p.weak === 'CH3COOH'
      ? { title: 'It smells of vinegar', say: `The strong acid displaced the weaker acetic acid ${h.F('CH3COOH')} from its salt — it has a typical smell.`, why: 'A stronger acid displaces a weaker one from its salts.' }
      : { title: 'No visible signs', say: 'The strong acid displaced the weaker phosphoric acid from its salt. Nothing changed on the outside, but the reaction did happen.', why: 'A stronger acid displaces a weaker one from its salts.' }),
    bicarbonateFirst: (_p, h, e) => ({
      title: 'No bubbles yet',
      say: `There is too little acid: the carbonate first turns into the hydrogen carbonate ${h.F(e.eq?.products[0] || 'NaHCO3')}. Add more acid and carbon dioxide will come off.`,
      why: `The carbonate ion takes hydrogen ions one at a time: ${h.F('CO3^2-')} → ${h.F('HCO3^-')} → ${h.F('CO2')} and water. Gas appears only at the second step.`
    }),
    gasCO2: (p, h) => ({
      title: 'Carbon dioxide is given off',
      say: `${h.cap(h.N(p.carbonate))} reacts with the acid — the solution fizzes with bubbles of ${h.F('CO2')}. Bubble it through limewater and it turns cloudy — that is the test for carbon dioxide (a burning splint also goes out in it).`,
      why7: 'Gas bubbles are a sign of a chemical reaction: a new substance, carbon dioxide, has formed.',
      why: `Carbonic acid ${h.F('H2CO3')} forms: it is unstable and at once breaks down into water and carbon dioxide. This is the test for the carbonate ion.`
    }),
    ammonia: (p, h) => ({
      title: 'A smell of ammonia',
      say: `The alkali displaced ammonia from the ammonium salt ${h.F(p.salt)}. Heat it and ammonia comes off as a gas.`,
      why: `This is the test for the ammonium ion ${h.F('NH4^+')}: heated with an alkali it gives off ammonia, which turns damp litmus paper blue.`
    }),
    ammoniaGas: () => ({
      title: 'Ammonia is given off',
      say: 'On heating, ammonia escapes from the solution. It has a sharp smell.',
      why: 'Gases dissolve less in hot water, so ammonia leaves the solution.'
    }),
    dissolveAcid: (p, h, e) => {
      const name = h.cap(h.N(p.solid));
      const stays = !!p.salt && !!e.eq?.precip?.includes(p.salt);
      const staysSay = stays ? ' But this salt is also poorly soluble and stays as a precipitate.' : '';
      if (p.solidKind === 'carbonate') return {
        title: stays ? 'One precipitate turned into another' : `${name} dissolves with bubbles`,
        say: stays
          ? `${name} reacts with the acid: carbon dioxide ${h.F('CO2')} is given off. The salt ${h.NF(p.salt)} that forms is also poorly soluble and stays as a precipitate.`
          : `${name} reacts with the acid: carbon dioxide ${h.F('CO2')} is given off and the solid disappears.`,
        why: 'Acids break down carbonates: carbonic acid forms and splits into carbon dioxide and water.'
      };
      if (p.solidKind === 'phosphate') return { title: 'The precipitate dissolved', say: `${name} dissolves in a strong acid.`, why: 'Insoluble phosphates dissolve in strong acids.' };
      if (p.solidKind === 'sulfide') return {
        title: 'The precipitate dissolved with a rotten-egg smell',
        say: `${name} dissolves in the acid: the salt ${h.NF(p.salt)} forms and hydrogen sulfide ${h.F('H2S')} is given off.`,
        why: 'Iron, zinc and manganese sulfides dissolve in strong acids. Copper, lead and silver sulfides are so insoluble that hydrochloric and dilute sulfuric acid cannot dissolve them (only oxidising nitric acid can).'
      };
      if (p.solidKind === 'sulfite') return {
        title: 'The precipitate dissolved with a sharp smell',
        say: `${name} dissolves in the acid: sulfur dioxide ${h.F('SO2')} is given off.`,
        why: 'Sulfurous acid is weak and unstable: a stronger acid pushes it out of the salt and it falls apart into sulfur dioxide and water.'
      };
      const oxide = p.solidKind === 'oxide';
      const amph = AMPHOTERIC.includes(p.solid);
      const noun = amph ? (oxide ? 'amphoteric oxide' : 'amphoteric hydroxide')
        : p.solid === 'Ca(OH)2' ? 'slightly soluble base (an alkali)'
        : p.solid === 'Fe2O3' ? 'oxide'
        : p.solid === 'Fe(OH)3' ? 'hydroxide'
        : oxide ? 'basic oxide' : 'insoluble base';
      return {
        title: stays ? 'One precipitate turned into another' : oxide ? `${name} dissolved` : 'The precipitate dissolved',
        say: `The ${noun} ${h.F(p.solid)} reacts with the acid${amph ? ' as a base' : ''}, giving the salt ${h.NF(p.salt)} and water.` + staysSay +
          (!stays && p.salt.startsWith('Cu') ? ' The solution turned blue because of copper(II) ions.' : ''),
        why: 'Basic and amphoteric oxides and hydroxides react with acids to form a salt and water.' +
          (p.solid === 'CuO' ? ' In the cold copper(II) oxide dissolves very slowly, so the mixture is heated.' : '')
      };
    },
    amphoteric: (p, h) => ({
      title: 'The precipitate dissolved in excess alkali',
      say: `${h.cap(h.N(p.solid))} ${h.F(p.solid)} dissolves in the alkali, forming ${h.NF(p.product)}.`,
      why: p.solid === 'H2SiO3'
        ? 'Silicic acid is neutralised by the alkali and turns into a soluble silicate.'
        : `${h.F(p.solid)} is amphoteric: it reacts with both acids and alkalis. That is why a precipitate forms first and then dissolves in excess alkali.`
    }),
    metalAlkali: (p, h) => (p.metal === 'Si'
      ? {
          title: 'Silicon dissolves in the alkali',
          say: `Silicon is a nonmetal, yet it dissolves in alkali solution: the silicate ${h.NF('Na2SiO3')} forms and hydrogen ${h.F('H2')} is given off.`,
          why7: 'Silicon does not react with ordinary acids (except hydrofluoric), but it does react with alkalis — and hydrogen comes off.',
          why: 'Silicon gives away electrons and is oxidised to silicate, while water is reduced to hydrogen. This was once a field method for filling balloons with hydrogen.'
        }
      : {
          title: `${h.cap(h.metal(p.metal))} dissolves in the alkali`,
          say: `${h.cap(h.metal(p.metal))} forms an amphoteric oxide and hydroxide, so it also dissolves in alkali, giving off hydrogen ${h.F('H2')}.`,
          why: 'Zinc and aluminium react with both acids and alkalis because their oxide film and hydroxide are amphoteric.'
        }),
    metalAcid: (p, h, e) => ({
      title: 'Hydrogen is given off',
      say: (p.slow
        ? `${h.cap(h.metal(p.metal))} reacts with the acid slowly: hydrogen bubbles ${h.F('H2')} appear one at a time. Speed up time and the metal will gradually dissolve.`
        : `${h.cap(h.metal(p.metal))} reacts with the acid: hydrogen bubbles ${h.F('H2')} appear on the metal. Bring a burning splint close — hydrogen burns with a pop.`) +
        (p.slow && p.metal === 'Al' ? ' Aluminium is covered with a tough oxide film, and dilute sulfuric acid breaks it down very slowly.' : '') +
        ((e.dT ?? 0) > 5 ? ' The tube got noticeably warm.' : ''),
      why7: `${h.cap(h.metal(p.metal))} is to the left of hydrogen in the activity series. Such metals react with acids and give off hydrogen.`,
      why: `In the activity series ${h.metal(p.metal)} stands to the left of hydrogen, so it displaces hydrogen from the acid. Metals to the right of hydrogen cannot do this.`
    }),
    activeMetalWater: (p, h) => piece(p, h, p.metal === 'K'
      ? {
          title: 'Potassium bursts into flame on water',
          say: `Potassium is lighter than water and reacts so violently that the hydrogen catches fire at once with a lilac flame. The piece darts about and often pops. The alkali ${h.F('KOH')} forms in the solution.`,
          why7: 'Potassium is one of the most active metals. It reacts with water even more strongly than sodium.',
          why: 'In the alkali metal group activity grows down the group: lithium reacts calmly, sodium vigorously, potassium bursts into flame. The lilac colour of the flame comes from potassium.'
        }
      : p.metal === 'Li'
      ? {
          title: 'Lithium fizzes on water',
          say: `Lithium is the lightest metal: it floats on water and fizzes calmly, giving off hydrogen. It does not melt or catch fire. The alkali ${h.F('LiOH')} forms in the solution.`,
          why: 'Lithium is near the start of the activity series, yet it reacts with water more calmly than sodium and potassium: activity grows down the alkali metal group.'
        }
      : p.metal === 'Ba'
      ? {
          title: 'Barium reacts vigorously with water',
          say: `Barium is heavier than water and sinks, but gives off hydrogen fast. The solution stays clear: barium hydroxide ${h.F('Ba(OH)2')} dissolves well — it is an alkali.`,
          why: 'Barium is the most active of the alkaline earth metals on the shelf: more active than calcium and magnesium.'
        }
      : p.metal === 'Na'
      ? {
          title: 'Sodium skates on the water',
          say: `Sodium is lighter than water: it melts into a shiny ball and darts across the surface, giving off hydrogen. The alkali ${h.F('NaOH')} forms in the solution.`,
          why: 'Sodium is near the start of the activity series and displaces hydrogen even from water. Test the alkali with phenolphthalein.'
        }
      : {
          title: 'Calcium reacts with water',
          say: 'Calcium reacts with water more calmly than sodium: hydrogen is given off and the solution turns cloudy as slightly soluble calcium hydroxide forms.',
          why: 'Alkaline earth metals also displace hydrogen from water. An alkali forms — test it with phenolphthalein.'
        }),
    metalNitric: (p, h) => ({
      title: 'A gas comes off and turns brown at the mouth',
      say: `${h.cap(h.metal(p.metal))} dissolves in nitric acid. No hydrogen forms: the acid is reduced mainly to colourless nitrogen(II) oxide ${h.F('NO')} (with active metals also to ${h.F('N2O')}, ${h.F('N2')} and ammonium salts). At the mouth ${h.F('NO')} combines with oxygen from the air into brown, toxic, sharp-smelling ${h.F('NO2')}.`,
      why: 'Nitric acid is a strong oxidiser, so with metals it gives no hydrogen and reacts even with copper and silver.'
    }),
    metalSalt: (p, h) => ({
      title: `A coating of ${h.metal2(p.deposit)} appeared on the metal`,
      say: `${h.cap(h.metal(p.metal))} displaces ${h.metal(p.deposit)} from the ${h.F(p.salt)} solution. ${h.cap(h.metal(p.deposit))} settles on the surface, and ${h.metal(p.metal)} goes into solution.` +
        (p.ion === 'Cu^2+' ? ' The blue colour of the solution fades.' : ''),
      why7: `${h.cap(h.metal(p.metal))} is more active than ${h.metal(p.deposit)}, so it takes its place in the salt.`,
      why: `In the activity series ${h.metal(p.metal)} stands to the left of ${h.metal(p.deposit)}. A more active metal displaces a less active one from a solution of its salt.`
    }),
    oxideWater: (_p, h) => ({
      title: 'Quicklime is slaked by water',
      say: `Calcium oxide reacts vigorously with water and the mixture gets very hot. Slaked lime forms — calcium hydroxide ${h.F('Ca(OH)2')}.`,
      why: 'Oxides of active metals react with water to form alkalis.'
    }),
    h2o2: (p, h) => ({
      title: p.catalyst ? 'Oxygen is given off vigorously' : 'Oxygen is given off',
      say: p.catalyst
        ? `Manganese(IV) oxide speeds up the breakdown of hydrogen peroxide into water and oxygen ${h.F('O2')}. A glowing splint relights in oxygen.`
        : `On heating, hydrogen peroxide breaks down into water and oxygen ${h.F('O2')}.`,
      why: p.catalyst
        ? `${h.F('MnO2')} is a catalyst: it speeds up the reaction but is not used up. This is how oxygen is made in a school lab.`
        : 'Heating makes the breakdown faster.'
    }),
    dissolve: (p, h) => ({
      title: 'The substance dissolved',
      say: `${h.cap(h.N(p.solid))} dissolves in water. No new substances form.`,
      why7: 'The substance stays the same: its particles spread evenly between water molecules.',
      why: 'The substance does not change, but its particles become surrounded by water molecules (hydrated), so dissolving is called a physico-chemical process.'
    }),
    dilutionSafe: () => ({
      title: 'The solution got very hot',
      say: 'Concentrated sulfuric acid mixes with water and releases a lot of heat. You did it right: acid goes into water.',
      why: 'Sulfuric acid binds water strongly and releases heat. That is why it is diluted slowly while stirring.'
    }),
    dilutionUnsafe: () => ({
      title: 'Splash! The water boiled on the acid',
      say: 'Water is lighter than the acid and stays on top. The heat makes it boil instantly and spray acid around.',
      why: 'The rule: water first, then acid. Pour the acid into the water, never the other way round.'
    }),
    sugarChar: () => ({
      title: 'The sugar charred',
      say: 'Concentrated sulfuric acid pulls water out of sugar. Carbon is left: a black porous mass rises out of the vessel, and steam, carbon dioxide and sulfur dioxide SO₂ with the sharp smell of a struck match come off.',
      why: 'Concentrated sulfuric acid strongly removes water from other substances. This experiment is done only in a fume hood.'
    }),
    cuConcAcid: (p, h) => ({
      title: `${h.cap(h.metal(p.metal))} dissolves in hot sulfuric acid`,
      say: `When heated, concentrated sulfuric acid oxidises the metal. Sulfur dioxide ${h.F('SO2')} with a sharp smell is given off.`,
      why: 'Concentrated sulfuric acid is an oxidiser: it reacts even with metals after hydrogen, but no hydrogen is given off.'
    }),
    hydroxideDecomp: (_p, h) => ({
      title: 'The precipitate turned black',
      say: `On heating, light-blue copper(II) hydroxide breaks down into black copper(II) oxide ${h.F('CuO')} and water.`,
      why: 'Insoluble bases break down into an oxide and water when heated.'
    }),
    sugarHeat: () => ({
      title: 'The sugar melts and turns black',
      say: 'Strong heating breaks sugar down: drops of water appear on the walls and carbon is left behind.',
      why: 'A change of colour and water given off are signs of a chemical reaction.'
    }),
    boiling: (p) => ({
      title: 'The liquid is boiling',
      say: Number(p.bp) > 100.4
        ? `The solution boils at ${p.bp} °C — higher than pure water: dissolved substances raise the boiling point. The water boils away and the solution becomes more concentrated.`
        : 'The water reached 100 °C and is boiling: bubbles of steam form inside the liquid. This is a physical change.',
      why: 'When water boils it turns into steam, but it stays the same substance.'
    }),
    minor: () => ({ title: '', say: '' }),
    added: (p, h) => ({
      title: `${h.cap(h.reagent(p.reagent))} is in the vessel`,
      say: 'Now add a second substance and see what happens.'
    }),
    diluted: () => ({ title: 'The solution is diluted', say: 'Water lowered the concentration. No new substances formed.' }),
    indicator: (p, h) => ({
      title: `Indicator: ${h.indColor(p.to)}`,
      say: `The solution is ${en.panel.medium[p.medium as 'acid'] || ''}. In it ${h.ind(p.ind)} is ${h.indColor(p.to)}.`,
      why: en.indicatorWhy[p.ind as 'phph']
    }),
    exchangeNone: (p, h) => ({
      title: 'No signs of reaction',
      say: 'The solutions mixed, but no precipitate, gas or water formed — all the ions stayed in solution.' +
        (p.a ? ` The possible products, such as ${h.F(p.a)}${p.b ? ` and ${h.F(p.b)}` : ''}, are soluble.` : ''),
      why: 'An ion exchange reaction goes to completion only if a precipitate, a gas or water forms. Check the solubility table.'
    }),
    metalAcidNone: (p, h) => ({
      title: `${h.cap(h.metal(p.metal))} does not react with the acid`,
      say: p.noble
        ? `${h.cap(h.metal(p.metal))} does not dissolve in hydrochloric, sulfuric or even nitric acid. Only aqua regia, a mixture of nitric and hydrochloric acids, dissolves it.`
        : 'No bubbles, the metal is unchanged. Try zinc, magnesium or iron.',
      why7: `${h.cap(h.metal(p.metal))} is a low-activity metal and does not react with this acid.`,
      why: `In the activity series ${h.metal(p.metal)} stands to the right of hydrogen. Such metals do not displace hydrogen from acid solutions.`
    }),
    metalSaltNone: (p, h) => ({
      title: 'No reaction',
      say: `${h.cap(h.metal(p.metal))} does not displace ${h.ionMetal(p.ion)} from the ${h.F(p.salt)} solution.`,
      why: `${h.cap(h.metal(p.metal))} is less active than ${h.ionMetal(p.ion)}: it stands further right in the activity series. A less active metal cannot displace a more active one.`
    }),
    metalWaterNone: (p, h) => ({
      title: `${h.cap(h.metal(p.metal))} does not react with water`,
      say: 'At room temperature only the alkali and alkaline earth metals (lithium, sodium, potassium, calcium, barium) react with water. Magnesium reacts only with hot water.',
      why: 'The further left a metal is in the activity series, the more easily it reacts with water.'
    }),
    aluminumFilm: () => ({
      title: 'Aluminium barely reacts',
      say: 'Aluminium is covered with a tough oxide film, so in copper(II) sulfate solution almost nothing happens.',
      why: 'Try copper(II) chloride CuCl₂: chloride ions break the oxide film and aluminium starts displacing copper.'
    }),
    passivation: (p, h) => ({
      title: `${h.cap(h.metal(p.metal))} does not dissolve`,
      say: 'Cold concentrated sulfuric acid covers this metal with a tough film and the reaction stops.',
      why: 'This is called passivation. It is why concentrated sulfuric acid is transported in steel tanks.'
    }),
    needsHeat: (p, h) => (p.what === 'calcination'
      ? { title: 'The spirit lamp is not enough', say: 'Marble and limestone break down into quicklime and carbon dioxide only at about 900 °C. A spirit lamp heats the tube far less, so nothing happens.', why: 'Lime is made by roasting limestone in big kilns. Different substances break down at very different temperatures.' }
      : p.what === 'cuConc'
      ? { title: 'Needs heating', say: 'Cold copper does not react with concentrated sulfuric acid. Heat the vessel with the spirit lamp.', why: 'Many reactions go only when heated.' }
      : { title: 'Needs heating', say: `${h.cap(h.N(p.solid))} dissolves in acid very slowly. Heat the vessel and the reaction will go.`, why: 'Reactions go faster when heated.' }),
    insolubleSolid: (p, h) => ({
      title: `${h.cap(h.N(p.solid))} does not dissolve in water`,
      say: 'The substance lies at the bottom and the solution is unchanged.' + (['MnO2', 'SiO2', 'C', 'Si'].includes(p.solid) ? '' : ' Try adding an acid.'),
      why: 'Not every substance dissolves in water. Basic oxides and carbonates react with acids, but sand (SiO₂) does not react even with them (except hydrofluoric acid).'
    }),
    notModeled: (p) => ({
      title: 'CC Hexa does not show this reaction yet',
      say: {
        iodide: 'A redox reaction happens here: iodine is released and the solution turns brown.',
        permanganate: 'Without acid permanganate is reduced not to colourless Mn²⁺ but to a brown MnO₂ precipitate (neutral solution) or green manganate (alkaline solution). Add sulfuric acid.',
        iron3metal: 'Iron(III) ions oxidise this metal. Such reactions are studied in grades 10–11.',
        concActive: 'Active metals reduce concentrated sulfuric acid to SO₂, S or H₂S.'
      }[p.topic] || '',
      why: 'We do not show a reaction until we can show it correctly. It will come in a later version.'
    }),
    nothing: () => ({ title: 'No visible changes', say: 'The substances did not react, or the reaction has no visible signs.' })
  }
};

import { describe, expect, it } from 'vitest';
import { REAGENTS, REAGENT_BY_ID } from '../engine/data';
import { addReagent, condense, pour, tick, type Amount } from '../engine/actions';
import { newVessel, type ReactionEvent, type Vessel } from '../engine/vessel';
import { Lab } from '../state/lab';
import { LANGS, STRINGS, makeH } from './index';
import { REAGENT_INFO } from './reagentInfo';
import { LIFE } from './lifeTexts';

type Step = string | [string, Amount];

function run(steps: Step[], v: Vessel = newVessel('t', 'tube')): ReactionEvent[] {
  const out: ReactionEvent[] = [];
  let now = 1000;
  for (const s of steps) {
    const [id, a] = typeof s === 'string' ? [s, {} as Amount] : s;
    const res = addReagent(v, REAGENT_BY_ID[id], { ml: a.ml ?? 1, g: a.g ?? 0.3, drops: a.drops ?? 2 }, (now += 1000));
    out.push(...res.events);
  }
  return out;
}

function heat(v: Vessel, seconds: number, on = true): ReactionEvent[] {
  v.heating = on;
  const out: ReactionEvent[] = [];
  let now = 500000;
  for (let i = 0; i < seconds * 2; i++) out.push(...tick(v, 0.5, (now += 500)));
  v.heating = false;
  return out;
}

/** Real events from the engine: every liquid with every reagent, heating, separation tools. */
function collect(): ReactionEvent[] {
  const all: ReactionEvent[] = [];
  const liquids = REAGENTS.filter((r) => r.kind === 'liquid' && !r.indicator).map((r) => r.id);
  for (const a of liquids) for (const r of REAGENTS) all.push(...run([a, r.id]));
  for (const r of REAGENTS) {
    const v = newVessel('w', 'beaker');
    all.push(...run([['H2O', { ml: 10 }], [r.id, { g: 1, ml: 2 }]], v));
    all.push(...heat(v, 400));
  }
  for (const r of REAGENTS.filter((x) => x.kind === 'solid')) {
    const v = newVessel('d', 'tube');
    all.push(...run([[r.id, { g: 0.5 }]], v));
    all.push(...heat(v, 200));
  }
  const pairs: Step[][] = [
    [['Fe', { g: 0.5 }], ['S', { g: 0.3 }]], [['CuO', { g: 0.5 }], ['C', { g: 0.1 }]],
    [['H2O', { ml: 3 }], 'NaOH', 'phph', ['C', { g: 1 }]], [['Na2S2O3', { ml: 2 }], ['HCl', { ml: 2 }]],
    [['HCl', { ml: 5 }], ['Ni', { g: 0.2 }]], [['H2O', { ml: 20 }], ['ice', { g: 10 }]],
    [['H2O', { ml: 10 }], ['KNO3s', { g: 10 }]], [['NaCl', { ml: 3 }]], [['H2O', { ml: 5 }], ['K', { g: 0.3 }]],
    ['FeSO4', 'H2SO4', ['KMnO4', { ml: 0.5 }]], ['H2O2', 'H2SO4', ['KMnO4', { ml: 0.5 }]], ['KI', 'H2SO4', ['KMnO4', { ml: 0.2 }]],
    ['FeSO4', 'H2SO4', ['K2Cr2O7', { ml: 0.2 }]], ['KI', 'H2SO4', ['K2Cr2O7', { ml: 0.2 }]]
  ];
  for (const steps of pairs) {
    const v = newVessel('p', 'beaker');
    all.push(...run(steps, v));
    all.push(...heat(v, 900));
    all.push(...heat(v, 1500, false));
  }
  const hard = newVessel('h', 'beaker');
  run([['H2O', { ml: 20 }]], hard);
  Object.assign(hard.aq, { 'Ca^2+': 0.2, 'HCO3^-': 0.4 });
  Object.assign(hard.parent, { 'Ca^2+': 'Ca(HCO3)2', 'HCO3^-': 'Ca(HCO3)2' });
  all.push(...heat(hard, 400));
  const gold = newVessel('g', 'beaker');
  all.push(...run([['PbNO32', { ml: 0.3 }], ['KI', { ml: 0.6 }], ['H2O', { ml: 60 }]], gold));
  gold.temp = 98; all.push(...run([['H2O', { ml: 0.01 }]], gold));
  for (let i = 0; i < 600; i++) all.push(...tick(gold, 1, 900000 + i * 1000));
  const a = newVessel('a', 'tube');
  const b = newVessel('b', 'tube');
  run([['CuSO4', { ml: 2 }], ['NaOH', { ml: 2 }]], a);
  all.push(...pour(a, b, 9000, true).events);
  all.push(...pour(newVessel('c', 'tube'), b, 9000, true).events);
  all.push(...condense(newVessel('e', 'tube'), 0.5, 1000));
  const lab = new Lab();
  lab.add('Fe', { g: 0.5 }, 't1'); lab.add('S', { g: 0.3 }, 't1');
  lab.magnet('t1'); lab.magnet('t1');
  all.push(...lab.journal.map((j) => j.event), ...lab.vessel('t1').lastEvents);
  for (const id of ['LiCl', 'NaCl', 'KCl', 'CaCl2', 'BaCl2', 'CuSO4', 'HCl']) {
    lab.add(id, { ml: 1 }, 't2');
    lab.flameTest('t2');
    all.push(...lab.vessel('t2').lastEvents);
  }
  lab.add('KCl', { ml: 1 }, 't3'); lab.add('NaCl', { ml: 1 }, 't3'); lab.flameTest('t3');
  all.push(...lab.vessel('t3').lastEvents);
  return all;
}

const events = collect();
const unique = [...new Map(events.map((e) => [`${e.kind}|${JSON.stringify(e.p)}`, e])).values()];

const BAD = /undefined|\bNaN\b|\[object|\bnull\b/;

describe('event texts', () => {
  it('every new event kind shows up in the collected engine events', () => {
    const seen = new Set<string>(unique.map((e) => e.kind));
    const expected: string[] = [
      'sulfideAcid', 'sulfiteAcid', 'thiosulfateAcid', 'chromateAcid', 'dichromateBase', 'halogenDisplace', 'iodideOx',
      'starchIodine', 'bleach', 'permanganateRedox', 'dichromateRedox', 'sulfideHydrolysis', 'metalSulfur', 'carbonReduce',
      'thermalDecomp', 'volcano', 'hardWater', 'adsorption', 'leadFilm', 'dissolveHot', 'flameTest', 'magnet', 'magnetNone',
      'filtered', 'dryOut', 'crystallize', 'melting', 'sublimation', 'distillation', 'iceMelt', 'gasOut', 'floats',
      'dissolveCold', 'dissolveHotSolid', 'boiling'
    ];
    expect(expected.filter((k) => !seen.has(k))).toEqual([]);
  });

  for (const { id: lang } of LANGS) {
    it(`${lang}: every event has a title and text without gaps`, () => {
      const s = STRINGS[lang];
      const h = makeH(lang, s);
      const bad: string[] = [];
      for (const e of unique) {
        if (e.kind === 'minor') continue;
        const t = s.events[e.kind](e.p, h, e);
        const all = [t.title, t.say, t.why ?? '', t.why7 ?? ''].join(' ');
        if (!t.title || !t.say || BAD.test(all)) bad.push(`${e.kind} ${JSON.stringify(e.p)} → ${t.title} | ${t.say}`);
      }
      expect(bad).toEqual([]);
    });

    it(`${lang}: hand-made parameters for rarer branches`, () => {
      const s = STRINGS[lang];
      const h = makeH(lang, s);
      const cases: [keyof typeof s.events, Record<string, string>][] = [
        ['halogenDisplace', { ox: 'Cl2', red: 'Fe^2+', product: 'Fe^3+' }],
        ['halogenDisplace', { ox: 'Br2', red: 'SO3^2-', product: 'SO4^2-' }],
        ['halogenDisplace', { ox: 'I2', red: 'S2O3^2-', product: 'I^-' }],
        ['halogenDisplace', { ox: 'Cl2', red: 'S^2-', product: 'S' }],
        ['iodideOx', { ion: 'Fe^3+' }], ['iodideOx', { ion: 'Cu^2+' }],
        ['permanganateRedox', { red: 'H2O2' }], ['dichromateRedox', { red: 'Fe^2+' }],
        ['thermalDecomp', { solid: 'NaHCO3', inSolution: '1' }], ['thermalDecomp', { solid: 'Unknown' }],
        ['flameTest', { ion: '', others: '', color: '' }], ['flameTest', { ion: 'Na^+', others: 'K^+', color: '#FFB000' }],
        ['crystallize', { solid: 'I2', cause: 'iodine' }], ['crystallize', { solid: 'NaCl', cause: 'evap' }],
        ['dryOut', { residue: '' }], ['filtered', { residue: '' }], ['magnetNone', { solid: '' }],
        ['boiling', {}], ['boiling', { bp: '101.5' }], ['iceMelt', { done: '1' }],
        ['activeMetalWater', { metal: 'Li' }], ['activeMetalWater', { metal: 'K' }], ['activeMetalWater', { metal: 'Ba' }],
        ['metalAcid', { metal: 'Ni', acid: 'HCl', salt: 'NiCl2', slow: '1' }], ['metalAlkali', { metal: 'Si' }],
        ['metalAcidNone', { metal: 'Au', acid: 'HNO3', noble: '1' }], ['needsHeat', { what: 'calcination', solid: 'CaCO3' }],
        ['dissolveHotSolid', { solid: 'CuSO4', saturated: '' }], ['dissolveCold', { solid: 'NH4NO3', saturated: '1' }],
        ['dissolveAcid', { solid: 'FeS', solidKind: 'sulfide', salt: 'FeCl2', acid: 'HCl' }],
        ['dissolveAcid', { solid: 'BaSO3', solidKind: 'sulfite', salt: 'BaCl2', acid: 'HCl' }]
      ];
      for (const [kind, p] of cases) {
        const e: ReactionEvent = { kind, importance: 2, p, signs: [] };
        const t = s.events[kind](p, h, e);
        expect(t.title, `${kind} ${JSON.stringify(p)}`).toBeTruthy();
        expect(t.say, `${kind} ${JSON.stringify(p)}`).toBeTruthy();
        expect([t.title, t.say, t.why ?? ''].join(' '), `${kind} ${JSON.stringify(p)}`).not.toMatch(BAD);
      }
    });

    it(`${lang}: safety texts and categories`, () => {
      const s = STRINGS[lang];
      for (const k of ['alkaliFire', 'toxic', 'hotGlass', 'bigSodium'] as const) expect(s.safety[k].text).toBeTruthy();
      expect(s.cats.nonmetal).toBeTruthy();
      expect(makeH(lang, s).color('goldYellow')).not.toBe('goldYellow');
    });
  }
});

describe('reagent info', () => {
  it('every reagent on the shelf has an everyday note in three languages', () => {
    const missing = REAGENTS.filter((r) => !REAGENT_INFO[r.id] || !REAGENT_INFO[r.id].life.kk || !REAGENT_INFO[r.id].life.ru || !REAGENT_INFO[r.id].life.en);
    expect(missing.map((r) => r.id)).toEqual([]);
  });

  it('everyday notes exist in all languages for the same kinds', () => {
    expect(Object.keys(LIFE.kk).sort()).toEqual(Object.keys(LIFE.ru).sort());
    expect(Object.keys(LIFE.en).sort()).toEqual(Object.keys(LIFE.ru).sort());
  });
});

import type { ColorName } from '../engine/color';
import type { ColorKey, IndicatorId, ReagentCat } from '../engine/data';
import type { EventKind, ReactionEvent, ReactionType, SafetyKey, Sign } from '../engine/vessel';
import type { Medium } from '../engine/ph';

/** Helpers that templates use to name substances. Formulas are wrapped as ⟦…⟧ and rendered by the UI. */
export interface H {
  N: (id: string) => string;          // compound name, lower case
  F: (id: string) => string;          // formula marker
  NF: (id: string) => string;         // name with formula
  color: (key: ColorKey | string) => string;
  ind: (id: IndicatorId | string) => string;
  indColor: (c: ColorName | string) => string;
  metal: (m: string) => string;       // nominative
  metal2: (m: string) => string;      // ru: genitive, kk: ablative, en: plain
  ionMetal: (ion: string) => string;  // metal of a cation, nominative
  ionMetal2: (ion: string) => string;
  reagent: (id: string) => string;
  num: (x: number) => string;
  cap: (s: string) => string;
}

export interface EventText { title: string; say: string; why?: string; why7?: string }
export type EventTexts = Record<EventKind, (p: Record<string, string>, h: H, e: ReactionEvent) => EventText>;

export interface Strings {
  langName: string;
  tagline: string;
  splashHint: string;
  grade: string;
  gradeNotes: Record<7 | 8 | 9 | 10 | 11, string>;
  tables: string;
  journal: string;
  undo: string;
  clearAll: string;
  theme: { bright: string; brand: string; label: string };
  language: string;
  reagents: string;
  search: string;
  nothingFound: string;
  cats: Record<'all' | ReagentCat, string>;
  dose: string;
  doseLiquid: [string, string, string];
  doseSolid: [string, string, string];
  doseDrops: [string, string, string];
  hint: string;
  hintTouch: string;
  tube: string;
  beaker: string;
  lamp: string;
  heat: string;
  stopHeat: string;
  wash: string;
  pourInto: string;
  pourHint: string;
  addTo: string;
  toasts: { full: string; emptyPour: string; washed: string; cleared: string; nothingToUndo: string; added: string; poured: string; discovery: string };
  panel: {
    title: string;
    inside: string;
    empty: string;
    emptyText: string;
    ideas: string;
    signs: string;
    equation: string;
    fullIonic: string;
    netIonic: string;
    noReaction: string;
    why: string;
    showIons: string;
    inSolution: string;
    solids: string;
    gasesOut: string;
    ph: string;
    medium: Record<Medium, string>;
    temperature: string;
    type: string;
    safety: string;
    also: string;
    concAcid: string;
    indicatorDrops: string;
    solution: string;
    gradeHint7: string;
  };
  signs: Record<Sign, string>;
  types: Record<ReactionType, string>;
  safety: Record<SafetyKey, { title: string; text: string }>;
  conc: string;
  dil: string;
  heated: string;
  tablesModal: {
    title: string;
    periodic: string;
    solubility: string;
    activity: string;
    indicators: string;
    close: string;
    sol: { R: string; M: string; N: string; D: string };
    solLegend: { R: string; M: string; N: string; D: string };
    activityNote: string;
    indicatorRows: { acid: string; neutral: string; alkaline: string };
    massLabel: string;
    categories: Record<string, string>;
  };
  journalModal: { title: string; empty: string; clear: string; vessel: string };
  discoveries: (n: number) => string;
  colors: Partial<Record<ColorKey, string>>;
  indColors: Record<ColorName, string>;
  indicators: Record<IndicatorId, string>;
  events: EventTexts;
  indicatorWhy: Record<IndicatorId, string>;
  ideaList: { label: string; steps: string[] }[];
  elements: string[]; // element names by atomic number - 1
}

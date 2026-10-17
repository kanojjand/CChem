import { COLORS, IONS, ION_METAL_FORMS, METALS, REAGENT_BY_ID, compound, hasCompound, type Lang } from '../engine/data';
import type { H, Strings } from './types';
import { patchEvents } from './chemTexts';
import { auditPatch } from './auditTexts';
import { extraPatch } from './extraTexts';
import { kk } from './kk';
import { ru } from './ru';
import { en } from './en';

export const STRINGS: Record<Lang, Strings> = { kk, ru, en };
for (const l of ['kk', 'ru', 'en'] as Lang[]) {
  patchEvents(STRINGS[l].events, l);
  extraPatch(STRINGS[l].events, l);
  auditPatch(STRINGS[l].events, l);
}
export const LANGS: { id: Lang; short: string }[] = [
  { id: 'kk', short: 'ҚАЗ' },
  { id: 'ru', short: 'РУС' },
  { id: 'en', short: 'ENG' }
];

const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);

/** Name of a substance in the given language, or null when only a formula is known. */
export function substanceName(id: string, lang: Lang): string | null {
  if (hasCompound(id)) return compound(id).name[lang];
  const r = REAGENT_BY_ID[id];
  if (r) return lowerFirst(r.name[lang]);
  return null;
}

/** Helpers the event texts use to name things. Formulas come back wrapped in ⟦…⟧. */
export function makeH(lang: Lang, s: Strings): H {
  const N = (id: string) => substanceName(id, lang) ?? `⟦${id}⟧`;
  const F = (id: string) => `⟦${id}⟧`;
  const metalForm = (forms: (typeof METALS)[string]['forms'] | undefined, second: boolean, fallback: string) => {
    if (!forms) return fallback;
    if (lang === 'ru') return second ? forms.ru.gen : forms.ru.nom;
    if (lang === 'kk') return second ? forms.kk.abl : forms.kk.nom;
    return forms.en;
  };
  return {
    N,
    F,
    NF: (id) => {
      const name = substanceName(id, lang);
      return name ? `${name} ⟦${id}⟧` : F(id);
    },
    color: (key) => (s.colors as Record<string, string>)[key] ?? (COLORS as Record<string, { name: Record<Lang, string> }>)[key]?.name[lang] ?? key,
    ind: (id) => (s.indicators as Record<string, string>)[id] ?? id,
    indColor: (c) => (s.indColors as Record<string, string>)[c] ?? c,
    metal: (m) => metalForm(METALS[m]?.forms, false, N(m)),
    metal2: (m) => metalForm(METALS[m]?.forms, true, N(m)),
    ionMetal: (ion) => metalForm(ION_METAL_FORMS[ion], false, IONS[ion]?.name[lang] ?? ion),
    ionMetal2: (ion) => metalForm(ION_METAL_FORMS[ion], true, IONS[ion]?.name[lang] ?? ion),
    reagent: (id) => (REAGENT_BY_ID[id] ? lowerFirst(REAGENT_BY_ID[id].name[lang]) : N(id)),
    num: (x) => {
      const v = Math.abs(x) >= 10 ? Math.round(x).toString() : (Math.round(x * 10) / 10).toString();
      return lang === 'en' ? v : v.replace('.', ',');
    },
    cap: (str) => (str.startsWith('⟦') || !str ? str : str[0].toUpperCase() + str.slice(1))
  };
}

/** Number with the decimal separator of the language. */
export function fmt(x: number, lang: Lang, digits = 1): string {
  const v = x.toFixed(digits);
  return lang === 'en' ? v : v.replace('.', ',');
}

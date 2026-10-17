// Chemical formula parsing and rendering.
//
// Notation used across the engine:
//   neutral:  "Cu(OH)2", "Na2[Zn(OH)4]", "NH3·H2O", "(CuOH)2CO3", "CH3COONa"
//   ions:     "Cu^2+", "SO4^2-", "Na^+", "[Zn(OH)4]^2-"
// Digits after an element or a closing bracket are subscripts; everything after "^" is the charge.

import { ELEMENTS } from '../data/elements';

export type Counts = Record<string, number>;

export interface Parsed {
  counts: Counts;
  charge: number;
}

const cache = new Map<string, Parsed>();

export function parseFormula(formula: string): Parsed {
  const hit = cache.get(formula);
  if (hit) return hit;

  // A state mark at the end, as in H2O(s), does not change the composition.
  let body = formula.replace(/\((s|l|g|aq)\)$/, '');
  let charge = 0;
  const caret = formula.indexOf('^');
  if (caret !== -1) {
    body = formula.slice(0, caret);
    const m = /^(\d*)([+-])$/.exec(formula.slice(caret + 1));
    if (!m) throw new Error(`Bad charge in ${formula}`);
    charge = (m[1] ? parseInt(m[1], 10) : 1) * (m[2] === '+' ? 1 : -1);
  }

  const counts: Counts = {};
  for (const part of body.split('·')) {
    const lead = /^(\d+)/.exec(part);
    const mult = lead ? parseInt(lead[1], 10) : 1;
    const inner = parseGroup(lead ? part.slice(lead[1].length) : part, formula);
    for (const el in inner) counts[el] = (counts[el] || 0) + inner[el] * mult;
  }

  const parsed = { counts, charge };
  cache.set(formula, parsed);
  return parsed;
}

function parseGroup(s: string, whole: string): Counts {
  const stack: Counts[] = [{}];
  let i = 0;
  const readNum = (): number => {
    const m = /^\d+/.exec(s.slice(i));
    if (!m) return 1;
    i += m[0].length;
    return parseInt(m[0], 10);
  };
  while (i < s.length) {
    const ch = s[i];
    if (ch === '(' || ch === '[') {
      stack.push({});
      i++;
    } else if (ch === ')' || ch === ']') {
      i++;
      const n = readNum();
      const top = stack.pop();
      if (!top || stack.length === 0) throw new Error(`Unbalanced brackets in ${whole}`);
      const into = stack[stack.length - 1];
      for (const el in top) into[el] = (into[el] || 0) + top[el] * n;
    } else if (/[A-Z]/.test(ch)) {
      const m = /^[A-Z][a-z]?/.exec(s.slice(i))!;
      i += m[0].length;
      const n = readNum();
      const into = stack[stack.length - 1];
      into[m[0]] = (into[m[0]] || 0) + n;
    } else {
      throw new Error(`Unexpected "${ch}" in ${whole}`);
    }
  }
  if (stack.length !== 1) throw new Error(`Unbalanced brackets in ${whole}`);
  return stack[0];
}

const MASSES: Record<string, number> = Object.fromEntries(ELEMENTS.map((e) => [e.sym, e.mass]));

export function molarMass(formula: string): number {
  const { counts } = parseFormula(formula);
  let m = 0;
  for (const el in counts) {
    const a = MASSES[el];
    if (a == null) throw new Error(`No atomic mass for ${el}`);
    m += a * counts[el];
  }
  return m;
}

export type Token = { t: 'text' | 'sub' | 'sup'; s: string };

// Splits a formula into text / subscript / superscript runs for display.
export function tokenize(formula: string): Token[] {
  const out: Token[] = [];
  const push = (t: Token['t'], s: string) => {
    const last = out[out.length - 1];
    if (last && last.t === t) last.s += s;
    else out.push({ t, s });
  };
  let body = formula;
  let charge = '';
  const caret = formula.indexOf('^');
  if (caret !== -1) {
    body = formula.slice(0, caret);
    charge = formula.slice(caret + 1).replace('-', '−');
  }
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (/\d/.test(ch)) {
      const prev = i > 0 ? body[i - 1] : '';
      const isSub = /[A-Za-z)\]]/.test(prev) || (out.length > 0 && out[out.length - 1].t === 'sub' && /\d/.test(prev));
      push(isSub ? 'sub' : 'text', ch);
    } else {
      push('text', ch);
    }
  }
  if (charge) push('sup', charge);
  return out;
}

// Plain-text version with Unicode sub/superscripts, for aria labels and tests.
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '−': '⁻' };

export function pretty(formula: string): string {
  return tokenize(formula)
    .map((tk) => (tk.t === 'sub' ? [...tk.s].map((c) => SUB[c] || c).join('') : tk.t === 'sup' ? [...tk.s].map((c) => SUP[c] || c).join('') : tk.s))
    .join('');
}

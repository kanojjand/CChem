import { parseFormula } from './formula';

// Exact rational arithmetic on small integers is enough for school equations.
type Frac = [number, number]; // numerator, denominator (denominator > 0)

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
const norm = ([n, d]: Frac): Frac => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return [n / g, d / g];
};
const sub = (a: Frac, b: Frac): Frac => norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
const mul = (a: Frac, b: Frac): Frac => norm([a[0] * b[0], a[1] * b[1]]);
const div = (a: Frac, b: Frac): Frac => norm([a[0] * b[1], a[1] * b[0]]);
const isZero = (a: Frac) => a[0] === 0;

/**
 * Balances reactants -> products by element and charge conservation.
 * Returns integer coefficients in order (reactants then products), or null when the
 * equation has no unique positive solution.
 */
export function balance(reactants: string[], products: string[]): number[] | null {
  const species = [...reactants, ...products];
  const parsed = species.map((f) => parseFormula(f));
  const rows: string[] = [];
  for (const p of parsed) for (const el in p.counts) if (!rows.includes(el)) rows.push(el);
  const hasCharge = parsed.some((p) => p.charge !== 0);
  const n = species.length;

  const m: Frac[][] = rows.map((el) =>
    parsed.map((p, j) => [((p.counts[el] || 0) * (j < reactants.length ? 1 : -1)), 1] as Frac)
  );
  if (hasCharge) m.push(parsed.map((p, j) => [p.charge * (j < reactants.length ? 1 : -1), 1] as Frac));

  // Reduced row echelon form.
  const pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < n && r < m.length; c++) {
    let p = r;
    while (p < m.length && isZero(m[p][c])) p++;
    if (p === m.length) continue;
    [m[r], m[p]] = [m[p], m[r]];
    const pv = m[r][c];
    m[r] = m[r].map((x) => div(x, pv));
    for (let i = 0; i < m.length; i++) {
      if (i !== r && !isZero(m[i][c])) {
        const f = m[i][c];
        m[i] = m[i].map((x, k) => sub(x, mul(f, m[r][k])));
      }
    }
    pivots.push(c);
    r++;
  }
  const free = [...Array(n).keys()].filter((c) => !pivots.includes(c));
  if (free.length !== 1) return null;

  const fc = free[0];
  const sol: Frac[] = Array(n).fill([0, 1]);
  sol[fc] = [1, 1];
  pivots.forEach((pc, i) => { sol[pc] = norm([-m[i][fc][0], m[i][fc][1]]); });

  let lcm = 1;
  for (const [, d] of sol) lcm = (lcm * d) / gcd(lcm, d);
  let ints = sol.map(([nu, d]) => (nu * lcm) / d);
  if (ints.every((x) => x <= 0)) ints = ints.map((x) => -x);
  if (ints.some((x) => x <= 0)) return null;
  const g = ints.reduce((a, b) => gcd(a, b));
  return ints.map((x) => x / g);
}

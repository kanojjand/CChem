// CC Hexa logo: an atom behind a hexagonal letter C with the CC Lab star inside.
// The C is drawn from exact geometry (a hexagon with pointed top and bottom, one stroke
// weight everywhere, an opening on the right), the atom from three equal ellipses turned
// 60° apart. The atom passes behind the C with a thin gap cut out by a mask.
// From time to time the atom turns into the small C of the CC Lab mark, the big C takes the
// CC Lab shape and the star moves to its place there; then everything comes back. The big C
// has the same vertex count in both states, so it morphs per vertex.

type Pt = [number, number];

const SVG_NS = 'http://www.w3.org/2000/svg';
export const VIEWBOX = '245 277 990 990';
export const ATOM_COLOR = '#00A8F8';

// ---------------------------------------------------------------- the hexagonal C

const CX = 892, CY = 772;
const H = 424;          // half height (top and bottom points)
const W = 313;          // half width
const SLOPE = 0.75;     // slant of the upper and lower edges
const T = 106;          // stroke weight, measured square to every edge
const ARM = 88;         // half height of the opening on the right

const h = H - SLOPE * W;                         // half length of the outer vertical sides
const dv = T * Math.sqrt(1 + SLOPE * SLOPE);     // vertical thickness of a slanted edge
const Wi = W - T;
const Hi = H - dv;
const hi = Hi - SLOPE * Wi;

/** Outer outline of a C with this vertex order: the atom hides behind all of it. */
const OUTLINE = [0, 1, 12, 13, 14, 15];

// Same vertex order as BIG_C below: top, right arm, inner edge, lower arm, outer left side.
const HEXA_C: Pt[] = [
  [CX, CY - H], [CX + W, CY - h], [CX + W, CY - ARM], [CX + Wi, CY - ARM],
  [CX + Wi, CY - hi], [CX, CY - Hi], [CX - Wi, CY - hi], [CX - Wi, CY + hi],
  [CX, CY + Hi], [CX + Wi, CY + hi], [CX + Wi, CY + ARM], [CX + W, CY + ARM],
  [CX + W, CY + h], [CX, CY + H], [CX - W, CY + h], [CX - W, CY - h]
];

// ---------------------------------------------------------------- the atom

const AX = CX - W + 61, AY = CY;      // nucleus hidden behind the left side of the C
const RA = 435, RB = 150;             // semi-axes of every orbit
const ORBIT_W = 36;
const ELECTRON_R = 44;
const GAP = 42;                       // clear space between the atom and the C
const ORBIT_ANGLES = [90, 40, -40];   // direction of the long axis of each orbit, degrees

/** Point of an orbit at parameter t (radians). */
function orbitPoint(angleDeg: number, t: number): Pt {
  const f = (angleDeg * Math.PI) / 180;
  const x = RA * Math.cos(t), y = RB * Math.sin(t);
  // SVG y grows downwards: a positive angle turns the long axis up and to the right.
  return [AX + x * Math.cos(f) + y * Math.sin(f), AY - x * Math.sin(f) + y * Math.cos(f)];
}

const deg = (d: number) => (d * Math.PI) / 180;
/** Parameter of the orbit point that lies straight to the left of the nucleus. */
function leftOf(angleDeg: number): number {
  // orbitPoint maps a local direction θ to the world direction (angle − θ).
  const th = deg(angleDeg - 180);
  return Math.atan2(RA * Math.sin(th), RB * Math.cos(th));
}
// Two electrons on the upright orbit, upper left and lower left; the third sits where the two
// slanted orbits cross on the left. [orbit index, parameter]
const ELECTRONS: [number, number][] = [[0, deg(-30)], [0, deg(210)], [2, leftOf(ORBIT_ANGLES[2])]];

// ---------------------------------------------------------------- the CC Lab mark

const BIG_C: Pt[] = [
  [972, 348], [1194, 540], [1194, 679], [1090, 679],
  [1090, 586], [970, 482], [698, 699], [698, 859],
  [937, 1061], [1090, 939], [1090, 854], [1194, 854],
  [1194, 988], [935, 1196], [590, 903], [590, 655]
];
const SMALL_C: Pt[] = [
  [631, 346], [767, 462], [689, 528], [630, 481],
  [508, 582], [509, 964], [623, 1062], [675, 1023],
  [749, 1085], [621, 1196], [404, 1009], [404, 536]
];
const SMALL_CENTER: Pt = [585, 771];

const STAR_PATH = 'M0 -125 L27 -27 L125 0 L27 27 L0 125 L-27 27 L-125 0 L-27 -27 Z';
const STAR_HEXA: Pt = [CX + 29, CY];
const STAR_HEXA_SCALE = 1.2;
const STAR_LAB: Pt = [943, 777];

const MORPH_MS = 950, HOLD_MS = 1700, FLASH_MS = 1400;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mix = (p: number, q: number, t: number) => p + (q - p) * t;

function outlineAt(from: Pt[], to: Pt[], t: number): string {
  return pathAt(OUTLINE.map((i) => from[i]), OUTLINE.map((i) => to[i]), t);
}

function pathAt(from: Pt[], to: Pt[], t: number): string {
  let d = '';
  for (let i = 0; i < from.length; i++) {
    d += (i ? 'L' : 'M') + mix(from[i][0], to[i][0], t).toFixed(1) + ' ' + mix(from[i][1], to[i][1], t).toFixed(1);
  }
  return d + 'Z';
}

const ellipseAttrs = (angle: number) =>
  `cx="${AX}" cy="${AY}" rx="${RA}" ry="${RB}" transform="rotate(${-angle} ${AX} ${AY})"`;

/**
 * The resting logo as a standalone SVG string (favicon, app icons). `background` puts the
 * mark on a square of that colour with corners rounded by `radius` (a share of the side);
 * `pad` adds space around the mark (a share of the logo box on each side).
 */
export function logoSvg(opts: { ink?: string; atom?: string; background?: string; radius?: number; pad?: number; size?: number } = {}): string {
  const ink = opts.ink ?? '#FFFFFF';
  const atom = opts.atom ?? ATOM_COLOR;
  const [vx, vy, vw] = VIEWBOX.split(' ').map(Number);
  const pad = vw * (opts.pad ?? 0);
  const x0 = vx - pad, y0 = vy - pad, side = vw + 2 * pad;
  const c = pathAt(HEXA_C, HEXA_C, 0);
  const bg = opts.background ? `<rect x="${x0}" y="${y0}" width="${side}" height="${side}" rx="${side * (opts.radius ?? 0)}" fill="${opts.background}"/>` : '';
  const electrons = ELECTRONS.map(([o, t]) => { const [x, y] = orbitPoint(ORBIT_ANGLES[o], t); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${ELECTRON_R}"/>`; }).join('');
  const size = opts.size ? ` width="${opts.size}" height="${opts.size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${side} ${side}"${size}>${bg}` +
    `<defs><mask id="m" maskUnits="userSpaceOnUse" x="${x0}" y="${y0}" width="${side}" height="${side}">` +
    `<rect x="${x0}" y="${y0}" width="${side}" height="${side}" fill="#fff"/>` +
    `<path d="${outlineAt(HEXA_C, HEXA_C, 0)}" fill="#000" stroke="#000" stroke-width="${2 * GAP}" stroke-linejoin="miter"/></mask></defs>` +
    `<g mask="url(#m)"><g fill="none" stroke="${atom}" stroke-width="${ORBIT_W}">${ORBIT_ANGLES.map((a) => `<ellipse ${ellipseAttrs(a)}/>`).join('')}</g>` +
    `<g fill="${atom}">${electrons}</g></g>` +
    `<path d="${c}" fill="${ink}"/>` +
    `<path d="${STAR_PATH}" fill="${ink}" transform="translate(${STAR_HEXA[0]} ${STAR_HEXA[1]}) scale(${STAR_HEXA_SCALE})"/></svg>`;
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface HexaLogo {
  play(): void;
  flash(): void;
  toggle(): void;
  setInterval(ms: number): void;
  destroy(): void;
}

let uid = 0;

/** `startAsLab`: begin with the CC Lab mark (the splash screen then turns it into CC Hexa). */
export function mountLogo(container: Element, options: { interval?: number; label?: string; startAsLab?: boolean } = {}): HexaLogo {
  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, String(attrs[k]));
    return node;
  };
  const svg = el('svg', { viewBox: VIEWBOX, role: 'img', 'aria-label': options.label ?? 'CC Hexa', fill: 'currentColor' });
  svg.style.cssText = 'display:block;width:100%;height:100%;overflow:visible';

  const [vx, vy, vw, vh] = VIEWBOX.split(' ').map(Number);
  const maskId = `hexa-mask-${++uid}`;
  const defs = el('defs');
  const mask = el('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: vx - 100, y: vy - 100, width: vw + 200, height: vh + 200 });
  mask.append(el('rect', { x: vx - 100, y: vy - 100, width: vw + 200, height: vh + 200, fill: '#fff' }));
  const maskC = el('path', { fill: '#000', stroke: '#000', 'stroke-width': 2 * GAP, 'stroke-linejoin': 'miter' });
  mask.append(maskC);
  defs.append(mask);

  const atomWrap = el('g', { mask: `url(#${maskId})` });
  const atom = el('g');
  atom.style.color = `var(--logo-atom, ${ATOM_COLOR})`;
  const orbits = el('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': ORBIT_W });
  for (const a of ORBIT_ANGLES) {
    orbits.append(el('ellipse', { cx: AX, cy: AY, rx: RA, ry: RB, transform: `rotate(${-a} ${AX} ${AY})` }));
  }
  const electrons = ELECTRONS.map(() => el('circle', { r: ELECTRON_R, fill: 'currentColor' }));
  atom.append(orbits, ...electrons);
  atomWrap.append(atom);

  const small = el('path');
  const big = el('path');
  const star = el('path', { d: STAR_PATH });
  svg.append(defs, atomWrap, small, big, star);
  container.appendChild(svg);

  let state = options.startAsLab ? 1 : 0; // 0 = CC Hexa (atom), 1 = CC Lab mark
  let raf = 0, timer = 0, loop = 0;
  let busy = false, destroyed = false;

  /** p: 0 = atom logo, 1 = CC Lab mark; spin: 0..1 one turn of the electrons; twinkle: 0..1 star pulse. */
  function render(p: number, spin: number, twinkle: number) {
    const t = ease(clamp01(p));
    const c = pathAt(HEXA_C, BIG_C, t);
    big.setAttribute('d', c);
    maskC.setAttribute('d', outlineAt(HEXA_C, BIG_C, t));

    ELECTRONS.forEach(([o, t0], i) => {
      const [x, y] = orbitPoint(ORBIT_ANGLES[o], t0 + 2 * Math.PI * spin);
      electrons[i].setAttribute('cx', x.toFixed(1));
      electrons[i].setAttribute('cy', y.toFixed(1));
    });
    const a = ease(clamp01(p / 0.6));
    atom.setAttribute('transform', `rotate(${(-60 * a).toFixed(1)} ${AX} ${AY}) translate(${AX} ${AY}) scale(${(1 - 0.45 * a).toFixed(3)}) translate(${-AX} ${-AY})`);
    atom.style.opacity = String(1 - a);
    atomWrap.style.display = a > 0.99 ? 'none' : '';

    const sIn = ease(clamp01((p - 0.35) / 0.65));
    small.setAttribute('d', pathAt(SMALL_C, SMALL_C, 0));
    small.setAttribute('transform', `translate(${SMALL_CENTER[0]} ${SMALL_CENTER[1]}) scale(${(0.7 + 0.3 * sIn).toFixed(3)}) translate(${-SMALL_CENTER[0]} ${-SMALL_CENTER[1]})`);
    small.style.opacity = String(sIn);
    small.style.display = sIn < 0.01 ? 'none' : '';

    const pulse = Math.sin(Math.PI * twinkle);
    const scale = mix(STAR_HEXA_SCALE, 1, t) * (1 + 0.3 * pulse);
    star.setAttribute('transform', `translate(${mix(STAR_HEXA[0], STAR_LAB[0], t).toFixed(1)} ${mix(STAR_HEXA[1], STAR_LAB[1], t).toFixed(1)}) rotate(${(90 * t + 90 * twinkle).toFixed(1)}) scale(${scale.toFixed(3)})`);
  }

  function animate(duration: number, step: (k: number) => void, done?: () => void) {
    cancelAnimationFrame(raf);
    if (reducedMotion() || duration <= 0) { step(1); done?.(); return; }
    let start = 0;
    const frame = (now: number) => {
      if (destroyed) return;
      if (!start) start = now;
      const k = clamp01((now - start) / duration);
      step(k);
      if (k < 1) raf = requestAnimationFrame(frame);
      else done?.();
    };
    raf = requestAnimationFrame(frame);
  }

  function morphTo(target: number, done?: () => void) {
    const from = state;
    animate(MORPH_MS, (k) => render(mix(from, target, k), 0, 0), () => { state = target; done?.(); });
  }

  function play() {
    if (busy) return;
    busy = true;
    morphTo(1, () => {
      timer = window.setTimeout(() => morphTo(0, () => { busy = false; }), reducedMotion() ? 2500 : HOLD_MS);
    });
  }

  /** A new discovery: the electrons run once round their orbits and the star twinkles. */
  function flash() {
    if (busy || state !== 0 || reducedMotion()) return;
    busy = true;
    animate(FLASH_MS, (k) => render(0, ease(k), k), () => { render(0, 0, 0); busy = false; });
  }

  function toggle() {
    if (busy) return;
    busy = true;
    morphTo(state ? 0 : 1, () => { busy = false; });
  }

  function startLoop(ms: number) {
    clearInterval(loop);
    if (ms > 0 && !reducedMotion()) loop = window.setInterval(play, ms);
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    clearInterval(loop);
    svg.remove();
  }

  render(state, 0, 0);
  startLoop(options.interval ?? 45000);
  return { play, flash, toggle, setInterval: startLoop, destroy };
}

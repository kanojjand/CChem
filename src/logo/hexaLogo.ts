// CC Hexa logo (TypeScript port of design/hexa-logo.js).
// Resting state: a benzene-ring hexagon with an aromatic circle inside. From time to time
// the ring splits into the two letters of the CC Lab mark, the circle collapses into the
// CC Lab star, and everything folds back. Every shape has the same vertex count in both
// states, so the morph is a plain per-vertex interpolation.

type Pt = [number, number];

const SVG_NS = 'http://www.w3.org/2000/svg';
export const VIEWBOX = '380 322 840 900';

const CX = 799, TOP = 346, BOTTOM = 1196;
const HALF_W = 360;
const SLOPE = 0.83;
const WEIGHT = 105;
const CY = (TOP + BOTTOM) / 2;

const dv = WEIGHT * Math.sqrt(1 + SLOPE * SLOPE);
const a = HALF_W - WEIGHT;
const oSideTop = TOP + SLOPE * HALF_W;
const oSideBot = BOTTOM - SLOPE * HALF_W;
const iTop = TOP + dv;
const iBot = BOTTOM - dv;
const iSideTop = iTop + SLOPE * a;
const iSideBot = iBot - SLOPE * a;

const RING: Pt[] = [
  [CX, TOP], [CX + HALF_W, oSideTop], [CX + HALF_W, CY], [CX + a, CY],
  [CX + a, iSideTop], [CX, iTop], [CX - a, iSideTop], [CX - a, iSideBot],
  [CX, iBot], [CX + a, iSideBot], [CX + a, CY], [CX + HALF_W, CY],
  [CX + HALF_W, oSideBot], [CX, BOTTOM], [CX - HALF_W, oSideBot], [CX - HALF_W, oSideTop]
];

const BIG_C: Pt[] = [
  [972, 348], [1194, 540], [1194, 679], [1090, 679],
  [1090, 586], [970, 482], [698, 699], [698, 859],
  [937, 1061], [1090, 939], [1090, 854], [1194, 854],
  [1194, 988], [935, 1196], [590, 903], [590, 655]
];

const SPLIT = 39;
const SMALL_IN_RING: Pt[] = [
  [CX - SPLIT, TOP + SLOPE * SPLIT], [CX, TOP], [CX, iTop], [CX - SPLIT, iTop + SLOPE * SPLIT],
  [CX - a, iSideTop], [CX - a, iSideBot], [CX - SPLIT, iBot - SLOPE * SPLIT], [CX, iBot],
  [CX, BOTTOM], [CX - SPLIT, BOTTOM - SLOPE * SPLIT], [CX - HALF_W, oSideBot], [CX - HALF_W, oSideTop]
];
const SMALL_C: Pt[] = [
  [631, 346], [767, 462], [689, 528], [630, 481],
  [508, 582], [509, 964], [623, 1062], [675, 1023],
  [749, 1085], [621, 1196], [404, 1009], [404, 536]
];

const STAR_AT: Pt = [943, 777];
const STAR_PATH = 'M0 -125 L27 -27 L125 0 L27 27 L0 125 L-27 27 L-125 0 L-27 -27 Z';
const CIRCLE_R = 150, CIRCLE_W = 46;
const MORPH_MS = 950, HOLD_MS = 1700, FLASH_MS = 1100;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mix = (p: number, q: number, t: number) => p + (q - p) * t;

function pathAt(from: Pt[], to: Pt[], t: number): string {
  let d = '';
  for (let i = 0; i < from.length; i++) {
    d += (i ? 'L' : 'M') + mix(from[i][0], to[i][0], t).toFixed(1) + ' ' + mix(from[i][1], to[i][1], t).toFixed(1);
  }
  return d + 'Z';
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface HexaLogo {
  play(): void;
  flash(): void;
  toggle(): void;
  setInterval(ms: number): void;
  destroy(): void;
}

export function mountLogo(container: Element, options: { interval?: number; label?: string } = {}): HexaLogo {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', VIEWBOX);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', options.label ?? 'CC Hexa');
  svg.setAttribute('fill', 'currentColor');
  svg.style.cssText = 'display:block;width:100%;height:100%;overflow:visible';
  const small = document.createElementNS(SVG_NS, 'path');
  const big = document.createElementNS(SVG_NS, 'path');
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'currentColor');
  const star = document.createElementNS(SVG_NS, 'path');
  star.setAttribute('d', STAR_PATH);
  svg.append(small, big, circle, star);
  container.appendChild(svg);

  let state = 0; // 0 = CC Hexa ring, 1 = CC Lab mark
  let raf = 0, timer = 0, loop = 0;
  let busy = false, destroyed = false;

  function render(p: number, flash: number) {
    const t = ease(clamp01(p));
    big.setAttribute('d', pathAt(RING, BIG_C, t));
    small.setAttribute('d', pathAt(SMALL_IN_RING, SMALL_C, t));
    const c = 1 - ease(clamp01(p / 0.55));
    const pulse = Math.sin(Math.PI * flash);
    circle.setAttribute('cx', String(CX));
    circle.setAttribute('cy', String(CY));
    circle.setAttribute('r', (CIRCLE_R * c * (1 - 0.35 * pulse)).toFixed(1));
    circle.setAttribute('stroke-width', (CIRCLE_W * c * (1 - 0.6 * pulse)).toFixed(1));
    circle.style.opacity = c < 0.02 ? '0' : '1';
    const s = ease(clamp01((p - 0.4) / 0.6));
    const scale = Math.max(s, 0.75 * pulse);
    const angle = (1 - s) * -90 + flash * 90;
    star.setAttribute('transform', `translate(${mix(CX, STAR_AT[0], s).toFixed(1)} ${mix(CY, STAR_AT[1], s).toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${scale.toFixed(3)})`);
    star.style.opacity = scale < 0.01 ? '0' : '1';
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
    animate(MORPH_MS, (k) => render(mix(from, target, k), 0), () => { state = target; done?.(); });
  }

  function play() {
    if (busy) return;
    busy = true;
    morphTo(1, () => {
      timer = window.setTimeout(() => morphTo(0, () => { busy = false; }), reducedMotion() ? 2500 : HOLD_MS);
    });
  }

  function flash() {
    if (busy || state !== 0 || reducedMotion()) return;
    busy = true;
    animate(FLASH_MS, (k) => render(0, k), () => { render(0, 0); busy = false; });
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

  render(0, 0);
  startLoop(options.interval ?? 45000);
  return { play, flash, toggle, setInterval: startLoop, destroy };
}

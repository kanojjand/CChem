// Draws a tube or a beaker with its contents: liquid color and level, precipitate,
// metal pieces, bubbles and short effects (cloudiness, splash, smell, brown gas, charring).

import { COLORS, METALS, compound, hasCompound } from '../engine/data';
import { solutionColor } from '../engine/color';
import { phOf } from '../engine/actions';
import { EPS, amt, waterVolume, type Vessel } from '../engine/vessel';

interface Geo {
  w: number;
  h: number;
  inner: string;
  outline: string;
  xL: number;
  xR: number;
  bottom: number;
  maxTop: number;
  mouth: number;
}

const TUBE: Geo = {
  w: 60, h: 236,
  inner: 'M12 14 V196 A18 18 0 0 0 48 196 V14 Z',
  outline: 'M12 14 V196 A18 18 0 0 0 48 196 V14',
  xL: 12, xR: 48, bottom: 214, maxTop: 34, mouth: 12
};

const BEAKER: Geo = {
  w: 112, h: 132,
  inner: 'M18 8 V120 A8 8 0 0 0 26 128 H86 A8 8 0 0 0 94 120 V8 Z',
  outline: 'M10 8 H18 V120 A8 8 0 0 0 26 128 H86 A8 8 0 0 0 94 120 V8',
  xL: 18, xR: 94, bottom: 128, maxTop: 22, mouth: 6
};

const WATER = '#CFE6F7';
const OILY = '#EFE4C2';
const FX_RECENT = 5000;

const recent = (t: number | undefined, now: number, ms = FX_RECENT) => t != null && now - t >= 0 && now - t < ms;

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function solidColor(id: string): string {
  if (hasCompound(id)) {
    const c = compound(id).color;
    if (c) return COLORS[c].hex;
  }
  return COLORS.white.hex;
}

function wave(xL: number, xR: number, y: number, depth: number, amp = 1.6): string {
  const steps = Math.max(3, Math.round((xR - xL) / 9));
  const dx = (xR - xL) / steps;
  let d = `M${xL - 2} ${y + depth} V${y}`;
  for (let i = 0; i < steps; i++) d += ` q${dx / 2} ${i % 2 ? amp : -amp} ${dx} 0`;
  return d + ` V${y + depth} Z`;
}

function MetalPieces({ id, n, g, yBase, floatY, skating }: { id: string; n: number; g: Geo; yBase: number; floatY: number | null; skating: boolean }) {
  const m = METALS[id];
  const color = m?.color ?? '#9AA3AB';
  const cx = (g.xL + g.xR) / 2;
  const span = g.xR - g.xL;
  const stroke = 'rgba(0,0,0,0.28)';
  if (n < 0.6) {
    // A thin deposit: small grains of the new metal.
    return (
      <g fill={color} stroke={stroke} strokeWidth={0.6}>
        {Array.from({ length: 7 }, (_, i) => (
          <circle key={i} cx={g.xL + 5 + rand(i + 3) * (span - 10)} cy={yBase - 3 - rand(i + 11) * 9} r={1.3 + rand(i) * 1.1} />
        ))}
      </g>
    );
  }
  switch (m?.look) {
    case 'wire':
      return (
        <path d={`M${cx - 10} ${yBase - 2} C${cx - 2} ${yBase - 12} ${cx + 6} ${yBase + 6} ${cx + 12} ${yBase - 8} C${cx + 6} ${yBase - 16} ${cx - 4} ${yBase - 2} ${cx - 10} ${yBase - 14} C${cx - 4} ${yBase - 24} ${cx + 6} ${yBase - 10} ${cx + 10} ${yBase - 22}`}
          fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      );
    case 'ribbon':
      return <path d={`M${cx - 12} ${yBase - 3} L${cx - 4} ${yBase - 15} L${cx + 4} ${yBase - 5} L${cx + 12} ${yBase - 18}`} fill="none" stroke={color} strokeWidth={4.5} strokeLinejoin="round" />;
    case 'filings':
      return (
        <g fill={color}>
          {Array.from({ length: 26 }, (_, i) => (
            <rect key={i} x={g.xL + 3 + rand(i + 1) * (span - 6)} y={yBase - 2 - rand(i + 40) * 7} width={2.4} height={1.4} transform={`rotate(${rand(i + 7) * 180} ${g.xL + 3 + rand(i + 1) * (span - 6)} ${yBase - 2})`} />
          ))}
        </g>
      );
    case 'piece': {
      const y = floatY ?? yBase - 6;
      return (
        <g className={skating ? 'skate' : undefined}>
          <ellipse cx={cx} cy={y} rx={floatY != null ? 5 : 8} ry={floatY != null ? 4 : 6} fill={color} stroke={stroke} strokeWidth={0.8} />
        </g>
      );
    }
    case 'crystals':
      return (
        <g fill={color} stroke={stroke} strokeWidth={0.6}>
          <path d={`M${cx - 8} ${yBase - 2} l3 -8 l3 8 z M${cx} ${yBase - 2} l4 -11 l3 11 z M${cx + 8} ${yBase - 2} l2 -6 l3 6 z`} />
        </g>
      );
    default: // granules
      return (
        <g fill={color} stroke={stroke} strokeWidth={0.8}>
          <path d={`M${cx - 12} ${yBase - 6} l7 -5 l7 3 l-1 8 l-9 2 z`} />
          <path d={`M${cx} ${yBase - 2} l8 -4 l6 5 l-4 6 l-8 -1 z`} />
          <path d={`M${cx - 6} ${yBase - 12} l6 2 l-2 6 l-6 -2 z`} />
        </g>
      );
  }
}

export function VesselSVG({ v, now }: { v: Vessel; now: number }) {
  const g = v.kind === 'tube' ? TUBE : BEAKER;
  const uid = `v-${v.id}`;
  // Square root keeps a typical 2 mL portion clearly visible in a 20 mL tube.
  const level = Math.sqrt(Math.min(1, v.volume / v.capacity));
  const hasLiquid = v.volume > 0.005;
  let yTop = g.bottom - level * (g.bottom - g.maxTop);
  if (hasLiquid) yTop = Math.min(yTop, g.bottom - 5);
  const pH = phOf(v);
  const colored = hasLiquid ? solutionColor(v.aq, v.volume, v.inds, pH) : null;
  const oily = amt(v.aq, 'H2SO4c') > EPS && waterVolume(v) <= 0.05;
  const liquid = colored ?? (oily ? OILY : WATER);

  const solids = Object.entries(v.solids).filter(([, n]) => n > 1e-4);
  const metals = solids.filter(([id]) => METALS[id]);
  const rest = solids.filter(([id]) => !METALS[id] && id !== 'C');
  const charred = amt(v.solids, 'C') > EPS && v.fx.charAt != null;
  const firstPrecip = rest[0]?.[0];

  // Precipitate and powder layers, stacked from the bottom.
  const maxLayer = v.kind === 'tube' ? 34 : 22;
  let yb = g.bottom;
  const layers = rest.map(([id, n]) => {
    const h = Math.min(maxLayer, 4 + 9 * Math.log2(1 + n * 2));
    const layer = { id, y: yb - h, h, color: solidColor(id) };
    yb -= h;
    return layer;
  });

  const gases = v.fx.gas.filter((gas) => gas.until > now && gas.id !== 'H2O');
  const boiling = v.fx.gas.some((gas) => gas.id === 'H2O' && gas.until > now) && v.heating;
  const steam = hasLiquid && (boiling || v.temp > 75);
  const bubbleCount = Math.min(14, gases.reduce((s, gas) => s + Math.round(gas.amount * 3) + 3, 0) + (boiling ? 6 : 0));
  const naSkating = recent(v.fx.runAt, now, 7000) && amt(v.solids, 'Na') > EPS && hasLiquid;
  const brown = recent(v.fx.brownAt, now, 6000) || gases.some((gas) => gas.id === 'NO');
  const smell = recent(v.fx.smellAt, now, 5000) || gases.some((gas) => gas.id === 'NH3' || gas.id === 'SO2');
  const splash = recent(v.fx.splashAt, now, 1600);
  const boom = recent(v.fx.boomAt, now, 1300);
  const cx = (g.xL + g.xR) / 2;
  const span = g.xR - g.xL;

  return (
    <svg viewBox={`0 ${-48} ${g.w} ${g.h + 48}`} className="vessel-svg" aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={`${uid}-in`}><path d={g.inner} /></clipPath>
        <clipPath id={`${uid}-liq`}><rect x={0} y={yTop} width={g.w} height={g.h} /></clipPath>
      </defs>
      <path d={g.inner} className="glass-back" />
      <g clipPath={`url(#${uid}-in)`}>
        {hasLiquid && (
          <>
            <rect x={0} y={yTop} width={g.w} height={g.h} fill={liquid} opacity={colored ? 0.92 : 0.7} />
            <rect x={g.xL} y={yTop} width={span} height={2.4} fill="#FFFFFF" opacity={0.55} />
          </>
        )}
        {metals.map(([id, n]) => (
          <MetalPieces key={id} id={id} n={n} g={g} yBase={g.bottom - 2}
            floatY={id === 'Na' && hasLiquid ? yTop - 1 : null} skating={id === 'Na' && naSkating} />
        ))}
        {layers.map((l) => (
          <path key={`${l.id}-${v.fx.precipAt ?? 0}`} className="precip-layer" d={wave(g.xL, g.xR, l.y, l.h + 30)} fill={l.color} opacity={0.95} />
        ))}
        {hasLiquid && firstPrecip && recent(v.fx.precipAt, now, 6000) && (
          <g key={`cloud-${v.fx.precipAt}`} clipPath={`url(#${uid}-liq)`}>
            <rect className="cloud" x={0} y={yTop} width={g.w} height={g.h} fill={solidColor(firstPrecip)} />
            {Array.from({ length: 16 }, (_, i) => (
              <circle key={i} className="fall" cx={g.xL + 3 + rand(i + 5) * (span - 6)} cy={yTop + 4 + rand(i + 20) * Math.max(4, g.bottom - yTop - 20)} r={1.4 + rand(i) * 0.8}
                fill={solidColor(firstPrecip)} style={{ animationDelay: `${(rand(i + 9) * 1.2).toFixed(2)}s` }} />
            ))}
          </g>
        )}
        {hasLiquid && bubbleCount > 0 && (
          <g clipPath={`url(#${uid}-liq)`}>
            {Array.from({ length: bubbleCount }, (_, i) => (
              <circle key={i} className="bubble" cx={g.xL + 4 + rand(i + 2) * (span - 8)} cy={g.bottom - 6 - rand(i + 30) * 14} r={1.6 + (i % 3) * 0.9}
                style={{ animationDelay: `${(i * 0.23).toFixed(2)}s`, animationDuration: `${(1.4 + rand(i + 4)).toFixed(2)}s` }} />
            ))}
          </g>
        )}
        {charred && (
          <rect key={`char-in-${v.fx.charAt}`} className="char" x={0} y={g.mouth} width={g.w} height={g.h} fill="#1A1714" />
        )}
      </g>
      {charred && (
        <path key={`char-out-${v.fx.charAt}`} className="char char-top" d={`M${g.xL + 1} ${g.mouth + 4} V${g.mouth - 26} q${span / 4} -14 ${span / 2} -6 t${span / 2 - 2} 4 V${g.mouth + 4} Z`} fill="#1A1714" />
      )}
      <path d={g.outline} className="glass-line" />
      {v.kind === 'tube'
        ? <rect x={7} y={8} width={46} height={8} rx={4} className="glass rim" />
        : <path d="M84 30h10M84 50h10M84 70h10M84 90h10" stroke="var(--glass)" strokeWidth={2} />}
      {steam && (
        <g className="steam" fill="none" stroke="var(--steam)" strokeWidth={2.4} strokeLinecap="round">
          <path d={`M${cx - 8} ${g.mouth - 6} q-5 -9 0 -18 t0 -18`} />
          <path d={`M${cx + 6} ${g.mouth - 4} q5 -9 0 -18 t0 -18`} style={{ animationDelay: '0.6s' }} />
        </g>
      )}
      {smell && !steam && (
        <g className="smell" fill="none" stroke="var(--muted)" strokeWidth={1.8} strokeLinecap="round" strokeDasharray="3 4">
          <path d={`M${cx - 10} ${g.mouth - 4} q-4 -8 0 -16 t0 -16`} />
          <path d={`M${cx} ${g.mouth - 6} q4 -8 0 -16 t0 -16`} style={{ animationDelay: '0.5s' }} />
          <path d={`M${cx + 10} ${g.mouth - 4} q-4 -8 0 -16 t0 -16`} style={{ animationDelay: '1s' }} />
        </g>
      )}
      {brown && <ellipse className="brown-gas" cx={cx} cy={g.mouth - 14} rx={span / 2 + 6} ry={12} fill="#B5542A" />}
      {splash && (
        <g key={`splash-${v.fx.splashAt}`} className="splash" fill={liquid} stroke="var(--glass)" strokeWidth={0.6}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = -Math.PI / 2 + (i - 4) * 0.32;
            return <circle key={i} cx={cx} cy={g.mouth} r={2.4} style={{ ['--dx' as string]: `${Math.cos(a) * 46}px`, ['--dy' as string]: `${Math.sin(a) * 46}px` }} />;
          })}
        </g>
      )}
      {boom && <path key={`boom-${v.fx.boomAt}`} className="boom" d="M0 -40 L9 -12 L38 -12 L14 4 L24 32 L0 15 L-24 32 L-14 4 L-38 -12 L-9 -12 Z" transform={`translate(${cx} ${g.mouth - 10})`} fill="#FFC531" stroke="#FF6A13" strokeWidth={2} />}
    </svg>
  );
}

export function vesselFxClass(v: Vessel, now: number): string {
  const cls: string[] = [];
  if (recent(v.fx.splashAt, now, 900) || recent(v.fx.boomAt, now, 900)) cls.push('shake');
  return cls.join(' ');
}

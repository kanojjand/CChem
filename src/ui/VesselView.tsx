// Draws a vessel with its contents: liquid color and level, precipitate, metal pieces,
// bubbles and short effects (cloudiness, splash, smell, brown gas, charring, spill),
// electrodes when electrolysis runs, and broken glass when the vessel burst.

import { COLORS, METALS, SOLUBLE_SOLIDS, compound, hasCompound } from '../engine/data';
import { MELTS } from '../engine/physics';
import { solutionColor } from '../engine/color';
import { phOf } from '../engine/actions';
import { conductivity } from '../engine/apparatus';
import { EPS, amt, waterVolume, type Vessel, type VesselKind } from '../engine/vessel';

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
  rim?: 'tube' | 'scale';
}

export const GEO: Record<VesselKind, Geo> = {
  tube: {
    w: 60, h: 236,
    inner: 'M12 14 V196 A18 18 0 0 0 48 196 V14 Z',
    outline: 'M12 14 V196 A18 18 0 0 0 48 196 V14',
    xL: 12, xR: 48, bottom: 214, maxTop: 34, mouth: 12, rim: 'tube'
  },
  beaker: {
    w: 112, h: 132,
    inner: 'M18 8 V120 A8 8 0 0 0 26 128 H86 A8 8 0 0 0 94 120 V8 Z',
    outline: 'M10 8 H18 V120 A8 8 0 0 0 26 128 H86 A8 8 0 0 0 94 120 V8',
    xL: 18, xR: 94, bottom: 128, maxTop: 22, mouth: 6, rim: 'scale'
  },
  beaker250: {
    w: 128, h: 168,
    inner: 'M18 8 V156 A8 8 0 0 0 26 164 H102 A8 8 0 0 0 110 156 V8 Z',
    outline: 'M10 8 H18 V156 A8 8 0 0 0 26 164 H102 A8 8 0 0 0 110 156 V8',
    xL: 18, xR: 110, bottom: 164, maxTop: 22, mouth: 6, rim: 'scale'
  },
  flask: {
    w: 120, h: 168,
    inner: 'M48 10 V60 L14 152 Q11 164 24 164 H96 Q109 164 106 152 L72 60 V10 Z',
    outline: 'M42 8 H48 V60 L14 152 Q11 164 24 164 H96 Q109 164 106 152 L72 60 V8 H78',
    xL: 20, xR: 100, bottom: 164, maxTop: 44, mouth: 6
  }
};

const WATER = '#CFE6F7';
const OILY = '#EFE4C2';
const FX_RECENT = 5000;

const recent = (t: number | undefined, now: number, ms = FX_RECENT) => t != null && now - t >= 0 && now - t < ms;

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function solidColor(id: string): string {
  if (METALS[id]) return METALS[id].color;
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

/** Liquid surface height for the given fill fraction; a cone fills its wide bottom first. */
function surfaceY(g: Geo, kind: VesselKind, fill: number): number {
  const f = kind === 'flask' ? 1 - Math.pow(1 - fill, 0.6) : Math.sqrt(fill);
  return g.bottom - f * (g.bottom - g.maxTop);
}

function MetalPieces({ id, n, g, yBase, floatY, skating }: { id: string; n: number; g: Geo; yBase: number; floatY: number | null; skating: boolean }) {
  const m = METALS[id];
  const color = m?.color ?? '#9AA3AB';
  const cx = (g.xL + g.xR) / 2;
  const span = g.xR - g.xL;
  const stroke = 'rgba(0,0,0,0.28)';
  // Bigger amounts draw more pieces.
  const many = Math.min(4, Math.max(1, Math.round(Math.log2(1 + n / 4))));
  if (n < 0.6) {
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
        <g fill="none" stroke={color} strokeWidth={4} strokeLinecap="round">
          {Array.from({ length: Math.min(2, many) }, (_, k) => (
            <path key={k} transform={`translate(${k * 8 - 4} ${-k * 6})`}
              d={`M${cx - 10} ${yBase - 2} C${cx - 2} ${yBase - 12} ${cx + 6} ${yBase + 6} ${cx + 12} ${yBase - 8} C${cx + 6} ${yBase - 16} ${cx - 4} ${yBase - 2} ${cx - 10} ${yBase - 14} C${cx - 4} ${yBase - 24} ${cx + 6} ${yBase - 10} ${cx + 10} ${yBase - 22}`} />
          ))}
        </g>
      );
    case 'ribbon':
      return <path d={`M${cx - 12} ${yBase - 3} L${cx - 4} ${yBase - 15} L${cx + 4} ${yBase - 5} L${cx + 12} ${yBase - 18}`} fill="none" stroke={color} strokeWidth={4.5} strokeLinejoin="round" />;
    case 'filings':
      return (
        <g fill={color}>
          {Array.from({ length: 14 + many * 12 }, (_, i) => {
            const x = g.xL + 3 + rand(i + 1) * (span - 6);
            return <rect key={i} x={x} y={yBase - 2 - rand(i + 40) * (5 + many * 2)} width={2.4} height={1.4} transform={`rotate(${rand(i + 7) * 180} ${x} ${yBase - 2})`} />;
          })}
        </g>
      );
    case 'piece': {
      const y = floatY ?? yBase - 6;
      const r = Math.min(10, 4 + Math.sqrt(n));
      return (
        <g className={skating ? 'skate' : undefined}>
          <ellipse cx={cx} cy={y} rx={floatY != null ? r * 0.7 : r} ry={floatY != null ? r * 0.55 : r * 0.75} fill={color} stroke={stroke} strokeWidth={0.8} />
        </g>
      );
    }
    case 'foil':
      return <path d={`M${cx - 11} ${yBase - 3} l6 -9 l14 2 l-4 8 z`} fill={color} stroke={stroke} strokeWidth={0.6} />;
    case 'crystals':
      return (
        <g fill={color} stroke={stroke} strokeWidth={0.6}>
          <path d={`M${cx - 8} ${yBase - 2} l3 -8 l3 8 z M${cx} ${yBase - 2} l4 -11 l3 11 z M${cx + 8} ${yBase - 2} l2 -6 l3 6 z`} />
        </g>
      );
    default: // granules
      return (
        <g fill={color} stroke={stroke} strokeWidth={0.8}>
          {Array.from({ length: many }, (_, k) => (
            <g key={k} transform={`translate(${(k % 2 ? 1 : -1) * k * 5} ${-Math.floor(k / 2) * 7})`}>
              <path d={`M${cx - 12} ${yBase - 6} l7 -5 l7 3 l-1 8 l-9 2 z`} />
              <path d={`M${cx} ${yBase - 2} l8 -4 l6 5 l-4 6 l-8 -1 z`} />
              <path d={`M${cx - 6} ${yBase - 12} l6 2 l-2 6 l-6 -2 z`} />
            </g>
          ))}
        </g>
      );
  }
}

function Electrodes({ v, g, now }: { v: Vessel; g: Geo; now: number }) {
  const cond = conductivity(v);
  const cx = (g.xL + g.xR) / 2;
  const left = cx - (g.xR - g.xL) * 0.22;
  const right = cx + (g.xR - g.xL) * 0.22;
  const bottom = g.bottom - 10;
  const plated = Object.entries(v.electro?.cathode ?? {}).filter(([, n]) => n > 0.01);
  const coat = plated.length ? solidColor(plated[plated.length - 1][0]) : null;
  const coatH = plated.length ? Math.min(60, 8 + plated.reduce((s, [, n]) => s + n, 0) * 6) : 0;
  const active = v.fx.gas.some((x) => x.until > now) && cond !== 'none';
  const glow = cond === 'strong' ? 1 : cond === 'weak' ? 0.35 : 0;
  return (
    <g>
      <path d={`M${left} ${g.mouth - 30} V${g.mouth - 40} H${right} V${g.mouth - 30}`} fill="none" stroke="var(--muted)" strokeWidth={1.6} />
      <rect x={cx - 12} y={g.mouth - 50} width={24} height={14} rx={3} fill="var(--rack)" />
      <circle cx={cx} cy={g.mouth - 58} r={6} fill={glow ? '#FFD84A' : 'var(--panel)'} stroke="var(--muted)" strokeWidth={1.2} opacity={glow ? 0.6 + glow * 0.4 : 1} />
      {glow > 0 && <circle cx={cx} cy={g.mouth - 58} r={12} fill="#FFD84A" opacity={glow * 0.35} />}
      <rect x={left - 3} y={g.mouth - 30} width={6} height={bottom - g.mouth + 30} rx={2} fill="#3B3F45" />
      <rect x={right - 3} y={g.mouth - 30} width={6} height={bottom - g.mouth + 30} rx={2} fill="#3B3F45" />
      {coat && <rect x={left - 4} y={bottom - coatH} width={8} height={coatH} rx={2} fill={coat} />}
      <text x={left} y={g.mouth - 33} fontSize={9} textAnchor="middle" fill="var(--muted)" fontWeight={700}>−</text>
      <text x={right} y={g.mouth - 33} fontSize={9} textAnchor="middle" fill="var(--muted)" fontWeight={700}>+</text>
      {active && Array.from({ length: 8 }, (_, i) => (
        <circle key={i} className="bubble" cx={(i % 2 ? right : left) + (rand(i) - 0.5) * 6} cy={bottom - 6 - rand(i + 3) * 20} r={1.4 + (i % 3) * 0.6}
          style={{ animationDelay: `${(i * 0.21).toFixed(2)}s`, animationDuration: '1.3s' }} />
      ))}
    </g>
  );
}

function Shards({ g }: { g: Geo }) {
  const cx = (g.xL + g.xR) / 2;
  return (
    <g className="glass-line">
      <path d={`M${g.xL} ${g.bottom} L${g.xL + 6} ${g.bottom - 30} L${g.xL + 2} ${g.bottom - 52}`} />
      <path d={`M${g.xR} ${g.bottom} L${g.xR - 8} ${g.bottom - 24} L${g.xR - 2} ${g.bottom - 44}`} />
      <path d={`M${g.xL - 4} ${g.bottom + 2} H${g.xR + 4}`} />
      <path d={`M${cx - 30} ${g.bottom + 4} l8 -6 l6 6 z M${cx + 18} ${g.bottom + 4} l6 -8 l9 8 z M${cx - 6} ${g.bottom + 4} l4 -4 l4 4 z`} fill="var(--glass-fill)" />
    </g>
  );
}

/** Salts that come as crystals (from the shelf or out of a solution) are drawn as small crystals. */
const CRYSTALLINE = new Set([...Object.keys(SOLUBLE_SOLIDS), 'I2', 'KNO2', 'CuSO4·5H2O', 'CoCl2·6H2O']);
const isCrystal = (id: string) => CRYSTALLINE.has(id) || (hasCompound(id) && compound(id).phase === 'aq' && !!compound(id).cation);

function CrystalLayer({ x0, x1, y, h, color, seed }: { x0: number; x1: number; y: number; h: number; color: string; seed: number }) {
  const n = Math.max(3, Math.round((x1 - x0) / 7));
  const rows = h > 12 ? 2 : 1;
  return (
    <g fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.5}>
      {Array.from({ length: n * rows }, (_, i) => {
        const r = Math.floor(i / n);
        const cx = x0 + 3 + ((i % n) + rand(seed + i) * 0.6) * ((x1 - x0 - 6) / n);
        const by = y + h - r * (h / 2);
        const w = 2.4 + rand(seed + i * 3) * 2;
        const ht = Math.min(h / rows, 4 + rand(seed + i * 7) * 5);
        return <path key={i} d={`M${cx - w} ${by} L${cx} ${by - ht} L${cx + w} ${by} L${cx} ${by + 1.2} Z`} />;
      })}
    </g>
  );
}

function meltColor(id: string, t: number, base: string): string {
  if (id === 'S') return t > 190 ? '#7A2E12' : '#E9A93A';
  return base;
}

export function VesselSVG({ v, now }: { v: Vessel; now: number }) {
  const g = GEO[v.kind];
  const uid = `v-${v.id}`;
  const cx = (g.xL + g.xR) / 2;
  const span = g.xR - g.xL;

  if (v.broken) {
    return (
      <svg viewBox={`0 ${-48} ${g.w} ${g.h + 48}`} className="vessel-svg" aria-hidden="true" style={{ overflow: 'visible' }}>
        <ellipse cx={cx} cy={g.bottom + 6} rx={span * 0.8} ry={5} fill="var(--bubble)" opacity={0.25} />
        <Shards g={g} />
        {recent(v.fx.boomAt, now, 1300) && <path key={`boom-${v.fx.boomAt}`} className="boom" d="M0 -40 L9 -12 L38 -12 L14 4 L24 32 L0 15 L-24 32 L-14 4 L-38 -12 L-9 -12 Z" transform={`translate(${cx} ${g.bottom - 40}) scale(1.4)`} fill="#FFC531" stroke="#FF6A13" strokeWidth={2} />}
      </svg>
    );
  }

  const fill = Math.min(1, v.volume / v.capacity);
  const hasLiquid = v.volume > 0.005;
  let yTop = surfaceY(g, v.kind, fill);
  if (hasLiquid) yTop = Math.min(yTop, g.bottom - 5);
  const pH = phOf(v);
  const colored = hasLiquid ? solutionColor(v.aq, v.volume, v.inds, pH) : null;
  const oily = amt(v.aq, 'H2SO4c') > EPS && waterVolume(v) <= 0.05;
  const liquid = colored ?? (oily ? OILY : WATER);

  const solids = Object.entries(v.solids).filter(([, n]) => n > 1e-4);
  const melted = (id: string) => MELTS[id] != null && v.temp >= MELTS[id];
  const metals = solids.filter(([id]) => METALS[id]);
  const charred = amt(v.solids, 'C') > EPS && v.fx.charAt != null;
  const ice = amt(v.solids, 'H2O(s)');
  const floatingS = hasLiquid && amt(v.solids, 'S') > EPS && !melted('S');
  const rest = solids.filter(([id]) => !METALS[id] && id !== 'H2O(s)' && !(id === 'C' && charred) && !(id === 'S' && floatingS));
  const firstPrecip = rest[0]?.[0];

  const maxLayer = v.kind === 'tube' ? 34 : 26;
  let yb = g.bottom;
  const layers = rest.map(([id, n]) => {
    const h = Math.min(maxLayer, 4 + 9 * Math.log2(1 + n * 2) * (v.kind === 'tube' ? 1 : 0.6));
    const layer = { id, y: yb - h, h, color: melted(id) ? meltColor(id, v.temp, solidColor(id)) : solidColor(id), melt: melted(id), crystal: !melted(id) && isCrystal(id) };
    yb -= h;
    return layer;
  });

  const gases = v.fx.gas.filter((gas) => gas.until > now && gas.id !== 'H2O');
  const boiling = !!v.boiling;
  const steam = hasLiquid && (boiling || v.temp > 75);
  const bubbleCount = Math.min(16, gases.reduce((s, gas) => s + Math.round(gas.amount * 3) + 3, 0) + (boiling ? 6 : 0));
  const running = recent(v.fx.runAt, now, 7000) && hasLiquid;
  const brown = recent(v.fx.brownAt, now, 6000) || gases.some((gas) => gas.id === 'NO' || gas.id === 'Br2');
  const violet = recent(v.fx.vaporAt, now, 2500) || gases.some((gas) => gas.id === 'I2');
  const smoke = recent(v.fx.smokeAt, now, 5000);
  const drops = recent(v.fx.dropsAt, now, 8000);
  const glow = recent(v.fx.glowAt, now, 3500);
  const volcano = recent(v.fx.volcanoAt, now, 4500);
  const flame = v.fx.flame && recent(v.fx.flame.at, now, 2600) && hasLiquid ? v.fx.flame : null;
  const green = gases.some((gas) => gas.id === 'Cl2');
  const smell = recent(v.fx.smellAt, now, 5000) || gases.some((gas) => gas.id === 'NH3' || gas.id === 'SO2');
  const splash = recent(v.fx.splashAt, now, 1600);
  const spill = recent(v.fx.spillAt, now, 4000);
  const boom = recent(v.fx.boomAt, now, 1300);

  return (
    <svg viewBox={`0 ${-48} ${g.w} ${g.h + 48}`} className="vessel-svg" aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={`${uid}-in`}><path d={g.inner} /></clipPath>
        <clipPath id={`${uid}-liq`}><rect x={0} y={yTop} width={g.w} height={g.h} /></clipPath>
      </defs>
      {spill && <ellipse key={`spill-${v.fx.spillAt}`} className="spill" cx={cx} cy={g.bottom + 6} rx={span * 0.9} ry={5} fill={liquid} />}
      <path d={g.inner} className="glass-back" />
      <g clipPath={`url(#${uid}-in)`}>
        {hasLiquid && (
          <>
            <rect x={0} y={yTop} width={g.w} height={g.h} fill={liquid} opacity={colored ? 0.92 : 0.7} />
            <rect x={0} y={yTop} width={g.w} height={2.4} fill="#FFFFFF" opacity={0.55} />
          </>
        )}
        {metals.map(([id, n]) => melted(id) && !hasLiquid ? (
          <ellipse key={id} cx={cx} cy={g.bottom - 4} rx={span / 2 - 4} ry={4} fill={METALS[id].color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.6} />
        ) : (
          <MetalPieces key={id} id={id} n={n} g={g} yBase={g.bottom - 2}
            floatY={METALS[id].floats && hasLiquid ? yTop - 1 : null} skating={!!METALS[id].floats && running} />
        ))}
        {layers.map((l) => l.crystal ? (
          <g key={`${l.id}-${v.fx.precipAt ?? 0}`} className="precip-layer"><CrystalLayer x0={g.xL} x1={g.xR} y={l.y} h={l.h} color={l.color} seed={l.id.length * 7} /></g>
        ) : (
          <path key={`${l.id}-${v.fx.precipAt ?? 0}`} className={l.melt ? 'melt-layer' : 'precip-layer'} d={l.melt ? `M${g.xL - 2} ${l.y + 3} Q${cx} ${l.y - 2} ${g.xR + 2} ${l.y + 3} V${l.y + l.h + 30} H${g.xL - 2} Z` : wave(g.xL, g.xR, l.y, l.h + 30)} fill={l.color} opacity={0.95} />
        ))}
        {glow && <rect key={`glow-${v.fx.glowAt}`} className="glow" x={0} y={yb - 6} width={g.w} height={g.bottom - yb + 10} fill="#FF7A1A" />}
        {floatingS && <path d={wave(g.xL, g.xR, yTop - 1, 4, 0.8)} fill={COLORS.yellow.hex} />}
        {ice > EPS && Array.from({ length: Math.min(3, Math.max(1, Math.round(ice / 150))) }, (_, i) => {
          const size = Math.min(span / 3, 14);
          const y0 = hasLiquid ? yTop - size * 0.35 : g.bottom - size - 2 - i * 3;
          return <rect key={i} x={g.xL + 4 + i * (size + 3)} y={y0} width={size} height={size} rx={3} fill="#EAF7FD" stroke="#9CC9DF" strokeWidth={0.8} opacity={0.9} transform={`rotate(${(i - 1) * 9} ${g.xL + 4 + i * (size + 3) + size / 2} ${y0 + size / 2})`} />;
        })}
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
        {charred && <rect key={`char-in-${v.fx.charAt}`} className="char" x={0} y={g.mouth} width={g.w} height={g.h} fill="#1A1714" />}
      </g>
      {charred && (
        <path key={`char-out-${v.fx.charAt}`} className="char char-top" d={`M${g.xL + 1} ${g.mouth + 4} V${g.mouth - 26} q${span / 4} -14 ${span / 2} -6 t${span / 2 - 2} 4 V${g.mouth + 4} Z`} fill="#1A1714" />
      )}
      <path d={g.outline} className="glass-line" />
      {g.rim === 'tube' && <rect x={7} y={8} width={46} height={8} rx={4} className="glass rim" />}
      {g.rim === 'scale' && (
        <path d={Array.from({ length: 4 }, (_, i) => `M${g.xR - 10} ${g.maxTop + 8 + i * ((g.bottom - g.maxTop - 16) / 4)}h10`).join(' ')} stroke="var(--glass)" strokeWidth={2} />
      )}
      {v.electro && <Electrodes v={v} g={g} now={now} />}
      {steam && (
        <g className="steam" fill="none" stroke="var(--steam)" strokeWidth={2.4} strokeLinecap="round">
          <path d={`M${cx - 8} ${g.mouth - 6} q-5 -9 0 -18 t0 -18`} />
          <path d={`M${cx + 6} ${g.mouth - 4} q5 -9 0 -18 t0 -18`} style={{ animationDelay: '0.6s' }} />
        </g>
      )}
      {flame && (
        <g key={`flame-${flame.at}`} className="flame alkali-flame">
          <path d={`M${cx} ${yTop - 34} c7 10 9 16 9 22 a9 9 0 0 1 -18 0 c0 -6 2 -12 9 -22z`} fill={flame.color} opacity={0.9} />
          <path d={`M${cx} ${yTop - 20} c3 5 4 8 4 10 a4 4 0 0 1 -8 0 c0 -2 1 -5 4 -10z`} fill="#FFF0FF" opacity={0.8} />
        </g>
      )}
      {drops && Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={i % 2 ? g.xR - 4 : g.xL + 4} cy={g.mouth + 12 + i * 7} r={1.6} fill="#CFE6F7" stroke="var(--glass)" strokeWidth={0.5} />
      ))}
      {violet && <ellipse className="brown-gas" cx={cx} cy={g.mouth - 12} rx={span / 2 + 8} ry={14} fill="#8A3FB8" />}
      {smoke && <ellipse className="brown-gas smoke" cx={cx} cy={g.mouth - 10} rx={span / 2 + 10} ry={13} fill="#F4F4F4" />}
      {volcano && (
        <g key={`volcano-${v.fx.volcanoAt}`} className="volcano">
          {Array.from({ length: 14 }, (_, i) => {
            const a = -Math.PI / 2 + (rand(i + 1) - 0.5) * 1.6;
            const d = 30 + rand(i + 9) * 40;
            return <circle key={i} className="spark" cx={cx} cy={g.mouth} r={1.8} fill={i % 3 ? '#FFB31A' : '#FF5A1F'}
              style={{ ['--dx' as string]: `${Math.cos(a) * d}px`, ['--dy' as string]: `${Math.sin(a) * d}px`, animationDelay: `${(rand(i + 4) * 0.8).toFixed(2)}s` }} />;
          })}
          <path d={`M${cx - 14} ${g.mouth + 2} q14 -22 28 0 z`} fill={COLORS.darkGreen.hex} opacity={0.9} />
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
      {green && <ellipse className="brown-gas" cx={cx} cy={g.mouth - 14} rx={span / 2 + 6} ry={12} fill="#B9D24A" />}
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

/** Gas collector: a measuring cylinder upside down in a trough of water, or a tube held
 *  upside down (gases lighter than air) or mouth up (heavier gases) to collect by displacing air. */
export function CollectorSVG({ ml, capacity, color, method = 'water' }: { ml: number; capacity: number; color: string | null; method?: 'water' | 'up' | 'down' }) {
  const top = 10, bottom = 120;
  const gasH = Math.min(1, ml / capacity) * (bottom - top - 6);
  if (method !== 'water') {
    const up = method === 'up';
    // In an upside-down tube the gas fills it from the closed top; in an upright one from the bottom.
    const y = up ? top + 1 : bottom - gasH - 1;
    return (
      <svg viewBox="0 0 110 150" className="collector-svg" aria-hidden="true">
        <rect x={14} y={60} width={24} height={6} rx={2} fill="var(--rack)" />
        <rect x={10} y={20} width={6} height={124} rx={2} fill="var(--rack)" />
        {gasH > 0 && <rect className="gas-fill" x={39} y={y} width={32} height={gasH} rx={3} fill={color ?? 'var(--glass-fill)'} opacity={color ? 0.45 : 1} />}
        {up
          ? <path d={`M38 ${bottom} V${top + 4} A4 4 0 0 1 42 ${top} H68 A4 4 0 0 1 72 ${top + 4} V${bottom}`} className="glass-line" />
          : <path d={`M38 ${top} V${bottom - 4} A4 4 0 0 0 42 ${bottom} H68 A4 4 0 0 0 72 ${bottom - 4} V${top}`} className="glass-line" />}
        {[0.25, 0.5, 0.75].map((f) => <path key={f} d={`M64 ${top + f * (bottom - top)} h8`} stroke="var(--glass)" strokeWidth={1.5} />)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 110 150" className="collector-svg" aria-hidden="true">
      <path d="M6 96 V140 A6 6 0 0 0 12 146 H98 A6 6 0 0 0 104 140 V96" className="glass-line" />
      <rect x={7} y={110} width={96} height={35} fill={WATER} opacity={0.7} />
      <rect x={38} y={top} width={34} height={bottom - top} rx={4} fill={WATER} opacity={0.75} />
      {gasH > 0 && <rect className="gas-fill" x={39} y={top + 1} width={32} height={gasH} rx={3} fill={color ?? 'var(--glass-fill)'} opacity={color ? 0.45 : 1} />}
      <path d={`M38 ${bottom} V${top + 4} A4 4 0 0 1 42 ${top} H68 A4 4 0 0 1 72 ${top + 4} V${bottom}`} className="glass-line" />
      {[0.25, 0.5, 0.75].map((f) => <path key={f} d={`M64 ${top + f * (bottom - top)} h8`} stroke="var(--glass)" strokeWidth={1.5} />)}
    </svg>
  );
}

import { COLORS, IONS, type ColorKey, type IndicatorId } from './data';

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = ([r, g, b]: RGB) =>
  '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// ---------------------------------------------------------------- indicators

interface Stop { pH: number; hex: string; name: ColorName }
export type ColorName =
  | 'colorless' | 'crimson' | 'red' | 'pink' | 'orange' | 'yellow' | 'green' | 'blue' | 'violet' | 'paleViolet';

const IND_STOPS: Record<IndicatorId, Stop[]> = {
  phph: [
    { pH: 8.0, hex: '#FFFFFF', name: 'colorless' },
    { pH: 8.6, hex: '#F7B3D3', name: 'pink' },
    { pH: 10.0, hex: '#D1146B', name: 'crimson' }
  ],
  mo: [
    { pH: 3.0, hex: '#E2345A', name: 'pink' },
    { pH: 3.9, hex: '#F27B2B', name: 'orange' },
    { pH: 4.6, hex: '#F2C230', name: 'yellow' }
  ],
  litmus: [
    { pH: 4.8, hex: '#D2283B', name: 'red' },
    { pH: 7.0, hex: '#8A4FB0', name: 'violet' },
    { pH: 8.6, hex: '#2F55C8', name: 'blue' }
  ],
  univ: [
    { pH: 1, hex: '#D9262B', name: 'red' },
    { pH: 4, hex: '#F28A1B', name: 'orange' },
    { pH: 6, hex: '#E7C81C', name: 'yellow' },
    { pH: 7, hex: '#4DAE48', name: 'green' },
    { pH: 9, hex: '#1E7FC9', name: 'blue' },
    { pH: 12, hex: '#5B2C9C', name: 'violet' }
  ]
};

export function indicatorColor(id: IndicatorId, pH: number): { hex: string; name: ColorName } {
  const stops = IND_STOPS[id];
  if (pH <= stops[0].pH) return { hex: stops[0].hex, name: stops[0].name };
  for (let i = 1; i < stops.length; i++) {
    if (pH <= stops[i].pH) {
      const a = stops[i - 1];
      const b = stops[i];
      const t = (pH - a.pH) / (b.pH - a.pH);
      const hex = rgbToHex(mix(hexToRgb(a.hex), hexToRgb(b.hex), t));
      return { hex, name: t < 0.5 ? a.name : b.name };
    }
  }
  const last = stops[stops.length - 1];
  return { hex: last.hex, name: last.name };
}

// ---------------------------------------------------------------- solution color

/**
 * Subtractive mix of every colored species, Beer–Lambert style: each species
 * transmits (color/255)^(c/refC) of each channel.
 * Returns null when the solution is effectively colorless.
 */
export function solutionColor(
  aq: Record<string, number>,
  volumeMl: number,
  inds: Partial<Record<IndicatorId, number>>,
  pH: number | null
): string | null {
  if (volumeMl < 0.01) return null;
  const T: RGB = [1, 1, 1];
  let any = false;
  const apply = (hex: string, strength: number) => {
    if (strength <= 0.002 || hex.toLowerCase() === '#ffffff') return;
    any = true;
    const c = hexToRgb(hex);
    const s = Math.min(strength, 3);
    for (let i = 0; i < 3; i++) T[i] *= Math.pow(Math.max(c[i], 8) / 255, s);
  };

  for (const id in aq) {
    const amt = aq[id];
    if (amt <= 1e-9) continue;
    const ion = IONS[id];
    if (ion?.color && ion.refC) apply(ion.color, amt / volumeMl / ion.refC);
    if (id === 'Fe(SCN)3') apply('#8E0A16', amt / volumeMl / 0.004);
    // Iodine is yellow-brown; with starch even a trace of it is deep blue.
    if (id === 'I2') {
      if ((aq.starch || 0) > 1e-6) apply('#1B2370', amt / volumeMl / 0.0004);
      else apply('#8A4A12', amt / volumeMl / 0.01);
    }
    if (id === 'Br2') apply('#E0861F', amt / volumeMl / 0.03);
    if (id === 'Cl2') apply('#D6E58A', amt / volumeMl / 0.06);
  }
  if (pH != null) {
    for (const key in inds) {
      const drops = inds[key as IndicatorId] || 0;
      if (drops <= 0) continue;
      const { hex } = indicatorColor(key as IndicatorId, pH);
      // About two drops in a 2 mL portion give a full color.
      apply(hex, (drops / volumeMl) * 0.9);
    }
  }
  if (!any) return null;
  return rgbToHex([T[0] * 255, T[1] * 255, T[2] * 255]);
}

export const solidHex = (key?: ColorKey) => (key ? COLORS[key].hex : COLORS.white.hex);

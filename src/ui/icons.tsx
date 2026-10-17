import type { ReactElement } from 'react';
import type { Sign } from '../engine/vessel';

const P = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const IconTables = () => <svg {...P}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 4v16M15 4v16" /></svg>;
export const IconJournal = () => <svg {...P}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6" /></svg>;
export const IconUndo = () => <svg {...P} strokeWidth={2.2}><path d="M9 7 4 12l5 5" /><path d="M4 12h10a6 6 0 0 1 0 12h-2" transform="translate(0 -6)" /></svg>;
export const IconTrash = () => <svg {...P}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
export const IconHand = () => <svg {...P}><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v1.5m0 0a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L5 15.5a1.6 1.6 0 0 1 2.6-1.8L8 14" /></svg>;
export const IconQuestion = () => <svg {...P}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></svg>;
export const IconFlame = () => <svg {...P}><path d="M12 3c3 4 6 6.5 6 10.5A6 6 0 0 1 6 13.5c0-2 1-3.6 2.4-5 .2 1.6 1 2.7 2.1 3.2C10.2 9 10.8 6 12 3z" /></svg>;
export const IconWash = () => <svg {...P}><path d="M12 3s5 5.6 5 9.5a5 5 0 0 1-10 0C7 8.6 12 3 12 3z" /><path d="M9.5 13.5a2.5 2.5 0 0 0 2.5 2.5" /></svg>;
export const IconPour = () => <svg {...P}><path d="M4 7h9l-1 13H5z" /><path d="M13 9l5-4 2 2-5 5" /></svg>;
export const IconAlert = () => <svg {...P}><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>;
export const IconUser = () => <svg {...P}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>;
export const IconReset = () => <svg {...P}><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v5h5" /></svg>;
export const IconZoom = () => <svg {...P}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" /></svg>;
export const IconGrid = () => <svg {...P}><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>;
export const IconClose = () => <svg {...P}><path d="M6 6l12 12M18 6 6 18" /></svg>;

const SIGN_PATHS: Record<Sign, ReactElement> = {
  precip: <><circle cx="7" cy="17" r="2" /><circle cx="12" cy="18" r="2" /><circle cx="17" cy="17" r="2" /><circle cx="10" cy="13" r="1.5" /><circle cx="15" cy="12" r="1.2" /></>,
  gas: <><circle cx="9" cy="16" r="3" /><circle cx="15" cy="10" r="2.4" /><circle cx="10" cy="6" r="1.6" /></>,
  color: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  heat: <><path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z" /><path d="M12 9v7" /></>,
  dissolve: <><path d="M5 9h14l-2 11H7z" /><path d="M9 13h.01M12 15h.01M15 12h.01" /></>,
  smell: <><path d="M8 20c-2-3 2-5 0-8s2-5 0-8" /><path d="M14 20c-2-3 2-5 0-8s2-5 0-8" /></>,
  deposit: <><rect x="6" y="5" width="12" height="14" rx="2" /><path d="M6 14h12" /><path d="M8 17h2M12 17h2" /></>,
  light: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>
};

export const SignIcon = ({ sign }: { sign: Sign }) => <svg {...P}>{SIGN_PATHS[sign]}</svg>;

export function BottleIcon({ color, solid }: { color: string; solid?: boolean }) {
  return (
    <svg viewBox="0 0 30 40" aria-hidden="true">
      <path d="M8 6h14v4l4 6v20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V16l4-6z" className="glass" />
      {solid
        ? <g fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.6}><circle cx="11" cy="32" r="3" /><circle cx="17" cy="33" r="3.2" /><circle cx="21" cy="29" r="2.6" /><circle cx="14" cy="28" r="2.4" /></g>
        : <path d="M4.6 20h20.8v16a2 2 0 0 1-2 2H6.6a2 2 0 0 1-2-2z" fill={color} opacity={0.95} />}
      <rect x="9" y="2" width="12" height="5" rx="1.5" fill="var(--rack)" />
    </svg>
  );
}

export function LampSVG({ lit, color, width = 70, height = 122 }: { lit: boolean; color?: string; width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 76 132" aria-hidden="true">
      {lit && (
        <g className="flame">
          <path d="M38 6c10 16 14 26 14 34a14 14 0 0 1-28 0c0-8 4-18 14-34z" fill={color ?? 'var(--heat)'} />
          <path d="M38 24c5 8 7 13 7 17a7 7 0 0 1-14 0c0-4 2-9 7-17z" fill="#FFD25A" />
        </g>
      )}
      <rect x="33" y="54" width="10" height="14" rx="2" fill="var(--rack)" />
      <path d="M12 128c0-30 6-52 26-60 20 8 26 30 26 60z" className="glass" />
      <path d="M15 128c1-14 3-24 6-30h34c3 6 5 16 6 30z" fill="#BFE3F2" opacity="0.8" />
    </svg>
  );
}

export function FlameOnly() {
  return (
    <svg viewBox="0 0 34 60" className="under-flame" aria-hidden="true">
      <g className="flame">
        <path d="M17 2c7 11 10 18 10 24a10 10 0 0 1-20 0c0-6 3-13 10-24z" fill="var(--heat)" />
        <path d="M17 15c3.5 5.5 5 9 5 12a5 5 0 0 1-10 0c0-3 1.5-6.5 5-12z" fill="#FFD25A" />
      </g>
      <rect x="12" y="38" width="10" height="9" rx="2" fill="var(--rack)" />
      <path d="M4 60c0-7 4-12 13-14 9 2 13 7 13 14z" className="glass" />
    </svg>
  );
}

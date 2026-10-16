import { useLayoutEffect, useRef, useState } from 'react';
import type { Lang } from '../engine/data';
import { REAGENT_BY_ID } from '../engine/data';
import { ROOM_T, isEmpty, type Vessel, type VesselKind } from '../engine/vessel';
import type { Strings } from '../i18n/types';
import type { Extra } from '../i18n/extra';
import { COLLECTOR_ID, MAX_VESSELS, SPEEDS, type Lab } from '../state/lab';
import { Formula } from './Formula';
import { FlameOnly, IconHand, LampSVG } from './icons';
import { dragHandlers, useDrag, type DragItem } from './drag';
import { CollectorSVG, GEO, VesselSVG, vesselFxClass } from './VesselView';

/** Number of a vessel among vessels of its kind, e.g. "Tube 3". */
export function vesselLabel(lab: Lab, v: Vessel, x: Extra): string {
  const same = lab.vessels.filter((o) => x.vesselShort[o.kind] === x.vesselShort[v.kind]);
  const n = same.indexOf(v) + 1;
  return same.length > 1 ? `${x.vesselShort[v.kind]} ${n}` : x.vesselShort[v.kind];
}

export function vesselShort(lab: Lab, v: Vessel, x: Extra): string {
  if (v.kind === 'tube') return String(lab.vessels.filter((o) => o.kind === 'tube').indexOf(v) + 1);
  return vesselLabel(lab, v, x);
}

export function targetLabel(lab: Lab, id: string, x: Extra): string {
  if (id === COLLECTOR_ID) return x.collector.name;
  return lab.has(id) ? vesselLabel(lab, lab.vessel(id), x) : id;
}

/** Short list of what went into a vessel, e.g. "CuSO4 + NaOH". */
export function AddedList({ v, lang, max = 3 }: { v: Vessel; lang: Lang; max?: number }) {
  const items = v.added.slice(-max);
  return (
    <>
      {v.added.length > max && '… + '}
      {items.map((id, i) => {
        const r = REAGENT_BY_ID[id];
        return (
          <span key={`${id}-${i}`}>
            {i > 0 && ' + '}
            {r?.indicator ? r.name[lang].toLowerCase() : <Formula f={r?.formula ?? id} />}
          </span>
        );
      })}
    </>
  );
}

function BuretteSVG({ fraction, open }: { fraction: number; open: boolean }) {
  const top = 6, bottom = 150;
  const level = top + (1 - fraction) * (bottom - top - 10);
  return (
    <svg viewBox="0 0 40 200" className="burette-svg" aria-hidden="true">
      <rect x={4} y={0} width={4} height={200} rx={2} fill="var(--rack)" />
      <rect x={4} y={60} width={16} height={4} rx={2} fill="var(--rack)" />
      <rect x={17} y={top} width={10} height={bottom - top} rx={3} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={1.6} />
      <rect x={18} y={level} width={8} height={bottom - level - 1} fill="#DCEBF7" />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M19 ${top + 6 + i * 13.5} h4`} stroke="var(--glass)" strokeWidth={1} />)}
      <path d={`M20 ${bottom} L22 ${bottom + 18} L24 ${bottom}`} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={1.4} />
      <rect x={14} y={bottom + 4} width={16} height={5} rx={2} fill={open ? 'var(--ok)' : 'var(--muted)'} />
      {open && <circle className="drip" cx={22} cy={bottom + 22} r={2} fill="#9FC7EA" />}
    </svg>
  );
}

function VesselButton({ v, lab, x, now, over, onDrop }: {
  v: Vessel; lab: Lab; x: Extra; now: number; over: boolean;
  onDrop: (item: DragItem, target: string) => void;
}) {
  const selected = lab.selected === v.id;
  const handlers = dragHandlers({ kind: 'vessel', id: v.id }, {
    onTap: () => lab.select(v.id),
    onDrop: (t) => onDrop({ kind: 'vessel', id: v.id }, t)
  });
  const dT = v.temp - ROOM_T;
  const burette = lab.burette?.vessel === v.id ? lab.burette : null;
  const cls = ['vessel', v.kind, vesselFxClass(v, now), v.heating ? 'is-heating' : '', over ? 'drop-hover' : '', burette ? 'has-burette' : '', v.broken ? 'is-broken' : '']
    .filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} data-drop={v.id} aria-pressed={selected} aria-label={vesselLabel(lab, v, x)} {...handlers}>
      {burette && <BuretteSVG fraction={(burette.capacity - burette.used) / burette.capacity} open={burette.flow} />}
      {Math.abs(dT) > 1.5 && !v.broken && <span className={`temp ${dT > 0 ? 'hot' : 'cold'}`}>{Math.round(v.temp)} °C</span>}
      <VesselSVG v={v} now={now} />
      {v.heating && !v.broken && <FlameOnly />}
      <span className="num">{v.broken ? '!' : vesselShort(lab, v, x)}</span>
    </button>
  );
}

const KINDS: VesselKind[] = ['tube', 'beaker', 'beaker250', 'flask'];

export function Bench({ lab, s, x, lang, now, touch, onDrop, onLampTap, onAddVessel }: {
  lab: Lab; s: Strings; x: Extra; lang: Lang; now: number; touch: boolean;
  onDrop: (item: DragItem, target: string) => void;
  onLampTap: () => void;
  onAddVessel: (kind: VesselKind) => void;
}) {
  const drag = useDrag();
  const over = drag?.over ?? null;
  const tubes = lab.vessels.filter((v) => v.kind === 'tube');
  const others = lab.vessels.filter((v) => v.kind !== 'tube');
  const lampHandlers = dragHandlers({ kind: 'lamp' }, { onTap: onLampTap, onDrop: (t) => onDrop({ kind: 'lamp' }, t) });
  const lampBusy = lab.heating != null;
  const [menu, setMenu] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string[]>([]);

  // Delivery tubes are drawn over the scene between the vessels they connect.
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const base = scene.getBoundingClientRect();
    const mouth = (id: string) => {
      const el = scene.querySelector(`[data-drop="${id}"] svg`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (id === COLLECTOR_ID) return { x: r.left - base.left + r.width * 0.5, y: r.top - base.top + r.height * 0.86, top: r.top - base.top + r.height * 0.6 };
      const v = lab.vessel(id);
      const g = GEO[v.kind];
      const k = r.height / (g.h + 48);
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + (48 + g.mouth) * k, top: r.top - base.top + (48 + g.mouth) * k, bottom: r.top - base.top + (48 + g.bottom - 14) * k };
    };
    const next: string[] = [];
    for (const [from, to] of Object.entries(lab.tubes)) {
      const a = mouth(from);
      const b = mouth(to);
      if (!a || !b) continue;
      const lift = Math.min(a.y, b.top) - 46;
      const end = to === COLLECTOR_ID ? b.y : ((b as { bottom?: number }).bottom ?? b.y);
      next.push(`M${a.x} ${a.y + 6} V${lift + 16} Q${a.x} ${lift} ${a.x + Math.sign(b.x - a.x) * 16} ${lift} H${b.x - Math.sign(b.x - a.x) * 16} Q${b.x} ${lift} ${b.x} ${lift + 16} V${end}`);
    }
    const key = next.join('|');
    setPaths((prev) => (prev.join('|') === key ? prev : next));
  });

  const ml = lab.collectorMl();
  const mainGas = Object.entries(lab.collector.gases).sort((a, b) => b[1] - a[1])[0]?.[0];
  const gasColor = mainGas === 'Cl2' ? '#C9DD5A' : mainGas === 'NO2' || mainGas === 'NO' ? '#C7653A' : null;
  const collectorUsed = Object.values(lab.tubes).includes(COLLECTOR_ID) || ml > 0;

  return (
    <main className="bench">
      <div className="bench-bar">
        <div className="hint" role="note">
          <IconHand />
          <span>{touch ? s.hintTouch : s.hint}</span>
        </div>
        <div className="add-vessel">
          <button type="button" className="btn small" onClick={() => setMenu((m) => !m)} aria-expanded={menu} disabled={lab.vessels.length >= MAX_VESSELS}
            title={lab.vessels.length >= MAX_VESSELS ? x.noRoom : undefined}>
            + {x.addVessel}
          </button>
          {menu && (
            <div className="menu" role="menu">
              {KINDS.map((k) => (
                <button key={k} type="button" role="menuitem" onClick={() => { setMenu(false); onAddVessel(k); }}>{x.vessel[k]}</button>
              ))}
            </div>
          )}
        </div>
        <div className="speed" title={x.speed.hint}>
          <span>{x.speed.label}</span>
          <div className="seg" role="group" aria-label={x.speed.label}>
            {SPEEDS.map((sp) => (
              <button key={sp} type="button" aria-pressed={lab.speed === sp} onClick={() => lab.setSpeed(sp)}>×{sp}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="scene" ref={sceneRef}>
        {tubes.length > 0 && (
          <div className="rack">
            <div className="rack-legs" />
            {tubes.map((v) => <VesselButton key={v.id} v={v} lab={lab} x={x} now={now} over={over === v.id} onDrop={onDrop} />)}
          </div>
        )}
        {others.map((v) => <VesselButton key={v.id} v={v} lab={lab} x={x} now={now} over={over === v.id} onDrop={onDrop} />)}
        <button type="button" className={`item collector ${lab.selected === COLLECTOR_ID ? 'is-selected' : ''} ${over === COLLECTOR_ID ? 'drop-hover' : ''} ${collectorUsed ? '' : 'idle'}`}
          data-drop={COLLECTOR_ID} onClick={() => lab.select(COLLECTOR_ID)} aria-pressed={lab.selected === COLLECTOR_ID}>
          <CollectorSVG ml={ml} capacity={lab.collector.capacityMl} color={gasColor} />
          <span>{x.collector.name}{ml > 0 ? ` · ${Math.round(ml)} ${x.amount.ml}` : ''}</span>
        </button>
        <button type="button" className={`item lamp ${lampBusy ? 'in-use' : ''}`} {...lampHandlers}
          aria-label={lab.heating === lab.selected ? s.stopHeat : s.heat}>
          <LampSVG lit={!lampBusy} />
          <span>{s.lamp}</span>
        </button>
        <svg className="tubes-overlay" aria-hidden="true">
          {paths.map((d, i) => (
            <g key={i}>
              <path d={d} className="tube-line-outer" />
              <path d={d} className="tube-line" />
            </g>
          ))}
        </svg>
      </div>
      <div className="bench-top">
        {lab.vessels.map((v) => (
          <button key={v.id} type="button" className={`legend-item ${isEmpty(v) && !v.added.length ? 'is-empty' : ''}`}
            aria-pressed={lab.selected === v.id} onClick={() => lab.select(v.id)}>
            <b>{vesselShort(lab, v, x)}</b>
            <span className="legend-text">{v.broken ? x.broken.title : v.added.length ? <AddedList v={v} lang={lang} /> : '—'}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

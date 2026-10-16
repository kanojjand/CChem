import type { Lang } from '../engine/data';
import { REAGENT_BY_ID } from '../engine/data';
import { ROOM_T, isEmpty, type Vessel } from '../engine/vessel';
import type { Strings } from '../i18n/types';
import type { Lab } from '../state/lab';
import { Formula } from './Formula';
import { FlameOnly, IconHand, LampSVG } from './icons';
import { dragHandlers, useDrag, type DragItem } from './drag';
import { VesselSVG, vesselFxClass } from './VesselView';

export function vesselLabel(v: Vessel, s: Strings): string {
  return v.kind === 'tube' ? `${s.tube} ${v.id.slice(1)}` : s.beaker;
}

export function vesselShort(v: Vessel, s: Strings): string {
  return v.kind === 'tube' ? v.id.slice(1) : s.beaker;
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

function VesselButton({ v, lab, s, now, over, onDrop }: {
  v: Vessel; lab: Lab; s: Strings; now: number; over: boolean;
  onDrop: (item: DragItem, target: string) => void;
}) {
  const selected = lab.selected === v.id;
  const handlers = dragHandlers({ kind: 'vessel', id: v.id }, {
    onTap: () => lab.select(v.id),
    onDrop: (t) => onDrop({ kind: 'vessel', id: v.id }, t)
  });
  const dT = v.temp - ROOM_T;
  const cls = ['vessel', v.kind, vesselFxClass(v, now), v.heating ? 'is-heating' : '', over ? 'drop-hover' : ''].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} data-drop={v.id} aria-pressed={selected} aria-label={vesselLabel(v, s)} {...handlers}>
      {Math.abs(dT) > 1.5 && <span className={`temp ${dT > 0 ? 'hot' : 'cold'}`}>{Math.round(v.temp)} °C</span>}
      <VesselSVG v={v} now={now} />
      {v.heating && <FlameOnly />}
      <span className="num">{vesselShort(v, s)}</span>
    </button>
  );
}

export function Bench({ lab, s, lang, now, touch, onDrop, onLampTap }: {
  lab: Lab; s: Strings; lang: Lang; now: number; touch: boolean;
  onDrop: (item: DragItem, target: string) => void;
  onLampTap: () => void;
}) {
  const drag = useDrag();
  const over = drag?.over ?? null;
  const tubes = lab.vessels.filter((v) => v.kind === 'tube');
  const beakers = lab.vessels.filter((v) => v.kind === 'beaker');
  const lampHandlers = dragHandlers({ kind: 'lamp' }, { onTap: onLampTap, onDrop: (t) => onDrop({ kind: 'lamp' }, t) });
  const lampBusy = lab.heating != null;

  return (
    <main className="bench">
      <div className="hint" role="note">
        <IconHand />
        <span>{touch ? s.hintTouch : s.hint}</span>
      </div>
      <div className="scene">
        <div className="rack">
          <div className="rack-legs" />
          {tubes.map((v) => <VesselButton key={v.id} v={v} lab={lab} s={s} now={now} over={over === v.id} onDrop={onDrop} />)}
        </div>
        {beakers.map((v) => <VesselButton key={v.id} v={v} lab={lab} s={s} now={now} over={over === v.id} onDrop={onDrop} />)}
        <button type="button" className={`item lamp ${lampBusy ? 'in-use' : ''}`} {...lampHandlers}
          aria-label={lab.heating === lab.selected ? s.stopHeat : `${s.heat}: ${vesselLabel(lab.vessel(lab.selected), s)}`}>
          <LampSVG lit={!lampBusy} />
          <span>{s.lamp}</span>
        </button>
      </div>
      <div className="bench-top">
        {lab.vessels.map((v) => (
          <button key={v.id} type="button" className={`legend-item ${isEmpty(v) && !v.added.length ? 'is-empty' : ''}`}
            aria-pressed={lab.selected === v.id} onClick={() => lab.select(v.id)}>
            <b>{vesselShort(v, s)}</b>
            <span className="legend-text">{v.added.length ? <AddedList v={v} lang={lang} /> : '—'}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

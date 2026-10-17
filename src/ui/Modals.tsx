import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ACTIVITY, COLORS, REAGENT_BY_ID, TABLE_ANIONS, TABLE_CATIONS, solubility, type IndicatorId, type Lang } from '../engine/data';
import { indicatorColor } from '../engine/color';
import { ELEMENTS, type ElementCat, type ElementDef } from '../data/elements';
import { ElementCard, massText } from './ElementCard';
import { fmt, makeH } from '../i18n';
import type { Strings } from '../i18n/types';
import { COLLECTOR_ID, type JournalEntry, type Lab } from '../state/lab';
import type { Extra } from '../i18n/extra';
import { REAGENT_INFO } from '../i18n/reagentInfo';
import { LAB_MORE } from '../i18n/labMore';
import { molarMass } from '../engine/formula';
import { BottleIcon } from './icons';
import { Formula, Rich } from './Formula';
import { IconClose } from './icons';

function Modal({ title, onClose, narrow, tabs, children }: { title: string; onClose: () => void; narrow?: boolean; tabs?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${narrow ? 'narrow' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="×"><IconClose /></button>
        </div>
        {tabs ?? <div />}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

const CATS: ElementCat[] = ['alkali', 'alkaline', 'transition', 'post', 'metalloid', 'nonmetal', 'halogen', 'noble', 'lanthanide', 'actinide'];

/** Next element from `z` in a direction on the displayed grid, or null at the edge. */
function neighbour(z: number, key: string): number | null {
  const cur = ELEMENTS[z - 1];
  let best: ElementDef | undefined;
  for (const el of ELEMENTS) {
    if (key === 'ArrowRight' && el.row === cur.row && el.col > cur.col && (!best || el.col < best.col)) best = el;
    if (key === 'ArrowLeft' && el.row === cur.row && el.col < cur.col && (!best || el.col > best.col)) best = el;
    if (key === 'ArrowDown' && el.col === cur.col && el.row > cur.row && (!best || el.row < best.row)) best = el;
    if (key === 'ArrowUp' && el.col === cur.col && el.row < cur.row && (!best || el.row > best.row)) best = el;
  }
  return best ? best.z : null;
}

const ROMAN = ['IA', 'IIA', 'IIIB', 'IVB', 'VB', 'VIB', 'VIIB', 'VIIIB', 'VIIIB', 'VIIIB', 'IB', 'IIB', 'IIIA', 'IVA', 'VA', 'VIA', 'VIIA', 'VIIIA'];

function Periodic({ s, lang, onAdd }: { s: Strings; lang: Lang; onAdd?: (reagentId: string) => void }) {
  const [sel, setSel] = useState<number>(1);
  const [hl, setHl] = useState<ElementCat | null>(null);
  const cells = useRef<Record<number, HTMLButtonElement | null>>({});
  const card = useRef<HTMLDivElement>(null);
  const e = ELEMENTS[sel - 1];
  const lm = LAB_MORE[lang];
  // The card sits under the table: bring it into view when an element is picked.
  const pick = (z: number) => {
    setSel(z);
    requestAnimationFrame(() => card.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };
  const onKey = (ev: React.KeyboardEvent) => {
    const next = neighbour(sel, ev.key);
    if (next == null) return;
    ev.preventDefault();
    setSel(next);
    cells.current[next]?.focus();
  };
  // Grid: column 1 holds period numbers, row 1 holds group numbers; the f-block goes below.
  const rowOf = (row: number) => row + 1;
  return (
    <>
      <div className="pt-scroll">
        <div className="pt" role="grid" aria-label={s.tablesModal.periodic} onKeyDown={onKey}>
          <div className="pt-corner" style={{ gridColumn: 1, gridRow: 1 }}><span>{lm.pt.group} →</span><span>{lm.pt.period} ↓</span></div>
          {ROMAN.map((r, i) => (
            <div key={`g${i}`} className="pt-head" style={{ gridColumn: i + 2, gridRow: 1 }}><b>{i + 1}</b><span>{r}</span></div>
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map((p) => (
            <div key={`p${p}`} className="pt-period" style={{ gridColumn: 1, gridRow: p + 1 }}>{p}</div>
          ))}
          <div className="pt-ref cat-lanthanide" style={{ gridColumn: 4, gridRow: 7 }}>57–71</div>
          <div className="pt-ref cat-actinide" style={{ gridColumn: 4, gridRow: 8 }}>89–103</div>
          <div className="pt-gap" style={{ gridRow: 9 }} />
          <div className="pt-row-label" style={{ gridColumn: '1 / 4', gridRow: 10 }}>{lm.pt.lanthanides}</div>
          <div className="pt-row-label" style={{ gridColumn: '1 / 4', gridRow: 11 }}>{lm.pt.actinides}</div>
          {ELEMENTS.map((el) => (
            <button key={el.z} type="button" className={`pt-cell cat-${el.cat} ${hl && hl !== el.cat ? 'dim' : ''}`} aria-pressed={sel === el.z}
              ref={(b) => { cells.current[el.z] = b; }} tabIndex={sel === el.z ? 0 : -1}
              style={{ gridColumn: el.col + 1, gridRow: rowOf(el.row) }}
              onClick={() => pick(el.z)} title={`${el.z} ${s.elements[el.z - 1]}`}>
              <span className="pt-z">{el.z}</span>
              <b>{el.sym}</b>
              <span className="pt-name">{s.elements[el.z - 1]}</span>
              <span className="pt-mass">{massText(el, lang)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="pt-legend" role="group">
        {CATS.map((c) => (
          <button key={c} type="button" aria-pressed={hl === c} onClick={() => setHl(hl === c ? null : c)}>
            <i className={`cat-${c}`} />{s.tablesModal.categories[c]}
          </button>
        ))}
        {hl && <button type="button" className="pt-all" onClick={() => setHl(null)}>{lm.pt.showAll}</button>}
      </div>
      <div ref={card}><ElementCard el={e} s={s} lang={lang} onAdd={onAdd} /></div>
    </>
  );
}

function Solubility({ s, lang }: { s: Strings; lang: Lang }) {
  const t = s.tablesModal;
  return (
    <>
      <div className="sol-wrap">
        <table className="sol">
          <thead>
            <tr>
              <th className="row" />
              {TABLE_CATIONS.map((c) => <th key={c}><Formula f={c} /></th>)}
            </tr>
          </thead>
          <tbody>
            {TABLE_ANIONS.map((a) => (
              <tr key={a}>
                <th className="row"><Formula f={a} /></th>
                {TABLE_CATIONS.map((c) => {
                  const e = solubility(c, a);
                  const color = e.color && e.s !== 'R' ? COLORS[e.color] : null;
                  return (
                    <td key={c} className={`s-${e.s}`} title={`${t.solLegend[e.s]}${color ? `, ${color.name[lang]}` : ''}`}>
                      {t.sol[e.s]}
                      {color && <span className="swatch" style={{ background: color.hex }} />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend-line">
        {(['R', 'M', 'N', 'D'] as const).map((k) => <span key={k}><b>{t.sol[k]}</b>{t.solLegend[k]}</span>)}
      </div>
    </>
  );
}

function Activity({ s }: { s: Strings }) {
  return (
    <>
      <div className="series-big">
        {ACTIVITY.map((m) => <span key={m} className={m === 'H2' ? 'h' : ''}>{m === 'H2' ? <Formula f="H2" /> : m}</span>)}
      </div>
      <p className="note">{s.tablesModal.activityNote}</p>
    </>
  );
}

function Indicators({ s }: { s: Strings }) {
  const ids: IndicatorId[] = ['phph', 'litmus', 'mo', 'univ'];
  const cols: [keyof Strings['tablesModal']['indicatorRows'], number][] = [['acid', 2], ['neutral', 7], ['alkaline', 12]];
  return (
    <>
      <table className="ind">
        <thead>
          <tr><th />{cols.map(([k]) => <th key={k}>{s.tablesModal.indicatorRows[k]}</th>)}</tr>
        </thead>
        <tbody>
          {ids.map((id) => (
            <tr key={id}>
              <th>{s.indicators[id]}</th>
              {cols.map(([k, pH]) => {
                const c = indicatorColor(id, pH);
                return <td key={k}><i style={{ background: c.hex }} />{s.indColors[c.name]}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">{s.tablesModal.indicatorNote}</p>
    </>
  );
}

type Tab = 'periodic' | 'solubility' | 'activity' | 'indicators';

export function TablesModal({ s, lang, onClose, onAdd }: { s: Strings; lang: Lang; onClose: () => void; onAdd?: (reagentId: string) => void }) {
  const [tab, setTab] = useState<Tab>('solubility');
  const tabs: Tab[] = ['periodic', 'solubility', 'activity', 'indicators'];
  return (
    <Modal title={s.tablesModal.title} onClose={onClose}
      tabs={
        <div className="modal-tabs" role="tablist">
          {tabs.map((t) => (
            <button key={t} type="button" role="tab" className="chip" aria-selected={tab === t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {s.tablesModal[t]}
            </button>
          ))}
        </div>
      }>
      {tab === 'periodic' && <Periodic s={s} lang={lang} onAdd={onAdd ? (id) => { onAdd(id); onClose(); } : undefined} />}
      {tab === 'solubility' && <Solubility s={s} lang={lang} />}
      {tab === 'activity' && <Activity s={s} />}
      {tab === 'indicators' && <Indicators s={s} />}
    </Modal>
  );
}

function timeOf(at: number, lang: Lang) {
  try {
    return new Date(at).toLocaleTimeString(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function JournalModal({ lab, s, x, lang, onClose }: { lab: Lab; s: Strings; x: Extra; lang: Lang; onClose: () => void }) {
  const h = makeH(lang, s);
  const entries: JournalEntry[] = [...lab.journal].reverse();
  const label = (id: string) => (id === COLLECTOR_ID ? x.collector.name : lab.has(id) ? x.vesselShort[lab.vessel(id).kind] : s.journalModal.vessel);
  return (
    <Modal title={s.journalModal.title} onClose={onClose} narrow>
      {entries.length === 0 ? (
        <p className="note">{s.journalModal.empty}</p>
      ) : (
        <>
          <ul className="journal-list">
            {entries.map((e) => (
              <li key={e.id}>
                <span className="meta">{timeOf(e.at, lang)} · {label(e.vessel)}</span>
                <span className="jt"><Rich text={s.events[e.event.kind](e.event.p, h, e.event).title} /></span>
                <span className="jc">
                  {e.added.map((id, i) => {
                    const r = REAGENT_BY_ID[id];
                    return <span key={`${id}-${i}`}>{i > 0 && ' + '}{r?.indicator ? s.indicators[r.indicator] : <Formula f={r?.formula ?? id} />}</span>;
                  })}
                </span>
              </li>
            ))}
          </ul>
          <p><button type="button" className="btn" onClick={() => lab.clearJournal()}>{s.journalModal.clear}</button></p>
        </>
      )}
    </Modal>
  );
}

export function ReagentModal({ id, s, x, lang, onClose, onAdd }: { id: string; s: Strings; x: Extra; lang: Lang; onClose: () => void; onAdd: (id: string) => void }) {
  const r = REAGENT_BY_ID[id];
  if (!r) return null;
  const info = REAGENT_INFO[id];
  let mass: string | null = null;
  if (!r.indicator) {
    try { mass = fmt(molarMass(r.formula.replace('·', '')), lang, 1); } catch { mass = null; }
  }
  return (
    <Modal title={r.name[lang]} onClose={onClose} narrow>
      <div className="reagent-card">
        <div className="reagent-head">
          <BottleIcon color={r.bottle} solid={r.kind === 'solid'} />
          <div>
            <b className="reagent-formula">{r.indicator ? r.name[lang] : <Formula f={r.formula} />}</b>
            {r.note && <span>{r.note[lang]}</span>}
          </div>
        </div>
        <dl className="reagent-facts">
          {mass && <><dt>{x.info.molar}</dt><dd>{mass} {lang === 'en' ? 'g/mol' : 'г/моль'}</dd></>}
          <dt>{s.cats[r.cat]}</dt><dd>{x.info.grade(r.grade)}</dd>
        </dl>
        {info && (
          <>
            <h3>{x.info.life}</h3>
            <p>{info.life[lang]}</p>
            {info.hazard && <div className="safety-card"><b>{x.info.hazard}</b><p>{info.hazard[lang]}</p></div>}
          </>
        )}
        <p><button type="button" className="btn primary" onClick={() => { onAdd(id); onClose(); }}>{s.addTo} ✓</button></p>
      </div>
    </Modal>
  );
}

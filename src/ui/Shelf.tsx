import { useMemo, useState } from 'react';
import { REAGENTS, type Lang, type Reagent, type ReagentCat } from '../engine/data';
import { pretty } from '../engine/formula';
import type { Strings } from '../i18n/types';
import { numText, type Extra } from '../i18n/extra';
import { LAB_MORE } from '../i18n/labMore';
import { Formula } from './Formula';
import { BottleIcon } from './icons';
import { dragHandlers } from './drag';

const CATS: ('all' | ReagentCat)[] = ['all', 'acid', 'base', 'salt', 'oxide', 'metal', 'nonmetal', 'ind', 'other'];

function matches(r: Reagent, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase().replace(/\s+/g, '');
  const hay = [r.formula, pretty(r.formula), r.name.kk, r.name.ru, r.name.en].join('|').toLowerCase().replace(/\s+/g, '');
  return hay.includes(needle);
}

function AmountField({ id, label, unit, value, max, compare, onChange, lang }: {
  id: string; label: string; unit: string; value: number; max: number;
  compare: string; onChange: (v: number) => void; lang: Lang;
}) {
  const [text, setText] = useState<string | null>(null);
  const commit = (raw: string) => {
    const v = parseFloat(raw.replace(',', '.'));
    if (Number.isFinite(v) && v > 0) onChange(Math.min(max, Math.max(0.01, Math.round(v * 100) / 100)));
    setText(null);
  };
  return (
    <div className="amount-field">
      <label htmlFor={id}>{label}</label>
      <div className="amount-input">
        <input id={id} inputMode="decimal" value={text ?? numText(value, lang)} onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); } }} />
        <span>{unit}</span>
      </div>
      <span className="amount-compare">{compare}</span>
    </div>
  );
}

function BottleRow({ r, s, x, lang, onAdd, onDrop, onInfo }: {
  r: Reagent; s: Strings; x: Extra; lang: Lang;
  onAdd: (id: string) => void;
  onDrop: (id: string, target: string) => void;
  onInfo: (id: string) => void;
}) {
  const handlers = dragHandlers({ kind: 'reagent', id: r.id }, { onTap: () => onAdd(r.id), onDrop: (t) => onDrop(r.id, t) });
  const name = r.name[lang];
  const note = r.note?.[lang];
  return (
    <div className="bottle-wrap">
      <button type="button" className="bottle" {...handlers} title={note ? `${name}, ${note}` : name}>
        <BottleIcon color={r.bottle} solid={r.kind === 'solid'} />
        <span>
          <b>
            {r.indicator ? name : <Formula f={r.formula} />}
            {r.tag && <span className={`tag ${r.tag}`}>{r.tag === 'conc' ? s.conc : s.dil}</span>}
          </b>
          <small>{r.indicator ? note : note ? `${name}, ${note}` : name}</small>
        </span>
      </button>
      <button type="button" className="info-btn" onClick={() => onInfo(r.id)} aria-label={`${x.info.open}: ${name}`} title={x.info.open}>i</button>
    </div>
  );
}

export function Shelf({ s, x, lang, ml, g, setMl, setG, onAdd, onDrop, onInfo }: {
  s: Strings; x: Extra; lang: Lang; ml: number; g: number;
  setMl: (v: number) => void; setG: (v: number) => void;
  onAdd: (id: string) => void;
  onDrop: (id: string, target: string) => void;
  onInfo: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | ReagentCat>('all');
  const list = useMemo(() => REAGENTS.filter((r) => (cat === 'all' || r.cat === cat) && matches(r, q)), [q, cat]);
  const grouped = cat === 'all' && !q;

  return (
    <aside className="shelf" aria-labelledby="shelfTitle">
      <div className="shelf-head">
        <div className="shelf-title"><h2 id="shelfTitle">{s.reagents}</h2><span>{list.length}</span></div>
        <div className="amount" title={LAB_MORE[lang].ui.amountHint}>
          <AmountField id="amount-ml" label={x.amount.liquid} unit={x.amount.ml} value={ml} max={250}
            compare={x.compareLiquid(ml)} onChange={setMl} lang={lang} />
          <AmountField id="amount-g" label={x.amount.solid} unit={x.amount.g} value={g} max={50}
            compare={x.compareSolid(g)} onChange={setG} lang={lang} />
        </div>
        <input className="search" type="search" autoComplete="off" placeholder={s.search} aria-label={s.search} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips" role="group" aria-label={s.reagents}>
          {CATS.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{s.cats[c]}</button>
          ))}
        </div>
      </div>
      <div className="bottles">
        {list.length === 0 && <div className="empty-list">{s.nothingFound}</div>}
        {list.map((r, i) => (
          <div key={r.id} style={{ display: 'contents' }}>
            {grouped && (i === 0 || list[i - 1].cat !== r.cat) && <div className="group-label">{s.cats[r.cat]}</div>}
            <BottleRow r={r} s={s} x={x} lang={lang} onAdd={onAdd} onDrop={onDrop} onInfo={onInfo} />
          </div>
        ))}
      </div>
    </aside>
  );
}

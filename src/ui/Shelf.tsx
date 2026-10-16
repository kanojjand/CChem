import { useMemo, useState } from 'react';
import { REAGENTS, type Lang, type Reagent, type ReagentCat } from '../engine/data';
import type { Dose } from '../engine/actions';
import { pretty } from '../engine/formula';
import type { Strings } from '../i18n/types';
import { Formula } from './Formula';
import { BottleIcon } from './icons';
import { dragHandlers } from './drag';

const CATS: ('all' | ReagentCat)[] = ['all', 'acid', 'base', 'salt', 'oxide', 'metal', 'ind', 'other'];

function matches(r: Reagent, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase().replace(/\s+/g, '');
  const hay = [r.formula, pretty(r.formula), r.name.kk, r.name.ru, r.name.en].join('|').toLowerCase().replace(/\s+/g, '');
  return hay.includes(needle);
}

function BottleRow({ r, s, lang, onAdd, onDrop }: {
  r: Reagent; s: Strings; lang: Lang;
  onAdd: (id: string) => void;
  onDrop: (id: string, target: string) => void;
}) {
  const handlers = dragHandlers({ kind: 'reagent', id: r.id }, { onTap: () => onAdd(r.id), onDrop: (t) => onDrop(r.id, t) });
  const name = r.name[lang];
  const note = r.note?.[lang];
  return (
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
  );
}

export function Shelf({ s, lang, dose, setDose, onAdd, onDrop }: {
  s: Strings; lang: Lang; dose: Dose;
  setDose: (d: Dose) => void;
  onAdd: (id: string) => void;
  onDrop: (id: string, target: string) => void;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | ReagentCat>('all');
  const list = useMemo(() => REAGENTS.filter((r) => (cat === 'all' || r.cat === cat) && matches(r, q)), [q, cat]);
  const grouped = cat === 'all' && !q;

  return (
    <aside className="shelf" aria-labelledby="shelfTitle">
      <div className="shelf-head">
        <div className="shelf-title"><h2 id="shelfTitle">{s.reagents}</h2><span>{list.length}</span></div>
        <input className="search" type="search" autoComplete="off" placeholder={s.search} aria-label={s.search} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips" role="group" aria-label={s.reagents}>
          {CATS.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{s.cats[c]}</button>
          ))}
        </div>
        <div className="dose">
          <span className="dose-label">{s.dose}</span>
          <div className="seg" role="group" aria-label={s.dose}>
            {([0, 1, 2] as Dose[]).map((d) => (
              <button key={d} type="button" aria-pressed={dose === d} onClick={() => setDose(d)}
                title={`${s.doseLiquid[d]} · ${s.doseSolid[d]} · ${s.doseDrops[d]}`}>
                {s.doseLiquid[d]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bottles">
        {list.length === 0 && <div className="empty-list">{s.nothingFound}</div>}
        {list.map((r, i) => (
          <div key={r.id} style={{ display: 'contents' }}>
            {grouped && (i === 0 || list[i - 1].cat !== r.cat) && <div className="group-label">{s.cats[r.cat]}</div>}
            <BottleRow r={r} s={s} lang={lang} onAdd={onAdd} onDrop={onDrop} />
          </div>
        ))}
      </div>
    </aside>
  );
}

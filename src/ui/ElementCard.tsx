// Card for one element of the periodic table: where it sits, how its electrons are arranged,
// its physical properties, when it was found and an everyday fact. When the shelf has the
// element as a simple substance, a button puts it into the selected vessel.

import { REAGENTS, type Lang } from '../engine/data';
import type { ElementDef } from '../data/elements';
import { ELEMENT_LABELS, electronConfig, elementFacts, romanGroup, shellCounts } from '../data/elementInfo';
import { fmt } from '../i18n';
import type { Strings } from '../i18n/types';
import './elementCard.css';

const dec = (x: number, lang: Lang) => (lang === 'en' ? String(x) : String(x).replace('.', ','));
const temp = (t: number) => `${t < 0 ? '−' : ''}${Math.abs(t)} °C`;

/** Shelf reagent that is this element as a simple substance (Na, Fe, S, I2 …). */
export function elementReagent(sym: string) {
  return REAGENTS.find((r) => {
    const cat: string = r.cat;
    return (cat === 'metal' || cat === 'nonmetal') && (r.formula === sym || r.formula === `${sym}2`);
  });
}

export function massText(el: ElementDef, lang: Lang): string {
  if (Number.isInteger(el.mass)) return `[${el.mass}]`;
  return fmt(el.mass, lang, el.mass < 100 ? 3 : 2).replace(/[.,]?0+$/, '');
}

export function ElementCard({ el, s, lang, onAdd }: { el: ElementDef; s: Strings; lang: Lang; onAdd?: (reagentId: string) => void }) {
  const L = ELEMENT_LABELS[lang];
  const f = elementFacts(el.sym);
  const shells = shellCounts(el.z);
  const reagent = onAdd ? elementReagent(el.sym) : undefined;
  const unknown = <span className="el-unknown">{L.unknown}</span>;
  const density = f?.d != null
    ? `${dec(f.d, lang)} ${f.st === 'g' ? `${L.gL} (${L.gasNote})` : L.gcm3}`
    : null;

  return (
    <section className="el-card" aria-live="polite" aria-label={s.elements[el.z - 1]}>
      <div className="el-head">
        <div className={`el-tile cat-${el.cat}`} aria-hidden="true">
          <span className="el-z">{el.z}</span>
          <b className="el-sym">{el.sym}</b>
          <span className="el-mass">{massText(el, lang)}</span>
        </div>
        <div className="el-title">
          <h3>{s.elements[el.z - 1]}</h3>
          <span className="el-cat">{s.tablesModal.categories[el.cat]}</span>
          {f && f.flags.length > 0 && (
            <div className="el-flags">
              {f.flags.map((fl) => <span key={fl} className={`el-flag ${fl}`}>{L.flags[fl]}</span>)}
            </div>
          )}
        </div>
      </div>

      {f && (
        <div className="el-fact">
          <b>{L.fact}</b>
          <p>{f.fact[lang]}</p>
        </div>
      )}

      <dl className="el-grid">
        <div><dt>{L.number}</dt><dd>{el.z}</dd></div>
        <div><dt>{L.mass}</dt><dd>{massText(el, lang)}</dd></div>
        <div><dt>{L.period} · {L.group}</dt><dd>{el.period} · {el.group || 3} ({romanGroup(el)})</dd></div>
        <div className="wide"><dt>{L.config}</dt><dd className="el-config">{electronConfig(el.z)}</dd></div>
        <div><dt>{L.shells}</dt><dd>{shells.join(', ')}</dd></div>
        <div><dt>{L.outer}</dt><dd>{shells[shells.length - 1]}</dd></div>
        <div><dt>{L.state}</dt><dd>{f ? L.states[f.st] : unknown}</dd></div>
        {f?.sub != null ? (
          <div><dt>{L.sub}</dt><dd>{temp(f.sub)}</dd></div>
        ) : (
          <>
            <div><dt>{L.mp}</dt><dd>{f?.mp != null ? temp(f.mp) : unknown}</dd></div>
            <div><dt>{L.bp}</dt><dd>{f?.bp != null ? temp(f.bp) : unknown}</dd></div>
          </>
        )}
        <div><dt>{L.density}</dt><dd>{density ?? unknown}</dd></div>
        <div><dt>{L.discovered}</dt><dd>{f?.year == null ? unknown : f.year === 'ancient' ? L.ancient : f.year}</dd></div>
        <div><dt>{L.chi}</dt><dd>{f?.chi != null ? dec(f.chi, lang) : unknown}</dd></div>
        <div><dt>{L.ox}</dt><dd>{f?.ox ?? unknown}</dd></div>
      </dl>

      {reagent && onAdd && (
        <p className="el-add">
          <button type="button" className="btn primary" onClick={() => onAdd(reagent.id)}>{L.add}</button>
        </p>
      )}
    </section>
  );
}

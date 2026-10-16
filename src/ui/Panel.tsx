import { useState } from 'react';
import { ACTIVITY, COLORS, IONS, REAGENT_BY_ID, compound, hasCompound, type Lang } from '../engine/data';
import { buildEquations } from '../engine/equation';
import { mainEvent, phOf } from '../engine/actions';
import { medium } from '../engine/ph';
import { ROOM_T, isEmpty, type ReactionEvent, type Sign, type Vessel } from '../engine/vessel';
import { fmt, makeH } from '../i18n';
import type { Strings } from '../i18n/types';
import type { Lab } from '../state/lab';
import { EquationLine, Formula, Rich } from './Formula';
import { AddedList, vesselLabel } from './Bench';
import { IconAlert, IconFlame, IconPour, IconQuestion, IconWash, SignIcon } from './icons';

export type Grade = 7 | 8 | 9 | 10 | 11;

const NONE = new Set(['exchangeNone', 'metalAcidNone', 'metalSaltNone', 'metalWaterNone', 'passivation', 'aluminumFilm', 'insolubleSolid', 'nothing']);
const QUIET = new Set(['added', 'diluted', 'minor']);
const MAIN_SIGNS: Sign[] = ['precip', 'gas', 'color', 'heat'];
const EXTRA_SIGNS: Sign[] = ['dissolve', 'smell', 'deposit', 'light'];
const MMOL: Record<Lang, string> = { kk: 'ммоль', ru: 'ммоль', en: 'mmol' };

function Series({ e }: { e: ReactionEvent }) {
  const p = e.p;
  const good = new Set<string>();
  const hit = new Set<string>();
  if (e.kind === 'metalAcid') good.add(p.metal);
  if (e.kind === 'metalAcidNone') hit.add(p.metal);
  if (e.kind === 'metalSalt') { good.add(p.metal); hit.add(p.deposit); }
  if (e.kind === 'metalSaltNone') { hit.add(p.metal); if (p.ion && IONS[p.ion]?.metal) good.add(IONS[p.ion].metal!); }
  return (
    <div className="series" aria-hidden="true">
      {ACTIVITY.map((m) => (
        <span key={m} className={[m === 'H2' ? 'h' : '', good.has(m) ? 'good' : '', hit.has(m) ? 'hit' : ''].filter(Boolean).join(' ')}>
          {m === 'H2' ? <Formula f="H2" /> : m}
        </span>
      ))}
    </div>
  );
}

function statusOf(e: ReactionEvent, s: Strings, cap: (x: string) => string): { cls: string; label: string } | null {
  if (QUIET.has(e.kind) || e.kind === 'notModeled') return null;
  if (NONE.has(e.kind)) return { cls: 'none', label: cap(s.panel.noReaction) };
  if (e.kind === 'needsHeat') return { cls: 'none', label: s.heat };
  if (e.kind === 'indicator') return { cls: 'info', label: cap(s.indicators[e.p.ind as 'phph'] ?? '') };
  if (e.type) return { cls: 'ok', label: cap(s.types[e.type]) };
  return null;
}

function IonsView({ v, s, lang, now }: { v: Vessel; s: Strings; lang: Lang; now: number }) {
  const inSolution = Object.entries(v.aq).filter(([, n]) => n > 1e-5);
  const solids = Object.entries(v.solids).filter(([, n]) => n > 1e-4);
  const gases = [...new Set(v.fx.gas.filter((g) => g.until > now && g.id !== 'H2O').map((g) => g.id))];
  const dot = (hex?: string) => <i style={{ background: hex ?? 'var(--panel)' }} />;
  const solidHex = (id: string) => (hasCompound(id) && compound(id).color ? COLORS[compound(id).color!].hex : '#DADDE2');
  return (
    <div className="ions">
      {inSolution.length > 0 && (
        <div className="ion-row">
          <h3>{s.panel.inSolution}</h3>
          <div className="ion-list">
            {inSolution.map(([id, n]) => (
              <span key={id} className="ion">
                {dot(IONS[id]?.color)}
                <Formula f={id} />
                <em>{fmt(n, lang, n < 1 ? 2 : 1)} {MMOL[lang]}</em>
              </span>
            ))}
          </div>
        </div>
      )}
      {solids.length > 0 && (
        <div className="ion-row">
          <h3>{s.panel.solids}</h3>
          <div className="ion-list">
            {solids.map(([id, n]) => (
              <span key={id} className="ion">
                {dot(solidHex(id))}
                <Formula f={id} />
                <em>{fmt(n, lang, n < 1 ? 2 : 1)} {MMOL[lang]}</em>
              </span>
            ))}
          </div>
        </div>
      )}
      {gases.length > 0 && (
        <div className="ion-row">
          <h3>{s.panel.gasesOut}</h3>
          <div className="ion-list">
            {gases.map((id) => <span key={id} className="ion">{dot()}<Formula f={id} /></span>)}
          </div>
        </div>
      )}
    </div>
  );
}

export function Panel({ lab, s, lang, grade, now, onIdea, onHeat, onWash, onPour }: {
  lab: Lab; s: Strings; lang: Lang; grade: Grade; now: number;
  onIdea: (steps: string[]) => void;
  onHeat: () => void;
  onWash: () => void;
  onPour: (target: string) => void;
}) {
  const [showIons, setShowIons] = useState(false);
  const v = lab.vessel(lab.selected);
  const h = makeH(lang, s);
  const main = mainEvent(v.lastEvents);
  const empty = isEmpty(v) && v.added.length === 0;
  const pH = phOf(v);
  const dT = v.temp - ROOM_T;

  const header = (
    <div className="panel-kicker">
      <h2>{vesselLabel(v, s)} · {s.panel.title}</h2>
      {v.added.length > 0 && <span className="contents"><AddedList v={v} lang={lang} /></span>}
    </div>
  );

  const actions = (
    <div className="actions">
      <div className="action-row">
        <button type="button" className={`btn ${v.heating ? 'heat-on' : ''}`} onClick={onHeat}>
          <IconFlame />{v.heating ? s.stopHeat : s.heat}
        </button>
        <button type="button" className="btn" onClick={onWash} disabled={empty}><IconWash />{s.wash}</button>
      </div>
      {!empty && (
        <div className="action-row" role="group" aria-label={s.pourInto}>
          <span className="signs-label"><IconPour /> {s.pourInto}:</span>
          {lab.vessels.filter((o) => o.id !== v.id).map((o) => (
            <button key={o.id} type="button" className="btn small" onClick={() => onPour(o.id)} title={s.pourHint}>
              {o.kind === 'tube' ? o.id.slice(1) : s.beaker}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (empty) {
    return (
      <section className="panel" aria-live="polite">
        <div className="panel-inner">
          {header}
          <span className="status empty">{s.panel.empty}</span>
          <p className="say">{s.panel.emptyText}</p>
          <div className="ideas">
            <h3>{s.panel.ideas}</h3>
            {s.ideaList.map((idea) => (
              <button key={idea.label} type="button" className="idea" onClick={() => onIdea(idea.steps)}>
                <span>{idea.label}</span>
                <small>
                  {idea.steps.map((id, i) => {
                    const r = REAGENT_BY_ID[id];
                    return <span key={id}>{i > 0 && ' + '}{r?.indicator ? s.indicators[r.indicator] : <Formula f={r?.formula ?? id} />}</span>;
                  })}
                </small>
              </button>
            ))}
          </div>
          {actions}
          <p className="grade-note">{s.gradeNotes[grade]}</p>
        </div>
      </section>
    );
  }

  const txt = main ? s.events[main.kind](main.p, h, main) : null;
  const status = main ? statusOf(main, s, h.cap) : null;
  const eqs = main?.eq && grade >= 8 ? buildEquations(main.eq) : null;
  const why = txt ? (grade === 7 ? txt.why7 ?? txt.why : txt.why ?? txt.why7) : undefined;
  const isNone = main ? NONE.has(main.kind) : false;
  const showSeries = main && ['metalAcid', 'metalAcidNone', 'metalSalt', 'metalSaltNone'].includes(main.kind);
  const safety = v.lastEvents.find((e) => e.safety)?.safety;
  const also = v.lastEvents.filter((e) => e !== main && e.importance >= 2 && !QUIET.has(e.kind) && !NONE.has(e.kind));
  const signs = main?.signs ?? [];
  const eqProps = { noReactionLabel: s.panel.noReaction, concLabel: s.conc, heatLabel: 't°' };

  return (
    <section className="panel" aria-live="polite">
      <div className="panel-inner">
        {header}
        {status && <span className={`status ${status.cls}`}>{status.label}</span>}
        {txt && txt.title && <h3 className="result-title"><Rich text={txt.title} /></h3>}
        {txt && txt.say && <p className="say"><Rich text={txt.say} /></p>}

        {main && !QUIET.has(main.kind) && !isNone && main.kind !== 'notModeled' && (
          <div className="signs" role="list" aria-label={s.panel.signs}>
            {MAIN_SIGNS.map((sg) => (
              <span key={sg} role="listitem" className={`sign ${signs.includes(sg) ? 'on' : 'off'}`}><SignIcon sign={sg} />{s.signs[sg]}</span>
            ))}
            {EXTRA_SIGNS.filter((sg) => signs.includes(sg)).map((sg) => (
              <span key={sg} role="listitem" className="sign on"><SignIcon sign={sg} />{s.signs[sg]}</span>
            ))}
          </div>
        )}

        {safety && (
          <div className="safety-card" role="alert">
            <b><IconAlert />{s.panel.safety}: {s.safety[safety].title}</b>
            <p>{s.safety[safety].text}</p>
          </div>
        )}

        {eqs && (
          <div className="eq">
            <span className="eq-label">{s.panel.equation}</span>
            <span className="eq-line"><EquationLine side={eqs.molecular} cond={eqs.molecular.cond} noReaction={eqs.molecular.noReaction} {...eqProps} /></span>
            {grade >= 9 && eqs.fullIonic && (
              <>
                <span className="eq-label">{s.panel.fullIonic}</span>
                <span className="eq-line ionic"><EquationLine side={eqs.fullIonic} {...eqProps} /></span>
              </>
            )}
            {grade >= 9 && eqs.netIonic && (
              <>
                <span className="eq-label">{s.panel.netIonic}</span>
                <span className="eq-line ionic"><EquationLine side={eqs.netIonic} {...eqProps} /></span>
              </>
            )}
          </div>
        )}
        {grade === 7 && main?.eq && !main.eq.noReaction && <p className="grade-note">{s.panel.gradeHint7}</p>}

        {(pH != null || Math.abs(dT) > 1.5) && (
          <div className="ph">
            {pH != null && (
              <>
                <div className="ph-head">
                  <span>{s.panel.ph} {pH < 0 ? '< 1' : fmt(pH, lang, 1)}</span>
                  <span>{s.panel.medium[medium(Math.max(pH, 0))]}</span>
                </div>
                <div className="ph-bar"><span className="ph-mark" style={{ left: `${(Math.min(14, Math.max(0, pH)) / 14) * 100}%` }} /></div>
                <div className="ph-scale"><span>0</span><span>7</span><span>14</span></div>
              </>
            )}
            {Math.abs(dT) > 1.5 && (
              <div className="facts"><span className={`fact ${dT > 0 ? 'hot' : 'cold'}`}>{s.panel.temperature}: {Math.round(v.temp)} °C</span></div>
            )}
          </div>
        )}

        {why && (
          <details className="why" open={isNone || main?.kind === 'needsHeat'} key={`${v.id}-${main?.kind}`}>
            <summary><IconQuestion />{s.panel.why}</summary>
            <div className="why-body">
              <p><Rich text={why} /></p>
              {showSeries && main && <Series e={main} />}
            </div>
          </details>
        )}

        {also.length > 0 && (
          <div className="also">
            <h3>{s.panel.also}</h3>
            <ul>{also.map((e, i) => <li key={i}><Rich text={s.events[e.kind](e.p, h, e).title} /></li>)}</ul>
          </div>
        )}

        <div className="mol-toggle">
          <label>
            <span>{s.panel.showIons}</span>
            <input type="checkbox" className="switch" checked={showIons} onChange={(e) => setShowIons(e.target.checked)} />
          </label>
        </div>
        {showIons && <IonsView v={v} s={s} lang={lang} now={now} />}

        {actions}
        <p className="grade-note">{s.gradeNotes[grade]}</p>
      </div>
    </section>
  );
}

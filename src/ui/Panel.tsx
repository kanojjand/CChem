import { useMemo, useState, type ReactNode } from 'react';
import { ACTIVITY, IONS, METALS, REAGENTS, REAGENT_BY_ID, type Lang } from '../engine/data';
import { buildEquations } from '../engine/equation';
import { mainEvent, phOf } from '../engine/actions';
import { ML_PER_MMOL, conductivity, type GasTool } from '../engine/apparatus';
import { molarMass } from '../engine/formula';
import { medium } from '../engine/ph';
import { ROOM_T, isEmpty, type ReactionEvent, type Sign, type Vessel } from '../engine/vessel';
import { fmt, makeH } from '../i18n';
import type { Strings } from '../i18n/types';
import type { Extra } from '../i18n/extra';
import { LIFE } from '../i18n/lifeTexts';
import { LAB_MORE } from '../i18n/labMore';
import { boilingPoint } from '../engine/physics';
import { COLLECTOR_ID, type Burette, type Lab } from '../state/lab';
import { EquationLine, Formula, Rich } from './Formula';
import { AddedList, targetLabel, vesselLabel } from './Bench';
import { IconAlert, IconFlame, IconPour, IconQuestion, IconWash, SignIcon } from './icons';
import { solidColor } from './VesselView';

export type Grade = 7 | 8 | 9 | 10 | 11;

const NONE = new Set(['exchangeNone', 'metalAcidNone', 'metalSaltNone', 'metalWaterNone', 'passivation', 'aluminumFilm', 'leadFilm', 'insolubleSolid', 'nothing', 'noCurrent', 'magnetNone']);
const QUIET = new Set(['added', 'diluted', 'minor']);
const MAIN_SIGNS: Sign[] = ['precip', 'gas', 'color', 'heat'];
const EXTRA_SIGNS: Sign[] = ['dissolve', 'smell', 'deposit', 'light'];
const MMOL: Record<Lang, string> = { kk: 'ммоль', ru: 'ммоль', en: 'mmol' };
const TOOLS: GasTool[] = ['glowing', 'burning', 'litmus', 'limewater'];

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
  if (QUIET.has(e.kind) || e.kind === 'notModeled' || e.kind === 'gasTest' || e.kind === 'gasThrough') return null;
  if (NONE.has(e.kind)) return { cls: 'none', label: cap(s.panel.noReaction) };
  if (e.kind === 'needsHeat') return { cls: 'none', label: s.heat };
  if (e.kind === 'indicator') return { cls: 'info', label: cap(s.indicators[e.p.ind as 'phph'] ?? '') };
  if (e.type) return { cls: 'ok', label: cap(s.types[e.type]) };
  return null;
}

function IonsView({ v, s, lang, now }: { v: Vessel; s: Strings; lang: Lang; now: number }) {
  const inSolution = Object.entries(v.aq).filter(([, n]) => n > 1e-5);
  const solids = Object.entries(v.solids).filter(([, n]) => n > 1e-4);
  const gases = [...new Set(v.fx.gas.filter((g) => g.until > now && g.id !== 'H2O' && g.id !== 'tube').map((g) => g.id))];
  const dot = (hex?: string) => <i style={{ background: hex ?? 'var(--panel)' }} />;
  return (
    <div className="ions">
      {inSolution.length > 0 && (
        <div className="ion-row">
          <h3>{s.panel.inSolution}</h3>
          <div className="ion-list">
            {inSolution.map(([id, n]) => (
              <span key={id} className="ion">{dot(IONS[id]?.color)}<Formula f={id} /><em>{fmt(n, lang, n < 1 ? 2 : 1)} {MMOL[lang]}</em></span>
            ))}
          </div>
        </div>
      )}
      {solids.length > 0 && (
        <div className="ion-row">
          <h3>{s.panel.solids}</h3>
          <div className="ion-list">
            {solids.map(([id, n]) => (
              <span key={id} className="ion">{dot(solidColor(id))}<Formula f={id} /><em>{fmt(n, lang, n < 1 ? 2 : 1)} {MMOL[lang]}</em></span>
            ))}
          </div>
        </div>
      )}
      {gases.length > 0 && (
        <div className="ion-row">
          <h3>{s.panel.gasesOut}</h3>
          <div className="ion-list">{gases.map((id) => <span key={id} className="ion">{dot()}<Formula f={id} /></span>)}</div>
        </div>
      )}
    </div>
  );
}

/** Masses of solids and volumes of gas, so students see the reaction in numbers. */
function Numbers({ v, x, lang }: { v: Vessel; x: Extra; lang: Lang }) {
  const solids = Object.entries(v.solids).filter(([id, n]) => n > 1e-3 && !METALS[id] && id !== 'H2O(s)');
  // Solids the student put in themselves are "in the vessel", not "formed".
  const added = new Set(v.added.flatMap((r) => Object.keys(REAGENT_BY_ID[r]?.solid ?? {})));
  const plated = Object.entries(v.electro?.cathode ?? {}).filter(([, n]) => n > 1e-3);
  const gases = Object.entries(v.gasTotal).filter(([id, n]) => n > 1e-3 && id !== 'H2O');
  if (!solids.length && !gases.length && !plated.length) return null;
  const grams = (id: string, n: number) => {
    try { return fmt((n * molarMass(id)) / 1000, lang, n * molarMass(id) < 1000 ? 3 : 2); } catch { return '—'; }
  };
  return (
    <div className="numbers">
      <h3>{x.numbers.title}</h3>
      <ul>
        {solids.map(([id, n]) => <li key={id}><span>{added.has(id) ? LAB_MORE[lang].inVessel : x.numbers.formed} <Formula f={id} /></span><b>{grams(id, n)} {x.amount.g}</b></li>)}
        {plated.map(([id, n]) => <li key={`c-${id}`}><span>{x.electro.plated} <Formula f={id} /></span><b>{grams(id, n)} {x.amount.g}</b></li>)}
        {gases.map(([id, n]) => <li key={`g-${id}`}><span>{x.numbers.gasOut} <Formula f={id} /></span><b>≈ {fmt(n * ML_PER_MMOL, lang, n * ML_PER_MMOL < 10 ? 1 : 0)} {x.amount.ml}</b></li>)}
      </ul>
    </div>
  );
}

function Fold({ title, children, open, onToggle }: { title: ReactNode; children: ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div className={`fold ${open ? 'open' : ''}`}>
      <button type="button" className="fold-head" aria-expanded={open} onClick={onToggle}>{title}<span aria-hidden="true">{open ? '−' : '+'}</span></button>
      {open && <div className="fold-body">{children}</div>}
    </div>
  );
}

function TitrationCurve({ b, x, lang }: { b: Burette; x: Extra; lang: Lang }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = 170, L = 30, R = 12, T = 12, B = 22;
  const maxV = Math.max(5, Math.ceil((b.points[b.points.length - 1]?.v ?? 0) / 5) * 5);
  const sx = (v: number) => L + (v / maxV) * (W - L - R);
  const sy = (p: number) => T + (1 - Math.min(14, Math.max(0, p)) / 14) * (H - T - B);
  const d = b.points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.v).toFixed(1)} ${sy(p.pH).toFixed(1)}`).join(' ');
  const pt = hover != null ? b.points[hover] : null;
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const v = ((e.clientX - r.left) / r.width * W - L) / (W - L - R) * maxV;
    let best = 0;
    b.points.forEach((p, i) => { if (Math.abs(p.v - v) < Math.abs(b.points[best].v - v)) best = i; });
    setHover(b.points.length ? best : null);
  };
  return (
    <figure className="chart">
      <figcaption>{x.burette.curve} <span className="axes">(pH / {x.burette.axisV})</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img"
        aria-label={`${x.burette.curve}: ${b.points.length} points`}>
        {[0, 7, 14].map((p) => (
          <g key={p}>
            <line x1={L} x2={W - R} y1={sy(p)} y2={sy(p)} className="grid" />
            <text x={L - 6} y={sy(p) + 4} className="tick" textAnchor="end">{p}</text>
          </g>
        ))}
        {[0, maxV / 2, maxV].map((v) => (
          <text key={v} x={sx(v)} y={H - 6} className="tick" textAnchor={v === 0 ? 'start' : v === maxV ? 'end' : 'middle'}>{fmt(v, lang, v % 1 ? 1 : 0)}</text>
        ))}
        {d && <path d={d} className="series-line s1" />}
        {b.endpoint && (
          <g>
            <line x1={sx(b.endpoint.v)} x2={sx(b.endpoint.v)} y1={T} y2={H - B} className="marker-line" />
            <circle cx={sx(b.endpoint.v)} cy={sy(b.endpoint.pH)} r={5} className="marker-dot" />
          </g>
        )}
        {pt && (
          <g>
            <line x1={sx(pt.v)} x2={sx(pt.v)} y1={T} y2={H - B} className="crosshair" />
            <circle cx={sx(pt.v)} cy={sy(pt.pH)} r={4} className="hover-dot" />
          </g>
        )}
      </svg>
      {pt && <div className="chart-tip">{fmt(pt.v, lang, 2)} {x.burette.axisV} · pH {fmt(pt.pH, lang, 1)}</div>}
    </figure>
  );
}

function TitrationCard({ lab, x, lang }: { lab: Lab; x: Extra; lang: Lang }) {
  const b = lab.burette!;
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  const v = lab.vessel(b.vessel);
  const titrants = useMemo(() => REAGENTS.filter((r) => r.kind === 'liquid' && !r.indicator && (r.cat === 'acid' || r.cat === 'base')), []);
  const hasInd = Object.keys(v.inds).length > 0;
  const titrant = REAGENT_BY_ID[b.titrant];
  const tc = titrant?.aq ? Object.values(titrant.aq)[0] : 0;
  const isUnknown = v.added.includes('HClx');
  const check = () => {
    const val = parseFloat(answer.replace(',', '.'));
    setChecked(Number.isFinite(val) && Math.abs(val - lab.unknownC) / lab.unknownC <= 0.05);
  };
  return (
    <div className="titration">
      <div className="row">
        <label htmlFor="titrant">{x.burette.titrant}</label>
        <select id="titrant" value={b.titrant} onChange={(e) => lab.setTitrant(e.target.value)}>
          {titrants.map((r) => <option key={r.id} value={r.id}>{r.name[lang]}{r.note ? `, ${r.note[lang]}` : ''}</option>)}
        </select>
      </div>
      <div className="facts">
        <span className="fact">{x.burette.used}: {fmt(b.used, lang, 2)} {x.amount.ml}</span>
        <span className="fact">{x.burette.left}: {fmt(b.capacity - b.used, lang, 2)} {x.amount.ml}</span>
      </div>
      {!hasInd && <p className="grade-note">{x.burette.noIndicator}</p>}
      {b.points.length <= 1 && hasInd && <p className="grade-note">{x.burette.start}</p>}
      <div className="action-row">
        <button type="button" className="btn small" onClick={() => lab.titrate(0.05)}>{x.burette.drop}</button>
        <button type="button" className="btn small" onClick={() => lab.titrate(0.5)}>{x.burette.half}</button>
        <button type="button" className="btn small" onClick={() => lab.titrate(1)}>{x.burette.one}</button>
        <button type="button" className={`btn small ${b.flow ? 'heat-on' : 'primary'}`} onClick={() => lab.setFlow(!b.flow)}>{b.flow ? x.burette.close : x.burette.open}</button>
      </div>
      {b.points.length > 1 && <TitrationCurve b={b} x={x} lang={lang} />}
      {b.endpoint && (
        <div className="calc">
          <b>{x.burette.endpoint(fmt(b.endpoint.v, lang, 2))}</b>
          <span>{x.burette.calc}: {x.burette.formula}</span>
          {b.sampleMl > 0 && tc > 0 && !isUnknown && (
            <span>= {fmt(tc, lang, 2)} × {fmt(b.endpoint.v, lang, 2)} ÷ {fmt(b.sampleMl, lang, 1)} ≈ <b>{fmt((tc * b.endpoint.v) / b.sampleMl, lang, 3)}</b></span>
          )}
          {isUnknown && (
            <div className="answer">
              <label htmlFor="answer">{x.burette.unknown}</label>
              <div className="row">
                <input id="answer" inputMode="decimal" value={answer} onChange={(e) => { setAnswer(e.target.value); setChecked(null); }} placeholder="0,1" />
                <button type="button" className="btn small primary" onClick={check}>{x.burette.check}</button>
              </div>
              {checked === true && <p className="ok-text">{x.burette.right(fmt(lab.unknownC, lang, 3))}</p>}
              {checked === false && <p className="bad-text">{x.burette.wrong}</p>}
            </div>
          )}
        </div>
      )}
      <button type="button" className="btn small" onClick={() => lab.detachBurette()}>{x.burette.detach}</button>
    </div>
  );
}

function ElectroCard({ lab, v, x, lang }: { lab: Lab; v: Vessel; x: Extra; lang: Lang }) {
  const cond = conductivity(v);
  const plated = Object.entries(v.electro?.cathode ?? {}).filter(([, n]) => n > 1e-3);
  return (
    <div className="electro">
      <span className={`status ${cond === 'strong' ? 'ok' : cond === 'weak' ? 'info' : 'none'}`}>{x.electro.bulb[cond]}</span>
      {plated.length > 0 && (
        <div className="facts">
          {plated.map(([id, n]) => <span key={id} className="fact">{x.electro.plated}: <Formula f={id} /> {fmt((n * molarMass(id)) / 1000, lang, 3)} {x.amount.g}</span>)}
        </div>
      )}
      <p className="grade-note">{x.electro.hint}</p>
      <button type="button" className="btn small" onClick={() => lab.toggleElectro(v.id)}>{x.electro.off}</button>
    </div>
  );
}

function ToolButtons({ target, x, onTest }: { target: string; x: Extra; onTest: (target: string, tool: GasTool) => void }) {
  return (
    <div className="tool-grid">
      {TOOLS.map((t) => (
        <button key={t} type="button" className={`btn small tool-${t}`} onClick={() => onTest(target, t)}>{x.tools.names[t]}</button>
      ))}
    </div>
  );
}

function CollectorPanel({ lab, s, x, lang, onTest }: { lab: Lab; s: Strings; x: Extra; lang: Lang; onTest: (target: string, tool: GasTool) => void }) {
  const ml = lab.collectorMl();
  const h = makeH(lang, s);
  const gases = Object.entries(lab.collector.gases).filter(([, n]) => n > 1e-4);
  const total = gases.reduce((a, [, n]) => a + n, 0);
  const sources = Object.entries(lab.tubes).filter(([, to]) => to === COLLECTOR_ID).map(([from]) => from);
  const test = lab.collector.lastTest;
  const tt = test ? s.events.gasTest({ tool: test.tool, result: test.result, gas: '' }, h, { kind: 'gasTest', importance: 2, p: {}, signs: [] }) : null;
  return (
    <section className="panel" aria-live="polite">
      <div className="panel-inner">
        <div className="panel-kicker"><h2>{x.collector.name}</h2>
          {sources.length > 0 && <span className="contents">← {sources.map((id) => targetLabel(lab, id, x)).join(', ')}</span>}
        </div>
        <h3 className="result-title">{ml > 0 ? `${x.collector.volume}: ${Math.round(ml)} ${x.amount.ml}` : x.collector.empty}</h3>
        <div className="collector-meter" aria-hidden="true"><span style={{ width: `${Math.min(100, (ml / lab.collector.capacityMl) * 100)}%` }} /></div>
        <p className="grade-note">{x.collector.of}</p>
        {gases.length > 0 && (
          <div className="ions">
            <div className="ion-row">
              <h3>{x.collector.composition}</h3>
              <div className="ion-list">
                {gases.map(([id, n]) => <span key={id} className="ion"><i style={{ background: 'var(--panel)' }} /><Formula f={id} /><em>{Math.round((n / total) * 100)}% · {fmt(n * ML_PER_MMOL, lang, 0)} {x.amount.ml}</em></span>)}
              </div>
            </div>
          </div>
        )}
        {!sources.length && ml === 0 && <p className="say">{x.collector.connect}</p>}
        {tt && (
          <div className="test-result">
            <b>{x.tools.names[test!.tool]}: <Rich text={tt.title} /></b>
            <p><Rich text={tt.say} /></p>
            {tt.why && <p className="grade-note"><Rich text={tt.why} /></p>}
          </div>
        )}
        <div className="actions">
          <h3>{x.tools.title}</h3>
          <ToolButtons target={COLLECTOR_ID} x={x} onTest={onTest} />
          <div className="action-row"><button type="button" className="btn" onClick={() => lab.emptyCollector()} disabled={!ml && !test}>{x.collector.release}</button></div>
        </div>
        <p className="grade-note">{x.collector.how}</p>
      </div>
    </section>
  );
}

export function Panel({ lab, s, x, lang, grade, now, onIdea, onHeat, onWash, onPour, onTest, onReplace, onFilter, onMagnet, onFlame }: {
  lab: Lab; s: Strings; x: Extra; lang: Lang; grade: Grade; now: number;
  onIdea: (steps: string[]) => void;
  onHeat: () => void;
  onWash: () => void;
  onPour: (target: string) => void;
  onTest: (target: string, tool: GasTool) => void;
  onReplace: () => void;
  onFilter: (target: string) => void;
  onMagnet: () => void;
  onFlame: () => void;
}) {
  const [showIons, setShowIons] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ pour: false, tube: false, test: false, sep: false, burette: false, electro: false });
  const lm = LAB_MORE[lang];
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  if (lab.selected === COLLECTOR_ID) return <CollectorPanel lab={lab} s={s} x={x} lang={lang} onTest={onTest} />;

  const v = lab.vessel(lab.selected);
  const h = makeH(lang, s);
  const main = mainEvent(v.lastEvents);
  const empty = isEmpty(v) && v.added.length === 0;
  const pH = phOf(v);
  const dT = v.temp - ROOM_T;
  const label = vesselLabel(lab, v, x);
  const others = lab.vessels.filter((o) => o.id !== v.id && !o.broken);
  const tubeTo = lab.tubes[v.id];
  const canBurette = v.kind !== 'tube';
  const burette = lab.burette?.vessel === v.id;

  const header = (
    <div className="panel-kicker">
      <h2>{label} · {s.panel.title}</h2>
      {v.added.length > 0 && <span className="contents"><AddedList v={v} lang={lang} /></span>}
    </div>
  );

  if (v.broken) {
    return (
      <section className="panel" aria-live="polite">
        <div className="panel-inner">
          {header}
          <div className="safety-card" role="alert">
            <b><IconAlert />{x.broken.title}</b>
            <p>{x.broken.text}</p>
          </div>
          {main?.safety && <p className="grade-note"><b>{s.safety[main.safety].title}.</b> {s.safety[main.safety].text}</p>}
          <div className="action-row"><button type="button" className="btn primary" onClick={onReplace}>{x.broken.replace}</button></div>
        </div>
      </section>
    );
  }

  const tools = (
    <div className="actions">
      <div className="action-row">
        <button type="button" className={`btn ${v.heating ? 'heat-on' : ''}`} onClick={onHeat}><IconFlame />{v.heating ? s.stopHeat : s.heat}</button>
        <button type="button" className="btn" onClick={onWash} disabled={empty}><IconWash />{s.wash}</button>
        <button type="button" className="btn" onClick={() => lab.removeVessel(v.id)} disabled={lab.vessels.length <= 1}>{x.removeVessel}</button>
      </div>
      {!empty && (
        <Fold title={<span className="fold-title"><IconPour />{s.pourInto}</span>} open={open.pour} onToggle={() => toggle('pour')}>
          <div className="action-row">
            {others.map((o) => <button key={o.id} type="button" className="btn small" onClick={() => onPour(o.id)} title={s.pourHint}>{vesselLabel(lab, o, x)}</button>)}
          </div>
        </Fold>
      )}
      <Fold title={<span className="fold-title">{x.tube.label}{tubeTo ? ` → ${targetLabel(lab, tubeTo, x)}` : ''}</span>} open={open.tube} onToggle={() => toggle('tube')}>
        <p className="grade-note">{x.tube.hint}</p>
        <div className="action-row">
          <button type="button" className="btn small" aria-pressed={!tubeTo} onClick={() => lab.setTube(v.id, null)}>{x.tube.none}</button>
          <button type="button" className="btn small" aria-pressed={tubeTo === COLLECTOR_ID} onClick={() => lab.setTube(v.id, COLLECTOR_ID)}>{x.collector.name}</button>
          {others.map((o) => (
            <button key={o.id} type="button" className="btn small" aria-pressed={tubeTo === o.id} onClick={() => lab.setTube(v.id, o.id)}>{vesselLabel(lab, o, x)}</button>
          ))}
        </div>
      </Fold>
      <Fold title={<span className="fold-title">{x.tools.title}</span>} open={open.test} onToggle={() => toggle('test')}>
        <p className="grade-note">{x.tools.hint}</p>
        <ToolButtons target={v.id} x={x} onTest={onTest} />
      </Fold>
      <Fold title={<span className="fold-title">{lm.sep.title}</span>} open={open.sep} onToggle={() => toggle('sep')}>
        <p className="grade-note">{lm.sep.hint}</p>
        <div className="action-row">
          <button type="button" className="btn small" onClick={onMagnet} disabled={empty} title={lm.sep.magnetHint}>{lm.sep.magnet}</button>
          <button type="button" className="btn small" onClick={onFlame} disabled={empty} title={lm.sep.flameHint}>{lm.sep.flame}</button>
        </div>
        {!empty && v.volume > 0.005 && others.length > 0 && (
          <>
            <p className="grade-note">{lm.sep.filterHint}</p>
            <div className="action-row" role="group" aria-label={lm.sep.filter}>
              <span className="row-label">{lm.sep.filterInto}:</span>
              {others.map((o) => <button key={o.id} type="button" className="btn small" onClick={() => onFilter(o.id)}>{vesselLabel(lab, o, x)}</button>)}
            </div>
          </>
        )}
      </Fold>
      {canBurette && (
        <Fold title={<span className="fold-title">{x.burette.name}{burette ? ' ●' : ''}</span>} open={open.burette || burette} onToggle={() => toggle('burette')}>
          {burette ? <TitrationCard lab={lab} x={x} lang={lang} /> : (
            <button type="button" className="btn small primary" onClick={() => lab.attachBurette(v.id)}>{x.burette.attach}</button>
          )}
        </Fold>
      )}
      {canBurette && (
        <Fold title={<span className="fold-title">{x.electro.name}{v.electro ? ' ●' : ''}</span>} open={open.electro || !!v.electro} onToggle={() => toggle('electro')}>
          {v.electro ? <ElectroCard lab={lab} v={v} x={x} lang={lang} /> : (
            <button type="button" className="btn small primary" onClick={() => lab.toggleElectro(v.id)}>{x.electro.on}</button>
          )}
        </Fold>
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
          {tools}
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
  const life = main ? LIFE[lang][main.kind] : undefined;
  const eqProps = { noReactionLabel: s.panel.noReaction, concLabel: s.conc, heatLabel: 't°', elLabel: x.electro.name };

  return (
    <section className="panel" aria-live="polite">
      <div className="panel-inner">
        {header}
        {status && <span className={`status ${status.cls}`}>{status.label}</span>}
        {main?.kind === 'gasTest' && <span className="status info">{x.tools.names[main.p.tool as GasTool]}</span>}
        {main?.kind === 'flameTest' && (
          <div className="flame-result" aria-hidden="true">
            <svg viewBox="0 0 34 48"><path d="M17 2c7 11 10 18 10 26a10 10 0 0 1-20 0c0-8 3-15 10-26z" fill={main.p.color || '#F2A33A'} /><path d="M17 20c3.5 5.5 5 9 5 12a5 5 0 0 1-10 0c0-3 1.5-6.5 5-12z" fill="#FFF3C4" opacity="0.7" /></svg>
          </div>
        )}
        {txt && txt.title && <h3 className="result-title"><Rich text={txt.title} /></h3>}
        {txt && txt.say && <p className="say"><Rich text={txt.say} /></p>}

        {main && !QUIET.has(main.kind) && !isNone && main.kind !== 'notModeled' && main.kind !== 'gasTest' && (
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
              <div className="facts">
                <span className={`fact ${dT > 0 ? 'hot' : 'cold'}`}>{s.panel.temperature}: {Math.round(v.temp)} °C</span>
                {v.boiling && <span className="fact hot">{lm.state.bp(fmt(boilingPoint(v), lang, 1))}</span>}
              </div>
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

        {life && (
          <div className="life">
            <h3>{x.life}</h3>
            <p>{life}</p>
          </div>
        )}

        <Numbers v={v} x={x} lang={lang} />

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

        {tools}
        <p className="grade-note">{s.gradeNotes[grade]}</p>
      </div>
    </section>
  );
}

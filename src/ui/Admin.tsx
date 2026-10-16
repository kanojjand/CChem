import { useCallback, useEffect, useState } from 'react';
import type { Lang } from '../engine/data';
import type { Extra } from '../i18n/extra';
import { api, type AdminStats } from '../net/api';
import { useSession } from '../net/session';
import { STRINGS, makeH } from '../i18n';
import { REAGENT_BY_ID } from '../engine/data';
import { Formula } from './Formula';

type Point = { day: string; values: number[] };

function shortDay(day: string, lang: Lang) {
  const d = new Date(`${day}T00:00:00`);
  try { return d.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' }); } catch { return day.slice(5); }
}

/** Axis maximum whose half is a round number: 2, 4, 10, 20, 40, 100… */
function niceMax(v: number) {
  if (v <= 2) return 2;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 2 ? 2 : n <= 4 ? 4 : 10) * p;
}

/** Line chart with one shared y-axis, a legend, direct end labels and a hover crosshair. */
function LineChart({ title, points, names, lang, bars }: { title: string; points: Point[]; names: string[]; lang: Lang; bars?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 220, L = 40, R = bars ? 12 : 90, T = 14, B = 28;
  const max = niceMax(Math.max(1, ...points.flatMap((p) => p.values)));
  const n = points.length;
  const step = (W - L - R) / Math.max(1, n - (bars ? 0 : 1));
  const sx = (i: number) => (bars ? L + step * i + step / 2 : L + step * i);
  const sy = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, max / 2, max];
  const labelEvery = Math.max(1, Math.ceil(n / 7));
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const xv = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round((xv - (bars ? L + step / 2 : L)) / step);
    setHover(i >= 0 && i < n ? i : null);
  };
  const hp = hover != null ? points[hover] : null;
  return (
    <figure className="chart admin-chart">
      <figcaption>{title}</figcaption>
      {names.length > 1 && (
        <div className="legend">
          {names.map((nm, k) => <span key={nm}><i className={`swatch-s${k + 1}`} />{nm}</span>)}
        </div>
      )}
      <div className="chart-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={title}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} className="grid" />
              <text x={L - 8} y={sy(t) + 4} className="tick" textAnchor="end">{Math.round(t)}</text>
            </g>
          ))}
          {points.map((p, i) => (i % labelEvery === 0 || i === n - 1) && (
            <text key={p.day} x={sx(i)} y={H - 8} className="tick" textAnchor="middle">{shortDay(p.day, lang)}</text>
          ))}
          {bars
            ? points.map((p, i) => {
                const w = Math.max(2, step - 4);
                const h = (H - T - B) - (sy(p.values[0]) - T);
                return h > 0 ? <path key={p.day} className="bar s1" d={`M${sx(i) - w / 2} ${H - B} V${sy(p.values[0]) + 4} q0 -4 4 -4 H${sx(i) + w / 2 - 4} q4 0 4 4 V${H - B} Z`} /> : null;
              })
            : names.map((nm, k) => {
                const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)} ${sy(p.values[k]).toFixed(1)}`).join(' ');
                const last = points[n - 1];
                return (
                  <g key={nm}>
                    <path d={d} className={`series-line s${k + 1}`} />
                    {last && <text x={sx(n - 1) + 8} y={sy(last.values[k]) + 4 + (k ? 10 : -4)} className="end-label">{nm} {last.values[k]}</text>}
                  </g>
                );
              })}
          {hp && (
            <g>
              <line x1={sx(hover!)} x2={sx(hover!)} y1={T} y2={H - B} className="crosshair" />
              {!bars && hp.values.map((v, k) => <circle key={k} cx={sx(hover!)} cy={sy(v)} r={4} className={`hover-dot s${k + 1}`} />)}
            </g>
          )}
        </svg>
      </div>
      <div className="chart-tip" aria-live="polite">
        {hp ? `${shortDay(hp.day, lang)}: ${names.map((nm, k) => `${nm} ${hp.values[k]}`).join(' · ')}` : ' '}
      </div>
    </figure>
  );
}

function ReactionName({ reaction, kind, x, lang }: { reaction: string; kind: string; x: Extra; lang: Lang }) {
  const detail = reaction.includes(':') ? reaction.slice(reaction.indexOf(':') + 1) : '';
  const label = x.admin.kinds[kind] ?? kind;
  if (!detail) return <>{label}</>;
  if (kind === 'gasTest') {
    const s = STRINGS[lang];
    return <>{label} · {s.events.gasTest({ result: detail }, makeH(lang, s), { kind: 'gasTest', importance: 2, p: {}, signs: [] }).title}</>;
  }
  const parts = detail.split(/[|+]/).filter(Boolean);
  return (
    <>
      {label} · {parts.map((p, i) => {
        const r = REAGENT_BY_ID[p];
        return <span key={p}>{i > 0 && ', '}{r?.indicator ? STRINGS[lang].indicators[r.indicator] : <Formula f={r?.formula ?? p} />}</span>;
      })}
    </>
  );
}

function Split({ title, data, names }: { title: string; data: Record<string, number>; names?: Record<string, string> }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, [, v]) => s + v, 0) || 1;
  return (
    <div className="split">
      <h3>{title}</h3>
      {rows.length === 0 ? <p className="note">—</p> : rows.map(([k, v]) => (
        <div key={k} className="split-row">
          <span>{names?.[k] ?? k}</span>
          <div className="split-bar"><i style={{ width: `${(v / total) * 100}%` }} /></div>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

export function AdminPage({ x, lang, onBack, onLogin }: { x: Extra; lang: Lang; onBack: () => void; onLogin: () => void }) {
  const { token, account } = useSession();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const a = x.admin;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await api.adminStats(token, days);
    setLoading(false);
    if (res.error) { setError(res.error); setData(null); return; }
    setError(null);
    setData(res);
  }, [token, days]);

  useEffect(() => { void load(); }, [load]);

  const setRole = async (id: string, role: string) => {
    if (!token) return;
    await api.adminSetRole(token, id, role);
    void load();
  };

  const fmtDate = (s: string) => {
    try { return new Date(s).toLocaleString(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return s; }
  };

  const allowed = account?.role === 'admin' && token;
  const t = data?.totals;
  const gradeNames: Record<string, string> = { unknown: a.unknown };
  const langNames: Record<string, string> = { kk: 'Қазақша', ru: 'Русский', en: 'English', unknown: a.unknown };

  return (
    <div className="admin">
      <header className="admin-head">
        <button type="button" className="btn" onClick={onBack}>← {a.back}</button>
        <h1>{a.title}</h1>
        {allowed && (
          <div className="admin-controls">
            <span>{a.period}</span>
            <div className="seg" role="group" aria-label={a.period}>
              {[7, 30, 90].map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{a.days(d)}</button>)}
            </div>
            <button type="button" className="btn small" onClick={() => void load()} disabled={loading}>{loading ? a.loading : a.refresh}</button>
          </div>
        )}
      </header>
      {!allowed ? (
        <div className="admin-body"><p className="note">{a.forbidden}</p>{!account && <button type="button" className="btn primary" onClick={onLogin}>{x.account.login}</button>}</div>
      ) : error ? (
        <div className="admin-body"><p className="bad-text">{error === 'forbidden' ? a.forbidden : x.account.errors.network}</p></div>
      ) : !data || !t ? (
        <div className="admin-body"><p className="note">{a.loading}</p></div>
      ) : (
        <div className="admin-body">
          <div className="kpis">
            <div className="kpi"><span>{a.visitsToday}</span><b>{t.visitsToday}</b><em>{a.visitors}: {t.visitorsToday}</em></div>
            <div className="kpi"><span>{a.visitors}</span><b>{t.visitors}</b><em>{a.visits}: {t.visits}</em></div>
            <div className="kpi"><span>{a.accounts}</span><b>{t.accounts}</b><em>{a.newAccounts}: {t.newAccounts}</em></div>
            <div className="kpi"><span>{a.active7}</span><b>{t.activeAccounts}</b><em>{a.accounts}: {t.accounts}</em></div>
            <div className="kpi"><span>{a.experiments}</span><b>{t.experiments}</b><em>{a.days(data.days)}</em></div>
          </div>
          <div className="admin-grid">
            <LineChart title={a.chartVisits} names={[a.legendVisits, a.legendVisitors]} lang={lang}
              points={data.daily.map((d) => ({ day: d.day, values: [d.visits, d.visitors] }))} />
            <LineChart title={a.chartActivity} names={[a.legendExperiments]} lang={lang} bars
              points={data.daily.map((d) => ({ day: d.day, values: [d.experiments] }))} />
          </div>
          <div className="admin-grid three">
            <Split title={a.devices} data={data.devices} names={a.deviceNames} />
            <Split title={a.langs} data={data.langs} names={langNames} />
            <Split title={a.grades} data={data.grades} names={gradeNames} />
          </div>
          <div className="admin-grid">
            <div className="table-card">
              <h3>{a.topReactions}</h3>
              {data.topReactions.length === 0 ? <p className="note">{a.none}</p> : (
                <div className="table-scroll">
                  <table className="data">
                    <thead><tr><th>#</th><th>{a.topReactions}</th><th className="num">{a.count}</th></tr></thead>
                    <tbody>
                      {data.topReactions.map((r, i) => <tr key={r.reaction}><td>{i + 1}</td><td><ReactionName reaction={r.reaction} kind={r.kind} x={x} lang={lang} /></td><td className="num">{r.count}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="table-card">
              <h3>{a.users}</h3>
              {data.accounts.length === 0 ? <p className="note">{a.none}</p> : (
                <div className="table-scroll">
                  <table className="data">
                    <thead><tr><th>{a.nickname}</th><th>{x.account.grade}</th><th>{a.role}</th><th>{a.lastSeen}</th><th className="num">{a.experiments}</th><th className="num">{a.discoveries}</th></tr></thead>
                    <tbody>
                      {data.accounts.map((u) => (
                        <tr key={u.id}>
                          <td>{u.nickname}</td>
                          <td>{u.grade ?? '—'}</td>
                          <td>
                            <select value={u.role} onChange={(e) => void setRole(u.id, e.target.value)} disabled={u.id === account?.id} aria-label={`${a.role}: ${u.nickname}`}>
                              {(['student', 'teacher', 'admin'] as const).map((r) => <option key={r} value={r}>{a.roles[r]}</option>)}
                            </select>
                          </td>
                          <td>{fmtDate(u.lastSeenAt)}</td>
                          <td className="num">{u.experiments}</td>
                          <td className="num">{u.discoveries}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

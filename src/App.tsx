import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Lang } from './engine/data';
import { REAGENT_BY_ID } from './engine/data';
import type { Amount } from './engine/actions';
import type { GasTool } from './engine/apparatus';
import type { VesselKind } from './engine/vessel';
import { LANGS, STRINGS, fmt } from './i18n';
import { EXTRA } from './i18n/extra';
import { mountLogo, type HexaLogo } from './logo/hexaLogo';
import { Lab, type JournalEntry, type Outcome } from './state/lab';
import { api } from './net/api';
import { BACKEND_ON } from './net/config';
import { deviceType, session, useSession, visitorId } from './net/session';
import { Bench } from './ui/Bench';
import { BottleIcon, LampSVG } from './ui/icons';
import { Formula } from './ui/Formula';
import { JournalModal, ReagentModal, TablesModal } from './ui/Modals';
import { Panel, type Grade } from './ui/Panel';
import { Shelf } from './ui/Shelf';
import { APP_NAME, TopBar, type Skin } from './ui/TopBar';
import { AuthModal, ProfileModal } from './ui/Account';
import { AdminPage } from './ui/Admin';
import { useDrag, type DragItem } from './ui/drag';
import { LAB_MORE } from './i18n/labMore';

interface Settings { lang: Lang; grade: Grade; skin: Skin; ml: number; g: number; focus: boolean }

function initialSettings(): Settings {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'ru').toLowerCase();
  const fallback: Settings = { lang: nav.startsWith('kk') ? 'kk' : nav.startsWith('en') ? 'en' : 'ru', grade: 8, skin: 'bright', ml: 2, g: 0.5, focus: false };
  try {
    const saved = JSON.parse(localStorage.getItem('cchem.settings') || '{}') as Partial<Settings>;
    return { ...fallback, ...saved };
  } catch {
    return fallback;
  }
}

const lab = new Lab();
const coarsePointer = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const isAdminRoute = () => typeof location !== 'undefined' && location.hash === '#admin';

function Ghost({ lang }: { lang: Lang }) {
  const drag = useDrag();
  if (!drag) return null;
  const style = { left: drag.x, top: drag.y };
  if (drag.item.kind === 'reagent') {
    const r = REAGENT_BY_ID[drag.item.id];
    return (
      <div className="ghost" style={style}>
        <BottleIcon color={r.bottle} solid={r.kind === 'solid'} />
        {r.indicator ? r.name[lang] : <Formula f={r.formula} />}
      </div>
    );
  }
  if (drag.item.kind === 'lamp') return <div className="ghost" style={style}><LampSVG lit width={22} height={38} /></div>;
  return <div className="ghost" style={style}>→</div>;
}

function Splash({ lang, setLang, onStart }: { lang: Lang; setLang: (l: Lang) => void; onStart: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [hide, setHide] = useState(false);
  const s = STRINGS[lang];
  useEffect(() => {
    if (!host.current) return;
    // CC Lab mark first, then it turns into the CC Hexa logo.
    const logo = mountLogo(host.current, { interval: 0, label: APP_NAME, startAsLab: true });
    const t = window.setTimeout(() => logo.toggle(), 600);
    return () => { clearTimeout(t); logo.destroy(); };
  }, []);
  const start = () => { setHide(true); window.setTimeout(onStart, 350); };
  return (
    <div className={`splash-screen ${hide ? 'hide' : ''}`} onClick={start} role="dialog" aria-label={APP_NAME}>
      <div className="splash-card">
        <div className="splash-logo" ref={host} />
        <h1 className="splash-name">{APP_NAME}</h1>
        <p className="splash-tag">{s.tagline}</p>
        <div className="seg" role="group" aria-label={s.language} onClick={(e) => e.stopPropagation()}>
          {LANGS.map((l) => (
            <button key={l.id} type="button" aria-pressed={lang === l.id} lang={l.id} onClick={() => setLang(l.id)}>{l.short}</button>
          ))}
        </div>
        <button type="button" className="btn primary splash-hint" onClick={(e) => { e.stopPropagation(); start(); }}>{s.splashHint}</button>
      </div>
    </div>
  );
}

export function App() {
  useSyncExternalStore(lab.subscribe, lab.getVersion);
  const { token, account } = useSession();
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [modal, setModal] = useState<'tables' | 'journal' | 'auth' | 'profile' | null>(null);
  const [reagentInfo, setReagentInfo] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [admin, setAdmin] = useState(isAdminRoute);
  const [splash, setSplash] = useState(() => {
    if (isAdminRoute()) return false;
    try { return !sessionStorage.getItem('cchem.splash'); } catch { return true; }
  });
  const [touch] = useState(coarsePointer);
  const logoRef = useRef<HexaLogo | null>(null);
  const { lang, grade, skin, ml, g, focus } = settings;
  const lm = LAB_MORE[lang];
  const s = STRINGS[lang];
  const x = EXTRA[lang];

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem('cchem.settings', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.skin = skin;
    root.lang = lang;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', skin === 'brand' ? '#000000' : '#1450F5');
  }, [skin, lang]);

  useEffect(() => {
    const onHash = () => setAdmin(isAdminRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const openAdmin = () => { location.hash = 'admin'; setAdmin(true); };
  const closeAdmin = () => { history.replaceState(null, '', location.pathname + location.search); setAdmin(false); };

  const say = useCallback((msg: string) => setToast({ msg, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Attendance: one visit per page load (the server counts at most one per 30 minutes).
  useEffect(() => {
    if (!BACKEND_ON) return;
    void api.trackVisit(visitorId(), session.get().token, lang, grade, deviceType(), (document.referrer || '').slice(0, 120));
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Experiments go to the server for the admin statistics.
  useEffect(() => {
    lab.onRecord = (e: JournalEntry) => {
      if (!BACKEND_ON) return;
      void api.trackExperiment(visitorId(), session.get().token, e.event.key ?? e.event.kind, e.event.kind, settingsRef.current.grade);
    };
  }, []);

  // Signed in: load progress from the server, then keep saving it.
  const saveTimer = useRef(0);
  useEffect(() => {
    if (!token) { lab.onChange = undefined; return; }
    let alive = true;
    void api.me(token).then((res) => {
      if (!alive) return;
      if (res.error === 'auth') { void session.signOut(); return; }
      if (res.account) session.setAccount(res.account);
      if (res.progress) lab.mergeProgress(res.progress.discoveries ?? [], (res.progress.journal ?? []) as JournalEntry[]);
    });
    lab.onChange = () => {
      clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void api.saveProgress(token, lab.discoveries, lab.journal.slice(-150));
      }, 2500);
    };
    return () => { alive = false; };
  }, [token]);

  const celebrate = useCallback((found: string[]) => {
    if (!found.length) return;
    say(`${s.toasts.discovery} ${s.discoveries(lab.discoveries.length)}`);
    logoRef.current?.flash();
    lab.onChange?.();
  }, [s, say]);

  const handle = useCallback((out: Outcome) => {
    if (out.placed && !out.error) say(LAB_MORE[settingsRef.current.lang].ui.placedTube);
    else if (out.error === 'full') say(s.toasts.full);
    else if (out.error === 'empty') say(s.toasts.emptyPour);
    else if (out.error === 'broken') say(x.broken.title);
    else if (out.result?.overflow) say(x.spill(fmt(out.result.overflow, lang, 1)));
    else if (out.result?.partial) say(x.partialPour(fmt(out.result.added ?? 0, lang, 1)));
    celebrate(out.discovered);
  }, [s, x, lang, say, celebrate]);

  // Time runs on: heating, cooling, electrolysis, titration and fading effects.
  useEffect(() => {
    const id = window.setInterval(() => {
      const r = lab.step(0.25);
      celebrate(r.discovered);
    }, 250);
    return () => clearInterval(id);
  }, [celebrate]);

  const undo = useCallback(() => { if (!lab.undo()) say(s.toasts.nothingToUndo); }, [s, say]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && tag !== 'INPUT' && tag !== 'SELECT') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  const amountFor = (id: string): Amount => {
    const r = REAGENT_BY_ID[id];
    if (r?.indicator) return { drops: 2 };
    return r?.kind === 'solid' ? { g } : { ml };
  };

  const onDrop = (item: DragItem, target: string) => {
    if (item.kind === 'reagent') handle(lab.add(item.id, amountFor(item.id), target));
    else if (item.kind === 'vessel') {
      if (item.id === target) return;
      if (target === 'collector') lab.setTube(item.id, 'collector');
      else handle(lab.pour(item.id, target));
    } else lab.toggleHeat(target);
  };

  const onIdea = (steps: string[]) => {
    if (lab.has(lab.selected)) lab.wash();
    const found: string[] = [];
    for (const id of steps) found.push(...lab.add(id, REAGENT_BY_ID[id]?.indicator ? { drops: 2 } : REAGENT_BY_ID[id]?.kind === 'solid' ? { g: 0.3 } : { ml: 2 }).discovered);
    celebrate(found);
  };

  const onTest = (target: string, tool: GasTool) => celebrate(lab.testGas(target, tool).discovered);

  const onAddVessel = (kind: VesselKind) => { if (!lab.addVessel(kind)) say(x.noRoom); };

  const now = Date.now();

  if (admin) {
    return (
      <>
        <AdminPage x={x} lang={lang} onBack={closeAdmin} onLogin={() => setModal('auth')} />
        {modal === 'auth' && <AuthModal x={x} lang={lang} grade={grade} onClose={() => setModal(null)} onSignedIn={(n) => say(x.account.welcome(n))} />}
        <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast?.msg}</div>
      </>
    );
  }

  return (
    <>
      <div className="app">
        <TopBar s={s} x={x} lang={lang} grade={grade} skin={skin} found={lab.discoveries.length} logoRef={logoRef} account={account}
          setLang={(l) => { update({ lang: l }); if (token) void api.updateProfile(token, null, l); }}
          setGrade={(gr) => { update({ grade: gr }); if (token) void api.updateProfile(token, gr, lang); }}
          setSkin={(k) => update({ skin: k })}
          onTables={() => setModal('tables')} onJournal={() => setModal('journal')}
          onAccount={() => setModal(account ? 'profile' : 'auth')}
          onUndo={undo} onClear={() => { if (lab.clearAll()) say(s.toasts.cleared); }} />
        <Shelf s={s} x={x} lang={lang} ml={ml} g={g} setMl={(v) => update({ ml: v })} setG={(v) => update({ g: v })}
          onAdd={(id) => handle(lab.add(id, amountFor(id)))} onDrop={(id, t) => handle(lab.add(id, amountFor(id), t))} onInfo={setReagentInfo} />
        <Bench lab={lab} s={s} x={x} lang={lang} now={now} touch={touch} onDrop={onDrop} onLampTap={() => lab.toggleHeat()} onAddVessel={onAddVessel}
          focus={focus} setFocus={(f) => update({ focus: f })} onReset={() => say(lab.reset() ? lm.ui.resetDone : lm.ui.nothingToReset)} />
        <Panel lab={lab} s={s} x={x} lang={lang} grade={grade} now={now} onIdea={onIdea}
          onHeat={() => lab.toggleHeat()} onWash={() => { lab.wash(); say(s.toasts.washed); }}
          onPour={(t) => handle(lab.pour(lab.selected, t))} onTest={onTest} onReplace={() => lab.wash()}
          onFilter={(t) => handle(lab.pour(lab.selected, t, true))}
          onMagnet={() => celebrate(lab.magnet().discovered)} onFlame={() => celebrate(lab.flameTest().discovered)}
          onAddVessel={onAddVessel} />
      </div>
      <Ghost lang={lang} />
      {modal === 'tables' && <TablesModal s={s} lang={lang} onClose={() => setModal(null)} onAdd={(id) => handle(lab.add(id, amountFor(id)))} />}
      {modal === 'journal' && <JournalModal lab={lab} s={s} x={x} lang={lang} onClose={() => setModal(null)} />}
      {modal === 'auth' && <AuthModal x={x} lang={lang} grade={grade} onClose={() => setModal(null)} onSignedIn={(n) => say(x.account.welcome(n))} />}
      {modal === 'profile' && <ProfileModal x={x} onClose={() => setModal(null)} onAdmin={openAdmin} onSaved={say} />}
      {reagentInfo && <ReagentModal id={reagentInfo} s={s} x={x} lang={lang} onClose={() => setReagentInfo(null)} onAdd={(id) => handle(lab.add(id, amountFor(id)))} />}
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast?.msg}</div>
      {splash && (
        <Splash lang={lang} setLang={(l) => update({ lang: l })}
          onStart={() => { setSplash(false); try { sessionStorage.setItem('cchem.splash', '1'); } catch { /* ignore */ } }} />
      )}
    </>
  );
}

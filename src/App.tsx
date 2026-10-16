import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Lang } from './engine/data';
import { REAGENT_BY_ID } from './engine/data';
import type { Dose } from './engine/actions';
import { LANGS, STRINGS } from './i18n';
import { mountLogo, type HexaLogo } from './logo/hexaLogo';
import { Lab, type Outcome } from './state/lab';
import { Bench } from './ui/Bench';
import { BottleIcon, LampSVG } from './ui/icons';
import { Formula } from './ui/Formula';
import { JournalModal, TablesModal } from './ui/Modals';
import { Panel, type Grade } from './ui/Panel';
import { Shelf } from './ui/Shelf';
import { APP_NAME, TopBar, type Skin } from './ui/TopBar';
import { useDrag, type DragItem } from './ui/drag';

interface Settings { lang: Lang; grade: Grade; skin: Skin; dose: Dose }

function initialSettings(): Settings {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'ru').toLowerCase();
  const fallback: Settings = { lang: nav.startsWith('kk') ? 'kk' : nav.startsWith('en') ? 'en' : 'ru', grade: 8, skin: 'bright', dose: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem('cchem.settings') || '{}') as Partial<Settings>;
    return { ...fallback, ...saved };
  } catch {
    return fallback;
  }
}

const lab = new Lab();
const coarsePointer = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

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
  const v = lab.vessel(drag.item.id);
  return <div className="ghost" style={style}>{v.kind === 'tube' ? `→ ${v.id.slice(1)}` : '→'}</div>;
}

function Splash({ lang, setLang, onStart }: { lang: Lang; setLang: (l: Lang) => void; onStart: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [hide, setHide] = useState(false);
  const s = STRINGS[lang];
  useEffect(() => {
    if (!host.current) return;
    const logo = mountLogo(host.current, { interval: 0, label: APP_NAME });
    const t = window.setTimeout(() => logo.play(), 350);
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
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [modal, setModal] = useState<'tables' | 'journal' | null>(null);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [splash, setSplash] = useState(() => {
    try { return !sessionStorage.getItem('cchem.splash'); } catch { return true; }
  });
  const [touch] = useState(coarsePointer);
  const logoRef = useRef<HexaLogo | null>(null);
  const { lang, grade, skin, dose } = settings;
  const s = STRINGS[lang];

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

  const say = useCallback((msg: string) => setToast({ msg, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const celebrate = useCallback((found: string[]) => {
    if (!found.length) return;
    say(`${s.toasts.discovery} ${s.discoveries(lab.discoveries.length)}`);
    logoRef.current?.flash();
  }, [s, say]);

  const handle = useCallback((out: Outcome) => {
    if (out.error === 'full') say(s.toasts.full);
    else if (out.error === 'empty') say(s.toasts.emptyPour);
    celebrate(out.discovered);
  }, [s, say, celebrate]);

  // Time runs on: heating, cooling and fading effects.
  useEffect(() => {
    const id = window.setInterval(() => celebrate(lab.step(0.25)), 250);
    return () => clearInterval(id);
  }, [celebrate]);

  const undo = useCallback(() => { if (!lab.undo()) say(s.toasts.nothingToUndo); }, [s, say]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && tag !== 'INPUT') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  const onDrop = (item: DragItem, target: string) => {
    if (item.kind === 'reagent') handle(lab.add(item.id, dose, target));
    else if (item.kind === 'vessel') { if (item.id !== target) handle(lab.pour(item.id, target)); }
    else lab.toggleHeat(target);
  };

  const onIdea = (steps: string[]) => {
    lab.wash();
    const found: string[] = [];
    for (const id of steps) found.push(...lab.add(id, 1).discovered);
    celebrate(found);
  };

  const now = Date.now();

  return (
    <>
      <div className="app">
        <TopBar s={s} lang={lang} grade={grade} skin={skin} found={lab.discoveries.length} logoRef={logoRef}
          setLang={(l) => update({ lang: l })} setGrade={(g) => update({ grade: g })} setSkin={(k) => update({ skin: k })}
          onTables={() => setModal('tables')} onJournal={() => setModal('journal')}
          onUndo={undo} onClear={() => { if (lab.clearAll()) say(s.toasts.cleared); }} />
        <Shelf s={s} lang={lang} dose={dose} setDose={(d) => update({ dose: d })}
          onAdd={(id) => handle(lab.add(id, dose))} onDrop={(id, t) => handle(lab.add(id, dose, t))} />
        <Bench lab={lab} s={s} lang={lang} now={now} touch={touch} onDrop={onDrop} onLampTap={() => lab.toggleHeat()} />
        <Panel lab={lab} s={s} lang={lang} grade={grade} now={now} onIdea={onIdea}
          onHeat={() => lab.toggleHeat()} onWash={() => { lab.wash(); say(s.toasts.washed); }}
          onPour={(t) => handle(lab.pour(lab.selected, t))} />
      </div>
      <Ghost lang={lang} />
      {modal === 'tables' && <TablesModal s={s} lang={lang} onClose={() => setModal(null)} />}
      {modal === 'journal' && <JournalModal lab={lab} s={s} lang={lang} onClose={() => setModal(null)} />}
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast?.msg}</div>
      {splash && (
        <Splash lang={lang} setLang={(l) => update({ lang: l })}
          onStart={() => { setSplash(false); try { sessionStorage.setItem('cchem.splash', '1'); } catch { /* ignore */ } }} />
      )}
    </>
  );
}

import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Lang } from '../engine/data';
import { LANGS } from '../i18n';
import type { Strings } from '../i18n/types';
import { mountLogo, type HexaLogo } from '../logo/hexaLogo';
import { IconJournal, IconTables, IconTrash, IconUndo, IconUser } from './icons';
import type { Grade } from './Panel';
import type { Extra } from '../i18n/extra';
import type { Account } from '../net/api';

export const APP_NAME = 'CC Hexa';
export type Skin = 'bright' | 'brand';

export function TopBar({ s, x, lang, grade, skin, found, logoRef, account, setLang, setGrade, setSkin, onTables, onJournal, onAccount, onUndo, onClear }: {
  s: Strings; x: Extra; lang: Lang; grade: Grade; skin: Skin; found: number; account: Account | null;
  onAccount: () => void;
  logoRef: MutableRefObject<HexaLogo | null>;
  setLang: (l: Lang) => void; setGrade: (g: Grade) => void; setSkin: (k: Skin) => void;
  onTables: () => void; onJournal: () => void; onUndo: () => void; onClear: () => void;
}) {
  const host = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const logo = mountLogo(host.current, { interval: 50000, label: APP_NAME });
    logoRef.current = logo;
    return () => { logo.destroy(); logoRef.current = null; };
  }, [logoRef]);

  return (
    <header className="top">
      <div className="brand">
        <button className="logo" ref={host} type="button" aria-label={APP_NAME} onClick={() => logoRef.current?.play()} />
        <span className="wordmark">{APP_NAME}</span>
        {found > 0 && <span className="found">{s.discoveries(found)}</span>}
      </div>
      <div className="grade">
        <span className="grade-label">{s.grade}</span>
        <div className="seg" role="group" aria-label={s.grade}>
          {([7, 8, 9, 10, 11] as Grade[]).map((g) => (
            <button key={g} type="button" aria-pressed={grade === g} title={s.gradeNotes[g]} onClick={() => setGrade(g)}>{g}</button>
          ))}
        </div>
      </div>
      <button className="tool" type="button" onClick={onTables} aria-label={s.tables}><IconTables /><span>{s.tables}</span></button>
      <button className="tool" type="button" onClick={onJournal} aria-label={s.journal}><IconJournal /><span>{s.journal}</span></button>
      <div className="spacer" />
      <div className="seg" role="group" aria-label={s.language}>
        {LANGS.map((l) => (
          <button key={l.id} type="button" aria-pressed={lang === l.id} lang={l.id} onClick={() => setLang(l.id)}>{l.short}</button>
        ))}
      </div>
      <div className="seg" role="group" aria-label={s.theme.label}>
        <button type="button" aria-pressed={skin === 'bright'} onClick={() => setSkin('bright')}>{s.theme.bright}</button>
        <button type="button" aria-pressed={skin === 'brand'} onClick={() => setSkin('brand')}>{s.theme.brand}</button>
      </div>
      <button className={`account-btn ${account ? 'signed' : ''}`} type="button" onClick={onAccount} title={account ? account.nickname : x.account.login}>
        <IconUser /><span>{account ? account.nickname : x.account.login}</span>
      </button>
      <button className="icon-btn" type="button" title={s.undo} aria-label={s.undo} onClick={onUndo}><IconUndo /></button>
      <button className="icon-btn" type="button" title={s.clearAll} aria-label={s.clearAll} onClick={onClear}><IconTrash /></button>
    </header>
  );
}

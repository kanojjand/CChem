import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Lang } from '../engine/data';
import type { Extra } from '../i18n/extra';
import { api } from '../net/api';
import { BACKEND_ON } from '../net/config';
import { session, useSession } from '../net/session';
import { IconClose } from './icons';

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal narrow" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="×"><IconClose /></button>
        </div>
        <div />
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function AuthModal({ x, lang, grade, onClose, onSignedIn }: {
  x: Extra; lang: Lang; grade: number; onClose: () => void; onSignedIn: (nickname: string) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [g, setG] = useState<number>(grade);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const a = x.account;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'register') {
      if (nickname.trim().length < 3 || nickname.trim().length > 24 || /[<>@/\\]/.test(nickname)) { setError(a.errors.nickname); return; }
      if (password.length < 6 || password.length > 72) { setError(a.errors.password); return; }
    }
    setBusy(true);
    const res = mode === 'register' ? await api.register(nickname.trim(), password, g, lang) : await api.login(nickname.trim(), password);
    setBusy(false);
    if (res.error || !res.token || !res.account) {
      const code = (res.error ?? 'network') as keyof typeof a.errors;
      setError(a.errors[code] ?? a.errors.network);
      return;
    }
    session.signIn(res.token, res.account);
    onSignedIn(res.account.nickname);
    onClose();
  };

  return (
    <Dialog title={mode === 'register' ? a.register : a.login} onClose={onClose}>
      {!BACKEND_ON ? <p className="note">{a.offline}</p> : (
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="auth-nick">{a.nickname}</label>
          <input id="auth-nick" autoComplete="username" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} required />
          <label htmlFor="auth-pass">{a.password}</label>
          <input id="auth-pass" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} required />
          {mode === 'register' && (
            <>
              <label htmlFor="auth-grade">{a.grade}</label>
              <select id="auth-grade" value={g} onChange={(e) => setG(Number(e.target.value))}>
                {[7, 8, 9, 10, 11].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </>
          )}
          {error && <p className="bad-text" role="alert">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy}>{busy ? '…' : mode === 'register' ? a.register : a.login}</button>
          <button type="button" className="link-btn" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(null); }}>
            {mode === 'register' ? a.haveAccount : a.noAccount}
          </button>
          <p className="grade-note">{a.privacy}</p>
        </form>
      )}
    </Dialog>
  );
}

export function ProfileModal({ x, onClose, onAdmin, onSaved }: { x: Extra; onClose: () => void; onAdmin: () => void; onSaved: (msg: string) => void }) {
  const { token, account } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const a = x.account;
  if (!account || !token) return null;

  const claim = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await api.claimAdmin(token, code.trim());
    if (res.error || !res.account) { setError(res.error === 'network' ? a.errors.network : a.errors.code); return; }
    session.setAccount(res.account);
    onSaved(a.adminOk);
  };

  return (
    <Dialog title={account.nickname} onClose={onClose}>
      <div className="profile">
        <p className="grade-note">{a.privacy}</p>
        {account.role === 'admin' ? (
          <button type="button" className="btn primary" onClick={() => { onClose(); onAdmin(); }}>{a.admin}</button>
        ) : (
          <form className="auth-form" onSubmit={claim}>
            <label htmlFor="admin-code">{a.adminCode}</label>
            <input id="admin-code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
            {error && <p className="bad-text" role="alert">{error}</p>}
            <button type="submit" className="btn" disabled={!code.trim()}>{a.adminClaim}</button>
          </form>
        )}
        <button type="button" className="btn" onClick={() => { void session.signOut(); onClose(); }}>{a.logout}</button>
      </div>
    </Dialog>
  );
}

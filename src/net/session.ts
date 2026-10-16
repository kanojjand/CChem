// The signed-in account (kept in the browser), the anonymous visitor id used for
// attendance statistics, and syncing of progress to the server.

import { useSyncExternalStore } from 'react';
import { api, type Account } from './api';

const TOKEN_KEY = 'cchem.token';
const ACCOUNT_KEY = 'cchem.account';
const VISITOR_KEY = 'cchem.visitor';

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string | null) {
  try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* ignore */ }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function visitorId(): string {
  let id = read(VISITOR_KEY);
  if (!id) { id = uuid(); write(VISITOR_KEY, id); }
  return id;
}

export function deviceType(): 'phone' | 'tablet' | 'desktop' {
  const w = Math.min(window.screen?.width ?? window.innerWidth, window.screen?.height ?? window.innerHeight);
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (coarse && w < 600) return 'phone';
  if (coarse) return 'tablet';
  return 'desktop';
}

interface SessionState { token: string | null; account: Account | null }

let state: SessionState = {
  token: read(TOKEN_KEY),
  account: (() => { try { return JSON.parse(read(ACCOUNT_KEY) || 'null') as Account | null; } catch { return null; } })()
};
const listeners = new Set<() => void>();

function set(next: SessionState) {
  state = next;
  write(TOKEN_KEY, next.token);
  write(ACCOUNT_KEY, next.account ? JSON.stringify(next.account) : null);
  for (const fn of listeners) fn();
}

export const session = {
  get: () => state,
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  signIn(token: string, account: Account) { set({ token, account }); },
  setAccount(account: Account) { set({ ...state, account }); },
  async signOut() {
    const t = state.token;
    set({ token: null, account: null });
    if (t) await api.logout(t);
  }
};

export function useSession(): SessionState {
  return useSyncExternalStore(session.subscribe, session.get);
}

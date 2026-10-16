// Calls to the database functions (Supabase RPC). Every call returns either data or an
// error code; network problems come back as { error: 'network' }.

import { BACKEND_ON, SUPABASE_KEY, SUPABASE_URL } from './config';

export interface Account { id: string; nickname: string; grade: number | null; lang: string | null; role: 'student' | 'teacher' | 'admin'; createdAt: string }
export interface AuthResult { token?: string; account?: Account; error?: string }

export interface AdminStats {
  days: number;
  totals: { visits: number; visitors: number; visitsToday: number; visitorsToday: number; accounts: number; newAccounts: number; activeAccounts: number; experiments: number };
  daily: { day: string; visits: number; visitors: number; experiments: number; signups: number }[];
  devices: Record<string, number>;
  langs: Record<string, number>;
  grades: Record<string, number>;
  topReactions: { reaction: string; kind: string; count: number }[];
  accounts: { id: string; nickname: string; grade: number | null; role: Account['role']; createdAt: string; lastSeenAt: string; experiments: number; discoveries: number }[];
  error?: string;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T & { error?: string }> {
  if (!BACKEND_ON) return { error: 'network' } as T & { error?: string };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    if (!res.ok) return { error: res.status === 429 ? 'locked' : 'network' } as T & { error?: string };
    return (await res.json()) as T & { error?: string };
  } catch {
    return { error: 'network' } as T & { error?: string };
  }
}

export const api = {
  register: (nickname: string, password: string, grade: number | null, lang: string) =>
    rpc<AuthResult>('cc_register', { p_nickname: nickname, p_password: password, p_grade: grade, p_lang: lang }),
  login: (nickname: string, password: string) => rpc<AuthResult>('cc_login', { p_nickname: nickname, p_password: password }),
  logout: (token: string) => rpc<{ ok?: boolean }>('cc_logout', { p_token: token }),
  me: (token: string) => rpc<{ account?: Account; progress?: { discoveries: string[]; journal: unknown[] } }>('cc_me', { p_token: token }),
  updateProfile: (token: string, grade: number | null, lang: string) => rpc<{ account?: Account }>('cc_update_profile', { p_token: token, p_grade: grade, p_lang: lang }),
  saveProgress: (token: string, discoveries: string[], journal: unknown[]) =>
    rpc<{ ok?: boolean }>('cc_save_progress', { p_token: token, p_discoveries: discoveries, p_journal: journal }),
  trackVisit: (visitor: string, token: string | null, lang: string, grade: number, device: string, referrer: string) =>
    rpc<{ ok?: boolean }>('cc_track_visit', { p_visitor: visitor, p_token: token, p_lang: lang, p_grade: grade, p_device: device, p_referrer: referrer }),
  trackExperiment: (visitor: string, token: string | null, reaction: string, kind: string, grade: number) =>
    rpc<{ ok?: boolean }>('cc_track_experiment', { p_visitor: visitor, p_token: token, p_reaction: reaction, p_kind: kind, p_grade: grade }),
  claimAdmin: (token: string, code: string) => rpc<{ account?: Account }>('cc_claim_admin', { p_token: token, p_code: code }),
  adminStats: (token: string, days: number) => rpc<AdminStats>('cc_admin_stats', { p_token: token, p_days: days }),
  adminSetRole: (token: string, account: string, role: string) => rpc<{ ok?: boolean }>('cc_admin_set_role', { p_token: token, p_account: account, p_role: role })
};

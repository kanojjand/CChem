// Supabase project of the lab. The publishable key is meant to be public: the database
// tables are closed, and the app can only call the cc_* functions.
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? 'https://kckwaafkosjyxuevblsl.supabase.co';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_lhOwUTNU0eFnzNtIB4PN0Q_D3y2eYdW';
export const BACKEND_ON = Boolean(SUPABASE_URL && SUPABASE_KEY);

import { isSupabaseConfigured, supabase } from '../lib/supabase';

export async function hasSupabaseAuthSession(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session?.access_token);
}

export function hasSupabaseAuthSessionSync(): boolean {
  if (!isSupabaseConfigured) return false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { access_token?: string };
      if (parsed.access_token) return true;
    } catch {
      // ignore malformed auth storage
    }
  }
  return false;
}

import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AppAccount, AuthSession, UserRole } from '../types/auth';

const EMAIL_DOMAIN = 'kyanban.example.com';

interface ProfileRow {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

function getClientConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return { url, key };
}

function createEphemeralClient() {
  const { url, key } = getClientConfig();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function toSession(accessToken: string, profile: ProfileRow): AuthSession {
  return {
    token: accessToken,
    user: { id: profile.id, username: profile.username, role: profile.role },
  };
}

function toAccount(profile: ProfileRow): AppAccount {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    createdAt: profile.created_at,
  };
}

async function fetchProfile(userId: string): Promise<ProfileRow> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function supabaseLogin(username: string, password: string): Promise<AuthSession> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials' ? 'Invalid username or password.' : error.message,
    );
  }
  if (!data.session) throw new Error('Login failed.');
  const profile = await fetchProfile(data.session.user.id);
  return toSession(data.session.access_token, profile);
}

export async function supabaseRestoreSession(): Promise<AuthSession | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  try {
    const profile = await fetchProfile(session.user.id);
    return toSession(session.access_token, profile);
  } catch {
    await supabase.auth.signOut();
    return null;
  }
}

export async function supabaseLogout(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function supabaseChangePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not signed in.');

  const ephemeral = createEphemeralClient();
  const { error: verifyError } = await ephemeral.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw new Error('Current password is incorrect.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function supabaseListAccounts(): Promise<AppAccount[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    if (error.message.includes('infinite recursion')) {
      throw new Error(
        'Account permissions are misconfigured. Ask an admin to update Supabase RLS policies.',
      );
    }
    throw error;
  }
  return (data as ProfileRow[]).map(toAccount);
}

export async function supabaseCreateAccount(
  username: string,
  password: string,
  role: UserRole,
): Promise<AppAccount> {
  const normalized = username.trim();
  if (!normalized) throw new Error('Username is required.');
  if (!supabase) throw new Error('Supabase is not configured.');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Sign in with your admin account to create users.');
  }

  const { data, error } = await supabase.rpc('create_user_account', {
    p_username: normalized,
    p_password: password,
    p_role: role,
  });
  if (error) {
    if (error.message.includes('Could not find the function')) {
      throw new Error('Account creation is not set up yet. Configure Supabase account management.');
    }
    throw new Error(error.message);
  }

  const account = data as ProfileRow;
  return toAccount(account);
}

export async function supabaseDeleteAccount(actorId: string, userId: string): Promise<void> {
  if (actorId === userId) throw new Error('You cannot delete your own account.');
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.rpc('delete_user_account', { p_user_id: userId });
  if (error) {
    if (error.message.includes('Could not find the function')) {
      throw new Error('Account deletion is not set up yet. Configure Supabase account management.');
    }
    throw new Error(error.message);
  }
}

export async function supabaseUpdateAccountRole(
  userId: string,
  role: UserRole,
): Promise<AppAccount> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id, username, role, created_at')
    .single();
  if (error) throw error;
  return toAccount(data as ProfileRow);
}

export async function supabaseSessionFromUserId(
  userId: string,
  accessToken: string,
): Promise<AuthSession> {
  const profile = await fetchProfile(userId);
  return toSession(accessToken, profile);
}

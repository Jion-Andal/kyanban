import { isSupabaseConfigured } from '../lib/supabase';
import {
  localChangePassword,
  localCreateAccount,
  localDeleteAccount,
  localListAccounts,
  localLogin,
  localLogout,
  localRestoreSession,
  localUpdateAccountRole,
  SESSION_KEY,
} from '../storage/authLocal';
import {
  supabaseChangePassword,
  supabaseCreateAccount,
  supabaseDeleteAccount,
  supabaseListAccounts,
  supabaseLogin,
  supabaseLogout,
  supabaseRestoreSession,
  supabaseUpdateAccountRole,
} from '../storage/authSupabase';
import type { AppAccount, AuthSession, UserRole } from '../types/auth';
import { hasSupabaseAuthSession } from '../utils/supabaseAuth';

async function persistSession(session: AuthSession): Promise<void> {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function clearStoredSession(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
}

export async function login(username: string, password: string): Promise<AuthSession> {
  if (isSupabaseConfigured) {
    try {
      return await supabaseLogin(username, password);
    } catch (remoteError) {
      try {
        const session = await localLogin(username, password);
        await persistSession(session);
        return session;
      } catch {
        throw remoteError;
      }
    }
  }
  const session = await localLogin(username, password);
  await persistSession(session);
  return session;
}

export async function restoreSession(): Promise<AuthSession | null> {
  if (isSupabaseConfigured) {
    const remoteSession = await supabaseRestoreSession();
    if (remoteSession) return remoteSession;
    return localRestoreSession();
  }
  return localRestoreSession();
}

export async function logout(_session: AuthSession | null): Promise<void> {
  if (isSupabaseConfigured) {
    await supabaseLogout();
  } else {
    await localLogout();
  }
  await clearStoredSession();
}

async function shouldUseSupabaseAuth(session: AuthSession): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (session.token.startsWith('local-')) return false;
  return hasSupabaseAuthSession();
}

export async function changePassword(
  session: AuthSession,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (await shouldUseSupabaseAuth(session)) {
    await supabaseChangePassword(currentPassword, newPassword);
    return;
  }
  await localChangePassword(session.user.id, currentPassword, newPassword);
}

export async function listAccounts(session: AuthSession): Promise<AppAccount[]> {
  if (await shouldUseSupabaseAuth(session)) {
    try {
      return await supabaseListAccounts();
    } catch (err) {
      throw err;
    }
  }
  return localListAccounts();
}

export async function createAccount(
  session: AuthSession,
  username: string,
  password: string,
  role: UserRole,
): Promise<AppAccount> {
  if (session.user.role !== 'admin') {
    throw new Error('You do not have permission to manage accounts.');
  }
  if (await shouldUseSupabaseAuth(session)) {
    return supabaseCreateAccount(username, password, role);
  }
  return localCreateAccount(username, password, role);
}

export async function deleteAccount(session: AuthSession, userId: string): Promise<void> {
  if (session.user.role !== 'admin') {
    throw new Error('You do not have permission to manage accounts.');
  }

  const errors: Error[] = [];
  let deleted = false;

  if (await shouldUseSupabaseAuth(session)) {
    try {
      await supabaseDeleteAccount(session.user.id, userId);
      deleted = true;
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error('Could not delete account.'));
    }
  }

  const localAccounts = await localListAccounts();
  if (localAccounts.some((account) => account.id === userId)) {
    try {
      await localDeleteAccount(session.user.id, userId);
      deleted = true;
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error('Could not delete account.'));
    }
  }

  if (!deleted) {
    const setupError = errors.find((error) =>
      error.message.includes('not set up yet') ||
      error.message.includes('Could not find the function'),
    );
    throw setupError ?? errors[0] ?? new Error('Account not found.');
  }
}

export async function updateAccountRole(
  session: AuthSession,
  userId: string,
  role: UserRole,
): Promise<AppAccount> {
  if (session.user.role !== 'admin') {
    throw new Error('You do not have permission to manage accounts.');
  }
  if (await shouldUseSupabaseAuth(session)) {
    return supabaseUpdateAccountRole(userId, role);
  }
  return localUpdateAccountRole(userId, role);
}

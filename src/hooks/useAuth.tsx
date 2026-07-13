import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import {
  changePassword as changePasswordService,
  createAccount as createAccountService,
  deleteAccount as deleteAccountService,
  listAccounts as listAccountsService,
  login as loginService,
  logout as logoutService,
  restoreSession,
  updateAccountRole as updateAccountRoleService,
} from '../services/auth';
import { supabaseSessionFromUserId } from '../storage/authSupabase';
import type { AppAccount, AuthSession, AuthUser, UserRole } from '../types/auth';

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  listAccounts: () => Promise<AppAccount[]>;
  createAccount: (username: string, password: string, role: UserRole) => Promise<AppAccount>;
  deleteAccount: (userId: string) => Promise<void>;
  updateAccountRole: (userId: string, role: UserRole) => Promise<AppAccount>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const restored = await restoreSession();
        if (!cancelled) setSession(restored);
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!authSession) {
        setSession(null);
        return;
      }
      try {
        const next = await supabaseSessionFromUserId(
          authSession.user.id,
          authSession.access_token,
        );
        setSession(next);
      } catch (err) {
        console.error('Failed to sync auth session:', err);
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const next = await loginService(username, password);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    await logoutService(session);
    setSession(null);
    queryClient.clear();
  }, [session]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!session) throw new Error('Not signed in.');
      await changePasswordService(session, currentPassword, newPassword);
    },
    [session],
  );

  const listAccounts = useCallback(async () => {
    if (!session) throw new Error('Not signed in.');
    return listAccountsService(session);
  }, [session]);

  const createAccount = useCallback(
    async (username: string, password: string, role: UserRole) => {
      if (!session) throw new Error('Not signed in.');
      return createAccountService(session, username, password, role);
    },
    [session],
  );

  const deleteAccount = useCallback(
    async (userId: string) => {
      if (!session) throw new Error('Not signed in.');
      await deleteAccountService(session, userId);
    },
    [session],
  );

  const updateAccountRole = useCallback(
    async (userId: string, role: UserRole) => {
      if (!session) throw new Error('Not signed in.');
      return updateAccountRoleService(session, userId, role);
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      login,
      logout,
      changePassword,
      listAccounts,
      createAccount,
      deleteAccount,
      updateAccountRole,
    }),
    [
      session,
      loading,
      login,
      logout,
      changePassword,
      listAccounts,
      createAccount,
      deleteAccount,
      updateAccountRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

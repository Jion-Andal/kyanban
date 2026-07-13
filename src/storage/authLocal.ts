import type { AppAccount, AuthSession, UserRole } from '../types/auth';

const ACCOUNTS_KEY = 'kyanban_accounts';
const SESSION_KEY = 'kyanban_auth_session';

interface StoredAccount {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

function defaultAccounts(): StoredAccount[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'admin-demo',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      createdAt: now,
    },
    {
      id: 'instructor-demo',
      username: 'instructor',
      password: 'instructor123',
      role: 'instructor',
      createdAt: now,
    },
    {
      id: 'member-demo',
      username: 'member',
      password: 'member123',
      role: 'member',
      createdAt: now,
    },
  ];
}

async function loadAccounts(): Promise<StoredAccount[]> {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  let accounts: StoredAccount[];

  if (!raw) {
    accounts = defaultAccounts();
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return accounts;
  }

  try {
    accounts = JSON.parse(raw) as StoredAccount[];
  } catch {
    accounts = defaultAccounts();
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return accounts;
  }

  return accounts;
}

function saveAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function toSession(account: StoredAccount): AuthSession {
  return {
    token: `local-${account.id}`,
    user: { id: account.id, username: account.username, role: account.role },
  };
}

export async function localLogin(username: string, password: string): Promise<AuthSession> {
  const account = (await loadAccounts()).find(
    (a) => a.username === username && a.password === password,
  );
  if (!account) throw new Error('Invalid username or password.');
  return toSession(account);
}

export async function localRestoreSession(): Promise<AuthSession | null> {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function localLogout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
}

export async function localListAccounts(): Promise<AppAccount[]> {
  return (await loadAccounts()).map(({ id, username, role, createdAt }) => ({
    id,
    username,
    role,
    createdAt,
  }));
}

export async function localCreateAccount(
  username: string,
  password: string,
  role: UserRole,
): Promise<AppAccount> {
  const accounts = await loadAccounts();
  if (accounts.some((a) => a.username === username)) {
    throw new Error('Username already exists.');
  }
  const account: StoredAccount = {
    id: crypto.randomUUID(),
    username,
    password,
    role,
    createdAt: new Date().toISOString(),
  };
  saveAccounts([...accounts, account]);
  return { id: account.id, username: account.username, role: account.role, createdAt: account.createdAt };
}

export async function localDeleteAccount(actorId: string, userId: string): Promise<void> {
  if (actorId === userId) throw new Error('You cannot delete your own account.');
  const accounts = await loadAccounts();
  const next = accounts.filter((a) => a.id !== userId);
  if (next.length === accounts.length) {
    throw new Error('Account not found.');
  }
  saveAccounts(next);
}

export async function localUpdateAccountRole(
  userId: string,
  role: UserRole,
): Promise<AppAccount> {
  const accounts = await loadAccounts();
  const target = accounts.find((a) => a.id === userId);
  if (!target) throw new Error('Account not found.');
  target.role = role;
  saveAccounts(accounts);
  return { id: target.id, username: target.username, role: target.role, createdAt: target.createdAt };
}

export async function localChangePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const accounts = await loadAccounts();
  const account = accounts.find((a) => a.id === userId);
  if (!account || account.password !== currentPassword) {
    throw new Error('Current password is incorrect.');
  }
  account.password = newPassword;
  saveAccounts(accounts);
}

export { SESSION_KEY };

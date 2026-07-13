export type UserRole = 'admin' | 'instructor' | 'member';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AppAccount {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  instructor: 'Instructor',
  member: 'Member',
};

export const ROLE_PRIVILEGES: Record<UserRole, readonly string[]> = {
  admin: [
    'Manage accounts',
    'Add, edit, and delete tickets',
    'Move tickets to any column including Done',
  ],
  instructor: [
    'Add, edit, and delete tickets',
    'Move tickets to any column including Done',
    'Change password',
  ],
  member: [
    'Add and edit tickets',
    'Move tickets (except to Done)',
    'Change password',
  ],
};

export function rolePrivilegeSummary(role: UserRole): string {
  return ROLE_PRIVILEGES[role].join('; ');
}

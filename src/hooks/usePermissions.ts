import { useMemo } from 'react';
import type { AuthUser, UserRole } from '../types/auth';

export interface Permissions {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canMoveStatus: boolean;
  canSetDone: boolean;
  canManageAccounts: boolean;
  canChangePassword: boolean;
}

function permissionsForRole(role: UserRole): Permissions {
  switch (role) {
    case 'admin':
      return {
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canMoveStatus: true,
        canSetDone: true,
        canManageAccounts: true,
        canChangePassword: true,
      };
    case 'instructor':
      return {
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canMoveStatus: true,
        canSetDone: true,
        canManageAccounts: false,
        canChangePassword: true,
      };
    case 'member':
      return {
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canMoveStatus: true,
        canSetDone: false,
        canManageAccounts: false,
        canChangePassword: true,
      };
  }
}

export function usePermissions(user: AuthUser | null): Permissions {
  return useMemo(
    () => (user ? permissionsForRole(user.role) : permissionsForRole('member')),
    [user],
  );
}

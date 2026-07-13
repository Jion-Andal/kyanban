import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { accountKeys } from '../lib/queryKeys';
import { usingSupabase } from '../services/tickets';
import type { AppAccount, AuthUser, UserRole } from '../types/auth';
import { ROLE_LABELS, ROLE_PRIVILEGES, rolePrivilegeSummary } from '../types/auth';
import { ConfirmModal } from './ConfirmModal';

function canManageAccount(account: AppAccount, currentUser: AuthUser): boolean {
  return account.role !== 'admin' && account.id !== currentUser.id;
}

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

type SettingsView = 'menu' | 'password' | 'accounts';

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function SettingsAccordion({
  id,
  title,
  children,
  defaultOpen = false,
}: {
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const panelId = `${id}-panel`;

  return (
    <div className="settings-accordion settings-accordion--group">
      <button
        type="button"
        className="settings-accordion-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="settings-accordion-title">{title}</span>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className={`settings-accordion-chevron${expanded ? ' settings-accordion-chevron--open' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {expanded ? (
        <div id={panelId} className="settings-accordion-panel">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { user, logout, changePassword, listAccounts, createAccount, deleteAccount, updateAccountRole } =
    useAuth();
  const permissions = usePermissions(user);
  const queryClient = useQueryClient();
  const [view, setView] = useState<SettingsView>('menu');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [selectedAccount, setSelectedAccount] = useState<AppAccount | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState(false);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<AppAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setView('menu');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(false);
      setNewUsername('');
      setNewAccountPassword('');
      setNewRole('member');
      setAccountsError(null);
      setSelectedAccount(null);
      setEditRole('member');
      setRoleUpdateSuccess(false);
      setDeleteConfirmAccount(null);
      setDeleteError(null);
      setAccountSearchQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view !== 'menu') setView('menu');
        else onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, view, onClose]);

  useEffect(() => {
    if (selectedAccount) {
      setEditRole(selectedAccount.role);
      setRoleUpdateSuccess(false);
    }
  }, [selectedAccount]);

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    error: accountsQueryError,
  } = useQuery({
    queryKey: accountKeys.all,
    queryFn: listAccounts,
    enabled: open && view === 'accounts' && permissions.canManageAccounts,
  });

  const filteredAccounts = useMemo(() => {
    const query = accountSearchQuery.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) => account.username.toLowerCase().includes(query));
  }, [accounts, accountSearchQuery]);

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: (_, userId) => {
      queryClient.setQueryData<AppAccount[]>(accountKeys.all, (current) =>
        current ? current.filter((a) => a.id !== userId) : current,
      );
      setAccountsError(null);
      setDeleteError(null);
      setSelectedAccount((current) => (current?.id === userId ? null : current));
      setDeleteConfirmAccount(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Could not delete account.';
      setDeleteError(message);
      setAccountsError(message);
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: ({ username, password, role }: { username: string; password: string; role: UserRole }) =>
      createAccount(username, password, role),
    onSuccess: (created) => {
      queryClient.setQueryData<AppAccount[]>(accountKeys.all, (current) =>
        current
          ? [...current, created].sort((a, b) => a.username.localeCompare(b.username))
          : [created],
      );
      setAccountsError(null);
    },
    onError: (err) => {
      setAccountsError(err instanceof Error ? err.message : 'Could not create account.');
    },
  });

  const updateAccountRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateAccountRole(userId, role),
    onSuccess: (updated) => {
      queryClient.setQueryData<AppAccount[]>(accountKeys.all, (current) =>
        current
          ? current
              .map((account) => (account.id === updated.id ? updated : account))
              .sort((a, b) => a.username.localeCompare(b.username))
          : [updated],
      );
      setSelectedAccount(updated);
      setEditRole(updated.role);
      setRoleUpdateSuccess(true);
      setAccountsError(null);
    },
    onError: (err) => {
      setRoleUpdateSuccess(false);
      setAccountsError(err instanceof Error ? err.message : 'Could not update privilege.');
    },
  });

  if (!open || !user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const viewTitle =
    view === 'password' ? 'Change password' : view === 'accounts' ? 'Manage accounts' : 'Settings';

  return createPortal(
    <div className="settings-drawer-root">
      <button type="button" className="settings-drawer-backdrop" onClick={onClose} aria-label="Close settings" />
      <aside className="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title">
        <header className="settings-drawer-header">
          {view !== 'menu' ? (
            <button type="button" className="settings-drawer-back" onClick={() => setView('menu')} aria-label="Back">
              <BackIcon />
            </button>
          ) : (
            <span className="settings-drawer-back-spacer" aria-hidden />
          )}
          <h2 id="settings-drawer-title">{viewTitle}</h2>
          <button type="button" className="settings-drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="settings-drawer-body">
          {view === 'menu' && (
            <>
              <div className="settings-drawer-user">
                <span className="settings-drawer-user-label">Signed in as</span>
                <strong>{user.username}</strong>
                <span className={`account-role account-role--${user.role}`}>{ROLE_LABELS[user.role]}</span>
              </div>

              <p className="settings-hint">
                Backend: {usingSupabase ? 'Supabase' : 'Local storage (demo)'}
              </p>

              <nav className="settings-menu" aria-label="Settings options">
                {permissions.canManageAccounts && (
                  <button type="button" className="settings-menu-item" onClick={() => setView('accounts')}>
                    <span className="settings-menu-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    </span>
                    <span className="settings-menu-label">Manage accounts</span>
                    <ChevronIcon />
                  </button>
                )}

                {permissions.canChangePassword && (
                  <button type="button" className="settings-menu-item" onClick={() => setView('password')}>
                    <span className="settings-menu-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <span className="settings-menu-label">Change password</span>
                    <ChevronIcon />
                  </button>
                )}

                <button
                  type="button"
                  className="settings-menu-item settings-menu-item--danger"
                  onClick={() => {
                    onClose();
                    void logout();
                  }}
                >
                  <span className="settings-menu-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                  </span>
                  <span className="settings-menu-label">Log out</span>
                </button>
              </nav>
            </>
          )}

          {view === 'password' && permissions.canChangePassword && (
            <section className="settings-panel">
              <form className="settings-form" onSubmit={(e) => void handleChangePassword(e)}>
                <div className="form-group">
                  <label htmlFor="settings-current-password">Current password</label>
                  <input
                    id="settings-current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="settings-new-password">New password</label>
                  <input
                    id="settings-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="settings-confirm-password">Confirm new password</label>
                  <input
                    id="settings-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {passwordError && (
                  <p className="settings-message settings-message--error">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="settings-message settings-message--success">Password updated successfully.</p>
                )}
                <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                  {changingPassword ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </section>
          )}

          {view === 'accounts' && permissions.canManageAccounts && (
            <section className="settings-panel">
              <SettingsAccordion id="role-privileges" title="Role privileges">
                <div className="settings-accordion-group">
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                    <div key={role} className="settings-role-block">
                      <strong>{ROLE_LABELS[role]}</strong>
                      <ul className="privilege-reference-items">
                        {ROLE_PRIVILEGES[role].map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SettingsAccordion>

              <SettingsAccordion id="account-list" title={`Accounts (${accounts.length})`}>
                <div className="form-group settings-account-search">
                  <label htmlFor="settings-account-search">Search by username</label>
                  <input
                    id="settings-account-search"
                    type="search"
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    placeholder="Type a username…"
                  />
                </div>
                {accountsLoading ? (
                  <p className="settings-hint">Loading accounts…</p>
                ) : filteredAccounts.length === 0 ? (
                  <p className="settings-hint">No accounts found.</p>
                ) : (
                  <ul className="account-list">
                    {filteredAccounts.map((account) => {
                      const manageable = canManageAccount(account, user);
                      const isSelected = selectedAccount?.id === account.id;
                      return (
                        <li key={account.id}>
                          {manageable ? (
                            <button
                              type="button"
                              className={`account-list-item account-list-item--clickable${isSelected ? ' account-list-item--selected' : ''}`}
                              onClick={() => setSelectedAccount(isSelected ? null : account)}
                            >
                              <span className="account-list-name">{account.username}</span>
                              <span className={`account-role account-role--${account.role}`}>
                                {ROLE_LABELS[account.role]}
                              </span>
                            </button>
                          ) : (
                            <div className="account-list-item">
                              <span className="account-list-name">{account.username}</span>
                              <span className={`account-role account-role--${account.role}`}>
                                {ROLE_LABELS[account.role]}
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SettingsAccordion>

              {selectedAccount && canManageAccount(selectedAccount, user) && (
                <div className="account-detail-panel">
                  <h3>{selectedAccount.username}</h3>
                  <form
                    className="settings-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editRole === selectedAccount.role) return;
                      void updateAccountRoleMutation.mutateAsync({
                        userId: selectedAccount.id,
                        role: editRole,
                      });
                    }}
                  >
                    <div className="form-group">
                      <label htmlFor="settings-edit-role">Privilege</label>
                      <select
                        id="settings-edit-role"
                        value={editRole}
                        onChange={(e) => {
                          setEditRole(e.target.value as UserRole);
                          setRoleUpdateSuccess(false);
                        }}
                      >
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </div>
                    {roleUpdateSuccess && (
                      <p className="settings-message settings-message--success">Privilege updated.</p>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        updateAccountRoleMutation.isPending || editRole === selectedAccount.role
                      }
                    >
                      Save privilege
                    </button>
                  </form>
                  <button
                    type="button"
                    className="btn btn-danger-outline account-detail-delete"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteConfirmAccount(selectedAccount);
                    }}
                  >
                    Delete account
                  </button>
                </div>
              )}

              <form
                className="settings-form settings-form--create"
                onSubmit={(e) => {
                  e.preventDefault();
                  void createAccountMutation.mutateAsync({
                    username: newUsername,
                    password: newAccountPassword,
                    role: newRole,
                  }).then(() => {
                    setNewUsername('');
                    setNewAccountPassword('');
                    setNewRole('member');
                  });
                }}
              >
                <h3>Create account</h3>
                <div className="form-group">
                  <label htmlFor="settings-new-username">Username</label>
                  <input
                    id="settings-new-username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="settings-new-account-password">Password</label>
                  <input
                    id="settings-new-account-password"
                    type="password"
                    value={newAccountPassword}
                    onChange={(e) => setNewAccountPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="settings-new-role">Privilege</label>
                  <select
                    id="settings-new-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <p className="settings-role-description">{rolePrivilegeSummary(newRole)}</p>
                </div>
                {(accountsError || accountsQueryError) && (
                  <p className="settings-message settings-message--error">
                    {accountsError ??
                      (accountsQueryError instanceof Error
                        ? accountsQueryError.message
                        : 'Could not load accounts.')}
                  </p>
                )}
                <button type="submit" className="btn btn-primary" disabled={createAccountMutation.isPending}>
                  {createAccountMutation.isPending ? 'Creating…' : 'Create account'}
                </button>
              </form>
            </section>
          )}
        </div>
      </aside>

      <ConfirmModal
        open={deleteConfirmAccount !== null}
        title="Delete account?"
        message={
          deleteConfirmAccount
            ? `Permanently delete "${deleteConfirmAccount.username}"? This cannot be undone.`
            : ''
        }
        error={deleteError}
        confirmLabel={deleteAccountMutation.isPending ? 'Deleting…' : 'Delete'}
        variant="danger"
        loading={deleteAccountMutation.isPending}
        onConfirm={() => {
          if (!deleteConfirmAccount) return;
          setDeleteError(null);
          void deleteAccountMutation.mutateAsync(deleteConfirmAccount.id);
        }}
        onCancel={() => {
          if (deleteAccountMutation.isPending) return;
          setDeleteConfirmAccount(null);
          setDeleteError(null);
        }}
      />
    </div>,
    document.body,
  );
}

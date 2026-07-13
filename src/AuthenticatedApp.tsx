import { useState } from 'react';
import type { AppPage } from './components/Footer';
import { ConfirmModal } from './components/ConfirmModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { TicketFormModal } from './components/TicketFormModal';
import { TicketPreviewModal } from './components/TicketPreviewModal';
import { useMembers } from './hooks/useMembers';
import { usePageNavigation } from './hooks/usePageNavigation';
import { usePermissions } from './hooks/usePermissions';
import { useTickets } from './hooks/useTickets';
import { BacklogPage } from './pages/BacklogPage';
import { DashboardPage } from './pages/DashboardPage';
import { KanbanPage } from './pages/KanbanPage';
import type { AuthUser } from './types/auth';
import type { Ticket } from './types/ticket';
import { canAdvanceStatus } from './utils/statusFlow';

interface AuthenticatedAppProps {
  user: AuthUser;
}

export function AuthenticatedApp({ user }: AuthenticatedAppProps) {
  const [page, setPage] = useState<AppPage>('dashboard');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const permissions = usePermissions(user);
  const { members, getMemberName } = useMembers();
  const {
    tickets,
    loading,
    addTicket,
    updateTicket,
    deleteTicket,
    updateTicketStatus,
  } = useTickets();

  usePageNavigation(page);

  function openCreateForm() {
    setEditingTicket(null);
    setFormOpen(true);
  }

  function openEditForm(ticket: Ticket) {
    setPreviewTicket(null);
    setEditingTicket(ticket);
    setFormOpen(true);
  }

  async function handleFormSubmit(data: Parameters<typeof addTicket>[0]) {
    if (editingTicket) {
      await updateTicket({ id: editingTicket.id, data });
    } else {
      await addTicket(data);
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirmId(id);
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      await deleteTicket(deleteConfirmId);
      setPreviewTicket(null);
      setDeleteConfirmId(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const deleteConfirmTicket = deleteConfirmId
    ? tickets.find((ticket) => ticket.id === deleteConfirmId)
    : null;

  async function handleStatusChange(id: string, status: Parameters<typeof updateTicketStatus>[0]['status']) {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket || !canAdvanceStatus(ticket.status, status, permissions.canSetDone)) return;
    await updateTicketStatus({ id, status });
    setPreviewTicket((current) =>
      current && current.id === id ? { ...current, status } : current,
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        {page === 'dashboard' && <DashboardPage tickets={tickets} loading={loading} />}
        {page === 'backlog' && (
          <BacklogPage
            tickets={tickets}
            loading={loading}
            permissions={permissions}
            members={members}
            getMemberName={getMemberName}
            onAdd={openCreateForm}
            onEdit={openEditForm}
            onPreview={setPreviewTicket}
            onDelete={handleDelete}
          />
        )}
        {page === 'kanban' && (
          <KanbanPage
            tickets={tickets}
            loading={loading}
            permissions={permissions}
            getMemberName={getMemberName}
            onStatusChange={handleStatusChange}
            onTicketClick={setPreviewTicket}
          />
        )}
      </main>

      <Footer currentPage={page} onNavigate={setPage} />

      {page === 'backlog' && permissions.canAdd && (
        <button
          type="button"
          className="fab"
          onClick={openCreateForm}
          aria-label="Create new ticket"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      <TicketFormModal
        open={formOpen}
        ticket={editingTicket}
        members={members}
        onClose={() => {
          setFormOpen(false);
          setEditingTicket(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <TicketPreviewModal
        ticket={previewTicket}
        assigneeName={previewTicket ? getMemberName(previewTicket.assigneeId) : null}
        permissions={permissions}
        onClose={() => setPreviewTicket(null)}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />

      <ConfirmModal
        open={deleteConfirmId !== null}
        title="Delete ticket?"
        message={
          deleteConfirmTicket
            ? `Delete "${deleteConfirmTicket.title}"? This cannot be undone.`
            : 'Delete this ticket? This cannot be undone.'
        }
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        variant="danger"
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => !deleteLoading && setDeleteConfirmId(null)}
      />
    </div>
  );
}

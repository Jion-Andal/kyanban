import { useMemo, useState } from 'react';
import { TicketCard } from '../components/TicketCard';
import type { Permissions } from '../hooks/usePermissions';
import type { AppAccount } from '../types/auth';
import type { Ticket, TicketStatus } from '../types/ticket';
import { STATUS_LABELS, TICKET_STATUSES } from '../types/ticket';

const STATUS_SECTIONS: { status: TicketStatus; className: string }[] = [
  { status: 'todo', className: 'status-col-todo' },
  { status: 'in_progress', className: 'status-col-progress' },
  { status: 'blocked', className: 'status-col-blocked' },
  { status: 'done', className: 'status-col-done' },
];

function initialCollapsedState(): Record<TicketStatus, boolean> {
  return Object.fromEntries(TICKET_STATUSES.map((status) => [status, true])) as Record<
    TicketStatus,
    boolean
  >;
}

interface BacklogPageProps {
  tickets: Ticket[];
  loading: boolean;
  permissions: Permissions;
  members: AppAccount[];
  getMemberName: (assigneeId: string | null) => string | null;
  onAdd: () => void;
  onEdit: (ticket: Ticket) => void;
  onPreview: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
}

export function BacklogPage({
  tickets,
  loading,
  permissions,
  members,
  getMemberName,
  onAdd,
  onEdit,
  onPreview,
  onDelete,
}: BacklogPageProps) {
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [collapsed, setCollapsed] = useState(initialCollapsedState);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (assigneeFilter === 'unassigned') {
        if (ticket.assigneeId !== null) return false;
      } else if (assigneeFilter !== 'all' && ticket.assigneeId !== assigneeFilter) {
        return false;
      }
      if (!query) return true;
      return (
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.remarks.toLowerCase().includes(query)
      );
    });
  }, [tickets, search, assigneeFilter]);

  const grouped = useMemo(() => {
    const groups = Object.fromEntries(
      TICKET_STATUSES.map((status) => [status, [] as Ticket[]]),
    ) as Record<TicketStatus, Ticket[]>;
    for (const ticket of filtered) {
      groups[ticket.status].push(ticket);
    }
    return groups;
  }, [filtered]);

  const hasActiveSearch = search.trim().length > 0;

  function isSectionCollapsed(status: TicketStatus): boolean {
    if (hasActiveSearch) {
      return grouped[status].length === 0;
    }
    return collapsed[status];
  }

  function toggleSection(status: TicketStatus) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  }

  return (
    <section className="backlog-page">
      <div className="page-toolbar">
        <div>
          <h2 className="page-title">Backlog</h2>
          <p className="page-subtitle">Manage and organize your activity tickets</p>
        </div>
        {permissions.canAdd && (
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            + New ticket
          </button>
        )}
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            aria-label="Search tickets"
          />
        </div>
        <select
          className="filter-select"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          aria-label="Filter by assignee"
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.username}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="page-loading">Loading tickets…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No tickets found.</p>
          {permissions.canAdd && (
            <button type="button" className="btn btn-secondary" onClick={onAdd}>
              Create your first ticket
            </button>
          )}
        </div>
      ) : (
        <div className="backlog-sections">
          {STATUS_SECTIONS.map(({ status, className }) => {
            const sectionTickets = grouped[status];
            const isCollapsed = isSectionCollapsed(status);
            const panelId = `backlog-section-${status}`;

            return (
              <section key={status} className={`backlog-section ${className}`}>
                <button
                  type="button"
                  className="backlog-section-header"
                  onClick={() => toggleSection(status)}
                  aria-expanded={!isCollapsed}
                  aria-controls={panelId}
                >
                  <span className="backlog-section-header-main">
                    <h3 className="backlog-section-title">{STATUS_LABELS[status]}</h3>
                    <span className="backlog-section-count">{sectionTickets.length}</span>
                  </span>
                  <svg
                    className={`backlog-section-chevron${isCollapsed ? '' : ' backlog-section-chevron--open'}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {!isCollapsed && (
                  <div id={panelId} className="backlog-section-body">
                    {sectionTickets.length === 0 ? (
                      <p className="backlog-section-empty">No tickets</p>
                    ) : (
                      <div className="backlog-list">
                        {sectionTickets.map((ticket) => (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            assigneeName={getMemberName(ticket.assigneeId)}
                            onClick={() => onPreview(ticket)}
                            onEdit={permissions.canEdit ? () => onEdit(ticket) : undefined}
                            onDelete={
                              permissions.canDelete ? () => onDelete(ticket.id) : undefined
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

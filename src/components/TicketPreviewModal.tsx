import type { Ticket } from '../types/ticket';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types/ticket';
import type { Permissions } from '../hooks/usePermissions';
import { formatDateCreated } from '../utils/dateFormat';
import { statusColorClass } from '../utils/statusColors';

interface TicketPreviewModalProps {
  ticket: Ticket | null;
  assigneeName?: string | null;
  permissions: Permissions;
  onClose: () => void;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
}

export function TicketPreviewModal({
  ticket,
  assigneeName,
  permissions,
  onClose,
  onEdit,
  onDelete,
}: TicketPreviewModalProps) {
  if (!ticket) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2>{ticket.title}</h2>
            <div className="preview-badges">
              <span className={`status-chip ${statusColorClass(ticket.status)}`}>
                {STATUS_LABELS[ticket.status]}
              </span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body ticket-preview">
          <section>
            <h3>Date created</h3>
            <p>
              <time dateTime={ticket.createdAt}>{formatDateCreated(ticket.createdAt)}</time>
            </p>
          </section>
          {assigneeName && (
            <section>
              <h3>Assignee</h3>
              <p>{assigneeName}</p>
            </section>
          )}
          {ticket.description && (
            <section>
              <h3>Description</h3>
              <p>{ticket.description}</p>
            </section>
          )}
          {ticket.remarks && (
            <section>
              <h3>Remarks</h3>
              <p>{ticket.remarks}</p>
            </section>
          )}
          {ticket.attachments.length > 0 && (
            <section>
              <h3>Attachments</h3>
              <ul className="attachment-list">
                {ticket.attachments.map((a, i) => (
                  <li key={i}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      {a.title || a.url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h3>Priority</h3>
            <p>{ticket.priority ? PRIORITY_LABELS[ticket.priority] : 'None'}</p>
          </section>
          <div className="modal-actions">
            {permissions.canEdit && (
              <button type="button" className="btn btn-secondary" onClick={() => onEdit(ticket)}>
                Edit
              </button>
            )}
            {permissions.canDelete && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(ticket.id)}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

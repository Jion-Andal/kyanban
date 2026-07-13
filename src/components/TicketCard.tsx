import type { Ticket } from '../types/ticket';
import { STATUS_LABELS } from '../types/ticket';
import { formatDateCreated } from '../utils/dateFormat';
import { statusColorClass } from '../utils/statusColors';
import { PriorityBadge } from './PriorityBadge';

interface TicketCardProps {
  ticket: Ticket;
  assigneeName?: string | null;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

function stopCardClick(e: React.MouseEvent | React.KeyboardEvent) {
  e.stopPropagation();
}

export function TicketCard({
  ticket,
  assigneeName,
  onClick,
  onEdit,
  onDelete,
  compact = false,
}: TicketCardProps) {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <article
      className={`ticket-card${compact ? ' ticket-card--compact' : ''}${hasActions ? ' ticket-card--with-actions' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="ticket-card-content">
        <div className="ticket-card-header">
          <h3>{ticket.title}</h3>
          <PriorityBadge priority={ticket.priority} />
        </div>
        {!compact && ticket.description && (
          <p className="ticket-card-description">{ticket.description}</p>
        )}
        <div className="ticket-card-meta">
          <span className={`status-chip ${statusColorClass(ticket.status)}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
          {ticket.attachments.length > 0 && (
            <span className="meta-chip">{ticket.attachments.length} attachment(s)</span>
          )}
        </div>
        {assigneeName && (
          <span className="ticket-card-assignee">{assigneeName}</span>
        )}
        <time className="ticket-card-created" dateTime={ticket.createdAt}>
          Created {formatDateCreated(ticket.createdAt)}
        </time>
      </div>
      {hasActions && (
        <div className="ticket-card-actions" onClick={stopCardClick} onKeyDown={stopCardClick}>
          {onEdit && (
            <button
              type="button"
              className="ticket-card-action-btn ticket-card-action-btn--edit"
              onClick={onEdit}
              aria-label={`Edit ${ticket.title}`}
              title="Edit"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="ticket-card-action-btn ticket-card-action-btn--delete"
              onClick={onDelete}
              aria-label={`Delete ${ticket.title}`}
              title="Delete"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}
    </article>
  );
}

import type { TicketPriority } from '../types/ticket';

export type PriorityLevel = TicketPriority | null;

function priorityClassName(priority: PriorityLevel): string {
  if (priority === 'high') return 'priority-icon--high';
  if (priority === 'medium') return 'priority-icon--medium';
  if (priority === 'low') return 'priority-icon--low';
  return 'priority-icon--none';
}

function priorityLabel(priority: PriorityLevel): string {
  if (priority === 'high') return 'High priority';
  if (priority === 'medium') return 'Medium priority';
  if (priority === 'low') return 'Low priority';
  return 'No priority';
}

interface PriorityIconProps {
  priority: PriorityLevel;
}

export function PriorityIcon({ priority }: PriorityIconProps) {
  const className = `priority-icon ${priorityClassName(priority)}`;

  if (priority === 'high') {
    return (
      <span className="priority-icon-wrap" title={priorityLabel(priority)} aria-label={priorityLabel(priority)}>
        <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            d="M7 14l5-5 5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (priority === 'medium') {
    return (
      <span className="priority-icon-wrap" title={priorityLabel(priority)} aria-label={priorityLabel(priority)}>
        <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            d="M6 12h12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  if (priority === 'low') {
    return (
      <span className="priority-icon-wrap" title={priorityLabel(priority)} aria-label={priorityLabel(priority)}>
        <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            d="M7 10l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="priority-icon-wrap" title={priorityLabel(priority)} aria-label={priorityLabel(priority)}>
      <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    </span>
  );
}

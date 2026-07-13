import type { TicketPriority } from '../types/ticket';
import { PRIORITY_LABELS } from '../types/ticket';

export function PriorityBadge({ priority }: { priority: TicketPriority | null }) {
  if (!priority) {
    return <span className="priority-badge priority-badge--none">None</span>;
  }
  return <span className={`priority-badge priority-badge--${priority}`}>{PRIORITY_LABELS[priority]}</span>;
}

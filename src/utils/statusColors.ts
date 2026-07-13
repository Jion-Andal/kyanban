import type { TicketStatus } from '../types/ticket';

export const STATUS_COLOR_CLASS: Record<TicketStatus, string> = {
  todo: 'status--todo',
  in_progress: 'status--in-progress',
  blocked: 'status--blocked',
  done: 'status--done',
};

export function statusColorClass(status: TicketStatus): string {
  return STATUS_COLOR_CLASS[status];
}

import type { TicketStatus } from '../types/ticket';

const ALLOWED_MOVES: Record<TicketStatus, TicketStatus[]> = {
  todo: ['in_progress'],
  in_progress: ['blocked', 'done'],
  blocked: ['in_progress'],
  done: [],
};

export function canAdvanceStatus(
  from: TicketStatus,
  to: TicketStatus,
  canSetDone: boolean,
): boolean {
  if (from === to) return false;
  if (to === 'done' && !canSetDone) return false;
  return ALLOWED_MOVES[from].includes(to);
}

export function canMoveToStatus(
  targetStatus: TicketStatus,
  canSetDone: boolean,
): boolean {
  if (targetStatus === 'done' && !canSetDone) return false;
  return true;
}

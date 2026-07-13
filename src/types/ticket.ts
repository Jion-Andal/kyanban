export type TicketPriority = 'low' | 'medium' | 'high';

export type TicketStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface TicketAttachment {
  title: string;
  url: string;
}

export interface TicketFormData {
  title: string;
  description: string;
  attachments: TicketAttachment[];
  remarks: string;
  priority: TicketPriority | null;
  assigneeId: string | null;
}

export interface Ticket extends TicketFormData {
  id: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export const TICKET_STATUSES: readonly TicketStatus[] = [
  'todo',
  'in_progress',
  'blocked',
  'done',
] as const;

export const TICKET_PRIORITIES: readonly TicketPriority[] = [
  'low',
  'medium',
  'high',
] as const;

export const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: 'To-Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const EMPTY_TICKET_FORM: TicketFormData = {
  title: '',
  description: '',
  attachments: [],
  remarks: '',
  priority: 'medium',
  assigneeId: null,
};

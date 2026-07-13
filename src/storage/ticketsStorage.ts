import type { Ticket } from '../types/ticket';

const STORAGE_KEY = 'kyanban_tickets';

function seedTickets(): Ticket[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'seed-1',
      title: 'Daily standup notes',
      description: 'Prepare agenda and share blockers with the team.',
      attachments: [{ title: 'Meeting link', url: 'https://example.com/standup' }],
      remarks: 'Every weekday at 9 AM.',
      priority: 'medium',
      assigneeId: 'member-1',
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-2',
      title: 'Review pull requests',
      description: 'Review open PRs from the backlog before EOD.',
      attachments: [],
      remarks: '',
      priority: 'high',
      assigneeId: 'instructor-1',
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-3',
      title: 'Update documentation',
      description: 'Document the new onboarding flow for new members.',
      attachments: [{ title: 'Docs draft', url: 'https://example.com/docs' }],
      remarks: 'Waiting on design approval.',
      priority: 'low',
      assigneeId: 'admin-1',
      status: 'blocked',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function normalizeTicket(raw: Partial<Ticket>): Ticket {
  return {
    id: raw.id ?? crypto.randomUUID(),
    title: raw.title ?? '',
    description: raw.description ?? '',
    attachments: raw.attachments ?? [],
    remarks: raw.remarks ?? '',
    priority: raw.priority ?? null,
    assigneeId: raw.assigneeId ?? null,
    status: raw.status ?? 'todo',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export async function loadTickets(): Promise<Ticket[]> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedTickets();
    await saveTickets(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Ticket>[];
    const normalized = parsed.map(normalizeTicket);
    await saveTickets(normalized);
    return normalized;
  } catch {
    const seeded = seedTickets();
    await saveTickets(seeded);
    return seeded;
  }
}

export async function saveTickets(tickets: Ticket[]): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

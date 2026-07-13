import { v4 as uuidv4 } from 'uuid';
import type { Ticket, TicketFormData, TicketStatus } from '../types/ticket';
import { loadTickets, saveTickets } from './ticketsStorage';

function sortTickets(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function migrateLocalTicketsIfEmpty(): Promise<void> {
  // No-op for local-only storage.
}

export async function loadAllTickets(): Promise<Ticket[]> {
  return sortTickets(await loadTickets());
}

export async function loadTicketById(id: string): Promise<Ticket> {
  const ticket = (await loadTickets()).find((t) => t.id === id);
  if (!ticket) throw new Error('Ticket not found.');
  return ticket;
}

export async function addTicket(data: TicketFormData): Promise<Ticket> {
  const tickets = await loadTickets();
  const now = new Date().toISOString();
  const ticket: Ticket = {
    ...data,
    id: uuidv4(),
    status: 'todo',
    createdAt: now,
    updatedAt: now,
  };
  await saveTickets(sortTickets([ticket, ...tickets]));
  return ticket;
}

export async function updateTicket(id: string, data: TicketFormData): Promise<void> {
  const tickets = await loadTickets();
  const now = new Date().toISOString();
  const next = tickets.map((t) =>
    t.id === id ? { ...t, ...data, updatedAt: now } : t,
  );
  await saveTickets(sortTickets(next));
}

export async function deleteTicket(id: string): Promise<void> {
  const tickets = await loadTickets();
  await saveTickets(sortTickets(tickets.filter((t) => t.id !== id)));
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  const tickets = await loadTickets();
  const now = new Date().toISOString();
  const next = tickets.map((t) =>
    t.id === id ? { ...t, status, updatedAt: now } : t,
  );
  await saveTickets(sortTickets(next));
}

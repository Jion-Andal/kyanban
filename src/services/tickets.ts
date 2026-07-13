import { isSupabaseConfigured } from '../lib/supabase';
import type { TicketFormData, TicketStatus } from '../types/ticket';
import { SESSION_KEY } from '../storage/authLocal';
import { hasSupabaseAuthSessionSync } from '../utils/supabaseAuth';
import * as local from '../storage/ticketsLocal';
import * as remote from '../storage/ticketsSupabase';

function shouldUseSupabaseTickets(): boolean {
  if (!isSupabaseConfigured || !hasSupabaseAuthSessionSync()) return false;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return true;
  try {
    const session = JSON.parse(raw) as { token?: string };
    return !session.token?.startsWith('local-');
  } catch {
    return true;
  }
}

function getBackend() {
  return shouldUseSupabaseTickets() ? remote : local;
}

export const usingSupabase = shouldUseSupabaseTickets();

export const loadAllTickets = () => getBackend().loadAllTickets();
export const loadTicketById = (id: string) => getBackend().loadTicketById(id);
export const migrateLocalTicketsIfEmpty = () =>
  shouldUseSupabaseTickets() ? remote.migrateLocalTicketsIfEmpty() : Promise.resolve();
export const addTicket = (data: TicketFormData) => getBackend().addTicket(data);
export const updateTicket = (id: string, data: TicketFormData) => getBackend().updateTicket(id, data);
export const deleteTicket = (id: string) => getBackend().deleteTicket(id);
export const updateTicketStatus = (id: string, status: TicketStatus) =>
  getBackend().updateTicketStatus(id, status);

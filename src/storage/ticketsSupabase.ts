import { supabase } from '../lib/supabase';
import type { Ticket, TicketFormData, TicketStatus } from '../types/ticket';

function mapRow(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    attachments: (row.attachments as Ticket['attachments']) ?? [],
    remarks: (row.remarks as string) ?? '',
    priority: row.priority as Ticket['priority'],
    assigneeId: (row.assignee_id as string | null) ?? null,
    status: row.status as TicketStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapInsert(data: TicketFormData) {
  return {
    title: data.title,
    description: data.description,
    attachments: data.attachments,
    remarks: data.remarks,
    priority: data.priority,
    assignee_id: data.assigneeId,
  };
}

export async function migrateLocalTicketsIfEmpty(): Promise<void> {
  if (!supabase) return;
  const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
  if (count && count > 0) return;

  const { loadTickets } = await import('./ticketsStorage');
  const local = await loadTickets();
  if (local.length === 0) return;

  await supabase.from('tickets').insert(
    local.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      attachments: t.attachments,
      remarks: t.remarks,
      priority: t.priority,
      assignee_id: t.assigneeId,
      status: t.status,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    })),
  );
}

export async function loadAllTickets(): Promise<Ticket[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function loadTicketById(id: string): Promise<Ticket> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('tickets').select('*').eq('id', id).single();
  if (error) throw error;
  return mapRow(data);
}

export async function addTicket(data: TicketFormData): Promise<Ticket> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: row, error } = await supabase
    .from('tickets')
    .insert({ ...mapInsert(data), status: 'todo' })
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(row);
}

export async function updateTicket(id: string, data: TicketFormData): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase
    .from('tickets')
    .update({ ...mapInsert(data), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTicket(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) throw error;
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

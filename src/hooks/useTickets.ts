import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketKeys } from '../lib/queryKeys';
import {
  addTicket,
  deleteTicket,
  loadAllTickets,
  migrateLocalTicketsIfEmpty,
  updateTicket,
  updateTicketStatus,
} from '../services/tickets';
import type { TicketFormData, TicketStatus } from '../types/ticket';

export function useTickets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ticketKeys.list(),
    queryFn: async () => {
      await migrateLocalTicketsIfEmpty();
      return loadAllTickets();
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ticketKeys.all });

  const addMutation = useMutation({
    mutationFn: addTicket,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketFormData }) => updateTicket(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTicket,
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      updateTicketStatus(id, status),
    onSuccess: invalidate,
  });

  return {
    tickets: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addTicket: addMutation.mutateAsync,
    updateTicket: updateMutation.mutateAsync,
    deleteTicket: deleteMutation.mutateAsync,
    updateTicketStatus: statusMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

import { TicketBoard } from '../components/TicketBoard';
import type { Permissions } from '../hooks/usePermissions';
import type { Ticket, TicketStatus } from '../types/ticket';

interface KanbanPageProps {
  tickets: Ticket[];
  loading: boolean;
  permissions: Permissions;
  getMemberName: (assigneeId: string | null) => string | null;
  onStatusChange: (id: string, status: TicketStatus) => void;
  onTicketClick: (ticket: Ticket) => void;
}

export function KanbanPage({
  tickets,
  loading,
  permissions,
  getMemberName,
  onStatusChange,
  onTicketClick,
}: KanbanPageProps) {
  return (
    <TicketBoard
      tickets={tickets}
      loading={loading}
      canMoveStatus={permissions.canMoveStatus}
      canSetDone={permissions.canSetDone}
      getMemberName={getMemberName}
      onStatusChange={onStatusChange}
      onSelect={onTicketClick}
    />
  );
}

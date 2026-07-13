import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Ticket, TicketStatus } from '../types/ticket';
import { TICKET_STATUSES } from '../types/ticket';
import { canAdvanceStatus } from '../utils/statusFlow';
import { PriorityIcon } from './PriorityIcon';

const HOLD_MS = 300;

const COLUMNS: { status: TicketStatus; label: string; className: string }[] = [
  { status: 'todo', label: 'To-Do', className: 'status-col-todo' },
  { status: 'in_progress', label: 'In Progress', className: 'status-col-progress' },
  { status: 'blocked', label: 'Blocked', className: 'status-col-blocked' },
  { status: 'done', label: 'Done', className: 'status-col-done' },
];

interface DragState {
  ticketId: string;
  fromStatus: TicketStatus;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
}

interface TicketBoardProps {
  tickets: Ticket[];
  loading: boolean;
  canMoveStatus: boolean;
  canSetDone: boolean;
  getMemberName: (assigneeId: string | null) => string | null;
  onStatusChange: (id: string, status: TicketStatus) => void;
  onSelect: (ticket: Ticket) => void;
}

function statusFromElement(el: Element | null): TicketStatus | null {
  const column = el?.closest('[data-status]') as HTMLElement | null;
  if (!column?.dataset.status) return null;
  return column.dataset.status as TicketStatus;
}

interface BoardCardProps {
  ticket: Ticket;
  columnClass: string;
  assigneeName: string | null;
  canMoveStatus: boolean;
  onSelect: (ticket: Ticket) => void;
  dragState: DragState | null;
  onDragStart: (
    ticketId: string,
    fromStatus: TicketStatus,
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: (clientX: number, clientY: number) => void;
}

function BoardCard({
  ticket,
  columnClass,
  assigneeName,
  canMoveStatus,
  onSelect,
  dragState,
  onDragStart,
  onDragMove,
  onDragEnd,
}: BoardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setHolding(false);
    setHoldProgress(0);
  }, []);

  useEffect(() => () => clearHold(), [clearHold]);

  const isDragging = dragState?.ticketId === ticket.id;
  const canDrag = canMoveStatus && ticket.status !== 'done';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !e.isPrimary) return;
    pointerIdRef.current = e.pointerId;
    dragStartedRef.current = false;
    pointerDownRef.current = { x: e.clientX, y: e.clientY };

    if (!canDrag) return;

    setHolding(true);
    setHoldProgress(0);

    const start = performance.now();
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - start;
      setHoldProgress(Math.min(elapsed / HOLD_MS, 1));
    }, 32);

    holdTimeoutRef.current = window.setTimeout(() => {
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      holdTimeoutRef.current = null;
      if (!cardRef.current) return;

      dragStartedRef.current = true;
      setHolding(false);
      setHoldProgress(1);
      const rect = cardRef.current.getBoundingClientRect();
      cardRef.current.setPointerCapture(e.pointerId);
      onDragStart(ticket.id, ticket.status, e.clientX, e.clientY, rect);
    }, HOLD_MS);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartedRef.current && dragState?.ticketId === ticket.id) {
      onDragMove(e.clientX, e.clientY);
    } else if (holding && pointerIdRef.current === e.pointerId && pointerDownRef.current) {
      const dx = e.clientX - pointerDownRef.current.x;
      const dy = e.clientY - pointerDownRef.current.y;
      if (Math.hypot(dx, dy) > 12) clearHold();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartedRef.current && dragState?.ticketId === ticket.id) {
      onDragEnd(e.clientX, e.clientY);
      dragStartedRef.current = false;
      try {
        cardRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    } else {
      clearHold();
      if (!dragStartedRef.current) onSelect(ticket);
    }
    pointerIdRef.current = null;
    pointerDownRef.current = null;
  };

  const handlePointerCancel = () => {
    clearHold();
    dragStartedRef.current = false;
    pointerIdRef.current = null;
    pointerDownRef.current = null;
  };

  const style =
    isDragging && dragState
      ? {
          position: 'fixed' as const,
          left: dragState.x,
          top: dragState.y,
          width: cardRef.current?.offsetWidth ?? 220,
          zIndex: 100,
          pointerEvents: 'none' as const,
          transform: 'rotate(2deg) scale(1.03)',
        }
      : undefined;

  return (
    <div
      ref={cardRef}
      className={`board-card ${columnClass}${holding ? ' board-card-holding' : ''}${isDragging ? ' board-card-dragging' : ''}${!canDrag ? ' board-card-locked' : ''}`}
      data-ticket-id={ticket.id}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      aria-label={`${ticket.title}. ${canDrag ? 'Hold briefly to drag.' : 'Tap to view.'}`}
    >
      {holding && (
        <div
          className="board-card-hold-ring"
          style={{ '--hold-progress': holdProgress } as React.CSSProperties}
          aria-hidden
        />
      )}
      <div className="board-card-priority">
        <PriorityIcon priority={ticket.priority} />
      </div>
      <span className="board-card-name">{ticket.title}</span>
      {ticket.description && (
        <span className="board-card-sub">{ticket.description}</span>
      )}
      {assigneeName && (
        <span className="board-card-assignee">{assigneeName}</span>
      )}
    </div>
  );
}

export function TicketBoard({
  tickets,
  loading,
  canMoveStatus,
  canSetDone,
  getMemberName,
  onStatusChange,
  onSelect,
}: TicketBoardProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<TicketStatus | null>(null);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const grouped = useMemo(() => {
    return TICKET_STATUSES.reduce(
      (acc, status) => {
        acc[status] = tickets.filter((t) => t.status === status);
        return acc;
      },
      {} as Record<TicketStatus, Ticket[]>,
    );
  }, [tickets]);

  const handleDragStart = useCallback(
    (ticketId: string, fromStatus: TicketStatus, clientX: number, clientY: number, rect: DOMRect) => {
      setDragState({
        ticketId,
        fromStatus,
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        x: rect.left,
        y: rect.top,
      });
    },
    [],
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      setDragState((prev) => {
        if (!prev) return prev;
        return { ...prev, x: clientX - prev.offsetX, y: clientY - prev.offsetY };
      });
      const el = document.elementFromPoint(clientX, clientY);
      const targetStatus = statusFromElement(el);
      const activeDrag = dragStateRef.current;
      if (
        activeDrag &&
        targetStatus &&
        canAdvanceStatus(activeDrag.fromStatus, targetStatus, canSetDone)
      ) {
        setDropTarget(targetStatus);
      } else {
        setDropTarget(null);
      }
    },
    [canSetDone],
  );

  const handleDragEnd = useCallback(
    (clientX: number, clientY: number) => {
      const activeDrag = dragStateRef.current;
      const el = document.elementFromPoint(clientX, clientY);
      const targetStatus = statusFromElement(el);
      if (
        activeDrag &&
        targetStatus &&
        canAdvanceStatus(activeDrag.fromStatus, targetStatus, canSetDone)
      ) {
        onStatusChange(activeDrag.ticketId, targetStatus);
      }
      setDragState(null);
      setDropTarget(null);
    },
    [canSetDone, onStatusChange],
  );

  if (loading) {
    return <div className="page-loading">Loading board…</div>;
  }

  const boardHint = canMoveStatus
    ? 'Hold a card briefly, then drag it: To-Do → In Progress → Blocked or Done. Blocked cards can return to In Progress.'
    : 'View only — you cannot move cards on this board.';

  return (
    <div className="status-board-wrap">
      <div className="status-board-header">
        <h2 className="status-board-title">Kanban Board</h2>
        <p className="status-board-hint">{boardHint}</p>
      </div>

      <div className="status-board status-board--four">
        {COLUMNS.map((col) => {
          const columnTickets = grouped[col.status];
          const isValidDropTarget =
            dragState !== null &&
            canAdvanceStatus(dragState.fromStatus, col.status, canSetDone);
          return (
            <section
              key={col.status}
              className={`status-column ${col.className}${
                isValidDropTarget && dropTarget === col.status ? ' status-column-drop-target' : ''
              }${dragState && !isValidDropTarget ? ' status-column-drop-disabled' : ''}`}
              data-status={col.status}
              aria-label={`${col.label} column, ${columnTickets.length} items`}
            >
              <header className="status-column-header">
                <h3>{col.label}</h3>
                <span className="status-column-count">{columnTickets.length}</span>
              </header>
              <div className="status-column-body">
                {columnTickets.length === 0 ? (
                  <p className="status-column-empty">No tickets</p>
                ) : (
                  columnTickets.map((ticket) => (
                    <div key={ticket.id} className="board-card-slot">
                      {dragState?.ticketId === ticket.id && (
                        <div className="board-card-placeholder" aria-hidden />
                      )}
                      <BoardCard
                        ticket={ticket}
                        columnClass={col.className}
                        assigneeName={getMemberName(ticket.assigneeId)}
                        canMoveStatus={canMoveStatus}
                        onSelect={onSelect}
                        dragState={dragState}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

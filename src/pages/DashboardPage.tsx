import type { Ticket } from '../types/ticket';
import { PRIORITY_LABELS, STATUS_LABELS, TICKET_PRIORITIES, TICKET_STATUSES } from '../types/ticket';
import { statusColorClass } from '../utils/statusColors';

interface DashboardPageProps {
  tickets: Ticket[];
  loading: boolean;
}

export function DashboardPage({ tickets, loading }: DashboardPageProps) {
  if (loading) {
    return <div className="page-loading">Loading analytics…</div>;
  }

  const byStatus = Object.fromEntries(
    TICKET_STATUSES.map((status) => [status, tickets.filter((t) => t.status === status).length]),
  ) as Record<(typeof TICKET_STATUSES)[number], number>;

  const byPriority = Object.fromEntries(
    TICKET_PRIORITIES.map((priority) => [
      priority,
      tickets.filter((t) => t.priority === priority).length,
    ]),
  ) as Record<(typeof TICKET_PRIORITIES)[number], number>;

  const totalAttachments = tickets.reduce((sum, t) => sum + t.attachments.length, 0);
  const completionRate =
    tickets.length === 0 ? 0 : Math.round((byStatus.done / tickets.length) * 100);

  return (
    <section className="dashboard-page">
      <h2 className="page-title">Dashboard</h2>
      <p className="page-subtitle">Analytics overview of your daily activities</p>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-value">{tickets.length}</span>
          <span className="stat-label">Total tickets</span>
        </article>
        <article className="stat-card">
          <span className="stat-value">{completionRate}%</span>
          <span className="stat-label">Completion rate</span>
        </article>
        <article className="stat-card">
          <span className="stat-value">{byStatus.blocked}</span>
          <span className="stat-label">Blocked</span>
        </article>
        <article className="stat-card">
          <span className="stat-value">{totalAttachments}</span>
          <span className="stat-label">Attachments</span>
        </article>
      </div>

      <div className="analytics-panels">
        <article className="panel-card">
          <h3>By status</h3>
          <ul className="analytics-list">
            {TICKET_STATUSES.map((status) => (
              <li key={status}>
                <span className={`analytics-status-label ${statusColorClass(status)}`}>
                  {STATUS_LABELS[status]}
                </span>
                <strong>{byStatus[status]}</strong>
              </li>
            ))}
          </ul>
        </article>
        <article className="panel-card">
          <h3>By priority</h3>
          <ul className="analytics-list">
            {TICKET_PRIORITIES.map((priority) => (
              <li key={priority}>
                <span>{PRIORITY_LABELS[priority]}</span>
                <strong>{byPriority[priority]}</strong>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

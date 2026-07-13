import { useEffect, useState } from 'react';
import type { AppAccount } from '../types/auth';
import type { Ticket, TicketFormData } from '../types/ticket';
import { EMPTY_TICKET_FORM, TICKET_PRIORITIES, PRIORITY_LABELS } from '../types/ticket';
import { ConfirmModal } from './ConfirmModal';

interface TicketFormModalProps {
  open: boolean;
  ticket?: Ticket | null;
  members: AppAccount[];
  onClose: () => void;
  onSubmit: (data: TicketFormData) => Promise<void>;
}

export function TicketFormModal({ open, ticket, members, onClose, onSubmit }: TicketFormModalProps) {
  const [form, setForm] = useState<TicketFormData>(EMPTY_TICKET_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<TicketFormData | null>(null);

  useEffect(() => {
    if (!open) return;
    if (ticket) {
      setForm({
        title: ticket.title,
        description: ticket.description,
        attachments: ticket.attachments,
        remarks: ticket.remarks,
        priority: ticket.priority,
        assigneeId: ticket.assigneeId,
      });
    } else {
      setForm(EMPTY_TICKET_FORM);
    }
    setError('');
    setShowUpdateConfirm(false);
    setPendingData(null);
  }, [open, ticket]);

  if (!open) return null;

  const isEdit = Boolean(ticket);

  function updateField<K extends keyof TicketFormData>(key: K, value: TicketFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addAttachment() {
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { title: '', url: '' }],
    }));
  }

  function updateAttachment(index: number, field: 'title' | 'url', value: string) {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.map((a, i) =>
        i === index ? { ...a, [field]: value } : a,
      ),
    }));
  }

  function removeAttachment(index: number) {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  }

  async function saveTicket(data: TicketFormData) {
    setSaving(true);
    setError('');
    try {
      await onSubmit(data);
      onClose();
      setForm(EMPTY_TICKET_FORM);
      setShowUpdateConfirm(false);
      setPendingData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ticket.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    const data = {
      ...form,
      title: form.title.trim(),
      attachments: form.attachments.filter((a) => a.title.trim() || a.url.trim()),
    };
    if (isEdit) {
      setPendingData(data);
      setShowUpdateConfirm(true);
      return;
    }
    await saveTicket(data);
  }

  async function confirmUpdate() {
    if (!pendingData) return;
    await saveTicket(pendingData);
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Ticket' : 'New Ticket'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body ticket-form">
          <div className="form-group">
            <label htmlFor="ticket-title">Title *</label>
            <input
              id="ticket-title"
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="ticket-description">Description</label>
            <textarea
              id="ticket-description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ticket-assignee">Assignee</label>
            <select
              id="ticket-assignee"
              value={form.assigneeId ?? ''}
              onChange={(e) => updateField('assigneeId', e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ticket-priority">Priority</label>
            <select
              id="ticket-priority"
              value={form.priority ?? ''}
              onChange={(e) =>
                updateField('priority', e.target.value ? (e.target.value as TicketFormData['priority']) : null)
              }
            >
              <option value="">No priority</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ticket-remarks">Remarks</label>
            <textarea
              id="ticket-remarks"
              value={form.remarks}
              onChange={(e) => updateField('remarks', e.target.value)}
              rows={2}
            />
          </div>

          <fieldset className="attachments-fieldset">
            <legend>Attachments</legend>
            {form.attachments.map((attachment, index) => (
              <div key={index} className="attachment-row">
                <input
                  type="text"
                  placeholder="Title"
                  value={attachment.title}
                  onChange={(e) => updateAttachment(index, 'title', e.target.value)}
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={attachment.url}
                  onChange={(e) => updateAttachment(index, 'url', e.target.value)}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeAttachment(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={addAttachment}>
              + Add attachment
            </button>
          </fieldset>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create ticket'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        open={showUpdateConfirm}
        title="Save changes?"
        message={
          ticket
            ? `Update "${ticket.title}" with your changes?`
            : 'Save your changes to this ticket?'
        }
        confirmLabel={saving ? 'Saving…' : 'Save changes'}
        loading={saving}
        onConfirm={() => void confirmUpdate()}
        onCancel={() => !saving && setShowUpdateConfirm(false)}
      />
    </div>
  );
}

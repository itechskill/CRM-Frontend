import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, LoaderCircle, Ticket } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './SupportPortal.css';

const emptyForm = { deliveryNoteNumber: '', complaint: '', status: 'Received' };
const filters = ['All', 'Received', 'Solved'];

const formatDate = value => value
  ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

export default function SupportTicketsView({ currentUser }) {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [solvingId, setSolvingId] = useState('');
  const [dnError, setDnError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [listError, setListError] = useState('');
  const canWrite = currentUser?.role === 'support';

  const loadTickets = async () => {
    setLoading(true);
    setListError('');
    try {
      const { response, data } = await apiRequest('/api/support-tickets');
      if (response.ok && data.success) setTickets(data.data || []);
      else setListError(data.message || 'Could not load Support tickets.');
    } catch {
      setListError('Could not load Support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const counts = useMemo(() => ({
    All: tickets.length,
    Received: tickets.filter(ticket => ticket.status === 'Received').length,
    Solved: tickets.filter(ticket => ticket.status === 'Solved').length
  }), [tickets]);

  const visibleTickets = useMemo(() => activeFilter === 'All'
    ? tickets
    : tickets.filter(ticket => ticket.status === activeFilter), [activeFilter, tickets]);

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setSuccessMessage('');
    setFormError('');
    if (field === 'deliveryNoteNumber') setDnError('');
  };

  const submit = async event => {
    event.preventDefault();
    const deliveryNoteNumber = form.deliveryNoteNumber.trim();
    const complaint = form.complaint.trim();
    setDnError('');
    setFormError('');
    setSuccessMessage('');

    if (!deliveryNoteNumber) {
      setDnError('DN Number is required.');
      return;
    }
    if (!complaint) {
      setFormError('Complaint is required.');
      return;
    }

    setSaving(true);
    try {
      const { response, data } = await apiRequest('/api/support-tickets', {
        method: 'POST',
        body: { deliveryNoteNumber, complaint, status: 'Received' }
      });
      if (!response.ok || !data.success) {
        const errorMessage = data.message || 'Could not save Support ticket.';
        if (/delivery note|dn number/i.test(errorMessage)) setDnError(errorMessage);
        else setFormError(errorMessage);
        return;
      }
      setForm(emptyForm);
      setSuccessMessage('Ticket created successfully.');
      await loadTickets();
    } catch {
      setFormError('Could not save Support ticket.');
    } finally {
      setSaving(false);
    }
  };

  const markSolved = async ticket => {
    setSolvingId(ticket._id);
    setListError('');
    setSuccessMessage('');
    try {
      const { response, data } = await apiRequest(`/api/support-tickets/${ticket._id}`, {
        method: 'PATCH',
        body: { complaint: ticket.complaint, status: 'Solved' }
      });
      if (!response.ok || !data.success) {
        setListError(data.message || 'Could not mark the ticket as solved.');
        return;
      }
      setSuccessMessage('Ticket marked as solved.');
      await loadTickets();
    } catch {
      setListError('Could not mark the ticket as solved.');
    } finally {
      setSolvingId('');
    }
  };

  return (
    <div className="support-dashboard-container support-tickets-page">
      <div className="sales-dashboard-section-header">
        <div><h2>Tickets</h2><p>Support complaints linked to a valid Delivery Note</p></div>
      </div>

      {canWrite && (
        <form className="support-ticket-form-card" onSubmit={submit} noValidate>
          <div className="support-ticket-card-heading">
            <span className="support-ticket-heading-icon"><Ticket size={20} /></span>
            <div><h3>New Ticket</h3><p>Enter the Delivery Note and complaint details.</p></div>
          </div>
          <div className="support-ticket-form-grid">
            <label className="support-ticket-field">
              <span>DN Number</span>
              <input
                value={form.deliveryNoteNumber}
                onChange={event => updateField('deliveryNoteNumber', event.target.value)}
                placeholder="e.g. DN-000123"
                aria-invalid={Boolean(dnError)}
                aria-describedby={dnError ? 'ticket-dn-error' : undefined}
              />
              {dnError && <small id="ticket-dn-error" className="support-ticket-field-error">{dnError}</small>}
            </label>
            <label className="support-ticket-field">
              <span>Complaint</span>
              <textarea
                rows="4"
                value={form.complaint}
                onChange={event => updateField('complaint', event.target.value)}
                placeholder="Describe the customer complaint"
              />
            </label>
          </div>
          {formError && <p className="support-ticket-form-error" role="alert">{formError}</p>}
          <div className="support-ticket-form-actions">
            <button type="submit" className="sv-btn-primary" disabled={saving}>
              {saving && <LoaderCircle className="support-ticket-spinner" size={16} />}
              {saving ? 'Saving...' : 'Save Ticket'}
            </button>
          </div>
        </form>
      )}

      {successMessage && <div className="support-ticket-success" role="status"><CheckCircle2 size={17} />{successMessage}</div>}
      {listError && <div className="support-ticket-list-error" role="alert">{listError}</div>}

      <section className="support-ticket-list-card">
        <div className="support-ticket-list-header">
          <div><h3>Tickets</h3><p>Review received complaints and their resolution status.</p></div>
          <div className="support-ticket-tabs" role="tablist" aria-label="Ticket status filters">
            {filters.map(filter => (
              <button
                key={filter}
                type="button"
                className={`support-ticket-tab ${activeFilter === filter ? 'is-active' : ''}`}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}<span>{counts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="support-ticket-empty">Loading tickets…</div> : visibleTickets.length === 0 ? (
          <div className="support-ticket-empty">
            <span className="support-ticket-empty-icon"><Ticket size={24} /></span>
            <strong>No tickets yet</strong>
            <p>Tickets will appear here when a complaint is recorded.</p>
          </div>
        ) : (
          <div className="support-ticket-table-wrap">
            <table className="support-table support-ticket-table">
              <thead><tr><th>DN Number</th><th>Complaint</th><th>Status</th><th>Created date</th><th>Solved date</th>{canWrite && <th>Action</th>}</tr></thead>
              <tbody>
                {visibleTickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td data-label="DN Number"><strong>{ticket.deliveryNoteNumber}</strong></td>
                    <td data-label="Complaint"><span className="support-ticket-complaint" title={ticket.complaint}>{ticket.complaint}</span></td>
                    <td data-label="Status"><span className={`support-ticket-status is-${ticket.status.toLowerCase()}`}>{ticket.status}</span></td>
                    <td data-label="Created date">{formatDate(ticket.createdAt)}</td>
                    <td data-label="Solved date">{formatDate(ticket.solvedAt)}</td>
                    {canWrite && (
                      <td data-label="Action">
                        {ticket.status === 'Received' ? (
                          <button
                            type="button"
                            className="support-ticket-solve-btn"
                            disabled={solvingId === ticket._id}
                            onClick={() => markSolved(ticket)}
                          >
                            {solvingId === ticket._id ? 'Saving...' : 'Mark Solved'}
                          </button>
                        ) : <span className="support-ticket-no-action">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

const emptyForm = { deliveryNoteNumber: '', complaint: '', status: 'Received' };

export default function SupportTicketsView({ currentUser }) {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const canWrite = currentUser?.role === 'support';

  const loadTickets = async () => {
    setLoading(true);
    const { response, data } = await apiRequest('/api/support-tickets');
    if (response.ok && data.success) setTickets(data.data || []);
    else setMessage(data.message || 'Could not load Support tickets.');
    setLoading(false);
  };

  useEffect(() => { loadTickets(); }, []);

  const submit = async event => {
    event.preventDefault();
    setMessage('');
    const path = editingId ? `/api/support-tickets/${editingId}` : '/api/support-tickets';
    const body = editingId ? { complaint: form.complaint, status: form.status } : form;
    const { response, data } = await apiRequest(path, { method: editingId ? 'PATCH' : 'POST', body });
    if (!response.ok || !data.success) return setMessage(data.message || 'Could not save Support ticket.');
    const wasEditing = Boolean(editingId);
    setForm(emptyForm);
    setEditingId('');
    setMessage(wasEditing ? 'Ticket updated.' : 'Ticket created.');
    await loadTickets();
  };

  const startEdit = ticket => {
    setEditingId(ticket._id);
    setForm({ deliveryNoteNumber: ticket.deliveryNoteNumber, complaint: ticket.complaint, status: ticket.status });
    setMessage('');
  };

  return (
    <div className="support-dashboard-container">
      <div className="sales-dashboard-section-header"><div><h2>Tickets</h2><p>Support complaints linked to a valid Delivery Note</p></div></div>
      {message && <div style={{ padding: 12, borderRadius: 8, background: '#EFF6FF', color: '#1E40AF' }}>{message}</div>}
      {canWrite && (
        <form onSubmit={submit} style={{ marginBottom: 20, padding: 18, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label>DN Number<input value={form.deliveryNoteNumber} disabled={Boolean(editingId)} required onChange={event => setForm({ ...form, deliveryNoteNumber: event.target.value })} /></label>
            <label>Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option>Received</option><option>Solved</option></select></label>
            <label style={{ gridColumn: '1 / -1' }}>Complaint<textarea rows="3" value={form.complaint} required onChange={event => setForm({ ...form, complaint: event.target.value })} /></label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="sv-btn-primary">{editingId ? 'Update Ticket' : 'Save Ticket'}</button>
            {editingId && <button type="button" className="sv-btn-cancel" onClick={() => { setEditingId(''); setForm(emptyForm); }}>Cancel</button>}
          </div>
        </form>
      )}
      {loading ? <div className="sv-empty">Loading tickets…</div> : (
        <div className="support-table-card">
          <table className="support-table">
            <thead><tr><th>DN Number</th><th>Complaint</th><th>Status</th><th>Created By</th><th>Created</th><th>Solved</th>{canWrite && <th>Action</th>}</tr></thead>
            <tbody>
              {tickets.map(ticket => <tr key={ticket._id}>
                <td>{ticket.deliveryNoteNumber}</td><td>{ticket.complaint}</td><td>{ticket.status}</td>
                <td>{ticket.createdByName || ticket.createdBy?.fullName || '-'}</td>
                <td>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-'}</td>
                <td>{ticket.solvedAt ? new Date(ticket.solvedAt).toLocaleString() : '-'}</td>
                {canWrite && <td><button type="button" className="sv-btn-cancel" onClick={() => startEdit(ticket)}>Edit</button></td>}
              </tr>)}
              {!tickets.length && <tr><td colSpan={canWrite ? 7 : 6} className="sv-empty">No tickets found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

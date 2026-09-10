import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  X,
  Pencil,
  Trash2,
  Building2,
  Cpu,
  Monitor,
  Code,
  Truck,
  Settings2,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './AccountantViews.css';

const MAINTENANCE_TYPES = [
  'Building Maintenance',
  'Equipment Maintenance',
  'Office Maintenance',
  'Software Maintenance',
  'Vehicle Maintenance',
  'Other'
];

const TYPE_ICONS = {
  'Building Maintenance': Building2,
  'Equipment Maintenance': Cpu,
  'Office Maintenance': Monitor,
  'Software Maintenance': Code,
  'Vehicle Maintenance': Truck,
  'Other': Settings2
};

const TYPE_COLORS = {
  'Building Maintenance': { bg: '#DBEAFE', color: '#1E40AF' },
  'Equipment Maintenance': { bg: '#D1FAE5', color: '#065F46' },
  'Office Maintenance': { bg: '#F3E8FF', color: '#6B21A8' },
  'Software Maintenance': { bg: '#FEF3C7', color: '#92400E' },
  'Vehicle Maintenance': { bg: '#FEE2E2', color: '#991B1B' },
  'Other': { bg: '#F1F5F9', color: '#475569' }
};

const emptyForm = {
  name: '',
  maintenanceType: 'Building Maintenance',
  description: '',
  amount: '',
  dueDate: '',
  status: 'Pending'
};

export default function AccountantMaintenanceView({ isModalOpen, onCloseModal }) {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);

  // Form state for Add
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  // Fetch all charges from MongoDB
  const fetchCharges = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { response, data } = await apiRequest('/api/finance/maintenance');
      if (response.ok && data.success) {
        setCharges(data.data || []);
      } else {
        setError(data.message || 'Failed to load maintenance charges.');
      }
    } catch (err) {
      setError('Network error. Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  // Handle Add form submit
  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.dueDate) return;
    setSaving(true);
    try {
      const { response, data } = await apiRequest('/api/finance/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          maintenanceType: form.maintenanceType,
          description: form.description,
          amount: parseFloat(form.amount),
          dueDate: form.dueDate,
          status: form.status
        })
      });
      if (response.ok && data.success) {
        setCharges(prev => [data.data, ...prev]);
        setForm(emptyForm);
        if (onCloseModal) onCloseModal();
      } else {
        setError(data.message || 'Failed to add maintenance charge.');
      }
    } catch {
      setError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit form submit
  const handleEditCharge = async (e) => {
    e.preventDefault();
    if (!editingCharge) return;
    setSaving(true);
    try {
      const { response, data } = await apiRequest(`/api/finance/maintenance/${editingCharge._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name,
          maintenanceType: editForm.maintenanceType,
          description: editForm.description,
          amount: parseFloat(editForm.amount),
          dueDate: editForm.dueDate,
          status: editForm.status
        })
      });
      if (response.ok && data.success) {
        setCharges(prev => prev.map(c => c._id === editingCharge._id ? data.data : c));
        setEditModalOpen(false);
        setEditingCharge(null);
      } else {
        setError(data.message || 'Failed to update maintenance charge.');
      }
    } catch {
      setError('Network error while updating.');
    } finally {
      setSaving(false);
    }
  };

  // Mark as Paid
  const handleMarkPaid = async (charge) => {
    try {
      const { response, data } = await apiRequest(`/api/finance/maintenance/${charge._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Paid' })
      });
      if (response.ok && data.success) {
        setCharges(prev => prev.map(c => c._id === charge._id ? data.data : c));
      }
    } catch {
      setError('Failed to update status.');
    }
  };

  // Delete
  const handleDelete = async (chargeId) => {
    if (!window.confirm('Are you sure you want to delete this maintenance charge?')) return;
    try {
      const { response, data } = await apiRequest(`/api/finance/maintenance/${chargeId}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setCharges(prev => prev.filter(c => c._id !== chargeId));
      } else {
        setError(data.message || 'Failed to delete charge.');
      }
    } catch {
      setError('Network error while deleting.');
    }
  };

  // Open edit modal
  const openEdit = (charge) => {
    setEditingCharge(charge);
    setEditForm({
      name: charge.name,
      maintenanceType: charge.maintenanceType,
      description: charge.description || '',
      amount: String(charge.amount),
      dueDate: charge.dueDate ? charge.dueDate.split('T')[0] : '',
      status: charge.status
    });
    setEditModalOpen(true);
  };

  // Summary computations
  const totalAmount = charges.reduce((s, c) => s + (c.amount || 0), 0);
  const paidAmount = charges.filter(c => c.status === 'Paid').reduce((s, c) => s + (c.amount || 0), 0);
  const pendingAmount = charges.filter(c => c.status === 'Pending').reduce((s, c) => s + (c.amount || 0), 0);
  const overdueAmount = charges.filter(c => c.status === 'Overdue').reduce((s, c) => s + (c.amount || 0), 0);

  // Filtering
  const filtered = charges.filter(c => {
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchType = filterType === 'All' || c.maintenanceType === filterType;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.name?.toLowerCase().includes(q) ||
      c.maintenanceType?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  const fmtCurrency = (val) =>
    `Rs. ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statusClass = (s) => {
    if (s === 'Paid') return 'paid';
    if (s === 'Overdue') return 'overdue';
    return 'pending';
  };

  return (
    <div className="acc-view-container">
      {/* Page Header */}
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Maintenance Charges</h2>
          <p>Track and manage all maintenance-related charges, payments, and overdue items.</p>
        </div>
        <div className="acc-header-actions">
          <button className="acc-btn-secondary" onClick={fetchCharges} title="Refresh">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px',
          padding: '12px 16px', color: '#B91C1C', fontSize: '0.88rem', display: 'flex',
          alignItems: 'center', gap: '10px'
        }}>
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C' }}><X size={14} /></button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="acc-kpi-grid">
        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Maintenance Charges</span>
            <div className="acc-kpi-icon blue"><DollarSign size={18} /></div>
          </div>
          <div className="acc-kpi-value">{fmtCurrency(totalAmount)}</div>
          <div className="acc-kpi-subtitle">{charges.length} charge{charges.length !== 1 ? 's' : ''} total</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Paid Charges</span>
            <div className="acc-kpi-icon emerald"><CheckCircle size={18} /></div>
          </div>
          <div className="acc-kpi-value">{fmtCurrency(paidAmount)}</div>
          <div className="acc-kpi-subtitle acc-kpi-subtitle--up">{charges.filter(c => c.status === 'Paid').length} charge{charges.filter(c => c.status === 'Paid').length !== 1 ? 's' : ''} settled</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Pending Charges</span>
            <div className="acc-kpi-icon amber"><Clock size={18} /></div>
          </div>
          <div className="acc-kpi-value">{fmtCurrency(pendingAmount)}</div>
          <div className="acc-kpi-subtitle">{charges.filter(c => c.status === 'Pending').length} awaiting payment</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Overdue Charges</span>
            <div className="acc-kpi-icon red"><AlertTriangle size={18} /></div>
          </div>
          <div className="acc-kpi-value">{fmtCurrency(overdueAmount)}</div>
          <div className="acc-kpi-subtitle">{charges.filter(c => c.status === 'Overdue').length} past due date</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="acc-card">
        {/* Card Header */}
        <div className="acc-card-header">
          <div>
            <h3 className="acc-card-title">All Maintenance Charges</h3>
            <p className="acc-card-desc">Full log of maintenance charges — add, edit, delete, or mark as paid</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="acc-filter-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
          {/* Status tabs */}
          <div className="acc-tabs">
            {['All', 'Pending', 'Paid', 'Overdue'].map(s => (
              <button
                key={s}
                className={`acc-tab-btn ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Type select */}
            <select
              className="acc-select"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              {MAINTENANCE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Search */}
            <div className="acc-search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search name, type..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="acc-table-wrapper">
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <p>Loading maintenance charges...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
              <Wrench size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No maintenance charges found</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem' }}>
                {charges.length === 0 ? 'Click "+ Add Maintenance Charge" to get started.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <table className="acc-table">
              <thead>
                <tr>
                  <th>Name / Property</th>
                  <th>Maintenance Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(charge => {
                  const TypeIcon = TYPE_ICONS[charge.maintenanceType] || Settings2;
                  const typeColor = TYPE_COLORS[charge.maintenanceType] || TYPE_COLORS['Other'];
                  return (
                    <tr key={charge._id}>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{charge.name}</td>
                      <td>
                        <span
                          className="acc-badge"
                          style={{ backgroundColor: typeColor.bg, color: typeColor.color }}
                        >
                          <TypeIcon size={12} />
                          {charge.maintenanceType}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {charge.description || '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{fmtCurrency(charge.amount)}</td>
                      <td style={{ color: charge.status === 'Overdue' ? '#B91C1C' : '#1E293B', fontWeight: charge.status === 'Overdue' ? 700 : 400 }}>
                        {fmtDate(charge.dueDate)}
                      </td>
                      <td>
                        <span className={`acc-badge ${statusClass(charge.status)}`}>
                          {charge.status === 'Paid' && <CheckCircle size={12} />}
                          {charge.status === 'Pending' && <Clock size={12} />}
                          {charge.status === 'Overdue' && <AlertTriangle size={12} />}
                          {charge.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {charge.status !== 'Paid' && (
                            <button
                              onClick={() => handleMarkPaid(charge)}
                              title="Mark as Paid"
                              style={{
                                padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600,
                                background: '#D1FAE5', color: '#065F46', border: 'none',
                                borderRadius: '6px', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                              }}
                            >
                              <CheckCircle size={12} /> Paid
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(charge)}
                            title="Edit"
                            style={{
                              padding: '6px', background: '#EFF6FF', color: '#2563EB',
                              border: 'none', borderRadius: '6px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center'
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(charge._id)}
                            title="Delete"
                            style={{
                              padding: '6px', background: '#FEF2F2', color: '#DC2626',
                              border: 'none', borderRadius: '6px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ──────── ADD Maintenance Charge Modal ──────── */}
      {isModalOpen && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={18} />
                </div>
                <h3>Add Maintenance Charge</h3>
              </div>
              <button className="acc-modal-close" onClick={onCloseModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddCharge}>
              <div className="acc-modal-body">
                <div className="acc-form-group">
                  <label>Client / Customer or Property / Unit Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Block A – Unit 4, John Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div className="acc-form-group">
                  <label>Maintenance Type *</label>
                  <select
                    value={form.maintenanceType}
                    onChange={e => setForm(f => ({ ...f, maintenanceType: e.target.value }))}
                  >
                    {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="acc-form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the maintenance work or charge details..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Amount (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    />
                  </div>

                  <div className="acc-form-group">
                    <label>Due Date *</label>
                    <input
                      type="date"
                      required
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="acc-form-group">
                  <label>Payment Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={onCloseModal} disabled={saving}>Cancel</button>
                <button type="submit" className="acc-btn-primary" disabled={saving}>
                  {saving ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Plus size={14} /> Add Charge</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────── EDIT Maintenance Charge Modal ──────── */}
      {editModalOpen && editingCharge && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={16} />
                </div>
                <h3>Edit Maintenance Charge</h3>
              </div>
              <button className="acc-modal-close" onClick={() => { setEditModalOpen(false); setEditingCharge(null); }}><X size={18} /></button>
            </div>

            <form onSubmit={handleEditCharge}>
              <div className="acc-modal-body">
                <div className="acc-form-group">
                  <label>Client / Customer or Property / Unit Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Block A – Unit 4"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div className="acc-form-group">
                  <label>Maintenance Type *</label>
                  <select
                    value={editForm.maintenanceType}
                    onChange={e => setEditForm(f => ({ ...f, maintenanceType: e.target.value }))}
                  >
                    {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="acc-form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the maintenance work..."
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Amount (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={editForm.amount}
                      onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                    />
                  </div>

                  <div className="acc-form-group">
                    <label>Due Date *</label>
                    <input
                      type="date"
                      required
                      value={editForm.dueDate}
                      onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="acc-form-group">
                  <label>Payment Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={() => { setEditModalOpen(false); setEditingCharge(null); }} disabled={saving}>Cancel</button>
                <button type="submit" className="acc-btn-primary" disabled={saving}>
                  {saving ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Pencil size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

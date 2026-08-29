import React, { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, Eye, Edit, Trash2, X, AlertTriangle, Building2, Briefcase, Calendar, Target, Plus } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './HRViews.css';

const statusOptions = ['Excellent', 'Good', 'Average', 'Needs Improvement'];
const periodOptions = ['Q2 2026', 'Q1 2026', 'Q4 2025', 'Q3 2025'];

function StarRating({ rating }) {
  return (
    <div className="hr-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          fill={star <= Math.round(rating) ? '#F59E0B' : 'none'}
          color={star <= Math.round(rating) ? '#F59E0B' : '#CBD5E1'}
        />
      ))}
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', marginLeft: 4 }}>{rating}</span>
    </div>
  );
}

function ReviewFormModal({ initialValues, employees, onClose, onSubmit, saving, errorMessage }) {
  const isEdit = !!initialValues?._id;
  const [userId, setUserId] = useState(initialValues?.user?._id || initialValues?.user || (employees[0]?._id || ''));
  const [rating, setRating] = useState(initialValues?.rating ?? 4.0);
  const [goals, setGoals] = useState(initialValues?.goals ?? 80);
  const [score, setScore] = useState(initialValues?.score ?? 80);
  const [status, setStatus] = useState(initialValues?.status || 'Good');
  const [period, setPeriod] = useState(initialValues?.period || periodOptions[0]);
  const [notes, setNotes] = useState(initialValues?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      userId,
      rating: Math.min(5, Math.max(0, Number(rating) || 0)),
      goals: Math.min(100, Math.max(0, Number(goals) || 0)),
      score: Math.min(100, Math.max(0, Number(score) || 0)),
      status,
      period,
      notes
    });
  };

  const selectedEmp = employees.find(emp => emp._id === userId);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Performance Review' : 'New Performance Review'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Employee</label>
              {isEdit ? (
                <input className="form-input" value={initialValues?.user?.fullName || 'Employee'} disabled />
              ) : (
                <select className="form-select" value={userId} onChange={(e) => setUserId(e.target.value)} required>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.fullName} — {emp.department || emp.role}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Period</label>
                <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {periodOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Rating (0–5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  className="form-input"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Goal Completion (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Overall Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Notes / Feedback</label>
              <input
                className="form-input"
                placeholder="Review notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div style={{ color: '#DC2626', fontSize: '0.85rem' }}>{errorMessage}</div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewViewModal({ review, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Performance Details</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
            <div
              className="hr-emp-avatar"
              style={{ backgroundColor: '#2563EB', width: '52px', height: '52px', fontSize: '1.1rem' }}
            >
              {(review.user?.fullName || 'E').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{review.user?.fullName || 'Employee'}</div>
              <span className={`hr-status-badge ${review.status.toLowerCase().replace(' ', '-')}`}>
                {review.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{review.user?.department || 'General'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Briefcase size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{review.user?.role || 'Staff'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{review.period}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>Rating: {review.rating} / 5</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>
                Goal Completion: {review.goals}% · Overall Score: {review.score}%
              </span>
            </div>
            {review.notes && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px' }}>
                <strong>Notes:</strong> {review.notes}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ review, onClose, onConfirm, deleting }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', paddingTop: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Remove review for {review.user?.fullName || 'Employee'}?
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            This will permanently delete this performance review.
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ backgroundColor: '#DC2626' }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HRPerformanceView({ searchQuery = '' }) {
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [viewingReview, setViewingReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const term = (searchQuery || search).trim();
      let queryParams = [];
      if (term) queryParams.push(`search=${encodeURIComponent(term)}`);
      if (periodFilter) queryParams.push(`period=${encodeURIComponent(periodFilter)}`);
      const qs = queryParams.length ? `?${queryParams.join('&')}` : '';

      const { response, data } = await apiRequest(`/api/hr/performance${qs}`);
      if (response.ok && data.success) {
        setReviews(data.data || []);
      }
    } catch (err) {
      console.error('Fetch performance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { response, data } = await apiRequest('/api/hr/employees');
      if (response.ok && data.success) {
        setEmployees(data.data || []);
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    }
  };

  useEffect(() => {
    fetchPerformance();
    fetchEmployees();
  }, [searchQuery, periodFilter]);

  const handleSaveReview = async (formData) => {
    setSaving(true);
    setErrorMessage('');
    try {
      if (editingReview?._id) {
        const { response, data } = await apiRequest(`/api/hr/performance/${editingReview._id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData)
        });
        if (response.ok && data.success) {
          setEditingReview(null);
          fetchPerformance();
        } else {
          setErrorMessage(data.message || 'Failed to update performance review.');
        }
      } else {
        const { response, data } = await apiRequest('/api/hr/performance', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        if (response.ok && data.success) {
          setIsFormOpen(false);
          fetchPerformance();
        } else {
          setErrorMessage(data.message || 'Failed to create performance review.');
        }
      }
    } catch (err) {
      setErrorMessage('Server connection error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = async (id) => {
    setDeleting(true);
    try {
      const { response, data } = await apiRequest(`/api/hr/performance/${id}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setDeletingReview(null);
        fetchPerformance();
      }
    } catch (err) {
      console.error('Delete review error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const avgScore = reviews.length
    ? Math.round(reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length)
    : 0;
  const excellentCount = reviews.filter((r) => r.status === 'Excellent').length;
  const goodCount = reviews.filter((r) => r.status === 'Good').length;
  const needsImprovementCount = reviews.filter((r) => r.status === 'Needs Improvement').length;

  const effectiveSearch = searchQuery || search;
  const filtered = reviews.filter(r =>
    !effectiveSearch ||
    (r.user?.fullName || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    (r.user?.department || '').toLowerCase().includes(effectiveSearch.toLowerCase())
  );

  return (
    <div className="hr-view-container">
      {/* Summary Cards */}
      <div className="hr-summary-cards">
        <div className="hr-summary-card">
          <div className="hr-summary-icon purple"><TrendingUp size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{avgScore}%</span>
            <span className="hr-summary-lbl">Avg. Performance Score</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon green"><Star size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{excellentCount}</span>
            <span className="hr-summary-lbl">Excellent Ratings</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon amber"><TrendingUp size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{goodCount}</span>
            <span className="hr-summary-lbl">Good Ratings</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon red"><TrendingUp size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{needsImprovementCount}</span>
            <span className="hr-summary-lbl">Needs Improvement</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="hr-toolbar">
        <div className="hr-toolbar-left" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="hr-search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="hr-filter-btn"
            style={{ cursor: 'pointer' }}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="">All Periods</option>
            {periodOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="hr-toolbar-right">
          <button className="hr-action-btn" onClick={() => { setIsFormOpen(true); setErrorMessage(''); }}>
            <Plus size={15} /> New Review
          </button>
        </div>
      </div>

      {/* Performance Table */}
      <div className="hr-data-card">
        <div className="hr-data-card-header">
          <div className="hr-data-card-title">
            <TrendingUp size={17} color="#7C3AED" />
            Performance Reviews
            <span className="hr-count-badge">{filtered.length} records</span>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading performance reviews...</div>
        ) : (
          <div className="hr-table-wrapper">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Period</th>
                  <th>Rating</th>
                  <th>Goal Completion</th>
                  <th>Overall Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rev => (
                  <tr key={rev._id}>
                    <td>
                      <div className="hr-emp-cell">
                        <div className="hr-emp-avatar" style={{ backgroundColor: '#2563EB' }}>
                          {(rev.user?.fullName || 'E').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="hr-emp-name">{rev.user?.fullName || 'Employee'}</span>
                      </div>
                    </td>
                    <td>{rev.user?.department || '—'}</td>
                    <td style={{ color: '#64748B', fontSize: '0.83rem' }}>{rev.user?.role || 'Staff'}</td>
                    <td>{rev.period}</td>
                    <td><StarRating rating={rev.rating || 0} /></td>
                    <td>
                      <div className="hr-progress-bar-wrap">
                        <div className="hr-progress-bar">
                          <div className="hr-progress-fill" style={{ width: `${rev.goals || 0}%` }} />
                        </div>
                        <span className="hr-progress-val">{rev.goals || 0}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{rev.score || 0}%</td>
                    <td>
                      <span className={`hr-status-badge ${(rev.status || 'Average').toLowerCase().replace(' ', '-')}`}>
                        {rev.status}
                      </span>
                    </td>
                    <td>
                      <div className="hr-row-action hr-row-action-compact">
                        <button className="hr-edit-btn hr-btn-sm" onClick={() => { setEditingReview(rev); setErrorMessage(''); }}>
                          <Edit size={12} /> Edit
                        </button>
                        <button className="hr-view-btn hr-btn-sm" onClick={() => setViewingReview(rev)}>
                          <Eye size={12} /> Details
                        </button>
                        <button className="hr-delete-btn hr-btn-sm" onClick={() => setDeletingReview(rev)}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                      No performance reviews found. Click "New Review" to add one for a registered employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(isFormOpen || editingReview) && (
        <ReviewFormModal
          initialValues={editingReview}
          employees={employees}
          onClose={() => { setIsFormOpen(false); setEditingReview(null); setErrorMessage(''); }}
          onSubmit={handleSaveReview}
          saving={saving}
          errorMessage={errorMessage}
        />
      )}

      {viewingReview && (
        <ReviewViewModal review={viewingReview} onClose={() => setViewingReview(null)} />
      )}

      {deletingReview && (
        <DeleteConfirmModal
          review={deletingReview}
          onClose={() => setDeletingReview(null)}
          onConfirm={() => handleDeleteReview(deletingReview._id)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
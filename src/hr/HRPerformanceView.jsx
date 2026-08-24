import React, { useState } from 'react';
import { Search, Star, TrendingUp, Eye, Edit, Trash2, X, AlertTriangle, Building2, Briefcase, Calendar, Target } from 'lucide-react';
import './HRViews.css';

const initialReviews = [
  { id: 1, name: 'Marcus Chen', initials: 'MC', bg: '#2563EB', dept: 'Engineering', role: 'Sr. Frontend Dev', period: 'Q2 2026', rating: 4.8, goals: 92, score: 94, status: 'Excellent' },
  { id: 2, name: 'Aisha Nkosi', initials: 'AN', bg: '#F59E0B', dept: 'Sales', role: 'Account Executive', period: 'Q2 2026', rating: 4.2, goals: 85, score: 86, status: 'Good' },
  { id: 3, name: 'Daniel Torres', initials: 'DT', bg: '#10B981', dept: 'Operations', role: 'Project Lead', period: 'Q2 2026', rating: 4.5, goals: 88, score: 90, status: 'Excellent' },
  { id: 4, name: 'Elena Rostova', initials: 'ER', bg: '#EC4899', dept: 'Engineering', role: 'Backend Engineer', period: 'Q2 2026', rating: 3.8, goals: 76, score: 78, status: 'Good' },
  { id: 5, name: 'Liam Chen', initials: 'LC', bg: '#8B5CF6', dept: 'Design', role: 'UX Designer', period: 'Q2 2026', rating: 4.0, goals: 80, score: 82, status: 'Good' },
  { id: 6, name: 'Carlos Rivera', initials: 'CR', bg: '#EF4444', dept: 'Analytics', role: 'Data Analyst', period: 'Q2 2026', rating: 3.2, goals: 65, score: 67, status: 'Average' },
  { id: 7, name: 'James Okafor', initials: 'JO', bg: '#14B8A6', dept: 'Finance', role: 'Finance Analyst', period: 'Q2 2026', rating: 2.9, goals: 55, score: 58, status: 'Needs Improvement' },
];

const statusOptions = ['Excellent', 'Good', 'Average', 'Needs Improvement'];
const periodOptions = ['Q2 2026', 'Q1 2026', 'Q4 2025', 'Q3 2025'];

function StarRating({ rating }) {
  return (
    <div className="hr-rating">
      {[1, 2, 3, 4, 5].map(star => (
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

function ReviewFormModal({ initialValues, onClose, onSubmit }) {
  const [rating, setRating] = useState(initialValues?.rating ?? 4.0);
  const [goals, setGoals] = useState(initialValues?.goals ?? 80);
  const [score, setScore] = useState(initialValues?.score ?? 80);
  const [status, setStatus] = useState(initialValues?.status || 'Good');
  const [period, setPeriod] = useState(initialValues?.period || periodOptions[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      rating: Math.min(5, Math.max(0, Number(rating) || 0)),
      goals: Math.min(100, Math.max(0, Number(goals) || 0)),
      score: Math.min(100, Math.max(0, Number(score) || 0)),
      status,
      period,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Performance Review</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="edit-user-identity" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid #F1F5F9' }}>
              <div className="hr-emp-avatar" style={{ backgroundColor: initialValues.bg, width: '40px', height: '40px' }}>
                {initialValues.initials}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{initialValues.name}</div>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{initialValues.role}</span>
              </div>
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
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Review
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
              style={{ backgroundColor: review.bg, width: '52px', height: '52px', fontSize: '1.1rem' }}
            >
              {review.initials}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{review.name}</div>
              <span className={`hr-status-badge ${review.status.toLowerCase().replace(' ', '-')}`}>
                {review.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{review.dept}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Briefcase size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{review.role}</span>
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

function DeleteConfirmModal({ review, onClose, onConfirm }) {
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
            Remove review for {review.name}?
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            This will permanently delete this performance review. This action can't be undone.
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ backgroundColor: '#DC2626' }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HRPerformanceView() {
  const [search, setSearch] = useState('');
  const [reviews, setReviews] = useState(initialReviews);

  const [editingReview, setEditingReview] = useState(null);
  const [viewingReview, setViewingReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);

  const filtered = reviews.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateReview = (id, data) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const removeReview = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const avgScore = reviews.length
    ? Math.round(reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length)
    : 0;
  const excellentCount = reviews.filter((r) => r.status === 'Excellent').length;
  const goodCount = reviews.filter((r) => r.status === 'Good').length;
  const needsImprovementCount = reviews.filter((r) => r.status === 'Needs Improvement').length;

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
        <div className="hr-search-input-wrapper">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="hr-filter-btn" style={{ cursor: 'pointer' }}>
          <option>Q2 2026</option>
          <option>Q1 2026</option>
          <option>Q4 2025</option>
        </select>
      </div>

      {/* Performance Table */}
      <div className="hr-data-card">
        <div className="hr-data-card-header">
          <div className="hr-data-card-title">
            <TrendingUp size={17} color="#7C3AED" />
            Performance Reviews — Q2 2026
            <span className="hr-count-badge">{filtered.length} employees</span>
          </div>
        </div>
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
                <tr key={rev.id}>
                  <td>
                    <div className="hr-emp-cell">
                      <div className="hr-emp-avatar" style={{ backgroundColor: rev.bg }}>{rev.initials}</div>
                      <span className="hr-emp-name">{rev.name}</span>
                    </div>
                  </td>
                  <td>{rev.dept}</td>
                  <td style={{ color: '#64748B', fontSize: '0.83rem' }}>{rev.role}</td>
                  <td>{rev.period}</td>
                  <td><StarRating rating={rev.rating} /></td>
                  <td>
                    <div className="hr-progress-bar-wrap">
                      <div className="hr-progress-bar">
                        <div className="hr-progress-fill" style={{ width: `${rev.goals}%` }} />
                      </div>
                      <span className="hr-progress-val">{rev.goals}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{rev.score}%</td>
                  <td>
                    <span className={`hr-status-badge ${rev.status.toLowerCase().replace(' ', '-')}`}>
                      {rev.status}
                    </span>
                  </td>
                  <td>
                    <div className="hr-row-action hr-row-action-compact">
                      <button className="hr-edit-btn hr-btn-sm" onClick={() => setEditingReview(rev)}>
                        <Edit size={12} /> Review
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
            </tbody>
          </table>
        </div>
      </div>

      {editingReview && (
        <ReviewFormModal
          initialValues={editingReview}
          onClose={() => setEditingReview(null)}
          onSubmit={(data) => updateReview(editingReview.id, data)}
        />
      )}

      {viewingReview && (
        <ReviewViewModal review={viewingReview} onClose={() => setViewingReview(null)} />
      )}

      {deletingReview && (
        <DeleteConfirmModal
          review={deletingReview}
          onClose={() => setDeletingReview(null)}
          onConfirm={() => {
            removeReview(deletingReview.id);
            setDeletingReview(null);
          }}
        />
      )}
    </div>
  );
}
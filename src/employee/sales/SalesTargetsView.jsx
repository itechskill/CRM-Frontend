import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import './SalesViews.css';

export default function SalesTargetsView() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTargets() {
      setLoading(true);
      try {
        const { response, data } = await apiRequest('/api/sales-employee/targets');
        if (response.ok && data.success) setTargets(data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchTargets();
  }, []);

  const getPct = (t) => t.targetAmount > 0 ? Math.min(100, Math.round((t.achievedAmount / t.targetAmount) * 100)) : 0;
  const getColor = (pct) => pct >= 100 ? '#10B981' : pct >= 75 ? '#F59E0B' : pct >= 50 ? '#6366F1' : '#EF4444';

  return (
    <div className="sv-container">
      <div className="sv-header">
        <div>
          <h2 className="sv-title"><Target size={20} /> Sales Targets</h2>
          <p className="sv-subtitle">Your assigned sales targets and achievement progress</p>
        </div>
      </div>

      {loading ? <div className="sv-loading">Loading targets...</div>
        : targets.length === 0 ? (
          <div className="sv-empty-card" style={{ marginTop: '24px' }}>
            <Target size={48} color="#374151" />
            <p style={{ color: '#64748B', marginTop: '12px' }}>No targets assigned yet. Contact your Sales Manager.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {targets.map(t => {
              const pct = getPct(t);
              const color = getColor(pct);
              const remaining = Math.max(0, t.targetAmount - t.achievedAmount);
              return (
                <div key={t._id} className="sv-target-card">
                  <div className="sv-target-header">
                    <div>
                      <h3 className="sv-target-period">{t.period || 'Current Period'}</h3>
                      <span className="sv-target-type-badge">{t.periodType}</span>
                    </div>
                    <div className="sv-target-status-badge" style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
                      {t.status === 'Achieved' ? <CheckCircle size={14} /> : pct < 50 ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
                      {pct}% Achieved
                    </div>
                  </div>

                  <div className="sv-target-bar-wrap">
                    <div className="sv-target-bar">
                      <div className="sv-target-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
                    </div>
                  </div>

                  <div className="sv-target-stats">
                    <div className="sv-target-stat">
                      <span className="sv-ts-label">Target</span>
                      <span className="sv-ts-value">{t.currency} {t.targetAmount?.toLocaleString()}</span>
                    </div>
                    <div className="sv-target-stat">
                      <span className="sv-ts-label">Achieved</span>
                      <span className="sv-ts-value" style={{ color: '#10B981' }}>{t.currency} {t.achievedAmount?.toLocaleString()}</span>
                    </div>
                    <div className="sv-target-stat">
                      <span className="sv-ts-label">Remaining</span>
                      <span className="sv-ts-value" style={{ color: remaining > 0 ? '#EF4444' : '#10B981' }}>{t.currency} {remaining.toLocaleString()}</span>
                    </div>
                  </div>

                  {t.assignedBy && (
                    <p className="sv-target-assigned">Assigned by: {t.assignedBy.fullName}</p>
                  )}
                  {t.notes && <p className="sv-target-notes">{t.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

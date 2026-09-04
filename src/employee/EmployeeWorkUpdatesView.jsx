import React, { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle, CheckCircle, Send, Calendar, User } from 'lucide-react';
import './EmployeeWorkUpdatesView.css';
import { authHeaders, API_BASE } from '../utils/api';

export default function EmployeeWorkUpdatesView() {
  const [hours, setHours] = useState(7.5);
  const [completed, setCompleted] = useState('');
  const [planned, setPlanned] = useState('');
  const [blockers, setBlockers] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [standupLogs, setStandupLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkUpdates();
  }, []);

  const fetchWorkUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/work-updates`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStandupLogs(data.data || []);
      }
    } catch (err) {
      console.error('Fetch work updates error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStandup = async (e) => {
    e.preventDefault();
    if (!completed.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/work-updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          hoursSpent: Number(hours),
          summary: completed.trim(),
          planned: planned.trim(),
          blockers: blockers.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCompleted('');
        setPlanned('');
        setBlockers('');
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
        fetchWorkUpdates();
      }
    } catch (err) {
      console.error('Submit work update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employee-work-updates-container">
      {/* Standup Form Card */}
      <div className="work-update-card form-card">
        <div className="card-header">
          <div className="title-box">
            <FileText size={20} color="#2563EB" />
            <div>
              <h3>Submit Today's Work Update</h3>
              <p>Log your daily accomplishments, hours, and planned items</p>
            </div>
          </div>
          {isSubmitted && (
            <span className="submit-success-badge">
              <CheckCircle size={14} /> Update Logged!
            </span>
          )}
        </div>

        <form onSubmit={handleSubmitStandup} className="standup-form">
          <div className="form-row-2">
            <div className="form-group">
              <label>Hours Worked Today</label>
              <div className="input-icon-box">
                <Clock size={16} color="#94A3B8" />
                <input 
                  type="number" 
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Work Date</label>
              <div className="input-icon-box">
                <Calendar size={16} color="#94A3B8" />
                <input type="text" value="June 16, 2024 (Today)" disabled readOnly />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>What did you accomplish today? *</label>
            <textarea 
              rows="3" 
              placeholder="List completed tasks, pull requests, bug fixes, or key milestones..." 
              value={completed}
              onChange={(e) => setCompleted(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>What are your plans for tomorrow?</label>
            <textarea 
              rows="2" 
              placeholder="Next tasks, meetings, code reviews..." 
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Any Blockers or Support Needed?</label>
            <textarea 
              rows="2" 
              placeholder="API issues, missing assets, environment setup issues..." 
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </div>

          <button type="submit" className="submit-standup-btn">
            <Send size={16} />
            <span>Submit Work Log</span>
          </button>
        </form>
      </div>

      {/* Submitted Updates History List */}
      <div className="work-update-card history-card">
        <div className="card-header">
          <h3>Recent Work Update History</h3>
          <span className="history-count">{standupLogs.length} logs submitted</span>
        </div>

        <div className="standup-history-list">
          {standupLogs.map((log, index) => {
            const statusStr = (log.status || 'Submitted').toString().toLowerCase();
            const dateStr = log.date ? new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
            const hoursStr = log.hours || (log.hoursSpent ? `${log.hoursSpent}h` : '0h');
            const summaryStr = log.completed || log.summary || 'Work update logged.';
            
            return (
              <div key={log._id || log.id || index} className="standup-item">
                <div className="standup-item-header">
                  <div className="standup-date-box">
                    <Calendar size={15} color="#2563EB" />
                    <span className="standup-date">{dateStr}</span>
                  </div>
                  <div className="standup-header-right">
                    <span className="hours-pill">{hoursStr} logged</span>
                    <span className={`status-tag ${statusStr}`}>{log.status || 'Submitted'}</span>
                  </div>
                </div>

                <div className="standup-body">
                  <div className="standup-section">
                    <span className="section-label text-green">Accomplished:</span>
                    <p className="section-text">{summaryStr}</p>
                  </div>

                  {log.planned && (
                    <div className="standup-section">
                      <span className="section-label text-blue">Planned Next:</span>
                      <p className="section-text">{log.planned}</p>
                    </div>
                  )}

                  {log.blockers && log.blockers !== 'None.' && log.blockers !== 'None currently.' && (
                    <div className="standup-section">
                      <span className="section-label text-red">Blockers:</span>
                      <p className="section-text">{log.blockers}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle, CheckCircle, Send, Calendar, User } from 'lucide-react';
import './EmployeeWorkUpdatesView.css';

export default function EmployeeWorkUpdatesView() {
  const [hours, setHours] = useState('7.5');
  const [completed, setCompleted] = useState('');
  const [planned, setPlanned] = useState('');
  const [blockers, setBlockers] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [standupLogs, setStandupLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkUpdates();
  }, []);

  const fetchWorkUpdates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('http://localhost:5000/api/work-updates', {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const token = localStorage.getItem('crm_token');
      const response = await fetch('http://localhost:5000/api/work-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hoursSpent: Number(hours),
          summary: completed.trim()
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
          {standupLogs.map(log => (
            <div key={log.id} className="standup-item">
              <div className="standup-item-header">
                <div className="standup-date-box">
                  <Calendar size={15} color="#2563EB" />
                  <span className="standup-date">{log.date}</span>
                </div>
                <div className="standup-header-right">
                  <span className="hours-pill">{log.hours} logged</span>
                  <span className={`status-tag ${log.status.toLowerCase()}`}>{log.status}</span>
                </div>
              </div>

              <div className="standup-body">
                <div className="standup-section">
                  <span className="section-label text-green">Accomplished:</span>
                  <p className="section-text">{log.completed}</p>
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
          ))}
        </div>
      </div>
    </div>
  );
}

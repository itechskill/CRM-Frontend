import React, { useState } from 'react';
import { X } from 'lucide-react';
import './NewProjectModal.css';

import { authHeaders, API_BASE } from '../utils/api';

export default function NewProjectModal({ isOpen, onClose, onAddProject }) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [leadName, setLeadName] = useState('');
  const [budgetSpent, setBudgetSpent] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('On Track');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !client) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          name: name.trim(),
          client: client.trim(),
          budget: budgetTotal ? Number(budgetTotal.replace(/[^0-9.]/g, '')) : 30000,
          spent: budgetSpent ? Number(budgetSpent.replace(/[^0-9.]/g, '')) : 10000,
          endDate: dueDate || null,
          priority,
          status: status === 'On Track' ? 'In Progress' : status
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (onAddProject) onAddProject(data.data);
        setName('');
        setClient('');
        setLeadName('');
        setBudgetSpent('');
        setBudgetTotal('');
        setDueDate('');
        setPriority('Medium');
        setStatus('On Track');
        onClose();
      } else {
        setErrorMsg(data.message || 'Unable to save project. Please try again.');
      }
    } catch (err) {
      console.error('Create project error:', err);
      setErrorMsg('Unable to save data. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    };
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Project Title</label>
              <input 
                className="form-input" 
                placeholder="e.g. Cloud Infrastructure Migration" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Client Name</label>
              <input 
                className="form-input" 
                placeholder="e.g. Proxima Labs" 
                value={client}
                onChange={(e) => setClient(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Project Lead</label>
              <input 
                className="form-input" 
                placeholder="e.g. Daniel Torres" 
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Spent Budget (e.g. Rs. 34K)</label>
                <input 
                  className="form-input" 
                  placeholder="34" 
                  value={budgetSpent}
                  onChange={(e) => setBudgetSpent(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Total Budget (e.g. Rs. 42K)</label>
                <input 
                  className="form-input" 
                  placeholder="42" 
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input 
                className="form-input" 
                placeholder="e.g. Feb 28, 2025" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {errorMsg && (
              <div style={{ color: '#EF4444', fontSize: '0.85rem', width: '100%', marginBottom: '8px' }}>
                {errorMsg}
              </div>
            )}
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

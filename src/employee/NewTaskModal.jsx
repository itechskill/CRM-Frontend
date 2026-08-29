import React, { useState } from 'react';
import { X, CheckSquare, Plus } from 'lucide-react';
import './NewTaskModal.css';

export default function NewTaskModal({ isOpen, onClose, onAddTask }) {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Proxima Migration');
  const [priority, setPriority] = useState('High');
  const [estimated, setEstimated] = useState('4.0');
  const [dueDate, setDueDate] = useState('Tomorrow');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('crm_token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          project: project ? project.trim() : 'General',
          priority,
          category: 'Development',
          status: 'Pending'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (onAddTask) onAddTask(data.data);
        setTitle('');
        onClose();
      } else {
        setErrorMsg(data.message || 'Unable to save task. Please try again.');
      }
    } catch (err) {
      console.error('Create task error:', err);
      setErrorMsg('Unable to save task data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <CheckSquare size={20} color="#2563EB" />
            <h3>Create New Task</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-group">
            <label>Task Description *</label>
            <input 
              type="text" 
              placeholder="e.g. Implement user profile avatar upload endpoint..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="modal-form-row">
            <div className="modal-form-group">
              <label>Assigned Project</label>
              <select value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="Proxima Migration">Proxima Migration</option>
                <option value="BuildCo Integration">BuildCo Integration</option>
                <option value="TechFlow Engine">TechFlow Engine</option>
                <option value="Starlight Security">Starlight Security</option>
              </select>
            </div>

            <div className="modal-form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="modal-form-row">
            <div className="modal-form-group">
              <label>Estimated Hours (h)</label>
              <input 
                type="number" 
                step="0.5" 
                min="0.5" 
                value={estimated}
                onChange={(e) => setEstimated(e.target.value)}
              />
            </div>

            <div className="modal-form-group">
              <label>Due Date</label>
              <input 
                type="text" 
                placeholder="e.g. Today, Tomorrow, Jun 25" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            {errorMsg && (
              <div style={{ color: '#EF4444', fontSize: '0.85rem', width: '100%', marginBottom: '8px' }}>
                {errorMsg}
              </div>
            )}
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              <Plus size={16} />
              <span>{isSubmitting ? 'Saving...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

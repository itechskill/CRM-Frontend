import React, { useState } from 'react';
import { X } from 'lucide-react';
import './NewDealModal.css';

export default function NewDealModal({ isOpen, onClose, onAddDeal }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState('Qualified');
  const [owner, setOwner] = useState('James Carter');
  const [closeDate, setCloseDate] = useState('Oct 15, 2026');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !company || !value) return;

    onAddDeal({
      id: Date.now(),
      name,
      company,
      value: parseFloat(value),
      stage,
      owner,
      closeDate: closeDate || 'Nov 30, 2026'
    });

    // Reset form
    setName('');
    setCompany('');
    setValue('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Deal</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Deal Opportunity Title</label>
              <input 
                className="form-input" 
                placeholder="e.g. Enterprise Cloud License" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Company / Client Name</label>
              <input 
                className="form-input" 
                placeholder="e.g. Acme Corp" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Estimated Value ($ USD)</label>
              <input 
                type="number"
                className="form-input" 
                placeholder="45000" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Pipeline Stage</label>
              <select className="form-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">In Progress / Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="form-group">
              <label>Assign Deal Owner</label>
              <select className="form-select" value={owner} onChange={(e) => setOwner(e.target.value)}>
                <option value="James Carter">James Carter (Product Mgr)</option>
                <option value="Sarah Jenkins">Sarah Jenkins (Sales Exec)</option>
                <option value="Emma Field">Emma Field (Account Mgr)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

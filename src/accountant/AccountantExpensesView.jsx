import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  X,
  Building2,
  Tag
} from 'lucide-react';
import './AccountantViews.css';


export default function AccountantExpensesView({ isModalOpen, onCloseModal }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExpenses = async () => {
    try {
      const { response, data } = await apiRequest('/api/finance/expenses');
      if (response.ok && data.success) {
        setExpenses(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Office Supplies');
  const [amount, setAmount] = useState('');
  const [claimer, setClaimer] = useState('');

const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!merchant || !amount) return;
    
    setActionLoading(true);
    try {
      const { response, data } = await apiRequest('/api/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({
          title: merchant,
          category,
          amount,
          notes: claimer
        })
      });
      if (response.ok && data.success) {
        setExpenses([data.data, ...expenses]);
        setMerchant('');
        setAmount('');
        setClaimer('');
        if (onCloseModal) onCloseModal();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesCat = activeCategory === 'All' || exp.category === activeCategory;
    const matchesSearch =
      (exp.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.notes || exp.submittedByName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp._id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });


  const handleUpdateStatus = async (id, status) => {
    try {
      const { response, data } = await apiRequest(`/api/finance/expenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (response.ok && data.success) {
        setExpenses(expenses.map(e => e._id === id ? data.data : e));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'Pending').length;

  return (
    <div className="acc-view-container">
      {/* Page Header */}
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Expenses & Receipts Log</h2>
          <p>Track business expenses, vendor payments, receipt audits, and tax deductions.</p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="acc-kpi-grid">
        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Month Expenses</span>
            <div className="acc-kpi-icon red"><Receipt size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalExpense.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">{expenses.length} Total outlays</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Software & Cloud</span>
            <div className="acc-kpi-icon blue"><Building2 size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {expenses.filter(e => e.category === 'Software').reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}</div>
          <div className="acc-kpi-subtitle">Primary operational expense</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Pending Employee Claims</span>
            <div className="acc-kpi-icon amber"><Clock size={18} /></div>
          </div>
          <div className="acc-kpi-value">{pendingCount} Claim</div>
          <div className="acc-kpi-subtitle">Requires accountant sign-off</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Tax Deductible Ratio</span>
            <div className="acc-kpi-icon emerald"><CheckCircle size={18} /></div>
          </div>
          <div className="acc-kpi-value">{expenses.length > 0 ? Math.round((expenses.filter(e => e.category !== 'Travel').length / expenses.length) * 100) : 0}%</div>
          <div className="acc-kpi-subtitle up">Eligible for tax write-off</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="acc-card">
        {/* Filter Controls */}
        <div className="acc-filter-bar">
          <div className="acc-tabs">
            {['All', 'Software', 'Office Supplies', 'Marketing', 'Travel', 'Utilities', 'Salaries', 'Other'].map(cat => (
              <button
                key={cat}
                className={`acc-tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="acc-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search vendor or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="acc-table-wrapper">
          <table className="acc-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Merchant / Vendor</th>
                <th>Category</th>
                <th>Date</th>
                <th>Claimer / Dept</th>
                <th>Amount (Rs.)</th>
                <th>Tax Deductible</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr> : filteredExpenses.length === 0 ? <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>No expenses found</td></tr> : filteredExpenses.map((exp) => (
                <tr key={exp._id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{exp._id}</td>
                  <td style={{ fontWeight: 600, color: '#1E293B' }}>{exp.title}</td>
                  <td><span className="acc-badge draft"><Tag size={12} /> {exp.category}</span></td>
                  <td>{new Date(exp.createdAt || exp.date || new Date()).toLocaleDateString()}</td>
                  <td>{(exp.notes || exp.submittedByName)}</td>
                  <td style={{ fontWeight: 700, color: '#DC2626' }}>Rs. {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{exp.category === 'Travel' ? 'Partial' : 'Yes'}</td>
                  <td>
<span className={`acc-badge ${(exp.status || 'pending').toLowerCase()}`}>
                      {exp.status || 'Pending'}
                    </span>
                    {(exp.status === 'Pending' || !exp.status) && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button onClick={() => handleUpdateStatus(exp._id, 'Approved')} style={{ fontSize: '10px', padding: '2px 4px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleUpdateStatus(exp._id, 'Rejected')} style={{ fontSize: '10px', padding: '2px 4px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <h3>Log Business Expense</h3>
              <button className="acc-modal-close" onClick={onCloseModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="acc-modal-body">
                <div className="acc-form-group">
                  <label>Merchant / Vendor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Cloud, Office Depot"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                  />
                </div>

                <div className="acc-form-group">
                  <label>Expense Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Software">Software</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Travel">Travel</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Amount (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="450.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="acc-form-group">
                    <label>Claimer / Department</label>
                    <input
                      type="text"
                      placeholder="e.g. IT Department"
                      value={claimer}
                      onChange={(e) => setClaimer(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={onCloseModal}>Cancel</button>
                <button type="submit" className="acc-btn-primary" disabled={actionLoading}>{actionLoading ? 'Recording...' : 'Record Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

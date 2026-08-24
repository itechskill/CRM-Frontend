import React, { useState } from 'react';
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

const initialExpenses = [
  { id: 'EXP-801', merchant: 'AWS Cloud Services', category: 'Software & Tools', date: '2026-08-18', amount: 4850.00, claimer: 'IT Operations', status: 'Approved', taxDeductible: 'Yes' },
  { id: 'EXP-802', merchant: 'Downtown Co-Working Space', category: 'Office Operations', date: '2026-08-16', amount: 3200.00, claimer: 'Facilities', status: 'Approved', taxDeductible: 'Yes' },
  { id: 'EXP-803', merchant: 'Google Ads Platform', category: 'Marketing & Ads', date: '2026-08-14', amount: 6400.00, claimer: 'Marketing Team', status: 'Approved', taxDeductible: 'Yes' },
  { id: 'EXP-804', merchant: 'Delta Airlines (Client Meeting)', category: 'Travel & Dining', date: '2026-08-12', amount: 1250.00, claimer: 'Sarah Mitchell', status: 'Pending', taxDeductible: 'Partial' },
  { id: 'EXP-805', merchant: 'Salesforce CRM License', category: 'Software & Tools', date: '2026-08-10', amount: 8900.00, claimer: 'Sales Ops', status: 'Approved', taxDeductible: 'Yes' },
  { id: 'EXP-806', merchant: 'Legal & Advisory Retainer', category: 'Professional Services', date: '2026-08-08', amount: 5000.00, claimer: 'Executive Team', status: 'Approved', taxDeductible: 'Yes' },
];

export default function AccountantExpensesView({ isModalOpen, onCloseModal }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Software & Tools');
  const [amount, setAmount] = useState('');
  const [claimer, setClaimer] = useState('');

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!merchant || !amount) return;

    const newExp = {
      id: `EXP-80${expenses.length + 1}`,
      merchant,
      category,
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      claimer: claimer || 'Accounts Dept',
      status: 'Approved',
      taxDeductible: 'Yes'
    };

    setExpenses([newExp, ...expenses]);
    setMerchant('');
    setAmount('');
    setClaimer('');
    if (onCloseModal) onCloseModal();
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesCat = activeCategory === 'All' || exp.category === activeCategory;
    const matchesSearch =
      exp.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.claimer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

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
          <div className="acc-kpi-value">${totalExpense.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">{expenses.length} Total outlays</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Software & Cloud</span>
            <div className="acc-kpi-icon blue"><Building2 size={18} /></div>
          </div>
          <div className="acc-kpi-value">$13,750</div>
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
          <div className="acc-kpi-value">94.5%</div>
          <div className="acc-kpi-subtitle up">Eligible for tax write-off</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="acc-card">
        {/* Filter Controls */}
        <div className="acc-filter-bar">
          <div className="acc-tabs">
            {['All', 'Software & Tools', 'Office Operations', 'Marketing & Ads', 'Travel & Dining'].map(cat => (
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
                <th>Amount ($)</th>
                <th>Tax Deductible</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{exp.id}</td>
                  <td style={{ fontWeight: 600, color: '#1E293B' }}>{exp.merchant}</td>
                  <td><span className="acc-badge draft"><Tag size={12} /> {exp.category}</span></td>
                  <td>{exp.date}</td>
                  <td>{exp.claimer}</td>
                  <td style={{ fontWeight: 700, color: '#DC2626' }}>${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{exp.taxDeductible}</td>
                  <td>
                    <span className={`acc-badge ${exp.status.toLowerCase()}`}>
                      {exp.status}
                    </span>
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
                    <option value="Software & Tools">Software & Tools</option>
                    <option value="Office Operations">Office Operations</option>
                    <option value="Marketing & Ads">Marketing & Ads</option>
                    <option value="Travel & Dining">Travel & Dining</option>
                    <option value="Professional Services">Professional Services</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Amount ($)</label>
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
                <button type="submit" className="acc-btn-primary">Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

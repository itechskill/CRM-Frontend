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
  Tag,
  Download,
  FileSpreadsheet,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AccountantViews.css';

export default function AccountantExpensesView({ isModalOpen: propModalOpen, onCloseModal: propCloseModal, searchQuery: propSearchQuery }) {
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const isModalOpen = propModalOpen || internalModalOpen;
  const handleCloseModal = () => {
    setInternalModalOpen(false);
    if (propCloseModal) propCloseModal();
  };

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Office Supplies');
  const [amount, setAmount] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [department, setDepartment] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/finance/expenses');
      if (response.ok && data.success) {
        setExpenses(data.data || []);
      }
    } catch (err) {
      console.error('Fetch expenses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { response, data } = await apiRequest('/api/users');
      if (response.ok && data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchUsers();
  }, []);

  const handleUserChange = (e) => {
    const uId = e.target.value;
    setSelectedUserId(uId);
    const u = users.find(x => x._id === uId);
    if (u && u.department) {
      setDepartment(u.department);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!merchant || !amount) return;

    setActionLoading(true);
    try {
      const selectedUser = users.find(u => u._id === selectedUserId);
      const payload = {
        title: merchant.trim(),
        category,
        amount: Number(amount),
        date: expenseDate || new Date(),
        submittedBy: selectedUserId || undefined,
        submittedByName: selectedUser ? selectedUser.fullName : (notes || 'Finance / Operations'),
        department: department.trim() || (selectedUser ? selectedUser.department : 'General'),
        notes: notes.trim()
      };

      const { response, data } = await apiRequest('/api/finance/expenses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setExpenses([data.data, ...expenses]);
        setMerchant('');
        setAmount('');
        setSelectedUserId('');
        setDepartment('');
        setNotes('');
        handleCloseModal();
      }
    } catch (err) {
      console.error('Add expense error:', err);
    } finally {
      setActionLoading(false);
    }
  };

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
      console.error('Update status error:', err);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesCat = activeCategory === 'All' || exp.category === activeCategory;
    const q = (propSearchQuery || searchQuery || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (exp.title || '').toLowerCase().includes(q) ||
      (exp.notes || '').toLowerCase().includes(q) ||
      (exp.submittedByName || '').toLowerCase().includes(q) ||
      (exp.department || '').toLowerCase().includes(q) ||
      (exp._id || '').toLowerCase().includes(q);

    return matchesCat && matchesSearch;
  });

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingCount = expenses.filter(e => (e.status || 'Pending') === 'Pending').length;

  // Export PDF (Full Dataset)
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Header banner
    doc.setFillColor(30, 58, 138); // Deep Navy
    doc.rect(0, 0, 297, 26, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — EXPENSES & OUTLAYS REGISTER', 14, 12);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')} • All amounts in Pakistani Rupees (PKR)`, 14, 20);

    const rows = filteredExpenses.map((exp, idx) => [
      (idx + 1).toString(),
      exp._id ? exp._id.slice(-8).toUpperCase() : `EXP-${idx + 1}`,
      exp.title || 'Expense Outlay',
      exp.category || 'General',
      exp.date ? new Date(exp.date).toLocaleDateString('en-GB') : (exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-GB') : '-'),
      exp.submittedByName || exp.notes || 'Operations',
      exp.department || 'General',
      `Rs. ${(exp.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      exp.status || 'Pending'
    ]);

    autoTable(doc, {
      startY: 32,
      margin: { left: 14, right: 14 },
      head: [['#', 'Expense ID', 'Merchant / Vendor', 'Category', 'Date', 'Claimer / Staff', 'Dept', 'Amount (PKR)', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 26 },
        2: { cellWidth: 48 },
        3: { cellWidth: 32 },
        4: { cellWidth: 26 },
        5: { cellWidth: 42 },
        6: { cellWidth: 28 },
        7: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 21, halign: 'center' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(`Total Filtered Outlay: Rs. ${filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, finalY > 195 ? 195 : finalY);

    doc.save(`Fortline_Expenses_Register_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export Excel CSV (Full Dataset)
  const exportExcelCSV = () => {
    const headers = ['Expense ID', 'Merchant / Vendor', 'Category', 'Date', 'Claimer / Submitter', 'Department', 'Amount (PKR)', 'Tax Deductible', 'Status', 'Notes'];
    const rows = filteredExpenses.map(exp => [
      `"${exp._id || ''}"`,
      `"${(exp.title || '').replace(/"/g, '""')}"`,
      `"${(exp.category || '').replace(/"/g, '""')}"`,
      `"${exp.date ? new Date(exp.date).toLocaleDateString('en-GB') : (exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-GB') : '')}"`,
      `"${(exp.submittedByName || exp.notes || '').replace(/"/g, '""')}"`,
      `"${(exp.department || '').replace(/"/g, '""')}"`,
      (exp.amount || 0),
      exp.category === 'Travel' ? 'Partial' : 'Yes',
      `"${exp.status || 'Pending'}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fortline_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="acc-view-container">
      {/* Page Header */}
      <div className="acc-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="acc-page-header-title">
          <h2>Expenses & Receipts Log (PKR)</h2>
          <p>Track business expenses, vendor disbursements, receipt audits, and tax deductions from MongoDB.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="acc-btn-secondary" onClick={fetchExpenses} title="Refresh Live Data" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="acc-btn-secondary" onClick={exportPDF} title="Export PDF" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export PDF
          </button>
          <button className="acc-btn-secondary" onClick={exportExcelCSV} title="Export Excel (CSV)" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button className="acc-btn-primary" onClick={() => setInternalModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add New Expense
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="acc-kpi-grid">
        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Outlays</span>
            <div className="acc-kpi-icon red"><Receipt size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="acc-kpi-subtitle">{expenses.length} Total outlays recorded</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Software & Cloud</span>
            <div className="acc-kpi-icon blue"><Building2 size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {expenses.filter(e => e.category === 'Software').reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="acc-kpi-subtitle">Operational technology expenditure</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Pending Claims</span>
            <div className="acc-kpi-icon amber"><Clock size={18} /></div>
          </div>
          <div className="acc-kpi-value">{pendingCount} Claim{pendingCount === 1 ? '' : 's'}</div>
          <div className="acc-kpi-subtitle">Requires accountant review</div>
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
              placeholder="Search vendor, staff, dept..."
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
                <th>Claimer / Staff</th>
                <th>Department</th>
                <th>Amount (PKR)</th>
                <th>Tax Deductible</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>Loading real expenses...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>No expenses found in database. Click "+ Add New Expense" to create one.</td></tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp._id}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{exp._id ? exp._id.slice(-8).toUpperCase() : '-'}</td>
                    <td style={{ fontWeight: 600, color: '#1E293B' }}>{exp.title}</td>
                    <td><span className="acc-badge draft"><Tag size={12} /> {exp.category}</span></td>
                    <td>{exp.date ? new Date(exp.date).toLocaleDateString('en-GB') : (exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-GB') : '-')}</td>
                    <td>{exp.submittedByName || exp.notes || 'Finance'}</td>
                    <td>{exp.department || 'General'}</td>
                    <td style={{ fontWeight: 700, color: '#DC2626' }}>Rs. {(exp.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{exp.category === 'Travel' ? 'Partial' : 'Yes'}</td>
                    <td>
                      <span className={`acc-badge ${(exp.status || 'pending').toLowerCase()}`}>
                        {exp.status || 'Pending'}
                      </span>
                      {(exp.status === 'Pending' || !exp.status) && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          <button onClick={() => handleUpdateStatus(exp._id, 'Approved')} style={{ fontSize: '10px', padding: '3px 6px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Approve</button>
                          <button onClick={() => handleUpdateStatus(exp._id, 'Rejected')} style={{ fontSize: '10px', padding: '3px 6px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <h3>Log Business Expense (PKR)</h3>
              <button className="acc-modal-close" onClick={handleCloseModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="acc-modal-body">
                <div className="acc-form-group">
                  <label>Merchant / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Cloud, Dell Pakistan, Office Supplies Ltd."
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Expense Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Software">Software & IT</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Marketing">Marketing & Ads</option>
                      <option value="Travel">Travel & Lodging</option>
                      <option value="Utilities">Utilities & Rent</option>
                      <option value="Salaries">Salaries & Contractor</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>

                  <div className="acc-form-group">
                    <label>Amount (PKR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 25000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Employee / Submitter</label>
                    <select value={selectedUserId} onChange={handleUserChange}>
                      <option value="">-- Select Active Employee (Optional) --</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.fullName} ({u.role} - {u.department || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="acc-form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Sales, Support, Finance, IT"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Expense Date</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>

                  <div className="acc-form-group">
                    <label>Notes / Justification</label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly server invoice or project supplies"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="acc-btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Recording Expense...' : 'Record Expense (PKR)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  Landmark,
  CreditCard,
  Wallet,
  Plus,
  Search,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  ShieldCheck
} from 'lucide-react';
import './AccountantViews.css';

const bankAccounts = [
  { id: 'ACC-01', name: 'Silicon Valley Bank - Operating', accountNumber: '**** 8842', balance: 315400.00, type: 'Checking', status: 'Reconciled' },
  { id: 'ACC-02', name: 'JPMorgan Chase - Reserve Fund', accountNumber: '**** 1109', balance: 185000.00, type: 'Savings / Money Market', status: 'Reconciled' },
  { id: 'ACC-03', name: 'Stripe Merchant Account', accountNumber: '**** STRP', balance: 42800.00, type: 'Merchant Gateway', status: 'Reconciled' },
  { id: 'ACC-04', name: 'Payroll Escrow Account', accountNumber: '**** 9043', balance: 54600.00, type: 'Escrow', status: 'Reconciled' },
];

const chartOfAccounts = [
  { code: '1000', name: 'Cash & Cash Equivalents', category: 'Asset', subCategory: 'Current Asset', balance: 'Rs. 597,800.00', status: 'Active' },
  { code: '1200', name: 'Accounts Receivable (A/R)', category: 'Asset', subCategory: 'Current Asset', balance: 'Rs. 38,400.00', status: 'Active' },
  { code: '1500', name: 'Computer Hardware & Office Tech', category: 'Asset', subCategory: 'Non-Current Asset', balance: 'Rs. 120,500.00', status: 'Active' },
  { code: '2000', name: 'Accounts Payable (A/P)', category: 'Liability', subCategory: 'Current Liability', balance: 'Rs. 18,200.00', status: 'Active' },
  { code: '2200', name: 'Accrued Payroll Liabilities', category: 'Liability', subCategory: 'Current Liability', balance: 'Rs. 54,600.00', status: 'Active' },
  { code: '3000', name: 'Common Share Capital', category: 'Equity', subCategory: 'Equity', balance: 'Rs. 250,000.00', status: 'Active' },
  { code: '3500', name: 'Retained Earnings', category: 'Equity', subCategory: 'Equity', balance: 'Rs. 433,900.00', status: 'Active' },
  { code: '4000', name: 'Software Services Revenue', category: 'Revenue', subCategory: 'Operating Revenue', balance: 'Rs. 557,000.00', status: 'Active' },
  { code: '5000', name: 'Salaries & Benefits Expense', category: 'Expense', subCategory: 'Operating Expense', balance: 'Rs. 185,400.00', status: 'Active' },
  { code: '5200', name: 'Cloud Infrastructure Expense', category: 'Expense', subCategory: 'Operating Expense', balance: 'Rs. 48,500.00', status: 'Active' },
];

export default function AccountantAccountsView({ isModalOpen, onCloseModal }) {
  const [accountsList, setAccountsList] = useState(chartOfAccounts);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Account form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Asset');
  const [balance, setBalance] = useState('');

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!code || !name) return;

    const newAcc = {
      code,
      name,
      category,
      subCategory: `${category} Account`,
      balance: `Rs. ${parseFloat(balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      status: 'Active'
    };

    setAccountsList([...accountsList, newAcc]);
    setCode('');
    setName('');
    setBalance('');
    if (onCloseModal) onCloseModal();
  };

  const filteredAccounts = accountsList.filter(acc => {
    const matchesCat = activeCategory === 'All' || acc.category === activeCategory;
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery);

    return matchesCat && matchesSearch;
  });

  return (
    <div className="acc-view-container">
      {/* Page Header */}
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Chart of Accounts & Banking</h2>
          <p>General ledger accounts, bank balance reconciliation, assets, and liabilities.</p>
        </div>
      </div>

      {/* Bank Account Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {bankAccounts.map(b => (
          <div key={b.id} className="acc-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="acc-kpi-icon emerald"><Landmark size={20} /></div>
              <span className="acc-badge reconciled"><ShieldCheck size={12} /> {b.status}</span>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: 700 }}>{b.name}</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>{b.accountNumber} • {b.type}</p>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Rs. {b.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* Chart of Accounts Ledger Table */}
      <div className="acc-card">
        <div className="acc-card-header">
          <div>
            <h3 className="acc-card-title">General Ledger - Chart of Accounts</h3>
            <p className="acc-card-desc">Complete account hierarchy, category classifications, and current balances</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="acc-filter-bar">
          <div className="acc-tabs">
            {['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(cat => (
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
              placeholder="Search account code or name..."
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
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Category</th>
                <th>Classification</th>
                <th>Current Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc) => (
                <tr key={acc.code}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>#{acc.code}</td>
                  <td style={{ fontWeight: 600, color: '#1E293B' }}>{acc.name}</td>
                  <td>
                    <span className="acc-badge draft" style={{
                      backgroundColor: acc.category === 'Asset' ? '#DBEAFE' : acc.category === 'Revenue' ? '#DCFCE7' : acc.category === 'Expense' ? '#FEE2E2' : '#F3E8FF',
                      color: acc.category === 'Asset' ? '#1E40AF' : acc.category === 'Revenue' ? '#15803D' : acc.category === 'Expense' ? '#991B1B' : '#6B21A8'
                    }}>
                      {acc.category}
                    </span>
                  </td>
                  <td>{acc.subCategory}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{acc.balance}</td>
                  <td>
                    <span className="acc-badge active">
                      {acc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <h3>Create Ledger Account</h3>
              <button className="acc-modal-close" onClick={onCloseModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddAccount}>
              <div className="acc-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="acc-form-group">
                    <label>Account Code</label>
                    <input
                      type="text"
                      required
                      placeholder="1600"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>

                  <div className="acc-form-group">
                    <label>Account Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prepaid Subscriptions"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="acc-form-group">
                  <label>Account Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div className="acc-form-group">
                  <label>Starting Balance (Rs.)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                  />
                </div>
              </div>

              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={onCloseModal}>Cancel</button>
                <button type="submit" className="acc-btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Landmark, Percent, DollarSign } from 'lucide-react';
import './AccountantViews.css';

export default function AccountantSettingsView() {
  const [taxRate, setTaxRate] = useState('10');
  const [currency, setCurrency] = useState('PKR (Rs.)');
  const [fiscalStart, setFiscalStart] = useState('January 1');
  const [autoReminder, setAutoReminder] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Financial settings updated successfully!');
  };

  return (
    <div className="acc-view-container">
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Accounting System Settings</h2>
          <p>Configure tax rates, default currencies, fiscal year timing, and invoice reminders.</p>
        </div>
      </div>

      <div className="acc-card" style={{ padding: '24px', maxWidth: '680px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="acc-form-group">
            <label>Default Sales Tax / VAT Rate (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>

          <div className="acc-form-group">
            <label>Base Accounting Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="PKR (Rs.)">PKR - Pakistani Rupee (Rs.)</option>
              <option value="USD ($)">USD - US Dollar ($)</option>
              <option value="EUR (€)">EUR - Euro (€)</option>
              <option value="GBP (£)">GBP - British Pound (£)</option>
              <option value="CAD ($)">CAD - Canadian Dollar ($)</option>
            </select>
          </div>

          <div className="acc-form-group">
            <label>Fiscal Year Start Date</label>
            <select value={fiscalStart} onChange={(e) => setFiscalStart(e.target.value)}>
              <option value="January 1">January 1st (Calendar Year)</option>
              <option value="April 1">April 1st (UK Fiscal)</option>
              <option value="October 1">October 1st (US Gov Fiscal)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
            <input
              type="checkbox"
              id="autoReminder"
              checked={autoReminder}
              onChange={(e) => setAutoReminder(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="autoReminder" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              Automatically send payment reminder emails for overdue invoices
            </label>
          </div>

          <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
            <button type="submit" className="acc-btn-primary">
              <Save size={16} /> Save Accounting Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

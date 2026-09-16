import React from 'react';
import { User, Shield, CreditCard, Bell, Key } from 'lucide-react';
import './SettingsView.css';

export default function SettingsView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>CRM Preferences & Settings</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Configure company profile, security policies, and team seats</p>
      </div>

      <div className="admin-settings-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        <div className="widget-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button className="menu-item active" style={{ borderRadius: '8px' }}>
              <div className="menu-item-left"><User size={16} /> Company Profile</div>
            </button>
            <button className="menu-item" style={{ borderRadius: '8px' }}>
              <div className="menu-item-left"><CreditCard size={16} /> Subscription & Billing</div>
            </button>
            <button className="menu-item" style={{ borderRadius: '8px' }}>
              <div className="menu-item-left"><Shield size={16} /> Security & SSO</div>
            </button>
            <button className="menu-item" style={{ borderRadius: '8px' }}>
              <div className="menu-item-left"><Bell size={16} /> Notifications</div>
            </button>
            <button className="menu-item" style={{ borderRadius: '8px' }}>
              <div className="menu-item-left"><Key size={16} /> API Keys</div>
            </button>
          </div>
        </div>

        <div className="widget-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Organization Details</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
            <div className="form-group">
              <label>Organization Name</label>
              <input className="form-input" defaultValue="Fortline CRM" />
            </div>

            <div className="form-group">
              <label>Support Email</label>
              <input className="form-input" defaultValue="support@fortlinecrm.com" />
            </div>

            <div className="form-group">
              <label>Default Currency</label>
              <select className="form-select" defaultValue="PKR" disabled>
                <option value="PKR">PKR (Rs.) - Pakistani Rupee</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fiscal Year Start</label>
              <select className="form-select" defaultValue="January">
                <option value="January">January</option>
                <option value="April">April</option>
                <option value="October">October</option>
              </select>
            </div>

            <div style={{ paddingTop: '12px' }}>
              <button className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

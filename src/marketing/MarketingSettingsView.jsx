import React, { useState } from 'react';
import { Settings, Save, Globe, Key, Tag, Bell } from 'lucide-react';
import './MarketingViews.css';

export default function MarketingSettingsView() {
  const [googleTagId, setGoogleTagId] = useState('G-8942019482');
  const [linkedInPixelId, setLinkedInPixelId] = useState('94820194');
  const [metaPixelId, setMetaPixelId] = useState('1094820194');
  const [autoMqlRouting, setAutoMqlRouting] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Marketing settings & tracking pixels saved successfully!');
  };

  return (
    <div className="mkt-view-container">
      <div className="mkt-page-header">
        <div className="mkt-page-header-title">
          <h2>Marketing Configuration & Integrations</h2>
          <p>Manage tracking tags, conversion pixels, social API keys, and lead routing automation.</p>
        </div>
      </div>

      <div className="mkt-card" style={{ padding: '24px', maxWidth: '680px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="mkt-form-group">
            <label>Google Analytics & Tag Manager Measurement ID</label>
            <input
              type="text"
              value={googleTagId}
              onChange={(e) => setGoogleTagId(e.target.value)}
            />
          </div>

          <div className="mkt-form-group">
            <label>LinkedIn Insight Tag Partner ID</label>
            <input
              type="text"
              value={linkedInPixelId}
              onChange={(e) => setLinkedInPixelId(e.target.value)}
            />
          </div>

          <div className="mkt-form-group">
            <label>Meta Pixel ID (Facebook / Instagram)</label>
            <input
              type="text"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
            <input
              type="checkbox"
              id="autoMqlRouting"
              checked={autoMqlRouting}
              onChange={(e) => setAutoMqlRouting(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="autoMqlRouting" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              Automatically transfer high-scoring MQLs (&gt;85 score) to Sales Manager CRM pipeline
            </label>
          </div>

          <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
            <button type="submit" className="mkt-btn-primary">
              <Save size={16} /> Save Marketing Integration Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

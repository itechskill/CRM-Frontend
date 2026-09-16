import React from 'react';
import { FileText, Download } from 'lucide-react';
import './ReportsAnalyticsView.css';

export default function ReportsAnalyticsView() {
  const reports = [
    { title: 'Q3 Executive Performance & Revenue Summary', date: 'Aug 20, 2026', category: 'Financial & Growth', size: '2.4 MB' },
    { title: 'Global Market Share & Expansion Strategy Report', date: 'Aug 15, 2026', category: 'Strategic Growth', size: '4.1 MB' },
    { title: 'Enterprise Product Delivery & Velocity Review', date: 'Aug 10, 2026', category: 'Operations & Tech', size: '1.8 MB' },
    { title: 'Board of Directors Quarterly Deck Q3 2026', date: 'Aug 01, 2026', category: 'Governance', size: '8.5 MB' },
  ];

  return (
    <div className="ceo-view-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Executive Reports & Strategic Reports</span>
        </div>
        <div className="ceo-reports-list">
          {reports.map((r, idx) => (
            <div key={idx} className="ceo-report-row">
              <div className="ceo-report-left">
                <span className="ceo-report-icon">
                  <FileText size={20} />
                </span>
                <div>
                  <div className="ceo-report-title">{r.title}</div>
                  <div className="ceo-report-meta">{r.category} • {r.date} • {r.size}</div>
                </div>
              </div>
              <button className="ceo-download-btn">
                <Download size={14} /> Download PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
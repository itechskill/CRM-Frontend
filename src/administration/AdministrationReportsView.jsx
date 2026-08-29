import React from 'react';
import { FileText, Download } from 'lucide-react';
import './AdministrationReportsView.css';

export default function AdministrationReportsView() {
  const reports = [
    { title: 'Monthly Employee Attendance & Leave Compliance Report', date: 'Aug 18, 2026', category: 'Compliance', size: '1.6 MB' },
    { title: 'Company Hardware & Asset Allocation Audit', date: 'Aug 12, 2026', category: 'Inventory', size: '3.2 MB' },
    { title: 'Departmental Headcount & Office Resource Utilization', date: 'Aug 05, 2026', category: 'Operations', size: '2.1 MB' },
    { title: 'Annual Workplace Health & Safety Compliance Report', date: 'Jul 28, 2026', category: 'Safety & HR', size: '4.8 MB' },
  ];

  return (
    <div className="admin-emp-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Administrative & Resource Reports</span>
        </div>
        <div className="admin-reports-list">
          {reports.map((r, idx) => (
            <div key={idx} className="admin-report-row">
              <div className="admin-report-left">
                <span className="admin-report-icon">
                  <FileText size={20} />
                </span>
                <div>
                  <div className="admin-report-title">{r.title}</div>
                  <div className="admin-report-meta">{r.category} • {r.date} • {r.size}</div>
                </div>
              </div>
              <button className="admin-export-btn">
                <Download size={14} /> Export Report
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
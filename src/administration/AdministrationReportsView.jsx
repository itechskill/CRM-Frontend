import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import './AdministrationReportsView.css';

export default function AdministrationReportsView() {
  const [reportData, setReportData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const fetchAdminReportData = async () => {
    setLoading(true);
    try {
      const [hrRes, assetRes] = await Promise.all([
        apiRequest('/api/hr/report-data'),
        apiRequest('/api/administration/company-resources')
      ]);

      if (hrRes.response.ok && hrRes.data.success) {
        setReportData(hrRes.data.data);
      }
      if (assetRes.response.ok && assetRes.data.success && Array.isArray(assetRes.data.data)) {
        setAssets(assetRes.data.data);
      }
    } catch (err) {
      console.error('Fetch admin report data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReportData();
  }, []);

  const generatePDF = (title, columns, rows, filename) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235); // #2563EB
    doc.text('NexusCRM Administration Report', 14, 18);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, 26);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()} · Real-Time DB Export`, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: [columns],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9 }
    });

    doc.save(filename);
  };

  const handleExport = (reportTitle) => {
    setExporting(reportTitle);
    try {
      const employees = reportData?.employees || [];
      const attendance = reportData?.todayAttendance || [];
      const leaves = reportData?.allLeaves || [];
      const deptStats = reportData?.departmentStats || [];

      if (reportTitle.includes('Attendance')) {
        const cols = ['Employee Name', 'Department', 'Status', 'Check In', 'Check Out'];
        const rows = attendance.length ? attendance.map(a => [
          a.userName || a.user?.fullName || 'N/A',
          a.user?.department || '—',
          a.status || 'Present',
          a.checkIn || '—',
          a.checkOut || '—'
        ]) : employees.map(e => [e.fullName, e.department || '—', 'Not Recorded', '—', '—']);
        generatePDF(reportTitle, cols, rows, `Attendance_Leave_Compliance_${new Date().toISOString().slice(0, 10)}.pdf`);
      } else if (reportTitle.includes('Hardware') || reportTitle.includes('Asset')) {
        const cols = ['Serial #', 'Asset Name', 'Category', 'Department', 'Assigned To', 'Status'];
        const rows = assets.length ? assets.map(a => [
          a.serialNumber || '—',
          a.title,
          a.type,
          a.department || 'All',
          a.assignedTo || 'Unassigned',
          a.status
        ]) : [['—', 'No Assets Registered', '—', '—', '—', '—']];
        generatePDF(reportTitle, cols, rows, `Asset_Allocation_Audit_${new Date().toISOString().slice(0, 10)}.pdf`);
      } else if (reportTitle.includes('Headcount') || reportTitle.includes('Utilization')) {
        const cols = ['Department', 'Active Staff Count', 'Performance Index', 'Operational Status'];
        const rows = deptStats.map(d => [
          d.dept,
          `${d.headcount} staff`,
          `${d.avgPerf}%`,
          'Operational'
        ]);
        generatePDF(reportTitle, cols, rows, `Departmental_Headcount_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        const cols = ['Employee ID', 'Full Name', 'Department', 'Role', 'Status', 'Leave Requests'];
        const rows = employees.map(e => {
          const empLeaves = leaves.filter(l => String(l.user?._id || l.user) === String(e._id)).length;
          return [
            e.employeeId || e._id?.slice(-6) || '—',
            e.fullName,
            e.department || 'General',
            e.role,
            e.status,
            `${empLeaves} request(s)`
          ];
        });
        generatePDF(reportTitle, cols, rows, `Workplace_Compliance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting('');
    }
  };

  const reports = [
    { title: 'Monthly Employee Attendance & Leave Compliance Report', date: 'Real-Time DB', category: 'Compliance', size: 'Live PDF' },
    { title: 'Company Hardware & Asset Allocation Audit', date: 'Real-Time DB', category: 'Inventory', size: 'Live PDF' },
    { title: 'Departmental Headcount & Office Resource Utilization', date: 'Real-Time DB', category: 'Operations', size: 'Live PDF' },
    { title: 'Annual Workplace Health & Safety Compliance Report', date: 'Real-Time DB', category: 'Safety & HR', size: 'Live PDF' },
  ];

  return (
    <div className="admin-emp-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>Administrative & Resource Reports</span>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 400, marginTop: '2px' }}>Real-time database report exports</div>
          </div>
          <button
            onClick={fetchAdminReportData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#334155' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
          </button>
        </div>

        <div className="admin-reports-list">
          {reports.map((r, idx) => {
            const isExporting = exporting === r.title;
            return (
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
                <button
                  className="admin-export-btn"
                  onClick={() => handleExport(r.title)}
                  disabled={loading || !!exporting}
                  style={{ cursor: 'pointer' }}
                >
                  <Download size={14} /> {isExporting ? 'Generating PDF...' : 'Export Report'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
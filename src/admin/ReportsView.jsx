import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Download, 
  RefreshCw, 
  FileText, 
  Users, 
  Receipt, 
  Calculator, 
  Briefcase 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import './ReportsView.css';

export default function ReportsView() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/executive-summary');
      if (response.ok && data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Fetch admin reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const downloadSystemReportPDF = (reportType) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text('Fortline CRM - System Administrative Report', 14, 18);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Report Type: ${reportType}`, 14, 26);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    const rows = [
      ['Total Registered Users', `${summary?.totalUsers || 0}`],
      ['Active System Users', `${summary?.activeEmployees || 0}`],
      ['Pending Registration Requests', `${summary?.pendingUsers || 0}`],
      ['Total Invoiced Revenue', `PKR ${(summary?.totalInvoiced || 0).toLocaleString()}`],
      ['Total Collected Revenue (Paid)', `PKR ${(summary?.collectedRevenue || 0).toLocaleString()}`],
      ['Outstanding Receivables', `PKR ${(summary?.actualReceivables || 0).toLocaleString()}`],
      ['Total Sales Orders Count', `${summary?.salesOrders || 0}`],
      ['Orders Finance Approved', `${summary?.ordersFinanceApproved || 0}`],
      ['Total Delivery Notes', `${summary?.totalDeliveryNotes || 0}`],
      ['Confirmed Delivered Notes', `${summary?.confirmedDeliveryNotes || 0}`]
    ];

    autoTable(doc, {
      startY: 38,
      head: [['System Parameter', 'Database Value']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 }
    });

    doc.save(`Fortline_CRM_${reportType.replace(/\\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const data = summary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Administrative System Reports &amp; Intelligence
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '4px 0 0 0' }}>
            Database-backed Organizational Metrics (PKR Currency)
          </p>
        </div>

        <button
          onClick={fetchReportsData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.825rem',
            fontWeight: 600,
            color: '#334155'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="reports-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Active System Users</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>
            {data.activeEmployees || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>Total: {data.totalUsers || 0} accounts</div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Invoiced</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>
            PKR {(data.totalInvoiced || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}>{data.finalInvoices || 0} Finalized Invoices</div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Collected Revenue</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '8px' }}>
            PKR {(data.collectedRevenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>{data.paidInvoices || 0} Paid Invoices</div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Outstanding Receivables</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: '8px' }}>
            PKR {(data.actualReceivables || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>Overdue: PKR {(data.actualOverdueAmount || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Available System Reports Export Cards */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            Exportable Executive &amp; Administrative PDF Reports
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>Comprehensive System Audit</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Users, departments, and workflow status</div>
            </div>
            <button
              onClick={() => downloadSystemReportPDF('Comprehensive System Audit')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#2563EB', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              <Download size={13} /> Export PDF
            </button>
          </div>

          <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>Financial &amp; Invoicing Report</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Revenue, receivables, and overdue ledger</div>
            </div>
            <button
              onClick={() => downloadSystemReportPDF('Financial & Invoicing Report')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#10B981', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              <Download size={13} /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
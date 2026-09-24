import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import '../employee/sales/SalesViews.css';

export default function FinanceReportsView() {
  const [stats, setStats] = useState(null);
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        apiRequest('/api/sales-employee/finance/stats'),
        apiRequest('/api/sales-employee/finance/receivables')
      ]);

      if (sRes.response.ok && sRes.data.success) {
        setStats(sRes.data.data);
      }
      if (rRes.response.ok && rRes.data.success) {
        setReceivables(rRes.data.data || []);
      }
    } catch (e) {
      console.error('[Fetch Finance Reports Error]:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportPDF = () => {
    if (receivables.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM - COMPREHENSIVE FINANCIAL REPORT', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} | Treasury & Receivables Control`, 14, 25);

    const rows = receivables.map(r => [
      r.invoiceNumber,
      r.clientName,
      r.salesOrderNumber || '—',
      `PKR ${(Number(r.amount) || 0).toLocaleString()}`,
      `PKR ${(Number(r.paidAmount) || 0).toLocaleString()}`,
      `PKR ${(Number(r.remainingReceivable) || 0).toLocaleString()}`,
      r.status
    ]);

    autoTable(doc, {
      startY: 34,
      head: [['Invoice #', 'Customer / Client', 'Sales Order #', 'Invoice Total', 'Paid Amount', 'Outstanding Receivable', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });

    doc.save(`Financial_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportExcel = () => {
    if (receivables.length === 0) return;
    const headers = ['Invoice Number', 'Customer', 'Sales Order Number', 'Invoice Total (PKR)', 'Paid Amount (PKR)', 'Remaining Receivable (PKR)', 'Status'];
    const rows = receivables.map(r => [
      r.invoiceNumber,
      (r.clientName || '').replace(/,/g, ' '),
      r.salesOrderNumber || '',
      r.amount || 0,
      r.paidAmount || 0,
      r.remainingReceivable || 0,
      r.status
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sv-container">
      {/* Top Banner */}
      <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={24} color="#059669" /> Financial Audit & Collection Reports
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.88rem' }}>
            Download official PDF & Excel CSV financial summary reports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="sv-btn-primary" style={{ background: '#059669' }} onClick={handleExportPDF}>
            <Download size={16} /> Export PDF Report
          </button>
          <button className="sv-btn-primary" style={{ background: '#2563EB' }} onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Export Excel (CSV)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Gross Revenue (Invoiced)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>
            PKR {loading ? '...' : Number(stats?.totalInvoicedAmount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px' }}>From approved final invoices</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Cash Collections</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
            PKR {loading ? '...' : Number(stats?.totalPaid || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>Realized cash inflows</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Receivables Pool</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: '8px' }}>
            PKR {loading ? '...' : Number(stats?.outstandingReceivables || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: '4px' }}>Includes PKR {Number(stats?.overdueAmount || 0).toLocaleString()} overdue</div>
        </div>
      </div>
    </div>
  );
}

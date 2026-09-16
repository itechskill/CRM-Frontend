import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Truck, 
  Receipt, 
  Calculator, 
  Download, 
  RefreshCw, 
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import './SalesFinanceView.css';

export default function SalesFinanceView() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSalesFinanceData = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/executive-summary');
      if (response.ok && data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Fetch CEO sales/finance data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesFinanceData();
  }, []);

  const downloadSalesFinancePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text('Fortline CRM - Executive Sales & Finance Report', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 25);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Organization-Wide Workflow & Financial Overview:', 14, 34);

    const summaryRows = [
      ['Total Invoiced Revenue (Finalized)', `PKR ${(summary?.totalInvoiced || 0).toLocaleString()}`],
      ['Total Collected Revenue (Paid)', `PKR ${(summary?.collectedRevenue || 0).toLocaleString()}`],
      ['Outstanding Receivables', `PKR ${(summary?.actualReceivables || 0).toLocaleString()}`],
      ['Overdue Receivables', `PKR ${(summary?.actualOverdueAmount || 0).toLocaleString()}`],
      ['Total Sales Orders Count', `${summary?.salesOrders || 0}`],
      ['Sales Orders Finance Approved', `${summary?.ordersFinanceApproved || 0}`],
      ['Sales Orders Pending Finance Approval', `${summary?.ordersPendingFinance || 0}`],
      ['Delivery Notes Completed', `${summary?.confirmedDeliveryNotes || 0} / ${summary?.totalDeliveryNotes || 0}`],
      ['Draft Invoices Value (Accounts)', `PKR ${(summary?.draftInvoicesAmount || 0).toLocaleString()}`],
      ['Approved Operational Expenses', `PKR ${(summary?.totalExpenses || 0).toLocaleString()}`],
      ['Net Profit / Balance', `PKR ${(summary?.netProfit || 0).toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 38,
      head: [['Metric / Stage Indicator', 'Value']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 }
    });

    if (summary?.recentInvoices && summary.recentInvoices.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Recent Finalized Invoices:', 14, finalY);

      const invRows = summary.recentInvoices.map(i => [
        i.invoiceNumber || 'INV-000',
        i.clientName || 'Client',
        i.invoiceType || 'Standard',
        `PKR ${(i.amount || 0).toLocaleString()}`,
        `PKR ${(i.paidAmount || 0).toLocaleString()}`,
        i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '—',
        i.status
      ]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [['Invoice #', 'Client', 'Type', 'Amount', 'Paid', 'Due Date', 'Status']],
        body: invRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`Sales_Finance_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const data = summary || {};

  return (
    <div className="ceo-view-container">
      {/* Top 3 High-Level Finance Stat Cards */}
      <div className="ceo-grid-3">
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Total Invoiced Revenue</span>
          <span className="ceo-stat-num">PKR {(data.totalInvoiced || 0).toLocaleString()}</span>
          <span className="ceo-stat-trend positive">
            {data.finalInvoices || 0} Finalized Invoices ({data.paidInvoices || 0} Paid)
          </span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Collected Revenue (Paid)</span>
          <span className="ceo-stat-num">PKR {(data.collectedRevenue || 0).toLocaleString()}</span>
          <span className="ceo-stat-trend positive">Real receipts recorded</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Outstanding Receivables</span>
          <span className="ceo-stat-num">PKR {(data.actualReceivables || 0).toLocaleString()}</span>
          <span className="ceo-stat-trend neutral">
            Overdue: PKR {(data.actualOverdueAmount || 0).toLocaleString()} ({data.overdueInvoices || 0} Invoices)
          </span>
        </div>
      </div>

      {/* Collective 4-Department Workflow Breakdown */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>Collective Sales &rarr; Support &rarr; Accounts &rarr; Finance Progression</span>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
              Every value is calculated collectively from active database records
            </div>
          </div>
          <button
            onClick={downloadSalesFinancePDF}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563EB', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
          >
            <Download size={14} /> Export Report (PDF)
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '10px' }}>
          {/* Sales Stage */}
          <div className="ceo-workflow-card">
            <div className="ceo-wf-header">
              <div className="ceo-wf-icon sales">
                <TrendingUp size={16} />
              </div>
              <span className="ceo-wf-stage">Sales Stage</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Leads:</span>
              <span className="ceo-wf-val">{data.totalLeads || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Deals:</span>
              <span className="ceo-wf-val">{data.totalDeals || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Quotations:</span>
              <span className="ceo-wf-val">{data.totalQuotations || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Converted Quotations:</span>
              <span className="ceo-wf-val">{data.convertedQuotations || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Sales Orders:</span>
              <span className="ceo-wf-val font-bold">{data.salesOrders || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Finance Pending Orders:</span>
              <span className="ceo-wf-val">{data.ordersPendingFinance || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Finance Approved Orders:</span>
              <span className="ceo-wf-val text-success">{data.ordersFinanceApproved || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Finance Rejected Orders:</span>
              <span className="ceo-wf-val">{data.ordersFinanceRejected || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Orders Sent to Support:</span>
              <span className="ceo-wf-val">{data.ordersSentToSupport || 0}</span>
            </div>
          </div>

          {/* Support Stage */}
          <div className="ceo-workflow-card">
            <div className="ceo-wf-header">
              <div className="ceo-wf-icon support">
                <Truck size={16} />
              </div>
              <span className="ceo-wf-stage">Support Stage</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Sales Orders Received:</span>
              <span className="ceo-wf-val">{data.salesOrdersReceived || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Delivery Notes Created:</span>
              <span className="ceo-wf-val font-bold">{data.totalDeliveryNotes || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Pending Delivery Notes:</span>
              <span className="ceo-wf-val">{data.pendingDeliveryNotes || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Completed Delivery Notes:</span>
              <span className="ceo-wf-val font-bold text-success">{data.confirmedDeliveryNotes || 0}</span>
            </div>
          </div>

          {/* Accounts Stage */}
          <div className="ceo-workflow-card">
            <div className="ceo-wf-header">
              <div className="ceo-wf-icon accounts">
                <Receipt size={16} />
              </div>
              <span className="ceo-wf-stage">Accounts Stage</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">DNs Received:</span>
              <span className="ceo-wf-val">{data.deliveryNotesReceived || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Draft Invoices Created:</span>
              <span className="ceo-wf-val font-bold">{data.draftInvoices || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Draft Invoices Total Value:</span>
              <span className="ceo-wf-val">PKR {(data.draftInvoicesAmount || 0).toLocaleString()}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Pending Finalization:</span>
              <span className="ceo-wf-val">{data.pendingFinanceFinalization || 0}</span>
            </div>
          </div>

          {/* Finance Stage */}
          <div className="ceo-workflow-card">
            <div className="ceo-wf-header">
              <div className="ceo-wf-icon finance">
                <Calculator size={16} />
              </div>
              <span className="ceo-wf-stage">Finance Stage</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Final Invoices Created:</span>
              <span className="ceo-wf-val font-bold">{data.finalInvoices || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">GST Invoices:</span>
              <span className="ceo-wf-val">{data.gstInvoicesCount || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Cash Invoices:</span>
              <span className="ceo-wf-val">{data.cashInvoicesCount || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Paid Invoices:</span>
              <span className="ceo-wf-val text-success">{data.paidInvoices || 0}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Outstanding Receivables:</span>
              <span className="ceo-wf-val">PKR {(data.actualReceivables || 0).toLocaleString()}</span>
            </div>
            <div className="ceo-wf-metric-row">
              <span className="ceo-wf-label">Overdue Receivables:</span>
              <span className="ceo-wf-val" style={{ color: '#DC2626' }}>PKR {(data.actualOverdueAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real Invoices Ledger */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>Executive Financial Invoices &amp; Receivables Ledger</span>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
              Finalized Invoices from Database (PKR Currency)
            </div>
          </div>
          <button
            onClick={fetchSalesFinanceData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}
          >
            <RefreshCw size={12} className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading sales &amp; financial ledger...</div>
        ) : (
          <div className="ceo-table-wrapper" style={{ marginTop: '10px' }}>
            <table className="ceo-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Client Organization</th>
                  <th>Type</th>
                  <th>Invoice Amount</th>
                  <th>Outstanding Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentInvoices || []).map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{inv.invoiceNumber}</td>
                    <td className="ceo-table-name">{inv.clientName}</td>
                    <td>{inv.invoiceType || 'Standard'}</td>
                    <td style={{ fontWeight: 700 }}>PKR {(inv.amount || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: inv.outstandingAmount > 0 ? '#DC2626' : '#16A34A' }}>
                      PKR {(inv.outstandingAmount || 0).toLocaleString()}
                    </td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`ceo-status-tag ${inv.status === 'Paid' ? 'active' : (inv.status === 'Overdue' ? 'danger' : 'warning')}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data.recentInvoices || data.recentInvoices.length === 0) && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                      No financial invoice records found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
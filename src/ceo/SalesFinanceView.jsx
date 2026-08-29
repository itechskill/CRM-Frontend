import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, PieChart, Download, RefreshCw, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import './SalesFinanceView.css';

export default function SalesFinanceView() {
  const [finSummary, setFinSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/finance/summary');
      if (response.ok && data.success) {
        setFinSummary(data.data);
      }
    } catch (err) {
      console.error('Fetch CEO sales/finance data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const downloadSalesFinancePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(124, 58, 237);
    doc.text('NexusCRM - CEO Executive Sales & Finance Report', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Date: ${new Date().toLocaleString()}`, 14, 25);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Financial Overview Metrics:', 14, 34);

    const summaryRows = [
      ['Total Paid Revenue Collected', `$${(finSummary?.totalRevenue || 0).toLocaleString()}`],
      ['Total Pending Invoices Value', `$${(finSummary?.totalPending || 0).toLocaleString()}`],
      ['Total Overdue Invoices Value', `$${(finSummary?.totalOverdue || 0).toLocaleString()}`],
      ['Approved Operational Expenses', `$${(finSummary?.totalExpenses || 0).toLocaleString()}`],
      ['Monthly Net Payroll Disbursement', `$${(finSummary?.totalPayroll || 0).toLocaleString()}`],
      ['Average Invoice Deal Size', `$${(finSummary?.avgDealSize || 0).toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 38,
      head: [['Financial Metric', 'Amount ($)']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 }
    });

    if (finSummary?.recentInvoices && finSummary.recentInvoices.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Recent Invoice Transactions:', 14, finalY);

      const invRows = finSummary.recentInvoices.map(i => [
        i.invoiceNumber || 'INV-000',
        i.clientName || 'Client',
        `$${(i.amount || 0).toLocaleString()}`,
        i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '—',
        i.status
      ]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [['Invoice #', 'Client', 'Amount', 'Due Date', 'Status']],
        body: invRows,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`Sales_Finance_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const data = finSummary || {};

  return (
    <div className="ceo-view-container">
      <div className="ceo-grid-3">
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Total Invoiced Revenue (Paid)</span>
          <span className="ceo-stat-num">${(data.totalRevenue || 0).toLocaleString()}</span>
          <span className="ceo-stat-trend positive">{data.paidCount || 0} Paid Invoices</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Pending & Overdue Collections</span>
          <span className="ceo-stat-num">${((data.totalPending || 0) + (data.totalOverdue || 0)).toLocaleString()}</span>
          <span className="ceo-stat-trend neutral">Receivables outstanding</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Monthly Payroll & Expenses</span>
          <span className="ceo-stat-num">${((data.totalExpenses || 0) + (data.totalPayroll || 0)).toLocaleString()}</span>
          <span className="ceo-stat-trend neutral">Operating Cash Outflow</span>
        </div>
      </div>

      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>Executive Financial Performance & Sales Ledger</span>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>Real MongoDB Payments & Invoices Data</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchFinanceData}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#475569' }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              onClick={downloadSalesFinancePDF}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10B981', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Download size={14} /> Download PDF Report
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading sales & financial ledger...</div>
        ) : (
          <div className="ceo-table-wrapper" style={{ marginTop: '16px' }}>
            <table className="ceo-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Client Organization</th>
                  <th>Amount ($)</th>
                  <th>Due Date</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentInvoices || []).map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{inv.invoiceNumber}</td>
                    <td className="ceo-table-name">{inv.clientName}</td>
                    <td style={{ fontWeight: 700 }}>${(inv.amount || 0).toLocaleString()}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`ceo-status-tag ${inv.status === 'Paid' ? 'active' : inv.status === 'Overdue' ? 'danger' : 'warning'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data.recentInvoices || data.recentInvoices.length === 0) && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
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
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import {
  DollarSign,
  Search,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Clock
} from 'lucide-react';
import '../employee/sales/SalesViews.css';

export default function FinanceReceivablesView({ onNavigatePayment, searchQuery }) {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/finance/receivables');
      if (response.ok && data.success) {
        const cutoff = new Date('2026-09-15T00:00:00.000Z');
        setReceivables((data.data || []).filter(d => new Date(d.createdAt) > cutoff));
      }
    } catch (e) {
      console.error('[Fetch Receivables Error]:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const handleExportPDF = () => {
    if (receivables.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM - ACCOUNTS RECEIVABLE MASTER REPORT', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} | Strictly calculated from Final Invoices`, 14, 24);

    const rows = receivables.map(r => [
      r.invoiceNumber,
      r.clientName,
      r.salesOrderNumber || '—',
      `Rs. ${(Number(r.amount) || 0).toLocaleString()}`,
      `Rs. ${(Number(r.paidAmount) || 0).toLocaleString()}`,
      `Rs. ${(Number(r.remainingReceivable) || 0).toLocaleString()}`,
      r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-GB') : '—',
      r.status
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Invoice #', 'Customer / Client', 'Sales Order #', 'Invoice Amount', 'Paid Amount', 'Remaining Receivable', 'Due Date', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });

    doc.save(`Accounts_Receivable_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const filteredReceivables = receivables.filter(r => {
    const effectiveSearch = (searchQuery || searchTerm || '').trim().toLowerCase();
    if (!effectiveSearch) return true;
    const term = effectiveSearch;
    return (
      (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(term)) ||
      (r.clientName && r.clientName.toLowerCase().includes(term)) ||
      (r.salePerson && r.salePerson.toLowerCase().includes(term)) ||
      (r.salesPerson?.fullName && r.salesPerson.fullName.toLowerCase().includes(term)) ||
      (r.salesOrderNumber && r.salesOrderNumber.toLowerCase().includes(term)) ||
      (r.status && r.status.toLowerCase().includes(term))
    );
  });

  const totalInvoiced = filteredReceivables.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPaid = filteredReceivables.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
  const totalOutstanding = filteredReceivables.reduce((sum, r) => sum + (Number(r.remainingReceivable) || 0), 0);
  const totalOverdue = filteredReceivables.filter(r => r.isOverdue).reduce((sum, r) => sum + (Number(r.remainingReceivable) || 0), 0);

  return (
    <div className="sv-container">
      {/* Top Banner Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Invoices Value</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>Rs. {totalInvoiced.toLocaleString()}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Total Valid Payments</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>Rs. {totalPaid.toLocaleString()}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Remaining Receivables</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>Rs. {totalOutstanding.toLocaleString()}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Overdue Receivables</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>Rs. {totalOverdue.toLocaleString()}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="sv-top-bar">
        <div className="sv-search-box">
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search receivables by customer, invoice#, order#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="sv-btn-primary" style={{ background: '#059669' }} onClick={handleExportPDF}>
          <Download size={16} /> Export PDF Report
        </button>
      </div>

      {/* Receivables Table */}
      {loading ? (
        <div className="sv-loading">Calculating accounts receivables from Final Invoices...</div>
      ) : filteredReceivables.length === 0 ? (
        <div className="sv-empty">
          <DollarSign size={40} color="#94A3B8" />
          <h3>No Active Receivables</h3>
          <p>Receivables are calculated strictly from Final Invoices once submitted to Finance.</p>
        </div>
      ) : (
        <div className="sv-table-card">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer / Client</th>
                <th>Order #</th>
                <th>Invoice Amount</th>
                <th>Total Paid</th>
                <th>Remaining Receivable</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceivables.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{r.invoiceNumber}</td>
                  <td style={{ fontWeight: 600 }}>{r.clientName}</td>
                  <td>{r.salesOrderNumber || '—'}</td>
                  <td style={{ fontWeight: 700 }}>Rs. {r.amount.toLocaleString()}</td>
                  <td style={{ color: '#059669', fontWeight: 700 }}>Rs. {r.paidAmount.toLocaleString()}</td>
                  <td style={{ fontWeight: 800, color: r.remainingReceivable === 0 ? '#059669' : (r.isOverdue ? '#DC2626' : '#D97706') }}>
                    Rs. {r.remainingReceivable.toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: r.isOverdue ? '#DC2626' : '#64748B', fontWeight: r.isOverdue ? 700 : 400 }}>
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td>
                    <span className="sv-badge" style={{ background: r.remainingReceivable === 0 ? '#ECFDF5' : (r.isOverdue ? '#FEF2F2' : '#FFFBEB'), color: r.remainingReceivable === 0 ? '#047857' : (r.isOverdue ? '#DC2626' : '#D97706'), border: `1px solid ${r.remainingReceivable === 0 ? '#A7F3D0' : (r.isOverdue ? '#FCA5A5' : '#FDE68A')}` }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

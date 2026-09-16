import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  TrendingDown, 
  ArrowDownRight,
  RefreshCw,
  Receipt,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './FinanceView.css';

export default function FinanceView() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/executive-summary');
      if (response.ok && data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Fetch admin finance error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const data = summary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
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
            Financial Overview &amp; Revenue Ledger
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '4px 0 0 0' }}>
            Real-time Database Invoices, Collections &amp; Receivables (PKR Currency)
          </p>
        </div>

        <button
          onClick={fetchFinanceData}
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

      {/* Top 4 KPI Cards */}
      <div className="finance-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Invoiced */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Invoiced Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A' }}>
              PKR {(data.totalInvoiced || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              {data.finalInvoices || 0} Finalized Invoices
            </div>
          </div>
        </div>

        {/* Collected Revenue */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Collected Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#10B981' }}>
              PKR {(data.collectedRevenue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600, marginTop: '2px' }}>
              {data.paidInvoices || 0} Paid Invoices Recorded
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Receivables</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#D97706' }}>
              PKR {(data.actualReceivables || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600, marginTop: '2px' }}>
              {data.unpaidInvoices || 0} Invoices Pending Full Payment
            </div>
          </div>
        </div>

        {/* Overdue Receivables */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Overdue Balance</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#DC2626' }}>
              PKR {(data.actualOverdueAmount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600, marginTop: '2px' }}>
              {data.overdueInvoices || 0} Overdue Invoices
            </div>
          </div>
        </div>
      </div>

      {/* Real Invoices Ledger */}
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
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
              System Invoices Ledger
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Real finalized financial invoices from Fortline CRM database
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Loading database financial records...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Invoice #</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Client Name</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Type</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Amount</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Outstanding</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Due Date</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentInvoices || []).map((inv) => (
                  <tr key={inv._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontSize: '0.825rem', fontWeight: 700, color: '#0F172A' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                      {inv.clientName}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748B' }}>
                      {inv.invoiceType || 'Standard'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.825rem', fontWeight: 700, color: '#0F172A' }}>
                      PKR {(inv.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.825rem', fontWeight: 700, color: inv.outstandingAmount > 0 ? '#DC2626' : '#16A34A' }}>
                      PKR {(inv.outstandingAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748B' }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        backgroundColor: inv.status === 'Paid' ? '#DCFCE7' : (inv.status === 'Overdue' ? '#FEE2E2' : '#FEF3C7'),
                        color: inv.status === 'Paid' ? '#15803D' : (inv.status === 'Overdue' ? '#B91C1C' : '#B45309')
                      }}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data.recentInvoices || data.recentInvoices.length === 0) && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                      No invoice records found in database.
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

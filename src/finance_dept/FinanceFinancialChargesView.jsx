import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import { Plus, Search, Filter, RefreshCw, X, Save, FileText, CheckCircle2, ShieldAlert, Download, AlertTriangle } from 'lucide-react';

export default function FinanceFinancialChargesView() {
  const [charges, setCharges] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    chargeType: 'Bank Charges',
    description: '',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    relatedDocumentType: 'General',
    relatedDocumentNumber: ''
  });

  const fetchCharges = async () => {
    setLoading(true);
    try {
      let url = '/api/purchaser/financial-charges';
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('chargeType', typeFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (params.toString()) url += `?${params.toString()}`;

      const [cRes, recRes] = await Promise.all([
        apiRequest(url),
        apiRequest('/api/sales-employee/finance/receivables')
      ]);

      if (cRes.response.ok && cRes.data.success) {
        setCharges(cRes.data.data || []);
      }

      if (recRes.response.ok && recRes.data.success) {
        const now = new Date();
        const overdues = (recRes.data.data || []).filter(r => r.isOverdue || (r.dueDate && new Date(r.dueDate) < now && r.status !== 'Paid'));
        setOverdueInvoices(overdues);
      }
    } catch (err) {
      console.error('Fetch Financial Charges Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, [typeFilter, searchTerm]);

  const handleDownloadDueInvoicePDF = (inv) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const amount = Number(inv.amount || inv.remainingReceivable || 0);
    const lateCharge = Math.round(amount * 0.03 * 100) / 100;
    const totalWithCharge = amount + lateCharge;

    doc.setFillColor(217, 119, 6); // Amber header
    doc.rect(0, 0, 210, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FORTLINE CRM - OVERDUE FINANCIAL CHARGES INVOICE', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${inv.invoiceNumber} • Automatic 3% Late Charge Included`, 14, 26);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Billed To: ${inv.clientName}`, 14, 42);
    doc.text(`Sales Order #: ${inv.salesOrderNumber || '—'}`, 14, 48);
    if (inv.dueDate) {
      doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString('en-GB')}`, 130, 48);
    }

    const rows = [
      ['Original Due Invoice Base Amount', '1', `PKR ${amount.toLocaleString()}`, `PKR ${amount.toLocaleString()}`],
      ['Automatic 3% Financial Late Charge (Applied Past Due Date)', '1', `PKR ${lateCharge.toLocaleString()}`, `PKR ${lateCharge.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Description', 'Qty', 'Unit Price (PKR)', 'Total Amount (PKR)']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal Invoice Amount: PKR ${amount.toLocaleString()}`, 196, finalY, { align: 'right' });
    doc.setTextColor(220, 38, 38);
    doc.text(`+ 3% Financial Charge: PKR ${lateCharge.toLocaleString()}`, 196, finalY + 6, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.text(`Grand Total in Financial Charges: PKR ${totalWithCharge.toLocaleString()}`, 196, finalY + 12, { align: 'right' });

    doc.save(`Financial_Charge_Invoice_${inv.invoiceNumber}.pdf`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || Number(form.amount) <= 0) {
      setError('Please enter a description and valid amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { response, data } = await apiRequest('/api/purchaser/financial-charges', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount)
        })
      });

      if (response.ok && data.success) {
        setShowModal(false);
        setFeedback(data.message || 'Financial charge recorded.');
        setForm({
          chargeType: 'Bank Charges',
          description: '',
          amount: '',
          date: new Date().toISOString().substring(0, 10),
          relatedDocumentType: 'General',
          relatedDocumentNumber: ''
        });
        fetchCharges();
        setTimeout(() => setFeedback(''), 4000);
      } else {
        setError(data.message || 'Failed to record financial charge.');
      }
    } catch (err) {
      setError('Server error.');
    } finally {
      setSaving(false);
    }
  };

  const totalChargesAmount = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>Financial Charges Ledger</h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.85rem' }}>Track bank fees, payment processing fees, and financial charge expenses in PKR</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="sv-btn-secondary" onClick={fetchCharges} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="sv-btn-primary" onClick={() => setShowModal(true)} style={{ background: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Record Financial Charge
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '12px 16px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {feedback}
        </div>
      )}

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #059669' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Charges Recorded</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{charges.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #D97706' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>3% Overdue Charges (Auto)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '6px' }}>
            PKR {charges.filter(c => c.chargeType === 'Overdue Financial Charge').reduce((sum, c) => sum + (Number(c.amount) || 0), 0).toLocaleString()}
          </div>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0', borderLeft: '4px solid #DC2626' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Financial Charge Volume</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>
            PKR {totalChargesAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Auto Overdue Banner */}
      <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={18} color="#D97706" />
        <span><strong>Automatic 3% Overdue Charge Rule Active:</strong> A 3% late financial charge is automatically calculated and applied to the total amount of invoices after their due date.</span>
      </div>

      {/* Due Date Invoices Financial Charges Download Section */}
      {overdueInvoices.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #FDE68A', padding: '18px 20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(217,119,6,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#FEF3C7', padding: '8px', borderRadius: '8px', color: '#D97706' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#92400E' }}>
                  Due Date Invoices — 3% Financial Charges Download Section ({overdueInvoices.length} Due Invoices)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#B45309' }}>
                  Due date invoices downloadable with 3% financial late charges added to total amount (e.g. 50 PKR amount + 3% = Subtotal PKR 51.5 in Financial Charges section).
                </p>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="sv-table" style={{ width: '100%', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#FFFBEB', color: '#92400E', fontWeight: 700 }}>
                  <th>Invoice #</th>
                  <th>Customer / Client</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Base Amount (PKR)</th>
                  <th style={{ textAlign: 'right' }}>3% Financial Charge (PKR)</th>
                  <th style={{ textAlign: 'right' }}>Subtotal in Financial Charges</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.map((inv) => {
                  const baseAmt = Number(inv.amount || inv.remainingReceivable || 0);
                  const charge3Pct = Math.round(baseAmt * 0.03 * 100) / 100;
                  const totalSubtotal = baseAmt + charge3Pct;

                  return (
                    <tr key={inv._id}>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{inv.invoiceNumber}</td>
                      <td style={{ fontWeight: 600 }}>{inv.clientName}</td>
                      <td style={{ color: '#DC2626', fontWeight: 600 }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : 'Past Due'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                        PKR {baseAmt.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#D97706' }}>
                        + PKR {charge3Pct.toLocaleString()} (3%)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#DC2626', fontSize: '0.92rem' }}>
                        PKR {totalSubtotal.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="sv-btn-primary"
                          style={{ background: '#D97706', padding: '5px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => handleDownloadDueInvoicePDF(inv)}
                          title="Download Due Invoice with 3% Financial Charge"
                        >
                          <Download size={14} /> Download PDF (+3% Charge)
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', width: '280px' }}>
          <Search size={15} color="#64748B" />
          <input
            type="text"
            placeholder="Search description, ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Charge Type:</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF', outline: 'none' }}
          >
            <option value="all">All Types</option>
            <option value="Overdue Financial Charge">Overdue Financial Charge (3% Auto)</option>
            <option value="Bank Charges">Bank Charges</option>
            <option value="Payment Processing Charges">Payment Processing Charges</option>
            <option value="Currency Conversion Fee">Currency Conversion Fee</option>
            <option value="Customs & Duty Charges">Customs & Duty Charges</option>
            <option value="Other Financial Charges">Other Financial Charges</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table className="sv-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontWeight: 700 }}>
              <th style={{ padding: '12px 16px' }}>Charge ID</th>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>Description</th>
              <th style={{ padding: '12px 16px' }}>Related Doc</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount (PKR)</th>
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {charges.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                  {loading ? 'Loading financial charges...' : 'No financial charges recorded.'}
                </td>
              </tr>
            ) : (
              charges.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#059669' }}>{c.chargeNumber}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="sv-pill" style={{ background: '#EFF6FF', color: '#2563EB', fontWeight: 600 }}>{c.chargeType}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{c.description}</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>
                    {c.relatedDocumentNumber ? `${c.relatedDocumentType}: ${c.relatedDocumentNumber}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#DC2626' }}>
                    PKR {Number(c.amount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>
                    {c.date ? new Date(c.date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: '#ECFDF5', color: '#047857' }}>
                      {c.status || 'Recorded'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD CHARGE MODAL */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="sv-modal" onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '8px', color: '#059669' }}>
                  <span style={{fontWeight: 600, fontSize: "0.9em", marginRight: "4px"}}>PKR</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Record Financial Charge</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Charge Type *</label>
                <select
                  value={form.chargeType}
                  onChange={e => setForm({ ...form, chargeType: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                >
                  <option value="Bank Charges">Bank Charges</option>
                  <option value="Payment Processing Charges">Payment Processing Charges</option>
                  <option value="Currency Conversion Fee">Currency Conversion Fee</option>
                  <option value="Customs & Duty Charges">Customs & Duty Charges</option>
                  <option value="Overdue Financial Charge">Overdue Financial Charge (3% Auto)</option>
                  <option value="Other Financial Charges">Other Financial Charges</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Description *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Bank transfer processing fee for SO-1002"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Amount (PKR) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Related Document Type</label>
                  <select
                    value={form.relatedDocumentType}
                    onChange={e => setForm({ ...form, relatedDocumentType: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="General">General / None</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Payment">Payment</option>
                    <option value="SalesOrder">Sales Order</option>
                    <option value="SupplierPO">Supplier PO</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Related Doc #</label>
                  <input
                    type="text"
                    value={form.relatedDocumentNumber}
                    onChange={e => setForm({ ...form, relatedDocumentNumber: e.target.value })}
                    placeholder="e.g. INV-1001"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#059669', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Record Financial Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Search, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { getUser } from '../../utils/authStorage';
import { downloadGrnPdf } from '../../utils/grnPdf';

const dateText = value => value ? new Date(value).toLocaleDateString() : '-';

export default function LocalPurchaserGRNsView({ searchQuery }) {
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [form, setForm] = useState({ goodsReceiptReference: '', goodsReceiptDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const user = getUser();
  const canRecord = user?.role === 'admin' || (user?.role === 'purchaser' && user?.purchaserSubDept !== 'Global');

  const load = async () => {
    setLoading(true);
    try {
      const [poRes, grnRes] = await Promise.all([
        apiRequest('/api/purchaser/pos?subType=Local'),
        apiRequest('/api/purchaser/grns?purchaserSubDept=Local')
      ]);
      setPos(poRes.success ? (poRes.pos || poRes.data || []) : []);
      setGrns(grnRes.success ? (grnRes.grns || grnRes.data || []) : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const internalGrnByPO = useMemo(() => new Map(grns.map(grn => [
    String(grn.supplierPO?._id || grn.supplierPO || grn.supplierPOId || ''), grn
  ])), [grns]);
  const rows = useMemo(() => {
    const q = String(searchQuery || filterText).trim().toLowerCase();
    return pos.filter(po => po.poType === 'Local' && po.salesOrderId && po.status !== 'Cancelled').filter(po => !q ||
      [po.poNumber, po.salesOrderNumber, po.supplierName, po.goodsReceiptReference]
        .some(value => String(value || '').toLowerCase().includes(q)));
  }, [pos, searchQuery, filterText]);

  const openRecord = po => {
    setSelectedPO(po);
    setMessage('');
    setForm({ goodsReceiptReference: '', goodsReceiptDate: new Date().toISOString().slice(0, 10) });
  };
  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const result = await apiRequest(`/api/purchaser/pos/${selectedPO._id}/goods-received`, 'POST', form);
      if (!result.success) return setMessage(result.message || 'Unable to record goods received.');
      setMessage(result.message || 'Goods receipt recorded.');
      await load();
      setSelectedPO(null);
    } catch { setMessage('Unable to record goods received.'); }
    finally { setSubmitting(false); }
  };

  return <div style={{ padding: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
      <div><h2 style={{ margin: 0, color: '#0F172A' }}>GRN (Goods Received)</h2><p style={{ margin: '5px 0 0', color: '#64748B' }}>Record supplier goods arrival. Support verifies and adds inventory.</p></div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', background: '#FFF' }}><Search size={16} color="#64748B" /><input value={filterText} onChange={event => setFilterText(event.target.value)} placeholder="Search PO, SO or GRN" style={{ border: 0, outline: 0 }} /></label>
    </div>
    {message && <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, background: '#ECFDF5', color: '#047857' }}>{message}</div>}
    <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead><tr style={{ background: '#F8FAFC', color: '#475569', textAlign: 'left' }}>{['Supplier PO', 'Sales Order', 'Supplier', 'Supplier GRN Reference', 'Receipt Date', 'Internal GRN', 'Status', 'Action'].map(label => <th key={label} style={{ padding: 13 }}>{label}</th>)}</tr></thead>
        <tbody>{loading ? <tr><td colSpan="8" style={{ padding: 34, textAlign: 'center' }}>Loading...</td></tr> : rows.length === 0 ? <tr><td colSpan="8" style={{ padding: 34, textAlign: 'center', color: '#94A3B8' }}>No Local Supplier POs found.</td></tr> : rows.map(po => {
          const internalGrnRecord = internalGrnByPO.get(String(po._id));
          const internalGrn = po.supportVerifiedGrn?.grnNumber || internalGrnRecord?.grnNumber || '-';
          const recorded = Boolean(po.goodsReceiptReference);
          return <tr key={po._id} style={{ borderTop: '1px solid #E2E8F0' }}>
            <td style={{ padding: 13, fontWeight: 700 }}>{po.poNumber}</td><td style={{ padding: 13 }}>{po.salesOrderNumber || '-'}</td><td style={{ padding: 13 }}>{po.supplierName || '-'}</td>
            <td style={{ padding: 13 }}>{po.goodsReceiptReference || '-'}</td><td style={{ padding: 13 }}>{dateText(po.goodsReceiptDate)}</td><td style={{ padding: 13 }}>{internalGrn}</td>
            <td style={{ padding: 13 }}>{internalGrn !== '-' ? 'Support Verified' : recorded ? 'Awaiting Support Verification' : 'Awaiting Supplier Goods'}</td>
            <td style={{ padding: 13 }}>{!recorded && canRecord ? <button onClick={() => openRecord(po)} style={{ border: 0, borderRadius: 7, padding: '8px 12px', background: '#2563EB', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>Record Goods Received</button> : internalGrnRecord ? <button onClick={() => downloadGrnPdf(internalGrnRecord)} style={{ border: '1px solid #A7F3D0', borderRadius: 7, padding: '8px 12px', background: '#ECFDF5', color: '#047857', fontWeight: 700, cursor: 'pointer' }}><Download size={14} /> Download PDF</button> : '-'}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {selectedPO && <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 1000 }}>
      <form onSubmit={submit} style={{ width: 'min(520px, 100%)', background: '#FFF', borderRadius: 14, padding: 24, boxShadow: '0 20px 40px rgba(15,23,42,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h3 style={{ margin: 0 }}>Record Goods Received</h3><div style={{ color: '#64748B', marginTop: 4 }}>{selectedPO.poNumber} · {selectedPO.supplierName}</div></div><button type="button" onClick={() => setSelectedPO(null)} style={{ border: 0, background: 'none', cursor: 'pointer' }}><X /></button></div>
        <label style={{ display: 'block', marginTop: 20, fontWeight: 700 }}>GRN reference number<input required value={form.goodsReceiptReference} onChange={event => setForm(current => ({ ...current, goodsReceiptReference: event.target.value }))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 7, padding: 10, border: '1px solid #CBD5E1', borderRadius: 7 }} /></label>
        <label style={{ display: 'block', marginTop: 16, fontWeight: 700 }}>Receipt date<input required type="date" value={form.goodsReceiptDate} onChange={event => setForm(current => ({ ...current, goodsReceiptDate: event.target.value }))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 7, padding: 10, border: '1px solid #CBD5E1', borderRadius: 7 }} /></label>
        <p style={{ color: '#64748B', fontSize: 13 }}>This records arrival only. It does not change inventory.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button type="button" onClick={() => setSelectedPO(null)} style={{ padding: '9px 14px' }}>Cancel</button><button disabled={submitting} style={{ padding: '9px 14px', background: '#2563EB', color: '#FFF', border: 0, borderRadius: 7, fontWeight: 700 }}>{submitting ? 'Saving...' : 'Record Goods Received'}</button></div>
      </form>
    </div>}
  </div>;
}

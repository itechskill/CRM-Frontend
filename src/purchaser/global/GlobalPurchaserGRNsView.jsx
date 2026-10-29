import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { downloadGrnPdf } from '../../utils/grnPdf';

const dateText = value => value ? new Date(value).toLocaleDateString('en-GB') : '-';

export default function GlobalPurchaserGRNsView({ searchQuery }) {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest('/api/purchaser/grns?purchaserSubDept=Global').then(result => {
      if (active && result.success) setGrns(result.grns || result.data || []);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => {
    const term = String(searchQuery || '').trim().toLowerCase();
    return grns.filter(grn => !term || [grn.grnNumber, grn.poNumber, grn.salesOrderNumber, grn.supplierName]
      .some(value => String(value || '').toLowerCase().includes(term)));
  }, [grns, searchQuery]);

  return <div style={{ padding: 24 }}>
    <h2 style={{ margin: 0, color: '#0F172A' }}>Global GRNs</h2>
    <p style={{ color: '#64748B' }}>Quantity-only Goods Received Notes verified through Inventory IN.</p>
    <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 820, borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#F8FAFC', textAlign: 'left' }}>{['GRN Number', 'Supplier PO', 'Sales Order', 'Supplier', 'Received', 'Status', 'Action'].map(label => <th key={label} style={{ padding: 13 }}>{label}</th>)}</tr></thead>
        <tbody>{loading ? <tr><td colSpan="7" style={{ padding: 32, textAlign: 'center' }}>Loading...</td></tr> : rows.length ? rows.map(grn => <tr key={grn._id} style={{ borderTop: '1px solid #E2E8F0' }}>
          <td style={{ padding: 13, fontWeight: 700, color: '#2563EB' }}>{grn.grnNumber}</td>
          <td style={{ padding: 13 }}>{grn.poNumber || '-'}</td><td style={{ padding: 13 }}>{grn.salesOrderNumber || '-'}</td><td style={{ padding: 13 }}>{grn.supplierName || '-'}</td>
          <td style={{ padding: 13 }}>{dateText(grn.grnDate || grn.createdAt)}</td><td style={{ padding: 13 }}>{grn.status || 'Completed'}</td>
          <td style={{ padding: 13 }}><button onClick={() => downloadGrnPdf(grn)} style={{ border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 7, padding: '8px 11px', fontWeight: 700, cursor: 'pointer' }}><Download size={14} /> Download PDF</button></td>
        </tr>) : <tr><td colSpan="7" style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>No Global GRNs found.</td></tr>}</tbody>
      </table>
    </div>
  </div>;
}

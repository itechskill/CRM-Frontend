import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiRequest } from '../utils/api';
import SupplierPOExpensesModal from '../components/SupplierPOExpenses';

export default function FinanceSupplierPOExpensesView({ searchQuery = '' }) {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const result = await apiRequest('/api/purchaser/pos');
    if (result.success) setRows(result.data?.data || result.data?.pos || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const query = searchQuery.toLowerCase();
  const visible = rows.filter(po => `${po.poNumber} ${po.supplierName} ${po.salesOrderNumber}`.toLowerCase().includes(query));
  return <div style={{ padding: 24 }}>
    <div style={{ marginBottom: 18 }}><h2 style={{ margin: 0 }}>Supplier PO Expenses</h2><p style={{ color: '#64748B', margin: '5px 0' }}>Review and update landed purchase costs. Every change notifies Admin.</p></div>
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ background: '#F8FAFC' }}>{['PO','Type','Supplier','Sales Order','PO total','Active expenses','Action'].map(label => <th key={label} style={{ padding: 12, textAlign: 'left' }}>{label}</th>)}</tr></thead><tbody>
      {visible.map(po => <tr key={po._id} style={{ borderTop: '1px solid #E2E8F0' }}><td style={{ padding: 12, fontWeight: 700 }}>{po.poNumber}</td><td>{po.poType}</td><td>{po.supplierName}</td><td>{po.salesOrderNumber || '—'}</td><td>PKR {Number(po.total || po.totalAmount || 0).toLocaleString()}</td><td>{(po.expenses || []).filter(item => !item.isDeleted).length}</td><td><button onClick={() => setSelected(po)} style={{ border: '1px solid #DDD6FE', background: '#FAF5FF', color: '#6D28D9', borderRadius: 7, padding: '7px 11px', cursor: 'pointer' }}>Expenses</button></td></tr>)}
      {!loading && !visible.length && <tr><td colSpan="7" style={{ padding: 30, textAlign: 'center', color: '#64748B' }}><Search size={18} /> No Supplier POs found.</td></tr>}
      {loading && <tr><td colSpan="7" style={{ padding: 30, textAlign: 'center' }}>Loading…</td></tr>}
    </tbody></table></div>
    {selected && <SupplierPOExpensesModal po={selected} onClose={() => setSelected(null)} onChanged={load} />}
  </div>;
}

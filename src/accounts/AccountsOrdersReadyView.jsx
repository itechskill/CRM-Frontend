import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  FileCheck,
  Search,
  Eye,
  FileText,
  Truck,
  X,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Package
} from 'lucide-react';
import '../employee/sales/SalesViews.css';

export default function AccountsOrdersReadyView({ onNavigateCreateInvoice, searchQuery }) {
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDN, setViewDN] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'invoiced' | 'all'

  const fetchDeliveryNotes = async () => {
    setLoading(true);
    try {
      // Fetch pending delivery notes awaiting invoice
      const { response, data } = await apiRequest('/api/sales-employee/delivery-notes');
      if (response.ok && data.success) {
        const cutoff = new Date('2026-09-15T00:00:00.000Z');
        setDeliveryNotes((data.data || []).filter(d => new Date(d.createdAt) > cutoff));
      }
    } catch (e) {
      console.error('[Fetch Delivery Notes Error]:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryNotes();
  }, []);

  const pendingNotes = deliveryNotes.filter(dn => !dn.invoiced && !dn.invoiceId);
  const invoicedNotes = deliveryNotes.filter(dn => dn.invoiced || dn.invoiceId);

  const displayedList = activeTab === 'pending'
    ? pendingNotes
    : activeTab === 'invoiced'
    ? invoicedNotes
    : deliveryNotes;

  const filteredNotes = displayedList.filter(dn => {
    const effectiveSearch = (searchQuery || searchTerm || '').trim().toLowerCase();
    if (!effectiveSearch) return true;
    const term = effectiveSearch;
    const dnNum = (dn.deliveryNumber || dn.deliveryNoteNumber || '').toLowerCase();
    const client = (dn.clientName || dn.recipientName || '').toLowerCase();
    const soNum = (dn.salesOrderNumber || dn.salesOrder?.orderReference || dn.salesOrder?.orderNumber || '').toLowerCase();
    const salesPerson = (dn.salePerson || dn.salesOrder?.salePerson || dn.salesOrder?.salesPerson?.fullName || '').toLowerCase();
    const status = (dn.status || '').toLowerCase();
    const itemsText = (dn.items || []).map(i => (i.product || i.description || '')).join(' ').toLowerCase();
    return (
      dnNum.includes(term) ||
      client.includes(term) ||
      soNum.includes(term) ||
      salesPerson.includes(term) ||
      status.includes(term) ||
      itemsText.includes(term)
    );
  });

  return (
    <div className="sv-container">
      {/* Top Bar */}
      <div className="sv-top-bar">
        <div>
          <h2 className="sv-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={22} color="#2563EB" /> Delivery Notes Awaiting Invoicing
          </h2>
          <p className="sv-subtitle">
            Support team confirmed delivery notes ready for commercial draft invoice generation
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.85rem' }}>
          <Clock size={16} color="#D97706" /> Pending Drafts: <strong>{pendingNotes.length}</strong>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'pending' ? '1px solid #2563EB' : '1px solid #E2E8F0',
            background: activeTab === 'pending' ? '#EFF6FF' : '#FFFFFF',
            color: activeTab === 'pending' ? '#2563EB' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={14} /> Pending Delivery Notes ({pendingNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('invoiced')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'invoiced' ? '1px solid #059669' : '1px solid #E2E8F0',
            background: activeTab === 'invoiced' ? '#ECFDF5' : '#FFFFFF',
            color: activeTab === 'invoiced' ? '#059669' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={14} /> Invoiced / History ({invoicedNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            border: activeTab === 'all' ? '1px solid #64748B' : '1px solid #E2E8F0',
            background: activeTab === 'all' ? '#F1F5F9' : '#FFFFFF',
            color: activeTab === 'all' ? '#0F172A' : '#64748B'
          }}
        >
          All Delivery Notes ({deliveryNotes.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="sv-search-box" style={{ marginBottom: '16px' }}>
        <Search size={16} color="#94A3B8" />
        <input
          type="text"
          placeholder="Search by DN #, customer, or sales order reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Delivery Notes Table */}
      {loading ? (
        <div className="sv-loading">Loading delivery notes...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="sv-empty">
          <FileCheck size={40} color="#94A3B8" />
          <h3>{activeTab === 'pending' ? 'No Pending Delivery Notes' : 'No Delivery Notes Found'}</h3>
          <p>
            {activeTab === 'pending'
              ? 'All confirmed delivery notes have been drafted into invoices.'
              : 'No delivery notes match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="sv-table-card">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Delivery Note #</th>
                <th>Client / Customer</th>
                <th>Sales Order Ref</th>
                <th>Items Count</th>
                <th>Date Dispatched</th>
                <th>Invoicing Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((dn) => {
                const dnNumber = dn.deliveryNumber || dn.deliveryNoteNumber || 'DN-—';
                const soNumber = dn.salesOrderNumber || dn.salesOrder?.orderReference || dn.salesOrder?.orderNumber || '—';
                const isPending = !dn.invoiced && !dn.invoiceId;

                return (
                  <tr key={dn._id}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={14} color="#2563EB" /> {dnNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>{dn.clientName}</div>
                      {dn.recipientPhone && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{dn.recipientPhone}</div>}
                    </td>
                    <td style={{ fontWeight: 600, color: '#475569' }}>
                      {soNumber}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#334155' }}>
                        <Package size={13} color="#64748B" /> {dn.items?.length || 0} item(s)
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      {dn.deliveryDate ? new Date(dn.deliveryDate).toLocaleDateString() : (dn.createdAt ? new Date(dn.createdAt).toLocaleDateString() : '—')}
                    </td>
                    <td>
                      {isPending ? (
                        <span className="sv-badge" style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
                          <Clock size={12} /> Awaiting Invoice
                        </span>
                      ) : (
                        <span className="sv-badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                          <CheckCircle2 size={12} /> Invoiced ({dn.invoiceNumber || 'Draft'})
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button className="sv-btn-action-icon" onClick={() => setViewDN(dn)} title="View Details">
                          <Eye size={14} />
                        </button>
                        {isPending && (
                          <button
                            className="sv-btn-primary"
                            style={{ padding: '5px 12px', fontSize: '0.75rem', gap: '4px', background: '#2563EB' }}
                            onClick={() => {
                              if (onNavigateCreateInvoice) onNavigateCreateInvoice(dn);
                            }}
                          >
                            <FileText size={13} /> Create Draft Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW DN MODAL */}
      {viewDN && (
        <div className="sv-modal-overlay" onClick={() => setViewDN(null)}>
          <div className="sv-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="#2563EB" />
                <h3 style={{ margin: 0 }}>Delivery Note: {viewDN.deliveryNumber || viewDN.deliveryNoteNumber}</h3>
              </div>
              <button onClick={() => setViewDN(null)}><X size={18} /></button>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{viewDN.clientName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Sales Order Ref: {viewDN.salesOrderNumber || viewDN.salesOrder?.orderReference || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="sv-badge" style={{
                    background: viewDN.invoiced ? '#ECFDF5' : '#FEF3C7',
                    color: viewDN.invoiced ? '#047857' : '#D97706',
                    border: `1px solid ${viewDN.invoiced ? '#A7F3D0' : '#FDE68A'}`
                  }}>
                    {viewDN.invoiced ? 'Invoiced' : 'Pending Invoicing'}
                  </span>
                </div>
              </div>

              {viewDN.items && viewDN.items.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '8px' }}>Dispatched Line Items</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Item</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDN.items.map((it, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px' }}>{it.description || it.product}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>{it.quantity || it.demand || 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="sv-modal-actions">
                <button className="sv-btn-cancel" onClick={() => setViewDN(null)}>Close</button>
                {(!viewDN.invoiced && !viewDN.invoiceId) && (
                  <button
                    className="sv-btn-primary"
                    onClick={() => {
                      const dnToInvoice = viewDN;
                      setViewDN(null);
                      if (onNavigateCreateInvoice) onNavigateCreateInvoice(dnToInvoice);
                    }}
                  >
                    <FileText size={14} /> Create Draft Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Plus,
  RefreshCw,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Edit2,
  DollarSign,
  MapPin,
  Truck,
  FileText,
  Filter
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import '../employee/sales/SalesViews.css';
import './LogisticsPortal.css';

export default function LogisticsImportInventoryView({ searchQuery }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantityOnHand: 0,
    totalInventoryValue: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState('');

  // Modal State for Add / Edit Item
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'pcs',
    quantityOnHand: 10,
    minStockLevel: 5,
    unitPrice: 0,
    location: 'Logistics / Import WH',
    description: '',
    supplierName: '',
    supplierPoNumber: '',
    orderReference: ''
  });

  const fetchImportInventory = async () => {
    setLoading(true);
    try {
      let url = '/api/logistics/import-inventory?';
      if (statusFilter && statusFilter !== 'All') url += `status=${statusFilter}&`;
      if (filterText || searchQuery) url += `search=${encodeURIComponent(filterText || searchQuery)}&`;

      const { response, data } = await apiRequest(url);
      if (response.ok && data.success) {
        setItems(data.data || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('[Fetch Import Inventory Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImportInventory();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchImportInventory();
  };

  const openAddModal = () => {
    setEditItem(null);
    setFormData({
      name: '',
      sku: `IMP-${Date.now().toString().slice(-6)}`,
      unit: 'pcs',
      quantityOnHand: 10,
      minStockLevel: 5,
      unitPrice: 0,
      location: 'Logistics / Import WH',
      description: 'Imported via Global Procurement / Logistics',
      supplierName: '',
      supplierPoNumber: '',
      orderReference: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name || '',
      sku: item.sku || '',
      unit: item.unit || 'pcs',
      quantityOnHand: item.quantityOnHand || 0,
      minStockLevel: item.minStockLevel || 5,
      unitPrice: item.unitPrice || 0,
      location: item.location || 'Logistics / Import WH',
      description: item.description || '',
      supplierName: item.supplierName || '',
      supplierPoNumber: item.supplierPoNumber || '',
      orderReference: item.orderReference || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);

    try {
      const url = editItem ? `/api/logistics/import-inventory/${editItem._id}` : '/api/logistics/import-inventory';
      const method = editItem ? 'PATCH' : 'POST';

      const { response, data } = await apiRequest(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (response.ok && data.success) {
        setToast(editItem ? `Import item "${formData.name}" updated successfully.` : `Import item "${formData.name}" added to inventory.`);
        setShowModal(false);
        fetchImportInventory();
        setTimeout(() => setToast(''), 4000);
      } else {
        alert(data.message || 'Failed to save import inventory item.');
      }
    } catch (err) {
      console.error('[Save Import Item Error]:', err);
      alert('Error saving import inventory item.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStockBadge = (status) => {
    switch (status) {
      case 'In Stock':
        return { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', text: 'In Stock' };
      case 'Low Stock':
        return { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', text: 'Low Stock' };
      case 'Out of Stock':
        return { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', text: 'Out of Stock' };
      default:
        return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', text: status || 'Stock' };
    }
  };

  return (
    <div className="sv-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Toast Feedback */}
      {toast && (
        <div className="logistics-toast" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Boxes size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Logistics Import Inventory</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
              Centralized stock register for imported goods received from Global Purchaser POs and GRNs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchImportInventory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '9px 15px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'logistics-spin' : ''} /> Refresh
          </button>
          <button
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#2563EB',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Plus size={18} /> Add Import Item
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', borderTop: '4px solid #2563EB' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Import Items Registered</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{stats.totalItems || items.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Distinct products imported</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', borderTop: '4px solid #0284C7' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quantity On Hand</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0284C7', marginTop: '6px' }}>{stats.totalQuantityOnHand || 0} pcs</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Total physical units in warehouse</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', borderTop: '4px solid #16A34A' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Estimated Valuation</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#16A34A', marginTop: '6px' }}>Rs. {(stats.totalInventoryValue || 0).toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Total value of imported stock</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', borderTop: '4px solid #D97706' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Low / Out of Stock</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: stats.lowStockItems > 0 ? '#D97706' : '#16A34A', marginTop: '6px' }}>{stats.lowStockItems || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Items at or below min stock level</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
          {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: statusFilter === st ? '#FFFFFF' : 'transparent',
                color: statusFilter === st ? '#2563EB' : '#64748B',
                boxShadow: statusFilter === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', minWidth: '300px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Name, SKU, Supplier, PO#, Location..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '9px 16px',
              backgroundColor: '#0F172A',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Table Card */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} color="#2563EB" /> Imported Stock Register ({items.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>
            <RefreshCw size={24} className="logistics-spin" />
            <p style={{ marginTop: '8px', fontSize: '0.86rem' }}>Loading import inventory...</p>
          </div>
        ) : items.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Product Name &amp; SKU</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Quantity On Hand</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Unit Price / Total</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Supplier &amp; PO #</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Order Ref</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Location</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const badge = getStockBadge(item.status);
                  const itemValue = (item.quantityOnHand || 0) * (item.unitPrice || 0);
                  return (
                    <tr key={item._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#2563EB', marginTop: '2px' }}>
                          SKU: {item.sku || 'N/A'}
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                          {item.quantityOnHand} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>{item.unit || 'pcs'}</span>
                        </div>
                        {item.minStockLevel > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Min Stock: {item.minStockLevel}</div>
                        )}
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          Rs. {(item.unitPrice || 0).toLocaleString()} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>/ {item.unit || 'pc'}</span>
                        </div>
                        {itemValue > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>
                            Total: Rs. {itemValue.toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.supplierName || 'Global Supplier'}</div>
                        {item.supplierPoNumber && (
                          <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}>
                            PO: {item.supplierPoNumber}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>
                          {item.orderReference || '—'}
                        </span>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#475569' }}>
                          <MapPin size={13} color="#64748B" />
                          <span>{item.location || 'Logistics / Import WH'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.text}
                        </span>
                      </td>

                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#2563EB',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '56px 24px', color: '#64748B' }}>
            <Boxes size={44} color="#94A3B8" style={{ marginBottom: '10px' }} />
            <h4 style={{ margin: '4px 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>
              No Imported Goods Found in Inventory
            </h4>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#94A3B8', maxWidth: '440px', marginInline: 'auto' }}>
              Goods imported by Global Purchaser or received via Logistics GRN will automatically appear here in the Import Inventory register.
            </p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                  {editItem ? 'Edit Imported Inventory Item' : 'Add Imported Goods to Inventory'}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  Manage physical stock quantity, valuation, supplier PO, and warehouse location
                </span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Product / Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Industrial Valve 50mm, Hydraulic Pump Model B"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>SKU / Item Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g. IMP-10024"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="pcs, set, kg, meters"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Quantity On Hand *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantityOnHand}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantityOnHand: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, color: '#2563EB', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Unit Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                    placeholder="e.g. 5000"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Global Supplier Name</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="e.g. Shanghai Industrial Ltd"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Supplier PO #</label>
                  <input
                    type="text"
                    value={formData.supplierPoNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierPoNumber: e.target.value }))}
                    placeholder="e.g. PO-INT-9901"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Linked Sales Order Ref</label>
                  <input
                    type="text"
                    value={formData.orderReference}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderReference: e.target.value }))}
                    placeholder="e.g. SO-1002"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Warehouse Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Logistics / Import WH"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Description / Notes</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional specifications, customs clearance notes, or receiving details..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFF', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Saving...' : (editItem ? 'Update Import Item' : 'Save Import Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

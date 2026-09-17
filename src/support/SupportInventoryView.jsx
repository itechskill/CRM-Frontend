import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Package,
  Tag,
  MapPin,
  DollarSign,
  Layers,
  FileText,
  Building,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import '../employee/sales/SalesViews.css';
import './SupportPortal.css';

export default function SupportInventoryView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'General',
    unit: 'pcs',
    quantityOnHand: 0,
    minStockLevel: 5,
    unitPrice: 0,
    location: 'WH/Stock',
    description: ''
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-employee/inventory');
      if (response.ok && data.success) {
        setItems(data.data || []);
      }
    } catch (e) {
      console.error('[Fetch Inventory Error]:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.sku && item.sku.toLowerCase().includes(term)) ||
      (item.category && item.category.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    setEditItem(null);
    setForm({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'General',
      unit: 'pcs',
      quantityOnHand: 10,
      minStockLevel: 5,
      unitPrice: 0,
      location: 'WH/Stock',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      sku: item.sku || '',
      category: item.category || 'General',
      unit: item.unit || 'pcs',
      quantityOnHand: item.quantityOnHand || 0,
      minStockLevel: item.minStockLevel || 5,
      unitPrice: item.unitPrice || 0,
      location: item.location || 'WH/Stock',
      description: item.description || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Product name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: editItem ? editItem._id : undefined,
        ...form,
        quantityOnHand: Number(form.quantityOnHand) || 0,
        minStockLevel: Number(form.minStockLevel) || 5,
        unitPrice: Number(form.unitPrice) || 0
      };
      const { response, data } = await apiRequest('/api/sales-employee/inventory', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response.ok && data.success) {
        setShowModal(false);
        fetchInventory();
      } else {
        alert(data.message || 'Failed to save product item.');
      }
    } catch (err) {
      alert('Error saving product item.');
    } finally {
      setSaving(false);
    }
  };

  // Full Inventory List PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(15, 23, 42); // Navy #0F172A
    doc.rect(0, 0, 297, 26, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM — WAREHOUSE INVENTORY & STOCK VALUATION', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} • All amounts in Pakistani Rupees (PKR)`, 14, 20);

    const rows = filteredItems.map((item, idx) => {
      const available = (item.quantityOnHand || 0) - (item.reservedQuantity || 0);
      const totalVal = (item.quantityOnHand || 0) * (item.unitPrice || 0);
      return [
        (idx + 1).toString(),
        item.name || 'Product Item',
        item.sku || 'No SKU',
        item.category || 'General',
        item.location || 'WH/Stock',
        `${item.quantityOnHand || 0} ${item.unit || 'pcs'}`,
        `${item.reservedQuantity || 0} ${item.unit || 'pcs'}`,
        `${available} ${item.unit || 'pcs'}`,
        `Rs. ${(item.unitPrice || 0).toLocaleString()}`,
        `Rs. ${totalVal.toLocaleString()}`,
        item.status || 'In Stock'
      ];
    });

    autoTable(doc, {
      startY: 32,
      margin: { left: 14, right: 14 },
      head: [['#', 'Product Name', 'SKU', 'Category', 'Location', 'Total Qty', 'Reserved', 'Available', 'Unit Price', 'Stock Value', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 48, fontStyle: 'bold' },
        2: { cellWidth: 24 },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        8: { cellWidth: 26, halign: 'right' },
        9: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        10: { cellWidth: 23, halign: 'center' }
      }
    });

    const totalValAll = filteredItems.reduce((s, it) => s + ((it.quantityOnHand || 0) * (it.unitPrice || 0)), 0);
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Stock Asset Value: Rs. ${totalValAll.toLocaleString()}`, 14, finalY > 195 ? 195 : finalY);

    doc.save(`Fortline_Inventory_Register_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Full Inventory List Excel CSV Export
  const handleExportExcel = () => {
    const headers = ['#', 'Product Name', 'SKU Code', 'Category', 'Unit', 'Total Stock', 'Reserved Qty', 'Available Qty', 'Min Alert Level', 'Unit Price (PKR)', 'Total Value (PKR)', 'Location', 'Status', 'Description'];
    const rows = filteredItems.map((item, idx) => {
      const available = (item.quantityOnHand || 0) - (item.reservedQuantity || 0);
      const totalVal = (item.quantityOnHand || 0) * (item.unitPrice || 0);
      return [
        idx + 1,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.sku || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${item.unit || 'pcs'}"`,
        item.quantityOnHand || 0,
        item.reservedQuantity || 0,
        available,
        item.minStockLevel || 5,
        item.unitPrice || 0,
        totalVal,
        `"${(item.location || '').replace(/"/g, '""')}"`,
        `"${item.status || 'In Stock'}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fortline_Inventory_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sv-container">
      {/* Top Filter Bar */}
      <div className="sv-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="sv-search-box">
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search SKU code, product name, category, warehouse location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="sv-input"
            style={{ width: '160px', padding: '8px 12px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          <button className="sv-btn-primary" style={{ background: '#0F172A' }} onClick={handleExportPDF} title="Export Inventory PDF">
            <Download size={15} /> Export PDF
          </button>
          <button className="sv-btn-primary" style={{ background: '#2563EB' }} onClick={handleExportExcel} title="Export Inventory Excel">
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button className="sv-btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Product Stock
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="sv-loading">Loading inventory items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="sv-empty">
          <Boxes size={40} color="#94A3B8" />
          <h3>No Inventory Items Found</h3>
          <p>Click "Add Product Stock" to add items to your warehouse inventory.</p>
        </div>
      ) : (
        <div className="sv-table-wrap support-table-card">
          <table className="sv-table support-table">
            <thead>
              <tr>
                <th>Product &amp; SKU Code</th>
                <th>Category</th>
                <th>Location</th>
                <th>Total Stock</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const available = (item.quantityOnHand || 0) - (item.reservedQuantity || 0);

                let statusBg = '#DCFCE7';
                let statusColor = '#15803D';
                let statusBorder = '#BBF7D0';

                if (item.status === 'Low Stock' || (available > 0 && available <= item.minStockLevel)) {
                  statusBg = '#FFFBEB';
                  statusColor = '#D97706';
                  statusBorder = '#FDE68A';
                } else if (item.status === 'Out of Stock' || available <= 0) {
                  statusBg = '#FEF2F2';
                  statusColor = '#DC2626';
                  statusBorder = '#FCA5A5';
                }

                return (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.sku || 'No SKU'}</div>
                    </td>
                    <td>{item.category || 'General'}</td>
                    <td>{item.location || 'WH/Stock'}</td>
                    <td style={{ fontWeight: 700 }}>{item.quantityOnHand} {item.unit}</td>
                    <td style={{ color: '#D97706', fontWeight: 600 }}>{item.reservedQuantity || 0} {item.unit}</td>
                    <td style={{ fontWeight: 800, color: available > 0 ? '#059669' : '#DC2626' }}>
                      {available} {item.unit}
                    </td>
                    <td>
                      <span className="sv-badge" style={{ background: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="sv-btn-action-icon" onClick={() => handleOpenEdit(item)} title="Edit Stock Item">
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT INVENTORY MODAL */}
      {showModal && (
        <div className="sv-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="sv-modal"
            style={{
              padding: 0,
              maxWidth: '640px',
              maxHeight: '88vh',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#F0F9FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284C7',
                    border: '1px solid #BAE6FD'
                  }}
                >
                  <Boxes size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {editItem ? `Edit Product Stock (${form.sku})` : 'Add New Inventory Product'}
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.78rem' }}>
                    Specify product SKU, category, stock counts, alert levels, and pricing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="sv-modal-close-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form
              onSubmit={handleSave}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Section 1: Product Identification */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  <Tag size={14} color="#0284C7" /> Product Info &amp; Categorization
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      className="sv-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Dell ThinkBook G8 16GB RAM"
                      required
                    />
                  </div>
                  <div className="sv-field">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      SKU / Item Code *
                    </label>
                    <input
                      type="text"
                      className="sv-input"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder="e.g. SKU-8091"
                      required
                    />
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Category
                    </label>
                    <select
                      className="sv-input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="General">General Goods</option>
                      <option value="Electronics">Electronics &amp; IT</option>
                      <option value="Machinery">Machinery &amp; Tools</option>
                      <option value="Equipment">Industrial Equipment</option>
                      <option value="Spare Parts">Spare Parts</option>
                      <option value="Raw Materials">Raw Materials</option>
                    </select>
                  </div>

                  <div className="sv-field">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Unit of Measure
                    </label>
                    <select
                      className="sv-input"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    >
                      <option value="pcs">pcs (Pieces)</option>
                      <option value="boxes">boxes (Boxes)</option>
                      <option value="sets">sets (Sets)</option>
                      <option value="kg">kg (Kilograms)</option>
                      <option value="meters">meters (Meters)</option>
                      <option value="liters">liters (Liters)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Warehouse Stock & Pricing */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  <Building size={14} color="#059669" /> Warehouse Stock &amp; Valuation
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Quantity on Hand *
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="sv-input"
                      value={form.quantityOnHand}
                      onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })}
                      placeholder="e.g. 50"
                      required
                    />
                  </div>

                  <div className="sv-field">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Min Stock Alert Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="sv-input"
                      value={form.minStockLevel}
                      onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>

                <div className="sv-grid-2">
                  <div className="sv-field">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Unit Price (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="sv-input"
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                      placeholder="e.g. 150000"
                    />
                  </div>

                  <div className="sv-field">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                      Source Warehouse Location
                    </label>
                    <input
                      type="text"
                      className="sv-input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. WH/Stock-A1"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Technical Description */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  <FileText size={14} color="#7C3AED" /> Specifications &amp; Notes
                </div>
                <textarea
                  className="sv-input"
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional product specifications, serial numbers, or handling notes..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  justify: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                  marginTop: '8px'
                }}
              >
                <button type="button" className="sv-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sv-btn-primary" disabled={saving} style={{ backgroundColor: '#0284C7' }}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Product Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

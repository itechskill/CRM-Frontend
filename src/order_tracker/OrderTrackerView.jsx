import React, { useEffect, useMemo, useState } from 'react';
import { Search, Eye, X, Download, RefreshCw, FileText, Menu } from 'lucide-react';
import { apiRequest } from '../utils/api';
import NotificationDropdown from '../components/NotificationDropdown';
import { downloadQuotationPdf } from '../utils/quotationPdf';
import { downloadSalesOrderPdf } from '../utils/salesDocumentPdfLayout';
import { downloadSupplierPoPdf } from '../utils/supplierPoPdf';
import { downloadGrnPdf } from '../utils/grnPdf';
import { downloadDeliveryNotePdf } from '../utils/deliveryNotePdf';
import { downloadInvoicePdf } from '../utils/invoicePdf';
import { downloadReceiptVoucherPdf } from '../utils/receiptVoucherPdf';
import './OrderTrackerView.css';

export const trackerRecordTabs = [
  ['orders', 'Orders'], ['quotations', 'Quotations'], ['price-requests', 'Price Requests'],
  ['customer-pos', 'Customer POs'], ['product-files', 'Product Files'], ['sales-orders', 'Sales Orders'],
  ['supplier-pos', 'Supplier POs'], ['grns', 'GRNs'], ['delivery-notes', 'Delivery Notes'],
  ['shipments', 'Shipments'], ['support-tickets', 'Support Tickets'], ['invoices', 'Invoices'],
  ['payments', 'Payments / RVs'], ['inventory', 'Inventory']
];

const refFor = row => row.orderNumber || row.orderReference || row.quotationNumber || row.poNumber || row.fileNumber || row.grnNumber || row.deliveryNumber || row.deliveryNoteNumber || row.shipmentId || row.invoiceNumber || row.receiptVoucherNumber || row.paymentRefNumber || row.deliveryNoteNumber || row.sku || row._id;
const customerFor = row => row.customer || row.clientName || row.customerName || row.requestedFor || row.name || '—';
const statusFor = row => row.currentStage || row.workflowStatus || row.status || row.paymentStatus || '—';
const moneyFor = row => Number(row.amount ?? row.netAmount ?? row.totalAmount ?? row.total ?? 0);
const formatMoney = value => Number(value || 0).toLocaleString('en-PK');
const recordDocumentTypes = {
  quotations: 'quotation',
  'sales-orders': 'sales-order',
  'supplier-pos': 'supplier-po',
  grns: 'grn',
  'delivery-notes': 'delivery-note',
  invoices: 'invoice',
  payments: 'payment'
};

const openAttachedDocument = record => {
  const url = record?.uploadedDocument || record?.documentUrl || record?.attachmentUrl || record?.fileUrl;
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
};

const downloadTrackedDocument = async (type, record) => {
  if (!record) return;
  if (type === 'quotation') return downloadQuotationPdf(record);
  if (type === 'sales-order') return downloadSalesOrderPdf(record);
  if (type === 'supplier-po') return downloadSupplierPoPdf(record);
  if (type === 'grn') return downloadGrnPdf(record);
  if (type === 'delivery-note') return downloadDeliveryNotePdf(record, { showPrices: true });
  if (type === 'invoice') return downloadInvoicePdf(record);
  if (type === 'payment') return downloadReceiptVoucherPdf(record);
  return openAttachedDocument(record);
};

export default function OrderTrackerView({ currentUser, onMenuToggle }) {
  const [tab, setTab] = useState('orders');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [recordDetail, setRecordDetail] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const path = tab === 'orders' ? `/api/order-tracker/orders?search=${encodeURIComponent(search)}` : `/api/order-tracker/records/${tab}`;
      const { response, data } = await apiRequest(path);
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load tracker records.');
      setRows(data.data || []);
    } catch (err) { setError(err.message); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    if (tab !== 'orders') return;
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredRows = useMemo(() => {
    if (tab === 'orders' || !search.trim()) return rows;
    const needle = search.toLowerCase();
    return rows.filter(row => JSON.stringify([refFor(row), customerFor(row), statusFor(row)]).toLowerCase().includes(needle));
  }, [rows, search, tab]);

  const openOrder = async row => {
    setLoading(true); setError('');
    try {
      const { response, data } = await apiRequest(`/api/order-tracker/orders/${row._id}`);
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load workflow detail.');
      setDetail(data.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return <div className="ot-page">
    <header className="ot-header">
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu"><Menu size={20} /></button>
      <div><h1>Order Tracker</h1><p>Complete company workflow and payment visibility - view only</p></div>
      <div className="ot-user"><span>{currentUser?.fullName || 'Order Tracker'}</span><NotificationDropdown /></div>
    </header>
    <section className="ot-card">
      <div className="ot-toolbar">
        <div className="ot-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search Sales Order, Customer PO, file, customer or quotation no." /></div>
        <button type="button" className="ot-secondary" onClick={load}><RefreshCw size={15} /> Refresh</button>
      </div>
      <div className="ot-tabs">{trackerRecordTabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setDetail(null); setRecordDetail(null); }}>{label}</button>)}</div>
      {error && <div className="ot-error">{error}</div>}
      {loading ? <div className="ot-empty">Loading records…</div> : filteredRows.length === 0 ? <div className="ot-empty"><FileText size={30} /> No records found</div> :
        <div className="ot-table-wrap"><table className="ot-table"><thead><tr><th>Order / File</th><th>Customer</th>{tab === 'orders' && <><th>Salesperson</th><th>Current department</th><th>Current stage</th><th>Why it is there</th><th>Last update</th><th>Payment</th></>}<th>Amount</th><th>View</th></tr></thead>
          <tbody>{filteredRows.map(row => <tr key={row._id}><td><strong>{refFor(row)}</strong>{row.fileNumber && <small>File: {row.fileNumber}</small>}</td><td>{customerFor(row)}</td>{tab === 'orders' && <><td>{row.salesperson || '—'}</td><td><span className="ot-dept">{row.currentDepartment}</span></td><td>{row.currentStage}</td><td className="ot-why">{row.why}</td><td>{row.lastUpdate?.what || '—'}<small>{row.lastUpdate?.when ? new Date(row.lastUpdate.when).toLocaleString() : ''}{row.lastUpdate?.by ? ` · ${row.lastUpdate.by}` : ''}</small></td><td><span className={`ot-payment ${row.payment?.key}`}>{row.payment?.label}</span></td></>}<td>{moneyFor(row) ? `PKR ${formatMoney(moneyFor(row))}` : '—'}</td><td><button className="ot-icon" onClick={() => tab === 'orders' ? openOrder(row) : setRecordDetail(row)} title="Open read-only detail"><Eye size={16} /></button></td></tr>)}</tbody></table></div>}
    </section>
    {detail && <div className="ot-overlay" onClick={() => setDetail(null)}><aside className="ot-detail" onClick={event => event.stopPropagation()}>
      <div className="ot-detail-head"><div><h2>{detail.summary.orderNumber}</h2><p>{detail.summary.customer} · {detail.summary.currentDepartment}</p></div><button onClick={() => setDetail(null)}><X size={20} /></button></div>
      <div className="ot-summary-grid"><div><label>Current stage</label><strong>{detail.summary.currentStage}</strong></div><div><label>Why it is there</label><strong>{detail.summary.why}</strong></div><div><label>Payment</label><strong>{detail.summary.payment?.label}</strong><small>Received PKR {formatMoney(detail.summary.payment?.paid)}</small></div><div><label>Salesperson</label><strong>{detail.summary.salesperson || '—'}</strong></div></div>
      <h3>Complete timeline</h3><div className="ot-timeline">{(detail.timeline || []).map((event, index) => <div className="ot-event" key={`${event.stage}-${index}`}><span className="ot-dot" /><div><div className="ot-event-title"><strong>{event.stage}</strong><span>{event.department}</span></div><p>{event.detail || '—'}</p><small>{event.date ? new Date(event.date).toLocaleString() : ''}{event.person ? ` · ${event.person}` : ''}</small>{event.record && <button className="ot-document" onClick={() => downloadTrackedDocument(event.documentType, event.record)}><Download size={14} /> View / Download document</button>}</div></div>)}</div>
    </aside></div>}
    {recordDetail && <div className="ot-overlay" onClick={() => setRecordDetail(null)}><aside className="ot-detail" onClick={event => event.stopPropagation()}>
      <div className="ot-detail-head"><div><h2>{refFor(recordDetail)}</h2><p>{customerFor(recordDetail)} · Read only</p></div><button onClick={() => setRecordDetail(null)}><X size={20} /></button></div>
      <div className="ot-summary-grid"><div><label>Status</label><strong>{statusFor(recordDetail)}</strong></div><div><label>Amount</label><strong>{moneyFor(recordDetail) ? `PKR ${formatMoney(moneyFor(recordDetail))}` : '—'}</strong></div><div><label>Created</label><strong>{recordDetail.createdAt ? new Date(recordDetail.createdAt).toLocaleString() : '—'}</strong></div><div><label>Last updated</label><strong>{recordDetail.updatedAt ? new Date(recordDetail.updatedAt).toLocaleString() : '—'}</strong></div></div>
      {recordDetail.items?.length > 0 && <><h3>Items</h3><div className="ot-table-wrap"><table className="ot-table ot-items"><thead><tr><th>Part number</th><th>Description</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>{recordDetail.items.map((item, index) => <tr key={item._id || index}><td>{item.partNumber || '—'}</td><td>{item.description || item.productName || item.name || '—'}</td><td>{item.quantity ?? item.receivedQuantity ?? '—'}</td><td>{item.total || item.unitPrice ? `PKR ${formatMoney(item.total ?? (Number(item.unitPrice) * Number(item.quantity || 0)))}` : '—'}</td></tr>)}</tbody></table></div></>}
      {(recordDocumentTypes[tab] || recordDetail.uploadedDocument || recordDetail.documentUrl || recordDetail.attachmentUrl || recordDetail.fileUrl) && <button className="ot-document" onClick={() => downloadTrackedDocument(recordDocumentTypes[tab], recordDetail)}><Download size={14} /> View / Download document</button>}
    </aside></div>}
  </div>;
}

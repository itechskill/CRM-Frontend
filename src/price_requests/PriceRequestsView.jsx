import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  CircleDollarSign,
  Clock3,
  Link2,
  ListFilter,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings2,
  X
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { getUser } from '../utils/authStorage';
import './PriceRequestsView.css';

const ACCESS_ROLES = ['sales_member', 'sales_rep', 'sales_person', 'sales_manager', 'purchaser', 'admin', 'ceo'];
const CATEGORIES = ['Servers', 'Desktops/Laptops/Workstations', 'Networking', 'Software', 'Other'];
const BRANDS = ['Cisco', 'VMware', 'Lenovo', 'Microsoft', 'BDCOM', 'Fortinet', 'Dell', 'HP', 'Other'];
const ROUTABLE_BRANDS = BRANDS.filter((brand) => brand !== 'Other');
const CURRENCIES = ['PKR', 'USD', 'EUR', 'AED', 'GBP'];

const EMPTY_REQUEST = {
  category: 'Other',
  brandChoice: 'Other',
  otherBrand: '',
  isBulk: false,
  customerName: '',
  reference: '',
  partNumber: '',
  requirement: '',
  quantity: 1,
  requestedFrom: '',
  pendingNote: ''
};

const EMPTY_RULE = {
  label: '',
  ruleType: 'brand',
  matchValues: [],
  assignee: '',
  active: true
};

const userLabel = (user) => user
  ? `${user.fullName || 'Unknown'} — ${user.email || 'no email'} — ${user.role || 'no role'}${user.purchaserSubDept ? ` (${user.purchaserSubDept})` : ''}`
  : '';

const getId = (value) => String(value?._id || value || '');

export default function PriceRequestsView() {
  const currentUser = getUser() || {};
  const currentUserId = getId(currentUser);
  const canManageRules = ['admin', 'ceo'].includes(currentUser.role);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [rules, setRules] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, pendingByPerson: [], pendingByCategory: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);
  const [recipientTouched, setRecipientTouched] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState(null);
  const [actionForm, setActionForm] = useState({
    unitPrice: '', currency: 'PKR', validityDate: '', leadTime: '', notes: '',
    reason: '', requestedFrom: '', pendingNote: '', quotationId: ''
  });
  const [quotations, setQuotations] = useState([]);
  const [quotationSearch, setQuotationSearch] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);
  const [editingRule, setEditingRule] = useState(null);

  const eligibleUsers = useMemo(
    () => users.filter((user) => ACCESS_ROLES.includes(user.role)),
    [users]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [requestResult, userResult, ruleResult] = await Promise.all([
        apiRequest('/api/price-requests'),
        apiRequest('/api/users'),
        apiRequest('/api/price-requests/routing-rules')
      ]);
      if (!requestResult.response.ok) throw new Error(requestResult.data.message || 'Could not load price requests.');
      setRequests(requestResult.data.data || []);
      setSummary(requestResult.data.summary || { pending: 0, pendingByPerson: [], pendingByCategory: [] });
      if (userResult.response.ok) setUsers(userResult.data.data || []);
      if (ruleResult.response.ok) setRules(ruleResult.data.data || []);
    } catch (err) {
      setError(err.message || 'Could not load Price Requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const actualBrand = requestForm.brandChoice === 'Other'
    ? requestForm.otherBrand.trim()
    : requestForm.brandChoice;

  useEffect(() => {
    if (!showCreate || !actualBrand || !requestForm.category) {
      setSuggestion(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      const query = new URLSearchParams({
        category: requestForm.category,
        brand: actualBrand,
        isBulk: String(requestForm.isBulk)
      });
      try {
        const { response, data } = await apiRequest(`/api/price-requests/assignee-suggestion?${query}`);
        if (response.ok) {
          setSuggestion(data.data || null);
          if (!recipientTouched) {
            setRequestForm((current) => ({
              ...current,
              requestedFrom: data.data?.assignee ? getId(data.data.assignee) : ''
            }));
          }
        }
      } catch {
        setSuggestion(null);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [showCreate, requestForm.category, requestForm.isBulk, actualBrand, recipientTouched]);

  const filteredRequests = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return requests.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (!term) return true;
      return [item.requestNumber, item.requirement, item.brand, item.customerName, item.reference, item.partNumber,
        item.requestedBy?.fullName, item.requestedFrom?.fullName, item.quotationId?.quotationNumber, item.quotationId?.orderReference]
        .some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [requests, filters]);

  const statusCounts = useMemo(() => ({
    Pending: requests.filter((item) => item.status === 'Pending').length,
    Priced: requests.filter((item) => item.status === 'Priced').length,
    Declined: requests.filter((item) => item.status === 'Declined').length
  }), [requests]);

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 3500);
  };

  const openCreate = () => {
    setRequestForm(EMPTY_REQUEST);
    setRecipientTouched(false);
    setSuggestion(null);
    setError('');
    setShowCreate(true);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    if (!actualBrand) return setError('Enter the brand name.');
    setSaving(true);
    setError('');
    try {
      const { response, data } = await apiRequest('/api/price-requests', {
        method: 'POST',
        body: JSON.stringify({
          ...requestForm,
          brand: actualBrand,
          quantity: Number(requestForm.quantity)
        })
      });
      if (!response.ok) throw new Error(data.message || 'Could not create the request.');
      setShowCreate(false);
      flash(`${data.data.requestNumber} created.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAction = async (type, item) => {
    setAction({ type, item });
    setActionForm({
      unitPrice: '', currency: 'PKR', validityDate: '', leadTime: '', notes: '',
      reason: '', requestedFrom: getId(item.requestedFrom), pendingNote: item.pendingNote || '', quotationId: ''
    });
    setError('');
    if (type === 'link') {
      setQuotationSearch('');
      const { response, data } = await apiRequest('/api/price-requests/quotations');
      setQuotations(response.ok ? (data.data || []) : []);
    }
  };

  const searchQuotations = async () => {
    const query = quotationSearch.trim() ? `?search=${encodeURIComponent(quotationSearch.trim())}` : '';
    const { response, data } = await apiRequest(`/api/price-requests/quotations${query}`);
    if (response.ok) setQuotations(data.data || []);
  };

  const submitAction = async (event) => {
    event.preventDefault();
    const { type, item } = action;
    const endpointMap = {
      price: 'price', decline: 'decline', reassign: 'reassign', note: 'pending-note', link: 'link-quotation'
    };
    const method = type === 'note' ? 'PATCH' : 'POST';
    let payload = {};
    if (type === 'price') {
      const decimal = Number(actionForm.unitPrice);
      if (!Number.isFinite(decimal) || decimal < 0) return setError('Enter a valid unit price.');
      payload = {
        unitPriceCents: Math.round((decimal + Number.EPSILON) * 100),
        currency: actionForm.currency,
        validityDate: actionForm.validityDate || null,
        leadTime: actionForm.leadTime,
        notes: actionForm.notes
      };
    } else if (type === 'decline') payload = { reason: actionForm.reason };
    else if (type === 'reassign') payload = { requestedFrom: actionForm.requestedFrom, pendingNote: actionForm.pendingNote };
    else if (type === 'note') payload = { pendingNote: actionForm.pendingNote };
    else if (type === 'link') payload = { quotationId: actionForm.quotationId };

    setSaving(true);
    setError('');
    try {
      const { response, data } = await apiRequest(`/api/price-requests/${item._id}/${endpointMap[type]}`, {
        method,
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(data.message || 'Action failed.');
      setAction(null);
      flash(data.message || 'Saved.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openRuleEditor = (rule = null) => {
    setEditingRule(rule);
    setRuleForm(rule ? {
      label: rule.label,
      ruleType: rule.ruleType,
      matchValues: rule.matchValues || [],
      assignee: getId(rule.assignee),
      active: rule.active
    } : EMPTY_RULE);
    setError('');
  };

  const ruleValueOptions = ruleForm.ruleType === 'brand'
    ? ROUTABLE_BRANDS
    : ruleForm.ruleType === 'category'
      ? ['Servers']
      : ['Desktops/Laptops/Workstations'];

  const toggleRuleValue = (value) => {
    setRuleForm((current) => ({
      ...current,
      matchValues: current.matchValues.includes(value)
        ? current.matchValues.filter((entry) => entry !== value)
        : [...current.matchValues, value]
    }));
  };

  const saveRule = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const path = editingRule
        ? `/api/price-requests/routing-rules/${editingRule._id}`
        : '/api/price-requests/routing-rules';
      const { response, data } = await apiRequest(path, {
        method: editingRule ? 'PATCH' : 'POST',
        body: JSON.stringify(ruleForm)
      });
      if (!response.ok) throw new Error(data.message || 'Could not save routing rule.');
      setEditingRule(null);
      setRuleForm(EMPTY_RULE);
      flash(data.message || 'Routing rule saved.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRuleActive = async (rule) => {
    setError('');
    const { response, data } = await apiRequest(`/api/price-requests/routing-rules/${rule._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !rule.active })
    });
    if (!response.ok) return setError(data.message || 'Could not update routing rule.');
    flash(data.message || 'Routing rule updated.');
    return loadData();
  };

  const deleteRule = async (rule) => {
    if (rule.active) return setError('Deactivate the routing rule before deleting it.');
    if (!window.confirm(`Delete routing rule “${rule.label}”? This cannot be undone.`)) return undefined;
    setError('');
    const { response, data } = await apiRequest(`/api/price-requests/routing-rules/${rule._id}`, {
      method: 'DELETE'
    });
    if (!response.ok) return setError(data.message || 'Could not delete routing rule.');
    if (getId(editingRule) === getId(rule)) openRuleEditor();
    flash(data.message || 'Routing rule deleted.');
    return loadData();
  };

  const isRequester = (item) => getId(item.requestedBy) === currentUserId;
  const isRecipient = (item) => getId(item.requestedFrom) === currentUserId;
  const canReassign = (item) => isRequester(item) || isRecipient(item) || canManageRules;

  return (
    <div className="pr-page">
      <div className="pr-page-header">
        <div>
          <h2><CircleDollarSign size={24} /> Price Requests</h2>
          <p>User-to-user pricing, routing and follow-through.</p>
        </div>
        <div className="pr-header-actions">
          {canManageRules && (
            <button className="pr-btn secondary" onClick={() => { setShowRules(true); openRuleEditor(); }}>
              <Settings2 size={16} /> Routing rules
            </button>
          )}
          <button className="pr-btn secondary" onClick={loadData}><RefreshCw size={16} /> Refresh</button>
          <button className="pr-btn primary" onClick={openCreate}><Plus size={16} /> New request</button>
        </div>
      </div>

      {notice && <div className="pr-alert success">{notice}</div>}
      {error && !showCreate && !action && !showRules && <div className="pr-alert error">{error}</div>}

      <div className="pr-stats">
        {['Pending', 'Priced', 'Declined'].map((status) => (
          <button key={status} className={`pr-stat ${filters.status === status ? 'active' : ''}`} onClick={() => setFilters((f) => ({ ...f, status: f.status === status ? '' : status }))}>
            <span>{statusCounts[status]}</span>
            <small>{status}</small>
          </button>
        ))}
        <div className="pr-stat age"><Clock3 size={22} /><small>Pending ages shown in days</small></div>
      </div>

      <div className="pr-summary-grid">
        <section>
          <h3>Pending by person</h3>
          <div className="pr-chips">
            {(summary.pendingByPerson || []).length === 0 && <span className="pr-muted">None pending</span>}
            {(summary.pendingByPerson || []).map((entry) => <span className="pr-chip" key={getId(entry.user)}>{entry.user?.fullName}: {entry.count}</span>)}
          </div>
        </section>
        <section>
          <h3>Pending by category</h3>
          <div className="pr-chips">
            {(summary.pendingByCategory || []).length === 0 && <span className="pr-muted">None pending</span>}
            {(summary.pendingByCategory || []).map((entry) => <span className="pr-chip" key={entry.name}>{entry.name}: {entry.count}</span>)}
          </div>
        </section>
      </div>

      <div className="pr-filters">
        <ListFilter size={17} />
        <input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Search request, customer, part or person…" />
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option>Pending</option><option>Priced</option><option>Declined</option>
        </select>
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All categories</option>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
      </div>

      <div className="pr-table-wrap">
        {loading ? <div className="pr-empty">Loading price requests…</div> : filteredRequests.length === 0 ? <div className="pr-empty">No price requests match the filters.</div> : (
          <table className="pr-table">
            <thead><tr><th>Request</th><th>Requirement</th><th>Requested by / from</th><th>Status</th><th>Price / reason</th><th>Quotation</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredRequests.map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.requestNumber}</strong><small>{item.brand} · {item.category}{item.isBulk ? ' · Bulk' : ''}</small><small>{item.customerName || item.reference || 'No customer/reference'}</small></td>
                  <td><strong>{item.requirement}</strong><small>Qty {item.quantity}{item.partNumber ? ` · ${item.partNumber}` : ''}</small>{item.status === 'Pending' && <span className="pr-note">{item.pendingNote || 'Awaiting response'} · {item.pendingAgeDays} day(s)</span>}</td>
                  <td><span>{item.requestedBy?.fullName || 'Unknown'}</span><small>from {item.requestedFrom?.fullName || 'Unknown'}</small></td>
                  <td><span className={`pr-status ${item.status.toLowerCase()}`}>{item.status}</span></td>
                  <td>{item.status === 'Priced' ? <><strong>{item.currency} {(Number(item.unitPriceCents || 0) / 100).toFixed(2)}</strong><small>{item.validityDate ? `Valid to ${new Date(item.validityDate).toLocaleDateString()}` : 'No validity date'}{item.leadTime ? ` · ${item.leadTime}` : ''}</small></> : item.status === 'Declined' ? <span>{item.declineReason}</span> : <span className="pr-muted">Waiting</span>}</td>
                  <td>{item.quotationId ? <span className="pr-linked"><Link2 size={13} /> {item.quotationId.orderReference || item.quotationId.quotationNumber}</span> : '—'}</td>
                  <td><div className="pr-row-actions">
                    {item.status === 'Pending' && isRecipient(item) && <><button onClick={() => openAction('price', item)}>Price</button><button onClick={() => openAction('decline', item)}>Decline</button></>}
                    {item.status === 'Pending' && canReassign(item) && <button onClick={() => openAction('reassign', item)}><ArrowRightLeft size={13} /> Reassign</button>}
                    {item.status === 'Pending' && canReassign(item) && <button onClick={() => openAction('note', item)}>Note</button>}
                    {item.status === 'Priced' && isRequester(item) && <button onClick={() => openAction('link', item)}><Link2 size={13} /> {item.quotationId ? 'Change link' : 'Link quotation'}</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="pr-modal-backdrop"><div className="pr-modal wide">
          <div className="pr-modal-title"><div><h3>New price request</h3><p>The suggested recipient can always be changed.</p></div><button onClick={() => setShowCreate(false)}><X /></button></div>
          {error && <div className="pr-alert error">{error}</div>}
          <form onSubmit={submitCreate} className="pr-form-grid">
            <label>Category<select value={requestForm.category} onChange={(e) => { setRecipientTouched(false); setRequestForm((f) => ({ ...f, category: e.target.value })); }}>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Brand<select value={requestForm.brandChoice} onChange={(e) => { setRecipientTouched(false); setRequestForm((f) => ({ ...f, brandChoice: e.target.value })); }}>{BRANDS.map((value) => <option key={value}>{value}</option>)}</select></label>
            {requestForm.brandChoice === 'Other' && <label>Other brand<input required value={requestForm.otherBrand} onChange={(e) => setRequestForm((f) => ({ ...f, otherBrand: e.target.value }))} /></label>}
            <label className="pr-checkbox"><input type="checkbox" checked={requestForm.isBulk} onChange={(e) => { setRecipientTouched(false); setRequestForm((f) => ({ ...f, isBulk: e.target.checked })); }} /> Bulk requirement</label>
            <label>Customer name (optional)<input value={requestForm.customerName} onChange={(e) => setRequestForm((f) => ({ ...f, customerName: e.target.value }))} /></label>
            <label>Reference (optional)<input value={requestForm.reference} onChange={(e) => setRequestForm((f) => ({ ...f, reference: e.target.value }))} /></label>
            <label>Part number / model (optional)<input value={requestForm.partNumber} onChange={(e) => setRequestForm((f) => ({ ...f, partNumber: e.target.value }))} /></label>
            <label>Quantity<input required type="number" min="1" step="1" value={requestForm.quantity} onChange={(e) => setRequestForm((f) => ({ ...f, quantity: e.target.value }))} /></label>
            <label className="span-2">Requirement<textarea required rows="4" value={requestForm.requirement} onChange={(e) => setRequestForm((f) => ({ ...f, requirement: e.target.value }))} /></label>
            <label className="span-2">Request from<select required value={requestForm.requestedFrom} onChange={(e) => { setRecipientTouched(true); setRequestForm((f) => ({ ...f, requestedFrom: e.target.value })); }}><option value="">Select a person</option>{eligibleUsers.map((user) => <option value={getId(user)} key={getId(user)}>{userLabel(user)}</option>)}</select>{suggestion?.assignee && <small>Suggested by “{suggestion.rule?.label}”: {userLabel(suggestion.assignee)}</small>}{!suggestion && <small>No matching rule. Pick a person.</small>}</label>
            <label className="span-2">Pending status note (optional)<input value={requestForm.pendingNote} onChange={(e) => setRequestForm((f) => ({ ...f, pendingNote: e.target.value }))} placeholder="Defaults to awaiting price from the recipient" /></label>
            <div className="pr-modal-actions span-2"><button type="button" className="pr-btn secondary" onClick={() => setShowCreate(false)}>Cancel</button><button disabled={saving} className="pr-btn primary">{saving ? 'Creating…' : 'Create request'}</button></div>
          </form>
        </div></div>
      )}

      {action && (
        <div className="pr-modal-backdrop"><div className="pr-modal">
          <div className="pr-modal-title"><div><h3>{action.type === 'price' ? 'Provide price' : action.type === 'decline' ? 'Cannot price' : action.type === 'reassign' ? 'Reassign request' : action.type === 'note' ? 'Update pending note' : 'Link quotation'}</h3><p>{action.item.requestNumber} · {action.item.requirement}</p></div><button onClick={() => setAction(null)}><X /></button></div>
          {error && <div className="pr-alert error">{error}</div>}
          <form onSubmit={submitAction} className="pr-form-grid one">
            {action.type === 'price' && <>
              <label>Unit price<input required type="number" min="0" step="0.01" value={actionForm.unitPrice} onChange={(e) => setActionForm((f) => ({ ...f, unitPrice: e.target.value }))} /></label>
              <label>Currency<select required value={actionForm.currency} onChange={(e) => setActionForm((f) => ({ ...f, currency: e.target.value }))}>{CURRENCIES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label>Validity date (optional)<input type="date" value={actionForm.validityDate} onChange={(e) => setActionForm((f) => ({ ...f, validityDate: e.target.value }))} /></label>
              <label>Lead time (optional)<input value={actionForm.leadTime} onChange={(e) => setActionForm((f) => ({ ...f, leadTime: e.target.value }))} /></label>
              <label>Notes (optional)<textarea rows="3" value={actionForm.notes} onChange={(e) => setActionForm((f) => ({ ...f, notes: e.target.value }))} /></label>
            </>}
            {action.type === 'decline' && <label>Reason<textarea required rows="4" value={actionForm.reason} onChange={(e) => setActionForm((f) => ({ ...f, reason: e.target.value }))} /></label>}
            {action.type === 'reassign' && <><label>New recipient<select required value={actionForm.requestedFrom} onChange={(e) => setActionForm((f) => ({ ...f, requestedFrom: e.target.value }))}>{eligibleUsers.map((user) => <option value={getId(user)} key={getId(user)}>{userLabel(user)}</option>)}</select></label><label>Pending note<textarea required rows="3" value={actionForm.pendingNote} onChange={(e) => setActionForm((f) => ({ ...f, pendingNote: e.target.value }))} /></label></>}
            {action.type === 'note' && <label>Pending note<textarea required rows="4" value={actionForm.pendingNote} onChange={(e) => setActionForm((f) => ({ ...f, pendingNote: e.target.value }))} /></label>}
            {action.type === 'link' && <><div className="pr-quote-search"><input value={quotationSearch} onChange={(e) => setQuotationSearch(e.target.value)} placeholder="Quotation number or customer" /><button type="button" onClick={searchQuotations}><Search size={15} /> Search</button></div><label>Quotation<select required value={actionForm.quotationId} onChange={(e) => setActionForm((f) => ({ ...f, quotationId: e.target.value }))}><option value="">Select quotation</option>{quotations.map((quote) => <option key={quote._id} value={quote._id}>{quote.orderReference || quote.quotationNumber || 'No number'} — {quote.clientName}</option>)}</select></label></>}
            <div className="pr-modal-actions"><button type="button" className="pr-btn secondary" onClick={() => setAction(null)}>Cancel</button><button disabled={saving} className="pr-btn primary">{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </div></div>
      )}

      {showRules && canManageRules && (
        <div className="pr-drawer-backdrop"><aside className="pr-drawer">
          <div className="pr-modal-title"><div><h3><Route size={20} /> Routing rules</h3><p>Server category wins, then Bulk, then Brand.</p></div><button onClick={() => setShowRules(false)}><X /></button></div>
          {error && <div className="pr-alert error">{error}</div>}
          <div className="pr-rule-list">
            {rules.map((rule) => <div className="pr-rule" key={rule._id}><div><strong>{rule.label}</strong><small>{rule.ruleType} · {rule.matchValues.join(', ')} · priority {rule.priority}</small><small>{userLabel(rule.assignee)}</small></div><div><button onClick={() => openRuleEditor(rule)}>Edit</button><button onClick={() => toggleRuleActive(rule)}>{rule.active ? 'Deactivate' : 'Activate'}</button>{!rule.active && <button className="danger" onClick={() => deleteRule(rule)}>Delete</button>}</div></div>)}
            {rules.length === 0 && <div className="pr-empty">No rules yet. Create the six approved routing rules below.</div>}
          </div>
          <form onSubmit={saveRule} className="pr-rule-form">
            <h4>{editingRule ? 'Edit rule' : 'Create rule'}</h4>
            <label>Label<input required value={ruleForm.label} onChange={(e) => setRuleForm((f) => ({ ...f, label: e.target.value }))} /></label>
            <label>Rule type<select value={ruleForm.ruleType} onChange={(e) => setRuleForm((f) => ({ ...f, ruleType: e.target.value, matchValues: [] }))}><option value="category">Server category override</option><option value="bulkCategory">Bulk category override</option><option value="brand">Brand</option></select></label>
            <fieldset><legend>Match values</legend>{ruleValueOptions.map((value) => <label className="pr-checkbox" key={value}><input type="checkbox" checked={ruleForm.matchValues.includes(value)} onChange={() => toggleRuleValue(value)} /> {value}</label>)}</fieldset>
            <label>Route to<select required value={ruleForm.assignee} onChange={(e) => setRuleForm((f) => ({ ...f, assignee: e.target.value }))}><option value="">Select a person</option>{eligibleUsers.map((user) => <option value={getId(user)} key={getId(user)}>{userLabel(user)}</option>)}</select></label>
            <label className="pr-checkbox"><input type="checkbox" checked={ruleForm.active} onChange={(e) => setRuleForm((f) => ({ ...f, active: e.target.checked }))} /> Active</label>
            <div className="pr-modal-actions"><button type="button" className="pr-btn secondary" onClick={() => openRuleEditor()}>Clear</button><button disabled={saving} className="pr-btn primary"><Check size={15} /> {editingRule ? 'Update' : 'Create'} rule</button></div>
          </form>
        </aside></div>
      )}
    </div>
  );
}

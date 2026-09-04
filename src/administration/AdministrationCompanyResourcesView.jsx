import React, { useState, useEffect } from 'react';
import { Package, Laptop, Key, ShieldCheck, Plus, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './AdministrationCompanyResourcesView.css';

export default function AdministrationCompanyResourcesView() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  // Register Asset Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Hardware');
  const [assignedTo, setAssignedTo] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('In Use');
  const [department, setDepartment] = useState('All');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/administration/company-resources');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setAssets(data.data);
      }
    } catch (err) {
      console.error('Fetch company assets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleRegisterAssetSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setAlert(null);

    try {
      const { response, data } = await apiRequest('/api/administration/company-resources', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          type: type || 'Hardware',
          assignedTo: assignedTo ? assignedTo.trim() : 'Unassigned',
          serialNumber: serialNumber ? serialNumber.trim() : `AST-${Math.floor(1000 + Math.random() * 9000)}`,
          status: status || 'In Use',
          department: department || 'All',
          description: description ? description.trim() : ''
        })
      });

      if (response.ok && data.success) {
        setAlert({ type: 'success', text: 'Asset successfully registered and saved to MongoDB!' });
        setTitle('');
        setAssignedTo('');
        setSerialNumber('');
        setDescription('');
        fetchAssets();
        setTimeout(() => {
          setIsModalOpen(false);
          setAlert(null);
        }, 1200);
      } else {
        setAlert({ type: 'error', text: data.message || 'Failed to register asset.' });
      }
    } catch (err) {
      console.error('Register asset error:', err);
      setAlert({ type: 'error', text: 'Server error registering asset.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-emp-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span>Company Assets & Equipment Inventory</span>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>Real MongoDB Asset Records</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchAssets}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#475569' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              className="ceo-add-btn"
              onClick={() => { setIsModalOpen(true); setAlert(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Register Asset
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading asset inventory...</div>
        ) : (
          <div className="ceo-table-wrapper" style={{ marginTop: '16px' }}>
            <table className="ceo-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Assigned User / Team</th>
                  <th>Serial / License ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((ast) => (
                  <tr key={ast._id}>
                    <td className="ceo-table-name">{ast.title}</td>
                    <td>{ast.type}</td>
                    <td>{ast.assignedTo || 'Unassigned'}</td>
                    <td><code className="admin-serial-code">{ast.serialNumber || '—'}</code></td>
                    <td>
                      <span className={`ceo-status-tag ${ast.status === 'Active' || ast.status === 'In Use' ? 'active' : ast.status === 'Maintenance' ? 'warning' : 'neutral'}`}>
                        {ast.status || 'In Use'}
                      </span>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                      No registered company assets found. Click "+ Register Asset" above to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Asset Modal */}
      {isModalOpen && (
        <div className="reg-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="reg-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', backgroundColor: '#1E293B', color: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#38BDF8" />
                Register Company Asset
              </h3>
              <X size={18} style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => setIsModalOpen(false)} />
            </div>

            {alert && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '14px',
                backgroundColor: alert.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${alert.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                color: alert.type === 'success' ? '#6EE7B7' : '#FCA5A5',
                fontSize: '0.85rem'
              }}>
                {alert.text}
              </div>
            )}

            <form onSubmit={handleRegisterAssetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Asset Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple MacBook Pro M3 16&quot;"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Document">Document</option>
                    <option value="Policy">Policy</option>
                    <option value="Template">Template</option>
                    <option value="Asset">Asset</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                  >
                    <option value="In Use">In Use</option>
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Available">Available</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Serial / License ID</label>
                  <input
                    type="text"
                    placeholder="e.g. MBP-2026-9901"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Assigned User / Team</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Mitchell"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Asset specifications, model details, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', padding: '10px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="reg-btn-view" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="reg-btn-approve" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
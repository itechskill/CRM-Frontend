import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Download,
  Send,
  X,
  CreditCard,
  Building2,
  FileCheck,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import './AccountantViews.css';

export default function AccountantPayrollView({ isModalOpen, onCloseModal }) {
  const [payrollList, setPayrollList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Edit form state
  const [editBaseSalary, setEditBaseSalary] = useState(0);
  const [editBonus, setEditBonus] = useState(0);
  const [editTax, setEditTax] = useState(0);
  const [editStatus, setEditStatus] = useState('Pending');
  const [editNotes, setEditNotes] = useState('');

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/finance/payroll');
      if (response.ok && data.success) {
        setPayrollList(data.data || []);
      }
    } catch (err) {
      console.error('Fetch payroll error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setEditBaseSalary(rec.baseSalary || 0);
    setEditBonus(rec.bonus || 0);
    setEditTax(rec.taxDeduction || 0);
    setEditStatus(rec.status || 'Pending');
    setEditNotes(rec.notes || '');
    setErrorMessage('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecord?._id) return;
    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        baseSalary: Number(editBaseSalary) || 0,
        bonus: Number(editBonus) || 0,
        taxDeduction: Number(editTax) || 0,
        status: editStatus,
        notes: editNotes
      };

      const { response, data } = await apiRequest(`/api/finance/payroll/${editingRecord._id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (response.ok && data.success) {
        setEditingRecord(null);
        await fetchPayroll();
      } else {
        setErrorMessage(data.message || 'Failed to update payroll record.');
      }
    } catch (err) {
      setErrorMessage('Server connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    setSubmitting(true);
    try {
      const { response, data } = await apiRequest(`/api/finance/payroll/${id}`, {
        method: 'DELETE'
      });
      if (response.ok && data.success) {
        setDeletingRecord(null);
        fetchPayroll();
      }
    } catch (err) {
      console.error('Delete payroll error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessBatch = async () => {
    setSubmitting(true);
    try {
      // Mark all pending as Processed via PATCH requests
      const pendingList = payrollList.filter(p => p.status === 'Pending');
      await Promise.all(
        pendingList.map(p =>
          apiRequest(`/api/finance/payroll/${p._id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Processed' })
          })
        )
      );
      fetchPayroll();
      alert('Payroll batch disbursement processed successfully!');
      if (onCloseModal) onCloseModal();
    } catch (err) {
      alert('Error processing payroll batch.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPayrollSlipPDF = (empPayroll) => {
    const doc = new jsPDF();
    const user = empPayroll.user || {};
    const empName = user.fullName || 'Employee';
    const dept = user.department || 'General';
    const role = user.role || 'Staff';
    const empId = user.employeeId || empPayroll._id?.slice(-6) || 'EMP-100';

    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237);
    doc.text('NexusCRM Enterprise Payroll Slip', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Disbursement Month: August 2026`, 14, 28);
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 34);

    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 38, 196, 38);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Employee Information:', 14, 46);

    const infoRows = [
      ['Employee ID', empId, 'Department', dept],
      ['Full Name', empName, 'Job Title / Role', role],
      ['Email', user.email || '—', 'Disbursement Status', empPayroll.status || 'Pending']
    ];

    autoTable(doc, {
      startY: 50,
      body: infoRows,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 }
    });

    const finalY1 = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Salary & Deductions Statement:', 14, finalY1);

    const salaryRows = [
      ['Base Monthly Salary', `Rs. ${(empPayroll.baseSalary || 0).toLocaleString()}`],
      ['Performance Bonus / Allowances', `+Rs. ${(empPayroll.bonus || 0).toLocaleString()}`],
      ['Tax & Benefit Deductions', `-Rs. ${(empPayroll.taxDeduction || 0).toLocaleString()}`],
      ['Total Net Salary Disbursed', `Rs. ${(empPayroll.netPay || 0).toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: finalY1 + 4,
      head: [['Component', 'Amount (PKR)']],
      body: salaryRows,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 }
    });

    doc.save(`Payroll_Slip_${empName.replace(/[^a-zA-Z0-9]/g, '_')}_Aug2026.pdf`);
  };

  const totalGross = payrollList.reduce((sum, emp) => sum + (emp.baseSalary || 0) + (emp.bonus || 0), 0);
  const totalTaxes = payrollList.reduce((sum, emp) => sum + (emp.taxDeduction || 0), 0);
  const totalNet = payrollList.reduce((sum, emp) => sum + (emp.netPay || 0), 0);
  const processedCount = payrollList.filter(emp => emp.status === 'Processed').length;

  return (
    <div className="acc-view-container">
      {/* Page Header */}
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Payroll & Employee Compensation (PKR)</h2>
          <p>Real-time monthly salary disbursements in PKR, tax withholdings, and payroll slips backed by MongoDB.</p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="acc-kpi-grid">
        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Monthly Net Pay</span>
            <div className="acc-kpi-icon emerald"><DollarSign size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalNet.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">{payrollList.length} Registered Staff Records</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Tax & Benefits Withheld</span>
            <div className="acc-kpi-icon blue"><Building2 size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalTaxes.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">Government & insurance remittances</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Processed Batch</span>
            <div className="acc-kpi-icon teal"><CheckCircle size={18} /></div>
          </div>
          <div className="acc-kpi-value">{processedCount} / {payrollList.length}</div>
          <div className="acc-kpi-subtitle up">Disbursement Status</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Gross Budget</span>
            <div className="acc-kpi-icon purple"><CreditCard size={18} /></div>
          </div>
          <div className="acc-kpi-value">Rs. {totalGross.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">Base + Performance Bonuses</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="acc-card">
        <div className="acc-card-header">
          <div>
            <h3 className="acc-card-title">Employee Salary Ledger (PKR — Real DB Data)</h3>
            <p className="acc-card-desc">Individual pay stubs, bonus calculations, and disbursement status</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="acc-btn-secondary" onClick={fetchPayroll} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="acc-btn-primary" onClick={handleProcessBatch} disabled={submitting}>
              <FileCheck size={16} /> Process Payroll Batch
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading registered employee payroll...</div>
        ) : (
          <div className="acc-table-wrapper">
            <table className="acc-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Base Salary (PKR)</th>
                  <th>Bonus (PKR)</th>
                  <th>Tax Withheld (PKR)</th>
                  <th>Net Pay (PKR)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollList.map((emp) => {
                  const user = emp.user || {};
                  const empId = user.employeeId || emp._id?.slice(-6) || 'EMP-100';
                  return (
                    <tr key={emp._id}>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{empId}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>{user.fullName || 'Employee'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{user.role || 'Staff'}</div>
                      </td>
                      <td>{user.department || 'General'}</td>
                      <td>Rs. {(emp.baseSalary || 0).toLocaleString()}</td>
                      <td style={{ color: '#059669', fontWeight: 600 }}>+Rs. {(emp.bonus || 0).toLocaleString()}</td>
                      <td style={{ color: '#DC2626' }}>-Rs. {(emp.taxDeduction || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Rs. {(emp.netPay || 0).toLocaleString()}</td>
                      <td>
                        <span className={`acc-badge ${(emp.status || 'Pending').toLowerCase()}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => openEditModal(emp)}
                            style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Salary Details"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button
                            onClick={() => downloadPayrollSlipPDF(emp)}
                            style={{ border: 'none', background: '#F3E8FF', color: '#7C3AED', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Export Payroll Slip PDF"
                          >
                            <Download size={12} /> Slip
                          </button>
                          <button
                            onClick={() => setDeletingRecord(emp)}
                            style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Delete Payroll Record"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {payrollList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                      No payroll records found for registered employees.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Payroll Modal */}
      {editingRecord && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <h3>Edit Payroll (PKR) — {editingRecord.user?.fullName}</h3>
              <button className="acc-modal-close" onClick={() => setEditingRecord(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="acc-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Base Salary (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      value={editBaseSalary}
                      onChange={(e) => setEditBaseSalary(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Bonus (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      value={editBonus}
                      onChange={(e) => setEditBonus(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Tax & Deductions (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      value={editTax}
                      onChange={(e) => setEditTax(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Status</label>
                    <select
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processed">Processed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Notes</label>
                  <input
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Salary adjustment notes..."
                  />
                </div>

                <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                  <strong>Calculated Net Pay: </strong>
                  <span style={{ color: '#059669', fontWeight: 700 }}>
                    Rs. {((Number(editBaseSalary) || 0) + (Number(editBonus) || 0) - (Number(editTax) || 0)).toLocaleString()}
                  </span>
                </div>

                {errorMessage && (
                  <div style={{ marginTop: '10px', color: '#DC2626', fontSize: '0.85rem' }}>{errorMessage}</div>
                )}
              </div>

              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={() => setEditingRecord(null)} disabled={submitting}>Cancel</button>
                <button type="submit" className="acc-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Payroll Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="acc-modal-body" style={{ paddingTop: '24px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>Delete Payroll Record?</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                Are you sure you want to delete the payroll record for {deletingRecord.user?.fullName}?
              </p>
            </div>
            <div className="acc-modal-footer" style={{ justifyContent: 'center' }}>
              <button className="acc-btn-secondary" onClick={() => setDeletingRecord(null)} disabled={submitting}>Cancel</button>
              <button className="acc-btn-primary" style={{ backgroundColor: '#DC2626' }} onClick={() => handleDeleteRecord(deletingRecord._id)} disabled={submitting}>
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

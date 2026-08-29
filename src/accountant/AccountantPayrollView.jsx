import React, { useState } from 'react';
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
  FileCheck
} from 'lucide-react';
import './AccountantViews.css';

const initialPayrollList = [
  { id: 'EMP-101', name: 'Sarah Mitchell', role: 'Sales Manager', department: 'Sales', baseSalary: 8500, bonus: 1200, taxDeduction: 1455, netPay: 8245, status: 'Processed' },
  { id: 'EMP-102', name: 'Daniel Torres', role: 'Project Lead', department: 'Operations', baseSalary: 9200, bonus: 800, taxDeduction: 1500, netPay: 8500, status: 'Processed' },
  { id: 'EMP-103', name: 'Aisha Nkosi', role: 'Account Executive', department: 'Sales', baseSalary: 7200, bonus: 1500, taxDeduction: 1305, netPay: 7395, status: 'Processed' },
  { id: 'EMP-104', name: 'Marcus Chen', role: 'Senior Developer', department: 'Engineering', baseSalary: 10500, bonus: 0, taxDeduction: 1575, netPay: 8925, status: 'Pending' },
  { id: 'EMP-105', name: 'Elena Rostova', role: 'UX Director', department: 'Design', baseSalary: 9800, bonus: 500, taxDeduction: 1545, netPay: 8755, status: 'Pending' },
  { id: 'EMP-106', name: 'Sami Vance', role: 'HR Lead', department: 'Human Resources', baseSalary: 8000, bonus: 400, taxDeduction: 1260, netPay: 7140, status: 'Processed' },
];

export default function AccountantPayrollView({ isModalOpen, onCloseModal }) {
  const [payrollList, setPayrollList] = useState(initialPayrollList);

  const handleProcessBatch = () => {
    setPayrollList(payrollList.map(emp => ({ ...emp, status: 'Processed' })));
    alert('Payroll batch disbursement submitted successfully to bank gateway!');
    if (onCloseModal) onCloseModal();
  };

  const totalGross = payrollList.reduce((sum, emp) => sum + emp.baseSalary + emp.bonus, 0);
  const totalTaxes = payrollList.reduce((sum, emp) => sum + emp.taxDeduction, 0);
  const totalNet = payrollList.reduce((sum, emp) => sum + emp.netPay, 0);
  const processedCount = payrollList.filter(emp => emp.status === 'Processed').length;

  return (
    <div className="acc-view-container">
      {/* Page Header */}
      <div className="acc-page-header">
        <div className="acc-page-header-title">
          <h2>Payroll & Employee Compensation</h2>
          <p>Monthly salary disbursements, tax withholdings, benefits administration, and direct deposits.</p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="acc-kpi-grid">
        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Monthly Net Pay</span>
            <div className="acc-kpi-icon emerald"><DollarSign size={18} /></div>
          </div>
          <div className="acc-kpi-value">${totalNet.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">{payrollList.length} Active staff payroll</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Tax & Benefits Withheld</span>
            <div className="acc-kpi-icon blue"><Building2 size={18} /></div>
          </div>
          <div className="acc-kpi-value">${totalTaxes.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">Government & insurance remittances</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Processed Batch</span>
            <div className="acc-kpi-icon teal"><CheckCircle size={18} /></div>
          </div>
          <div className="acc-kpi-value">{processedCount} / {payrollList.length}</div>
          <div className="acc-kpi-subtitle up">August 2026 Salary Batch</div>
        </div>

        <div className="acc-kpi-card">
          <div className="acc-kpi-top">
            <span className="acc-kpi-title">Total Gross Budget</span>
            <div className="acc-kpi-icon purple"><CreditCard size={18} /></div>
          </div>
          <div className="acc-kpi-value">${totalGross.toLocaleString()}</div>
          <div className="acc-kpi-subtitle">Base + Performance Bonuses</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="acc-card">
        <div className="acc-card-header">
          <div>
            <h3 className="acc-card-title">Employee Salary Ledger - August 2026</h3>
            <p className="acc-card-desc">Individual pay stubs, bonus calculations, and disbursement status</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="acc-btn-secondary" onClick={() => alert('Downloading PDF Payslip Package...')}>
              <Download size={16} /> Export Payslips
            </button>
            <button className="acc-btn-primary" onClick={handleProcessBatch}>
              <FileCheck size={16} /> Process Payroll Batch
            </button>
          </div>
        </div>

        <div className="acc-table-wrapper">
          <table className="acc-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Base Salary</th>
                <th>Bonus / Allow</th>
                <th>Tax Withheld</th>
                <th>Net Pay ($)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollList.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{emp.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{emp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{emp.role}</div>
                  </td>
                  <td>{emp.department}</td>
                  <td>${emp.baseSalary.toLocaleString()}</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>+${emp.bonus.toLocaleString()}</td>
                  <td style={{ color: '#DC2626' }}>-${emp.taxDeduction.toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>${emp.netPay.toLocaleString()}</td>
                  <td>
                    <span className={`acc-badge ${emp.status.toLowerCase()}`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Run Modal */}
      {isModalOpen && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-content">
            <div className="acc-modal-header">
              <h3>Confirm Payroll Batch Run</h3>
              <button className="acc-modal-close" onClick={onCloseModal}><X size={18} /></button>
            </div>
            <div className="acc-modal-body">
              <p style={{ color: '#334155', fontSize: '0.9rem' }}>
                You are about to execute the August 2026 direct deposit disbursement for <strong>{payrollList.length} employees</strong>.
              </p>
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Gross Salary:</span>
                  <strong>${totalGross.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Total Tax Deductions:</span>
                  <strong style={{ color: '#DC2626' }}>-${totalTaxes.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #CBD5E1', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  <span>Total Bank Transfer:</span>
                  <span style={{ color: '#059669' }}>${totalNet.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={onCloseModal}>Cancel</button>
              <button className="acc-btn-primary" onClick={handleProcessBatch}>Confirm & Authorize Payroll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

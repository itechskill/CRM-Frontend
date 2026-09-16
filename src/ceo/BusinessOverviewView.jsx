import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  Receipt,
  Calculator,
  Heart,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiRequest } from '../utils/api';
import './BusinessOverviewView.css';

export default function BusinessOverviewView() {
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [deptStats, setDeptStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [execRes, deptRes, usersRes] = await Promise.all([
        apiRequest('/api/admin/executive-summary'),
        apiRequest('/api/admin/org/departments'),
        apiRequest('/api/admin/directory')
      ]);

      if (execRes.response.ok && execRes.data.success) {
        setExecutiveSummary(execRes.data.data);
      }
      if (deptRes.response.ok && deptRes.data.success) {
        setDeptStats(deptRes.data.data);
      }
      if (usersRes.response.ok && usersRes.data.success) {
        setUsersList(usersRes.data.data || []);
      }
    } catch (err) {
      console.error('Fetch CEO business overview error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const downloadDepartmentPDF = (deptName, metrics, employeeList) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text('Fortline CRM - Executive Department Overview', 14, 18);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Department: ${deptName}`, 14, 26);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Exported Date: ${new Date().toLocaleString()}`, 14, 32);

    // Summary Metrics Section
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Departmental Metrics Summary:', 14, 40);

    const metricRows = metrics.map(m => [m.label, String(m.value)]);
    autoTable(doc, {
      startY: 44,
      head: [['Metric', 'Value']],
      body: metricRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 }
    });

    // Employee Roster Section if available
    if (employeeList && employeeList.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text('Active Department Personnel:', 14, finalY);

      const empRows = employeeList.map(e => [
        e.fullName || 'Staff',
        e.email || '—',
        (e.role || '').replace('_', ' ').toUpperCase(),
        e.department || deptName,
        (e.status || 'Active').toUpperCase()
      ]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [['Name', 'Email', 'Role', 'Department', 'Status']],
        body: empRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`${deptName.replace(/[^a-zA-Z0-9]/g, '_')}_Department_Overview.pdf`);
  };

  const data = executiveSummary || {};
  const depts = deptStats || {};

  const departmentCards = [
    {
      domain: 'Sales Department',
      deptCode: 'Sales',
      icon: TrendingUp,
      color: '#16A34A',
      metrics: [
        { label: 'Active Sales Team', value: `${data.salesTeamCount || 0} members` },
        { label: 'Total Leads Registered', value: `${data.totalLeads || 0} leads` },
        { label: 'Active Quotations', value: `${data.activeQuotations || 0} active` },
        { label: 'Total Sales Orders', value: `${data.salesOrders || 0} orders` },
        { label: 'Orders Finance Approved', value: `${data.ordersFinanceApproved || 0} orders` }
      ],
      employees: usersList.filter(u => ['sales_manager', 'sales_member', 'sales_rep', 'sales_person'].includes(u.role) || (u.department || '').toLowerCase().includes('sale'))
    },
    {
      domain: 'Support & Operations',
      deptCode: 'Support',
      icon: Briefcase,
      color: '#0284C7',
      metrics: [
        { label: 'Support Team Members', value: `${data.supportTeamCount || 0} staff` },
        { label: 'Sales Orders Received', value: `${data.salesOrdersReceived || 0} orders` },
        { label: 'Delivery Notes Created', value: `${data.totalDeliveryNotes || 0} notes` },
        { label: 'Confirmed / Completed DNs', value: `${data.confirmedDeliveryNotes || 0} completed` },
        { label: 'Pending Delivery Notes', value: `${data.pendingDeliveryNotes || 0} pending` }
      ],
      employees: usersList.filter(u => u.role === 'support' || (u.department || '').toLowerCase().includes('support'))
    },
    {
      domain: 'Accounts Department',
      deptCode: 'Accounts',
      icon: Receipt,
      color: '#D97706',
      metrics: [
        { label: 'Accounts Team Members', value: `${data.accountsTeamCount || 0} accountants` },
        { label: 'Delivery Notes Received', value: `${data.deliveryNotesReceived || 0} notes` },
        { label: 'Draft Invoices Created', value: `${data.draftInvoices || 0} drafts` },
        { label: 'Draft Invoices Total Value', value: `PKR ${(data.draftInvoicesAmount || 0).toLocaleString()}` },
        { label: 'Pending Finance Review', value: `${data.pendingFinanceFinalization || 0} invoices` }
      ],
      employees: usersList.filter(u => u.role === 'accountant' || (u.department || '').toLowerCase().includes('account'))
    },
    {
      domain: 'Finance Department',
      deptCode: 'Finance',
      icon: Calculator,
      color: '#7C3AED',
      metrics: [
        { label: 'Finance Team Members', value: `${data.financeTeamCount || 0} officers` },
        { label: 'Finalized Invoices Created', value: `${data.finalInvoices || 0} invoices` },
        { label: 'Finalized Revenue Invoiced', value: `PKR ${(data.totalInvoiced || 0).toLocaleString()}` },
        { label: 'Total Revenue Collected (Paid)', value: `PKR ${(data.collectedRevenue || 0).toLocaleString()}` },
        { label: 'Outstanding Receivables', value: `PKR ${(data.actualReceivables || 0).toLocaleString()}` }
      ],
      employees: usersList.filter(u => u.role === 'finance' || (u.department || '').toLowerCase().includes('finance'))
    },
    {
      domain: 'Human Resources',
      deptCode: 'HR',
      icon: Heart,
      color: '#E11D48',
      metrics: [
        { label: 'Total Registered Employees', value: `${data.totalStaff || 0} employees` },
        { label: 'Active Headcount', value: `${data.activeEmployees || 0} active` },
        { label: 'Present Today', value: `${data.presentToday || 0} staff` },
        { label: 'Pending Leave Requests', value: `${data.pendingLeaves || 0} requests` },
        { label: 'Approved Leaves', value: `${data.approvedLeaves || 0} approved` }
      ],
      employees: usersList.filter(u => ['hr_manager', 'administration'].includes(u.role) || (u.department || '').toLowerCase().includes('hr'))
    }
  ];

  return (
    <div className="ceo-view-container">
      {/* Top High-Level Organizational Stat Boxes */}
      <div className="ceo-grid-3">
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Total Active Organization Staff</span>
          <span className="ceo-stat-num">{data.activeEmployees || 0}</span>
          <span style={{ color: '#16A34A', fontSize: '0.8rem', fontWeight: 600 }}>Real Database Active Accounts</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Total Collected Revenue (Paid)</span>
          <span className="ceo-stat-num">PKR {(data.collectedRevenue || 0).toLocaleString()}</span>
          <span style={{ color: '#2563EB', fontSize: '0.8rem', fontWeight: 600 }}>Finalized Payments &amp; Receipts</span>
        </div>
        <div className="ceo-stat-box">
          <span className="ceo-stat-title">Outstanding Receivables</span>
          <span className="ceo-stat-num">PKR {(data.actualReceivables || 0).toLocaleString()}</span>
          <span style={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: 600 }}>
            {data.unpaidInvoices || 0} Unpaid Final Invoices (Overdue: PKR {(data.actualOverdueAmount || 0).toLocaleString()})
          </span>
        </div>
      </div>

      {/* Department Summaries Panel */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span>Company-Wide Departmental Summaries (Executive Workflow Overview)</span>
            <div style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 500, marginTop: '2px' }}>
              Sales &rarr; Support &rarr; Accounts &rarr; Finance (Database Aggregated Records)
            </div>
          </div>
          <button
            onClick={fetchOverviewData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} /> Refresh Live Data
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Fetching department summaries from database...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '10px' }}>
            {departmentCards.map((dept, idx) => {
              const Icon = dept.icon;
              return (
                <div key={idx} className="ceo-dept-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: `4px solid ${dept.color}` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${dept.color}15`, color: dept.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={18} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{dept.domain}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: dept.color, background: `${dept.color}15`, padding: '2px 8px', borderRadius: '6px' }}>
                        {dept.deptCode}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {dept.metrics.map((m, mIdx) => (
                        <div key={mIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                          <span style={{ color: '#64748B' }}>{m.label}</span>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {dept.employees.length} Personnel
                    </span>
                    <button
                      onClick={() => downloadDepartmentPDF(dept.domain, dept.metrics, dept.employees)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}
                    >
                      <Download size={12} /> Export PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
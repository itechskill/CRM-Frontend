import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  PieChart,
  Download,
  Printer,
  Calendar,
  FileText,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  Building2,
  CreditCard,
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AccountantViews.css';

export default function AccountantReportsView({ isModalOpen, onCloseModal }) {
  const [reportType, setReportType] = useState('pnl');
  const [period, setPeriod] = useState('FY2026');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/finance/reports/full');
      if (response.ok && data.success) {
        setReportData(data.data);
      }
    } catch (err) {
      console.error('[Fetch Reports Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const d = reportData || {};
  const rev = d.revenue || 0;
  const totalInvoiced = d.totalInvoicedAmount || 0;
  const cogs = d.cogsTotal || 0;
  const grossProfit = d.grossProfit !== undefined ? d.grossProfit : (rev - cogs);
  const opex = d.opexTotal || 0;
  const netIncomeBeforeTax = d.netIncomeBeforeTax !== undefined ? d.netIncomeBeforeTax : (grossProfit - opex);
  const taxProvision = d.corporateTaxProvision !== undefined ? d.corporateTaxProvision : Math.max(0, netIncomeBeforeTax * 0.15);
  const netProfit = d.netProfit !== undefined ? d.netProfit : (netIncomeBeforeTax - taxProvision);

  const receivables = d.receivables || 0;
  const payables = d.payables || 0;
  const cashOnHand = d.cashOnHand || 0;
  const inventoryValue = d.inventoryValue || 0;
  const currentAssets = d.currentAssets !== undefined ? d.currentAssets : (cashOnHand + receivables + inventoryValue);
  const totalLiabilities = d.totalLiabilities !== undefined ? d.totalLiabilities : (payables + (d.totalTaxWithheld || 0));
  const retainedEarnings = d.retainedEarnings !== undefined ? d.retainedEarnings : (currentAssets - totalLiabilities);

  const cats = d.expenseCategories || {};
  const deductibleExp = d.deductibleExpenses || 0;
  const nonDeductibleExp = d.nonDeductibleExpenses || 0;

  // Export PDF of current active statement
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // Header banner
    doc.setFillColor(30, 58, 138); // Deep Navy
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    
    let title = 'PROFIT & LOSS STATEMENT';
    if (reportType === 'balance') title = 'BALANCE SHEET STATEMENT';
    if (reportType === 'cashflow') title = 'CASH FLOW STATEMENT';
    if (reportType === 'tax') title = 'TAX SUMMARY STATEMENT';

    doc.text(`FORTLINE CRM — ${title}`, 14, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`Period: ${period} • Generated: ${new Date().toLocaleDateString('en-GB')} • All amounts in PKR (Rs.)`, 14, 24);

    let head = [['Line Item / Account Description', 'Category / Note', 'Amount (PKR)']];
    let body = [];

    if (reportType === 'pnl') {
      body = [
        ['Operating Revenue (Paid Invoices)', 'Revenue', `Rs. ${rev.toLocaleString()}`],
        ['Cost of Goods Sold & Direct Costs (COGS)', 'COGS', `-Rs. ${cogs.toLocaleString()}`],
        ['GROSS PROFIT', 'Gross Margin', `Rs. ${grossProfit.toLocaleString()}`],
        ['Salaries & Payroll Expense', 'OPEX', `-Rs. ${(cats.Salaries || 0).toLocaleString()}`],
        ['Software & IT Cloud Outlays', 'OPEX', `-Rs. ${(cats.Software || 0).toLocaleString()}`],
        ['Marketing & Advertising', 'OPEX', `-Rs. ${(cats.Marketing || 0).toLocaleString()}`],
        ['Travel & Lodging', 'OPEX', `-Rs. ${(cats.Travel || 0).toLocaleString()}`],
        ['Office Supplies & Stationeries', 'OPEX', `-Rs. ${(cats.OfficeSupplies || 0).toLocaleString()}`],
        ['Utilities & Facilities', 'OPEX', `-Rs. ${(cats.Utilities || 0).toLocaleString()}`],
        ['Other Operational Expenses', 'OPEX', `-Rs. ${(cats.Other || 0).toLocaleString()}`],
        ['TOTAL OPERATING EXPENSES (OPEX)', 'Summary', `-Rs. ${opex.toLocaleString()}`],
        ['NET OPERATING INCOME BEFORE TAX', 'Pre-Tax', `Rs. ${netIncomeBeforeTax.toLocaleString()}`],
        ['Corporate Income Tax Provision (15%)', 'Tax Provision', `-Rs. ${taxProvision.toLocaleString()}`],
        ['NET PROFIT AFTER TAX', 'Bottom Line', `Rs. ${netProfit.toLocaleString()}`]
      ];
    } else if (reportType === 'balance') {
      body = [
        ['[ASSETS] Cash & Bank Equivalents', 'Current Asset', `Rs. ${cashOnHand.toLocaleString()}`],
        ['[ASSETS] Accounts Receivable (Invoiced Balance)', 'Current Asset', `Rs. ${receivables.toLocaleString()}`],
        ['[ASSETS] Inventory Asset Stock Value', 'Current Asset', `Rs. ${inventoryValue.toLocaleString()}`],
        ['TOTAL ASSETS', 'Total Asset Base', `Rs. ${currentAssets.toLocaleString()}`],
        ['[LIABILITIES] Accounts Payable & Pending Outlays', 'Current Liability', `Rs. ${payables.toLocaleString()}`],
        ['[LIABILITIES] Payroll Tax & Statutory Withholdings', 'Current Liability', `Rs. ${(d.totalTaxWithheld || 0).toLocaleString()}`],
        ['TOTAL LIABILITIES', 'Total Obligations', `Rs. ${totalLiabilities.toLocaleString()}`],
        ['[EQUITY] Retained Earnings / Net Worth', 'Owner Equity', `Rs. ${retainedEarnings.toLocaleString()}`],
        ['TOTAL LIABILITIES & EQUITY', 'Balanced Position', `Rs. ${(totalLiabilities + retainedEarnings).toLocaleString()}`]
      ];
    } else if (reportType === 'cashflow') {
      body = [
        ['[INFLOW] Customer Invoice Collections (Realized)', 'Operating Inflow', `+Rs. ${rev.toLocaleString()}`],
        ['[OUTFLOW] Vendor & Operational Expenses Paid', 'Operating Outflow', `-Rs. ${(d.expensesCost || 0).toLocaleString()}`],
        ['[OUTFLOW] Employee Salary Disbursements Paid', 'Operating Outflow', `-Rs. ${(d.payrollCost || 0).toLocaleString()}`],
        ['[OUTFLOW] Facility & Maintenance Charges Paid', 'Operating Outflow', `-Rs. ${(d.maintenanceCost || 0).toLocaleString()}`],
        ['NET CASH FLOW FROM OPERATIONS', 'Operating Net', `Rs. ${cashOnHand.toLocaleString()}`],
        ['Beginning Cash Balance', 'Opening Position', 'Rs. 0.00'],
        ['NET CASH POSITION AT PERIOD END', 'Closing Cash', `Rs. ${cashOnHand.toLocaleString()}`]
      ];
    } else if (reportType === 'tax') {
      body = [
        ['Total Gross Invoiced Revenue', 'Gross Sales Turnover', `Rs. ${totalInvoiced.toLocaleString()}`],
        ['Realized Taxable Cash Revenue', 'Cash Basis Income', `Rs. ${rev.toLocaleString()}`],
        ['Allowable Tax Deductible Expenses', '100% Deductible Outlays', `Rs. ${deductibleExp.toLocaleString()}`],
        ['Non-Deductible / Disallowed Outlays', 'Entertainment / Travel', `Rs. ${nonDeductibleExp.toLocaleString()}`],
        ['Net Taxable Operating Profit', 'Taxable Base', `Rs. ${Math.max(0, netIncomeBeforeTax).toLocaleString()}`],
        ['Statutory Corporate Tax Rate', 'Benchmark Rate', '15.00%'],
        ['Estimated Corporate Tax Provision', 'Statutory Liability', `Rs. ${taxProvision.toLocaleString()}`],
        ['Payroll Taxes Withheld from Staff', 'Withholding Remittance', `Rs. ${(d.totalTaxWithheld || 0).toLocaleString()}`],
        ['TOTAL TAX PROVISION / LIABILITY', 'Total Remittance Due', `Rs. ${(taxProvision + (d.totalTaxWithheld || 0)).toLocaleString()}`]
      ];
    }

    autoTable(doc, {
      startY: 40,
      margin: { left: 14, right: 14 },
      head: head,
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 42 },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      }
    });

    doc.save(`Fortline_Financial_Report_${reportType.toUpperCase()}_${period}.pdf`);
  };

  // Export CSV of current active statement
  const handleExportCSV = () => {
    let csvContent = '\uFEFF' + `Statement,${reportType.toUpperCase()} - ${period}\nLine Item,Category,Amount (PKR)\n`;

    if (reportType === 'pnl') {
      csvContent += `"Operating Revenue (Paid Invoices)","Revenue",${rev}\n`;
      csvContent += `"Cost of Goods Sold (COGS)","COGS",-${cogs}\n`;
      csvContent += `"GROSS PROFIT","Gross Margin",${grossProfit}\n`;
      csvContent += `"Salaries & Payroll","OPEX",-${cats.Salaries || 0}\n`;
      csvContent += `"Software & IT","OPEX",-${cats.Software || 0}\n`;
      csvContent += `"Marketing & Ads","OPEX",-${cats.Marketing || 0}\n`;
      csvContent += `"Travel","OPEX",-${cats.Travel || 0}\n`;
      csvContent += `"Office Supplies","OPEX",-${cats.OfficeSupplies || 0}\n`;
      csvContent += `"Utilities","OPEX",-${cats.Utilities || 0}\n`;
      csvContent += `"Other","OPEX",-${cats.Other || 0}\n`;
      csvContent += `"TOTAL OPEX","Summary",-${opex}\n`;
      csvContent += `"NET OPERATING INCOME BEFORE TAX","Pre-Tax",${netIncomeBeforeTax}\n`;
      csvContent += `"Corporate Income Tax Provision (15%)","Tax Provision",-${taxProvision}\n`;
      csvContent += `"NET PROFIT AFTER TAX","Bottom Line",${netProfit}\n`;
    } else if (reportType === 'balance') {
      csvContent += `"Cash & Bank Equivalents","Current Asset",${cashOnHand}\n`;
      csvContent += `"Accounts Receivable","Current Asset",${receivables}\n`;
      csvContent += `"Inventory Asset Valuation","Current Asset",${inventoryValue}\n`;
      csvContent += `"TOTAL ASSETS","Total Assets",${currentAssets}\n`;
      csvContent += `"Accounts Payable","Current Liability",${payables}\n`;
      csvContent += `"Payroll Tax Withholdings","Current Liability",${d.totalTaxWithheld || 0}\n`;
      csvContent += `"TOTAL LIABILITIES","Total Liabilities",${totalLiabilities}\n`;
      csvContent += `"Retained Earnings / Equity","Equity",${retainedEarnings}\n`;
    } else if (reportType === 'cashflow') {
      csvContent += `"Customer Invoice Collections","Inflow",${rev}\n`;
      csvContent += `"Operational Expenses Paid","Outflow",-${d.expensesCost || 0}\n`;
      csvContent += `"Payroll Paid","Outflow",-${d.payrollCost || 0}\n`;
      csvContent += `"Maintenance Paid","Outflow",-${d.maintenanceCost || 0}\n`;
      csvContent += `"NET CASH FLOW","Operating Net",${cashOnHand}\n`;
    } else if (reportType === 'tax') {
      csvContent += `"Total Invoiced Gross Turnover","Revenue",${totalInvoiced}\n`;
      csvContent += `"Realized Taxable Cash Revenue","Revenue",${rev}\n`;
      csvContent += `"Allowable Tax Deductions","Deductions",${deductibleExp}\n`;
      csvContent += `"Non-Deductible Outlays","Disallowed",${nonDeductibleExp}\n`;
      csvContent += `"Taxable Operating Profit","Tax Base",${Math.max(0, netIncomeBeforeTax)}\n`;
      csvContent += `"Estimated Tax Provision (15%)","Tax Liability",${taxProvision}\n`;
      csvContent += `"Payroll Taxes Withheld","Withholding",${d.totalTaxWithheld || 0}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fortline_${reportType.toUpperCase()}_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading real MongoDB financial reports...</div>;
  }

  return (
    <div className="acc-view-container">
      {/* Page Header */}
      <div className="acc-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="acc-page-header-title">
          <h2>Financial Reports & Statements (PKR)</h2>
          <p>Auditable multi-statement financial reporting, real-time balance sheet, cash flows, and tax liabilities backed by MongoDB.</p>
        </div>
        <div className="acc-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="acc-btn-secondary" onClick={fetchReports} title="Refresh Data" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="acc-btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Export PDF
          </button>
          <button className="acc-btn-primary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector Strip */}
      <div className="acc-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div className="acc-tabs">
          <button className={`acc-tab-btn ${reportType === 'pnl' ? 'active' : ''}`} onClick={() => setReportType('pnl')}>
            Profit & Loss (P&L)
          </button>
          <button className={`acc-tab-btn ${reportType === 'balance' ? 'active' : ''}`} onClick={() => setReportType('balance')}>
            Balance Sheet
          </button>
          <button className={`acc-tab-btn ${reportType === 'cashflow' ? 'active' : ''}`} onClick={() => setReportType('cashflow')}>
            Cash Flow Statement
          </button>
          <button className={`acc-tab-btn ${reportType === 'tax' ? 'active' : ''}`} onClick={() => setReportType('tax')}>
            Tax Summary
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={16} color="#64748B" />
          <select className="acc-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="FY2026">Fiscal Year 2026 (YTD)</option>
            <option value="Q3-2026">Quarter 3 2026</option>
            <option value="Q2-2026">Quarter 2 2026</option>
            <option value="FY2025">Fiscal Year 2025</option>
          </select>
        </div>
      </div>

      {/* KPI Overview Cards (Dynamic per tab) */}
      <div className="acc-kpi-grid">
        {reportType === 'pnl' && (
          <>
            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Gross Revenue (Paid)</span>
                <div className="acc-kpi-icon emerald"><DollarSign size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {rev.toLocaleString()}</div>
              <div className="acc-kpi-subtitle up"><ArrowUpRight size={14} /> Total collected sales</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Gross Profit</span>
                <div className="acc-kpi-icon blue"><TrendingUp size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {grossProfit.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">{rev > 0 ? Math.round((grossProfit / rev) * 100) : 0}% gross margin</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Operating Expenses</span>
                <div className="acc-kpi-icon red"><PieChart size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {opex.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Salaries, utilities, cloud</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Net Profit After Tax</span>
                <div className="acc-kpi-icon teal"><CheckCircle2 size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {netProfit.toLocaleString()}</div>
              <div className="acc-kpi-subtitle up">Bottom line earnings</div>
            </div>
          </>
        )}

        {reportType === 'balance' && (
          <>
            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Cash & Bank Position</span>
                <div className="acc-kpi-icon emerald"><DollarSign size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {cashOnHand.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Liquid funds on hand</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Accounts Receivable</span>
                <div className="acc-kpi-icon blue"><TrendingUp size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {receivables.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Outstanding client invoices</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Inventory Asset Valuation</span>
                <div className="acc-kpi-icon teal"><Building2 size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {inventoryValue.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">{d.counts?.inventoryItems || 0} Stock items registered</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Total Retained Equity</span>
                <div className="acc-kpi-icon purple"><Briefcase size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {retainedEarnings.toLocaleString()}</div>
              <div className="acc-kpi-subtitle up">Assets minus liabilities</div>
            </div>
          </>
        )}

        {reportType === 'cashflow' && (
          <>
            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Total Cash Inflows</span>
                <div className="acc-kpi-icon emerald"><ArrowUpRight size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {rev.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Customer paid invoices</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Expenses Disbursed</span>
                <div className="acc-kpi-icon red"><CreditCard size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {(d.expensesCost || 0).toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Operating outlay disbursements</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Payroll Outflows</span>
                <div className="acc-kpi-icon amber"><Briefcase size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {(d.payrollCost || 0).toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Staff salaries paid</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Net Operating Cash Flow</span>
                <div className="acc-kpi-icon teal"><CheckCircle2 size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {cashOnHand.toLocaleString()}</div>
              <div className="acc-kpi-subtitle up">Net cash surplus</div>
            </div>
          </>
        )}

        {reportType === 'tax' && (
          <>
            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Gross Turnover</span>
                <div className="acc-kpi-icon blue"><DollarSign size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {totalInvoiced.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Total invoicing volume</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Tax Deductible Outlays</span>
                <div className="acc-kpi-icon emerald"><CheckCircle2 size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {deductibleExp.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Allowable expenses & payroll</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Corporate Tax Provision (15%)</span>
                <div className="acc-kpi-icon red"><CreditCard size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {taxProvision.toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Estimated company tax</div>
            </div>

            <div className="acc-kpi-card">
              <div className="acc-kpi-top">
                <span className="acc-kpi-title">Staff Tax Withheld</span>
                <div className="acc-kpi-icon amber"><Building2 size={18} /></div>
              </div>
              <div className="acc-kpi-value">Rs. {(d.totalTaxWithheld || 0).toLocaleString()}</div>
              <div className="acc-kpi-subtitle">Payroll statutory deductions</div>
            </div>
          </>
        )}
      </div>

      {/* Dynamic Financial Statement Table Card */}
      <div className="acc-card">
        <div className="acc-card-header">
          <div>
            <h3 className="acc-card-title">
              {reportType === 'pnl' && `Statement of Profit and Loss (${period})`}
              {reportType === 'balance' && `Statement of Financial Position / Balance Sheet (${period})`}
              {reportType === 'cashflow' && `Statement of Cash Flows (${period})`}
              {reportType === 'tax' && `Corporate Tax & Statutory Deductions Summary (${period})`}
            </h3>
            <p className="acc-card-desc">All amounts in PKR (Pakistani Rupees) • Backed by MongoDB database ledger</p>
          </div>
        </div>

        <div className="acc-table-wrapper">
          <table className="acc-table">
            <thead>
              <tr>
                <th style={{ width: '55%' }}>Line Item / Account Description</th>
                <th style={{ width: '25%' }}>Account Category</th>
                <th style={{ textAlign: 'right', width: '20%' }}>Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {/* TAB 1: PROFIT & LOSS */}
              {reportType === 'pnl' && (
                <>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>1. OPERATING REVENUE</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Realized Customer Invoices (Paid)</td>
                    <td><span className="acc-badge paid">Operating Revenue</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {rev.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700 }}>
                    <td style={{ paddingLeft: '20px', color: '#059669' }}>TOTAL OPERATING REVENUE</td>
                    <td></td>
                    <td style={{ textAlign: 'right', color: '#059669', fontSize: '1rem' }}>Rs. {rev.toLocaleString()}</td>
                  </tr>

                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>2. COST OF GOODS SOLD (COGS)</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Direct Software & Server Hosting</td>
                    <td><span className="acc-badge draft">Direct Expense</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(cats.Software || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Facility Maintenance & Hardware Support</td>
                    <td><span className="acc-badge draft">Direct Expense</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(d.maintenanceCost || 0).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700, backgroundColor: '#EFF6FF' }}>
                    <td style={{ color: '#1E40AF' }}>GROSS PROFIT</td>
                    <td><span className="acc-badge approved">Gross Margin</span></td>
                    <td style={{ textAlign: 'right', color: '#1E40AF', fontSize: '1rem' }}>Rs. {grossProfit.toLocaleString()}</td>
                  </tr>

                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>3. OPERATING EXPENSES (OPEX)</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Employee Salaries & Compensation</td>
                    <td><span className="acc-badge pending">Payroll</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(cats.Salaries || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Marketing, Lead Acquisition & Campaigns</td>
                    <td><span className="acc-badge pending">Sales & Marketing</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(cats.Marketing || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Travel & Client Meetings</td>
                    <td><span className="acc-badge pending">General & Admin</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(cats.Travel || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Office Supplies, Equipment & Postage</td>
                    <td><span className="acc-badge pending">Office Supplies</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(cats.OfficeSupplies || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Utilities, Electricity & High-speed Internet</td>
                    <td><span className="acc-badge pending">Utilities</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(cats.Utilities || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Other Miscellaneous Business Outlays</td>
                    <td><span className="acc-badge pending">Miscellaneous</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(cats.Other || 0).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700 }}>
                    <td style={{ paddingLeft: '20px', color: '#DC2626' }}>TOTAL OPERATING EXPENSES (OPEX)</td>
                    <td></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {opex.toLocaleString()}</td>
                  </tr>

                  <tr style={{ borderTop: '2px solid #0F172A', fontWeight: 700 }}>
                    <td>NET OPERATING INCOME BEFORE TAX</td>
                    <td><span className="acc-badge draft">Operating Income</span></td>
                    <td style={{ textAlign: 'right', fontSize: '1rem' }}>Rs. {netIncomeBeforeTax.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px', color: '#64748B' }}>Estimated Corporate Income Tax Provision (15%)</td>
                    <td><span className="acc-badge rejected">Tax Provision</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {taxProvision.toLocaleString()}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#DCFCE7', fontWeight: 800, fontSize: '1.05rem' }}>
                    <td style={{ color: '#15803D' }}>NET PROFIT AFTER TAX</td>
                    <td><span className="acc-badge paid">Net Earnings</span></td>
                    <td style={{ textAlign: 'right', color: '#15803D' }}>Rs. {netProfit.toLocaleString()}</td>
                  </tr>
                </>
              )}

              {/* TAB 2: BALANCE SHEET */}
              {reportType === 'balance' && (
                <>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>1. CURRENT ASSETS</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Cash & Bank Equivalents (Operating Funds)</td>
                    <td><span className="acc-badge paid">Cash Position</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {cashOnHand.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Accounts Receivable (Unpaid Invoices)</td>
                    <td><span className="acc-badge pending">Trade Receivables</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {receivables.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Inventory Asset Valuation (Stock on Hand)</td>
                    <td><span className="acc-badge approved">Physical Inventory</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {inventoryValue.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700, backgroundColor: '#EFF6FF' }}>
                    <td style={{ color: '#1E40AF' }}>TOTAL ASSETS</td>
                    <td></td>
                    <td style={{ textAlign: 'right', color: '#1E40AF', fontSize: '1rem' }}>Rs. {currentAssets.toLocaleString()}</td>
                  </tr>

                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>2. CURRENT LIABILITIES</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Accounts Payable (Pending Outlays & Maintenance)</td>
                    <td><span className="acc-badge draft">Trade Payables</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>Rs. {payables.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Statutory Tax & Payroll Deductions Withheld</td>
                    <td><span className="acc-badge rejected">Tax Liabilities</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>Rs. {(d.totalTaxWithheld || 0).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700 }}>
                    <td style={{ color: '#DC2626' }}>TOTAL LIABILITIES</td>
                    <td></td>
                    <td style={{ textAlign: 'right', color: '#DC2626', fontSize: '1rem' }}>Rs. {totalLiabilities.toLocaleString()}</td>
                  </tr>

                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>3. OWNER EQUITY & RETAINED EARNINGS</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Retained Operating Earnings (Accumulated Net)</td>
                    <td><span className="acc-badge paid">Equity Reserve</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>Rs. {retainedEarnings.toLocaleString()}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#DCFCE7', fontWeight: 800, fontSize: '1.05rem' }}>
                    <td style={{ color: '#15803D' }}>TOTAL LIABILITIES & EQUITY</td>
                    <td><span className="acc-badge paid">Balanced</span></td>
                    <td style={{ textAlign: 'right', color: '#15803D' }}>Rs. {(totalLiabilities + retainedEarnings).toLocaleString()}</td>
                  </tr>
                </>
              )}

              {/* TAB 3: CASH FLOW */}
              {reportType === 'cashflow' && (
                <>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>1. CASH INFLOWS FROM OPERATING ACTIVITIES</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Receipts from Customers (Paid Invoices)</td>
                    <td><span className="acc-badge paid">Operating Inflow</span></td>
                    <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>+Rs. {rev.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700 }}>
                    <td style={{ paddingLeft: '20px', color: '#059669' }}>TOTAL CASH INFLOWS</td>
                    <td></td>
                    <td style={{ textAlign: 'right', color: '#059669', fontSize: '1rem' }}>+Rs. {rev.toLocaleString()}</td>
                  </tr>

                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>2. CASH OUTFLOWS FOR OPERATING ACTIVITIES</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Operating Expenses & Vendor Payments Disbursed</td>
                    <td><span className="acc-badge draft">Operating Outflow</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(d.expensesCost || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Staff Salaries & Net Payroll Disbursed</td>
                    <td><span className="acc-badge pending">Operating Outflow</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(d.payrollCost || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Maintenance & Facility Outlays Disbursed</td>
                    <td><span className="acc-badge draft">Operating Outflow</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>-Rs. {(d.maintenanceCost || 0).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700 }}>
                    <td style={{ paddingLeft: '20px', color: '#DC2626' }}>TOTAL CASH OUTFLOWS</td>
                    <td></td>
                    <td style={{ textAlign: 'right', color: '#DC2626', fontSize: '1rem' }}>
                      -Rs. {((d.expensesCost || 0) + (d.payrollCost || 0) + (d.maintenanceCost || 0)).toLocaleString()}
                    </td>
                  </tr>

                  <tr style={{ backgroundColor: '#EFF6FF', fontWeight: 700 }}>
                    <td style={{ color: '#1E40AF' }}>NET CASH FLOW FROM OPERATING ACTIVITIES</td>
                    <td><span className="acc-badge approved">Net Operating Cash</span></td>
                    <td style={{ textAlign: 'right', color: '#1E40AF', fontSize: '1rem' }}>Rs. {cashOnHand.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px', color: '#64748B' }}>Cash and Cash Equivalents at Beginning of Period</td>
                    <td><span className="acc-badge draft">Opening Position</span></td>
                    <td style={{ textAlign: 'right', color: '#64748B' }}>Rs. 0.00</td>
                  </tr>
                  <tr style={{ backgroundColor: '#DCFCE7', fontWeight: 800, fontSize: '1.05rem' }}>
                    <td style={{ color: '#15803D' }}>CASH AND CASH EQUIVALENTS AT END OF PERIOD</td>
                    <td><span className="acc-badge paid">Closing Cash Balance</span></td>
                    <td style={{ textAlign: 'right', color: '#15803D' }}>Rs. {cashOnHand.toLocaleString()}</td>
                  </tr>
                </>
              )}

              {/* TAB 4: TAX SUMMARY */}
              {reportType === 'tax' && (
                <>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>1. TURNOVER & TAXABLE BASE</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Total Invoiced Gross Turnover (Sales Orders)</td>
                    <td><span className="acc-badge pending">Gross Sales Volume</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {totalInvoiced.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Realized Cash Revenue (Taxable Receipts)</td>
                    <td><span className="acc-badge paid">Cash Inflow Base</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>Rs. {rev.toLocaleString()}</td>
                  </tr>

                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>2. STATUTORY EXPENSE DEDUCTIONS</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Allowable Tax Deductible Business Outlays & Salaries</td>
                    <td><span className="acc-badge approved">100% Deductible</span></td>
                    <td style={{ textAlign: 'right', color: '#059669' }}>Rs. {deductibleExp.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Disallowed / Non-Deductible Expenditures</td>
                    <td><span className="acc-badge draft">Non-Deductible</span></td>
                    <td style={{ textAlign: 'right', color: '#64748B' }}>Rs. {nonDeductibleExp.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #CBD5E1', fontWeight: 700, backgroundColor: '#EFF6FF' }}>
                    <td style={{ color: '#1E40AF' }}>NET TAXABLE OPERATING INCOME</td>
                    <td><span className="acc-badge approved">Tax Base</span></td>
                    <td style={{ textAlign: 'right', color: '#1E40AF', fontSize: '1rem' }}>Rs. {Math.max(0, netIncomeBeforeTax).toLocaleString()}</td>
                  </tr>

                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan="3" style={{ fontWeight: 700, color: '#0F172A' }}>3. TAX LIABILITIES & WITHHOLDINGS</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Corporate Income Tax Provision (Standard 15%)</td>
                    <td><span className="acc-badge rejected">Corporate Tax</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>Rs. {taxProvision.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: '32px' }}>Payroll Income Tax Deductions Withheld from Staff</td>
                    <td><span className="acc-badge pending">Payroll WHT</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>Rs. {(d.totalTaxWithheld || 0).toLocaleString()}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#FEF2F2', fontWeight: 800, fontSize: '1.05rem' }}>
                    <td style={{ color: '#DC2626' }}>TOTAL ESTIMATED TAX OBLIGATION / REMITTANCE</td>
                    <td><span className="acc-badge rejected">Statutory Due</span></td>
                    <td style={{ textAlign: 'right', color: '#DC2626' }}>Rs. {(taxProvision + (d.totalTaxWithheld || 0)).toLocaleString()}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

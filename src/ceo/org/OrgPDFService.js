import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND_COLOR = [15, 23, 42]; // #0F172A
const PRIMARY_BLUE = [37, 99, 235]; // #2563EB
const ACCENT_GOLD = [245, 158, 11]; // #F59E0B
const TEXT_MUTED = [100, 116, 139];

const addHeader = (doc, title, subtitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header bar
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FORTLINE CRM', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('EXECUTIVE & SYSTEM AUDIT REPORT', 14, 21);

  // Title on right side
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), pageWidth - 14, 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(subtitle || new Date().toLocaleString(), pageWidth - 14, 21, { align: 'right' });

  // Reset text color
  doc.setTextColor(30, 41, 59);
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('CONFIDENTIAL - FORTLINE MANAGEMENT USE ONLY', 14, pageHeight - 7);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
};

/**
 * 1. Export Individual User Performance Report
 */
export const exportUserPDF = (userPerf) => {
  const { user, metrics, monthlyData, activities } = userPerf || {};
  if (!user) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(doc, 'Employee Performance Report', `ID: ${user.employeeId || 'N/A'}`);

  let y = 36;

  // User Overview Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(user.fullName || 'User Profile', 18, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Role: ${(user.role || '').replace('_', ' ').toUpperCase()}`, 18, y + 16);
  doc.text(`Department: ${user.department || 'General'}`, 18, y + 23);
  doc.text(`Email: ${user.email || 'N/A'}`, 18, y + 30);

  doc.text(`Status: ${(user.status || 'Active').toUpperCase()}`, 105, y + 16);
  doc.text(`Phone: ${user.phone || 'N/A'}`, 105, y + 23);
  doc.text(`Last Activity: ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}`, 105, y + 30);

  y += 44;

  // Key KPI Cards
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Performance Score & Key Metrics', 14, y);
  y += 4;

  const kpis = [
    { label: 'Total Handled', val: String(metrics?.totalItems || 0) },
    { label: 'Completed', val: String(metrics?.completedItems || 0) },
    { label: 'Pending', val: String(metrics?.pendingItems || 0) },
    { label: 'Performance Score', val: `${metrics?.score || 0}%` },
  ];

  const cardW = 42;
  kpis.forEach((k, idx) => {
    const x = 14 + idx * (cardW + 4);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(k.label, x + cardW / 2, y + 6, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(k.label.includes('Score') ? PRIMARY_BLUE : [15, 23, 42]));
    doc.text(k.val, x + cardW / 2, y + 14, { align: 'center' });
  });

  y += 24;

  // Monthly breakdown table
  if (monthlyData && monthlyData.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Monthly Activity Trajectory (Last 6 Months)', 14, y);
    y += 2;

    const monthlyRows = monthlyData.map(m => [
      m.month,
      m.totalItems,
      m.completedItems,
      `PKR ${(m.revenue || 0).toLocaleString()}`,
      `${m.score}%`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Month', 'Items Handled', 'Completed', 'Revenue Attributed', 'Score']],
      body: monthlyRows,
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // Activity samples
  const orders = activities?.salesOrders || [];
  const invoices = activities?.invoices || [];
  const tasks = activities?.tasks || [];

  if (orders.length > 0 && y < 220) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Associated Sales Orders (Recent)', 14, y);
    y += 2;

    const orderRows = orders.slice(0, 8).map(o => [
      o.orderNumber || o.orderReference || 'N/A',
      o.clientName || 'N/A',
      `PKR ${(o.netAmount || o.totalAmount || 0).toLocaleString()}`,
      o.deliveryStatus || 'Pending',
      o.paymentStatus || 'Pending',
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Order #', 'Client', 'Amount', 'Delivery', 'Payment', 'Date']],
      body: orderRows,
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_BLUE, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  addFooter(doc);
  doc.save(`User_Report_${user.fullName?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 2. Export Department Performance Audit
 */
export const exportDepartmentPDF = (departmentKey, dept) => {
  if (!dept) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(doc, `${dept.name || 'Department'} Audit`, `Dept Score: ${dept.score || 0}%`);

  let y = 36;

  // KPI Overview
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Department Key Performance Indicators', 14, y);
  y += 4;

  const entries = Object.entries(dept.kpis || {});
  const kpiRows = [];
  for (let i = 0; i < entries.length; i += 2) {
    const k1 = entries[i];
    const k2 = entries[i + 1];
    kpiRows.push([
      k1 ? k1[0].replace(/([A-Z])/g, ' $1').toUpperCase() : '',
      k1 ? (typeof k1[1] === 'number' ? (k1[0].toLowerCase().includes('amount') || k1[0].toLowerCase().includes('revenue') || k1[0].toLowerCase().includes('value') ? `PKR ${k1[1].toLocaleString()}` : String(k1[1])) : String(k1[1])) : '',
      k2 ? k2[0].replace(/([A-Z])/g, ' $1').toUpperCase() : '',
      k2 ? (typeof k2[1] === 'number' ? (k2[0].toLowerCase().includes('amount') || k2[0].toLowerCase().includes('revenue') || k2[0].toLowerCase().includes('value') ? `PKR ${k2[1].toLocaleString()}` : String(k2[1])) : String(k2[1])) : ''
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Metric', 'Value']],
    body: kpiRows,
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLOR, textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Staff Table
  if (dept.users && dept.users.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Department Personnel (${dept.users.length} Employees)`, 14, y);
    y += 2;

    const staffRows = dept.users.map(u => [
      u.employeeId || 'N/A',
      u.fullName || 'N/A',
      (u.role || '').replace('_', ' ').toUpperCase(),
      u.email || 'N/A',
      (u.status || 'Active').toUpperCase(),
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'
    ]);

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Full Name', 'Role', 'Email', 'Status', 'Last Activity']],
      body: staffRows,
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_BLUE, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  addFooter(doc);
  doc.save(`Department_Audit_${dept.name?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * 3. Export Monthly Performance Report
 */
export const exportMonthlyPDF = (monthlyData) => {
  if (!monthlyData) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const period = monthlyData.period || {};
  addHeader(doc, 'Monthly Performance', `${period.monthName || 'Month'} ${period.year || ''}`);

  let y = 36;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Key Performance Indicators (vs Previous Month)', 14, y);
  y += 4;

  const kpis = monthlyData.kpis || {};
  const rows = [
    ['Sales Orders', String(kpis.salesOrders?.count || 0), `PKR ${(kpis.salesOrders?.revenue || 0).toLocaleString()}`, `${kpis.salesOrders?.growth > 0 ? '+' : ''}${kpis.salesOrders?.growth || 0}%`],
    ['Delivery Notes', String(kpis.deliveryNotes?.count || 0), `Confirmed: ${kpis.deliveryNotes?.confirmed || 0}`, `${kpis.deliveryNotes?.growth > 0 ? '+' : ''}${kpis.deliveryNotes?.growth || 0}%`],
    ['Invoices Issued', String(kpis.invoices?.count || 0), `PKR ${(kpis.invoices?.amount || 0).toLocaleString()}`, `${kpis.invoices?.growth > 0 ? '+' : ''}${kpis.invoices?.growth || 0}%`],
    ['Revenue Collected', '-', `PKR ${(kpis.revenueCollected?.amount || 0).toLocaleString()}`, `${kpis.revenueCollected?.growth > 0 ? '+' : ''}${kpis.revenueCollected?.growth || 0}%`],
    ['Leads Generated', String(kpis.leadsGenerated?.count || 0), '-', `${kpis.leadsGenerated?.growth > 0 ? '+' : ''}${kpis.leadsGenerated?.growth || 0}%`]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Domain', 'Count', 'Volume / Value', 'Growth %']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLOR, textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Monthly Rankings Leaderboard
  const rankings = monthlyData.userRankings || [];
  if (rankings.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Employee Leaderboard for This Month', 14, y);
    y += 2;

    const rankRows = rankings.slice(0, 20).map((r, idx) => [
      `#${idx + 1}`,
      r.fullName,
      r.department,
      (r.role || '').replace('_', ' ').toUpperCase(),
      r.items,
      r.completed,
      `PKR ${(r.revenue || 0).toLocaleString()}`,
      `${r.score}%`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Rank', 'Employee', 'Department', 'Role', 'Items', 'Done', 'Revenue', 'Score']],
      body: rankRows,
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_BLUE, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });
  }

  addFooter(doc);
  doc.save(`Monthly_Report_${period.monthName}_${period.year}.pdf`);
};

/**
 * 4. Export Whole Organization Overview Report
 */
export const exportOrgOverviewPDF = (deptStats, users = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(doc, 'Organization Overview', 'Executive Master Summary');

  let y = 36;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Departmental Performance Breakdown', 14, y);
  y += 4;

  const deptRows = Object.values(deptStats || {}).map(d => [
    d.name,
    d.userCount || (d.users ? d.users.length : 0),
    `${d.score || 0}%`,
    d.kpis?.totalOrderAmount ? `PKR ${d.kpis.totalOrderAmount.toLocaleString()}` : (d.kpis?.totalInvoiced ? `PKR ${d.kpis.totalInvoiced.toLocaleString()}` : (d.kpis?.totalCollectedRevenue ? `PKR ${d.kpis.totalCollectedRevenue.toLocaleString()}` : 'N/A')),
    d.score >= 80 ? 'Optimal' : (d.score >= 50 ? 'Moderate' : 'Action Required')
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Department', 'Personnel', 'Score', 'Financial Volume', 'Health']],
    body: deptRows,
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLOR, textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Top Performers Table
  if (users && users.length > 0) {
    const sorted = [...users].sort((a, b) => (b.metrics?.score || 0) - (a.metrics?.score || 0));

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Top Ranked Personnel Across Organization', 14, y);
    y += 2;

    const userRows = sorted.slice(0, 15).map((u, idx) => [
      `#${idx + 1}`,
      u.fullName,
      u.department || 'General',
      (u.role || '').replace('_', ' ').toUpperCase(),
      u.metrics?.totalItems || 0,
      u.metrics?.completedItems || 0,
      `${u.metrics?.score || 0}%`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Rank', 'Name', 'Department', 'Role', 'Handled', 'Done', 'Score']],
      body: userRows,
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_BLUE, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });
  }

  addFooter(doc);
  doc.save(`Organization_Executive_Overview_${new Date().toISOString().slice(0, 10)}.pdf`);
};

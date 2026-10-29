import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateInvoiceTotals } from '../src/utils/documentFinancials.js';

const source = relative => readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
const ids = text => [...text.matchAll(/\bid:\s*['"]([a-z_]+)['"]/g)].map(match => match[1]);
const block = (text, name, next = 'const ') => {
  const start = text.indexOf(`const ${name}`);
  assert.notEqual(start, -1, `${name} was not found`);
  const end = text.indexOf(next, start + 7);
  return text.slice(start, end === -1 ? undefined : end);
};

test('every visible sidebar item is whitelisted and resolves outside the dashboard fallback', async () => {
  const app = await source('src/App.jsx');
  const rendered = app.slice(app.indexOf('{/* -----------------'));
  const roleTabs = role => {
    const match = app.match(new RegExp(`${role}:\\s*\\[([\\s\\S]*?)\\]`));
    assert.ok(match, `No valid-tab whitelist for ${role}`);
    return [...match[1].matchAll(/['"]([a-z_]+)['"]/g)].map(item => item[1]);
  };
  const simpleSidebars = [
    ['admin', 'src/admin/Sidebar.jsx'], ['sales_manager', 'src/sales_manager/SalesSidebar.jsx'],
    ['project_manager', 'src/project_manager/ProjectSidebar.jsx'], ['hr', 'src/hr/HRSidebar.jsx'],
    ['support', 'src/support/SupportSidebar.jsx'], ['accountant', 'src/accounts/AccountsSidebar.jsx'],
    ['finance', 'src/finance_dept/FinanceSidebar.jsx'], ['logistics', 'src/logistics/LogisticsSidebar.jsx'],
    ['purchaser', 'src/purchaser/local/LocalPurchaserSidebar.jsx'], ['purchaser', 'src/purchaser/global/GlobalPurchaserSidebar.jsx'],
    ['marketing', 'src/marketing/MarketingSidebar.jsx'], ['ceo', 'src/ceo/CEOSidebar.jsx'],
    ['administration', 'src/administration/AdministrationSidebar.jsx']
  ];
  const checks = [];
  for (const [role, file] of simpleSidebars) checks.push([role, file, ids(await source(file))]);

  const employeeSidebar = await source('src/employee/EmployeeSidebar.jsx');
  checks.push(['employee', 'Employee general navigation', [...ids(block(employeeSidebar, 'generalNav')), ...ids(block(employeeSidebar, 'bottomNav'))]]);
  checks.push(['sales_rep', 'Employee sales representative navigation', [...ids(block(employeeSidebar, 'salesMainNav')), ...ids(block(employeeSidebar, 'fullSalesRepNav')), ...ids(block(employeeSidebar, 'bottomNav'))]]);
  for (const role of ['sales_member', 'sales_person']) {
    checks.push([role, 'Employee salesperson navigation', [...ids(block(employeeSidebar, 'salesMainNav')), ...ids(block(employeeSidebar, 'salesPersonNav')), ...ids(block(employeeSidebar, 'bottomNav'))]]);
  }

  for (const [role, label, menuIds] of checks) {
    const allowed = roleTabs(role);
    for (const id of new Set(menuIds)) {
      assert.ok(allowed.includes(id), `${label}: ${id} is missing from the ${role} whitelist`);
      if (id === 'dashboard') continue;
      const renderedByExactTab = rendered.includes(`'${id}'`) || rendered.includes(`"${id}"`);
      const renderedByOrgRouter = id.startsWith('org_') && rendered.includes("activeTab.startsWith('org_')");
      assert.ok(renderedByExactTab || renderedByOrgRouter, `${label}: ${id} has no screen resolver and would fall back to the dashboard`);
    }
  }
});

test('invoice tax is derived from taxable amount for manual rates only', () => {
  const items = [{ partNumber: 'PN-1', description: 'Server', quantity: 2, unitPrice: 1800000 }];
  assert.deepEqual(calculateInvoiceTotals({ items, discount: 100000, taxRate: 0 }), {
    items: [{ ...items[0], total: 3600000 }], subtotal: 3600000, discount: 100000,
    taxableAmount: 3500000, taxRate: 0, tax: 0, amount: 3500000
  });
  assert.equal(calculateInvoiceTotals({ items, discount: 100000, taxRate: 18 }).tax, 630000);
  assert.equal(calculateInvoiceTotals({ items, discount: 100000, taxRate: 18 }).amount, 4130000);
  assert.equal(calculateInvoiceTotals({ items, discount: 100000, taxRate: 7.5 }).tax, 262500);
});

test('invoice forms have one manual tax-rate input, a read-only tax amount and no percentage presets', async () => {
  const accounts = await source('src/accounts/AccountsInvoicesView.jsx');
  const sales = await source('src/employee/sales/SalesInvoicesView.jsx');
  assert.match(accounts, /Tax \/ GST Rate \(%\)/);
  assert.match(accounts, /readOnly value=\{Number\(form\.tax/);
  assert.doesNotMatch(accounts, /\[0,\s*5,\s*10[^\]]*18\]/);
  assert.doesNotMatch(sales, /\[0,\s*5,\s*10[^\]]*18\]/);
});

test('part numbers and quantity-only GRN PDFs are present across document PDF sources', async () => {
  for (const file of ['src/utils/quotationPdf.js', 'src/utils/salesDocumentPdfLayout.js', 'src/utils/supplierPoPdf.js', 'src/utils/grnPdf.js', 'src/employee/sales/SalesCustomerPOsView.jsx', 'src/employee/sales/SalesProductFilesView.jsx', 'src/accounts/AccountsInvoicesView.jsx', 'src/finance_dept/FinanceInvoicesView.jsx']) {
    assert.match(await source(file), /Part Number/, `${file} omits Part Number`);
  }
  const grn = await source('src/utils/grnPdf.js');
  assert.match(grn, /Local_GRN|\$\{type\}_GRN/);
  assert.match(grn, /Ordered Qty.*Received Qty/s);
  assert.doesNotMatch(grn, /Unit Price|Line Total|Grand Total|Amount \(PKR\)/);
});

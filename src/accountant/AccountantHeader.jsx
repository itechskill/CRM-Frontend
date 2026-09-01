import React from 'react';
import { Search, Plus, Menu } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './AccountantHeader.css';

export default function AccountantHeader({ activeTab, onMenuToggle, onOpenPrimaryAction, searchQuery = '', onSearchChange }) {
  const getHeaderInfo = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Financial Dashboard', subtitle: 'Overview of revenue, expenses, cashflow, and pending transactions' };
      case 'invoices':
        return { title: 'Invoices & Payments', subtitle: 'Manage client billing, invoice generation, and receivables' };
      case 'expenses':
        return { title: 'Expenses & Receipts', subtitle: 'Track operational costs, employee reimbursements, and receipts' };
      case 'payroll':
        return { title: 'Payroll Management', subtitle: 'Employee salary disbursement, tax withholdings, and pay stubs' };
      case 'accounts':
        return { title: 'Chart of Accounts', subtitle: 'General ledger, bank accounts, and monthly reconciliations' };
      case 'maintenance':
        return { title: 'Maintenance Charges', subtitle: 'Track building, equipment, office, software, and vehicle maintenance costs' };
      case 'acc_reports':
        return { title: 'Financial Reports', subtitle: 'P&L statement, Balance sheet, Cash flow, and Tax summaries' };
      case 'acc_notifications':
        return { title: 'Financial Alerts', subtitle: 'Payment updates, overdue invoices, and tax reminders' };
      case 'acc_settings':
        return { title: 'Accounting Settings', subtitle: 'Tax rates, payment gateways, currencies, and fiscal year setup' };
      default:
        return { title: 'Accountant Portal', subtitle: 'Welcome to FlowBridge Financial Management' };
    }
  };

  const getPrimaryActionLabel = (tab) => {
    switch (tab) {
      case 'invoices': return 'Create Invoice';
      case 'expenses': return 'Log Expense';
      case 'payroll': return 'Process Payroll';
      case 'accounts': return 'Add Account';
      case 'maintenance': return 'Add Maintenance Charge';
      case 'acc_reports': return 'Export Report';
      default: return 'New Transaction';
    }
  };

  const showPrimaryAction = ['dashboard', 'invoices', 'expenses', 'payroll', 'accounts', 'maintenance', 'acc_reports'].includes(activeTab);

  const { title, subtitle } = getHeaderInfo(activeTab);

  return (
    <header className="acc-header">
      <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="acc-header-left">
        <h1 className="acc-page-title">{title}</h1>
        <p className="acc-page-subtitle">{subtitle}</p>
      </div>

      <div className="acc-header-right">
        <NotificationDropdown />

        {showPrimaryAction && (
          <button className="acc-primary-btn" onClick={onOpenPrimaryAction}>
            <Plus size={16} />
            <span>{getPrimaryActionLabel(activeTab)}</span>
          </button>
        )}
      </div>
    </header>
  );
}

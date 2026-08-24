import React from 'react';
import { Package, Laptop, Key, ShieldCheck } from 'lucide-react';
import './AdministrationCompanyResourcesView.css';

export default function AdministrationCompanyResourcesView() {
  const assets = [
    { name: 'Apple MacBook Pro M3 Max 16"', category: 'Hardware', assignedTo: 'Daniel Torres', serial: 'MBP-2024-8841', status: 'In Use' },
    { name: 'Dell UltraSharp 32" 4K Monitor', category: 'Hardware', assignedTo: 'Clara Novak', serial: 'MON-DELL-992', status: 'In Use' },
    { name: 'Figma Enterprise Workspace Seat', category: 'Software License', assignedTo: 'UI/UX Design Team', serial: 'LIC-FIG-4412', status: 'Active' },
    { name: 'Salesforce Enterprise CRM Seat', category: 'Software License', assignedTo: 'Sarah Mitchell', serial: 'LIC-SF-1029', status: 'Active' },
  ];

  return (
    <div className="admin-emp-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Company Assets & Equipment Inventory</span>
          <button className="ceo-add-btn">
            + Register Asset
          </button>
        </div>
        <div className="ceo-table-wrapper">
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
              {assets.map((ast, idx) => (
                <tr key={idx}>
                  <td className="ceo-table-name">{ast.name}</td>
                  <td>{ast.category}</td>
                  <td>{ast.assignedTo}</td>
                  <td><code className="admin-serial-code">{ast.serial}</code></td>
                  <td><span className="ceo-status-tag active">{ast.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Users, Mail, Shield, UserCheck } from 'lucide-react';
import './AdministrationEmployeesView.css';

export default function AdministrationEmployeesView() {
  const employees = [
    { name: 'Sarah Mitchell', title: 'Sales Manager', dept: 'Sales', email: 'sarah.m@nexus.io', status: 'Active' },
    { name: 'Daniel Torres', title: 'Lead Architect', dept: 'Engineering', email: 'd.torres@nexus.io', status: 'Active' },
    { name: 'Aisha Nkosi', title: 'Account Executive', dept: 'Sales', email: 'a.nkosi@nexus.io', status: 'Active' },
    { name: 'Alex Vance', title: 'Finance Lead', dept: 'Finance', email: 'a.vance@nexus.io', status: 'Active' },
    { name: 'Clara Novak', title: 'Senior Developer', dept: 'Engineering', email: 'c.novak@nexus.io', status: 'Active' },
  ];

  return (
    <div className="admin-emp-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Master Employee Directory</span>
          <button className="ceo-add-btn">
            + Add New Employee
          </button>
        </div>
        <div className="ceo-table-wrapper">
          <table className="ceo-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Job Title</th>
                <th>Department</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr key={idx}>
                  <td className="ceo-table-name">{emp.name}</td>
                  <td>{emp.title}</td>
                  <td>{emp.dept}</td>
                  <td>{emp.email}</td>
                  <td>
                    <span className="ceo-status-tag active">{emp.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Building2, Users, UserCheck } from 'lucide-react';
import './AdministrationDepartmentsView.css';

export default function AdministrationDepartmentsView() {
  const departments = [
    { name: 'Engineering', head: 'Daniel Torres', count: 142, location: 'Building A - Floor 3' },
    { name: 'Sales & Business Dev', head: 'Sarah Mitchell', count: 86, location: 'Building B - Floor 2' },
    { name: 'Human Resources', head: 'Rachel Okafor', count: 24, location: 'Building A - Floor 1' },
    { name: 'Finance & Accounting', head: 'Alex Vance', count: 32, location: 'Building A - Floor 2' },
    { name: 'Marketing', head: 'Jessica Blake', count: 42, location: 'Building B - Floor 1' },
    { name: 'Administration & Ops', head: 'Marcus Brody', count: 58, location: 'Building A - Executive Floor' },
  ];

  return (
    <div className="admin-emp-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Company Departments & Department Leads</span>
        </div>
        <div className="admin-dept-grid">
          {departments.map((dept, idx) => (
            <div key={idx} className="admin-dept-card">
              <div className="admin-dept-name">
                <Building2 size={20} /> {dept.name}
              </div>
              <div className="admin-dept-head">
                Head: <strong>{dept.head}</strong>
              </div>
              <div className="admin-dept-meta">{dept.count} members • {dept.location}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
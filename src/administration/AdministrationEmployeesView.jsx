import React, { useState, useEffect } from 'react';
import { Users, Mail, Shield, UserCheck, Eye, Search, Plus, X } from 'lucide-react';
import { apiRequest } from '../utils/api';
import EmployeeDirectoryModal from '../components/EmployeeDirectoryModal';
import './AdministrationEmployeesView.css';

export default function AdministrationEmployeesView() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewingProfileId, setViewingProfileId] = useState(null);

  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('Operations Management');
  const [employeeId, setEmployeeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/admin/directory');
      if (response.ok && data.success && Array.isArray(data.data)) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error('Fetch administration employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const { response, data } = await apiRequest('/api/hr/employees', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          confirmPassword,
          role,
          department,
          employeeId
        })
      });

      if (response.ok && data.success) {
        setIsAddModalOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        fetchEmployees();
      } else {
        setErrorMsg(data.message || 'Failed to create employee.');
      }
    } catch (err) {
      setErrorMsg('Server error creating employee.');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.department && e.department.toLowerCase().includes(search.toLowerCase())) ||
    (e.role && e.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-emp-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Master Employee Directory & Role Control ({employees.length})</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
              <Search size={14} color="#64748B" />
              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>
            <button className="ceo-add-btn" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={15} /> Add Employee
            </button>
          </div>
        </div>

        <div className="ceo-table-wrapper">
          <table className="ceo-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Email</th>
                <th>Employee ID</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id}>
                    <td className="ceo-table-name">{emp.fullName}</td>
                    <td style={{ textTransform: 'capitalize' }}>{emp.role ? emp.role.replace('_', ' ') : 'Employee'}</td>
                    <td>{emp.department || 'General'}</td>
                    <td>{emp.email}</td>
                    <td>{emp.employeeId || '—'}</td>
                    <td>
                      <span className={`ceo-status-tag ${emp.status === 'active' ? 'active' : ''}`}>{emp.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        style={{
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#2563EB',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => setViewingProfileId(emp._id)}
                      >
                        <Eye size={14} /> Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    {loading ? 'Loading directory...' : 'No employees found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="dir-modal-overlay">
          <div className="dir-modal-content" style={{ maxWidth: '480px' }}>
            <div className="dir-modal-header">
              <h3>Create New Employee</h3>
              <button className="dir-modal-close" onClick={() => setIsAddModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateEmployee}>
              <div className="dir-modal-body">
                {errorMsg && <div style={{ padding: '8px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '0.82rem' }}>{errorMsg}</div>}

                <div className="emp-form-group">
                  <label>Full Name *</label>
                  <input type="text" required className="emp-form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>

                <div className="emp-form-group">
                  <label>Email Address *</label>
                  <input type="email" required className="emp-form-input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="emp-form-group">
                    <label>Password *</label>
                    <input type="password" required className="emp-form-input" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="emp-form-group">
                    <label>Confirm Password *</label>
                    <input type="password" required className="emp-form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="emp-form-group">
                    <label>Role</label>
                    <select className="emp-form-input" value={role} onChange={e => setRole(e.target.value)}>
                      <option value="employee">Employee</option>
                      <option value="sales_manager">Sales Manager</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="accountant">Accountant</option>
                      <option value="marketing">Marketing</option>
                      <option value="administration">Administration</option>
                    </select>
                  </div>

                  <div className="emp-form-group">
                    <label>Department</label>
                    <input type="text" className="emp-form-input" value={department} onChange={e => setDepartment(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="dir-modal-footer">
                <button type="button" className="dir-btn-close" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="emp-leave-btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingProfileId && (
        <EmployeeDirectoryModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
        />
      )}
    </div>
  );
}
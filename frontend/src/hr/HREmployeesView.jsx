import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Eye, Users, X, Mail, Briefcase, Calendar, Building2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './HRViews.css';

const depts = ['All', 'Engineering', 'Sales', 'Operations', 'Design', 'Analytics', 'HR', 'Finance'];
const formDeptOptions = depts.filter((d) => d !== 'All');
const typeOptions = ['Full-time', 'Part-time', 'Contract'];
const statusOptions = ['Active', 'On Leave', 'Inactive'];
const avatarPalette = ['#2563EB', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#0EA5E9', '#EF4444', '#7C3AED', '#14B8A6'];

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function EmployeeFormModal({ title, initialValues, onClose, onSubmit, saving, errorMessage }) {
  const [name, setName] = useState(initialValues?.name || '');
  const [email, setEmail] = useState(initialValues?.email || '');
  const [dept, setDept] = useState(initialValues?.dept || formDeptOptions[0]);
  const [role, setRole] = useState(initialValues?.role || 'employee');
  const [type, setType] = useState(initialValues?.type || 'Full-time');
  const [status, setStatus] = useState(initialValues?.status || 'Active');
  const [joined, setJoined] = useState(initialValues?.joined || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      initials: getInitials(name.trim()),
      bg: initialValues?.bg || avatarPalette[Math.floor(Math.random() * avatarPalette.length)],
      dept,
      role: role.trim() || 'employee',
      type,
      joined: joined || 'Not set',
      status,
      password,
      confirmPassword
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-input"
                placeholder="e.g. Jordan Blake"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. jordan.b@nexus.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Department</label>
                <select className="form-select" value={dept} onChange={(e) => setDept(e.target.value)}>
                  {formDeptOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Role</label>
                <input
                  className="form-input"
                  placeholder="e.g. Product Designer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Employment Type</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Joined Date</label>
              <input
                className="form-input"
                placeholder="e.g. Aug 20, 2026"
                value={joined}
                onChange={(e) => setJoined(e.target.value)}
              />
            </div>

            {!initialValues && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Temporary Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={{ color: '#DC2626', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <AlertCircle size={14} /> {errorMessage}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : initialValues ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeViewModal({ employee, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Employee Details</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
            <div
              className="hr-emp-avatar"
              style={{ backgroundColor: employee.bg, width: '52px', height: '52px', fontSize: '1.1rem' }}
            >
              {employee.initials}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{employee.name}</div>
              <span className={`hr-status-badge ${employee.status.toLowerCase().replace(' ', '-')}`}>
                {employee.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{employee.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{employee.dept}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Briefcase size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{employee.role} · {employee.type}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>Joined {employee.joined}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HREmployeesView({ searchQuery = '', headerAction = null }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');

  const mapUserToEmployee = (user, index) => ({
    id: user._id,
    name: user.fullName,
    email: user.email,
    initials: getInitials(user.fullName),
    bg: avatarPalette[index % avatarPalette.length],
    dept: user.department || '—',
    role: (user.role || 'employee').replace(/_/g, ' '),
    type: 'Full-time',
    joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    status: user.status === 'active' ? 'Active' : user.status === 'suspended' ? 'Inactive' : 'On Leave'
  });

  const fetchEmployees = async () => {
    setLoading(true);
    setListError('');
    try {
      const term = (searchQuery || search).trim();
      const qs = term ? `?search=${encodeURIComponent(term)}` : '';
      const { response, data } = await apiRequest(`/api/hr/employees${qs}`);
      if (response.ok && data.success) {
        setEmployees((data.data || []).map(mapUserToEmployee));
      } else {
        setListError(data.message || 'Unable to load employees.');
      }
    } catch {
      setListError('Unable to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchQuery]);

  useEffect(() => {
    if (headerAction?.type === 'add_employee') setIsAddOpen(true);
  }, [headerAction]);

  const effectiveSearch = searchQuery || search;

  const filtered = employees.filter(e =>
    (dept === 'All' || e.dept === dept) &&
    (effectiveSearch === '' ||
      e.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      e.email.toLowerCase().includes(effectiveSearch.toLowerCase()))
  );

  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;
  const inactiveCount = employees.filter((e) => e.status === 'Inactive').length;

  const addEmployee = async (newEmployeeData) => {
    setSaving(true);
    setFormError('');
    try {
      const { response, data } = await apiRequest('/api/hr/employees', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newEmployeeData.name,
          email: newEmployeeData.email,
          password: newEmployeeData.password,
          confirmPassword: newEmployeeData.confirmPassword,
          role: 'employee',
          department: newEmployeeData.dept
        })
      });

      if (response.ok && data.success) {
        setIsAddOpen(false);
        await fetchEmployees();
      } else {
        setFormError(data.message || 'Unable to save employee.');
      }
    } catch {
      setFormError('Unable to connect to backend server.');
    } finally {
      setSaving(false);
    }
  };

  const updateEmployee = (id, updatedData) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatedData } : e))
    );
  };

  return (
    <div className="hr-view-container">
      {/* Summary Cards */}
      <div className="hr-summary-cards">
        <div className="hr-summary-card">
          <div className="hr-summary-icon purple"><Users size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{totalCount}</span>
            <span className="hr-summary-lbl">Total Employees</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon green"><Users size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{activeCount}</span>
            <span className="hr-summary-lbl">Active</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon amber"><Users size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{onLeaveCount}</span>
            <span className="hr-summary-lbl">On Leave</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon red"><Users size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{inactiveCount}</span>
            <span className="hr-summary-lbl">Inactive</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="hr-toolbar">
        <div className="hr-toolbar-left">
          <div className="hr-search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="hr-filter-btn"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            {depts.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="hr-toolbar-right">
          <button className="hr-action-btn" onClick={() => setIsAddOpen(true)}>
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {listError && (
        <div style={{ color: '#DC2626', marginBottom: '12px', fontSize: '0.9rem' }}>{listError}</div>
      )}

      {/* Employee Table */}
      <div className="hr-data-card">
        <div className="hr-data-card-header">
          <div className="hr-data-card-title">
            <Users size={17} color="#1D4ED8 " />
            Employee Directory
            <span className="hr-count-badge">{filtered.length}</span>
          </div>
          <button className="hr-filter-btn" style={{ gap: '6px' }}>
            <Filter size={14} /> Filter
          </button>
        </div>
        <div className="hr-table-wrapper">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Type</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>Loading employees...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No employees found.</td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="hr-emp-cell">
                      <div className="hr-emp-avatar" style={{ backgroundColor: emp.bg }}>{emp.initials}</div>
                      <div>
                        <div className="hr-emp-name">{emp.name}</div>
                        <div className="hr-emp-email">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.dept}</td>
                  <td>{emp.role}</td>
                  <td>{emp.type}</td>
                  <td>{emp.joined}</td>
                  <td>
                    <span className={`hr-status-badge ${emp.status.toLowerCase().replace(' ', '-')}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="hr-row-action">
                      <button className="hr-edit-btn" onClick={() => setEditingEmployee(emp)}>
                        <Edit size={13} /> Edit
                      </button>
                      <button className="hr-view-btn" onClick={() => setViewingEmployee(emp)}>
                        <Eye size={13} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <EmployeeFormModal
          title="Add Employee"
          initialValues={null}
          onClose={() => { setIsAddOpen(false); setFormError(''); }}
          onSubmit={addEmployee}
          saving={saving}
          errorMessage={formError}
        />
      )}

      {editingEmployee && (
        <EmployeeFormModal
          title="Edit Employee"
          initialValues={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSubmit={(updatedData) => updateEmployee(editingEmployee.id, updatedData)}
        />
      )}

      {viewingEmployee && (
        <EmployeeViewModal
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
        />
      )}
    </div>
  );
}
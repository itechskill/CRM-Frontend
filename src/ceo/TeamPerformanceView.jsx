import React, { useState, useEffect } from 'react';
import { Users, Eye, Search, Building2 } from 'lucide-react';
import { apiRequest } from '../utils/api';
import EmployeeDirectoryModal from '../components/EmployeeDirectoryModal';
import './TeamPerformanceView.css';

export default function TeamPerformanceView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewingProfileId, setViewingProfileId] = useState(null);

  useEffect(() => {
    const fetchDirectory = async () => {
      setLoading(true);
      try {
        const { response, data } = await apiRequest('/api/admin/directory');
        if (response.ok && data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      } catch (err) {
        console.error('CEO fetch directory error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="ceo-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Centralized Employee Directory Card for CEO */}
      <div className="ceo-card-panel">
        <div className="ceo-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Centralized Organization Employee Directory ({users.length} Employees)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              placeholder="Search employee directory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div className="ceo-table-wrapper">
          <table className="ceo-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Employee ID</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((emp) => (
                  <tr key={emp._id}>
                    <td className="ceo-table-name">{emp.fullName}</td>
                    <td>{emp.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{emp.role ? emp.role.replace('_', ' ') : 'Employee'}</td>
                    <td>{emp.department || 'General'}</td>
                    <td>{emp.employeeId || '—'}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: emp.status === 'active' ? '#DCFCE7' : '#FEF3C7',
                        color: emp.status === 'active' ? '#16A34A' : '#D97706'
                      }}>
                        {emp.status}
                      </span>
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
                        <Eye size={14} /> Open Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    {loading ? 'Loading directory...' : 'No employees found matching search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingProfileId && (
        <EmployeeDirectoryModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
        />
      )}
    </div>
  );
}
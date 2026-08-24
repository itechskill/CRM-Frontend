import React from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import './AdministrationAttendanceLeaveView.css';

export default function AdministrationAttendanceLeaveView() {
  const leaveRequests = [
    { name: 'Sarah Mitchell', type: 'Annual Paid Leave', duration: '5 Days (Aug 25 - Aug 29)', reason: 'Family vacation', status: 'Pending Approval' },
    { name: 'Aisha Nkosi', type: 'Sick Leave', duration: '2 Days (Aug 21 - Aug 22)', reason: 'Medical appointment', status: 'Pending Approval' },
    { name: 'Daniel Torres', type: 'Parental Leave', duration: '10 Days (Sep 01 - Sep 12)', reason: 'Childbirth', status: 'Approved' },
    { name: 'Clara Novak', type: 'Casual Leave', duration: '1 Day (Aug 22)', reason: 'Personal matters', status: 'Approved' },
  ];

  return (
    <div className="admin-emp-container">
      <div className="ceo-card-panel">
        <div className="ceo-card-title">
          <span>Attendance Logs & Leave Management</span>
        </div>
        <div className="ceo-table-wrapper">
          <table className="ceo-table admin-leave-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Leave Category</th>
                <th>Dates / Duration</th>
                <th>Reason</th>
                <th>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((req, idx) => (
                <tr key={idx}>
                  <td className="ceo-table-name">{req.name}</td>
                  <td>{req.type}</td>
                  <td>{req.duration}</td>
                  <td>{req.reason}</td>
                  <td>
                    <div className="admin-leave-status-cell">
                      <span className={`ceo-status-tag ${req.status === 'Approved' ? 'active' : 'warning'}`}>
                        {req.status}
                      </span>
                      {req.status === 'Pending Approval' && (
                        <button className="admin-approve-btn">
                          Approve
                        </button>
                      )}
                    </div>
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
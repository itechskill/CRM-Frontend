import React, { useState } from 'react';
import { Search, Plus, Briefcase, UserPlus, Eye, Edit, Trash2, X, AlertTriangle, Calendar, Building2, Clock, Award } from 'lucide-react';
import './HRViews.css';

const initialJobs = [
  { id: 1, title: 'Senior Frontend Developer', dept: 'Engineering', type: 'Full-time', posted: 'Aug 10, 2026', deadline: 'Sep 10, 2026', applicants: 28, status: 'Open' },
  { id: 2, title: 'UX Designer', dept: 'Design', type: 'Full-time', posted: 'Aug 5, 2026', deadline: 'Sep 5, 2026', applicants: 17, status: 'Interviewing' },
  { id: 3, title: 'Product Manager', dept: 'Product', type: 'Full-time', posted: 'Jul 28, 2026', deadline: 'Aug 28, 2026', applicants: 45, status: 'Open' },
  { id: 4, title: 'Data Analyst', dept: 'Analytics', type: 'Contract', posted: 'Aug 15, 2026', deadline: 'Sep 15, 2026', applicants: 12, status: 'Open' },
  { id: 5, title: 'DevOps Engineer', dept: 'Engineering', type: 'Full-time', posted: 'Jul 20, 2026', deadline: 'Aug 20, 2026', applicants: 33, status: 'Offered' },
  { id: 6, title: 'Marketing Specialist', dept: 'Marketing', type: 'Full-time', posted: 'Jun 10, 2026', deadline: 'Jul 10, 2026', applicants: 52, status: 'Closed' },
];

const initialApplicants = [
  { id: 1, name: 'Oliver Zhang', initials: 'OZ', bg: '#2563EB', job: 'Senior Frontend Developer', experience: '5 yrs', stage: 'Technical Interview', score: 87 },
  { id: 2, name: 'Fatima Al-Rashid', initials: 'FA', bg: '#EC4899', job: 'UX Designer', experience: '4 yrs', stage: 'Portfolio Review', score: 91 },
  { id: 3, name: 'Noah Williams', initials: 'NW', bg: '#10B981', job: 'Product Manager', experience: '6 yrs', stage: 'HR Screening', score: 79 },
  { id: 4, name: 'Amara Diallo', initials: 'AD', bg: '#F59E0B', job: 'Data Analyst', experience: '3 yrs', stage: 'Applied', score: 75 },
  { id: 5, name: 'Ravi Patel', initials: 'RP', bg: '#8B5CF6', job: 'Senior Frontend Developer', experience: '7 yrs', stage: 'Final Interview', score: 94 },
];

const deptOptions = ['Engineering', 'Design', 'Product', 'Analytics', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance'];
const typeOptions = ['Full-time', 'Part-time', 'Contract'];
const jobStatusOptions = ['Open', 'Interviewing', 'Offered', 'Closed'];
const stageOptions = ['Applied', 'HR Screening', 'Portfolio Review', 'Technical Interview', 'Final Interview', 'Offer Extended', 'Hired', 'Rejected'];
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

function JobFormModal({ title, initialValues, onClose, onSubmit }) {
  const [jobTitle, setJobTitle] = useState(initialValues?.title || '');
  const [dept, setDept] = useState(initialValues?.dept || deptOptions[0]);
  const [type, setType] = useState(initialValues?.type || 'Full-time');
  const [posted, setPosted] = useState(initialValues?.posted || '');
  const [deadline, setDeadline] = useState(initialValues?.deadline || '');
  const [status, setStatus] = useState(initialValues?.status || 'Open');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    onSubmit({
      title: jobTitle.trim(),
      dept,
      type,
      posted: posted || 'Not set',
      deadline: deadline || 'Not set',
      applicants: initialValues?.applicants ?? 0,
      status,
    });

    onClose();
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
              <label>Job Title</label>
              <input
                className="form-input"
                placeholder="e.g. Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Department</label>
                <select className="form-select" value={dept} onChange={(e) => setDept(e.target.value)}>
                  {deptOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Employment Type</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Posted Date</label>
                <input
                  className="form-input"
                  placeholder="e.g. Aug 20, 2026"
                  value={posted}
                  onChange={(e) => setPosted(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Application Deadline</label>
                <input
                  className="form-input"
                  placeholder="e.g. Sep 20, 2026"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {jobStatusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialValues ? 'Save Changes' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobViewModal({ job, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Job Details</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F3E8FF',
              color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Briefcase size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{job.title}</div>
              <span className={`hr-status-badge ${job.status.toLowerCase()}`}>{job.status}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{job.dept} · {job.type}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>Posted {job.posted}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>Deadline {job.deadline}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserPlus size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{job.applicants} applicant(s)</span>
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

function ApplicantFormModal({ title, initialValues, onClose, onSubmit, jobTitles }) {
  const [name, setName] = useState(initialValues?.name || '');
  const [job, setJob] = useState(initialValues?.job || jobTitles[0] || '');
  const [experience, setExperience] = useState(initialValues?.experience || '');
  const [stage, setStage] = useState(initialValues?.stage || 'Applied');
  const [score, setScore] = useState(initialValues?.score ?? 70);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      initials: getInitials(name.trim()),
      bg: initialValues?.bg || avatarPalette[Math.floor(Math.random() * avatarPalette.length)],
      job,
      experience: experience.trim() || '—',
      stage,
      score: Math.min(100, Math.max(0, Number(score) || 0)),
    });

    onClose();
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
              <label>Applied For</label>
              <select className="form-select" value={job} onChange={(e) => setJob(e.target.value)}>
                {jobTitles.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Experience</label>
                <input
                  className="form-input"
                  placeholder="e.g. 4 yrs"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Score (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Current Stage</label>
              <select className="form-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                {stageOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialValues ? 'Save Changes' : 'Add Applicant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicantViewModal({ applicant, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Applicant Profile</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
            <div
              className="hr-emp-avatar"
              style={{ backgroundColor: applicant.bg, width: '52px', height: '52px', fontSize: '1.1rem' }}
            >
              {applicant.initials}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{applicant.name}</div>
              <span className="hr-status-badge pending">{applicant.stage}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Briefcase size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{applicant.job}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>{applicant.experience} experience</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={16} color="#64748B" />
              <span style={{ fontSize: '0.88rem', color: '#334155' }}>Score: {applicant.score}%</span>
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

function DeleteConfirmModal({ title, message, onClose, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', paddingTop: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {title}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            {message}
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ backgroundColor: '#DC2626' }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HRRecruitmentView() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [search, setSearch] = useState('');

  const [jobs, setJobs] = useState(initialJobs);
  const [applicants, setApplicants] = useState(initialApplicants);

  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);

  const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState(null);
  const [viewingApplicant, setViewingApplicant] = useState(null);
  const [deletingApplicant, setDeletingApplicant] = useState(null);

  // Job CRUD
  const addJob = (data) => {
    setJobs((prev) => [{ id: Date.now(), ...data }, ...prev]);
  };
  const updateJob = (id, data) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...data } : j)));
  };
  const removeJob = (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  // Applicant CRUD
  const addApplicant = (data) => {
    setApplicants((prev) => [{ id: Date.now(), ...data }, ...prev]);
  };
  const updateApplicant = (id, data) => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  };
  const removeApplicant = (id) => {
    setApplicants((prev) => prev.filter((a) => a.id !== id));
  };

  // Live KPI numbers
  const openPositionsCount = jobs.filter((j) => j.status === 'Open' || j.status === 'Interviewing').length;
  const totalApplicantsCount = applicants.length;
  const inInterviewCount = applicants.filter((a) =>
    a.stage === 'Technical Interview' || a.stage === 'Final Interview'
  ).length;
  const offersExtendedCount = applicants.filter((a) => a.stage === 'Offer Extended').length;
  const hiredCount = applicants.filter((a) => a.stage === 'Hired').length;
  const rejectedCount = applicants.filter((a) => a.stage === 'Rejected').length;

  const jobTitles = jobs.map((j) => j.title);

  return (
    <div className="hr-view-container">
          {/* Summary Cards */}
      <div className="hr-summary-cards hr-summary-cards-6">
        <div className="hr-summary-card">
          <div className="hr-summary-icon blue"><Briefcase size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{openPositionsCount}</span>
            <span className="hr-summary-lbl">Open Positions</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon purple"><UserPlus size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{totalApplicantsCount}</span>
            <span className="hr-summary-lbl">Total Applicants</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon amber"><Briefcase size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{inInterviewCount}</span>
            <span className="hr-summary-lbl">In Interview Stage</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon teal"><Briefcase size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{offersExtendedCount}</span>
            <span className="hr-summary-lbl">Offers Extended</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon green"><UserPlus size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{hiredCount}</span>
            <span className="hr-summary-lbl">Hired</span>
          </div>
        </div>
        <div className="hr-summary-card">
          <div className="hr-summary-icon red"><UserPlus size={20} /></div>
          <div className="hr-summary-info">
            <span className="hr-summary-val">{rejectedCount}</span>
            <span className="hr-summary-lbl">Rejected</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hr-tabs">
        <button className={`hr-tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
          Job Postings
        </button>
        <button className={`hr-tab ${activeTab === 'applicants' ? 'active' : ''}`} onClick={() => setActiveTab('applicants')}>
          Applicants
        </button>
      </div>

      {/* Toolbar */}
      <div className="hr-toolbar">
        <div className="hr-search-input-wrapper">
          <Search size={15} />
          <input
            type="text"
            placeholder={activeTab === 'jobs' ? 'Search job postings...' : 'Search applicants...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="hr-action-btn"
          onClick={() => (activeTab === 'jobs' ? setIsAddJobOpen(true) : setIsAddApplicantOpen(true))}
        >
          <Plus size={15} />
          {activeTab === 'jobs' ? 'Post New Job' : 'Add Applicant'}
        </button>
      </div>

      {/* Jobs Table */}
      {activeTab === 'jobs' && (
        <div className="hr-data-card">
          <div className="hr-data-card-header">
            <div className="hr-data-card-title">
              <Briefcase size={17} color="#7C3AED" />
              Job Postings
              <span className="hr-count-badge">{jobs.length} listings</span>
            </div>
          </div>
          <div className="hr-table-wrapper">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Posted</th>
                  <th>Deadline</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs
                  .filter(j => j.title.toLowerCase().includes(search.toLowerCase()))
                  .map(job => (
                    <tr key={job.id}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>{job.title}</td>
                      <td>{job.dept}</td>
                      <td>{job.type}</td>
                      <td style={{ color: '#64748B' }}>{job.posted}</td>
                      <td style={{ color: '#64748B' }}>{job.deadline}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#7C3AED', background: '#F3E8FF', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem' }}>
                          {job.applicants}
                        </span>
                      </td>
                      <td>
                        <span className={`hr-status-badge ${job.status.toLowerCase()}`}>{job.status}</span>
                      </td>
                      <td>
                        <div className="hr-row-action">
                          <button className="hr-edit-btn" onClick={() => setEditingJob(job)}>
                            <Edit size={13} /> Edit
                          </button>
                          <button className="hr-view-btn" onClick={() => setViewingJob(job)}>
                            <Eye size={13} /> View
                          </button>
                          <button className="hr-delete-btn" onClick={() => setDeletingJob(job)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Applicants Table */}
      {activeTab === 'applicants' && (
        <div className="hr-data-card">
          <div className="hr-data-card-header">
            <div className="hr-data-card-title">
              <UserPlus size={17} color="#7C3AED" />
              Applicants Pipeline
              <span className="hr-count-badge">{applicants.length} shown</span>
            </div>
          </div>
          <div className="hr-table-wrapper">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Applied For</th>
                  <th>Experience</th>
                  <th>Current Stage</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants
                  .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
                  .map(app => (
                    <tr key={app.id}>
                      <td>
                        <div className="hr-emp-cell">
                          <div className="hr-emp-avatar" style={{ backgroundColor: app.bg }}>{app.initials}</div>
                          <span className="hr-emp-name">{app.name}</span>
                        </div>
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.83rem' }}>{app.job}</td>
                      <td>{app.experience}</td>
                      <td>
                        <span className="hr-status-badge pending">{app.stage}</span>
                      </td>
                      <td>
                        <div className="hr-progress-bar-wrap">
                          <div className="hr-progress-bar">
                            <div className="hr-progress-fill" style={{ width: `${app.score}%` }} />
                          </div>
                          <span className="hr-progress-val">{app.score}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="hr-row-action">
                          <button className="hr-edit-btn" onClick={() => setEditingApplicant(app)}>
                            <Edit size={13} /> Update
                          </button>
                          <button className="hr-view-btn" onClick={() => setViewingApplicant(app)}>
                            <Eye size={13} /> Profile
                          </button>
                          <button className="hr-delete-btn" onClick={() => setDeletingApplicant(app)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Job modals */}
      {isAddJobOpen && (
        <JobFormModal
          title="Post New Job"
          initialValues={null}
          onClose={() => setIsAddJobOpen(false)}
          onSubmit={addJob}
        />
      )}
      {editingJob && (
        <JobFormModal
          title="Edit Job Posting"
          initialValues={editingJob}
          onClose={() => setEditingJob(null)}
          onSubmit={(data) => updateJob(editingJob.id, data)}
        />
      )}
      {viewingJob && (
        <JobViewModal job={viewingJob} onClose={() => setViewingJob(null)} />
      )}
      {deletingJob && (
        <DeleteConfirmModal
          title={`Remove "${deletingJob.title}"?`}
          message="This will permanently delete this job posting. This action can't be undone."
          onClose={() => setDeletingJob(null)}
          onConfirm={() => {
            removeJob(deletingJob.id);
            setDeletingJob(null);
          }}
        />
      )}

      {/* Applicant modals */}
      {isAddApplicantOpen && (
        <ApplicantFormModal
          title="Add Applicant"
          initialValues={null}
          onClose={() => setIsAddApplicantOpen(false)}
          onSubmit={addApplicant}
          jobTitles={jobTitles}
        />
      )}
      {editingApplicant && (
        <ApplicantFormModal
          title="Update Applicant"
          initialValues={editingApplicant}
          onClose={() => setEditingApplicant(null)}
          onSubmit={(data) => updateApplicant(editingApplicant.id, data)}
          jobTitles={jobTitles}
        />
      )}
      {viewingApplicant && (
        <ApplicantViewModal applicant={viewingApplicant} onClose={() => setViewingApplicant(null)} />
      )}
      {deletingApplicant && (
        <DeleteConfirmModal
          title={`Remove ${deletingApplicant.name}?`}
          message="This will permanently remove this applicant from the pipeline. This action can't be undone."
          onClose={() => setDeletingApplicant(null)}
          onConfirm={() => {
            removeApplicant(deletingApplicant.id);
            setDeletingApplicant(null);
          }}
        />
      )}
    </div>
  );
}
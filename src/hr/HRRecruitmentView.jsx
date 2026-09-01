import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Briefcase, UserPlus, Eye, Edit, Trash2, X,
  AlertTriangle, Calendar, Building2, Clock, Award, Upload,
  Globe, EyeOff, Send, Download, ChevronDown, CheckCircle,
  FileText, RefreshCw, Mail
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import './HRViews.css';

const STATUS_COLORS = {
  'New': 'pending',
  'Reviewed': 'interviewing',
  'Shortlisted': 'open',
  'Interview Scheduled': 'offered',
  'Rejected': 'closed',
  'Hired': 'open'
};

const avatarPalette = ['#2563EB', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#0EA5E9', '#EF4444', '#7C3AED'];

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

/* ─── Job Form Modal ─────────────────────────────────────────────────────── */
function JobFormModal({ title, initialValues, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    department: initialValues?.department || '',
    location: initialValues?.location || 'Lahore, Pakistan',
    employmentType: initialValues?.employmentType || 'Full-Time',
    experience: initialValues?.experience || '',
    salary: initialValues?.salary || '',
    description: initialValues?.description || '',
    requirements: (initialValues?.requirements || []).join('\n'),
    skills: (initialValues?.skills || []).join(', '),
    status: initialValues?.status || 'Draft',
    isPublished: initialValues?.isPublished || false,
    deadline: initialValues?.deadline ? new Date(initialValues.deadline).toISOString().split('T')[0] : ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.department.trim()) {
      setError('Job title and department are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location,
      employmentType: form.employmentType,
      experience: form.experience,
      salary: form.salary,
      description: form.description,
      requirements: form.requirements.split('\n').map(r => r.trim()).filter(Boolean),
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      status: form.status,
      isPublished: form.isPublished,
      deadline: form.deadline || null
    };

    try {
      let response, data;
      if (initialValues?._id) {
        ({ response, data } = await apiRequest(`/api/public/jobs/${initialValues._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        }));
      } else {
        ({ response, data } = await apiRequest('/api/public/jobs', {
          method: 'POST',
          body: JSON.stringify(payload)
        }));
      }

      if (response.ok && data.success) {
        onSaved(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to save job posting.');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gap: '14px' }}>
            <div className="form-group">
              <label>Job Title *</label>
              <input className="form-input" placeholder="e.g. Senior Frontend Developer" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Department *</label>
                <input className="form-input" placeholder="e.g. Engineering" value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input className="form-input" value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Employment Type</label>
                <select className="form-select" value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}>
                  {['Full-Time', 'Part-Time', 'Contract', 'Internship'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Experience</label>
                <input className="form-input" placeholder="e.g. 2-4 Years" value={form.experience}
                  onChange={e => setForm({ ...form, experience: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Salary (Optional)</label>
                <input className="form-input" placeholder="e.g. 80K–100K PKR" value={form.salary}
                  onChange={e => setForm({ ...form, salary: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Job Description</label>
              <textarea className="form-input" rows={3} placeholder="Describe the role and responsibilities..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Requirements (one per line)</label>
                <textarea className="form-input" rows={3} placeholder="3+ years React&#10;Strong JS skills"
                  value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Skills (comma separated)</label>
                <textarea className="form-input" rows={3} placeholder="React, Node.js, MongoDB"
                  value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['Draft', 'Open', 'Closed'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input className="form-input" type="date" value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                  <input type="checkbox" checked={form.isPublished}
                    onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: form.isPublished ? '#16A34A' : '#64748B' }}>
                    {form.isPublished ? '✓ Published to Website' : 'Publish to Website'}
                  </span>
                </label>
              </div>
            </div>
            {error && <div style={{ color: '#DC2626', fontSize: '0.84rem', padding: '8px 12px', background: '#FEF2F2', borderRadius: '8px' }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (initialValues?._id ? 'Save Changes' : 'Create Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Job View Modal ─────────────────────────────────────────────────────── */
function JobViewModal({ job, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2>Job Details</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{job.title}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <span className={`hr-status-badge ${job.status.toLowerCase()}`}>{job.status}</span>
                {job.isPublished && <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>🌐 Live on Website</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {[
              { icon: Building2, text: `${job.department} · ${job.employmentType}` },
              { icon: Clock, text: job.experience ? `${job.experience} experience` : 'Experience not specified' },
              { icon: Calendar, text: job.deadline ? `Deadline: ${new Date(job.deadline).toLocaleDateString()}` : 'No deadline set' }
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} color="#64748B" />
                <span style={{ fontSize: '0.88rem', color: '#334155' }}>{text}</span>
              </div>
            ))}
            {job.description && (
              <div style={{ marginTop: '8px', padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>DESCRIPTION</div>
                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>{job.description}</p>
              </div>
            )}
            {job.skills?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {job.skills.map(s => <span key={s} style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 600 }}>{s}</span>)}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Applicant View Modal ───────────────────────────────────────────────── */
function ApplicantViewModal({ applicationId, onClose }) {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const { response, data } = await apiRequest(`/api/public/applications/${applicationId}`);
        if (response.ok && data.success) setApp(data.data);
      } catch (e) { /* ignore */ } finally { setLoading(false); }
    };
    fetchApp();
  }, [applicationId]);

  const downloadResume = () => {
    if (!app?.resumeData) return;
    const link = document.createElement('a');
    link.href = app.resumeData;
    link.download = app.resumeFileName || 'resume.pdf';
    link.click();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h2>Applicant Profile</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>Loading...</div>
          ) : !app ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#EF4444' }}>Failed to load application.</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div className="hr-emp-avatar" style={{ backgroundColor: getAvatarColor(app.fullName), width: '52px', height: '52px', fontSize: '1.1rem' }}>
                  {getInitials(app.fullName)}
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{app.fullName}</div>
                  <span className={`hr-status-badge ${STATUS_COLORS[app.status] || 'pending'}`}>{app.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {[
                  { icon: Briefcase, text: app.jobTitle },
                  { icon: Mail, text: app.email },
                  { icon: Clock, text: app.phone || 'Phone not provided' },
                  { icon: Calendar, text: `Applied: ${new Date(app.createdAt).toLocaleDateString()}` }
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color="#64748B" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>{text}</span>
                  </div>
                ))}

                {app.coverLetter && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>COVER LETTER</div>
                    <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>{app.coverLetter}</p>
                  </div>
                )}

                {app.interviewDate && (
                  <div style={{ padding: '12px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1D4ED8', marginBottom: '4px' }}>INTERVIEW SCHEDULED</div>
                    <div style={{ fontSize: '0.85rem', color: '#1E40AF' }}>
                      {new Date(app.interviewDate).toLocaleDateString()} {app.interviewTime && `at ${app.interviewTime}`}
                      {app.interviewType && ` · ${app.interviewType}`}
                    </div>
                    {app.interviewNotes && <div style={{ fontSize: '0.82rem', color: '#3B82F6', marginTop: '4px' }}>{app.interviewNotes}</div>}
                  </div>
                )}

                {(app.resumeData || app.resumeUrl) && (
                  <button onClick={downloadResume} className="btn-primary" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
                    <Download size={15} /> Download Resume {app.resumeFileName && `(${app.resumeFileName})`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Schedule Interview Modal ───────────────────────────────────────────── */
function InterviewModal({ application, onClose, onSaved }) {
  const [form, setForm] = useState({
    interviewDate: application.interviewDate ? new Date(application.interviewDate).toISOString().split('T')[0] : '',
    interviewTime: application.interviewTime || '',
    interviewType: application.interviewType || 'Online',
    interviewNotes: application.interviewNotes || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.interviewDate) { setError('Please select an interview date.'); return; }
    setSaving(true);
    try {
      const { response, data } = await apiRequest(`/api/public/applications/${application._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...form, status: 'Interview Scheduled' })
      });
      if (response.ok && data.success) {
        onSaved(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to schedule interview.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h2>Schedule Interview</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gap: '14px' }}>
            <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: '8px', fontSize: '0.84rem', color: '#15803D' }}>
              Scheduling interview for <strong>{application.fullName}</strong> — {application.jobTitle}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Interview Date *</label>
                <input className="form-input" type="date" value={form.interviewDate}
                  onChange={e => setForm({ ...form, interviewDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input className="form-input" type="time" value={form.interviewTime}
                  onChange={e => setForm({ ...form, interviewTime: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Interview Type</label>
              <select className="form-select" value={form.interviewType} onChange={e => setForm({ ...form, interviewType: e.target.value })}>
                {['Online', 'In-Person', 'Phone'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Notes / Instructions for Applicant</label>
              <textarea className="form-input" rows={3} placeholder="e.g. Join via Google Meet at meet.google.com/xxx-yyy-zzz"
                value={form.interviewNotes} onChange={e => setForm({ ...form, interviewNotes: e.target.value })}
                style={{ resize: 'vertical' }} />
            </div>
            {error && <div style={{ color: '#DC2626', fontSize: '0.84rem', padding: '8px 12px', background: '#FEF2F2', borderRadius: '8px' }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Scheduling...' : '📅 Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ───────────────────────────────────────────────── */
function DeleteConfirmModal({ title, message, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', paddingTop: '28px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>{title}</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>{message}</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" style={{ background: '#DC2626' }} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function HRRecruitmentView({ searchQuery = '', isModalOpen, onCloseModal }) {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setIsAddJobOpen(true);
    }
  }, [isModalOpen]);
  const [editingJob, setEditingJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);
  const [deletingJobLoading, setDeletingJobLoading] = useState(false);

  const [viewingAppId, setViewingAppId] = useState(null);
  const [schedulingInterview, setSchedulingInterview] = useState(null);
  const [deletingApp, setDeletingApp] = useState(null);
  const [deletingAppLoading, setDeletingAppLoading] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState(null);

  const search = searchQuery || localSearch;

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const { response, data } = await apiRequest('/api/public/jobs/all');
      if (response.ok && data.success) setJobs(data.data);
    } catch (e) { console.error(e); } finally { setLoadingJobs(false); }
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const { response, data } = await apiRequest('/api/public/applications');
      if (response.ok && data.success) setApplications(data.data);
    } catch (e) { console.error(e); } finally { setLoadingApps(false); }
  }, []);

  useEffect(() => { fetchJobs(); fetchApplications(); }, [fetchJobs, fetchApplications]);

  // Toggle publish
  const togglePublish = async (job) => {
    try {
      const { response, data } = await apiRequest(`/api/public/jobs/${job._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !job.isPublished, status: !job.isPublished ? 'Open' : job.status })
      });
      if (response.ok && data.success) {
        setJobs(prev => prev.map(j => j._id === job._id ? data.data : j));
      }
    } catch (e) { console.error(e); }
  };

  // Delete job
  const handleDeleteJob = async () => {
    if (!deletingJob) return;
    setDeletingJobLoading(true);
    try {
      const { response } = await apiRequest(`/api/public/jobs/${deletingJob._id}`, { method: 'DELETE' });
      if (response.ok) setJobs(prev => prev.filter(j => j._id !== deletingJob._id));
    } catch (e) { console.error(e); } finally {
      setDeletingJobLoading(false);
      setDeletingJob(null);
    }
  };

  // Update application status
  const updateAppStatus = async (appId, status) => {
    setUpdatingAppId(appId);
    try {
      const { response, data } = await apiRequest(`/api/public/applications/${appId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (response.ok && data.success) {
        setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      }
    } catch (e) { console.error(e); } finally { setUpdatingAppId(null); }
  };

  // Delete application
  const handleDeleteApp = async () => {
    if (!deletingApp) return;
    setDeletingAppLoading(true);
    try {
      const { response } = await apiRequest(`/api/public/applications/${deletingApp._id}`, { method: 'DELETE' });
      if (response.ok) setApplications(prev => prev.filter(a => a._id !== deletingApp._id));
    } catch (e) { console.error(e); } finally {
      setDeletingAppLoading(false);
      setDeletingApp(null);
    }
  };

  // Filtered data
  const filteredJobs = jobs.filter(j => {
    const term = search.toLowerCase();
    return !term || (j.title || '').toLowerCase().includes(term) || (j.department || '').toLowerCase().includes(term);
  });

  const filteredApps = applications.filter(a => {
    const term = search.toLowerCase();
    const matchSearch = !term || (a.fullName || '').toLowerCase().includes(term) || (a.jobTitle || '').toLowerCase().includes(term) || (a.email || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // KPI counts
  const openPositions = jobs.filter(j => j.status === 'Open').length;
  const publishedJobs = jobs.filter(j => j.isPublished).length;
  const totalApps = applications.length;
  const interviewScheduled = applications.filter(a => a.status === 'Interview Scheduled').length;
  const shortlisted = applications.filter(a => a.status === 'Shortlisted').length;
  const hired = applications.filter(a => a.status === 'Hired').length;

  return (
    <div className="hr-view-container">
      {/* KPI Cards */}
      <div className="hr-summary-cards hr-summary-cards-6">
        {[
          { label: 'Open Positions', val: openPositions, icon: Briefcase, color: 'blue' },
          { label: 'Published Jobs', val: publishedJobs, icon: Globe, color: 'green' },
          { label: 'Total Applicants', val: totalApps, icon: UserPlus, color: 'purple' },
          { label: 'Interviews Scheduled', val: interviewScheduled, icon: Calendar, color: 'amber' },
          { label: 'Shortlisted', val: shortlisted, icon: Award, color: 'teal' },
          { label: 'Hired', val: hired, icon: CheckCircle, color: 'green' }
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} className="hr-summary-card">
            <div className={`hr-summary-icon ${color}`}><Icon size={20} /></div>
            <div className="hr-summary-info">
              <span className="hr-summary-val">{val}</span>
              <span className="hr-summary-lbl">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="hr-tabs">
        <button className={`hr-tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
          Job Postings <span style={{ marginLeft: '6px', background: '#E0E7FF', color: '#4F46E5', padding: '1px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>{jobs.length}</span>
        </button>
        <button className={`hr-tab ${activeTab === 'applicants' ? 'active' : ''}`} onClick={() => setActiveTab('applicants')}>
          Applications <span style={{ marginLeft: '6px', background: '#E0E7FF', color: '#4F46E5', padding: '1px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>{applications.length}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="hr-toolbar">
        <div className="hr-search-input-wrapper">
          <Search size={15} />
          <input type="text" placeholder={activeTab === 'jobs' ? 'Search jobs by title or department...' : 'Search applicants by name, job, or email...'}
            value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="hr-action-btn" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}
            onClick={() => { fetchJobs(); fetchApplications(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {activeTab === 'jobs' && (
            <button
              className="hr-action-btn"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)' }}
              onClick={() => setIsAddJobOpen(true)}
            >
              <Plus size={15} /> Post New Job
            </button>
          )}
        </div>
      </div>

      {/* ── JOBS TABLE ────────────────────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <div className="hr-data-card">
          <div className="hr-data-card-header">
            <div className="hr-data-card-title">
              <Briefcase size={17} color="#7C3AED" /> Job Postings
              <span className="hr-count-badge">{filteredJobs.length} listings</span>
            </div>
          </div>
          <div className="hr-table-wrapper">
            {loadingJobs ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>Loading job postings...</div>
            ) : filteredJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <Briefcase size={36} color="#CBD5E1" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ color: '#64748B', margin: '0 0 6px' }}>No Job Postings Yet</h4>
                <p style={{ color: '#94A3B8', margin: '0 0 16px' }}>Click "Post New Job" to create your first job listing.</p>
                <button className="hr-action-btn" onClick={() => setIsAddJobOpen(true)}><Plus size={14} /> Post New Job</button>
              </div>
            ) : (
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Published</th>
                    <th>Deadline</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <tr key={job._id}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>{job.title}</td>
                      <td>{job.department}</td>
                      <td><span style={{ fontSize: '0.78rem', color: '#475569' }}>{job.employmentType}</span></td>
                      <td><span className={`hr-status-badge ${job.status.toLowerCase()}`}>{job.status}</span></td>
                      <td>
                        <button
                          onClick={() => togglePublish(job)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            background: job.isPublished ? '#DCFCE7' : '#F1F5F9',
                            color: job.isPublished ? '#16A34A' : '#64748B'
                          }}
                        >
                          {job.isPublished ? <><Globe size={12} /> Published</> : <><EyeOff size={12} /> Draft</>}
                        </button>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.82rem' }}>
                        {job.deadline ? new Date(job.deadline).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="hr-row-action">
                          <button className="hr-edit-btn" onClick={() => setEditingJob(job)}><Edit size={13} /> Edit</button>
                          <button className="hr-view-btn" onClick={() => setViewingJob(job)}><Eye size={13} /> View</button>
                          <button className="hr-delete-btn" onClick={() => setDeletingJob(job)}><Trash2 size={13} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── APPLICATIONS TABLE ───────────────────────────────────────────────── */}
      {activeTab === 'applicants' && (
        <div className="hr-data-card">
          <div className="hr-data-card-header">
            <div className="hr-data-card-title">
              <UserPlus size={17} color="#7C3AED" /> Applications Pipeline
              <span className="hr-count-badge">{filteredApps.length} applications</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="form-select" style={{ fontSize: '0.82rem', padding: '4px 10px' }}
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {['All', 'New', 'Reviewed', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="hr-table-wrapper">
            {loadingApps ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>Loading applications...</div>
            ) : filteredApps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <UserPlus size={36} color="#CBD5E1" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ color: '#64748B', margin: 0 }}>No Applications Yet</h4>
                <p style={{ color: '#94A3B8', margin: '6px 0 0' }}>Applications submitted from the public website will appear here.</p>
              </div>
            ) : (
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Applied For</th>
                    <th>Email</th>
                    <th>Resume</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map(app => (
                    <tr key={app._id}>
                      <td>
                        <div className="hr-emp-cell">
                          <div className="hr-emp-avatar" style={{ backgroundColor: getAvatarColor(app.fullName) }}>
                            {getInitials(app.fullName)}
                          </div>
                          <span className="hr-emp-name">{app.fullName}</span>
                        </div>
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.83rem' }}>{app.jobTitle}</td>
                      <td style={{ color: '#64748B', fontSize: '0.82rem' }}>{app.email}</td>
                      <td>
                        {(app.resumeFileName || app.resumeUrl) ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}>
                            <FileText size={13} /> {app.resumeFileName || 'Resume'}
                          </span>
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ fontSize: '0.76rem', padding: '3px 6px', minWidth: '140px' }}
                          value={app.status}
                          disabled={updatingAppId === app._id}
                          onChange={e => updateAppStatus(app._id, e.target.value)}
                        >
                          {['New', 'Reviewed', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'].map(s => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.82rem' }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="hr-row-action">
                          <button className="hr-view-btn" onClick={() => setViewingAppId(app._id)}><Eye size={13} /> View</button>
                          <button className="hr-edit-btn" onClick={() => setSchedulingInterview(app)}><Calendar size={13} /> Interview</button>
                          <button className="hr-delete-btn" onClick={() => setDeletingApp(app)}><Trash2 size={13} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddJobOpen && <JobFormModal title="Post New Job" onClose={() => setIsAddJobOpen(false)} onSaved={job => { setJobs(prev => [job, ...prev]); }} />}
      {editingJob && <JobFormModal title="Edit Job Posting" initialValues={editingJob} onClose={() => setEditingJob(null)} onSaved={updated => { setJobs(prev => prev.map(j => j._id === updated._id ? updated : j)); }} />}
      {viewingJob && <JobViewModal job={viewingJob} onClose={() => setViewingJob(null)} />}
      {deletingJob && <DeleteConfirmModal title={`Delete "${deletingJob.title}"?`} message="This will permanently delete the job posting. This cannot be undone." onClose={() => setDeletingJob(null)} onConfirm={handleDeleteJob} loading={deletingJobLoading} />}

      {viewingAppId && <ApplicantViewModal applicationId={viewingAppId} onClose={() => setViewingAppId(null)} />}
      {schedulingInterview && (
        <InterviewModal
          application={schedulingInterview}
          onClose={() => setSchedulingInterview(null)}
          onSaved={updated => {
            setApplications(prev => prev.map(a => a._id === updated._id ? { ...a, ...updated } : a));
          }}
        />
      )}
      {deletingApp && <DeleteConfirmModal title={`Delete ${deletingApp.fullName}'s application?`} message="This will permanently remove this application." onClose={() => setDeletingApp(null)} onConfirm={handleDeleteApp} loading={deletingAppLoading} />}
    </div>
  );
}
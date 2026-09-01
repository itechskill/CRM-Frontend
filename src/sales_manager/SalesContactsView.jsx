import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, Video, Building2, Clock, ChevronRight } from 'lucide-react';
import { apiRequest } from '../utils/api';
import './SalesContactsView.css';

const contactsData = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    role: 'VP of Engineering',
    company: 'TechCorp Solutions',
    initials: 'SM',
    avatarBg: '#2563EB',
    lastContact: '2024-12-08',
    email: 'sarah.m@techcorp.io',
    phone: '+1 (415) 234-5678',
    tags: ['Enterprise', 'Hot Lead'],
    nextFollowUp: '2024-12-15',
    notes: 'Very technical. Likes detailed specs.',
    recentActivity: [
      { type: 'Call', date: '2024-12-08' },
      { type: 'Email', date: '2024-12-05' },
    ],
  },
  {
    id: '2',
    name: 'David Park',
    role: 'CEO',
    company: 'Nexus Dynamics',
    initials: 'DP',
    avatarBg: '#8B5CF6',
    lastContact: '2024-12-09',
    email: 'david@nexusdyn.com',
    phone: '+1 (415) 345-6789',
    tags: ['Enterprise'],
    nextFollowUp: '2024-12-16',
    notes: 'Prefers phone calls over email.',
    recentActivity: [
      { type: 'Meeting', date: '2024-12-09' },
    ],
  },
];

const activityIcons = {
  Call: Phone,
  Email: Mail,
  Meeting: Video,
};

export default function SalesContactsView() {
  const [contactsList, setContactsList] = useState(contactsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState('1');
  const [activeTab, setActiveTab] = useState('Overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [cName, setCName] = useState('');
  const [cRole, setCRole] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cNotes, setCNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = async () => {
    try {
      const { response, data } = await apiRequest('/api/crm/contacts');
      if (response.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped = data.data.map((c) => ({
          id: c._id,
          name: c.name,
          role: c.role || 'Contact',
          company: c.company || 'Direct',
          initials: (c.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          avatarBg: '#2563EB',
          lastContact: new Date(c.lastContact || c.createdAt).toISOString().split('T')[0],
          email: c.email || '—',
          phone: c.phone || '—',
          tags: c.tags && c.tags.length > 0 ? c.tags : ['Contact'],
          nextFollowUp: c.nextFollowUp ? new Date(c.nextFollowUp).toISOString().split('T')[0] : 'None scheduled',
          notes: c.notes || 'No notes provided.',
          recentActivity: [{ type: 'Email', date: new Date().toISOString().split('T')[0] }]
        }));
        setContactsList(mapped);
        if (!selectedId || !mapped.find(item => item.id === selectedId)) {
          setSelectedId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch sales contacts error:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!cName.trim()) return;

    setSubmitting(true);
    try {
      const { response, data } = await apiRequest('/api/crm/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: cName.trim(),
          role: cRole.trim(),
          company: cCompany.trim(),
          email: cEmail.trim(),
          phone: cPhone.trim(),
          notes: cNotes.trim()
        })
      });

      if (response.ok && data.success) {
        setCName('');
        setCRole('');
        setCCompany('');
        setCEmail('');
        setCPhone('');
        setCNotes('');
        setIsAddModalOpen(false);
        fetchContacts();
      }
    } catch (err) {
      console.error('Create contact error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredContacts = contactsList.filter((c) =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedContact = contactsList.find((c) => c.id === selectedId) || filteredContacts[0] || contactsList[0];

  return (
    <div className="contacts-view">
      {/* Left Panel: Contacts List */}
      <div className="contacts-list-panel">
        <div className="contacts-list-header">
          <h2>Contacts</h2>
          <button className="contacts-add-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
          </button>
        </div>

        <div className="contacts-search-box">
          <Search size={16} className="contacts-search-icon" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="contacts-list">
          {filteredContacts.map((c) => (
            <div
              key={c.id}
              className={`contact-list-item ${selectedId === c.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedId(c.id);
                setActiveTab('Overview');
              }}
            >
              <span className="contact-avatar" style={{ backgroundColor: c.avatarBg }}>
                {c.initials}
              </span>
              <div className="contact-list-info">
                <span className="contact-list-name">{c.name}</span>
                <span className="contact-list-role">{c.role} · {c.company}</span>
                <span className="contact-list-last">
                  <Clock size={11} />
                  Last contact: {c.lastContact}
                </span>
              </div>
              <ChevronRight size={16} className="contact-list-chevron" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Contact Detail */}
      {selectedContact && (
        <div className="contact-detail-panel">
          <div className="contact-detail-header">
            <div className="contact-detail-identity">
              <span className="contact-detail-avatar" style={{ backgroundColor: selectedContact.avatarBg }}>
                {selectedContact.initials}
              </span>
              <div>
                <h2>{selectedContact.name}</h2>
                <p>{selectedContact.role} · {selectedContact.company}</p>
                <div className="contact-detail-tags">
                  {selectedContact.tags.map((tag, i) => (
                    <span className="contact-tag" key={i}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="contact-detail-actions">
              <button className="contact-action-btn action-call">
                <Phone size={15} /> Call
              </button>
              <button className="contact-action-btn action-email">
                <Mail size={15} /> Email
              </button>
              <button className="contact-action-btn action-meet">
                <Video size={15} /> Meet
              </button>
            </div>
          </div>

          <div className="contact-detail-tabs">
            {['Overview', 'Communication History', 'Notes'].map((tab) => (
              <button
                key={tab}
                className={`contact-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && (
            <>
              <div className="contact-detail-grid">
                <div className="contact-info-card">
                  <h3>Contact Information</h3>
                  <div className="contact-info-row">
                    <span className="contact-info-icon"><Mail size={16} /></span>
                    <div>
                      <span className="contact-info-label">EMAIL</span>
                      <span className="contact-info-value">{selectedContact.email}</span>
                    </div>
                  </div>
                  <div className="contact-info-row">
                    <span className="contact-info-icon"><Phone size={16} /></span>
                    <div>
                      <span className="contact-info-label">PHONE</span>
                      <span className="contact-info-value">{selectedContact.phone}</span>
                    </div>
                  </div>
                  <div className="contact-info-row">
                    <span className="contact-info-icon"><Building2 size={16} /></span>
                    <div>
                      <span className="contact-info-label">COMPANY</span>
                      <span className="contact-info-value">{selectedContact.company}</span>
                    </div>
                  </div>
                  <div className="contact-info-row">
                    <span className="contact-info-icon"><Clock size={16} /></span>
                    <div>
                      <span className="contact-info-label">LAST CONTACT</span>
                      <span className="contact-info-value">{selectedContact.lastContact}</span>
                    </div>
                  </div>
                </div>

                <div className="contact-followup-card">
                  <h3>Follow-up Schedule</h3>
                  <div className="followup-next-box">
                    <span className="followup-next-label">NEXT FOLLOW-UP</span>
                    <span className="followup-next-date">{selectedContact.nextFollowUp}</span>
                  </div>
                  <div className="followup-notes-box">
                    <h4>Notes</h4>
                    <p>{selectedContact.notes}</p>
                  </div>
                </div>
              </div>

              <div className="contact-activity-card">
                <h3>Recent Activity</h3>
                <div className="contact-activity-list">
                  {selectedContact.recentActivity.map((a, i) => {
                    const Icon = activityIcons[a.type] || Phone;
                    return (
                      <div className="contact-activity-row" key={i}>
                        <span className="contact-activity-icon">
                          <Icon size={15} />
                          {a.type}
                        </span>
                        <span className="contact-activity-date">{a.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'Communication History' && (
            <div className="contact-activity-card">
              <h3>Communication History</h3>
              <div className="contact-activity-list">
                {selectedContact.recentActivity.map((a, i) => {
                  const Icon = activityIcons[a.type] || Phone;
                  return (
                    <div className="contact-activity-row" key={i}>
                      <span className="contact-activity-icon">
                        <Icon size={15} />
                        {a.type}
                      </span>
                      <span className="contact-activity-date">{a.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'Notes' && (
            <div className="contact-followup-card">
              <div className="followup-notes-box">
                <h4>Notes</h4>
                <p>{selectedContact.notes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>Add New Contact</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Job Role</label>
                  <input
                    type="text"
                    placeholder="e.g. VP of Sales"
                    value={cRole}
                    onChange={(e) => setCRole(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Inc."
                    value={cCompany}
                    onChange={(e) => setCCompany(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Email</label>
                  <input
                    type="email"
                    placeholder="jane@acme.com"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 012-3456"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key relationship details or contact preferences..."
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', background: '#2563EB', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}>{submitting ? 'Saving...' : 'Save Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
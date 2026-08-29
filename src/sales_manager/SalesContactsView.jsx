import React, { useState } from 'react';
import { Search, Plus, Phone, Mail, Video, Building2, Clock, ChevronRight } from 'lucide-react';
import './SalesContactsView.css';

const contactsData = [
  {
    id: 1,
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
    id: 2,
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
  {
    id: 3,
    name: 'Marcus Johnson',
    role: 'COO',
    company: 'Pinnacle Group',
    initials: 'MJ',
    avatarBg: '#10B981',
    lastContact: '2024-12-10',
    email: 'mjohnson@pinnacle.com',
    phone: '+1 (415) 456-7890',
    tags: ['Hot Lead'],
    nextFollowUp: '2024-12-17',
    notes: 'Decision maker on the deal.',
    recentActivity: [
      { type: 'Email', date: '2024-12-10' },
    ],
  },
  {
    id: 4,
    name: 'Emily Chen',
    role: 'Director of Data',
    company: 'BlueWave Analytics',
    initials: 'EC',
    avatarBg: '#F59E0B',
    lastContact: '2024-12-07',
    email: 'emily@bluewave.com',
    phone: '+1 (415) 567-8901',
    tags: ['Mid-Market'],
    nextFollowUp: '2024-12-14',
    notes: 'Interested in analytics integrations.',
    recentActivity: [
      { type: 'Call', date: '2024-12-07' },
    ],
  },
  {
    id: 5,
    name: 'Lisa Wong',
    role: 'CTO',
    company: 'Meridian Capital',
    initials: 'LW',
    avatarBg: '#EF4444',
    lastContact: '2024-12-06',
    email: 'lisa@meridiancap.com',
    phone: '+1 (415) 678-9012',
    tags: ['Enterprise', 'Hot Lead'],
    nextFollowUp: '2024-12-13',
    notes: 'Technical evaluator, wants a security review.',
    recentActivity: [
      { type: 'Meeting', date: '2024-12-06' },
    ],
  },
];

const activityIcons = {
  Call: Phone,
  Email: Mail,
  Meeting: Video,
};

export default function SalesContactsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(contactsData[0].id);
  const [activeTab, setActiveTab] = useState('Overview');

  const filteredContacts = contactsData.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedContact = contactsData.find((c) => c.id === selectedId);

  return (
    <div className="contacts-view">
      {/* Left Panel: Contacts List */}
      <div className="contacts-list-panel">
        <div className="contacts-list-header">
          <h2>Contacts</h2>
          <button className="contacts-add-btn">
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
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Bell, Plus, Clock, User, Video, Check, Calendar } from 'lucide-react';
import './SalesMeetingsView.css';

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const today = new Date();
const MIN_YEAR = today.getFullYear();
const MAX_YEAR = today.getFullYear() + 30;

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  return cells;
}

const initialMeetings = [
  {
    id: 1,
    dateKey: toDateKey(today.getFullYear(), today.getMonth(), 10),
    title: 'BuildCo Industries — Kickoff Call',
    status: 'Scheduled',
    time: '2:00 PM · 45 min',
    contact: 'Rachel Okafor',
    location: 'Zoom',
    tag: 'Kickoff',
    client: 'BuildCo Industries',
    rep: 'Angela Torres',
  },
  {
    id: 2,
    dateKey: toDateKey(today.getFullYear(), today.getMonth(), 12),
    title: 'Nexus Dynamics — Platform Demo',
    status: 'Scheduled',
    time: '10:00 AM · 90 min',
    contact: 'David Park',
    location: 'Zoom',
    tag: 'Demo',
    client: 'Nexus Dynamics',
    rep: 'Priya Sharma',
  },
  {
    id: 3,
    dateKey: toDateKey(today.getFullYear(), today.getMonth(), 13),
    title: 'Starlight Ventures — Contract Review',
    status: 'Scheduled',
    time: '1:00 PM · 60 min',
    contact: 'David Miller',
    location: 'Google Meet',
    tag: 'Contract',
    client: 'Starlight Ventures',
    rep: 'Angela Torres',
  },
  {
    id: 4,
    dateKey: toDateKey(today.getFullYear(), today.getMonth(), 18),
    title: 'Proxima Labs — Renewal Discussion',
    status: 'Scheduled',
    time: '11:30 AM · 30 min',
    contact: 'Eric Vance',
    location: 'Phone',
    tag: 'Renewal',
    client: 'Proxima Labs',
    rep: 'James Carter',
  },
  {
    id: 5,
    dateKey: toDateKey(today.getFullYear(), today.getMonth(), 20),
    title: 'Apex Software — Onboarding',
    status: 'Scheduled',
    time: '3:00 PM · 45 min',
    contact: 'Elena Rostova',
    location: 'Zoom',
    tag: 'Onboarding',
    client: 'Apex Software',
    rep: 'Priya Sharma',
  },
];

const teamAvailability = [
  { id: 1, name: 'Angela Torres', initials: 'AT', avatarBg: '#2563EB', status: 'Available' },
  { id: 2, name: 'James Carter', initials: 'JC', avatarBg: '#8B5CF6', status: 'In Meeting' },
  { id: 3, name: 'Priya Sharma', initials: 'PS', avatarBg: '#10B981', status: 'Available' },
];

const defaultAgenda = [
  'Welcome & Introductions',
  'Platform Overview',
  'Live Demo',
  'Q&A Session',
];

const statusDotColor = {
  Available: '#22C55E',
  'In Meeting': '#EF4444',
  Away: '#F59E0B',
};

const locationOptions = ['Zoom', 'Google Meet', 'Phone', 'In Person'];
const tagOptions = ['Demo', 'Kickoff', 'Contract', 'Renewal', 'Onboarding', 'Check-in'];
const repOptions = teamAvailability.map((m) => m.name);
const statusOptions = ['Scheduled', 'Tentative', 'Confirmed'];

function ScheduleMeetingModal({ year, month, onClose, onAddMeeting }) {
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [contact, setContact] = useState('');
  const [day, setDay] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [duration, setDuration] = useState('30');
  const [location, setLocation] = useState(locationOptions[0]);
  const [tag, setTag] = useState(tagOptions[0]);
  const [rep, setRep] = useState(repOptions[0]);
  const [status, setStatus] = useState('Scheduled');

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !client.trim() || !timeOfDay) return;

    onAddMeeting({
      id: Date.now(),
      dateKey: toDateKey(year, month, Number(day)),
      title: title.trim(),
      status,
      time: `${timeOfDay} · ${duration} min`,
      contact: contact.trim() || 'TBD',
      location,
      tag,
      client: client.trim(),
      rep,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Schedule Meeting</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Meeting Title</label>
              <input
                className="form-input"
                placeholder="e.g. Acme Corp — Product Demo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Client</label>
                <input
                  className="form-input"
                  placeholder="e.g. Acme Corp"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Jane Doe"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Day ({monthNames[month]} {year})</label>
                <select className="form-select" value={day} onChange={(e) => setDay(e.target.value)}>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  className="form-input"
                  placeholder="e.g. 2:00 PM"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Duration (min)</label>
                <input
                  className="form-input"
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
                  {locationOptions.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Tag</label>
                <select className="form-select" value={tag} onChange={(e) => setTag(e.target.value)}>
                  {tagOptions.map((t) => (
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
              <label>Rep</label>
              <select className="form-select" value={rep} onChange={(e) => setRep(e.target.value)}>
                {repOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SalesMeetingsView() {
  const [meetingsData, setMeetingsData] = useState(initialMeetings);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const monthGrid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const selectedDateKey = toDateKey(viewYear, viewMonth, selectedDay);
  const meetingDateKeys = useMemo(() => new Set(meetingsData.map((m) => m.dateKey)), [meetingsData]);
  const meetingsForDay = meetingsData.filter((m) => m.dateKey === selectedDateKey);
  const selectedMeeting = meetingsData.find((m) => m.id === selectedMeetingId);

  const canGoPrev = !(viewYear === MIN_YEAR && viewMonth === today.getMonth());
  const canGoNext = !(viewYear === MAX_YEAR && viewMonth === 11);

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedMeetingId(null);
  };

  const goNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedMeetingId(null);
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    const dateKey = toDateKey(viewYear, viewMonth, day);
    const firstMeeting = meetingsData.find((m) => m.dateKey === dateKey);
    setSelectedMeetingId(firstMeeting ? firstMeeting.id : null);
  };

  const addMeeting = (newMeeting) => {
    setMeetingsData((prev) => [...prev, newMeeting]);
    const [, mm, dd] = newMeeting.dateKey.split('-').map(Number);
    setViewMonth(mm - 1);
    setSelectedDay(dd);
    setSelectedMeetingId(newMeeting.id);
  };

  const upcomingCount = meetingsData.length;

  return (
    <div className="meetings-view">
      <div className="meetings-page-header">
        <div>
          <h1>Meeting Scheduler</h1>
          <p>{monthNames[viewMonth]} {viewYear} · {upcomingCount} upcoming meetings</p>
        </div>
        <div className="meetings-header-actions">
          <button className="btn-secondary">
            <Bell size={15} /> Reminders
          </button>
          <button className="btn-primary" onClick={() => setIsScheduleOpen(true)}>
            <Plus size={16} /> Schedule Meeting
          </button>
        </div>
      </div>

      <div className="meetings-layout-grid">
        {/* Left: Calendar + Team Availability */}
        <div className="meetings-left-panel">
          <div className="calendar-card">
            <div className="calendar-nav">
              <h2>{monthNames[viewMonth]} {viewYear}</h2>
              <div className="calendar-nav-arrows">
                <button
                  className="calendar-nav-btn"
                  onClick={goPrevMonth}
                  disabled={!canGoPrev}
                  style={{ opacity: canGoPrev ? 1 : 0.4, cursor: canGoPrev ? 'pointer' : 'not-allowed' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="calendar-nav-btn"
                  onClick={goNextMonth}
                  disabled={!canGoNext}
                  style={{ opacity: canGoNext ? 1 : 0.4, cursor: canGoNext ? 'pointer' : 'not-allowed' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="calendar-weekdays">
              {weekdays.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {monthGrid.map((day, i) => {
                if (!day) return <span key={`blank-${i}`} className="calendar-cell-empty" />;
                const isSelected = day === selectedDay;
                const hasMeeting = meetingDateKeys.has(toDateKey(viewYear, viewMonth, day));
                return (
                  <button
                    key={day}
                    className={`calendar-cell ${isSelected ? 'calendar-cell-selected' : ''}`}
                    onClick={() => handleSelectDay(day)}
                  >
                    {day}
                    {hasMeeting && <span className="calendar-cell-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="team-availability-card">
            <h3>TEAM AVAILABILITY</h3>
            <div className="team-availability-list">
              {teamAvailability.map((member) => (
                <div className="team-availability-row" key={member.id}>
                  <span className="team-avatar" style={{ background: member.avatarBg }}>
                    {member.initials}
                  </span>
                  <div className="team-availability-info">
                    <span className="team-availability-name">{member.name}</span>
                    <span
                      className="team-availability-status"
                      style={{ color: statusDotColor[member.status] }}
                    >
                      <span
                        className="status-dot"
                        style={{ background: statusDotColor[member.status] }}
                      />
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle: Day's meetings list */}
        <div className="meetings-day-panel">
          <div className="meetings-day-header">
            <h2>{monthNames[viewMonth]} {selectedDay}</h2>
            <span>{meetingsForDay.length} meeting{meetingsForDay.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="meetings-day-list">
            {meetingsForDay.length === 0 && (
              <div className="meetings-day-empty">No meetings scheduled</div>
            )}
            {meetingsForDay.map((meeting) => (
              <div
                key={meeting.id}
                className={`meeting-list-card ${selectedMeetingId === meeting.id ? 'meeting-list-card-active' : ''}`}
                onClick={() => setSelectedMeetingId(meeting.id)}
              >
                <div className="meeting-list-card-top">
                  <h4>{meeting.title}</h4>
                  <span className="meeting-status-badge">{meeting.status}</span>
                </div>
                <div className="meeting-list-card-meta">
                  <span><Clock size={12} /> {meeting.time}</span>
                  <span><User size={12} /> {meeting.contact}</span>
                  <span><Video size={12} /> {meeting.location}</span>
                </div>
                <span className="meeting-tag">{meeting.tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Meeting detail + agenda */}
        <div className="meetings-detail-panel">
          {selectedMeeting ? (
            <>
              <div className="detail-card">
                <div className="detail-card-top">
                  <div className="detail-card-tags">
                    <span className="meeting-tag">{selectedMeeting.tag}</span>
                    <span className="meeting-status-badge">{selectedMeeting.status}</span>
                  </div>
                  <button className="join-btn">
                    <Check size={14} /> Join
                  </button>
                </div>

                <h2 className="detail-title">{selectedMeeting.title}</h2>

                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <span className="detail-info-icon"><Calendar size={16} /></span>
                    <div className="detail-info-text">
                      <span className="detail-info-label">DATE</span>
                      <span className="detail-info-value">{selectedMeeting.dateKey}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-icon"><Clock size={16} /></span>
                    <div className="detail-info-text">
                      <span className="detail-info-label">TIME</span>
                      <span className="detail-info-value">{selectedMeeting.time}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-icon"><User size={16} /></span>
                    <div className="detail-info-text">
                      <span className="detail-info-label">CLIENT</span>
                      <span className="detail-info-value">{selectedMeeting.contact} · {selectedMeeting.client}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-icon"><Video size={16} /></span>
                    <div className="detail-info-text">
                      <span className="detail-info-label">LOCATION</span>
                      <span className="detail-info-value">{selectedMeeting.location}</span>
                    </div>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-icon"><User size={16} /></span>
                    <div className="detail-info-text">
                      <span className="detail-info-label">REP</span>
                      <span className="detail-info-value">{selectedMeeting.rep}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="agenda-card">
                <h3>Meeting Agenda</h3>
                <div className="agenda-list">
                  {defaultAgenda.map((item, i) => (
                    <div className="agenda-row" key={i}>
                      <span className="agenda-number">{i + 1}</span>
                      <span className="agenda-text">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="detail-card detail-empty">Select a meeting to view details</div>
          )}
        </div>
      </div>

      {isScheduleOpen && (
        <ScheduleMeetingModal
          year={viewYear}
          month={viewMonth}
          onClose={() => setIsScheduleOpen(false)}
          onAddMeeting={addMeeting}
        />
      )}
    </div>
  );
}
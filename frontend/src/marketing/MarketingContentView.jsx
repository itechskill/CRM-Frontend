import React, { useState } from 'react';
import {
  Share2,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Calendar,
  Eye,
  ThumbsUp,
  MessageSquare,
  X,
  Send,
  Globe
} from 'lucide-react';
import './MarketingViews.css';

const socialPlatforms = [
  { name: 'LinkedIn Corporate', followers: '45.2K', impressions: '185K/mo', engagement: '5.8%', icon: Share2, color: '#0A66C2' },
  { name: 'Twitter / X Tech', followers: '28.9K', impressions: '240K/mo', engagement: '4.2%', icon: MessageSquare, color: '#1DA1F2' },
  { name: 'Company Blog (SEO)', followers: '62K Readers', impressions: '120K/mo', engagement: '8.4%', icon: Globe, color: '#EC4899' },
];

const initialPosts = [
  { id: 'POST-101', title: '🚀 Unveiling FlowBridge 2.0 Enterprise CRM Infrastructure', platform: 'LinkedIn Corporate', author: 'Clara Novak', date: '2026-08-22 10:00 AM', status: 'Scheduled', impressions: '-', engagement: '-' },
  { id: 'POST-102', title: 'Top 5 AI Automation Strategies for Modern Sales Managers', platform: 'Company Blog', author: 'Marcus Chen', date: '2026-08-19 02:30 PM', status: 'Published', impressions: '14,200', engagement: '6.4%' },
  { id: 'POST-103', title: 'Join our upcoming Live Webinar: Scaling B2B Revenue Funnels', platform: 'Twitter / X Tech', author: 'Sarah Mitchell', date: '2026-08-18 09:15 AM', status: 'Published', impressions: '8,900', engagement: '4.1%' },
  { id: 'POST-104', title: 'Customer Success Case Study: How Proxima Scaled Sales 200%', platform: 'LinkedIn Corporate', author: 'Clara Novak', date: '2026-08-16 11:00 AM', status: 'Published', impressions: '22,400', engagement: '7.2%' },
  { id: 'POST-105', title: 'Why Real-Time Financial Ledgering is Essential for Startups', platform: 'Company Blog', author: 'Alex Vance', date: '2026-08-25 04:00 PM', status: 'Scheduled', impressions: '-', engagement: '-' },
];

export default function MarketingContentView({ isModalOpen, onCloseModal }) {
  const [posts, setPosts] = useState(initialPosts);
  const [activePlatform, setActivePlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [postTitle, setPostTitle] = useState('');
  const [platform, setPlatform] = useState('LinkedIn Corporate');
  const [author, setAuthor] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const handleSchedulePost = (e) => {
    e.preventDefault();
    if (!postTitle) return;

    const newPost = {
      id: `POST-10${posts.length + 1}`,
      title: postTitle,
      platform,
      author: author || 'Marketing Team',
      date: scheduleTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Scheduled',
      impressions: '-',
      engagement: '-'
    };

    setPosts([newPost, ...posts]);
    setPostTitle('');
    setAuthor('');
    setScheduleTime('');
    if (onCloseModal) onCloseModal();
  };

  const filteredPosts = posts.filter(p => {
    const matchesPlatform = activePlatform === 'All' || p.platform === activePlatform;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="mkt-view-container">
      {/* Page Header */}
      <div className="mkt-page-header">
        <div className="mkt-page-header-title">
          <h2>Content & Social Media Publisher</h2>
          <p>Schedule brand content, manage social channels, and track engagement stats.</p>
        </div>
      </div>

      {/* Platform Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {socialPlatforms.map(p => {
          const Icon = p.icon;
          return (
            <div key={p.name} className="mkt-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
                  <Icon size={20} />
                </div>
                <span className="mkt-badge published">{p.followers}</span>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: 700 }}>{p.name}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>Reach: {p.impressions}</p>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#DB2777' }}>
                {p.engagement} <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>avg engagement</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="mkt-card">
        {/* Filter Controls */}
        <div className="mkt-filter-bar">
          <div className="mkt-tabs">
            {['All', 'LinkedIn Corporate', 'Twitter / X Tech', 'Company Blog'].map(plat => (
              <button
                key={plat}
                className={`mkt-tab-btn ${activePlatform === plat ? 'active' : ''}`}
                onClick={() => setActivePlatform(plat)}
              >
                {plat}
              </button>
            ))}
          </div>

          <div className="mkt-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search post title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="mkt-table-wrapper">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Post ID</th>
                <th>Content Headline / Title</th>
                <th>Platform</th>
                <th>Author</th>
                <th>Scheduled Date / Time</th>
                <th>Impressions</th>
                <th>Engagement</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{p.id}</td>
                  <td style={{ fontWeight: 600, color: '#1E293B', maxWidth: '300px' }}>{p.title}</td>
                  <td><span className="mkt-badge draft">{p.platform}</span></td>
                  <td>{p.author}</td>
                  <td>{p.date}</td>
                  <td style={{ fontWeight: 600 }}>{p.impressions}</td>
                  <td style={{ color: '#DB2777', fontWeight: 600 }}>{p.engagement}</td>
                  <td>
                    <span className={`mkt-badge ${p.status.toLowerCase()}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Post Modal */}
      {isModalOpen && (
        <div className="mkt-modal-overlay">
          <div className="mkt-modal-content">
            <div className="mkt-modal-header">
              <h3>Schedule Social / Blog Post</h3>
              <button className="mkt-modal-close" onClick={onCloseModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSchedulePost}>
              <div className="mkt-modal-body">
                <div className="mkt-form-group">
                  <label>Post Headline / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 Growth Hacks for Enterprise B2B SaaS"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                  />
                </div>

                <div className="mkt-form-group">
                  <label>Target Channel / Platform</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                    <option value="LinkedIn Corporate">LinkedIn Corporate</option>
                    <option value="Twitter / X Tech">Twitter / X Tech</option>
                    <option value="Company Blog">Company Blog (SEO)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="mkt-form-group">
                    <label>Author</label>
                    <input
                      type="text"
                      placeholder="e.g. Clara Novak"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </div>

                  <div className="mkt-form-group">
                    <label>Publish Date & Time</label>
                    <input
                      type="text"
                      placeholder="2026-08-25 10:00 AM"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mkt-modal-footer">
                <button type="button" className="mkt-btn-secondary" onClick={onCloseModal}>Cancel</button>
                <button type="submit" className="mkt-btn-primary">Schedule Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

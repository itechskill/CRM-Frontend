import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, BarChart3, Users, Target, Briefcase, DollarSign,
  ShieldCheck, CheckCircle, ArrowRight, Star, MapPin,
  Clock, Building2, Mail, Phone, MessageSquare, Send,
  Play, ChevronDown, Menu, X, TrendingUp, Activity,
  Calendar, FileText, Settings, PieChart, Layers, Cpu,
  Search, Bell, Check, User, ArrowUpRight, Filter, HelpCircle
} from 'lucide-react';
import { API_BASE } from '../utils/api';
import './PublicWebsite.css';

/* ─── Nav Links ────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'careers', label: 'Careers' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

/* ─── Static Data Structures ────────────────────────────────────────────────── */
const FEATURES_DATA = [
  { id: 'lead', icon: Target, label: 'Lead Management', color: '#EFF6FF', iconColor: '#2563EB', desc: 'Capture, qualify, and hand off leads from Marketing to Sales with full historical metadata, notes, and campaign tags intact.' },
  { id: 'sales', icon: TrendingUp, label: 'Sales Management', color: '#F0FDF4', iconColor: '#16A34A', desc: 'Drag-and-drop Kanban pipeline board to manage deals from Qualification to Proposal, Negotiation, and Closed Won.' },
  { id: 'marketing', icon: Zap, label: 'Marketing Automation', color: '#F5F3FF', iconColor: '#7C3AED', desc: 'Plan multi-channel campaigns, measure lead conversion metrics, track ROI, and automatically trigger sales pipeline handoffs.' },
  { id: 'hr', icon: Users, label: 'HR & Employee Management', color: '#FFF7ED', iconColor: '#EA580C', desc: 'Centralized employee profiles, attendance logs, leave management, recruitment tracking, and annual performance reviews.' },
  { id: 'project', icon: Briefcase, label: 'Project & Task Management', color: '#F5F3FF', iconColor: '#6366F1', desc: 'Create projects, delegate tasks, set priority levels, monitor milestone deadlines, and track team progress in real time.' },
  { id: 'accounting', icon: DollarSign, label: 'Accounting & Invoices', color: '#ECFDF5', iconColor: '#059669', desc: 'Auto-generate invoices directly from won sales deals, log company operational expenses, run payroll, and track revenue.' },
  { id: 'reports', icon: BarChart3, label: 'Reports & Analytics', color: '#FEF2F2', iconColor: '#EF4444', desc: 'Cross-departmental executive dashboards, revenue charts, pipeline donut visuals, and downloadable PDF reports.' },
  { id: 'workflow', icon: Cpu, label: 'Workflow Automation', color: '#EFF6FF', iconColor: '#0284C7', desc: 'Real-time background notifications and status synchronizations across Marketing, Sales, Accounting, and HR.' }
];

const SOLUTIONS_DATA = [
  { key: 'ceo', icon: ShieldCheck, role: 'CEO / Admin', desc: 'Get a complete overview of your business with real-time analytics and reports.', bg: '#EFF6FF', color: '#2563EB', details: 'Executive dashboards, user permissions, multi-department analytics, audit logs, and complete enterprise governance.' },
  { key: 'sales', icon: TrendingUp, role: 'Sales', desc: 'Manage leads, follow-ups, deals and close more business.', bg: '#F0FDF4', color: '#16A34A', details: 'Lead pipeline management, deal conversion, meeting scheduler, customer proposal generation, and sales team analytics.' },
  { key: 'marketing', icon: Zap, role: 'Marketing', desc: 'Run campaigns, generate leads and measure performance.', bg: '#EFF6FF', color: '#0284C7', details: 'Campaign creation, lead acquisition forms, qualification triggers, content strategy, and channel ROI measurement.' },
  { key: 'hr', icon: Users, role: 'HR', desc: 'Manage employees, leave, attendance and performance.', bg: '#F0FDF4', color: '#22C55E', details: 'Employee directory, digital attendance marking, leave approval workflows, recruitment pipelines, and performance reviews.' },
  { key: 'accountant', icon: DollarSign, role: 'Accountant', desc: 'Create invoices, track payments and manage your finances.', bg: '#FFF7ED', color: '#F59E0B', details: 'Invoice creation linked to won deals, expense categorizations, payroll processing, accounts ledger, and financial statements.' },
  { key: 'project', icon: Briefcase, role: 'Project Manager', desc: 'Plan projects, assign tasks and track progress efficiently.', bg: '#F5F3FF', color: '#8B5CF6', details: 'Project creation, team allocation, task Kanban board, milestone timelines, delivery tracking, and project health indicators.' },
  { key: 'employee', icon: User, role: 'Employee', desc: 'View tasks, update progress and collaborate with your team.', bg: '#EFF6FF', color: '#3B82F6', details: 'Personal task board, daily work update submission, leave request form, activity logs, and profile management.' }
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'Marketing', desc: 'Generate & Qualify Leads', details: 'Marketing campaigns capture prospect details. Qualifying a lead automatically transfers all data to Sales.' },
  { step: '02', title: 'Sales', desc: 'Follow Up & Close Deals', details: 'Sales representatives view transferred leads, conduct meetings, issue proposals, and convert them to Won Deals.' },
  { step: '03', title: 'Won Deal', desc: 'Trigger Business Workflow', details: 'Closing a deal automatically notifies Accounting and promotes the lead to an active Client record in MongoDB.' },
  { step: '04', title: 'Accountant', desc: 'Create Invoice & Accounts', details: 'Accountants generate linked invoices directly from deal data, track payments, and log incoming revenue.' },
  { step: '05', title: 'Payment', desc: 'Receive & Track Payments', details: 'System tracks paid and pending invoices, updating financial reports and client standing.' },
  { step: '06', title: 'CEO', desc: 'Business Performance Analytics', details: 'Executive leadership views aggregated KPIs, revenue growth, team performance metrics, and company health.' }
];

const PRICING_PLANS = [
  { name: 'Starter', priceMonthly: 19, priceYearly: 15, desc: 'Ideal for small teams getting started.', popular: false, features: ['Up to 5 Users', 'Lead Management', 'Basic Reports', 'Email Support'] },
  { name: 'Professional', priceMonthly: 49, priceYearly: 39, desc: 'Perfect for growing businesses.', popular: true, features: ['Up to 20 Users', 'Sales & Marketing', 'Advanced Reports', 'Priority Support'] },
  { name: 'Business', priceMonthly: 99, priceYearly: 79, desc: 'For teams that need more power.', popular: false, features: ['Up to 50 Users', 'All Features', 'Custom Reports', '24/7 Support'] },
  { name: 'Enterprise', priceMonthly: 'Custom', priceYearly: 'Custom', desc: 'Tailored for large organizations.', popular: false, features: ['Unlimited Users', 'Custom Features', 'Dedicated Support', 'Onboarding & Training'] }
];

const PRICING_FAQS = [
  { q: 'Can I switch or upgrade plans later?', a: 'Yes! You can upgrade, downgrade, or switch billing cycles at any time from your Admin billing portal.' },
  { q: 'Is there a free trial available?', a: 'All plans come with a 14-day free trial. No credit card is required to sign up and get started.' },
  { q: 'Are all 9 department portals included?', a: 'Yes! Even our Starter plan gives your team access to the specific role-based dashboards needed for your business.' },
  { q: 'How does data security and backup work?', a: 'NexusCRM uses enterprise-grade JWT authentication, role-based access control, and automated daily MongoDB backups.' }
];

/* ─── Hero Browser Mockup Graphic ────────────────────────────────────────────── */
function HeroDashboardMockup() {
  return (
    <div className="ref-mockup-wrapper">
      <div className="ref-mockup-card">
        <div className="ref-mockup-topbar">
          <div className="ref-mockup-search">
            <Search size={14} color="#94A3B8" />
            <span>Search...</span>
          </div>
          <div className="ref-mockup-top-right">
            <div className="ref-icon-btn"><Bell size={14} color="#64748B" /></div>
            <div className="ref-user-avatar">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" />
            </div>
          </div>
        </div>

        <div className="ref-mockup-body">
          <div className="ref-mockup-sidebar">
            <div className="ref-sidebar-logo">
              <div className="ref-logo-icon">N</div>
              <span>NexusCRM</span>
            </div>
            <div className="ref-sidebar-menu">
              <div className="ref-sidebar-item active"><BarChart3 size={14} /> <span>Dashboard</span></div>
              <div className="ref-sidebar-item"><Target size={14} /> <span>Leads</span></div>
              <div className="ref-sidebar-item"><TrendingUp size={14} /> <span>Deals</span></div>
              <div className="ref-sidebar-item"><CheckCircle size={14} /> <span>Tasks</span></div>
              <div className="ref-sidebar-item"><Briefcase size={14} /> <span>Projects</span></div>
              <div className="ref-sidebar-item"><Users size={14} /> <span>Customers</span></div>
              <div className="ref-sidebar-item"><FileText size={14} /> <span>Reports</span></div>
              <div className="ref-sidebar-item"><Calendar size={14} /> <span>Calendar</span></div>
              <div className="ref-sidebar-item"><Settings size={14} /> <span>Settings</span></div>
            </div>
          </div>

          <div className="ref-mockup-main">
            <h3 className="ref-main-title">Dashboard</h3>
            <div className="ref-kpi-grid">
              <div className="ref-kpi-card">
                <div>
                  <span className="ref-kpi-label">Total Leads</span>
                  <span className="ref-kpi-val">2,450</span>
                  <span className="ref-kpi-badge green">+12.5%</span>
                </div>
                <div className="ref-kpi-icon blue"><Target size={16} /></div>
              </div>
              <div className="ref-kpi-card">
                <div>
                  <span className="ref-kpi-label">Total Deals</span>
                  <span className="ref-kpi-val">1,320</span>
                  <span className="ref-kpi-badge green">+8.2%</span>
                </div>
                <div className="ref-kpi-icon green"><TrendingUp size={16} /></div>
              </div>
              <div className="ref-kpi-card">
                <div>
                  <span className="ref-kpi-label">Revenue</span>
                  <span className="ref-kpi-val">$98,765</span>
                  <span className="ref-kpi-badge purple">+15.3%</span>
                </div>
                <div className="ref-kpi-icon purple"><DollarSign size={16} /></div>
              </div>
              <div className="ref-kpi-card">
                <div>
                  <span className="ref-kpi-label">Tasks</span>
                  <span className="ref-kpi-val">850</span>
                  <span className="ref-kpi-badge orange">+10.1%</span>
                </div>
                <div className="ref-kpi-icon orange"><CheckCircle size={16} /></div>
              </div>
            </div>

            <div className="ref-bottom-row">
              <div className="ref-chart-card">
                <div className="ref-card-header">Sales Overview</div>
                <div className="ref-chart-graphic">
                  <svg viewBox="0 0 300 110" className="ref-svg-chart">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 85 Q 40 65, 70 80 T 140 35 T 210 45 T 280 18 L 280 110 L 0 110 Z" fill="url(#chartGrad)" />
                    <path d="M0 85 Q 40 65, 70 80 T 140 35 T 210 45 T 280 18" fill="none" stroke="#2563EB" strokeWidth="3" />
                    <circle cx="280" cy="18" r="4" fill="#2563EB" stroke="#fff" strokeWidth="2" />
                  </svg>
                  <div className="ref-chart-months">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
                  </div>
                </div>
              </div>

              <div className="ref-activity-card">
                <div className="ref-card-header">Recent Activities</div>
                <div className="ref-activity-list">
                  <div className="ref-activity-item">
                    <div className="ref-act-icon blue"><User size={12} /></div>
                    <div>
                      <div className="ref-act-title">New lead added</div>
                      <div className="ref-act-time">2 min ago</div>
                    </div>
                  </div>
                  <div className="ref-activity-item">
                    <div className="ref-act-icon green"><FileText size={12} /></div>
                    <div>
                      <div className="ref-act-title">Deal updated</div>
                      <div className="ref-act-time">15 min ago</div>
                    </div>
                  </div>
                  <div className="ref-activity-item">
                    <div className="ref-act-icon teal"><CheckCircle size={12} /></div>
                    <div>
                      <div className="ref-act-title">Task completed</div>
                      <div className="ref-act-time">1 hr ago</div>
                    </div>
                  </div>
                  <div className="ref-activity-item">
                    <div className="ref-act-icon orange"><DollarSign size={12} /></div>
                    <div>
                      <div className="ref-act-title">Invoice created</div>
                      <div className="ref-act-time">2 hrs ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating notification badge */}
      <div className="ref-float-toast">
        <CheckCircle size={16} color="#16A34A" />
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A' }}>Deal Closed! — $75,000</div>
          <div style={{ fontSize: '0.64rem', color: '#64748B' }}>Acme Corp · Sales Manager</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function PublicWebsite({ onNavigateToLogin, onNavigateToRegister }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  // Careers state
  const [jobsList, setJobsList] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobDeptFilter, setJobDeptFilter] = useState('All');
  const [jobLocFilter, setJobLocFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyForm, setApplyForm] = useState({ fullName: '', email: '', phone: '', resumeUrl: '', coverLetter: '' });
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Contact form state
  const [contactForm, setContactForm] = useState({ fullName: '', email: '', company: '', phone: '', subject: 'General Inquiry', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  // Request Demo form state
  const [demoForm, setDemoForm] = useState({ fullName: '', email: '', company: '', phone: '', numEmployees: '10-50', message: '' });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [demoError, setDemoError] = useState('');

  // Solution modal state
  const [selectedSolution, setSelectedSolution] = useState(null);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const pwContainer = document.querySelector('.pw-root');
    if (pwContainer) pwContainer.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  }, [currentPage]);

  useEffect(() => {
    const handleScroll = (e) => {
      const scrollTop = e.target?.scrollTop || window.scrollY || 0;
      setScrolled(scrollTop > 20);
    };
    const pwContainer = document.querySelector('.pw-root');
    if (pwContainer) {
      pwContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (pwContainer) pwContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch real job postings from MongoDB
  const fetchJobsFromBackend = async () => {
    setJobsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/jobs`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setJobsList(data.data);
      }
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (currentPage === 'careers' || currentPage === 'home') {
      fetchJobsFromBackend();
    }
  }, [currentPage]);

  // Submit Contact Form to Backend / MongoDB
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.fullName || !contactForm.email || !contactForm.message) return;
    setContactSubmitting(true);
    setContactError('');
    setContactSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContactSuccess(true);
        setContactForm({ fullName: '', email: '', company: '', phone: '', subject: 'General Inquiry', message: '' });
      } else {
        setContactError(data.message || 'Error submitting message. Please check required fields.');
      }
    } catch {
      setContactError('Unable to connect to backend server. Please try again.');
    } finally {
      setContactSubmitting(false);
    }
  };

  // Submit Request Demo Form to Backend / MongoDB
  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    if (!demoForm.fullName || !demoForm.email) return;
    setDemoSubmitting(true);
    setDemoError('');
    setDemoSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/public/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDemoSuccess(true);
        setDemoForm({ fullName: '', email: '', company: '', phone: '', numEmployees: '10-50', message: '' });
      } else {
        setDemoError(data.message || 'Error submitting demo request.');
      }
    } catch {
      setDemoError('Unable to connect to backend server.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  // Submit Job Application to Backend / MongoDB (HR)
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob || !applyForm.fullName || !applyForm.email || !applyForm.resumeUrl) return;
    setApplySubmitting(true);
    setApplyError('');
    setApplySuccess(false);

    try {
      const payload = {
        jobId: selectedJob._id || selectedJob.id,
        jobTitle: selectedJob.title,
        fullName: applyForm.fullName,
        email: applyForm.email,
        phone: applyForm.phone,
        resumeUrl: applyForm.resumeUrl,
        coverLetter: applyForm.coverLetter
      };

      const res = await fetch(`${API_BASE}/api/public/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setApplySuccess(true);
        setTimeout(() => {
          setSelectedJob(null);
          setApplySuccess(false);
          setApplyForm({ fullName: '', email: '', phone: '', resumeUrl: '', coverLetter: '' });
        }, 2200);
      } else {
        setApplyError(data.message || 'Error submitting application.');
      }
    } catch {
      setApplyError('Failed to submit application to server.');
    } finally {
      setApplySubmitting(false);
    }
  };

  // Filtered jobs
  const filteredJobs = jobsList.filter(job => {
    const matchesSearch = (job.title || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
                          (job.skills || []).some(s => s.toLowerCase().includes(jobSearch.toLowerCase()));
    const matchesDept = jobDeptFilter === 'All' || job.department === jobDeptFilter;
    const matchesLoc = jobLocFilter === 'All' || job.location === jobLocFilter;
    return matchesSearch && matchesDept && matchesLoc;
  });

  const availableDepts = ['All', ...new Set(jobsList.map(j => j.department).filter(Boolean))];
  const availableLocs = ['All', ...new Set(jobsList.map(j => j.location).filter(Boolean))];

  return (
    <div className="pw-root">

      {/* ──── STICKY NAVBAR ─────────────────────────────────────────────────── */}
      <nav className={`pw-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="pw-nav-inner">
          <div className="pw-nav-logo" onClick={() => setCurrentPage('home')}>
            <div className="pw-logo-icon">N</div>
            <span className="pw-logo-text">NexusCRM</span>
          </div>

          <ul className="pw-nav-links">
            {NAV_ITEMS.map(item => (
              <li key={item.id}>
                <button
                  className={currentPage === item.id ? 'active-nav-item' : ''}
                  onClick={() => setCurrentPage(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="pw-nav-actions">
            <button className="pw-btn-outline-blue" onClick={onNavigateToLogin}>Login</button>
            <button className="pw-btn-primary-blue" onClick={onNavigateToRegister}>Get Started</button>
          </div>

          <button className="pw-nav-hamburger" onClick={() => setMobileMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>

        {/* Responsive Mobile Menu */}
        <div className={`pw-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={currentPage === item.id ? 'active-nav-item' : ''}
              onClick={() => setCurrentPage(item.id)}
            >
              {item.label}
            </button>
          ))}
          <div className="pw-mobile-divider" />
          <div className="pw-mobile-btns">
            <button className="pw-btn-outline-blue" onClick={() => { setMobileMenuOpen(false); onNavigateToLogin(); }}>Login</button>
            <button className="pw-btn-primary-blue" onClick={() => { setMobileMenuOpen(false); onNavigateToRegister(); }}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. HOME PAGE VIEW                                                      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'home' && (
        <>
          <section className="pw-hero">
            <div className="pw-hero-inner">
              <div className="pw-hero-text-col">
                <h1 className="pw-hero-heading">
                  Manage Your Business.<br />
                  <span className="pw-blue-accent">Grow Smarter.</span>
                </h1>
                <p className="pw-hero-description">
                  NexusCRM connects Sales, Marketing, HR, Accounting, Project Management, and executive leadership in one unified, role-based platform — with real-time data flowing between every department.
                </p>
                <div className="pw-hero-btn-row">
                  <button className="pw-btn-hero-solid" onClick={onNavigateToRegister}>
                    Get Started
                  </button>
                  <button className="pw-btn-hero-outline" onClick={() => setCurrentPage('request-demo')}>
                    Request a Demo
                  </button>
                </div>
                <div className="pw-hero-trust-bar">
                  <div className="pw-trust-pill"><ShieldCheck size={16} className="pw-icon-blue" /> Secure & Reliable</div>
                  <div className="pw-trust-pill"><CheckCircle size={16} className="pw-icon-blue" /> Easy to Use</div>
                  <div className="pw-trust-pill"><TrendingUp size={16} className="pw-icon-blue" /> Scalable</div>
                  <div className="pw-trust-pill"><Clock size={16} className="pw-icon-blue" /> 24/7 Support</div>
                </div>
              </div>

              <div className="pw-hero-visual-col">
                <HeroDashboardMockup />
              </div>
            </div>
          </section>

          {/* Features Preview Section */}
          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              <div className="pw-section-heading-center">
                <h2>Powerful <span className="pw-text-blue">Features</span> to Move Your Business Forward</h2>
              </div>
              <div className="pw-features-8grid">
                {FEATURES_DATA.map(f => (
                  <div key={f.id} className="pw-feature-pill-card" onClick={() => setCurrentPage('features')}>
                    <div className="pw-feat-icon-box" style={{ background: f.color }}>
                      <f.icon size={24} color={f.iconColor} />
                    </div>
                    <div className="pw-feat-card-title">{f.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '36px' }}>
                <button className="pw-btn-outline-blue" onClick={() => setCurrentPage('features')}>
                  Explore All Features <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </section>

          {/* Solutions Preview Section */}
          <section className="pw-section pw-bg-light">
            <div className="pw-container">
              <div className="pw-section-heading-center">
                <h2>Solutions for Every Department</h2>
              </div>
              <div className="pw-solutions-7grid">
                {SOLUTIONS_DATA.map(s => (
                  <div key={s.key} className="pw-sol-card">
                    <div className="pw-sol-icon-circle" style={{ background: s.bg }}>
                      <s.icon size={26} color={s.color} />
                    </div>
                    <h3 className="pw-sol-title">{s.role}</h3>
                    <p className="pw-sol-desc">{s.desc}</p>
                    <button className="pw-sol-link" onClick={() => setSelectedSolution(s)}>
                      Learn More <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Teaser */}
          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              <div className="pw-section-heading-center">
                <h2>How <span className="pw-text-blue">NexusCRM</span> Works</h2>
                <p style={{ color: '#64748B', maxWidth: '600px', margin: '8px auto 0' }}>
                  Real-time connected CRM workflow spanning all major departments.
                </p>
              </div>
              <div className="pw-wf-container">
                {WORKFLOW_STEPS.map((s, idx) => (
                  <React.Fragment key={s.step}>
                    <div className="pw-wf-item" onClick={() => setCurrentPage('how-it-works')} style={{ cursor: 'pointer' }}>
                      <div className="pw-wf-badge-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{s.step}</span>
                      </div>
                      <div className="pw-wf-title">{s.title}</div>
                      <div className="pw-wf-subtitle">{s.desc}</div>
                    </div>
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <div className="pw-wf-chevron"><ArrowRight size={18} color="#94A3B8" /></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '36px' }}>
                <button className="pw-btn-primary-blue" onClick={() => setCurrentPage('how-it-works')}>
                  See Full Workflow Details <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. FEATURES PAGE VIEW (/features)                                      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'features' && (
        <div className="pw-page-wrapper">
          <div className="pw-page-header">
            <div className="pw-container">
              <span className="pw-page-badge"><Layers size={14} /> Platform Capabilities</span>
              <h1 className="pw-page-title">Powerful Features to Move Your Business Forward</h1>
              <p className="pw-page-subtitle">
                Discover the end-to-end features built into NexusCRM. Every module is deeply connected to eliminate silos and drive maximum growth.
              </p>
            </div>
          </div>

          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              <div className="pw-full-features-grid">
                {FEATURES_DATA.map(f => (
                  <div key={f.id} className="pw-full-feat-card">
                    <div className="pw-feat-icon-box" style={{ background: f.color }}>
                      <f.icon size={28} color={f.iconColor} />
                    </div>
                    <h3>{f.label}</h3>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="pw-section pw-bg-light">
            <div className="pw-container" style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Ready to experience these features in live action?</h2>
              <p style={{ color: '#64748B', marginBottom: '24px' }}>Start your 14-day free trial today or request a live demonstration.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="pw-btn-primary-blue" onClick={onNavigateToRegister}>Get Started Free</button>
                <button className="pw-btn-outline-blue" onClick={() => setCurrentPage('request-demo')}>Request a Demo</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. SOLUTIONS PAGE VIEW (/solutions)                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'solutions' && (
        <div className="pw-page-wrapper">
          <div className="pw-page-header">
            <div className="pw-container">
              <span className="pw-page-badge"><Users size={14} /> Department Solutions</span>
              <h1 className="pw-page-title">Solutions for Every Department</h1>
              <p className="pw-page-subtitle">
                NexusCRM provides role-tailored portals for every member of your organization, ensuring everyone has the exact tools they need.
              </p>
            </div>
          </div>

          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              <div className="pw-solutions-7grid">
                {SOLUTIONS_DATA.map(s => (
                  <div key={s.key} className="pw-sol-card">
                    <div className="pw-sol-icon-circle" style={{ background: s.bg }}>
                      <s.icon size={28} color={s.color} />
                    </div>
                    <h3 className="pw-sol-title">{s.role}</h3>
                    <p className="pw-sol-desc">{s.desc}</p>
                    <button className="pw-sol-link" onClick={() => setSelectedSolution(s)}>
                      Learn More <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. HOW IT WORKS PAGE VIEW (/how-it-works)                              */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'how-it-works' && (
        <div className="pw-page-wrapper">
          <div className="pw-page-header">
            <div className="pw-container">
              <span className="pw-page-badge"><Activity size={14} /> Connected Ecosystem</span>
              <h1 className="pw-page-title">How NexusCRM Works</h1>
              <p className="pw-page-subtitle">
                A seamless data lifecycle from lead generation to deal closing, invoice payment, and executive business analytics.
              </p>
            </div>
          </div>

          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              <div className="pw-detailed-steps-list">
                {WORKFLOW_STEPS.map((step) => (
                  <div key={step.step} className="pw-detailed-step-card">
                    <div className="pw-step-number">{step.step}</div>
                    <div className="pw-step-content">
                      <h3>{step.title}</h3>
                      <div className="pw-step-tag">{step.desc}</div>
                      <p>{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '48px', padding: '32px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Connected HR, Project, and Employee Workflows</h3>
                <p style={{ color: '#475569', lineHeight: 1.6 }}>
                  Beyond Sales and Accounting, NexusCRM automatically synchronizes HR employee records, project manager deliverables, and employee task updates in real time — keeping your entire company aligned without redundant data entry.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 5. PRICING PAGE VIEW (/pricing)                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'pricing' && (
        <div className="pw-page-wrapper">
          <div className="pw-page-header">
            <div className="pw-container">
              <span className="pw-page-badge"><DollarSign size={14} /> Transparent Pricing</span>
              <h1 className="pw-page-title">Simple, Transparent Pricing</h1>
              <p className="pw-page-subtitle">
                Choose the perfect plan for your business. All plans include access to our role-based portal architecture.
              </p>

              {/* Billing Toggle */}
              <div className="pw-billing-toggle">
                <button
                  className={billingCycle === 'monthly' ? 'active' : ''}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly Billing
                </button>
                <button
                  className={billingCycle === 'yearly' ? 'active' : ''}
                  onClick={() => setBillingCycle('yearly')}
                >
                  Yearly Billing <span className="pw-save-chip">Save 20%</span>
                </button>
              </div>
            </div>
          </div>

          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              <div className="pw-pricing-4grid">
                {PRICING_PLANS.map(p => {
                  const priceVal = billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly;
                  const priceDisplay = typeof priceVal === 'number' ? `$${priceVal}` : priceVal;
                  return (
                    <div key={p.name} className={`pw-price-box ${p.popular ? 'popular' : ''}`}>
                      {p.popular && <div className="pw-pop-tag">Popular</div>}
                      <h3 className="pw-price-name">{p.name}</h3>
                      <div className="pw-price-row">
                        <span className="pw-price-val">{priceDisplay}</span>
                        <span className="pw-price-per">{p.priceMonthly === 'Custom' ? '' : '/month'}</span>
                      </div>
                      <p className="pw-price-sub">{p.desc}</p>

                      <ul className="pw-price-list">
                        {p.features.map(feat => (
                          <li key={feat}><Check size={14} className="pw-check-blue" /> {feat}</li>
                        ))}
                      </ul>

                      <button
                        className={`pw-price-btn ${p.popular ? 'solid' : 'outline'}`}
                        onClick={() => p.name === 'Enterprise' ? setCurrentPage('contact') : onNavigateToRegister()}
                      >
                        {p.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pricing FAQs */}
              <div style={{ marginTop: '64px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', color: '#0F172A', marginBottom: '32px' }}>
                  Frequently Asked Questions
                </h3>
                <div className="pw-faq-grid">
                  {PRICING_FAQS.map(faq => (
                    <div key={faq.q} className="pw-faq-card">
                      <div className="pw-faq-q"><HelpCircle size={16} color="#2563EB" /> {faq.q}</div>
                      <div className="pw-faq-a">{faq.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 6. CAREERS PAGE VIEW (/careers)                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'careers' && (
        <div className="pw-page-wrapper">
          <div className="pw-page-header">
            <div className="pw-container">
              <span className="pw-page-badge"><Briefcase size={14} /> Open Positions</span>
              <h1 className="pw-page-title">Join Our Team</h1>
              <p className="pw-page-subtitle">Build the future of enterprise CRM with us.</p>
            </div>
          </div>

          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              {/* Search & Filter Bar */}
              <div className="pw-careers-filter-bar">
                <div className="pw-search-input-box">
                  <Search size={16} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="Search job title or skill (e.g. React, Node, HR)..."
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                  />
                </div>

                <div className="pw-filter-select-group">
                  <select value={jobDeptFilter} onChange={e => setJobDeptFilter(e.target.value)}>
                    <option value="All">All Departments</option>
                    {availableDepts.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select value={jobLocFilter} onChange={e => setJobLocFilter(e.target.value)}>
                    <option value="All">All Locations</option>
                    {availableLocs.filter(l => l !== 'All').map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Job List */}
              {jobsLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>Loading open positions from MongoDB...</div>
              ) : filteredJobs.length > 0 ? (
                <div className="pw-jobs-4grid">
                  {filteredJobs.map(job => (
                    <div key={job._id || job.id} className="pw-job-box">
                      <div className="pw-job-icon-square"><Briefcase size={22} color="#2563EB" /></div>
                      <h3 className="pw-job-role">{job.title}</h3>
                      <div className="pw-job-meta-line">{job.location || 'Lahore, Pakistan'} • {job.employmentType || job.type || 'Full-time'}</div>
                      <div className="pw-job-skills-line">
                        {Array.isArray(job.skills) ? job.skills.join(', ') : job.department}
                      </div>
                      <button className="pw-job-apply-link" onClick={() => setSelectedJob(job)}>
                        Apply Now <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pw-jobs-empty">
                  <Briefcase size={36} color="#CBD5E1" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <h4>No Positions Found</h4>
                  <p>Try adjusting your search query or filters.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 7. ABOUT PAGE VIEW (/about)                                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'about' && (
        <div className="pw-page-wrapper">
          <div className="pw-page-header">
            <div className="pw-container">
              <span className="pw-page-badge"><Building2 size={14} /> Company Profile</span>
              <h1 className="pw-page-title">About NexusCRM</h1>
              <p className="pw-page-subtitle">
                Connecting departments, empowering teams, and unifying modern business operations on one intelligent platform.
              </p>
            </div>
          </div>

          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              {/* Stats Bar */}
              <div className="pw-about-stats-grid">
                <div className="pw-stat-card">
                  <div className="pw-stat-num">500+</div>
                  <div className="pw-stat-lbl">Enterprise Customers</div>
                </div>
                <div className="pw-stat-card">
                  <div className="pw-stat-num">50K+</div>
                  <div className="pw-stat-lbl">Active Portal Users</div>
                </div>
                <div className="pw-stat-card">
                  <div className="pw-stat-num">99.9%</div>
                  <div className="pw-stat-lbl">System Uptime</div>
                </div>
                <div className="pw-stat-card">
                  <div className="pw-stat-num">24/7</div>
                  <div className="pw-stat-lbl">Dedicated Support</div>
                </div>
              </div>

              {/* Mission & Vision Content */}
              <div className="pw-about-content-grid">
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>Our Mission</h2>
                  <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '20px' }}>
                    To break down operational barriers between departments by providing a unified, real-time CRM platform where Marketing, Sales, HR, Accounting, Project Managers, and Executives operate from a single source of truth.
                  </p>

                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>Our Vision</h2>
                  <p style={{ color: '#475569', lineHeight: 1.7 }}>
                    We envision a future where business productivity is effortless — where closing a deal automatically triggers accounting workflows, qualified leads transition seamlessly into sales pipelines, and executive leaders make data-backed decisions with complete visibility.
                  </p>
                </div>

                <div className="pw-about-highlight-box">
                  <div className="pw-badge-blue">Connected Architecture</div>
                  <h3>Why Choose NexusCRM?</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', color: '#334155' }}><CheckCircle size={16} color="#2563EB" /> Centralized MongoDB Database</li>
                    <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', color: '#334155' }}><CheckCircle size={16} color="#2563EB" /> 9 Purpose-Built Department Portals</li>
                    <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', color: '#2563EB' }}><CheckCircle size={16} color="#2563EB" /> Enterprise Role-Based Access Control</li>
                    <li style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', color: '#334155' }}><CheckCircle size={16} color="#2563EB" /> Real-time Cross-Department Notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 8. CONTACT PAGE VIEW (/contact)                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'contact' && (
        <div className="pw-page-wrapper">
          <div className="pw-page-header">
            <div className="pw-container">
              <span className="pw-page-badge"><MessageSquare size={14} /> Get In Touch</span>
              <h1 className="pw-page-title">Get In Touch</h1>
              <p className="pw-page-subtitle">We are here to answer your questions and assist your business growth.</p>
            </div>
          </div>

          <section className="pw-section pw-bg-white">
            <div className="pw-container">
              <div className="pw-contact-wrapper">
                <div className="pw-contact-info-col">
                  <h2>Contact Information</h2>
                  <p>Our team is available Monday through Friday, 9:00 AM – 6:00 PM PKT.</p>

                  <div className="pw-contact-items-list">
                    <div className="pw-contact-item">
                      <Phone size={18} color="#2563EB" /> <span>+92 300 1234567</span>
                    </div>
                    <div className="pw-contact-item">
                      <Mail size={18} color="#2563EB" /> <span>info@nexuscrm.com</span>
                    </div>
                    <div className="pw-contact-item">
                      <MapPin size={18} color="#2563EB" /> <span>123 Business Street, Lahore, Pakistan</span>
                    </div>
                    <div className="pw-contact-item">
                      <Clock size={18} color="#2563EB" /> <span>Monday – Friday (9:00 AM – 6:00 PM)</span>
                    </div>
                  </div>
                </div>

                <div className="pw-contact-form-col">
                  <form className="pw-form-card" onSubmit={handleContactSubmit}>
                    <h3>Send Us a Message</h3>
                    <div className="pw-form-field">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John Smith"
                        value={contactForm.fullName}
                        onChange={e => setContactForm({ ...contactForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="pw-form-field">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="john@company.com"
                        value={contactForm.email}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      />
                    </div>
                    <div className="pw-form-field">
                      <label>Company</label>
                      <input
                        type="text"
                        placeholder="Acme Corporation"
                        value={contactForm.company}
                        onChange={e => setContactForm({ ...contactForm, company: e.target.value })}
                      />
                    </div>
                    <div className="pw-form-field">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+92 300 0000000"
                        value={contactForm.phone}
                        onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="pw-form-field">
                      <label>Subject</label>
                      <input
                        type="text"
                        placeholder="Inquiry Topic"
                        value={contactForm.subject}
                        onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                      />
                    </div>
                    <div className="pw-form-field">
                      <label>Message *</label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Your message details..."
                        value={contactForm.message}
                        onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="pw-btn-primary-blue" disabled={contactSubmitting}>
                      {contactSubmitting ? 'Sending...' : 'Send Message'}
                    </button>

                    {contactSuccess && (
                      <div className="pw-form-alert-success">
                        <CheckCircle size={16} /> Thank you! Your message has been saved in MongoDB and our team will get back to you.
                      </div>
                    )}
                    {contactError && (
                      <div style={{ marginTop: '12px', padding: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '0.85rem' }}>
                        {contactError}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 9. REQUEST A DEMO PAGE VIEW (/request-demo)                           */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {currentPage === 'request-demo' && (
        <div className="pw-page-wrapper">
          <div className="pw-page-header">
            <div className="pw-container">
              <span className="pw-page-badge"><Play size={14} /> Live Demonstration</span>
              <h1 className="pw-page-title">Request a Demo</h1>
              <p className="pw-page-subtitle">Experience a personalized walkthrough of NexusCRM tailored to your team's exact requirements.</p>
            </div>
          </div>

          <section className="pw-section pw-bg-white">
            <div className="pw-container" style={{ maxWidth: '640px' }}>
              <form className="pw-form-card" onSubmit={handleDemoSubmit}>
                <h3>Schedule Your Demo</h3>
                <div className="pw-form-field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ali Raza"
                    value={demoForm.fullName}
                    onChange={e => setDemoForm({ ...demoForm, fullName: e.target.value })}
                  />
                </div>
                <div className="pw-form-field">
                  <label>Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="ali@company.com"
                    value={demoForm.email}
                    onChange={e => setDemoForm({ ...demoForm, email: e.target.value })}
                  />
                </div>
                <div className="pw-form-field">
                  <label>Company Name</label>
                  <input
                    type="text"
                    placeholder="Company Ltd"
                    value={demoForm.company}
                    onChange={e => setDemoForm({ ...demoForm, company: e.target.value })}
                  />
                </div>
                <div className="pw-form-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={demoForm.phone}
                    onChange={e => setDemoForm({ ...demoForm, phone: e.target.value })}
                  />
                </div>
                <div className="pw-form-field">
                  <label>Number of Employees</label>
                  <select
                    value={demoForm.numEmployees}
                    onChange={e => setDemoForm({ ...demoForm, numEmployees: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
                  >
                    <option value="1-10">1 – 10 Employees</option>
                    <option value="10-50">10 – 50 Employees</option>
                    <option value="50-200">50 – 200 Employees</option>
                    <option value="200+">200+ Employees</option>
                  </select>
                </div>
                <div className="pw-form-field">
                  <label>Message / Specific Focus Areas</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what workflow (Sales, HR, Accounting, Projects) you'd like to focus on..."
                    value={demoForm.message}
                    onChange={e => setDemoForm({ ...demoForm, message: e.target.value })}
                  />
                </div>
                <button type="submit" className="pw-btn-primary-blue" disabled={demoSubmitting}>
                  {demoSubmitting ? 'Submitting Request...' : 'Submit Request'}
                </button>

                {demoSuccess && (
                  <div className="pw-form-alert-success">
                    <CheckCircle size={16} /> Demo request submitted successfully! Our product specialist will contact you within 24 hours.
                  </div>
                )}
                {demoError && (
                  <div style={{ marginTop: '12px', padding: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '0.85rem' }}>
                    {demoError}
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>
      )}

      {/* ──── COMMON FOOTER ─────────────────────────────────────────────────── */}
      <footer className="pw-footer">
        <div className="pw-container">
          <div className="pw-footer-grid">
            <div className="pw-footer-col">
              <div className="pw-footer-logo">
                <div className="pw-logo-icon">N</div>
                <span>NexusCRM</span>
              </div>
              <p className="pw-footer-desc">
                All-in-one CRM solution to help your business grow smarter and faster.
              </p>
              <div className="pw-footer-socials">
                <div className="pw-social-btn">f</div>
                <div className="pw-social-btn">t</div>
                <div className="pw-social-btn">in</div>
                <div className="pw-social-btn">yt</div>
              </div>
            </div>

            <div className="pw-footer-col">
              <h4>Quick Links</h4>
              <ul className="pw-footer-ul">
                <li onClick={() => setCurrentPage('home')}>Home</li>
                <li onClick={() => setCurrentPage('features')}>Features</li>
                <li onClick={() => setCurrentPage('solutions')}>Solutions</li>
                <li onClick={() => setCurrentPage('how-it-works')}>How It Works</li>
                <li onClick={() => setCurrentPage('pricing')}>Pricing</li>
                <li onClick={() => setCurrentPage('careers')}>Careers</li>
                <li onClick={() => setCurrentPage('about')}>About Us</li>
                <li onClick={() => setCurrentPage('contact')}>Contact</li>
              </ul>
            </div>

            <div className="pw-footer-col">
              <h4>Solutions</h4>
              <ul className="pw-footer-ul">
                {SOLUTIONS_DATA.slice(0, 6).map(s => (
                  <li key={s.role} onClick={() => setCurrentPage('solutions')}>{s.role} Management</li>
                ))}
              </ul>
            </div>

            <div className="pw-footer-col">
              <h4>Contact Us</h4>
              <ul className="pw-footer-ul pw-contact-ul">
                <li><Phone size={14} /> +92 300 1234567</li>
                <li><Mail size={14} /> info@nexuscrm.com</li>
                <li><MapPin size={14} /> 123 Business Street, Lahore, Pakistan</li>
              </ul>
            </div>

            <div className="pw-footer-col">
              <h4>Newsletter</h4>
              <p className="pw-newsletter-text">Subscribe to get updates and latest news.</p>
              <form className="pw-newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing to NexusCRM newsletter!'); }}>
                <input type="email" placeholder="Enter your email" required />
                <button type="submit">Subscribe</button>
              </form>
            </div>
          </div>

          <div className="pw-footer-bottom">
            <span>© 2026 NexusCRM. All rights reserved.</span>
            <div className="pw-footer-legal-links">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ──── SOLUTION DETAIL MODAL ────────────────────────────────────────────── */}
      {selectedSolution && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedSolution(null)}>
          <div className="pw-modal-card" onClick={e => e.stopPropagation()}>
            <button className="pw-modal-close" onClick={() => setSelectedSolution(null)}><X size={18} /></button>
            <div className="pw-modal-icon-header" style={{ background: selectedSolution.bg }}>
              <selectedSolution.icon size={32} color={selectedSolution.color} />
            </div>
            <h3>{selectedSolution.role} Portal</h3>
            <p className="pw-modal-body-text">{selectedSolution.details}</p>
            <div className="pw-modal-actions">
              <button className="pw-btn-primary-blue" onClick={() => { setSelectedSolution(null); onNavigateToLogin(); }}>
                Sign In to {selectedSolution.role} Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── JOB APPLY MODAL (Converts to MongoDB Job Application) ──────────── */}
      {selectedJob && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="pw-modal-card" onClick={e => e.stopPropagation()}>
            <button className="pw-modal-close" onClick={() => setSelectedJob(null)}><X size={18} /></button>
            <h3>Apply for {selectedJob.title}</h3>
            <p className="pw-modal-sub">{selectedJob.location || 'Lahore, Pakistan'} • {selectedJob.employmentType || selectedJob.type || 'Full-time'}</p>

            {applySuccess ? (
              <div className="pw-modal-success">
                <CheckCircle size={36} color="#16A34A" />
                <h4>Application Submitted!</h4>
                <p>Your application has been saved in MongoDB and forwarded to HR.</p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="pw-apply-form">
                <div className="pw-form-field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ali Raza"
                    value={applyForm.fullName}
                    onChange={e => setApplyForm({ ...applyForm, fullName: e.target.value })}
                  />
                </div>
                <div className="pw-form-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="ali@example.com"
                    value={applyForm.email}
                    onChange={e => setApplyForm({ ...applyForm, email: e.target.value })}
                  />
                </div>
                <div className="pw-form-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={applyForm.phone}
                    onChange={e => setApplyForm({ ...applyForm, phone: e.target.value })}
                  />
                </div>
                <div className="pw-form-field">
                  <label>Resume / Portfolio Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://linkedin.com/in/username or Google Drive link"
                    value={applyForm.resumeUrl}
                    onChange={e => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                  />
                </div>
                <div className="pw-form-field">
                  <label>Cover Note</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your experience..."
                    value={applyForm.coverLetter}
                    onChange={e => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                  />
                </div>
                <button type="submit" className="pw-btn-primary-blue" disabled={applySubmitting}>
                  {applySubmitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
                {applyError && (
                  <div style={{ marginTop: '8px', color: '#DC2626', fontSize: '0.8rem' }}>{applyError}</div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

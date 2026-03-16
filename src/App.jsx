import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabase.js';
import { Search, Filter, Github, Twitter, MessageCircle, AlertCircle } from 'lucide-react';
import Nav from './components/Nav.jsx';
import ProjectCard from './components/ProjectCard.jsx';
import ProjectModal from './components/ProjectModal.jsx';
import SubmitProject from './components/SubmitProject.jsx';
import UpdateProject from './components/UpdateProject.jsx';
import Toast from './components/Toast.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { CATEGORIES } from './data/projects.js';
import { useChain } from '@interchain-kit/react'
import { useTheme } from '@interchain-ui/react';
import { sendAdminApproveNotification, sendAdminDeclineNotification } from './utils/discord.js';
import GpuMiner from './components/GpuMiner.jsx';
import NetworkDashboard from './components/NetworkDashboard.jsx';

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: '55%' }} />
          <div className="skeleton" style={{ height: 10, width: '28%', borderRadius: 12 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 12, width: '95%' }} />
      <div className="skeleton" style={{ height: 12, width: '75%' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 20, width: 48, borderRadius: 4 }} />)}
      </div>
      <div className="skeleton" style={{ height: 42, borderRadius: 10 }} />
    </div>
  );
}

function StatBar({ projects }) {
  const approved = projects.filter(p => p.approvalStatus === 'approved');

  const thisWeek = approved.filter(p => {
    const d = new Date(p.lastUpdated);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  }).length;

  const stats = [
    { label: 'Total Projects', value: approved.length },
    { label: 'Categories', value: CATEGORIES.length - 1 },
    { label: 'Added This Week', value: thisWeek },
    { label: 'Live Projects', value: approved.filter(p => p.status === 'Live').length },
  ];


  return (
    <div className="stat-bar">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-value">{String(s.value).padStart(2, '0')}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero({ search, setSearch, setView }) {
  return (
    <div className="hero">
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 500, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(0,255,111,0.07) 0%, transparent 65%)',
      }} />

      <div style={{
        position: 'relative',
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: 32,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 20,
          background: 'rgba(0,255,111,0.06)',
          border: '1px solid rgba(0,255,111,0.18)',
        }}>
          <img src="/logo.png" alt="Republic Logo" width="16" height="16" style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            The Republic Economy
          </span>
        </div>

        <h1 className="hero-tagline">
          Live &amp; <span className="accent">Expanding.</span>
        </h1>

        <p style={{
          fontSize: 16,
          color: 'var(--text-secondary)',
          maxWidth: 500,
          lineHeight: 1.7,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          marginTop: -10,
        }}>
          The definitive directory for every project, protocol, and team building within the Republic ecosystem.
        </p>

        <button
          onClick={() => setView('submit')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            borderRadius: 12,
            border: '1px solid var(--accent-green-border)',
            background: 'var(--accent-green-glow)',
            color: 'var(--accent-green)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
            marginTop: -8,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,255,111,0.14)';
            e.currentTarget.style.borderColor = 'rgba(0,255,111,0.5)';
            e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,111,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--accent-green-glow)';
            e.currentTarget.style.borderColor = 'var(--accent-green-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1V13M1 7H13" stroke="#00FF6F" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Submit your Project
        </button>

      </div>
    </div>
  );
}

function Footer({ onAdminClick }) {
  return (
    <footer className="footer" style={{ marginTop: 80 }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '36px 24px',
        display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 250px' }}>
          <img src="/logo.png" alt="Republic Logo" width="24" height="24" style={{ objectFit: 'contain' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '-0.03em', color: 'var(--text-secondary)' }}>
            Built for <span style={{ color: 'var(--accent-green)' }}>RepublicAI</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', flex: '2 1 400px', justifyContent: 'center' }}>
          {[
            { label: 'Docs', href: 'https://docs.republicai.io' },
            { label: 'Twitter', href: 'https://twitter.com/Republic', Icon: Twitter },
            { label: 'Discord', href: 'https://discord.gg/republic', Icon: MessageCircle },
            { label: 'GitHub', href: 'https://github.com/republic', Icon: Github },
          ].map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {Icon && <Icon size={13} />} {label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Martian Mono, monospace', flex: '1 1 250px', textAlign: 'right' }}>
          © 2026 RepublicAI Explorer
        </p>
      </div>
    </footer>
  );
}

function NotificationBanner({ project, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(project.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [project.id, onDismiss]);

  return (
    <div style={{ 
      background: project.approvalStatus === 'approved' ? 'rgba(0,255,111,0.15)' : 'rgba(255,59,92,0.15)',
      border: `1px solid ${project.approvalStatus === 'approved' ? 'var(--accent-green-border)' : 'rgba(255,59,92,0.3)'}`,
      backdropFilter: 'blur(10px)',
      padding: '10px 24px',
      borderRadius: 30,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      pointerEvents: 'auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.3s ease'
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        {project.approvalStatus === 'approved' 
          ? `Your project '${project.name}' has been approved and is now live!`
          : `Your project '${project.name}' was not approved. You may resubmit with updated info.`
        }
      </span>
      <button 
        onClick={() => onDismiss(project.id)}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
      >
        <span style={{ fontSize: 16 }}>&times;</span>
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('explorer');
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);


  const { connect, disconnect, address, status, wallet } = useChain('republicaitestnet');
  
  const connectedWallet = useMemo(() => {
    return status === 'Connected' && address ? { address, walletType: wallet?.name || 'Wallet' } : null;
  }, [address, status, wallet?.name]);

  const [toastMessage, setToastMessage] = useState(null);

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
    showToast('Wallet disconnected', 'success');
  };

  const [dismissedBanners, setDismissedBanners] = useState(new Set());
  const [config, setConfig] = useState({ isAdmin: false, REPUBLIC_RPC_URL: '' });

  useEffect(() => {
    // Check localStorage first
    const cachedAdmin = localStorage.getItem('isAdmin') === 'true';
    if (cachedAdmin && !config.isAdmin) {
      setConfig(prev => ({ ...prev, isAdmin: true }));
    }

    const fetchConfig = async () => {
      if (status === 'Connecting') return;

      try {
        const { data, error } = await supabase.functions.invoke('app-config', {
          body: { wallet: connectedWallet?.address }
        });
        if (error) throw error;
        if (data) {
          setConfig(data);
          localStorage.setItem('isAdmin', data.isAdmin);
        }
      } catch (err) {
        console.warn('Failed to fetch app config:', err.message);
      }
    };
    fetchConfig();
  }, [connectedWallet?.address, status]);

  const isAdminWallet = config.isAdmin;

  const showToast = (message, type = 'success') => setToastMessage({ message, type });

  const sanitize = (text) => {
    if (!text) return '';

    return text.toString().replace(/<[^>]*>?/gm, '');
  };

  const approveProject = async (id) => {
    const project = projects.find(p => p.id === id);
    const { error } = await supabase
      .from('projects')
      .update({ approval_status: 'approved' })
      .eq('id', id);
    if (error) {
      showToast('Failed to approve project', 'error');
    } else {
      await fetchProjects();
      showToast('Project approved ✓', 'success');
      if (project) sendAdminApproveNotification(project).catch(err => console.error(err));
    }
  };

  const declineProject = async (id) => {
    if (!isAdminWallet) {
      showToast('Admin access required', 'error');
      return;
    }
    
    const project = projects.find(p => p.id === id);
    
    // Instead of a direct DELETE (subject to RLS), use the RPC we just created
    // This function has SECURITY DEFINER and bypasses RLS for authorized admin wallet.
    const { error } = await supabase.rpc('admin_delete_project', {
      project_id: id,
      requester_wallet: connectedWallet?.address
    });
    
    if (error) {
      console.error('Delete error:', error);
      showToast('Action failed: ' + error.message, 'error');
    } else {
      await fetchProjects();
      showToast('Project declined and removed', 'success');
      if (project) sendAdminDeclineNotification(project).catch(err => console.error(err));
    }
  };

  const hideProject = async (id) => {
    const { error } = await supabase
      .from('projects')
      .update({ approval_status: 'pending' })
      .eq('id', id);
    if (error) {
      showToast('Failed to hide project', 'error');
    } else {
      await fetchProjects();
      showToast('Project hidden (Under Review)', 'success');
    }
  };

  const userNotifications = useMemo(() => {
    if (!connectedWallet) return [];
    return projects.filter(p => 
      p.isOwner && 
      (p.approvalStatus === 'approved' || p.approvalStatus === 'declined') &&
      !dismissedBanners.has(p.id)
    );
  }, [projects, connectedWallet, dismissedBanners]);

  const dismissBanner = (id) => {
    setDismissedBanners(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {

      const isAdmin = config.isAdmin;
      

      const columns = `
        id, name, short_desc, full_desc, category, tags, 
        website, twitter, discord, github, logo_color, 
        logo_text, logo_url, image_url, status, 
        metric_label, metric_value, last_updated, approval_status
        ${isAdmin ? ', wallet_address' : ''}
      `;

      const { data: publicData, error: publicError } = await supabase
        .from('projects')
        .select(columns)
        .order('created_at', { ascending: false });
      
      if (publicError) {
        console.error('Supabase fetch error:', publicError);
        showToast('Failed to load projects', 'error');
        return;
      }


      let ownedIds = new Set();
      if (connectedWallet) {
        const { data: userData } = await supabase
          .from('projects')
          .select('id')
          .eq('wallet_address', connectedWallet.address);
        if (userData) {
          ownedIds = new Set(userData.map(p => p.id));
        }
      }

      const normalized = publicData.map(p => {
        const isOwner = ownedIds.has(p.id);
        return {
          id: p.id,
          name: p.name,
          shortDesc: p.short_desc,
          fullDesc: p.full_desc,
          category: p.category,
          tags: p.tags || [],
          website: p.website,
          twitter: p.twitter,
          discord: p.discord,
          github: p.github,
          logoColor: p.logo_color,
          logoText: p.logo_text,
          logoUrl: p.logo_url,
          imageUrl: p.image_url,
          status: p.status,
          metricLabel: p.metric_label,
          metricValue: p.metric_value,
          lastUpdated: p.last_updated ? new Date(p.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
          approvalStatus: p.approval_status,

          walletAddress: isAdmin ? p.wallet_address : (isOwner ? connectedWallet.address : undefined),
          isOwner: isOwner
        };
      });
      
      setProjects(normalized);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [connectedWallet, config.isAdmin]);

  useEffect(() => { 
    fetchProjects(); 
  }, [fetchProjects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    
    let baseProjects = projects;
    if (activeCategory === 'My Projects' && connectedWallet) {
      baseProjects = projects.filter(p => p.isOwner);
    } else {
      baseProjects = projects.filter(p => p.approvalStatus === 'approved');
    }
    
    return baseProjects.filter(p => {
      const matchCat = (activeCategory === 'All' || activeCategory === 'My Projects') ? true : p.category === activeCategory;
      const matchSearch = !q || (
        p.name.toLowerCase().includes(q) ||
        p.shortDesc.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
      return matchCat && matchSearch;
    });
  }, [projects, search, activeCategory, connectedWallet]);

  const handleSubmit = async (project) => {
    const duplicate = projects.some(
      p => p.name.trim().toLowerCase() === project.name.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error(`A project named "${project.name}" already exists. Please use a unique name.`);
    }

    const sameUrl = projects.some(
      p => p.website && p.website.trim().toLowerCase() === project.website.trim().toLowerCase()
    );
    if (sameUrl) {
      throw new Error(`A project with this website URL already exists.`);
    }

    const { error } = await supabase.from('projects').insert({
      id: project.id,
      name: sanitize(project.name),
      short_desc: sanitize(project.shortDesc),
      full_desc: sanitize(project.fullDesc),
      category: sanitize(project.category),
      tags: project.tags,
      website: sanitize(project.website),
      twitter: sanitize(project.twitter),
      discord: sanitize(project.discord),
      github: sanitize(project.github),
      logo_color: project.logoColor,
      logo_text: sanitize(project.logoText),
      logo_url: project.logoUrl,
      image_url: project.imageUrl,
      status: project.status,
      metric_label: sanitize(project.metricLabel),
      metric_value: sanitize(project.metricValue),
      wallet_address: project.walletAddress,
      approval_status: 'pending',
    });
    if (error) {
      console.error('Insert error:', error);
      throw new Error('Failed to submit project: ' + error.message);
    }
    await fetchProjects();
  };

  const handleUpdate = async (updated) => {
    const { error } = await supabase.from('projects').update({
      name: sanitize(updated.name),
      short_desc: sanitize(updated.shortDesc),
      full_desc: sanitize(updated.fullDesc),
      category: sanitize(updated.category),
      tags: updated.tags,
      website: sanitize(updated.website),
      twitter: sanitize(updated.twitter),
      discord: sanitize(updated.discord),
      github: sanitize(updated.github),
      logo_color: updated.logoColor,
      logo_text: sanitize(updated.logoText),
      logo_url: updated.logoUrl,
      image_url: updated.imageUrl,
      status: updated.status,
      metric_label: sanitize(updated.metricLabel),
      metric_value: sanitize(updated.metricValue),
      last_updated: new Date().toISOString(),
    }).eq('id', updated.id);
    if (error) {
      console.error('Update error:', error);
      showToast('Failed to update project', 'error');
    } else {
      await fetchProjects();
    }
  };

  const asciiContent = useMemo(() => {
    const chars = '@R*=:. ';
    let result = '';
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 40; j++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      result += '\n';
    }
    return result;
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div className="page-bg">

        <div className="bg-ascii">{asciiContent}</div>
        <div className="bg-noise" />
        <div className="bg-glow-layers" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Nav 
          view={view} 
          setView={setView} 
          connectedWallet={connectedWallet}
          isAdminWallet={isAdminWallet}
          onConnectClick={handleConnect}
          onDisconnect={handleDisconnect}
        />

        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 6000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, pointerEvents: 'none' }}>
          {userNotifications.length > 0 && (
            <NotificationBanner 
              key={userNotifications[0].id} 
              project={userNotifications[0]} 
              onDismiss={dismissBanner} 
            />
          )}
        </div>

        <div style={{ flex: 1 }}>
          {view === 'explorer' && (
            <>
            <Hero search={search} setSearch={setSearch} setView={setView} />
            <StatBar projects={projects} />

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12, marginBottom: 32 }}>
                <div className="search-container" style={{ maxWidth: 600, margin: '0 auto', width: '100%', marginBottom: 8 }}>
                  <Search size={15} className="search-icon" />
                  <input
                    className="search-input"
                    placeholder="Search projects, categories, tags..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  
                  {connectedWallet && (
                    <button
                      className={`category-pill${activeCategory === 'My Projects' ? ' active' : ''}`}
                      onClick={() => setActiveCategory('My Projects')}
                      style={{ borderColor: activeCategory === 'My Projects' ? 'var(--accent-green-border)' : 'var(--border)', fontWeight: 600 }}
                    >
                      ✨ My Projects
                    </button>
                  )}
                  
                  {CATEGORIES.slice(0, connectedWallet ? 5 : 6).map(cat => (
                    <button
                      key={cat}
                      className={`category-pill${activeCategory === cat ? ' active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  {CATEGORIES.slice(connectedWallet ? 5 : 6).map(cat => (
                    <button
                      key={cat}
                      className={`category-pill${activeCategory === cat ? ' active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {!loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em', fontWeight: 500 }}>
                    {filtered.length} {filtered.length === 1 ? 'project' : 'projects'} found
                  </p>
                  {(search || activeCategory !== 'All') && (
                    <button
                      style={{ fontSize: 12, color: 'var(--accent-green)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                      onClick={() => { setSearch(''); setActiveCategory('All'); }}
                    >
                      Clear filters ×
                    </button>
                  )}
                </div>
              )}

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle size={48} style={{ color: 'var(--text-muted)', opacity: 0.35 }} />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text-secondary)' }}>No projects found</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.65 }}>
                    No projects match your current search or filter. Try adjusting your query.
                  </p>
                  <button className="btn-secondary" onClick={() => { setSearch(''); setActiveCategory('All'); }}>
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                  {filtered.map((project, i) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={setSelectedProject}
                      animDelay={(i % 12) * 0.04}
                      connectedWallet={connectedWallet}
                      isMyProjectsView={activeCategory === 'My Projects'}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === 'submit' && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <SubmitProject onSubmit={handleSubmit} connectedWallet={connectedWallet} onConnectClick={handleConnect} showToast={showToast} />
          </div>
        )}

        {view === 'update' && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <UpdateProject projects={projects} onUpdate={handleUpdate} connectedWallet={connectedWallet} onConnectClick={handleConnect} showToast={showToast} />
          </div>
        )}

        {view === 'gpu-miner' && <GpuMiner />}
        {view === 'dashboard' && <NetworkDashboard />}

          {view === 'admin' && isAdminWallet && (
            <AdminPanel projects={projects} onApprove={approveProject} onDecline={declineProject} onHide={hideProject} />
          )}
        </div>

        <Footer />
      </div>

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      <Toast 
        message={toastMessage?.message} 
        type={toastMessage?.type} 
        onClose={() => setToastMessage(null)} 
      />
    </div>
  );
}

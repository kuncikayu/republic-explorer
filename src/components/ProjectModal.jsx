import { X, Globe, Twitter, MessageCircle, Github, TrendingUp, Calendar, Tag } from 'lucide-react';
import { CATEGORY_BADGE_MAP } from '../data/projects.js';

export default function ProjectModal({ project, onClose }) {
  if (!project) return null;

  const badgeClass = CATEGORY_BADGE_MAP[project.category] || 'badge-defi';
  const statusClass =
    project.status === 'Live' ? 'status-live' :
    project.status === 'Building' ? 'status-building' : 'status-soon';

  const links = [
    { href: project.website, Icon: Globe, label: 'Website' },
    { href: project.twitter, Icon: Twitter, label: 'Twitter / X' },
    { href: project.discord, Icon: MessageCircle, label: 'Discord' },
    { href: project.github, Icon: Github, label: 'GitHub' },
  ].filter(l => l.href);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${project.logoColor || '#00FF6F'}14`,
            color: project.logoColor || '#00FF6F',
            border: `1px solid ${project.logoColor || '#00FF6F'}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 18,
            flexShrink: 0, letterSpacing: '-0.03em', overflow: 'hidden',
          }}>
            {project.logoUrl ? (
              <img src={project.logoUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (project.logoText || project.name?.slice(0, 2) || '??').toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={{
                fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 22,
                letterSpacing: '-0.04em', color: 'var(--text-primary)',
              }}>
                {project.name}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 8px', color: 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.color='var(--accent-green)'; e.currentTarget.style.borderColor='var(--accent-green-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.borderColor='var(--border)'; }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <span className={`badge ${badgeClass}`}>{project.category}</span>
              <span className={`status-dot ${statusClass}`}>{project.status}</span>
            </div>
          </div>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Short desc */}
          <p style={{ 
            fontSize: 14, 
            color: 'var(--accent-green)', 
            fontWeight: 600, 
            letterSpacing: '-0.01em',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            wordBreak: 'break-word'
          }}>
            {project.shortDesc}
          </p>

          {/* Preview Image in Modal */}
          {project.imageUrl && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <img src={project.imageUrl} alt={`${project.name} preview`} style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, objectFit: 'contain' }} />
            </div>
          )}

          {/* Full desc */}
          <p style={{ 
            fontSize: 13, 
            color: 'var(--text-secondary)', 
            lineHeight: 1.75, 
            fontWeight: 400,
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {project.fullDesc}
          </p>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Metric */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
              Key Metric
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px',
              background: 'rgba(0,255,111,0.04)',
              border: '1px solid rgba(0,255,111,0.12)',
              borderRadius: 12,
            }}>
              <TrendingUp size={16} style={{ color: 'var(--accent-green)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                {project.metricLabel}
              </span>
              <span style={{
                fontFamily: 'Martian Mono, monospace', fontWeight: 700, fontSize: 28,
                color: 'var(--accent-green)', marginLeft: 'auto',
                filter: 'drop-shadow(0 0 12px rgba(0,255,111,0.5))',
              }}>
                {project.metricValue}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Tag size={11} style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tags</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {project.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
          </div>

          {/* Links */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Links</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {links.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '7px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-secondary)',
                    fontSize: 12, textDecoration: 'none', transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif', fontWeight: 500,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color='var(--accent-green)'; e.currentTarget.style.borderColor='var(--accent-green-border)'; e.currentTarget.style.background='rgba(0,255,111,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                >
                  <Icon size={12} /> {label}
                </a>
              ))}
            </div>
          </div>

          {/* Last updated */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
            <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Martian Mono, monospace' }}>
              Last updated: {project.lastUpdated}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

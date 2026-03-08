import { Globe, Twitter, MessageCircle, Github, TrendingUp, Wallet } from 'lucide-react';
import { CATEGORY_BADGE_MAP } from '../data/projects.js';

function Logo({ project }) {
  return (
    <div
      className="logo-icon"
      style={{
        background: `${project.logoColor || '#00FF6F'}14`,
        color: project.logoColor || '#00FF6F',
        border: `1px solid ${project.logoColor || '#00FF6F'}30`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {project.logoUrl ? (
        <img src={project.logoUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        (project.logoText || project.name?.slice(0, 2) || '??').toUpperCase()
      )}
    </div>
  );
}

function SocialLinks({ project, stopProp }) {
  const links = [
    { href: project.website, Icon: Globe, label: 'Website' },
    { href: project.twitter, Icon: Twitter, label: 'Twitter' },
    { href: project.discord, Icon: MessageCircle, label: 'Discord' },
    { href: project.github, Icon: Github, label: 'GitHub' },
  ].filter(l => l.href);

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {links.map(({ href, Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          title={label}
          onClick={stopProp}
        >
          <Icon size={12} />
        </a>
      ))}
    </div>
  );
}

export default function ProjectCard({ project, onClick, animDelay, connectedWallet, isMyProjectsView, actionButtons }) {
  const badgeClass = CATEGORY_BADGE_MAP[project.category] || 'badge-defi';
  const statusClass =
    project.status === 'Live' ? 'status-live' :
    project.status === 'Building' ? 'status-building' : 'status-soon';

  const stopProp = e => {
    e.stopPropagation();
  };

  return (
    <div
      className="card fade-in"
      style={{ animationDelay: `${animDelay}s` }}
      onClick={() => onClick(project)}
    >
      {/* hover overlay */}
      <div className="card-overlay">
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.05em',
          color: 'var(--accent-green)',
          textTransform: 'uppercase',
        }}>
          View Details →
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Logo project={project} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {project.name}
            </h3>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              {project.isOwner && (
                <span title={`You are the owner of ${project.name}`} style={{ color: 'var(--accent-green)', display: 'flex' }}>
                  <Wallet size={14} />
                </span>
              )}
              <span className={`status-dot ${statusClass}`}>{project.status}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
            <span className={`badge ${badgeClass}`}>
              {project.category}
            </span>
            {isMyProjectsView && project.approvalStatus && (
              <span style={{ 
                fontSize: 10, 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 12,
                background: project.approvalStatus === 'approved' ? 'rgba(0,255,111,0.1)' : project.approvalStatus === 'declined' ? 'rgba(255,59,92,0.1)' : 'rgba(255,255,255,0.1)',
                color: project.approvalStatus === 'approved' ? 'var(--accent-green)' : project.approvalStatus === 'declined' ? '#FF3B5C' : 'var(--text-secondary)',
                border: `1px solid ${project.approvalStatus === 'approved' ? 'var(--accent-green-border)' : project.approvalStatus === 'declined' ? 'rgba(255,59,92,0.3)' : 'var(--border)'}`,
                textTransform: 'uppercase'
              }}>
                {project.approvalStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ 
        fontSize: 13, 
        color: 'var(--text-secondary)', 
        lineHeight: 1.65, 
        flexGrow: 1, 
        fontWeight: 400,
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
        wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {project.shortDesc}
      </p>

      {/* Preview Image */}
      {project.imageUrl && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '8px 0 12px 0' }}>
          <img src={project.imageUrl} alt={`${project.name} preview`} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
        </div>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {project.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      {/* Metric */}
      <div className="metric-chip">
        <TrendingUp size={13} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
          {project.metricLabel}
        </span>
        <span style={{
          fontFamily: 'Martian Mono, monospace',
          fontWeight: 700,
          fontSize: 14,
          color: 'var(--accent-green)',
          marginLeft: 'auto',
          filter: 'drop-shadow(0 0 8px rgba(0,255,111,0.5))',
        }}>
          {project.metricValue}
        </span>
      </div>

      {/* Social + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={stopProp}>
        <SocialLinks project={project} stopProp={stopProp} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Martian Mono, monospace' }}>
          {project.lastUpdated ? new Date(project.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
        </span>
      </div>
      
      {/* Admin Action Buttons */}
      {actionButtons && (
        <div style={{ marginTop: 'auto', paddingTop: 16, position: 'relative', zIndex: 10 }} onClick={stopProp}>
          {actionButtons}
        </div>
      )}
    </div>
  );
}

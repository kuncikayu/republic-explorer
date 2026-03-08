import { useState, useMemo } from 'react';
import { CheckCircle, Edit3, Search, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../data/projects.js';
import LogoUploader, { uploadLogo } from './LogoUploader.jsx';
import { sendDiscordNotification } from '../utils/discord.js';

const catOptions = CATEGORIES.filter(c => c !== 'All');

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Project name is required.';
  if (!form.shortDesc.trim()) {
    errs.shortDesc = 'Short description is required.';
  } else if (form.shortDesc.length > 300) {
    errs.shortDesc = 'Short description must be 300 characters or less.';
  }

  if (!form.fullDesc.trim()) {
    errs.fullDesc = 'Full description is required.';
  } else if (form.fullDesc.length < 400) {
    errs.fullDesc = `Full description must be at least 400 characters. (Currently: ${form.fullDesc.length})`;
  } else if (form.fullDesc.length > 1500) {
    errs.fullDesc = `Full description must be 1500 characters or less. (Currently: ${form.fullDesc.length})`;
  }
  if (!form.website.trim()) errs.website = 'Website URL is required.';
  return errs;
}

const Field = ({ label, field, placeholder, required, form, set, errors, maxLength }) => (
  <div className="form-group">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <label className="form-label">{label}{required && <span style={{ color: '#FF3B5C' }}> *</span>}</label>
      {maxLength && (
        <span style={{ fontSize: 11, color: (form?.[field]?.length || 0) > maxLength ? '#FF3B5C' : 'var(--text-muted)' }}>
          {form?.[field]?.length || 0} / {maxLength}
        </span>
      )}
    </div>
    <input
      className={`form-input${errors[field] ? ' error' : ''}`}
      placeholder={placeholder}
      value={form?.[field] ?? ''}
      onChange={e => set(field, e.target.value)}
      maxLength={maxLength}
    />
    {errors[field] && <span className="form-error">{errors[field]}</span>}
  </div>
);

export default function UpdateProject({ projects, onUpdate, connectedWallet, onConnectClick, showToast }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter existing projects by wallet address
  const userProjects = useMemo(() => {
    if (!connectedWallet) return [];
    return projects.filter(p => p.isOwner);
  }, [projects, connectedWallet]);

  const filtered = useMemo(() =>
    userProjects.filter(p => p.name.toLowerCase().includes(query.toLowerCase())),
    [userProjects, query]
  );

  if (!connectedWallet) {
    return (
      <div className="empty-state" style={{ maxWidth: 600, margin: '80px auto', padding: 40, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Connect Wallet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Connect your wallet to submit or manage your project.<br/>Your wallet address serves as your project identity.
        </p>
        <button className="btn-primary" onClick={onConnectClick}>Connect Wallet</button>
      </div>
    );
  }

  const selectProject = (p) => {
    setSelected(p);
    setForm({ ...p, tags: p.tags.join(', ') });
    setLogoFile(null);
    setCoverFile(null);
    setErrors({});
    setSuccess(false);
  };

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setIsSubmitting(true);
    let updatedLogoUrl = form.logoUrl;
    let updatedImageUrl = form.imageUrl;
    
    try {
      if (logoFile) {
        updatedLogoUrl = await uploadLogo(logoFile, form.name + '_logo', connectedWallet.address);
      }
      if (coverFile) {
        updatedImageUrl = await uploadLogo(coverFile, form.name + '_cover', connectedWallet.address);
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to upload images', 'error');
      setIsSubmitting(false);
      return;
    }
    
    const finalProject = { 
      ...form, 
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), 
      lastUpdated: new Date().toISOString().slice(0, 10),
      logoUrl: updatedLogoUrl,
      imageUrl: updatedImageUrl
    };
    
    onUpdate(finalProject);
    sendDiscordNotification(finalProject, true).catch(err => console.error(err));
    
    if (showToast) {
      showToast('Project updated! Changes are live in the Explorer.', 'success');
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(0,255,111,0.08)', border: '1px solid rgba(0,255,111,0.15)', marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Edit Project</span>
        </div>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #FFFFFF 30%, #888888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Update a Project
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Select a project below to edit its details.</p>
      </div>

      {!form ? (
        <>
          {/* Search bar */}
          {userProjects.length > 3 && (
            <div style={{ marginBottom: 16 }}>
              <div className="search-container" style={{ maxWidth: '100%' }}>
                <Search size={15} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Search project by name..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Project list */}
          {userProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <Search size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-secondary)' }}>No projects yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Submit a project first to manage it here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectProject(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.border = '1px solid var(--accent-green-border)'; e.currentTarget.style.background = 'rgba(0,255,111,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.border = '1px solid var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${p.logoColor || '#00FF6F'}14`, color: p.logoColor || '#00FF6F', border: `1px solid ${p.logoColor || '#00FF6F'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 12, flexShrink: 0, overflow: 'hidden' }}>
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (p.logoText || p.name?.slice(0, 2) || '??').toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{p.name}</p>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase', flexShrink: 0,
                        background: p.approvalStatus === 'approved' ? 'rgba(0,255,111,0.12)' : p.approvalStatus === 'declined' ? 'rgba(255,59,92,0.12)' : 'rgba(255,200,0,0.12)',
                        color: p.approvalStatus === 'approved' ? 'var(--accent-green)' : p.approvalStatus === 'declined' ? '#FF3B5C' : '#FFCC00',
                        border: `1px solid ${p.approvalStatus === 'approved' ? 'rgba(0,255,111,0.25)' : p.approvalStatus === 'declined' ? 'rgba(255,59,92,0.25)' : 'rgba(255,200,0,0.25)'}`,
                      }}>
                        {p.approvalStatus === 'approved' ? '✓ Approved' : p.approvalStatus === 'declined' ? '✗ Declined' : '⏳ Pending review'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.category} · {p.status}</p>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
                </button>
              ))}
              {filtered.length === 0 && query && (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>No projects match "{query}"</p>
              )}
            </div>
          )}
        </>
      ) : null}

      {/* Edit form */}
      {form ? (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <button
            onClick={() => { setForm(null); setSelected(null); setErrors({}); setSuccess(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to projects
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 16px', background: 'rgba(0,255,111,0.05)', border: '1px solid rgba(0,255,111,0.12)', borderRadius: 10 }}>
            <Edit3 size={13} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--accent-green)', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              Editing: {selected?.name}
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}><Field form={form} set={set} errors={errors} label="Project Name" field="name" placeholder="Project name" required /></div>
            <div style={{ gridColumn: '1 / -1' }}><Field form={form} set={set} errors={errors} label="Short Description" field="shortDesc" placeholder="One-line description" maxLength={300} required /></div>
            <div style={{ gridColumn: '1 / -1' }} className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label className="form-label">Full Description <span style={{ color: '#FF3B5C' }}>*</span></label>
                <span style={{ fontSize: 11, color: ((form.fullDesc?.length || 0) < 400 || (form.fullDesc?.length || 0) > 1500) ? '#FF3B5C' : 'var(--accent-green)' }}>
                  {form.fullDesc?.length || 0} / 1500 (Min 400)
                </span>
              </div>
              <textarea className={`form-textarea${errors.fullDesc ? ' error' : ''}`} rows={4} value={form.fullDesc ?? ''} onChange={e => set('fullDesc', e.target.value)} maxLength={1500} />
              {errors.fullDesc && <span className="form-error">{errors.fullDesc}</span>}
            </div>
            <Field form={form} set={set} errors={errors} label="Website URL" field="website" placeholder="https://" required />
            <Field form={form} set={set} errors={errors} label="Twitter / X URL" field="twitter" placeholder="https://twitter.com/..." />
            <Field form={form} set={set} errors={errors} label="Discord URL" field="discord" placeholder="https://discord.gg/..." />
            <Field form={form} set={set} errors={errors} label="GitHub URL" field="github" placeholder="https://github.com/..." />
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Live</option><option>Building</option><option>Coming Soon</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Update Project Logo</label>
                <div style={{ flex: 1, display: 'flex' }}><LogoUploader key={`logo-${selected?.id}`} onFileSelect={setLogoFile} onError={err => showToast && showToast(err, 'error')} currentLogoUrl={form.logoUrl} type="logo" /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Update Preview Image <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(16:9 Recommended)</span></label>
                <div style={{ flex: 1, display: 'flex' }}><LogoUploader key={`cover-${selected?.id}`} onFileSelect={setCoverFile} onError={err => showToast && showToast(err, 'error')} currentLogoUrl={form.imageUrl} type="cover" /></div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}><Field form={form} set={set} errors={errors} label="Tags (comma separated)" field="tags" placeholder="DEX, AMM, Yield" /></div>
            <Field form={form} set={set} errors={errors} label="Key Metric Label" field="metricLabel" placeholder="e.g. TVL" />
            <Field form={form} set={set} errors={errors} label="Key Metric Value" field="metricValue" placeholder="e.g. $18.2M" />
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Edit3 size={13} />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}



    </div>
  );
}

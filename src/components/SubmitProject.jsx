import { useState } from 'react';
import { CheckCircle, Send, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../data/projects.js';
import LogoUploader, { uploadLogo } from './LogoUploader.jsx';
import { sendDiscordNotification } from '../utils/discord.js';

const EMPTY_FORM = {
  name: '', website: '', twitter: '', discord: '', github: '',
  logoColor: '#00FF6F', logoText: '',
  category: 'DeFi', tags: '', shortDesc: '', fullDesc: '',
  status: 'Live', metricLabel: '', metricValue: '',
};

function isValidUrl(str) {
  try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

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
  if (!form.website.trim()) {
    errs.website = 'Website URL is required.';
  } else if (!isValidUrl(form.website.trim())) {
    errs.website = 'Please enter a valid URL (must start with https:// or http://)';
  }
  if (form.twitter.trim() && !isValidUrl(form.twitter.trim())) errs.twitter = 'Invalid URL format.';
  if (form.discord.trim() && !isValidUrl(form.discord.trim())) errs.discord = 'Invalid URL format.';
  if (form.github.trim() && !isValidUrl(form.github.trim())) errs.github = 'Invalid URL format.';
  return errs;
}

const catOptions = CATEGORIES.filter(c => c !== 'All');

const inputStyle = (hasError) => ({
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${hasError ? 'rgba(255,59,92,0.4)' : 'var(--border)'}`,
  borderRadius: 10,
  padding: '10px 14px',
  color: 'var(--text-primary)',
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  transition: 'all 0.2s',
});

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
      style={inputStyle(!!errors[field])}
      placeholder={placeholder}
      value={form?.[field] ?? ''}
      onChange={e => set(field, e.target.value)}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-green-border)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,255,111,0.07)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = errors[field] ? 'rgba(255,59,92,0.4)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      maxLength={maxLength}
    />
    {errors[field] && <span className="form-error" style={{ display: 'block', marginTop: 6, color: '#FF3B5C', fontSize: 12 }}>{errors[field]}</span>}
  </div>
);

export default function SubmitProject({ onSubmit, connectedWallet, onConnectClick, showToast }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setIsSubmitting(true);
    let logoUrl = '';
    let imageUrl = '';
    
    try {
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, form.name + '_logo', connectedWallet.address);
      }
      if (coverFile) {
        imageUrl = await uploadLogo(coverFile, form.name + '_cover', connectedWallet.address);
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to upload images', 'error');
      setIsSubmitting(false);
      return;
    }

    const finalProject = {
      ...form,
      id: Date.now().toString(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      lastUpdated: new Date().toISOString().slice(0, 10),
      logoUrl,
      imageUrl,
      walletAddress: connectedWallet.address,
      walletType: connectedWallet.walletType,
      approvalStatus: 'pending'
    };
    
    try {
      await onSubmit(finalProject);
      sendDiscordNotification(finalProject, false).catch(err => console.error(err));
      if (showToast) {
        showToast('Project submitted! Your project is now live in the Explorer.', 'success');
      }
      setForm(EMPTY_FORM);
      setLogoFile(null);
      setCoverFile(null);
    } catch (err) {
      console.error('Submit error details:', err);

      const errorMsg = err.message || 'Failed to submit project. Please try again.';
      if (showToast) {
        showToast(errorMsg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(0,255,111,0.08)', border: '1px solid rgba(0,255,111,0.15)', marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>New Project</span>
        </div>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #FFFFFF 30%, #888888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Submit a Project
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, fontWeight: 400 }}>
          Add your project to the Republic Economy directory.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <div style={{ gridColumn: '1 / -1' }}><Field form={form} set={set} errors={errors} label="Project Name" field="name" placeholder="e.g. RepublicSwap" required /></div>
        <div style={{ gridColumn: '1 / -1' }}><Field form={form} set={set} errors={errors} label="Short Description" field="shortDesc" placeholder="One-line pitch" maxLength={300} required /></div>
        <div style={{ gridColumn: '1 / -1' }} className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label className="form-label">Full Description <span style={{ color: '#FF3B5C' }}>*</span></label>
            <span style={{ fontSize: 11, color: ((form.fullDesc?.length || 0) < 400 || (form.fullDesc?.length || 0) > 1500) ? '#FF3B5C' : 'var(--accent-green)' }}>
              {form.fullDesc?.length || 0} / 1500 (Min 400)
            </span>
          </div>
          <textarea
            className={`form-textarea${errors.fullDesc ? ' error' : ''}`}
            placeholder="Detailed description..."
            value={form.fullDesc}
            onChange={e => set('fullDesc', e.target.value)}
            rows={4}
            maxLength={1500}
          />
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
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Project Logo</label>
            <div style={{ flex: 1, display: 'flex' }}><LogoUploader onFileSelect={setLogoFile} onError={err => showToast && showToast(err, 'error')} type="logo" /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Preview Image <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(16:9 Recommended)</span></label>
            <div style={{ flex: 1, display: 'flex' }}><LogoUploader onFileSelect={setCoverFile} onError={err => showToast && showToast(err, 'error')} type="cover" /></div>
          </div>
        </div>


        <div style={{ gridColumn: '1 / -1' }}><Field form={form} set={set} errors={errors} label="Tags (comma separated)" field="tags" placeholder="DEX, AMM, Yield" /></div>
        <Field form={form} set={set} errors={errors} label="Key Metric Label" field="metricLabel" placeholder="e.g. TVL" />
        <Field form={form} set={set} errors={errors} label="Key Metric Value" field="metricValue" placeholder="e.g. $18.2M" />

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {isSubmitting ? 'Submitting...' : 'Submit Project'}
          </button>
        </div>
      </form>
    </div>
  );
}

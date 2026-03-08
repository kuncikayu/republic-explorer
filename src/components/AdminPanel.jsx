import { useState } from 'react';
import { CheckCircle, XCircle, EyeOff } from 'lucide-react';
import ProjectCard from './ProjectCard.jsx';
import ProjectModal from './ProjectModal.jsx';

export default function AdminPanel({ projects, onApprove, onDecline, onHide }) {
  const [tab, setTab] = useState('pending');
  const [selectedProject, setSelectedProject] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve'|'decline', project }
  
  const pending = projects.filter(p => p.approvalStatus === 'pending');
  const approved = projects.filter(p => p.approvalStatus === 'approved');
  
  const getList = () => {
    if (tab === 'pending') return pending;
    return approved;
  };
  
  const activeList = getList();

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'approve') onApprove(confirmAction.project.id);
    else if (confirmAction.type === 'hide') onHide(confirmAction.project.id);
    else onDecline(confirmAction.project.id);
    setConfirmAction(null);
  };
  
  return (
    <div style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}>Admin Dashboard</h2>
      
      <div style={{ display: 'flex', gap: 12, marginTop: 24, marginBottom: 32 }}>
        <button 
          onClick={() => setTab('pending')} 
          style={{ background: tab === 'pending' ? 'var(--accent-green)' : 'rgba(0,255,111,0.05)', color: tab === 'pending' ? '#000' : 'var(--accent-green)', border: '1px solid var(--accent-green-border)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
          Pending ({pending.length})
        </button>
        <button 
          onClick={() => setTab('approved')} 
          style={{ background: tab === 'approved' ? 'var(--text-secondary)' : 'rgba(255,255,255,0.05)', color: tab === 'approved' ? '#000' : 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
          Approved ({approved.length})
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
        {activeList.map(p => (
          <ProjectCard 
            key={p.id}
            project={p} 
            onClick={setSelectedProject} 
            animDelay={0} 
            actionButtons={
              tab === 'pending' ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmAction({ type: 'approve', project: p })}
                    style={{ flex: 1, background: 'rgba(0,255,111,0.1)', border: '1px solid var(--accent-green-border)', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', color: 'var(--accent-green)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,111,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,255,111,0.1)'}
                  >
                    <CheckCircle size={15} /> Approve
                  </button>
                  <button onClick={() => setConfirmAction({ type: 'decline', project: p })}
                    style={{ flex: 1, background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.3)', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', color: '#FF3B5C', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,92,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,92,0.08)'}
                  >
                    <XCircle size={15} /> Decline
                  </button>
                </div>
              ) : tab === 'approved' ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmAction({ type: 'hide', project: p })}
                    style={{ flex: 1, background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', color: '#FFA500', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,165,0,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,165,0,0.1)'}
                  >
                    <EyeOff size={15} /> Hide Project
                  </button>
                </div>
              ) : null
            }
          />
        ))}
      </div>

      {activeList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          No {tab} projects found.
        </div>
      )}

      {/* Project detail modal */}
      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      {/* Inline confirm dialog */}
      {confirmAction && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={() => setConfirmAction(null)}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
            padding: 32, maxWidth: 380, width: '90%', textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              {confirmAction.type === 'approve' ? '✅' : confirmAction.type === 'hide' ? '👁️' : '❌'}
            </div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
              {confirmAction.type === 'approve' ? 'Approve Project?' : confirmAction.type === 'hide' ? 'Hide Project?' : 'Decline Project?'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{confirmAction.project.name}</strong> will be {confirmAction.type === 'approve' ? 'visible to everyone on the Explorer.' : confirmAction.type === 'hide' ? 'hidden from the Explorer and set back to Under Review.' : 'permanently deleted from the database and the submitter will be notified.'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirm} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                background: confirmAction.type === 'approve' ? 'var(--accent-green)' : confirmAction.type === 'hide' ? '#FFA500' : '#FF3B5C',
                color: confirmAction.type === 'approve' ? '#000' : '#fff'
              }}>
                {confirmAction.type === 'approve' ? 'Yes, Approve' : confirmAction.type === 'hide' ? 'Yes, Hide' : 'Yes, Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

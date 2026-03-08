import { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const getIcon = () => {
    if (type === 'success') return <CheckCircle size={18} style={{ color: 'var(--accent-green)' }} />;
    if (type === 'error') return <XCircle size={18} style={{ color: '#FF3B5C' }} />;
    return <Info size={18} style={{ color: '#00B4FF' }} />;
  };

  const getStyle = () => {
    if (type === 'success') return { borderLeft: '3px solid var(--accent-green)' };
    if (type === 'error') return { borderLeft: '3px solid #FF3B5C' };
    return { borderLeft: '3px solid #00B4FF' };
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      ...getStyle(),
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 9999,
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.3s ease'
    }}>
      {getIcon()}
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
        {message}
      </span>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Menu, X, ExternalLink, Copy, LogOut, ChevronDown } from 'lucide-react';

export default function Nav({ view, setView, connectedWallet, isAdminWallet, onConnectClick, onDisconnect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletDropdown, setWalletDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setWalletDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const desktopNavItems = [
    { id: 'explorer', label: 'Explorers' },
    { id: 'gpu-miner', label: 'GPU Miners' },
    { id: 'validator', label: 'Validators' },
  ];

  const mobileNavItems = [
    { id: 'explorer', label: 'Explorers' },
    { id: 'gpu-miner', label: 'GPU Miners' },
    { id: 'validator', label: 'Validators' },
  ];

  if (connectedWallet) {
    mobileNavItems.push({
      id: 'project-group',
      label: 'Project',
      isGroup: true,
      children: [
        { id: 'submit', label: 'Submit Project' },
        { id: 'update', label: 'Update Project' }
      ]
    });
  }

  if (isAdminWallet) {
    desktopNavItems.push({ id: 'admin', label: 'Admin 👑' });
    mobileNavItems.push({ id: 'admin', label: 'Admin 👑' });
  }

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = () => {
    if (connectedWallet) {
      navigator.clipboard.writeText(connectedWallet.address);
      setWalletDropdown(false);
    }
  };

  return (
    <nav className="nav-glass">
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '10px 10px 10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
      }}>

        {/* Left: Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 0%', minWidth: 0 }}>
          {/* Republic diamond icon */}
          <img src="/logo.png" alt="Republic Logo" width="28" height="28" style={{ objectFit: 'contain' }} />
          <span className="wordmark" style={{ color: 'var(--text-primary)' }}>RepublicAI</span>
        </div>

        {/* Center: Nav links (desktop) */}
        <div className="hide-on-mobile" style={{ gap: 2 }}>
          {desktopNavItems.map(item => (
            <button
              key={item.id}
              className={`nav-link${view === item.id ? ' active' : ''}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flex: '1 1 0%', minWidth: 0 }}>
          
          {connectedWallet ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                className="btn-secondary"
                style={{ padding: '6px 14px', fontFamily: 'Martian Mono, monospace', fontSize: 11, textTransform: 'none', gap: 6 }}
                onClick={() => setWalletDropdown(!walletDropdown)}
              >
                <span style={{ color: 'var(--accent-green)' }}>🟢</span> {formatAddress(connectedWallet.address)} <ChevronDown size={14} />
              </button>
              {walletDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 8,
                  minWidth: 200,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Martian Mono, monospace', wordBreak: 'break-all' }}>
                    {formatAddress(connectedWallet.address)}
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', borderRadius: 6, textAlign: 'left', width: '100%' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    <Copy size={14} /> Copy Address
                  </button>
                  <button onClick={() => { onDisconnect(); setWalletDropdown(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#FF3B5C', fontSize: 13, cursor: 'pointer', borderRadius: 6, textAlign: 'left', width: '100%' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,92,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-primary hide-on-mobile" style={{ padding: '8px 16px', fontSize: 12 }} onClick={onConnectClick}>
              Connect Wallet
            </button>
          )}

          <a
            href="https://republicai.io"
            target="_blank"
            rel="noopener noreferrer"
            className="ext-link-btn hide-on-mobile"
          >
            republicai.io <ExternalLink size={11} />
          </a>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu md:hidden" style={{ padding: '12px 20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {mobileNavItems.map(item => (
            <div
              key={item.id}
              onClick={() => { if (!item.isGroup) { setView(item.id); setMenuOpen(false); } }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12,
                padding: '20px 16px',
                minHeight: 120,
                cursor: item.isGroup ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: view === item.id ? '1px solid var(--accent-green-border)' : '1px solid rgba(255,255,255,0.04)',
                boxShadow: view === item.id ? '0 0 20px rgba(0, 255, 111, 0.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                if (!item.isGroup) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = view === item.id ? 'var(--accent-green-border)' : 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = view === item.id ? 'var(--accent-green-border)' : 'rgba(255,255,255,0.04)';
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: (view === item.id && !item.isGroup) ? 'var(--accent-green)' : '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
                {item.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {item.isGroup && (
                  item.children.map(child => (
                    <span 
                      key={child.id}
                      onClick={(e) => { e.stopPropagation(); setView(child.id); setMenuOpen(false); }}
                      style={{ fontSize: 13, color: view === child.id ? 'var(--accent-green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s', cursor: 'pointer', marginBottom: 4 }} 
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-green)'} 
                      onMouseLeave={e => e.currentTarget.style.color = view === child.id ? 'var(--accent-green)' : 'var(--text-muted)'}
                    >
                      <ExternalLink size={12} /> {child.label}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}

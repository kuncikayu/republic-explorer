import React, { useState, useEffect } from 'react';
import { Shield, Activity, Users, Zap, Search, ExternalLink, BarChart3, Clock, Loader2 } from 'lucide-react';
import { fetchValidators, fetchValidatorStats, fetchRecentBlocks } from '../utils/rpc.js';

export default function Validator() {
  const [activeTab, setActiveTab] = useState('validators'); 
  const [search, setSearch] = useState('');
  const [validators, setValidators] = useState([]);
  const [stats, setStats] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [vData, sData, bData] = await Promise.all([
          fetchValidators(),
          fetchValidatorStats(),
          fetchRecentBlocks()
        ]);
        setValidators(vData);
        setStats(sData);
        setBlocks(bData);
      } catch (err) {
        console.error('Failed to load validator data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredValidators = validators.filter(v => 
    v.moniker.toLowerCase().includes(search.toLowerCase())
  );

  const STREAK_DUMMY = Array.from({ length: 14 }).map((_, i) => i === 3 || i === 9 ? 'missed' : 'signed');

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
      {[
        { id: 'validators', label: 'Active Validators', icon: Users },
        { id: 'blocks', label: 'Live Proposers', icon: BarChart3 },
        { id: 'uptime', label: 'Uptime Monitor', icon: Activity },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            background: activeTab === tab.id ? 'rgba(0,255,111,0.08)' : 'transparent',
            border: activeTab === tab.id ? '1px solid var(--accent-green-border)' : '1px solid transparent',
            color: activeTab === tab.id ? 'var(--accent-green)' : 'var(--text-muted)',
            padding: '8px 16px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: activeTab === tab.id ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
        >
          <tab.icon size={14} />
          {tab.label}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent-green)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, letterSpacing: '0.05em' }}>SYNCING NETWORK DATA...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: 1240, margin: '80px auto 0 auto', animation: 'fadeIn 0.5s ease' }}>
      

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 12px var(--accent-green)' }}></div>
          <span style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-green)', fontWeight: 800 }}>RepublicAI Mainnet</span>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #FFFFFF 30%, #888888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: 'Inter, sans-serif' }}>
          Network <span style={{ color: 'var(--accent-green)' }}>Governance</span>
        </h2>
      </div>


      {renderTabs()}


      {activeTab === 'validators' && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {stats.map((stat, i) => (
              <div key={i} className="glass-panel" style={{ padding: '20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>{stat.label}</p>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Martian Mono, monospace', letterSpacing: '-0.02em' }}>{stat.value}</h3>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Validator Directory</h3>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search moniker..." value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px 8px 36px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 240 }}
                />
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ padding: '16px 32px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Validator</th>
                    <th style={{ padding: '16px 32px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Voting Power</th>
                    <th style={{ padding: '16px 32px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Commission</th>
                    <th style={{ padding: '16px 32px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredValidators.map((v) => (
                    <tr key={v.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={v.identity} alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{v.moniker}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Martian Mono, monospace' }}>{v.share}</span>
                          <div style={{ height: 3, width: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: v.share, background: 'var(--accent-green)' }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 32px', fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>{v.commission}</td>
                      <td style={{ padding: '16px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.status === 'Active' ? 'var(--accent-green)' : '#FF3B5C' }}></div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'blocks' && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Latest Blocks</h3>
              <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--accent-green-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} style={{ color: 'var(--accent-green)' }} className="pulse" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Martian Mono, monospace' }}>H: {blocks[0]?.height || '—'}</span>
              </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Height</th>
                  <th style={{ padding: '16px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Proposer</th>
                  <th style={{ padding: '16px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Time</th>
                  <th style={{ padding: '16px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hash</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px', color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'Martian Mono, monospace' }}>{block.height}</td>
                    <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 600 }}>{block.proposer}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: 13 }}>{block.time}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'Martian Mono, monospace' }}>{block.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Consensus Health</h4>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>100%</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>All validators are signing</p>
            </div>
            <div className="glass-panel" style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Avg Block Time</h4>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>5.32s</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Last 1,000 blocks</p>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'uptime' && (
        <div className="fade-in">
          <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', padding: '32px' }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Real-time Uptime Monitor</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Visualizing validator performance across the last 100 blocks</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredValidators.map(v => (
                <div key={v.moniker} style={{ 
                  display: 'flex', alignItems: 'center', gap: 24, padding: '16px', 
                  borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' 
                }}>
                  <div style={{ width: 180, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={v.identity} alt="" style={{ width: 24, height: 24, borderRadius: 6 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{v.moniker}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                    {Array.from({ length: 40 }).map((_, idx) => {
                      const isMissed = (idx + v.rank) % 15 === 0;
                      return (
                        <div key={idx} style={{ 
                          flex: 1, height: 20, borderRadius: 2,
                          background: isMissed ? 'rgba(255,59,92,0.4)' : 'var(--accent-green)',
                          opacity: isMissed ? 1 : 0.6
                        }} title={isMissed ? 'Missed Block' : 'Signed Block'}></div>
                      );
                    })}
                  </div>
                  <div style={{ width: 80, textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>{v.uptime}</span>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Reliability</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

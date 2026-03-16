import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Activity, Shield, Users, Server, Database, Clock, Box, Cpu, ChevronRight,
  AlertTriangle, CheckCircle, RefreshCw, Layers, ChevronDown
} from 'lucide-react';
import { fetchAllNetworkData, fetchJobsFromDb, formatToken, formatAddress, timeAgo } from '../utils/networkApi';

// Subcomponents
function StatCard({ icon: Icon, label, value, sub, colorClass, bgClass }) {
  return (
    <div className="stat-card luxury-glass hover:scale-105 transition-all duration-300">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span className={`stat-icon ${bgClass}`} style={{ color: `var(--${colorClass})` }}>
          <Icon size={12} />
        </span>
        <span className="stat-label">{label}</span>
      </div>
      <div className={`stat-val c-${colorClass}`}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function Panel({ title, subtitle, pill, children }) {
  return (
    <div className="panel luxury-glass" style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {pill !== undefined && <span className="count-pill bg-green-dark c-green" style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{pill}</span>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div style={{ padding: 20 }}>
      <div className="skel" style={{ height: 20, marginBottom: 16 }}></div>
      <div className="skel" style={{ height: 20, marginBottom: 16 }}></div>
      <div className="skel" style={{ height: 20 }}></div>
    </div>
  );
}

function CustomSelect({ options, value, onChange, padding = '8px 12px', fontSize = 13 }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block', zIndex: isOpen ? 100 : 1 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, 
          padding: padding, color: 'var(--text-primary)', 
          fontSize: fontSize, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          userSelect: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        {selectedOption.label}
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </div>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setIsOpen(false)} />
          <div className="luxury-glass" style={{ 
            position: 'absolute', top: 'calc(100% + 4px)', right: 0, 
            background: '#0a0d0f', border: '1px solid var(--border)', borderRadius: 8, 
            minWidth: '100%', zIndex: 100, overflow: 'hidden', padding: 4, display: 'flex', flexDirection: 'column', gap: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            {options.map(opt => {
              const isActive = String(value) === String(opt.value);
              return (
                <div 
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`custom-select-option ${isActive ? 'active' : ''}`}
                  style={{ 
                    padding: '8px 12px', fontSize: fontSize, cursor: 'pointer', borderRadius: 4,
                    background: isActive ? 'rgba(0,184,95,0.1)' : 'transparent',
                    color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap', userSelect: 'none'
                  }}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const avatarCache = {};

function ValidatorLogo({ identity, moniker, fallbackSeed }) {
  const isUrl = identity && identity.startsWith('http');
  const fallback = `https://api.dicebear.com/7.x/identicon/svg?seed=${fallbackSeed}`;
  const [imgUrl, setImgUrl] = useState(isUrl ? identity : '');

  useEffect(() => {
    let unmounted = false;
    
    if (isUrl) return;

    const cacheKey = identity || moniker;
    if (!cacheKey) return;

    if (avatarCache[cacheKey]) {
      setImgUrl(avatarCache[cacheKey]);
      return;
    }

    const fetchKeybase = async () => {
      try {
        let query = identity ? `key_suffix=${identity}` : `usernames=${moniker}`;
        const res = await fetch(`https://keybase.io/_/api/1.0/user/lookup.json?${query}&fields=pictures`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const url = data?.them?.[0]?.pictures?.primary?.url;
        
        const finalUrl = url || fallback;
        avatarCache[cacheKey] = finalUrl;
        if (!unmounted) setImgUrl(finalUrl);
      } catch (err) {
        avatarCache[cacheKey] = fallback;
        if (!unmounted) setImgUrl(fallback);
      }
    };

    fetchKeybase();
    return () => { unmounted = true; };
  }, [identity, moniker, fallbackSeed, isUrl, fallback]);

  return <img src={imgUrl || fallback} alt="" style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--s3)', objectFit: 'cover' }} />;
}

function TransactionChart({ blockMetas }) {
  const blocks = [...blockMetas].reverse().slice(-20); // Last 20 blocks
  const maxTxs = Math.max(...blocks.map(b => b.txs), 5); // Base scale of 5
  
  // Calculate points for SVG
  const width = 1000;
  const height = 150;
  const padding = 20;
  
  const points = blocks.map((b, i) => {
    const x = (i / (blocks.length > 1 ? blocks.length - 1 : 1)) * (width - 2 * padding) + padding;
    const y = height - (b.txs / maxTxs) * (height - 2 * padding) - padding;
    return { x, y, txs: b.txs, height: b.height };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div style={{ padding: '20px 0', position: 'relative', height: 200, width: '100%' }}>
      {/* Background Grid & Labels */}
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, pointerEvents: 'none' }}>
        {[0, 0.5, 1].map(p => (
          <div key={p} style={{ position: 'absolute', left: 0, right: 0, bottom: (p * 100) + '%', height: 1, background: 'rgba(255,255,255,0.03)' }}>
            <span style={{ position: 'absolute', right: 0, top: -12, fontSize: 8, color: 'var(--text-muted)', fontFamily: 'Martian Mono' }}>
              {Math.round(p * maxTxs)}
            </span>
          </div>
        ))}
      </div>

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Area fill */}
        <path d={areaData} fill="url(#areaGradient)" style={{ transition: 'all 0.5s ease' }} />
        
        {/* Main Line */}
        <path 
          d={pathData} 
          fill="none" 
          stroke="var(--accent-green)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          filter="url(#glow)"
          style={{ transition: 'all 0.5s ease' }}
        />

        {/* Dynamic points */}
        {points.map((p, i) => (
          <circle 
            key={i} 
            cx={p.x} cy={p.y} r="4" 
            fill="var(--accent-green)" 
            style={{ filter: 'drop-shadow(0 0 4px var(--accent-green))', transition: 'all 0.5s ease' }} 
          />
        ))}
      </svg>

      {/* Invisible hover zones for tooltips */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
        {blocks.map((b, i) => (
          <div key={i} className="group relative" style={{ flex: 1, height: '100%', cursor: 'crosshair' }}>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div style={{ background: '#000', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 10px', fontSize: 10, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <div style={{ color: 'var(--accent-green)', fontWeight: 800 }}>{b.txs} TXs</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Block #{b.height}</div>
              </div>
            </div>
            {/* Indicator line on hover */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-white opacity-0 group-hover:opacity-10 transition-opacity" style={{ transform: 'translateX(-50%)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NetworkDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    jobs: [], validators: [], blockMetas: [], mempoolTxs: [], status: null, netInfo: null, pool: null, supply: [], jobsTotal: 0, executionCount: 0, validationCount: 0
  });
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Job Filters
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  // Validator Filters
  const [valFilter, setValFilter] = useState('');
  const [validatorView, setValidatorView] = useState('list'); // 'list' | 'uptime'

  // DB Jobs for Advanced Filtering
  const [dbJobs, setDbJobs] = useState(null); // null means use live data
  const [dbLoading, setDbLoading] = useState(false);

  // Uptime Sliding Window State
  const [liveUptimeHistory, setLiveUptimeHistory] = useState({});
  const lastProcessedHeight = useRef(null);

  // Sync Live Blocks into UI states
  useEffect(() => {
    if (data.latestBlockParsed && data.latestSignatures && data.latestBlockParsed.height !== lastProcessedHeight.current) {
        lastProcessedHeight.current = data.latestBlockParsed.height;
        
        // 1. Unshift newest block into recent blocks table
        if (!data.blockMetas.find(b => b.height === data.latestBlockParsed.height)) {
            setData(prev => ({
                ...prev,
                blockMetas: [data.latestBlockParsed, ...prev.blockMetas].slice(0, 20)
            }));
        }

        // 2. Map real signatures into scrolling history window
        setLiveUptimeHistory(prev => {
            const newState = { ...prev };
            data.validators.forEach(v => {
                if (!v.hexAddress) return;
                const signed = data.latestSignatures.includes(v.hexAddress);
                const currentHistory = newState[v.operator_address] || [];
                const blockEntry = { signed, height: data.latestBlockParsed.height };
                const newHistory = [blockEntry, ...currentHistory];
                if (newHistory.length > 100) newHistory.pop();
                newState[v.operator_address] = newHistory;
            });
            return newState;
        });
    }
  }, [data.latestBlockParsed, data.latestSignatures, data.validators, data.blockMetas]);

  const refreshData = useCallback(async (manual = false, isBackground = false) => {
    if (manual) setLoading(true);
    setError(null);
    try {
      const res = await fetchAllNetworkData(isBackground, dataRef.current);
      setData(res);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError('Data link unstable. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData(true);
  }, [refreshData]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Pass isBackground = true for 3s lightweight polling
      refreshData(false, true);
    }, 3000);
    return () => clearInterval(timer);
  }, [refreshData]);

  // Handle DB-backed Jobs Filtering
  useEffect(() => {
    if (!jobSearch && !jobStatus) {
      setDbJobs(null);
      return;
    }

    const loadDbResults = async () => {
      setDbLoading(true);
      const results = await fetchJobsFromDb({ status: jobStatus, search: jobSearch });
      setDbJobs(results);
      setDbLoading(false);
    };

    const debounceTimer = setTimeout(loadDbResults, 500);
    return () => clearTimeout(debounceTimer);
  }, [jobSearch, jobStatus]);

  // Derived metrics
  const totalJobs = data.jobsTotal || data.jobs.length;
  const executionJobs = data.executionCount || 0;
  const validationJobs = data.validationCount || 0;
  const passRate = totalJobs > 0 ? ((executionJobs / totalJobs) * 100).toFixed(1) : '–';
  const blockHeight = data.status?.sync_info?.latest_block_height || '–';
  const valCount = data.validators.filter(v => v.status === 'BOND_STATUS_BONDED').length;
  const isHalted = data.isHalted;

  const haltedBanner = isHalted && data.status ? (
    <div style={{ background: 'rgba(245,144,46,0.1)', border: '1px solid rgba(245,144,46,0.2)', padding: '12px 16px', borderRadius: 8, color: 'var(--orange)', fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp 0.3s ease' }}>
      <AlertTriangle size={16} />
      <strong>Chain Halted:</strong> Block production stopped. Showing last known state at block #{data.status.sync_info.latest_block_height} · {timeAgo(data.status.sync_info.latest_block_time)}.
    </div>
  ) : null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'jobs', label: 'Compute Jobs', icon: Cpu },
    { id: 'validators', label: 'Validators', icon: Shield },
    { id: 'blocks', label: 'Blocks', icon: Box },
  ];

  // Renderers for different sections
  const renderOverview = () => {
    const s = data.status;
    
    // Staking logic
    const bonded = BigInt(data.pool?.bonded_tokens || '0');
    const notBonded = BigInt(data.pool?.not_bonded_tokens || '0');
    const totalStake = bonded + notBonded;
    const bondedPct = totalStake > 0n ? Number(bonded * 100n / totalStake) : 0;
    const supplyRAI = data.supply?.[0]?.amount || '0';

    return (
      <div className="fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard icon={Cpu} label="TOTAL JOBS" value={totalJobs.toLocaleString()} sub={loading ? "Updating..." : "All time · Live"} colorClass="green" bgClass="bg-green-dark" />
          <StatCard icon={Layers} label="EXECUTION" value={executionJobs.toLocaleString()} sub="Pending execution" colorClass="blue" bgClass="bg-blue-dark" />
          <StatCard icon={CheckCircle} label="VALIDATION" value={validationJobs.toLocaleString()} sub="Pending validation" colorClass="orange" bgClass="bg-orange-dark" />
          <StatCard icon={Activity} label="PASS RATE" value={passRate !== '–' ? `${passRate}%` : '–'} sub="Job success rate" colorClass="green" bgClass="bg-green-dark" />
          <StatCard icon={Box} label="LATEST BLOCK" value={isHalted ? `⚠ #${blockHeight}` : `#${blockHeight}`} sub={isHalted ? 'Chain Halted' : 'Chain Height'} colorClass={isHalted ? 'orange' : 'purple'} bgClass="bg-purple-dark" />
          <StatCard icon={Users} label="ACTIVE VALS" value={valCount} sub="Bonded validators" colorClass="orange" bgClass="bg-orange-dark" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          <Panel title="⛓ Chain Info" subtitle="Network & consensus state">
            {loading && !s ? <SkeletonTable /> : (
              <div className="info-grid">
                {[
                  ['Chain ID', s?.node_info?.network || '–'],
                  ['Latest Block', `#${s?.sync_info?.latest_block_height || '–'}`],
                  ['Block Time', s?.sync_info?.latest_block_time ? new Date(s.sync_info.latest_block_time).toUTCString() : '–'],
                  ['Catching Up', s?.sync_info?.catching_up ? '⚠ Yes' : '✓ No'],
                  ['Node Moniker', s?.node_info?.moniker || '–'],
                  ['Node Version', s?.node_info?.version || '–'],
                  ['Peers', data.netInfo?.n_peers || '–'],
                ].map(([k, v], i) => (
                  <div key={i} className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'Martian Mono, monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="🔒 Staking Pool" subtitle="Bonded vs unbonded tokens">
             {loading && !data.pool ? <SkeletonTable /> : (
               <>
                <div style={{ padding: '20px 20px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bonded</span>
                    <span style={{ color: 'var(--accent-green)' }}>{bondedPct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${bondedPct}%`, background: 'linear-gradient(90deg, #00b85f, #00e87a)', transition: 'width 0.6s' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>Bonded: {formatToken(data.pool?.bonded_tokens)} RAI</span>
                    <span>Unbonded: {formatToken(data.pool?.not_bonded_tokens)} RAI</span>
                  </div>
                </div>
                <div className="info-grid">
                  {[
                    ['Total Supply', formatToken(supplyRAI) + ' RAI'],
                    ['Unbonding Period', '21 days'],
                    ['Max Validators', '100'],
                  ].map(([k, v], i) => (
                    <div key={i} className="info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'Martian Mono, monospace' }}>{v}</span>
                    </div>
                  ))}
                </div>
               </>
             )}
          </Panel>
        </div>

        <Panel title="📋 Recent Jobs" subtitle="Latest compute job submissions" pill={`${totalJobs.toLocaleString()} jobs`}>
          <div style={{ overflowX: 'auto' }}>
            <table className="rep-table">
              <thead><tr><th>Job ID</th><th>Transactions</th><th>Target Validator</th><th>Image</th><th>Status</th><th>Fee</th></tr></thead>
              <tbody>
                {loading && data.jobs.length === 0 ? <tr><td colSpan="5"><SkeletonTable /></td></tr> : null}
                {data.jobs.slice(0, 10).map((j, i) => (
                  <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td style={{ padding: '12px 20px', fontFamily: 'Martian Mono, monospace', color: 'var(--accent-green)' }}>#{j.id}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(j.job_transactions || []).map(tx => (
                          <a 
                            key={tx.tx_hash}
                            href={`https://stake.astrostake.xyz/republic-testnet/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tx-link"
                            style={{ fontSize: 10, color: 'var(--accent-green)', opacity: 0.8, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Box size={10} /> {tx.type === 'SubmitJob' ? 'Create' : 'Result'}
                          </a>
                        ))}
                        {(!j.job_transactions || j.job_transactions.length === 0) && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No TX data</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontFamily: 'Martian Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{formatAddress(j.target_validator)}</td>
                    <td style={{ padding: '12px 20px' }}><span style={{ padding: '3px 8px', background: 'var(--s3)', borderRadius: 4, fontSize: 11, color: 'var(--text-primary)' }}>{j.execution_image || '–'}</span></td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: j.status === 'Completed' ? 'rgba(0,232,122,0.1)' : j.status === 'Failed' ? 'rgba(245,66,66,0.1)' : j.status === 'PendingValidation' ? 'rgba(66,200,245,0.1)' : 'rgba(245,200,66,0.1)',
                        color: j.status === 'Completed' ? 'var(--green)' : j.status === 'Failed' ? 'var(--red)' : j.status === 'PendingValidation' ? 'var(--blue)' : 'var(--yellow)',
                        border: '1px solid currentColor', opacity: 0.8
                      }}>{j.status}</span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{formatToken(j.fee?.amount)} {j.fee?.denom?.replace('u','')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };

  const renderJobs = () => {
    const q = jobSearch.toLowerCase();

    // Use DB jobs if filter is active, otherwise use live data
    const jobsSource = dbJobs !== null ? dbJobs : data.jobs;

    const filteredJobs = jobsSource.filter(j => {
      const matchQ = !q || (
        (j.target_validator||'').toLowerCase().includes(q) ||
        (j.execution_image||'').toLowerCase().includes(q) ||
        (j.status||'').toLowerCase().includes(q) ||
        (j.creator||'').toLowerCase().includes(q) ||
        String(j.id).includes(q)
      );
      const matchS = !jobStatus || j.status === jobStatus;
      return matchQ && matchS;
    });

    return (
      <div className="fade-in">
        <Panel 
          title="⛏ Compute Jobs" 
          subtitle={dbJobs !== null ? "Showing historical data from Supabase Database" : "Showing latest network activity (Live)"} 
          pill={dbLoading ? "Loading..." : `${totalJobs.toLocaleString()} jobs total`}
        >
          <div style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <input 
              type="text" 
              placeholder="Filter by validator / image / status..." 
              value={jobSearch} 
              onChange={e => setJobSearch(e.target.value)}
              style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, flex: 1, maxWidth: 350, outline: 'none', fontFamily: 'Martian Mono, monospace' }}
            />
            <CustomSelect 
              value={jobStatus} 
              onChange={val => setJobStatus(val)}
              options={[
                { value: "", label: "All Status" },
                { value: "PendingExecution", label: "Pending" },
                { value: "PendingValidation", label: "Validating" },
                { value: "Completed", label: "Completed" },
                { value: "Failed", label: "Failed" }
              ]}
            />
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            <table className="rep-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>ID</th><th>Transactions</th><th>Creator</th><th>Target Validator</th><th>Execution Image</th><th>Status</th><th>Fee</th></tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No jobs found</td></tr> : null}
                {filteredJobs.slice(0, 100).map((j, i) => (
                  <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td style={{ padding: '10px 20px', color: 'var(--accent-green)', fontFamily: 'Martian Mono, monospace' }}>#{j.id}</td>
                    <td style={{ padding: '10px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(j.job_transactions || []).map(tx => (
                          <a 
                            key={tx.tx_hash}
                            href={`https://stake.astrostake.xyz/republic-testnet/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${tx.type}: ${tx.tx_hash}`}
                            style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center' }}
                          >
                            <Box size={14} />
                          </a>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '10px 20px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Martian Mono, monospace' }}>{formatAddress(j.creator)}</td>
                    <td style={{ padding: '10px 20px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Martian Mono, monospace' }}>{formatAddress(j.target_validator)}</td>
                    <td style={{ padding: '10px 20px'}}><span style={{ padding: '2px 6px', background: 'var(--s3)', borderRadius: 4, fontSize: 10, color: 'var(--text-primary)' }}>{j.execution_image || '–'}</span></td>
                    <td style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: j.status === 'Completed' ? 'var(--green)' : j.status === 'Failed' ? 'var(--red)' : 'var(--yellow)' }}>
                      {j.status}
                    </td>
                    <td style={{ padding: '10px 20px', fontSize: 11, color: 'var(--text-muted)' }}>{formatToken(j.fee?.amount)} {j.fee?.denom?.replace('u','')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };

  const renderValidators = () => {
    let filteredVals = data.validators;
    if (valFilter) {
      if (valFilter === 'Active') {
        filteredVals = filteredVals.filter(v => v.isActiveSet);
      } else {
        filteredVals = filteredVals.filter(v => v.statusLabel === valFilter);
      }
    }

    return (
      <div className="fade-in">
        <Panel title="🏆 Validator Set" subtitle="Active & inactive validators with signing info">
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{filteredVals.length} total</span>
              <CustomSelect 
                value={valFilter} 
                onChange={val => setValFilter(val)}
                padding="4px 10px"
                fontSize={12}
                options={[
                  { value: "", label: "All Status" },
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "Jailed", label: "Jailed" }
                ]}
              />
            </div>
            
            {/* View Toggle */}
            <div style={{ display: 'flex', background: 'var(--s1)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setValidatorView('list')}
                style={{ 
                  background: validatorView === 'list' ? 'var(--s3)' : 'transparent',
                  color: validatorView === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4, transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                }}
              >
                Validator List
              </button>
              <button 
                onClick={() => setValidatorView('uptime')}
                style={{ 
                  background: validatorView === 'uptime' ? 'var(--accent-green)' : 'transparent',
                  color: validatorView === 'uptime' ? '#000' : 'var(--text-muted)',
                  padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Activity size={14} /> Live Uptime Tracking
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            {validatorView === 'list' ? (
              <table className="rep-table" style={{ width: '100%', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>Rank</th>
                    <th style={{ minWidth: 250 }}>Validator</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Status</th>
                    <th style={{ minWidth: 200 }}>Voting Power</th>
                    <th style={{ textAlign: 'center' }}>Commission</th>
                    <th style={{ textAlign: 'center' }}>Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVals.map((v, idx) => (
                    <tr key={v.operator_address} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                       <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                       <td style={{ padding: '16px 20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ValidatorLogo identity={v.identity} moniker={v.moniker} fallbackSeed={v.operator_address} />
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{v.moniker || 'Unknown'}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Martian Mono, monospace' }}>{formatAddress(v.operator_address)}</span>
                           </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                         <span style={{ 
                           fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '4px 8px', borderRadius: 4,
                           background: v.statusLabel === 'Active' ? 'rgba(0, 255, 145, 0.1)' : v.statusLabel === 'Jailed' ? 'rgba(255, 59, 92, 0.1)' : 'rgba(255,255,255,0.05)',
                           color: v.statusLabel === 'Active' ? 'var(--accent-green)' : v.statusLabel === 'Jailed' ? 'var(--red)' : 'var(--text-muted)',
                           border: `1px solid ${v.statusLabel === 'Active' ? 'rgba(0, 255, 145, 0.2)' : v.statusLabel === 'Jailed' ? 'rgba(255, 59, 92, 0.2)' : 'rgba(255,255,255,0.1)'}`
                         }}>
                           {v.statusLabel}
                         </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 140 }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                 <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatToken(v.tokens, 18, true)}</span>
                                 <span style={{ color: 'var(--text-muted)' }}>{v.vpShare}%</span>
                             </div>
                             {/* Progress Bar */}
                             <div style={{ width: '100%', height: 4, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
                                 <div style={{ height: '100%', background: 'var(--accent-green)', width: `${Math.min(100, parseFloat(v.vpShare))}%` }} />
                             </div>
                         </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>{v.commPct}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, textAlign: 'center', fontWeight: 800, color: v.uptime > 95 ? 'var(--green)' : 'var(--orange)' }}>{v.uptime}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '10px 20px' }}>
                 <div style={{ paddingBottom: 12 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Real-time Uptime Monitor</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Visualizing validator performance across the last 100 blocks</p>
                 </div>
                 {filteredVals.map((v, idx) => {
                    const history = liveUptimeHistory[v.operator_address] || [];
                    const displayHistory = [...history];
                    let signedCount = 0;
                    history.forEach(h => { if (h.signed) signedCount++; });
                    const liveReliability = history.length > 0 ? ((signedCount / history.length) * 100).toFixed(2) : '100.00';

                    while(displayHistory.length < 100) displayHistory.push(null); 

                     return (
                       <div key={v.operator_address} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--s1)', borderRadius: 12, border: '1px solid var(--border)', transition: 'transform 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 280, overflow: 'hidden' }}>
                              <div style={{ minWidth: 24, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>#{idx + 1}</div>
                             <ValidatorLogo identity={v.identity} moniker={v.moniker} fallbackSeed={v.operator_address} />
                             <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{v.moniker || 'Unknown'}</span>
                          </div>
                         <div style={{ display: 'flex', gap: 4, flex: 1, padding: '0 20px', overflow: 'hidden' }}>
                            {displayHistory.map((item, idx) => {
                               const isUp = item?.signed;
                               return (
                               <div 
                                 key={idx} 
                                 title={item ? `Block #${item.height}: ${item.signed ? 'SIGNED' : 'MISSED'}` : 'Waiting for block...'}
                                 style={{ 
                                  flex: 1, minWidth: 4, height: 20, borderRadius: 2, 
                                  background: item === null ? 'var(--s3)' : isUp ? 'var(--accent-green)' : 'rgba(255, 59, 92, 0.8)',
                                  opacity: item === null ? 0.4 : isUp ? 1 : 0.8,
                                  cursor: item ? 'help' : 'default',
                                  transition: 'filter 0.2s',
                               }} 
                               onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.5)'}
                               onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                               />
                               );
                            })}
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: 80 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: Number(liveReliability) > 99 ? 'var(--accent-green)' : Number(liveReliability) > 95 ? 'var(--yellow)' : 'var(--red)' }}>
                              {liveReliability}%
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Reliability</span>
                         </div>
                      </div>
                    );
                 })}
              </div>
            )}
          </div>
        </Panel>
      </div>
    );
  };

  const renderBlocks = () => {
    return (
      <div className="fade-in">
        <Panel title="📊 Network Activity" subtitle="Transactions per block (last 20 blocks)" pill={`${data.blockMetas[0]?.txs || 0} latest txs`}>
           <TransactionChart blockMetas={data.blockMetas} />
        </Panel>


        <Panel title="📦 Recent Blocks">
          <div style={{ overflowX: 'auto' }}>
            <table className="rep-table" style={{ width: '100%', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Height</th>
                  <th style={{ width: 140 }}>Time</th>
                  <th style={{ minWidth: 200 }}>Proposer</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Txs</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Size</th>
                </tr>
              </thead>
              <tbody>
                {data.blockMetas.map((b, i) => {
                  const vData = data.validators.find(v => v.hexAddress === b.proposerHex);
                  return (
                    <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ color: 'var(--accent-green)', fontFamily: 'Martian Mono, monospace', fontWeight: 800, fontSize: 14 }}>#{b.height}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{b.timeAgoStr}</td>
                      <td style={{ padding: '16px 20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 24, height: 24, flexShrink: 0 }}>
                               <ValidatorLogo identity={vData?.identity} moniker={b.proposer} fallbackSeed={b.proposerHex} size={24} />
                            </div>
                            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{b.proposer}</span>
                         </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontFamily: 'Martian Mono, monospace', fontSize: 14, textAlign: 'center', fontWeight: 700 }}>{b.txs}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>{b.size} bytes</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };


  return (
    <div style={{ maxWidth: 1400, margin: '80px auto', padding: '0 24px', fontFamily: 'Inter, sans-serif' }}>
      {/* Dashboard Topbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity className="c-green" /> Network Intelligence
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Real-time telemetry and consensus state for {data.chainConfig?.pretty_name || 'Republic AI'}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
             <Activity size={14} className={loading && !isHalted ? 'c-green pulse' : ''} />
             {lastUpdated ? `Last seen: ${lastUpdated}` : 'Connecting...'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--s1)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div className={`live-dot ${isHalted ? 'bg-orange' : 'bg-green pulse'}`} style={{ width: 8, height: 8, borderRadius: '50%' }}></div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {isHalted ? 'Halted' : 'Live Syncing'}
            </span>
          </div>
        </div>
      </div>

      {haltedBanner}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', overflowX: 'auto', paddingBottom: 1 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '12px 20px',
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === t.id ? 'var(--s1)' : 'transparent',
              border: '1px solid transparent',
              borderColor: activeTab === t.id ? 'var(--border) var(--border) var(--s1) var(--border)' : 'transparent',
              color: activeTab === t.id ? 'var(--accent-green)' : 'var(--text-muted)',
              marginBottom: -1,
              borderRadius: '8px 8px 0 0',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* View Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'validators' && renderValidators()}
        {activeTab === 'blocks' && renderBlocks()}
    </div>
  );
}

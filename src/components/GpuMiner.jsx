import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard, fetchNetworkStats, fetchRecentActivity } from '../utils/rpc.js';
import { Activity, Trophy, BarChart2, Users, Cpu, CheckCircle2, XCircle, RefreshCw, Loader2, Hash } from 'lucide-react';


function truncAddr(addr) {
  if (!addr) return '—';
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

function truncAddrTiny(addr) {
  if (!addr) return '—';
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtNum(n) {
  if (n === undefined || n === null) return '—';
  return Number(n).toLocaleString();
}


function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent-green)', loading }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.2s',
        minWidth: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-green-border)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={13} style={{ color }} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </span>
      </div>


      {loading ? (
        <div style={{ height: 26, width: '70%', background: 'rgba(255,255,255,0.06)', borderRadius: 6, animation: 'pulse 1.5s ease infinite' }} />
      ) : (
        <span style={{
          fontSize: 18,
          fontWeight: 800,
          fontFamily: 'Martian Mono, monospace',
          color,
          letterSpacing: '-0.02em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}>
          {value}
        </span>
      )}


      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -4 }}>{sub}</span>}
    </div>
  );
}

function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{ height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4, width: i === 0 ? 28 : '80%', animation: 'pulse 1.5s ease infinite' }} />
        </td>
      ))}
    </tr>
  );
}

const RANK_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
const RANK_EMOJIS = { 1: '🥇', 2: '🥈', 3: '🥉' };


function LeaderboardTab({ loading, data, error, onRetry }) {
  const thStyle = {
    padding: '12px 16px',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.02)',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>Leaderboard</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Top miners ranked by total jobs processed since genesis</p>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 60 }}>Rank</th>
                <th style={thStyle}>Miner Address</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total Jobs</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Submit Jobs</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : (
                data.map((miner) => (
                  <tr
                    key={miner.address}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,111,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: RANK_COLORS[miner.rank] || 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                        {RANK_EMOJIS[miner.rank] || `#${miner.rank}`}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontFamily: 'Martian Mono, monospace',
                        fontSize: 12,
                        color: miner.rank <= 3 ? RANK_COLORS[miner.rank] : 'var(--text-primary)',
                        fontWeight: miner.rank <= 3 ? 700 : 400,
                      }}>
                        {truncAddr(miner.address)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'Martian Mono, monospace', fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>
                        {fmtNum(miner.totalJobs)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'Martian Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {fmtNum(miner.submitJobs)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                        {timeAgo(miner.lastSeen)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


function StatsTab({ loadingStats, loadingActivity, stats, activity, errorStats, errorActivity, onRetry }) {
  const thStyle = {
    padding: '10px 16px',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.02)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      <div>
        <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', marginBottom: 16 }}>Network Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard loading={loadingStats} icon={Cpu} label="Total Jobs" value={fmtNum(stats?.totalJobs)} sub="All-time since genesis" />
          <StatCard loading={loadingStats} icon={CheckCircle2} label="Submit Jobs" value={fmtNum(stats?.totalSubmitJobs)} sub="Successful completions" color="#7cffb5" />
          <StatCard loading={loadingStats} icon={BarChart2} label="Submit Result" value={stats ? `${stats.submitResult}%` : '—'} sub="Pass rate" color="#00d4ff" />
          <StatCard loading={loadingStats} icon={Users} label="Total Miners" value={fmtNum(stats?.totalMiners)} sub="Unique active addresses" />
          <StatCard loading={loadingStats} icon={Trophy} label="Top Miner" value={truncAddr(stats?.topMiner)} sub="#1 ranked by total jobs" color="#FFD700" />
          <StatCard loading={loadingStats} icon={Hash} label="Latest Block" value={stats ? `#${fmtNum(stats.networkBlock)}` : '—'} sub="Current chain height" color="#a78bfa" />
        </div>
      </div>


      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>Recent Activity</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Latest job submissions across the network</p>
          </div>
        </div>

        {errorActivity ? (
          <ErrorState message={errorActivity} onRetry={onRetry} />
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Block</th>
                  <th style={thStyle}>Miner</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {loadingActivity ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                ) : (
                  activity.map((evt, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,111,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'Martian Mono, monospace', fontSize: 12, color: 'var(--accent-green)' }}>#{fmtNum(evt.block)}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'Martian Mono, monospace', fontSize: 12, color: 'var(--text-primary)' }}>{truncAddr(evt.miner)}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>{evt.type}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: evt.status === 'success' ? 'rgba(0,255,111,0.1)' : 'rgba(255,59,92,0.1)',
                          color: evt.status === 'success' ? 'var(--accent-green)' : '#FF3B5C',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          {evt.status === 'success' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {evt.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(evt.time)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: 16 }}>
      <XCircle size={36} style={{ color: '#FF3B5C', margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{message || 'Failed to load data.'}</p>
      <button
        onClick={onRetry}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,59,92,0.3)', background: 'rgba(255,59,92,0.08)', color: '#FF3B5C', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );
}


const TABS = [
  { id: 'stats', label: 'Stats & Activity', icon: Activity },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function GpuMiner() {
  const [activeTab, setActiveTab] = useState('stats');

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [errorLeaderboard, setErrorLeaderboard] = useState(null);

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [errorActivity, setErrorActivity] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAll = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);


    setLoadingLeaderboard(true);
    setErrorLeaderboard(null);
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (e) {
      setErrorLeaderboard(e.message || 'Failed to load leaderboard');
    } finally {
      setLoadingLeaderboard(false);
    }


    setLoadingStats(true);
    setErrorStats(null);
    try {
      const data = await fetchNetworkStats();
      setStats(data);
    } catch (e) {
      setErrorStats(e.message || 'Failed to load stats');
    } finally {
      setLoadingStats(false);
    }


    setLoadingActivity(true);
    setErrorActivity(null);
    try {
      const data = await fetchRecentActivity();
      setActivity(data);
    } catch (e) {
      setErrorActivity(e.message || 'Failed to load activity');
    } finally {
      setLoadingActivity(false);
      setIsRefreshing(false);
    }

    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAll(), 30_000);
    return () => clearInterval(interval);
  }, [loadAll]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', animation: 'fadeIn 0.3s ease' }}>


      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(0,255,111,0.08)', border: '1px solid rgba(0,255,111,0.15)', marginBottom: 12 }}>
          <Cpu size={11} style={{ color: 'var(--accent-green)' }} />
          <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>GPU Miner</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #FFFFFF 30%, #888888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Miner Dashboard
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Live statistics and rankings for the Republic AI GPU compute network.
              {lastUpdated && ` · Updated ${timeAgo(lastUpdated.toISOString())}`}
            </p>
          </div>
          <button
            onClick={() => loadAll(true)}
            disabled={isRefreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: isRefreshing ? 'not-allowed' : 'pointer', opacity: isRefreshing ? 0.6 : 1, transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!isRefreshing) e.currentTarget.style.borderColor = 'var(--accent-green-border)'; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {isRefreshing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>


      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 9,
              cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              background: activeTab === tab.id ? 'rgba(0,255,111,0.12)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-green)' : 'var(--text-muted)',
              border: activeTab === tab.id ? '1px solid var(--accent-green-border)' : '1px solid transparent',
              boxShadow: activeTab === tab.id ? '0 0 15px rgba(0, 255, 111, 0.12)' : 'none',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>


      {activeTab === 'leaderboard' && (
        <LeaderboardTab
          loading={loadingLeaderboard}
          data={leaderboard}
          error={errorLeaderboard}
          onRetry={loadAll}
        />
      )}
      {activeTab === 'stats' && (
        <StatsTab
          loadingStats={loadingStats}
          loadingActivity={loadingActivity}
          stats={stats}
          activity={activity}
          errorStats={errorStats}
          errorActivity={errorActivity}
          onRetry={loadAll}
        />
      )}
    </div>
  );
}

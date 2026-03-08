/**
 * Republic RPC Utility
 * 
 * All functions are ready to be wired to the real RPC endpoint.
 * Replace the mock data blocks with real fetch() calls once the RPC URL is available.
 * 
 * Expected env var: VITE_REPUBLIC_RPC_URL
 */

const RPC_URL = import.meta.env.VITE_REPUBLIC_RPC_URL;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LEADERBOARD = [
    { rank: 1, address: 'rai1q8r4f8lpn9jx5qzfvs7dhk3m2g6wkp4tndrqcu', totalJobs: 48392, submitJobs: 47901, lastSeen: '2026-03-08T05:41:00Z' },
    { rank: 2, address: 'rai1qd7xl2zp4yknt0r3esmfv8nwachg5q3fklmhdej', totalJobs: 41205, submitJobs: 40110, lastSeen: '2026-03-08T05:39:12Z' },
    { rank: 3, address: 'rai1qnpfm6jr3ta5lgk9dv2e0ushq7wycx8mkl4rpzy', totalJobs: 36744, submitJobs: 36100, lastSeen: '2026-03-08T05:38:55Z' },
    { rank: 4, address: 'rai1qcvj5mw2hpq4lt8skdrx0gu76bnz9fy3v1m8epa', totalJobs: 31200, submitJobs: 30800, lastSeen: '2026-03-08T05:35:22Z' },
    { rank: 5, address: 'rai1qzmhwn803jf2klprvxaq9t5gyu4d1e6cb7sknft', totalJobs: 28955, submitJobs: 28100, lastSeen: '2026-03-08T05:30:01Z' },
    { rank: 6, address: 'rai1q074tp4lp8tnncns5kh5ujkhl4fl65tquratqc', totalJobs: 24102, submitJobs: 23500, lastSeen: '2026-03-08T05:25:47Z' },
    { rank: 7, address: 'rai1qvwty5nj0u8qmhxkvpz3d4l6c2rab1fgsh79ked', totalJobs: 19870, submitJobs: 19200, lastSeen: '2026-03-08T05:20:33Z' },
    { rank: 8, address: 'rai1qr4xz1lhe8mkjtduc6ywvf9n05pb3qsa2g7xnyh', totalJobs: 15444, submitJobs: 15000, lastSeen: '2026-03-08T05:15:10Z' },
    { rank: 9, address: 'rai1q2bn9fvwlkm0ejhr7qs5xcpz3gt4u6ayd1m8rut', totalJobs: 12305, submitJobs: 11900, lastSeen: '2026-03-08T05:10:55Z' },
    { rank: 10, address: 'rai1q5skpjdm3xntgwyf0crl8v4bhe2zua96q1mndty', totalJobs: 9810, submitJobs: 9500, lastSeen: '2026-03-08T05:05:40Z' },
];

const MOCK_STATS = {
    totalMiners: 247,
    totalJobs: 2_841_933,
    totalSubmitJobs: 2_793_021,
    submitResult: 98.3,
    topMiner: 'rai1q8r4f8lpn9jx5qzfvs7dhk3m2g6wkp4tndrqcu',
    networkBlock: 487_332,
};

const MOCK_RECENT_ACTIVITY = [
    { block: 487332, miner: 'rai1q8r4f8lpn9jx5qzfvs7dhk3m2g6wkp4tndrqcu', type: 'Submit', status: 'success', time: '2026-03-08T05:41:00Z' },
    { block: 487331, miner: 'rai1qd7xl2zp4yknt0r3esmfv8nwachg5q3fklmhdej', type: 'Submit', status: 'success', time: '2026-03-08T05:40:50Z' },
    { block: 487330, miner: 'rai1qnpfm6jr3ta5lgk9dv2e0ushq7wycx8mkl4rpzy', type: 'Submit', status: 'failed', time: '2026-03-08T05:40:40Z' },
    { block: 487329, miner: 'rai1qcvj5mw2hpq4lt8skdrx0gu76bnz9fy3v1m8epa', type: 'Submit', status: 'success', time: '2026-03-08T05:40:24Z' },
    { block: 487328, miner: 'rai1qzmhwn803jf2klprvxaq9t5gyu4d1e6cb7sknft', type: 'Submit', status: 'success', time: '2026-03-08T05:40:10Z' },
    { block: 487327, miner: 'rai1q074tp4lp8tnncns5kh5ujkhl4fl65tquratqc', type: 'Submit', status: 'success', time: '2026-03-08T05:39:55Z' },
    { block: 487326, miner: 'rai1qvwty5nj0u8qmhxkvpz3d4l6c2rab1fgsh79ked', type: 'Submit', status: 'success', time: '2026-03-08T05:39:40Z' },
    { block: 487325, miner: 'rai1qr4xz1lhe8mkjtduc6ywvf9n05pb3qsa2g7xnyh', type: 'Submit', status: 'failed', time: '2026-03-08T05:39:25Z' },
    { block: 487324, miner: 'rai1q2bn9fvwlkm0ejhr7qs5xcpz3gt4u6ayd1m8rut', type: 'Submit', status: 'success', time: '2026-03-08T05:39:10Z' },
    { block: 487323, miner: 'rai1q5skpjdm3xntgwyf0crl8v4bhe2zua96q1mndty', type: 'Submit', status: 'success', time: '2026-03-08T05:38:55Z' },
];

// ─── Simulated network delay ──────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetch leaderboard ranked by total jobs.
 * TODO: Replace with → GET `${RPC_URL}/gpu/leaderboard` or equivalent
 */
export async function fetchLeaderboard() {
    await delay(800); // simulate network
    // const res = await fetch(`${RPC_URL}/gpu/leaderboard`);
    // if (!res.ok) throw new Error('Failed to fetch leaderboard');
    // return res.json();
    return MOCK_LEADERBOARD;
}

/**
 * Fetch network-wide stats.
 * TODO: Replace with → GET `${RPC_URL}/gpu/stats`
 */
export async function fetchNetworkStats() {
    await delay(600);
    // const res = await fetch(`${RPC_URL}/gpu/stats`);
    // if (!res.ok) throw new Error('Failed to fetch stats');
    // return res.json();
    return MOCK_STATS;
}

/**
 * Fetch recent job activity (latest N events).
 * TODO: Replace with → GET `${RPC_URL}/gpu/activity?limit=20`
 */
export async function fetchRecentActivity() {
    await delay(700);
    // const res = await fetch(`${RPC_URL}/gpu/activity?limit=20`);
    // if (!res.ok) throw new Error('Failed to fetch activity');
    // return res.json();
    return MOCK_RECENT_ACTIVITY;
}

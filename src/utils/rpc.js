/**
 * Republic RPC Utility
 * 
 * All functions are ready to be wired to the real RPC endpoint.
 * Configuration is now fetched dynamically from Supabase to keep endpoints secret.
 */

// We don't read from import.meta.env anymore. 
// Values will be passed or fetched as needed.

// ─── GPU Miner Mock Data ──────────────────────────────────────────────────────

const MOCK_LEADERBOARD = [
    { rank: 1, address: 'rai1q8r4f8lpn9jx5qzfvs7dhk3m2g6wkp4tndrqcu', totalJobs: 48392, submitJobs: 47901, lastSeen: '2026-03-08T05:41:00Z' },
    { rank: 2, address: 'rai1qd7xl2zp4yknt0r3esmfv8nwachg5q3fklmhdej', totalJobs: 41205, submitJobs: 40110, lastSeen: '2026-03-08T05:39:12Z' },
    { rank: 3, address: 'rai1qnpfm6jr3ta5lgk9dv2e0ushq7wycx8mkl4rpzy', totalJobs: 36744, submitJobs: 36100, lastSeen: '2026-03-08T05:38:55Z' },
    { rank: 4, address: 'rai1qcvj5mw2hpq4lt8skdrx0gu76bnz9fy3v1m8epa', totalJobs: 31200, submitJobs: 30800, lastSeen: '2026-03-08T05:35:22Z' },
    { rank: 5, address: 'rai1qzmhwn803jf2klprvxaq9t5gyu4d1e6cb7sknft', totalJobs: 28955, submitJobs: 28100, lastSeen: '2026-03-08T05:30:01Z' },
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
];

// ─── Validator Mock Data ──────────────────────────────────────────────────────

const MOCK_VALIDATORS = [
    { rank: 1, moniker: 'Republic Core', identity: 'https://api.dicebear.com/7.x/identicon/svg?seed=core', votingPower: 125400, share: '10.2%', commission: '5%', uptime: '100%', status: 'Active' },
    { rank: 2, moniker: 'CyberNode', identity: 'https://api.dicebear.com/7.x/identicon/svg?seed=cyber', votingPower: 98200, share: '8.1%', commission: '3%', uptime: '99.9%', status: 'Active' },
    { rank: 3, moniker: 'Cosmos Hub', identity: 'https://api.dicebear.com/7.x/identicon/svg?seed=cosmos', votingPower: 85000, share: '6.9%', commission: '5%', uptime: '100%', status: 'Active' },
    { rank: 4, moniker: 'Nebula Stake', identity: 'https://api.dicebear.com/7.x/identicon/svg?seed=nebula', votingPower: 72100, share: '5.8%', commission: '2%', uptime: '99.8%', status: 'Active' },
    { rank: 5, moniker: 'Titan Validators', identity: 'https://api.dicebear.com/7.x/identicon/svg?seed=titan', votingPower: 65300, share: '5.3%', commission: '7%', uptime: '100%', status: 'Active' },
];

const MOCK_VALIDATOR_STATS = [
    { label: 'Total Staked', value: '1,245,892 RAI' },
    { label: 'Active Validators', value: '125 / 150' },
    { label: 'Block Time', value: '5.2s' },
    { label: 'Community Pool', value: '45,201 RAI' },
];

const MOCK_BLOCKS = [
    { height: '1,245,892', proposer: 'Republic Core', time: '2s ago', hash: '0x...a1b2' },
    { height: '1,245,891', proposer: 'CyberNode', time: '7s ago', hash: '0x...c3d4' },
    { height: '1,245,890', proposer: 'Cosmos Hub', time: '12s ago', hash: '0x...e5f6' },
    { height: '1,245,889', proposer: 'Republic Core', time: '17s ago', hash: '0x...g7h8' },
    { height: '1,245,888', proposer: 'Nebula Stake', time: '22s ago', hash: '0x...i9j0' },
];

// ─── Simulated network delay ──────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── GPU API Functions ────────────────────────────────────────────────────────

export async function fetchLeaderboard() {
    await delay(800);
    return MOCK_LEADERBOARD;
}

export async function fetchNetworkStats() {
    await delay(600);
    return MOCK_STATS;
}

export async function fetchRecentActivity() {
    await delay(700);
    return MOCK_RECENT_ACTIVITY;
}

// ─── Validator API Functions ──────────────────────────────────────────────────

export async function fetchValidators() {
    await delay(600);
    return MOCK_VALIDATORS;
}

export async function fetchValidatorStats() {
    await delay(500);
    return MOCK_VALIDATOR_STATS;
}

export async function fetchRecentBlocks() {
    await delay(700);
    return MOCK_BLOCKS;
}

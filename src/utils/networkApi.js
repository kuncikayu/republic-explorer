import chainConfig from '../chain/republic-chain.json';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Extract all RPC and REST endpoints dynamically
const rpcEndpoints = chainConfig?.apis?.rpc?.map(r => r.address) || ['https://rpc.republicai.io'];
const restEndpoints = chainConfig?.apis?.rest?.map(r => r.address) || ['https://rest.republicai.io'];

// Track the current active endpoint index
let currentRpcIndex = 0;
let currentRestIndex = 0;

const HTTP_TIMEOUT = 10000;

class FetchError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'FetchError';
        this.status = status;
    }
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), HTTP_TIMEOUT);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) {
            throw new FetchError(`HTTP ${res.status} to ${url}`, res.status);
        }
        return await res.json();
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// Auto-fallback REST Fetcher
async function apiFetch(path, attempt = 0) {
    if (attempt >= restEndpoints.length) {
        console.error(`❌ [REST] All endpoints failed for ${path}`);
        return null;
    }

    const endpoint = restEndpoints[currentRestIndex];
    try {
        return await fetchWithTimeout(`${endpoint}${path}`);
    } catch (e) {
        console.warn(`⚠ [REST] Failed at ${endpoint}. Switching to next...`, e.message);
        currentRestIndex = (currentRestIndex + 1) % restEndpoints.length;
        return apiFetch(path, attempt + 1);
    }
}

// Auto-fallback RPC Fetcher
async function rpcFetch(path, attempt = 0) {
    if (attempt >= rpcEndpoints.length) {
        console.error(`❌ [RPC] All endpoints failed for ${path}`);
        return null;
    }

    const endpoint = rpcEndpoints[currentRpcIndex];
    try {
        return await fetchWithTimeout(`${endpoint}${path}`);
    } catch (e) {
        console.warn(`⚠ [RPC] Failed at ${endpoint}. Switching to next...`, e.message);
        currentRpcIndex = (currentRpcIndex + 1) % rpcEndpoints.length;
        return rpcFetch(path, attempt + 1);
    }
}

// FORMATTERS
export const formatToken = (amount, decimals = 18) => {
    if (!amount) return '0';

    if (typeof amount === 'string' && /^\d+$/.test(amount)) {
        try {
            const bigAmt = BigInt(amount);
            const divisor = 10n ** BigInt(decimals);
            const inRAI = Number(bigAmt / divisor);

            if (inRAI >= 1000000000000) return (inRAI / 1000000000000).toFixed(2) + 'T';
            if (inRAI >= 1000000000) return (inRAI / 1000000000).toFixed(2) + 'B';
            if (inRAI >= 1000000) return (inRAI / 1000000).toFixed(2) + 'M';
            if (inRAI >= 1000) return (inRAI / 1000).toFixed(2) + 'k';
            return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(inRAI);
        } catch (e) { }
    }

    const val = parseFloat(amount);
    if (isNaN(val)) return '0';

    const inRAI = val / Math.pow(10, decimals);
    if (inRAI >= 1000000000000) return (inRAI / 1000000000000).toFixed(2) + 'T';
    if (inRAI >= 1000000000) return (inRAI / 1000000000).toFixed(2) + 'B';
    if (inRAI >= 1000000) return (inRAI / 1000000).toFixed(2) + 'M';
    if (inRAI >= 1000) return (inRAI / 1000).toFixed(2) + 'k';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(inRAI);
};

export const formatAddress = (addr, prefix = 5, suffix = 4) => {
    if (!addr) return '—';
    if (addr.length < prefix + suffix + 2) return addr;
    return `${addr.substring(0, prefix)}...${addr.substring(addr.length - suffix)}`;
};

const computeHexAddress = async (pubkeyBase64) => {
    if (!pubkeyBase64) return null;
    try {
        const binaryString = atob(pubkeyBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hexAddress = hashArray.slice(0, 20).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        return hexAddress;
    } catch (e) {
        return null;
    }
}

export const b64ToHex = (b64) => {
    if (!b64) return '';
    try {
        return Array.from(atob(b64)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').toUpperCase();
    } catch (e) {
        return '';
    }
};

export const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    return Math.floor(seconds) + 's ago';
};

// CORE FETCHERS
export async function fetchAllNetworkData(lightweight = false, existingData = null) {
    const results = await Promise.all([
        apiFetch('/republic/computevalidation/v1/jobs?pagination.limit=300&pagination.reverse=true'),
        rpcFetch('/status'),
        lightweight ? Promise.resolve(null) : apiFetch('/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=1000'),
        lightweight ? Promise.resolve(null) : apiFetch('/cosmos/staking/v1beta1/validators?status=BOND_STATUS_UNBONDING&pagination.limit=1000'),
        lightweight ? Promise.resolve(null) : apiFetch('/cosmos/staking/v1beta1/validators?status=BOND_STATUS_UNBONDED&pagination.limit=1000'),
        lightweight ? Promise.resolve(null) : apiFetch('/cosmos/slashing/v1beta1/signing_infos?pagination.limit=1000'),
        lightweight ? Promise.resolve(null) : rpcFetch('/net_info'),
        rpcFetch(`/blockchain?_t=${Date.now()}`), 
        lightweight ? Promise.resolve(null) : apiFetch('/cosmos/staking/v1beta1/pool'),
        lightweight ? Promise.resolve(null) : apiFetch('/cosmos/bank/v1beta1/supply'),
        rpcFetch('/num_unconfirmed_txs'),
        rpcFetch('/unconfirmed_txs?limit=20'),
        rpcFetch('/validators?per_page=1000'), 
        apiFetch('/cosmos/base/tendermint/v1beta1/blocks/latest'),
        lightweight ? Promise.resolve(null) : apiFetch('/cosmos/staking/v1beta1/params'),
        fetchJobStatsFromDb()
    ]);

    const [
        jobsRes,
        statusRes,
        vBondedRes,
        vUnbondingRes,
        vUnbondedRes,
        signingInfosRes,
        netInfoRes,
        blockchainRes,
        poolRes,
        supplyRes,
        mempoolRes,
        unconfirmedTxsRes,
        tmValsRes,
        latestBlockRes,
        stakingParamsRes,
        dbJobStats
    ] = results;

    // 1. Jobs
    const jobs = jobsRes?.jobs || [];
    let jobsTotal = dbJobStats?.total || (jobsRes?.pagination?.total ? parseInt(jobsRes.pagination.total, 10) : 0);
    
    // Fallback: If total is 0 but we have jobs with high IDs, the total is at least the highest ID
    if (jobs.length > 0) {
        const maxId = Math.max(...jobs.map(j => parseInt(j.id, 10) || 0));
        if (maxId > jobsTotal) jobsTotal = maxId;
    }
    
    if (jobsTotal === 0) jobsTotal = jobs.length;

    const executionCount = dbJobStats?.execution || jobs.filter(j => j.status === 'PendingExecution').length;
    const validationCount = dbJobStats?.validation || jobs.filter(j => j.status === 'PendingValidation').length;

    // Enrichment: Fill transaction hashes from Database if available
    try {
        if (jobs.length > 0) {
            const jobIds = jobs.map(j => parseInt(j.id, 10)).filter(id => !isNaN(id));
            const { data: txData } = await supabase
                .from('job_transactions')
                .select('job_id, tx_hash, type')
                .in('job_id', jobIds);
            
            if (txData && txData.length > 0) {
                jobs.forEach(j => {
                    const id = parseInt(j.id, 10);
                    const associatedTxs = txData.filter(t => t.job_id === id);
                    if (associatedTxs.length > 0) {
                        j.job_transactions = associatedTxs;
                    }
                });
            }
        }
    } catch (e) {
        console.error("Enrichment error:", e);
    }

    // 2. Status & Halt Check
    const status = statusRes?.result || null;
    const isHalted = (() => {
        if (!status?.sync_info?.latest_block_time) return false;
        const diffMin = (Date.now() - new Date(status.sync_info.latest_block_time)) / 60000;
        return diffMin > 5;
    })();

    // 3. Validators
    let validators = lightweight && existingData ? existingData.validators : [];
    
    if (!lightweight) {
        let bonded = vBondedRes?.validators || [];
        let unbonding = vUnbondingRes?.validators || [];
        let unbonded = vUnbondedRes?.validators || [];
        
        const uniqueVals = new Map();
        [...bonded, ...unbonding, ...unbonded].forEach(v => {
            uniqueVals.set(v.operator_address, v);
        });
        let rawVals = Array.from(uniqueVals.values());
        const signingInfos = signingInfosRes?.info || [];

        validators = await Promise.all(rawVals.map(async v => {
            const sInfo = signingInfos.find(i => i.address === v.consensus_pubkey?.address); 
            const hexAddr = await computeHexAddress(v.consensus_pubkey?.key);
            
            const votingPower = BigInt(v.tokens || '0');
            const totalTokens = BigInt(poolRes?.pool?.bonded_tokens || '1');
            const vpShare = ((Number(votingPower) / Number(totalTokens)) * 100).toFixed(2);
            
            const jailed = v.jailed;
            const statusLabel = jailed ? 'Jailed' : (v.status === 'BOND_STATUS_BONDED' ? 'Active' : 'Inactive');

            const missedBlocks = parseInt(sInfo?.missed_blocks_counter || '0', 10);
            const window = parseInt(stakingParamsRes?.params?.signed_blocks_window || '10000', 10);
            const uptime = window > 0 ? ((1 - missedBlocks / window) * 100).toFixed(2) : '100.00';

            return {
                ...v,
                moniker: v.description?.moniker,
                identity: v.description?.identity,
                hexAddress: hexAddr,
                vpShare,
                statusLabel,
                uptime,
                commPct: (parseFloat(v.commission?.commission_rates?.rate || '0') * 100).toFixed(0) + '%',
                isActiveSet: v.status === 'BOND_STATUS_BONDED'
            };
        }));

        validators.sort((a, b) => {
            const ta = BigInt(a.tokens || '0');
            const tb = BigInt(b.tokens || '0');
            if (tb > ta) return 1;
            if (ta > tb) return -1;
            return 0;
        });
        validators.forEach((v, i) => v.rank = i + 1);
    } else if (existingData) {
        validators = [...existingData.validators];
        validators.sort((a, b) => {
            const ta = BigInt(a.tokens || '0');
            const tb = BigInt(b.tokens || '0');
            if (tb > ta) return 1;
            if (ta > tb) return -1;
            return 0;
        });
        validators.forEach((v, i) => v.rank = i + 1);
    }

    // 4. Blocks
    const blockchain = blockchainRes?.result || null;
    const blockMetas = (blockchain?.block_metas || []).map(b => ({
        height: b.header?.height,
        time: b.header?.time,
        timeAgoStr: timeAgo(b.header?.time),
        txs: b.num_txs,
        proposerHex: (b.header?.proposer_address || '').toUpperCase(),
        proposer: validators.find(v => (v.hexAddress || '').toUpperCase() === (b.header?.proposer_address || '').toUpperCase())?.moniker || formatAddress(b.header?.proposer_address),
        size: b.block_id?.part_set_header?.total || 0
    }));

    // 5. Mempool
    const mempoolTxs = mempoolRes?.result?.txs || [];

    return {
        jobs,
        jobsTotal,
        status,
        isHalted,
        validators,
        blockMetas,
        mempoolTxs,
        pool: lightweight && existingData ? existingData.pool : poolRes?.pool,
        supply: lightweight && existingData ? existingData.supply : supplyRes?.supply,
        chainConfig,
        latestBlockParsed: blockMetas[0],
        latestSignatures: (latestBlockRes?.block?.last_commit?.signatures || [])
            .map(s => {
                const addr = s.validator_address;
                if (!addr) return null;
                // Heuristic: Hex addresses are 40 chars. Base64 for 20 bytes is ~28 chars.
                // If it's not 40 chars, try decoding it as Base64.
                if (addr.length !== 40 && (addr.length === 28 || addr.includes('/') || addr.includes('+') || addr.endsWith('='))) {
                    const decoded = b64ToHex(addr);
                    return decoded ? decoded.toUpperCase() : null;
                }
                return addr.toUpperCase();
            })
            .filter(Boolean),
        executionCount,
        validationCount
    };
}

/**
 * Fetch jobs from Supabase for advanced filtering
 */
export async function fetchJobsFromDb({ status, search, limit = 50 }) {
    try {
        let query = supabase
            .from('compute_jobs')
            .select(`
                *,
                job_transactions (
                    tx_hash,
                    type,
                    block_height,
                    timestamp
                )
            `)
            .order('id', { ascending: false })
            .limit(limit);

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`target_validator.ilike.%${search}%,execution_image.ilike.%${search}%,creator.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("❌ Database query error:", err.message);
        return null; // Fallback to REST logic
    }
}

/**
 * Fetch granular stats of jobs in Supabase
 */
export async function fetchJobStatsFromDb() {
    try {
        const [totalRes, executionRes, validationRes] = await Promise.all([
            supabase.from('compute_jobs').select('*', { count: 'exact', head: true }),
            supabase.from('compute_jobs').select('*', { count: 'exact', head: true }).eq('status', 'PendingExecution'),
            supabase.from('compute_jobs').select('*', { count: 'exact', head: true }).eq('status', 'PendingValidation')
        ]);
        
        return {
            total: totalRes.count || 0,
            execution: executionRes.count || 0,
            validation: validationRes.count || 0
        };
    } catch (err) {
        console.error("❌ Database stats error:", err.message);
        return { total: 0, execution: 0, validation: 0 };
    }
}
/**
 * Fetch transaction data from Supabase
 */
export async function fetchTransactionsFromDb({ type, limit = 50 }) {
    try {
        let query = supabase
            .from('job_transactions')
            .select('*')
            .order('block_height', { ascending: false })
            .limit(limit);

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("❌ Database transaction query error:", err.message);
        return [];
    }
}

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';

export type StatusType = 'APPROVED' | 'AUTO_APPROVED' | 'PENDING' | 'BLOCKED' | 'DECLINED';

export type FeedItemType = 'PAYMENT' | 'SWAP';

export interface SwapDetails {
  tokenIn: string;
  tokenOut: string;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amountIn: string;
  amountOut: string;
  exchangeRate: string;
  gasCostUSD: string;
  priceImpact?: number;
}

export interface FeedItem {
  id: string;
  dateGroup: 'TODAY' | 'YESTERDAY' | 'MARCH 11';
  merchant: string;
  merchantColor: string;
  merchantInitial: string;
  amount: number;
  amountStr: string;
  intent: string;
  status: StatusType;
  statusMessage: string;
  timestamp: string;
  category: string;
  txHash?: string;
  isReal?: boolean;
  onchainVerified?: boolean;
  privateReasoningUsed?: boolean;
  permissionsContext?: `0x${string}`;
  delegationManager?: `0x${string}`;
  isDelegation?: boolean;
  spendToken?: string;
  type?: FeedItemType;
  swapDetails?: SwapDetails;
}

export interface SpendPermission {
  id: string;
  vendor: string;
  vendorInitial: string;
  vendorColor: string;
  amount: number;
  cadence: 'monthly' | 'weekly' | 'daily';
  state: 'active' | 'revoked' | 'pending';
  ruledBy: string;
  txHash?: string;
  isReal?: boolean;
  onchainVerified?: boolean;
  delegationExpiry?: number;
  permissionStruct?: {
    account: `0x${string}`;
    spender: `0x${string}`;
    token: `0x${string}`;
    allowance: string;
    period: number;
    start: number;
    end: number;
    salt: string;
    extraData: `0x${string}`;
  };
  permissionsContext?: `0x${string}`;
  delegationManager?: `0x${string}`;
  isDelegation?: boolean;
  spendToken?: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
  read: boolean;
}

export interface Thread {
  id: string;
  subject: string;
  txHash?: string;
  createdAt: number;
  messages: Message[];
}

export interface ConnectedAgent {
  name: string;
}

export interface DemoState {
  feed: FeedItem[];
  rules: Rule[];
  spendPermissions: SpendPermission[];
  stage: 'INITIAL' | 'PENDING_ADDED' | 'APPROVED' | 'RULE_DISABLED' | 'BLOCKED_ADDED';
  threads: Thread[];
  activeThreadId: string | null;
  connectedAgent: ConnectedAgent | null;
  connectAgent: (agent: ConnectedAgent) => void;
  updateAgentName: (name: string) => void;
  privateReasoningEnabled: boolean;
  setPrivateReasoningEnabled: (enabled: boolean) => void;
  agentAvatarUrl: string | null;
  setAgentAvatarUrl: (url: string | null) => void;
  disconnectAgent: () => void;
  setActiveThreadId: (id: string | null) => void;
  addThread: (subject: string) => Thread;
  addMessage: (threadId: string, role: 'user' | 'assistant', content: string) => void;
  markThreadRead: (threadId: string) => void;
  linkThreadToTx: (threadId: string, txHash: string) => void;
  deleteThread: (threadId: string) => void;
  approvePending: (
    id: string,
    realTxHash?: string,
    permissionStruct?: SpendPermission['permissionStruct'],
    onchainVerified?: boolean,
    delegationFields?: {
      permissionsContext: `0x${string}`;
      delegationManager: `0x${string}`;
      spendToken?: string;
    },
  ) => void;
  recordDelegationSpend: (
    permissionId: string,
    txHash: string,
  ) => void;
  recordSwap: (params: {
    txHash: string;
    swapDetails: SwapDetails;
    isReal: boolean;
  }) => void;
  recordBlockedSwap: (params: {
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amountIn: string;
    reason: string;
  }) => void;
  recordAgentSwapAndPay: (params: {
    swapTxHash: string;
    paymentTxHash: string;
    swapDetails: SwapDetails;
    vendor: string;
    paymentAmountUsdc: number;
  }) => void;
  checkSwapRules: (params: {
    tokenIn: string;
    tokenOut: string;
    amountUsd: number;
    slippage: number;
  }) => { allowed: boolean; reason?: string };
  declinePending: (id: string) => void;
  toggleRule: (id: string) => void;
  resetDemo: () => void;
}

const INITIAL_FEED: FeedItem[] = [
  {
    id: 'tx-2',
    dateGroup: 'TODAY',
    merchant: 'Perplexity',
    merchantColor: 'bg-teal-500',
    merchantInitial: 'P',
    amount: 20.00,
    amountStr: '$20.00',
    intent: "Purchased research credits for today's market scan",
    status: 'AUTO_APPROVED',
    statusMessage: 'Auto-approved — within daily budget',
    timestamp: '11:42 AM',
    category: 'Research Tools',
  },
  {
    id: 'tx-3',
    dateGroup: 'TODAY',
    merchant: 'CloudAnalytics',
    merchantColor: 'bg-rose-600',
    merchantInitial: 'C',
    amount: 299.00,
    amountStr: '$299.00',
    intent: "Tried to purchase enterprise analytics suite",
    status: 'BLOCKED',
    statusMessage: 'Blocked — exceeds single-purchase limit',
    timestamp: '9:15 AM',
    category: 'Software'
  },
  {
    id: 'tx-4',
    dateGroup: 'YESTERDAY',
    merchant: 'OpenAI',
    merchantColor: 'bg-zinc-700',
    merchantInitial: 'O',
    amount: 45.00,
    amountStr: '$45.00',
    intent: "Renewed API credits for report generation",
    status: 'APPROVED',
    statusMessage: 'Approved',
    timestamp: '4:20 PM',
    category: 'API Services',
  },
  {
    id: 'tx-5',
    dateGroup: 'YESTERDAY',
    merchant: 'PitchBook',
    merchantColor: 'bg-blue-600',
    merchantInitial: 'P',
    amount: 35.00,
    amountStr: '$35.00',
    intent: "Purchased market intelligence data",
    status: 'AUTO_APPROVED',
    statusMessage: 'Auto-approved',
    timestamp: '1:10 PM',
    category: 'Data Services',
  },
  {
    id: 'tx-6',
    dateGroup: 'MARCH 11',
    merchant: 'Statista',
    merchantColor: 'bg-orange-500',
    merchantInitial: 'S',
    amount: 29.00,
    amountStr: '$29.00',
    intent: "Purchased industry report access",
    status: 'APPROVED',
    statusMessage: 'Approved',
    timestamp: '10:05 AM',
    category: 'Research Reports',
  }
];

const INITIAL_SPEND_PERMISSIONS: SpendPermission[] = [
  {
    id: 'sp-1',
    vendor: 'Perplexity',
    vendorInitial: 'P',
    vendorColor: 'bg-teal-500',
    amount: 20,
    cadence: 'daily',
    state: 'active',
    ruledBy: 'r2',
  },
  {
    id: 'sp-2',
    vendor: 'OpenAI',
    vendorInitial: 'O',
    vendorColor: 'bg-zinc-700',
    amount: 45,
    cadence: 'monthly',
    state: 'active',
    ruledBy: 'r2',
  },
];

const INITIAL_RULES: Rule[] = [
  { id: 'r1', name: 'Verified vendors only', description: 'Only spend at vendors verified on Base', enabled: true },
  { id: 'r2', name: 'Per-purchase cap: 50 USDC', description: 'Block any single purchase above $50 USDC', enabled: true },
  { id: 'r3', name: 'Daily limit: 200 USDC', description: 'Cap total daily spend at $200 USDC', enabled: true },
  { id: 'r4', name: 'Block spend permissions', description: 'Prevent your agent from creating recurring spend permissions', enabled: true },
  { id: 'r5', name: 'New vendor approval', description: 'Require your approval before paying a new vendor', enabled: true },
  { id: 'r6', name: 'Max slippage: 1%', description: 'Block swaps with slippage tolerance above 1%', enabled: true },
  { id: 'r7', name: 'Per-swap cap: 50 USDC', description: 'Block any single swap above $50 USDC equivalent', enabled: true },
  { id: 'r8', name: 'Approved tokens only', description: 'Only allow swaps between ETH, WETH, and USDC', enabled: true },
];

const SEED_THREADS: Thread[] = [
  {
    id: 'demo-thread-1',
    subject: 'DataStream Pro purchase',
    txHash: undefined,
    createdAt: Date.now() - 120000,
    messages: [{
      id: 'demo-m1',
      role: 'assistant',
      content: "I'm tracking DataStream Pro — $5/session, within your daily cap. Ready when you are.",
      ts: Date.now() - 120000,
      read: false,
    }],
  },
];

const STORAGE_KEY_PREFIX = 'hashapp_demo_state';
const AVATAR_STORAGE_KEY_PREFIX = 'hashapp_agent_avatar';
const AGENT_STORAGE_KEY_PREFIX = 'hashapp_connected_agent';

function stateKey(walletAddress: string | undefined) {
  if (!walletAddress || typeof walletAddress !== 'string') return null;
  return `${STORAGE_KEY_PREFIX}_${walletAddress.toLowerCase()}`;
}

function agentKey(walletAddress: string | undefined) {
  if (!walletAddress) return null;
  return `${AGENT_STORAGE_KEY_PREFIX}_${walletAddress.toLowerCase()}`;
}

function avatarKey(walletAddress: string | undefined) {
  if (!walletAddress) return null;
  return `${AVATAR_STORAGE_KEY_PREFIX}_${walletAddress.toLowerCase()}`;
}

function loadPersistedState(walletAddress: string | undefined) {
  const key = stateKey(walletAddress);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 7) {
        if (parsed.threads === undefined) {
          parsed.threads = SEED_THREADS;
        }
        return parsed;
      }
    }
  } catch {}
  return null;
}

function persistState(walletAddress: string | undefined, feed: FeedItem[], rules: Rule[], spendPermissions: SpendPermission[], stage: DemoState['stage'], threads: Thread[]) {
  const key = stateKey(walletAddress);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({
      version: 7,
      feed,
      rules,
      spendPermissions,
      stage,
      threads,
    }));
  } catch {}
}

function loadConnectedAgent(walletAddress: string | undefined): ConnectedAgent | null {
  const key = agentKey(walletAddress);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function persistConnectedAgent(walletAddress: string | undefined, agent: ConnectedAgent | null) {
  const key = agentKey(walletAddress);
  if (!key) return;
  try {
    if (agent) {
      localStorage.setItem(key, JSON.stringify(agent));
    } else {
      localStorage.removeItem(key);
    }
  } catch {}
}

function loadAgentAvatar(walletAddress: string | undefined): string | null {
  const key = avatarKey(walletAddress);
  if (!key) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function persistAgentAvatar(walletAddress: string | undefined, url: string | null) {
  const key = avatarKey(walletAddress);
  if (!key) return;
  try {
    if (url) {
      localStorage.setItem(key, url);
    } else {
      localStorage.removeItem(key);
    }
  } catch {}
}

const DemoContext = createContext<DemoState | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { address: walletAddress } = useAccount();
  const walletRef = useRef(walletAddress);
  walletRef.current = walletAddress;

  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [spendPermissions, setSpendPermissions] = useState<SpendPermission[]>(INITIAL_SPEND_PERMISSIONS);
  const [stage, setStage] = useState<DemoState['stage']>('INITIAL');
  const [threads, setThreads] = useState<Thread[]>(SEED_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [privateReasoningEnabled, setPrivateReasoningEnabled] = useState(true);

  const [connectedAgent, setConnectedAgent] = useState<ConnectedAgent | null>(null);

  const [agentAvatarUrl, setAgentAvatarUrlState] = useState<string | null>(null);

  const walletKey = walletAddress?.toLowerCase() ?? '';

  useEffect(() => {
    const addr = walletRef.current;
    const agent = loadConnectedAgent(addr);
    const avatar = loadAgentAvatar(addr);
    setConnectedAgent(agent);
    setAgentAvatarUrlState(avatar);

    const persisted = loadPersistedState(addr);
    setFeed(persisted?.feed ?? INITIAL_FEED);
    setRules(persisted?.rules ?? INITIAL_RULES);
    setSpendPermissions(persisted?.spendPermissions ?? INITIAL_SPEND_PERMISSIONS);
    setStage(persisted?.stage ?? 'INITIAL');
    setThreads(persisted?.threads ?? SEED_THREADS);
    setActiveThreadId(null);
  }, [walletKey]);

  const setAgentAvatarUrl = useCallback((url: string | null) => {
    setAgentAvatarUrlState(url);
    persistAgentAvatar(walletRef.current, url);
  }, []);

  const connectAgent = useCallback((agent: ConnectedAgent) => {
    setConnectedAgent(agent);
    persistConnectedAgent(walletRef.current, agent);
  }, []);

  const updateAgentName = useCallback((name: string) => {
    setConnectedAgent(prev => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      persistConnectedAgent(walletRef.current, updated);
      return updated;
    });
  }, []);

  const disconnectAgent = useCallback(() => {
    setConnectedAgent(null);
    persistConnectedAgent(walletRef.current, null);
    setAgentAvatarUrlState(null);
    persistAgentAvatar(walletRef.current, null);
    setFeed(INITIAL_FEED);
    setRules(INITIAL_RULES);
    setSpendPermissions(INITIAL_SPEND_PERMISSIONS);
    setStage('INITIAL');
    setThreads(SEED_THREADS);
    setActiveThreadId(null);
    setPrivateReasoningEnabled(true);
  }, []);

  useEffect(() => {
    persistState(walletRef.current, feed, rules, spendPermissions, stage, threads);
  }, [feed, rules, spendPermissions, stage, threads]);

  const agentLabel = connectedAgent?.name ?? 'Your agent';

  useEffect(() => {
    if (stage !== 'INITIAL') return;
    const timer = setTimeout(() => {
      const pendingTx: FeedItem = {
        id: 'tx-1-pending',
        dateGroup: 'TODAY',
        merchant: 'DataStream Pro',
        merchantColor: 'bg-purple-600',
        merchantInitial: 'D',
        amount: 89.00,
        amountStr: '$89.00',
        intent: `${agentLabel} is requesting a recurring spend permission — $89 USDC/mo for real-time market data from DataStream Pro`,
        status: 'PENDING',
        statusMessage: 'Spend permission · needs approval',
        timestamp: 'Just now',
        category: 'Data Services'
      };
      setFeed(prev => [pendingTx, ...prev]);
      setStage('PENDING_ADDED');
    }, 3000);
    return () => clearTimeout(timer);
  }, [stage, agentLabel]);

  useEffect(() => {
    if (stage !== 'RULE_DISABLED') return;
    const timer = setTimeout(() => {
      const blockedTx: FeedItem = {
        id: 'tx-7-blocked',
        dateGroup: 'TODAY',
        merchant: 'DataStream Pro',
        merchantColor: 'bg-purple-600',
        merchantInitial: 'D',
        amount: 89.00,
        amountStr: '$89.00',
        intent: `${agentLabel} attempted first charge under DataStream Pro spend permission`,
        status: 'BLOCKED',
        statusMessage: 'Blocked — exceeds per-purchase cap',
        timestamp: 'Just now',
        category: 'Data Services'
      };
      setFeed(prev => [blockedTx, ...prev]);
      setStage('BLOCKED_ADDED');
    }, 2000);
    return () => clearTimeout(timer);
  }, [stage, agentLabel]);

  const approvePending = useCallback((
    id: string,
    realTxHash?: string,
    permissionStruct?: SpendPermission['permissionStruct'],
    onchainVerified?: boolean,
    delegationFields?: {
      permissionsContext: `0x${string}`;
      delegationManager: `0x${string}`;
      spendToken?: string;
    },
  ) => {
    const isDelegation = !!delegationFields;
    setFeed(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            status: 'APPROVED' as StatusType, 
            statusMessage: isDelegation
              ? 'Approved — delegation granted via MetaMask'
              : realTxHash
                ? 'Approved — spend permission granted onchain'
                : 'Approved — spend permission granted (demo)',
            txHash: realTxHash,
            isReal: !!realTxHash || isDelegation,
            onchainVerified: isDelegation ? true : onchainVerified,
            permissionsContext: delegationFields?.permissionsContext,
            delegationManager: delegationFields?.delegationManager,
            isDelegation,
            spendToken: delegationFields?.spendToken,
          } 
        : item
    ));
    setSpendPermissions(prev => [...prev, {
      id: 'sp-3',
      vendor: 'DataStream Pro',
      vendorInitial: 'D',
      vendorColor: 'bg-purple-600',
      amount: 89,
      cadence: 'monthly',
      state: 'active',
      ruledBy: 'r4',
      txHash: realTxHash,
      isReal: !!realTxHash || isDelegation,
      onchainVerified: isDelegation ? true : onchainVerified,
      permissionStruct,
      permissionsContext: delegationFields?.permissionsContext,
      delegationManager: delegationFields?.delegationManager,
      isDelegation,
      spendToken: delegationFields?.spendToken,
    }]);
    if (stage === 'PENDING_ADDED') setStage('APPROVED');
  }, [stage]);

  const recordDelegationSpend = useCallback((
    permissionId: string,
    txHash: string,
  ) => {
    const perm = spendPermissions.find(p => p.id === permissionId);
    if (!perm) return;

    const spendItem: FeedItem = {
      id: `spend-${Date.now()}`,
      dateGroup: 'TODAY',
      merchant: perm.vendor,
      merchantColor: perm.vendorColor,
      merchantInitial: perm.vendorInitial,
      amount: 5.00,
      amountStr: '$5.00',
      intent: `Redeemed delegated spend — ${perm.vendor}`,
      status: 'APPROVED',
      statusMessage: 'Delegated spend executed onchain',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      category: 'Delegated Spend',
      txHash,
      isReal: true,
      onchainVerified: true,
      isDelegation: true,
    };
    setFeed(prev => [spendItem, ...prev]);
  }, [spendPermissions]);

  const APPROVED_TOKEN_ADDRESSES = [
    '0x0000000000000000000000000000000000000000',
    '0x4200000000000000000000000000000000000006',
    '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  ];

  const checkSwapRules = useCallback((params: {
    tokenIn: string;
    tokenOut: string;
    amountUsd: number;
    slippage: number;
  }) => {
    const slippageRule = rules.find(r => r.id === 'r6');
    if (slippageRule?.enabled && params.slippage > 1) {
      return { allowed: false, reason: 'Slippage exceeds maximum of 1%' };
    }

    const capRule = rules.find(r => r.id === 'r7');
    if (capRule?.enabled && params.amountUsd > 50) {
      return { allowed: false, reason: 'Swap exceeds per-swap cap of $50' };
    }

    const tokenRule = rules.find(r => r.id === 'r8');
    if (tokenRule?.enabled) {
      const inApproved = APPROVED_TOKEN_ADDRESSES.some(a => a.toLowerCase() === params.tokenIn.toLowerCase());
      const outApproved = APPROVED_TOKEN_ADDRESSES.some(a => a.toLowerCase() === params.tokenOut.toLowerCase());
      if (!inApproved || !outApproved) {
        return { allowed: false, reason: 'Token not in approved list' };
      }
    }

    return { allowed: true };
  }, [rules]);

  const recordSwap = useCallback((params: {
    txHash: string;
    swapDetails: SwapDetails;
    isReal: boolean;
  }) => {
    const swapItem: FeedItem = {
      id: `swap-${Date.now()}`,
      dateGroup: 'TODAY',
      merchant: 'Uniswap',
      merchantColor: 'bg-pink-500',
      merchantInitial: 'U',
      amount: 0,
      amountStr: `${params.swapDetails.amountIn} ${params.swapDetails.tokenInSymbol}`,
      intent: `Swapped ${params.swapDetails.amountIn} ${params.swapDetails.tokenInSymbol} → ${params.swapDetails.amountOut} ${params.swapDetails.tokenOutSymbol}`,
      status: 'APPROVED',
      statusMessage: 'Swap executed onchain',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      category: 'Swap',
      txHash: params.txHash,
      isReal: params.isReal,
      onchainVerified: params.isReal,
      type: 'SWAP',
      swapDetails: params.swapDetails,
    };
    setFeed(prev => [swapItem, ...prev]);
  }, []);

  const recordBlockedSwap = useCallback((params: {
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amountIn: string;
    reason: string;
  }) => {
    const blockedItem: FeedItem = {
      id: `swap-blocked-${Date.now()}`,
      dateGroup: 'TODAY',
      merchant: 'Uniswap',
      merchantColor: 'bg-pink-500',
      merchantInitial: 'U',
      amount: 0,
      amountStr: `${params.amountIn} ${params.tokenInSymbol}`,
      intent: `Swap blocked: ${params.amountIn} ${params.tokenInSymbol} → ${params.tokenOutSymbol} — ${params.reason}`,
      status: 'BLOCKED',
      statusMessage: params.reason,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      category: 'Swap',
      type: 'SWAP',
    };
    setFeed(prev => [blockedItem, ...prev]);
  }, []);

  const recordAgentSwapAndPay = useCallback((params: {
    swapTxHash: string;
    paymentTxHash: string;
    swapDetails: SwapDetails;
    vendor: string;
    paymentAmountUsdc: number;
  }) => {
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const swapItem: FeedItem = {
      id: `agent-swap-${Date.now()}`,
      dateGroup: 'TODAY',
      merchant: 'Uniswap',
      merchantColor: 'bg-pink-500',
      merchantInitial: 'U',
      amount: 0,
      amountStr: `${params.swapDetails.amountIn} ${params.swapDetails.tokenInSymbol}`,
      intent: `Swapped ${params.swapDetails.amountIn} ${params.swapDetails.tokenInSymbol} → ${params.swapDetails.amountOut} ${params.swapDetails.tokenOutSymbol}`,
      status: 'AUTO_APPROVED',
      statusMessage: 'Agent auto-swap for vendor payment',
      timestamp: now,
      category: 'Swap',
      txHash: params.swapTxHash,
      isReal: true,
      onchainVerified: true,
      type: 'SWAP',
      swapDetails: params.swapDetails,
    };

    const paymentItem: FeedItem = {
      id: `agent-pay-${Date.now()}`,
      dateGroup: 'TODAY',
      merchant: params.vendor,
      merchantColor: 'bg-teal-500',
      merchantInitial: params.vendor.charAt(0).toUpperCase(),
      amount: params.paymentAmountUsdc,
      amountStr: `$${params.paymentAmountUsdc.toFixed(2)}`,
      intent: `Paid ${params.vendor} after swapping ${params.swapDetails.tokenInSymbol} → USDC`,
      status: 'AUTO_APPROVED',
      statusMessage: 'Autonomous payment after swap',
      timestamp: now,
      category: 'Payment',
      txHash: params.paymentTxHash,
      isReal: true,
      onchainVerified: true,
      type: 'PAYMENT',
    };

    setFeed(prev => [paymentItem, swapItem, ...prev]);
  }, []);

  const declinePending = useCallback((id: string) => {
    setFeed(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'DECLINED' as StatusType, statusMessage: 'Declined by you' } 
        : item
    ));
    if (stage === 'PENDING_ADDED') setStage('APPROVED');
  }, [stage]);

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    if (id === 'r4' && stage === 'APPROVED') {
      setStage('RULE_DISABLED');
    }
  }, [stage]);

  const addThread = useCallback((subject: string): Thread => {
    const thread: Thread = {
      id: `thread-${Date.now()}`,
      subject,
      createdAt: Date.now(),
      messages: [],
    };
    setThreads(prev => [thread, ...prev]);
    return thread;
  }, []);

  const addMessage = useCallback((threadId: string, role: 'user' | 'assistant', content: string) => {
    setThreads(prev => prev.map(t =>
      t.id === threadId
        ? { ...t, messages: [...t.messages, { id: `msg-${Date.now()}`, role, content, ts: Date.now(), read: role === 'user' }] }
        : t
    ));
  }, []);

  const markThreadRead = useCallback((threadId: string) => {
    setThreads(prev => prev.map(t =>
      t.id === threadId
        ? { ...t, messages: t.messages.map(m => m.role === 'assistant' && !m.read ? { ...m, read: true } : m) }
        : t
    ));
  }, []);

  const linkThreadToTx = useCallback((threadId: string, txHash: string) => {
    setThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, txHash } : t
    ));
  }, []);

  const deleteThread = useCallback((threadId: string) => {
    setThreads(prev => prev.filter(t => t.id !== threadId));
  }, []);

  const resetDemo = useCallback(() => {
    const key = stateKey(walletRef.current);
    if (key) { try { localStorage.removeItem(key); } catch {} }
    setFeed(INITIAL_FEED);
    setRules(INITIAL_RULES);
    setSpendPermissions(INITIAL_SPEND_PERMISSIONS);
    setStage('INITIAL');
    setThreads(SEED_THREADS);
    setPrivateReasoningEnabled(true);
  }, []);

  return (
    <DemoContext.Provider value={{
      feed,
      rules,
      spendPermissions,
      stage,
      threads,
      activeThreadId,
      connectedAgent,
      connectAgent,
      updateAgentName,
      privateReasoningEnabled,
      setPrivateReasoningEnabled,
      agentAvatarUrl,
      setAgentAvatarUrl,
      disconnectAgent,
      setActiveThreadId,
      addThread,
      addMessage,
      markThreadRead,
      linkThreadToTx,
      deleteThread,
      approvePending,
      recordDelegationSpend,
      recordSwap,
      recordBlockedSwap,
      recordAgentSwapAndPay,
      checkSwapRules,
      declinePending,
      toggleRule,
      resetDemo,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
}

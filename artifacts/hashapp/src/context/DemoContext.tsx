import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  permissionsContext?: `0x${string}`;
  delegationManager?: `0x${string}`;
  isDelegation?: boolean;
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
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface DemoState {
  feed: FeedItem[];
  rules: Rule[];
  spendPermissions: SpendPermission[];
  stage: 'INITIAL' | 'PENDING_ADDED' | 'APPROVED' | 'RULE_DISABLED' | 'BLOCKED_ADDED';
  agentAvatarUrl: string | null;
  setAgentAvatarUrl: (url: string | null) => void;
  approvePending: (
    id: string,
    realTxHash?: string,
    permissionStruct?: SpendPermission['permissionStruct'],
    onchainVerified?: boolean,
    delegationFields?: {
      permissionsContext: `0x${string}`;
      delegationManager: `0x${string}`;
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
  recordScoutSwapAndPay: (params: {
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
    intent: "Scout bought research credits for today's market scan",
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
    intent: "Scout tried to purchase enterprise analytics suite",
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
    intent: "Scout renewed API credits for report generation",
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
    intent: "Scout purchased market intelligence data",
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
    intent: "Scout bought industry report access",
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
  { id: 'r4', name: 'Block spend permissions', description: 'Prevent Scout from creating recurring spend permissions', enabled: true },
  { id: 'r5', name: 'New vendor approval', description: 'Require your approval before paying a new vendor', enabled: true },
  { id: 'r6', name: 'Max slippage: 1%', description: 'Block swaps with slippage tolerance above 1%', enabled: true },
  { id: 'r7', name: 'Per-swap cap: 50 USDC', description: 'Block any single swap above $50 USDC equivalent', enabled: true },
  { id: 'r8', name: 'Approved tokens only', description: 'Only allow swaps between ETH, WETH, and USDC', enabled: true },
];

const STORAGE_KEY = 'hashapp_demo_state';
const AVATAR_STORAGE_KEY = 'hashapp_agent_avatar';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 5) return parsed;
    }
  } catch {}
  return null;
}

function persistState(feed: FeedItem[], rules: Rule[], spendPermissions: SpendPermission[], stage: DemoState['stage']) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 5,
      feed,
      rules,
      spendPermissions,
      stage,
    }));
  } catch {}
}

const DemoContext = createContext<DemoState | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const persisted = loadPersistedState();
  const [feed, setFeed] = useState<FeedItem[]>(persisted?.feed ?? INITIAL_FEED);
  const [rules, setRules] = useState<Rule[]>(persisted?.rules ?? INITIAL_RULES);
  const [spendPermissions, setSpendPermissions] = useState<SpendPermission[]>(persisted?.spendPermissions ?? INITIAL_SPEND_PERMISSIONS);
  const [stage, setStage] = useState<DemoState['stage']>(persisted?.stage ?? 'INITIAL');

  const [agentAvatarUrl, setAgentAvatarUrlState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AVATAR_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setAgentAvatarUrl = useCallback((url: string | null) => {
    setAgentAvatarUrlState(url);
    try {
      if (url) {
        localStorage.setItem(AVATAR_STORAGE_KEY, url);
      } else {
        localStorage.removeItem(AVATAR_STORAGE_KEY);
      }
    } catch {}
  }, []);

  useEffect(() => {
    persistState(feed, rules, spendPermissions, stage);
  }, [feed, rules, spendPermissions, stage]);

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
        intent: "Scout is requesting a recurring spend permission — $89 USDC/mo for real-time market data from DataStream Pro",
        status: 'PENDING',
        statusMessage: 'Spend permission · needs approval',
        timestamp: 'Just now',
        category: 'Data Services'
      };
      setFeed(prev => [pendingTx, ...prev]);
      setStage('PENDING_ADDED');
    }, 3000);
    return () => clearTimeout(timer);
  }, [stage]);

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
        intent: "Scout attempted first charge under DataStream Pro spend permission",
        status: 'BLOCKED',
        statusMessage: 'Blocked — exceeds per-purchase cap',
        timestamp: 'Just now',
        category: 'Data Services'
      };
      setFeed(prev => [blockedTx, ...prev]);
      setStage('BLOCKED_ADDED');
    }, 2000);
    return () => clearTimeout(timer);
  }, [stage]);

  const approvePending = useCallback((
    id: string,
    realTxHash?: string,
    permissionStruct?: SpendPermission['permissionStruct'],
    onchainVerified?: boolean,
    delegationFields?: {
      permissionsContext: `0x${string}`;
      delegationManager: `0x${string}`;
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
      intent: `Scout redeemed delegated spend — ${perm.vendor}`,
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

  const recordScoutSwapAndPay = useCallback((params: {
    swapTxHash: string;
    paymentTxHash: string;
    swapDetails: SwapDetails;
    vendor: string;
    paymentAmountUsdc: number;
  }) => {
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const swapItem: FeedItem = {
      id: `scout-swap-${Date.now()}`,
      dateGroup: 'TODAY',
      merchant: 'Uniswap',
      merchantColor: 'bg-pink-500',
      merchantInitial: 'U',
      amount: 0,
      amountStr: `${params.swapDetails.amountIn} ${params.swapDetails.tokenInSymbol}`,
      intent: `Scout swapped ${params.swapDetails.amountIn} ${params.swapDetails.tokenInSymbol} → ${params.swapDetails.amountOut} ${params.swapDetails.tokenOutSymbol}`,
      status: 'AUTO_APPROVED',
      statusMessage: 'Scout auto-swap for vendor payment',
      timestamp: now,
      category: 'Swap',
      txHash: params.swapTxHash,
      isReal: true,
      onchainVerified: true,
      type: 'SWAP',
      swapDetails: params.swapDetails,
    };

    const paymentItem: FeedItem = {
      id: `scout-pay-${Date.now()}`,
      dateGroup: 'TODAY',
      merchant: params.vendor,
      merchantColor: 'bg-teal-500',
      merchantInitial: params.vendor.charAt(0).toUpperCase(),
      amount: params.paymentAmountUsdc,
      amountStr: `$${params.paymentAmountUsdc.toFixed(2)}`,
      intent: `Scout paid ${params.vendor} after swapping ${params.swapDetails.tokenInSymbol} → USDC`,
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

  const resetDemo = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setFeed(INITIAL_FEED);
    setRules(INITIAL_RULES);
    setSpendPermissions(INITIAL_SPEND_PERMISSIONS);
    setStage('INITIAL');
  }, []);

  return (
    <DemoContext.Provider value={{ feed, rules, spendPermissions, stage, agentAvatarUrl, setAgentAvatarUrl, approvePending, recordDelegationSpend, recordSwap, recordBlockedSwap, recordScoutSwapAndPay, checkSwapRules, declinePending, toggleRule, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
}

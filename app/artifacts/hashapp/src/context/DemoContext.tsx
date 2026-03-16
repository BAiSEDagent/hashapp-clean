import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type StatusType = 'APPROVED' | 'AUTO_APPROVED' | 'PENDING' | 'BLOCKED' | 'DECLINED';

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
  ) => void;
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
];

const STORAGE_KEY = 'hashapp_demo_state';
const AVATAR_STORAGE_KEY = 'hashapp_agent_avatar';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 3) return parsed;
    }
  } catch {}
  return null;
}

function persistState(feed: FeedItem[], rules: Rule[], spendPermissions: SpendPermission[], stage: DemoState['stage']) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 3,
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
  ) => {
    setFeed(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            status: 'APPROVED' as StatusType, 
            statusMessage: realTxHash ? 'Approved — spend permission granted onchain' : 'Approved — spend permission granted (demo)',
            txHash: realTxHash,
            isReal: !!realTxHash,
            onchainVerified,
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
      isReal: !!realTxHash,
      onchainVerified,
      permissionStruct,
    }]);
    if (stage === 'PENDING_ADDED') setStage('APPROVED');
  }, [stage]);

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
    <DemoContext.Provider value={{ feed, rules, spendPermissions, stage, agentAvatarUrl, setAgentAvatarUrl, approvePending, declinePending, toggleRule, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
}

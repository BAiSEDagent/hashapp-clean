import React, { createContext, useContext, useState, useEffect } from 'react';

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
  approvePending: (id: string) => void;
  declinePending: (id: string) => void;
  toggleRule: (id: string) => void;
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
    txHash: '0x8f2a1c4d9e7b3f6a0d5c8e2b4a7f1d9c3e6b8a0f2d5c7e9b1a4d6f8c0e3a5c912'
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
    txHash: '0x4a2f7b1e9c3d5a8f0e2b6c4d7a9f1e3c5b8d0a2f4e6c8b1d3a5f7e9c0b2d4e91b'
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
    txHash: '0x1b9c3e5a7d0f2c4b6e8a1d3f5c7b9e0a2d4f6c8b1e3a5d7f9c0b2e4a6d8f44a'
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
    txHash: '0x99dd4e7a1b3c5f8d0e2a6b9c1d4f7e3a5b8c0d2e6a9f1b3c5d8e0a2f4b7c2a11'
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

const DemoContext = createContext<DemoState | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [spendPermissions, setSpendPermissions] = useState<SpendPermission[]>(INITIAL_SPEND_PERMISSIONS);
  const [stage, setStage] = useState<DemoState['stage']>('INITIAL');

  useEffect(() => {
    if (stage === 'INITIAL') {
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
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'RULE_DISABLED') {
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
    }
  }, [stage]);

  const approvePending = (id: string) => {
    setFeed(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            status: 'APPROVED' as StatusType, 
            statusMessage: 'Approved — spend permission granted',
            txHash: '0x3c71a8e2f4b6d9c0e1a3f5d7b9c2e4a6f8d0b1c3e5a7f9d2b4c6e8a0f1d3b5d88f'
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
    }]);
    if (stage === 'PENDING_ADDED') setStage('APPROVED');
  };

  const declinePending = (id: string) => {
    setFeed(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'DECLINED' as StatusType, statusMessage: 'Declined by you' } 
        : item
    ));
    if (stage === 'PENDING_ADDED') setStage('APPROVED');
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    if (id === 'r4' && stage === 'APPROVED') {
      setStage('RULE_DISABLED');
    }
  };

  return (
    <DemoContext.Provider value={{ feed, rules, spendPermissions, stage, approvePending, declinePending, toggleRule }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
}

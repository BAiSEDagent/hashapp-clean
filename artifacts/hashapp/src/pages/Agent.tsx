import React, { useState, useCallback } from 'react';
import { Shield, ArrowRight, CheckCircle2, Zap, RefreshCw, ArrowLeftRight, X, Bot, Pencil, Unplug } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { useDemo } from '@/context/DemoContext';
import type { ConnectedAgent } from '@/context/DemoContext';
import { useLocation } from 'wouter';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TruthBadge } from '@/components/TruthBadge';
import { AccountSheet } from '@/components/AccountSheet';
import { USE_METAMASK_DELEGATION } from '@/config/delegation';
import {
  SPEND_PERMISSION_MANAGER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ABI,
} from '@/config/spendPermission';

export default function Agent() {
  const { connectedAgent, forgetAgent } = useDemo();
  const [showConnectSheet, setShowConnectSheet] = useState(false);
  const [editMode, setEditMode] = useState(false);

  if (!connectedAgent) {
    return (
      <>
        <AgentEmptyState onConnect={() => { setEditMode(false); setShowConnectSheet(true); }} />
        {showConnectSheet && (
          <ConnectAgentSheet
            onClose={() => setShowConnectSheet(false)}
            initialValues={null}
          />
        )}
      </>
    );
  }

  return (
    <>
      <AgentActiveState
        onEdit={() => { setEditMode(true); setShowConnectSheet(true); }}
        onDisconnect={forgetAgent}
      />
      {showConnectSheet && (
        <ConnectAgentSheet
          onClose={() => setShowConnectSheet(false)}
          initialValues={editMode ? connectedAgent : null}
        />
      )}
    </>
  );
}

function AgentEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="min-h-full flex flex-col px-6 pt-12 pb-8">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[330px] flex flex-col items-center text-center -translate-y-6">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
            <Bot size={30} className="text-zinc-500" />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight mb-2">No Agent Set Up</h1>
          <p className="text-[14px] text-muted-foreground/45 leading-relaxed mb-8 max-w-[300px]">
            Name your agent so it can request payments and act within your spending rules.
          </p>
          <button
            onClick={onConnect}
            className="w-full max-w-[320px] py-3.5 rounded-2xl text-[15px] font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-lg shadow-primary/20"
          >
            Set Up Agent
          </button>
        </div>
      </div>

      <div className="text-center pb-2">
        <p className="text-[10px] text-muted-foreground/18 font-medium tracking-widest uppercase">
          Bring your own agent
        </p>
      </div>
    </div>
  );
}

function ConnectAgentSheet({
  onClose,
  initialValues,
}: {
  onClose: () => void;
  initialValues: ConnectedAgent | null;
}) {
  const { connectAgent, editAgent } = useDemo();
  const [name, setName] = useState(initialValues?.name ?? '');
  const [role, setRole] = useState(initialValues?.role ?? '');
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [errors, setErrors] = useState<{ name?: string; role?: string }>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Give your agent a name so you can identify it';
    if (!role.trim()) newErrors.role = 'Describe what this agent does';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setHasSubmitted(true);
    if (!validate()) return;
    const agent: ConnectedAgent = {
      name: name.trim(),
      role: role.trim(),
      address: address.trim(),
    };
    if (initialValues) {
      editAgent(agent);
    } else {
      connectAgent(agent);
    }
    onClose();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (hasSubmitted && val.trim()) setErrors(prev => ({ ...prev, name: undefined }));
  };

  const handleRoleChange = (val: string) => {
    setRole(val);
    if (hasSubmitted && val.trim()) setErrors(prev => ({ ...prev, role: undefined }));
  };

  const isEdit = !!initialValues;
  const hasContent = name.trim() || role.trim() || address.trim();

  const handleBackdropClick = () => {
    if (hasContent && !isEdit) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleBackdropClick} />
      <div className="relative w-full max-w-[430px] bg-card border-t border-border/40 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
        <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-5" />

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[18px] font-bold tracking-tight">
            {isEdit ? 'Edit Agent' : 'Set up your agent'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>
        {!isEdit && (
          <p className="text-[12px] text-muted-foreground/40 mb-5">
            Takes about 10 seconds. You can change these anytime.
          </p>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="agent-name" className="text-[12px] text-muted-foreground/60 font-medium mb-1.5 block">
              Agent name
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Research Bot"
              autoFocus={!isEdit}
              enterKeyHint="next"
              className={`w-full px-4 py-3 rounded-xl bg-zinc-800/60 border text-[14px] text-foreground placeholder:text-zinc-600 focus:outline-none transition-colors ${errors.name ? 'border-rose-500/50 focus:border-rose-500/70' : 'border-zinc-700/40 focus:border-primary/50'}`}
            />
            {errors.name && <p className="text-[11px] text-rose-400/80 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="agent-role" className="text-[12px] text-muted-foreground/60 font-medium mb-1.5 block">
              What does it do?
            </label>
            <input
              id="agent-role"
              type="text"
              value={role}
              onChange={e => handleRoleChange(e.target.value)}
              placeholder="e.g. Research agent · reads markets"
              enterKeyHint="next"
              className={`w-full px-4 py-3 rounded-xl bg-zinc-800/60 border text-[14px] text-foreground placeholder:text-zinc-600 focus:outline-none transition-colors ${errors.role ? 'border-rose-500/50 focus:border-rose-500/70' : 'border-zinc-700/40 focus:border-primary/50'}`}
            />
            {errors.role && <p className="text-[11px] text-rose-400/80 mt-1.5">{errors.role}</p>}
          </div>

          <div>
            <label htmlFor="agent-address" className="text-[12px] text-muted-foreground/60 font-medium mb-1.5 block">
              Execution address or ENS
              <span className="text-muted-foreground/30 ml-1.5">· optional</span>
            </label>
            <input
              id="agent-address"
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="0x... or name.eth"
              enterKeyHint="done"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700/40 text-[14px] text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors font-mono text-[13px]"
            />
            <p className="text-[10px] text-muted-foreground/25 mt-1">The wallet address your agent uses to execute transactions.</p>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] mt-1"
          >
            {isEdit ? 'Save Changes' : 'Set Up Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentActiveState({
  onEdit,
  onDisconnect,
}: {
  onEdit: () => void;
  onDisconnect: () => void;
}) {
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const { rules, feed, spendPermissions, connectedAgent, recordScoutSwapAndPay } = useDemo();
  const { address, isConnected } = useAccount();
  const [, setLocation] = useLocation();
  const [autoPayState, setAutoPayState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [autoPayError, setAutoPayError] = useState<string | null>(null);
  const activeRulesCount = rules.filter(r => r.enabled).length;
  const approvedCount = feed.filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED').length;
  const blockedCount = feed.filter(i => i.status === 'BLOCKED').length;
  const activePermissions = spendPermissions.filter(p => p.state === 'active');

  const agentName = connectedAgent?.name ?? 'Agent';
  const agentRole = connectedAgent?.role ?? '';
  const agentAddress = connectedAgent?.address ?? '';
  const agentAddressShort = agentAddress.length > 10
    ? `${agentAddress.slice(0, 6)}...${agentAddress.slice(-4)}`
    : agentAddress;
  const isEns = agentAddress.includes('.eth');

  const totalSpent = feed
    .filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalBudget = activePermissions.reduce((sum, p) => sum + p.amount, 0);

  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : null;

  const handleAutoPay = useCallback(async () => {
    setAutoPayState('running');
    setAutoPayError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const agentToken = import.meta.env.VITE_AGENT_API_TOKEN || import.meta.env.VITE_SCOUT_API_TOKEN || '';
      const res = await fetch(`${API_BASE}/swap/scout-swap-and-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(agentToken ? { 'Authorization': `Bearer ${agentToken}` } : {}),
        },
        body: JSON.stringify({
          tokenIn: '0x0000000000000000000000000000000000000000',
          tokenOut: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          amount: '10000000000000000',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD10',
          paymentAmountUsdc: '10',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Auto-pay failed' }));
        throw new Error(body.error || `Failed (${res.status})`);
      }

      const data = await res.json();
      recordScoutSwapAndPay({
        swapTxHash: data.swapTxHash,
        paymentTxHash: data.paymentTxHash,
        swapDetails: {
          tokenIn: '0x0000000000000000000000000000000000000000',
          tokenOut: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          tokenInSymbol: 'ETH',
          tokenOutSymbol: 'USDC',
          amountIn: '0.01',
          amountOut: data.outputAmount ? (Number(data.outputAmount) / 1e6).toFixed(2) : '~10',
          exchangeRate: '',
          gasCostUSD: data.gasFeeUSD || '0',
          priceImpact: 0,
        },
        vendor: 'Perplexity',
        paymentAmountUsdc: 10,
      });
      setAutoPayState('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Auto-pay failed';
      setAutoPayError(msg);
      setAutoPayState('error');
    }
  }, [recordScoutSwapAndPay]);

  return (
    <div className="flex flex-col min-h-full pb-8">
      <div className="px-6 pt-14 pb-8 flex flex-col items-center text-center">
        <div className="relative mb-5">
          <AgentAvatar size="xl" editable />
          <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
            <div className="w-5 h-5 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
        
        <h1 className="text-[26px] font-bold tracking-tight mb-1">{agentName}</h1>
        <p className="text-[12px] text-muted-foreground/50 mb-1">{agentRole}</p>
        {agentAddress && (
          <>
            <p className="text-[10px] text-muted-foreground/30 font-mono tracking-wide mb-1">{agentAddressShort}</p>
            {isEns && (
              <p className="text-[9px] text-muted-foreground/20 font-mono tracking-wide mb-1">{agentAddress}</p>
            )}
          </>
        )}

        <div className="flex items-center gap-3 mt-3 mb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/10 text-[10px] font-medium text-emerald-400/80">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            <Pencil size={12} />
            Edit Agent
          </button>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 text-[11px] text-rose-400/50 hover:text-rose-400/80 transition-colors"
          >
            <Unplug size={12} />
            Remove Agent
          </button>
        </div>
      </div>

      <div className="px-6 flex flex-col gap-3.5">
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard value={approvedCount} label="Approved" color="text-emerald-400" />
          <StatCard value={blockedCount} label="Blocked" color="text-rose-400" />
          <StatCard value={activeRulesCount} label="Rules" color="text-primary" />
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/30">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-muted-foreground/40" />
            <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Operating State</span>
          </div>
          <div className="space-y-3">
            <StateRow label="Status" value="Active" valueColor="text-emerald-400" />
            {agentAddress && <StateRow label="Spender address" value={agentAddressShort} mono />}
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[12px] text-muted-foreground/40">Spending from</span>
              {isConnected && truncatedAddress ? (
                <button onClick={() => setShowAccountSheet(true)} className="text-[12px] font-mono text-foreground/70 hover:text-foreground/90 underline decoration-muted-foreground/20 underline-offset-2 transition-colors">
                  {truncatedAddress}
                </button>
              ) : (
                <span className="text-[12px] text-muted-foreground/40">No wallet connected</span>
              )}
            </div>
            {showAccountSheet && <AccountSheet onClose={() => setShowAccountSheet(false)} />}
            <StateRow label="Settlement" value="USDC on Base" />
            <StateRow
              label="Authority model"
              value={USE_METAMASK_DELEGATION ? 'MetaMask Delegation (ERC-7710)' : 'SpendPermissionManager'}
            />
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[12px] text-muted-foreground/40">Spent today</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-foreground/90">${totalSpent.toFixed(2)}</span>
                <TruthBadge type="demo" />
              </div>
            </div>
            <StateRow label="Budget" value={`$${totalBudget}/day across ${activePermissions.length} permissions`} />
            <StateRow label="Constraints" value={`${activeRulesCount} active rules`} />
          </div>
        </div>

        {activePermissions.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border/30">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw size={14} className="text-muted-foreground/40" />
              <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Spend Permissions</span>
              <span className="ml-auto text-[10px] text-muted-foreground/30 tabular-nums">{activePermissions.length} active</span>
            </div>
            <div className="space-y-3">
              {activePermissions.map(perm => (
                <AgentPermissionRow key={perm.id} perm={perm} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl p-5 border border-border/30">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight size={14} className="text-muted-foreground/40" />
            <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{agentName} Auto-Pay</span>
          </div>
          <p className="text-[11px] text-muted-foreground/40 mb-4">
            {agentName} can autonomously swap ETH → USDC via Uniswap then pay vendors. This triggers a real onchain swap + USDC transfer on Base Sepolia.
          </p>
          <button
            onClick={handleAutoPay}
            disabled={autoPayState === 'running'}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-colors bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {autoPayState === 'running' ? 'Swapping & Paying...' : autoPayState === 'done' ? 'Done — Check Activity' : `Trigger ${agentName} Swap → Pay`}
          </button>
          {autoPayError && (
            <p className="mt-2 text-[10px] text-rose-400/80">{autoPayError}</p>
          )}
          {autoPayState === 'done' && (
            <p className="mt-2 text-[10px] text-emerald-400/80">SWAP + PAYMENT recorded in Activity feed with real tx hashes.</p>
          )}
        </div>

        <div 
          onClick={() => setLocation('/rules')}
          className="bg-card rounded-2xl p-4 border border-border/30 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center">
              <Shield size={16} className="text-primary/80" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Active Constraints</h3>
              <p className="text-[10px] text-muted-foreground/40">{activeRulesCount} rules protecting your wallet</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground/20" />
        </div>
      </div>

      <div className="mt-auto pt-10 text-center pb-4">
        <p className="text-[10px] text-muted-foreground/20 font-medium tracking-widest uppercase">
          Bring your own agent
        </p>
      </div>
    </div>
  );
}

function AgentPermissionRow({ perm }: { perm: import('@/context/DemoContext').SpendPermission }) {
  const cadenceLabel = { daily: '/day', weekly: '/wk', monthly: '/mo' };
  const permStruct = perm.permissionStruct;
  const isDelegation = USE_METAMASK_DELEGATION && perm.isDelegation;

  const { data: isApprovedOnchain } = useReadContract({
    address: SPEND_PERMISSION_MANAGER_ADDRESS,
    abi: SPEND_PERMISSION_MANAGER_ABI,
    functionName: 'isApproved',
    args: permStruct ? [{
      account: permStruct.account,
      spender: permStruct.spender,
      token: permStruct.token,
      allowance: BigInt(permStruct.allowance),
      period: permStruct.period,
      start: permStruct.start,
      end: permStruct.end,
      salt: BigInt(permStruct.salt),
      extraData: permStruct.extraData,
    }] : undefined,
    chainId: 84532,
    query: { enabled: !isDelegation && !!permStruct && !!perm.isReal },
  });

  let badgeType: 'onchain' | 'demo' | 'pending';
  if (isDelegation && perm.permissionsContext) {
    badgeType = 'onchain';
  } else if (perm.isReal && perm.txHash) {
    const verified = isApprovedOnchain ?? perm.onchainVerified;
    badgeType = verified ? 'onchain' : 'pending';
  } else {
    badgeType = 'demo';
  }

  return (
    <div className="flex items-center gap-3">
      <AgentAvatar size="sm" />
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground">{perm.vendor}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <TruthBadge type={badgeType} txHash={perm.txHash} />
          {isDelegation && (
            <span className="text-[8px] text-orange-400/60 font-medium uppercase tracking-wider">delegation</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[13px] font-semibold tabular-nums">${perm.amount}{cadenceLabel[perm.cadence]}</span>
        <div className={`w-[5px] h-[5px] rounded-full ${perm.state === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-card rounded-xl p-3.5 border border-border/20 text-center">
      <p className={`text-[20px] font-bold tracking-tight ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground/35 font-medium uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
}

function StateRow({
  label,
  value,
  valueColor,
  mono,
}: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[12px] text-muted-foreground/40">{label}</span>
      <span
        className={`text-[12px] font-medium text-right max-w-[55%] truncate ${valueColor ?? 'text-foreground/90'} ${mono ? 'font-mono tracking-wide' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

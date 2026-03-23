import React, { useState, useCallback } from 'react';
import { Shield, ArrowRight, CheckCircle2, Zap, RefreshCw, ArrowLeftRight, Pencil, Unplug, X, Check, ChevronDown } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { useDemo } from '@/context/DemoContext';
import { useLocation } from 'wouter';
import { AgentAvatar } from '@/components/AgentAvatar';
import { GatewayChat } from '@/components/GatewayChat';
import { TruthBadge } from '@/components/TruthBadge';
import { USE_METAMASK_DELEGATION, AGENT_SESSION_ADDRESS } from '@/config/delegation';
import {
  AGENT_SPENDER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ABI,
} from '@/config/spendPermission';

const agentAddress = USE_METAMASK_DELEGATION ? AGENT_SESSION_ADDRESS : AGENT_SPENDER_ADDRESS;
const AGENT_ADDRESS_SHORT = `${agentAddress.slice(0, 6)}...${agentAddress.slice(-4)}`;

export default function Agent() {
  const { rules, feed, spendPermissions, recordAgentSwapAndPay, connectedAgent, connectAgent, updateAgentName, disconnectAgent } = useDemo();
  const { address, isConnected } = useAccount();
  const [, setLocation] = useLocation();
  const [autoPayState, setAutoPayState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [autoPayError, setAutoPayError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const activeRulesCount = rules.filter((r) => r.enabled).length;
  const approvedCount = feed.filter((i) => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED').length;
  const blockedCount = feed.filter((i) => i.status === 'BLOCKED').length;
  const activePermissions = spendPermissions.filter((p) => p.state === 'active');

  const totalSpent = feed
    .filter((i) => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalBudget = activePermissions.reduce((sum, p) => sum + p.amount, 0);

  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : null;
  const agentDisplayName = connectedAgent?.name ?? 'Agent';

  if (!connectedAgent) {
    return <AgentOnboarding onConnect={connectAgent} />;
  }

  const handleStartEdit = () => {
    setEditNameValue(connectedAgent.name);
    setIsEditingName(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== connectedAgent.name) {
      updateAgentName(trimmed);
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
  };

  const handleAutoPay = async () => {
    if (!address) {
      setAutoPayError('Connect wallet first');
      setAutoPayState('error');
      return;
    }
    setAutoPayState('running');
    setAutoPayError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const agentToken = import.meta.env.VITE_AGENT_API_TOKEN || import.meta.env.VITE_SCOUT_API_TOKEN || '';
      const res = await fetch(`${API_BASE}/swap/agent-swap-and-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(agentToken ? { 'Authorization': `Bearer ${agentToken}` } : {}),
        },
        body: JSON.stringify({
          tokenIn: '0x0000000000000000000000000000000000000000',
          tokenOut: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          amount: '10000000000000000',
          recipient: address,
          paymentAmountUsdc: '10',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Auto-pay failed' }));
        throw new Error(body.error || `Failed (${res.status})`);
      }

      const data = await res.json();
      recordAgentSwapAndPay({
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
  };

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
        
        <h1 className="text-[26px] font-bold tracking-tight mb-1">{agentDisplayName}</h1>
        <p className="text-[12px] text-muted-foreground/50 mb-1">Connected agent</p>
        <p className="text-[10px] text-muted-foreground/30 font-mono tracking-wide mb-4">{AGENT_ADDRESS_SHORT}</p>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/10 text-[10px] font-medium text-emerald-400/80">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
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
            <StateRow label="Spender address" value={AGENT_ADDRESS_SHORT} mono />
            <StateRow 
              label="Spending from" 
              value={isConnected && truncatedAddress ? truncatedAddress : 'No wallet connected'} 
              valueColor={isConnected ? undefined : 'text-muted-foreground/40'}
            />
            <StateRow label="Settlement" value="USDC on Base" />
            <StateRow
              label="Authority model"
              value={USE_METAMASK_DELEGATION ? 'MetaMask Delegation (ERC-7710)' : 'SpendPermissionManager'}
            />
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[12px] text-muted-foreground/40">Spent this month</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-foreground/90">${totalSpent.toFixed(2)}</span>
                <TruthBadge type="demo" />
              </div>
            </div>
            <StateRow label="Budget" value={`$${totalBudget}/mo across ${activePermissions.length} permissions`} />
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

        <GatewayChat />

        <div className="bg-card rounded-2xl p-5 border border-border/30">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight size={14} className="text-muted-foreground/40" />
            <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Agent Auto-Pay</span>
          </div>
          <p className="text-[11px] text-muted-foreground/40 mb-4">
            {agentDisplayName} can autonomously swap ETH → USDC via Uniswap then pay vendors. This triggers a real onchain swap + USDC transfer on Base Sepolia.
          </p>
          <button
            onClick={handleAutoPay}
            disabled={autoPayState === 'running'}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-colors bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {autoPayState === 'running' ? 'Swapping & Paying...' : autoPayState === 'done' ? 'Done — Check Activity ✓' : 'Trigger Agent Swap → Pay'}
          </button>
          {autoPayError && (
            <p className="mt-2 text-[10px] text-rose-400/80">{autoPayError}</p>
          )}
          {autoPayState === 'done' && (
            <p className="mt-2 text-[10px] text-emerald-400/80">SWAP + PAYMENT recorded in Activity feed with real tx hashes.</p>
          )}
        </div>

        <EditAgentAccordion
          agentName={agentDisplayName}
          isEditingName={isEditingName}
          editNameValue={editNameValue}
          setEditNameValue={setEditNameValue}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onRemoveAgent={disconnectAgent}
        />

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
          {USE_METAMASK_DELEGATION ? 'ERC-7710 · ERC-7715 · ' : 'ERC-8004 · '}Base Sepolia
        </p>
      </div>
    </div>
  );
}

function AgentOnboarding({ onConnect }: { onConnect: (agent: { name: string }) => void }) {
  const [name, setName] = useState('');

  const handleConnect = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConnect({ name: trimmed });
  };

  return (
    <div className="flex flex-col min-h-full items-center justify-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-6">
        <span className="text-[28px] font-bold text-primary tracking-tighter">#</span>
      </div>
      <h1 className="text-[24px] font-bold tracking-tight mb-2">Connect your agent</h1>
      <p className="text-[13px] text-muted-foreground/60 text-center mb-8 max-w-[280px] leading-relaxed">
        Give your agent a name to get started. You can change this later.
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
        placeholder="Agent name"
        className="w-full max-w-[300px] bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-colors mb-4 text-center"
        maxLength={32}
      />
      <button
        onClick={handleConnect}
        disabled={!name.trim()}
        className="w-full max-w-[300px] py-3 rounded-xl text-[15px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Connect Agent
      </button>
    </div>
  );
}

function EditAgentAccordion({
  agentName,
  isEditingName,
  editNameValue,
  setEditNameValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemoveAgent,
}: {
  agentName: string;
  isEditingName: boolean;
  editNameValue: string;
  setEditNameValue: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemoveAgent: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center">
            <Pencil size={16} className="text-primary/80" />
          </div>
          <div className="text-left">
            <h3 className="text-[13px] font-semibold text-foreground">Edit Agent</h3>
            <p className="text-[10px] text-muted-foreground/40">Change your agent's display name</p>
          </div>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground/30 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
                className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary/40 transition-colors"
                maxLength={32}
                placeholder="Agent name"
              />
              <button onClick={onSaveEdit} className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors">
                <Check size={14} className="text-emerald-400" />
              </button>
              <button onClick={onCancelEdit} className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
                <X size={14} className="text-muted-foreground/60" />
              </button>
            </div>
          ) : (
            <button
              onClick={onStartEdit}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Pencil size={12} className="text-muted-foreground/40" />
                <span className="text-[12px] text-muted-foreground/60">Current name:</span>
                <span className="text-[12px] font-medium text-foreground">{agentName}</span>
              </div>
              <ArrowRight size={12} className="text-muted-foreground/20" />
            </button>
          )}

          <button
            onClick={onRemoveAgent}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-500/[0.06] hover:bg-rose-500/[0.12] border border-rose-500/[0.08] transition-colors"
          >
            <Unplug size={13} className="text-rose-400/80" />
            <span className="text-[12px] font-medium text-rose-400/80">Remove Agent</span>
          </button>
        </div>
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
    <div className="bg-card rounded-2xl p-4 border border-border/30 text-center">
      <p className={`text-[22px] font-bold tracking-tight ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground/30 mt-1 font-medium uppercase tracking-[0.15em]">{label}</p>
    </div>
  );
}

function StateRow({ label, value, valueColor, mono }: { label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[12px] text-muted-foreground/40">{label}</span>
      <span className={`text-[12px] font-medium ${mono ? 'font-mono text-muted-foreground/60 tracking-wide' : valueColor || 'text-foreground/90'}`}>{value}</span>
    </div>
  );
}

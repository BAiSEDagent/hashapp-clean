import React, { useState, useCallback } from 'react';
import { Shield, ArrowRight, CheckCircle2, Zap, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { useDemo } from '@/context/DemoContext';
import { useLocation } from 'wouter';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TruthBadge } from '@/components/TruthBadge';
import { USE_METAMASK_DELEGATION } from '@/config/delegation';
import { SCOUT_SESSION_ADDRESS } from '@/config/delegation';
import {
  SCOUT_SPENDER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ABI,
} from '@/config/spendPermission';

const scoutAddress = USE_METAMASK_DELEGATION ? SCOUT_SESSION_ADDRESS : SCOUT_SPENDER_ADDRESS;
const SCOUT_ADDRESS_SHORT = `${scoutAddress.slice(0, 6)}...${scoutAddress.slice(-4)}`;

export default function Agent() {
  const { rules, feed, spendPermissions, recordScoutSwapAndPay } = useDemo();
  const { address, isConnected } = useAccount();
  const [, setLocation] = useLocation();
  const [scoutPayState, setScoutPayState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [scoutPayError, setScoutPayError] = useState<string | null>(null);
  const activeRulesCount = rules.filter(r => r.enabled).length;
  const approvedCount = feed.filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED').length;
  const blockedCount = feed.filter(i => i.status === 'BLOCKED').length;
  const activePermissions = spendPermissions.filter(p => p.state === 'active');

  const totalSpent = feed
    .filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalBudget = activePermissions.reduce((sum, p) => sum + p.amount, 0);

  const truncatedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : null;

  const handleScoutAutoPay = useCallback(async () => {
    setScoutPayState('running');
    setScoutPayError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const scoutToken = import.meta.env.VITE_SCOUT_API_TOKEN || '';
      const res = await fetch(`${API_BASE}/swap/scout-swap-and-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(scoutToken ? { 'Authorization': `Bearer ${scoutToken}` } : {}),
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
        const body = await res.json().catch(() => ({ error: 'Scout auto-pay failed' }));
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
      setScoutPayState('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Scout auto-pay failed';
      setScoutPayError(msg);
      setScoutPayState('error');
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
        
        <h1 className="text-[26px] font-bold tracking-tight mb-1">Scout</h1>
        <p className="text-[12px] text-muted-foreground/50 mb-1">Research agent · reads markets, files reports</p>
        <p className="text-[10px] text-muted-foreground/30 font-mono tracking-wide mb-1">{SCOUT_ADDRESS_SHORT}</p>
        <p className="text-[9px] text-muted-foreground/20 font-mono tracking-wide mb-4">scout.base.eth</p>
        
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
            <StateRow label="Spender address" value={SCOUT_ADDRESS_SHORT} mono />
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

        <div className="bg-card rounded-2xl p-5 border border-border/30">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight size={14} className="text-muted-foreground/40" />
            <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Scout Auto-Pay</span>
          </div>
          <p className="text-[11px] text-muted-foreground/40 mb-4">
            Scout can autonomously swap ETH → USDC via Uniswap then pay vendors. This triggers a real onchain swap + USDC transfer on Base Sepolia.
          </p>
          <button
            onClick={handleScoutAutoPay}
            disabled={scoutPayState === 'running'}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-colors bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scoutPayState === 'running' ? 'Swapping & Paying...' : scoutPayState === 'done' ? 'Done — Check Activity ✓' : 'Trigger Scout Swap → Pay'}
          </button>
          {scoutPayError && (
            <p className="mt-2 text-[10px] text-rose-400/80">{scoutPayError}</p>
          )}
          {scoutPayState === 'done' && (
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
          {USE_METAMASK_DELEGATION ? 'ERC-7710 · ERC-7715 · ' : 'ERC-8004 · '}Base Sepolia
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

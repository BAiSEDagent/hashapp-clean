import React, { useState } from 'react';
import { Wallet, Shield, ArrowRight, RefreshCw } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { useDemo, type SpendPermission } from '@/context/DemoContext';
import { AvatarIcon } from '@/components/ui/AvatarIcon';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TruthBadge } from '@/components/TruthBadge';
import { WalletAddressChip } from '@/components/WalletAddressChip';
import { AccountSheet } from '@/components/AccountSheet';
import { useLocation } from 'wouter';
import { USE_METAMASK_DELEGATION } from '@/config/delegation';
import {
  USDC_BASE_SEPOLIA,
  SPEND_PERMISSION_MANAGER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ABI,
} from '@/config/spendPermission';
import { formatUnits } from 'viem';
import { useResolvedWalletLabel } from '@/lib/addressDisplay';

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export default function Money() {
  const { feed, rules, spendPermissions, resetDemo, connectedAgent } = useDemo();
  const agentName = connectedAgent?.name ?? 'your agent';
  const { address, isConnected, chain } = useAccount();
  const [, setLocation] = useLocation();
  const [showAccountSheet, setShowAccountSheet] = useState(false);

  const { data: usdcBalanceRaw } = useReadContract({
    address: USDC_BASE_SEPOLIA,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 84532,
    query: { enabled: isConnected && !!address },
  });

  const usdcBalance = usdcBalanceRaw !== undefined
    ? parseFloat(formatUnits(usdcBalanceRaw, 6)).toFixed(2)
    : null;

  const spent = feed
    .filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED')
    .reduce((sum, i) => sum + i.amount, 0);

  const activeRulesCount = rules.filter(r => r.enabled).length;
  const activePermissions = spendPermissions.filter(p => p.state === 'active');
  const purchaseCount = feed.filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED').length;

  const totalPermissionAllowance = activePermissions.reduce((sum, p) => sum + p.amount, 0);

  const { displayLabel: walletLabel } = useResolvedWalletLabel(address);

  return (
    <div className="flex flex-col min-h-full pb-8">
      <header className="px-6 pt-12 pb-2">
        <h1 className="text-[28px] font-bold tracking-tight">Money</h1>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[11px] text-muted-foreground/50">Your wallet · {agentName}'s allocation</p>
          <WalletAddressChip />
        </div>
      </header>

      <div className="px-6 pt-5 flex flex-col gap-4">
        <div className="relative bg-card rounded-2xl p-6 border border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={13} className="text-muted-foreground/50" />
              <span className="text-[12px] text-muted-foreground/60 font-medium">
                Wallet Balance (USDC)
              </span>
              <TruthBadge type="onchain" />
            </div>
            <h2 className="text-[48px] font-bold tracking-tighter text-foreground leading-none mb-1.5">
              {usdcBalance !== null ? `$${usdcBalance}` : '—'}
            </h2>
            <p className="text-[12px] text-muted-foreground/40">
              USDC · {chain?.name || 'Base Sepolia'} · <button onClick={() => setShowAccountSheet(true)} className="text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors underline decoration-muted-foreground/20 underline-offset-2 font-mono">{walletLabel ?? 'No wallet'}</button>
            </p>
            {showAccountSheet && <AccountSheet onClose={() => setShowAccountSheet(false)} />}

            {activePermissions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground/40">Active permission allowances</span>
                  <span className="text-[13px] font-semibold tabular-nums">${totalPermissionAllowance}/day</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground/30">Spend tracked</span>
                    <TruthBadge type="demo" />
                  </div>
                  <span className="text-[10px] text-muted-foreground/30 tabular-nums">${spent.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border/30">
            <span className="text-[10px] text-muted-foreground/45 font-medium uppercase tracking-wider">Active Permissions</span>
            <p className="text-[22px] font-bold tracking-tight mt-1">{activePermissions.length}</p>
            <p className="text-[10px] text-muted-foreground/30 mt-0.5">${totalPermissionAllowance} USDC/day</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/30">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/45 font-medium uppercase tracking-wider">Spend</span>
              <TruthBadge type="demo" />
            </div>
            <p className="text-[22px] font-bold tracking-tight mt-1">${spent.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground/30 mt-0.5">{purchaseCount} purchases</p>
          </div>
        </div>

        {activePermissions.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center gap-2 pl-1">
              <AgentAvatar size="sm" />
              <h3 className="text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-[0.2em]">
                {agentName}'s Spend Permissions
              </h3>
            </div>
            {activePermissions.map(perm => (
              <SpendPermissionRow key={perm.id} permission={perm} onManage={() => setLocation('/activity')} />
            ))}
          </div>
        )}

        <div
          onClick={() => setLocation('/rules')}
          className="bg-card rounded-2xl p-4 border border-border/30 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
            <Shield size={16} className="text-primary/80" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-[13px]">Protected by {activeRulesCount} rules</h3>
            <p className="text-[10px] text-muted-foreground/40">{agentName} can only spend within your constraints</p>
          </div>
          <ArrowRight size={14} className="text-muted-foreground/25 shrink-0" />
        </div>

        <button
          onClick={resetDemo}
          className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors mt-2 py-2"
        >
          <RefreshCw size={11} />
          Reset demo state
        </button>
      </div>

      <div className="mt-auto pt-4 text-center pb-4">
        <p className="text-[10px] text-muted-foreground/20 font-medium tracking-widest uppercase">
          {USE_METAMASK_DELEGATION ? 'MetaMask Delegation · ' : ''}Base Sepolia · Testnet
        </p>
      </div>
    </div>
  );
}

function SpendPermissionRow({ permission, onManage }: { permission: SpendPermission; onManage: () => void }) {
  const cadenceLabel = { daily: '/day', weekly: '/wk', monthly: '/mo' };

  const permStruct = permission.permissionStruct;
  const isDelegation = USE_METAMASK_DELEGATION && permission.isDelegation;

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
    query: { enabled: !isDelegation && !!permStruct && !!permission.isReal },
  });

  let badgeType: 'onchain' | 'demo' | 'pending' | 'delegation';
  if (isDelegation && permission.permissionsContext) {
    badgeType = 'delegation';
  } else if (permission.isReal && permission.txHash) {
    const verified = isApprovedOnchain ?? permission.onchainVerified;
    badgeType = verified ? 'onchain' : 'pending';
  } else {
    badgeType = 'demo';
  }

  const canManageInActivity = isDelegation && permission.permissionsContext && permission.delegationManager && permission.spendToken;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-colors">
      <div className="flex items-center gap-3.5">
        <AvatarIcon initial={permission.vendorInitial} colorClass={permission.vendorColor} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">{permission.vendor}</span>
            <div className={`w-[5px] h-[5px] rounded-full shrink-0 ${permission.state === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TruthBadge type={badgeType} txHash={permission.txHash} expiresAt={permission.delegationExpiry} showCaveat={isDelegation} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[13px] font-semibold tabular-nums">${permission.amount}</span>
          <span className="text-[10px] text-muted-foreground/40">{cadenceLabel[permission.cadence]}</span>
        </div>
      </div>
      {canManageInActivity && (
        <button
          onClick={onManage}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-[11px] font-semibold bg-orange-500/10 text-orange-400/90 hover:bg-orange-500/15 active:scale-[0.98] transition-all"
        >
          <ArrowRight size={11} /> Manage in Activity
        </button>
      )}
    </div>
  );
}

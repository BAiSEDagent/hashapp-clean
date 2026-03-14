import React from 'react';
import { Wallet, ArrowRight, Shield, Pause, ArrowUpRight, RefreshCw } from 'lucide-react';
import { useDemo, type SpendPermission } from '@/context/DemoContext';
import { AvatarIcon } from '@/components/ui/AvatarIcon';

export default function Money() {
  const { feed, rules, spendPermissions } = useDemo();

  const spent = feed
    .filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED')
    .reduce((sum, i) => sum + i.amount, 0);

  const monthlyLimit = 700;
  const available = monthlyLimit - spent;
  const activeRulesCount = rules.filter(r => r.enabled).length;
  const activePermissions = spendPermissions.filter(p => p.state === 'active');

  return (
    <div className="flex flex-col min-h-full pb-8">
      <header className="px-6 pt-12 pb-2">
        <h1 className="text-3xl font-bold tracking-tight">Money</h1>
        <p className="text-xs text-muted-foreground/70 mt-1">Your wallet · Scout's allocation</p>
      </header>

      <div className="px-6 pt-6 flex flex-col gap-4">
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-1.5">
            <Wallet size={14} className="text-muted-foreground/60" />
            <span className="text-[13px] text-muted-foreground/70 font-medium">Available for Scout</span>
          </div>
          <h2 className="text-[52px] font-bold tracking-tighter text-foreground leading-none mb-1">
            ${available.toFixed(2)}
          </h2>
          <p className="text-[13px] text-muted-foreground/60">
            USDC · remaining under active rules
          </p>

          <div className="w-full h-1 bg-secondary rounded-full mt-6 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${Math.min((spent / monthlyLimit) * 100, 100)}%` }} 
            />
          </div>
          <div className="flex justify-between mt-2.5">
            <span className="text-[11px] text-muted-foreground/50">${spent.toFixed(2)} spent this month</span>
            <span className="text-[11px] text-muted-foreground/50">${monthlyLimit.toFixed(2)} allocated</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border/40">
            <span className="text-[11px] text-muted-foreground/60 font-medium">Allocated to Scout</span>
            <p className="text-2xl font-bold tracking-tight mt-1.5">${monthlyLimit.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground/40 mt-1">USDC · monthly budget</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/40">
            <span className="text-[11px] text-muted-foreground/60 font-medium">Spent this month</span>
            <p className="text-2xl font-bold tracking-tight mt-1.5">${spent.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground/40 mt-1">{feed.filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED').length} purchases</p>
          </div>
        </div>

        {activePermissions.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] pl-1 mt-2">
              Active Spend Permissions
            </h3>
            {activePermissions.map(perm => (
              <SpendPermissionRow key={perm.id} permission={perm} />
            ))}
          </div>
        )}

        <div className="bg-card rounded-2xl p-4 border border-border/40 flex items-center gap-4 mt-1">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Shield size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-[13px]">Protected by {activeRulesCount} rules</h3>
            <p className="text-[11px] text-muted-foreground/60">Scout can only spend within your constraints</p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground/40 shrink-0" />
        </div>

        <div className="flex flex-col gap-2 mt-3">
          <h3 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] pl-1">
            Manage
          </h3>
          <ActionRow icon={<ArrowUpRight size={17} />} label="Increase Scout's limit" sub="Allocate more USDC from your wallet" />
          <ActionRow icon={<RefreshCw size={17} />} label="Adjust Scout's budget" sub="Change the monthly spending allocation" />
          <ActionRow icon={<Pause size={17} />} label="Pause Scout" sub="Temporarily freeze all spend permissions" />
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/40 mt-2">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Wallet size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">Connected Wallet</p>
              <p className="text-[11px] text-muted-foreground/50 font-mono">0x8a4f...c2e1 · Base</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed pl-11">
            Your wallet, Scout's permissions. Funds stay in your smart wallet — Hashapp never takes custody.
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8 text-center pb-4">
        <p className="text-[12px] text-muted-foreground/30 font-medium tracking-wide">
          Settled in USDC on Base · chain 8453
        </p>
      </div>
    </div>
  );
}

function SpendPermissionRow({ permission }: { permission: SpendPermission }) {
  const cadenceLabel = { daily: '/day', weekly: '/wk', monthly: '/mo' };
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-card border border-border/40 hover:border-border/60 transition-colors">
      <AvatarIcon initial={permission.vendorInitial} colorClass={permission.vendorColor} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground">{permission.vendor}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${permission.state === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[13px] font-semibold tabular-nums">${permission.amount}</span>
        <span className="text-[11px] text-muted-foreground/50">{cadenceLabel[permission.cadence]}</span>
      </div>
    </div>
  );
}

function ActionRow({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer bg-card border border-border/40">
      <div className="w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center text-foreground/80 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground/50">{sub}</p>
      </div>
      <ArrowRight size={14} className="text-muted-foreground/30 shrink-0" />
    </div>
  );
}

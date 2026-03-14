import React from 'react';
import { Wallet, ArrowRight, Shield, Pause, Plus, SlidersHorizontal } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { AvatarIcon } from '@/components/ui/AvatarIcon';

export default function Money() {
  const { feed, rules } = useDemo();

  const spent = feed
    .filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED')
    .reduce((sum, i) => sum + i.amount, 0);

  const monthlyLimit = 700;
  const available = monthlyLimit - spent;
  const activeRulesCount = rules.filter(r => r.enabled).length;

  return (
    <div className="flex flex-col min-h-full pb-8">
      <header className="px-6 pt-12 pb-2">
        <h1 className="text-3xl font-bold tracking-tight">Money</h1>
        <p className="text-xs text-muted-foreground mt-1">Connected wallet · protected by your rules</p>
      </header>

      <div className="px-6 pt-6 flex flex-col gap-4">
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Available for Scout</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tighter text-foreground mb-1">
            ${available.toFixed(2)}
          </h2>
          <p className="text-sm text-muted-foreground">
            USDC · remaining under active rules
          </p>

          <div className="w-full h-1.5 bg-secondary rounded-full mt-5 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((spent / monthlyLimit) * 100, 100)}%` }} 
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">${spent.toFixed(2)} spent</span>
            <span className="text-xs text-muted-foreground">${monthlyLimit.toFixed(2)} allocated</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <span className="text-xs text-muted-foreground">Allocated this month</span>
            <p className="text-2xl font-bold tracking-tight mt-1">${monthlyLimit.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">USDC from connected wallet</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <span className="text-xs text-muted-foreground">Spent this month</span>
            <p className="text-2xl font-bold tracking-tight mt-1">${spent.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">across {feed.filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED').length} purchases</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Shield size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Protected by {activeRulesCount} rules</h3>
            <p className="text-xs text-muted-foreground">Scout can only spend within your constraints</p>
          </div>
          <ArrowRight size={18} className="text-muted-foreground shrink-0" />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">
            Manage
          </h3>
          <ActionRow icon={<Plus size={18} />} label="Add funds" sub="Transfer USDC to Scout's allocation" />
          <ActionRow icon={<SlidersHorizontal size={18} />} label="Adjust budget" sub="Change monthly allocation limit" />
          <ActionRow icon={<Pause size={18} />} label="Pause Scout" sub="Temporarily freeze all spending" />
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/50 mt-2">
          <div className="flex items-center gap-3 mb-3">
            <AvatarIcon initial="W" colorClass="bg-blue-600" size="sm" />
            <div>
              <p className="text-sm font-medium text-foreground">Connected Wallet</p>
              <p className="text-xs text-muted-foreground font-mono">0x8a4f...c2e1</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your wallet, Scout's permissions. Funds remain in your Base smart wallet — Hashapp never takes custody.
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8 text-center pb-4">
        <p className="text-[13px] text-muted-foreground/50 font-medium">
          Settled in USDC on Base · chain ID 8453
        </p>
      </div>
    </div>
  );
}

function ActionRow({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary/30 transition-colors cursor-pointer bg-card border border-border/50">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ArrowRight size={16} className="text-muted-foreground shrink-0" />
    </div>
  );
}

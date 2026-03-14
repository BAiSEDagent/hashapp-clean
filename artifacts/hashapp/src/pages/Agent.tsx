import React from 'react';
import { Bot, Shield, ArrowRight, Clock, CheckCircle2, Zap, RefreshCw } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { AvatarIcon } from '@/components/ui/AvatarIcon';

export default function Agent() {
  const { rules, feed, spendPermissions } = useDemo();
  const activeRulesCount = rules.filter(r => r.enabled).length;
  const approvedCount = feed.filter(i => i.status === 'APPROVED' || i.status === 'AUTO_APPROVED').length;
  const blockedCount = feed.filter(i => i.status === 'BLOCKED').length;
  const activePermissions = spendPermissions.filter(p => p.state === 'active');

  return (
    <div className="flex flex-col min-h-full pb-8">
      <div className="px-6 pt-16 pb-8 flex flex-col items-center text-center">
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-2xl">
            <Bot size={44} className="text-zinc-300" strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-0 right-0 bg-background rounded-full p-0.5">
            <div className="w-5 h-5 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
              <CheckCircle2 size={11} className="text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-1">Scout</h1>
        <p className="text-[13px] text-muted-foreground/60 mb-1">Research agent · reads markets, files reports</p>
        <p className="text-[11px] text-muted-foreground/40 font-mono mb-4">scout.base.eth</p>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-[11px] font-medium text-emerald-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active · verified on Base
        </div>
      </div>

      <div className="px-6 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={approvedCount} label="Approved" color="text-emerald-400" />
          <StatCard value={blockedCount} label="Blocked" color="text-rose-400" />
          <StatCard value={activeRulesCount} label="Rules" color="text-primary" />
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/40">
          <div className="flex items-center gap-2.5 mb-4">
            <Zap size={16} className="text-muted-foreground/50" />
            <span className="text-[13px] font-semibold text-muted-foreground/70">Operating State</span>
          </div>
          <div className="space-y-3.5">
            <StateRow label="Status" value="Active" valueColor="text-emerald-400" />
            <StateRow label="Identity" value="scout.base.eth" mono />
            <StateRow label="Spending from" value="Your connected wallet" />
            <StateRow label="Settlement" value="USDC on Base" />
            <StateRow label="Constraints" value={`${activeRulesCount} active rules`} />
          </div>
        </div>

        {activePermissions.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border/40">
            <div className="flex items-center gap-2.5 mb-4">
              <RefreshCw size={16} className="text-muted-foreground/50" />
              <span className="text-[13px] font-semibold text-muted-foreground/70">Spend Permissions</span>
              <span className="ml-auto text-[11px] text-muted-foreground/40">{activePermissions.length} active</span>
            </div>
            <div className="space-y-3">
              {activePermissions.map(perm => {
                const cadenceLabel = { daily: '/day', weekly: '/wk', monthly: '/mo' };
                return (
                  <div key={perm.id} className="flex items-center gap-3">
                    <AvatarIcon initial={perm.vendorInitial} colorClass={perm.vendorColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-foreground">{perm.vendor}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-semibold tabular-nums">${perm.amount}{cadenceLabel[perm.cadence]}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${perm.state === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Active Constraints</h3>
              <p className="text-[11px] text-muted-foreground/50">{activeRulesCount} rules applied</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-muted-foreground/30" />
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/40 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center">
              <Clock size={18} className="text-muted-foreground/60" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Recent Actions</h3>
              <p className="text-[11px] text-muted-foreground/50">View Scout's activity log</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-muted-foreground/30" />
        </div>
      </div>

      <div className="mt-auto pt-12 text-center pb-4">
        <p className="text-[12px] text-muted-foreground/30 font-medium tracking-wide">
          Verified on Base · ERC-8004 #4721
        </p>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border/40 text-center">
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground/40 mt-1 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function StateRow({ label, value, valueColor, mono }: { label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted-foreground/50">{label}</span>
      <span className={`text-[13px] font-medium ${mono ? 'font-mono text-muted-foreground/70' : valueColor || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

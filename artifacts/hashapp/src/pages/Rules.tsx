import React, { useState, useMemo } from 'react';
import { useDemo } from '@/context/DemoContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Info, Eye, ChevronDown } from 'lucide-react';

export default function Rules() {
  const { rules, toggleRule, connectedAgent } = useDemo();
  const agentName = connectedAgent?.name ?? 'your agent';
  const [toast, setToast] = useState<string | null>(null);

  const activeCount = rules.filter(r => r.enabled).length;

  const handleToggle = (id: string, name: string, willBeEnabled: boolean) => {
    toggleRule(id);
    setToast(`${name} ${willBeEnabled ? 'enabled' : 'disabled'}`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col min-h-full pb-8">
      <header className="px-6 pt-12 pb-5 sticky top-0 bg-background/95 backdrop-blur-xl z-10">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-[28px] font-bold tracking-tight">Rules</h1>
          <div className="px-2.5 py-1 rounded-lg bg-primary/8 border border-primary/10">
            <span className="text-[10px] font-semibold text-primary tabular-nums tracking-wide">{activeCount} active</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-primary/60" />
          Spending constraints for {agentName}
        </p>
      </header>

      <div className="px-6 pb-5">
        <div className="bg-primary/[0.04] border border-primary/[0.07] rounded-xl p-4 flex gap-3">
          <Info className="text-primary/50 shrink-0 mt-0.5" size={14} />
          <p className="text-[11px] text-primary/50 leading-relaxed">
            {agentName} operates autonomously within these boundaries. Purchases that violate active rules require your approval or are blocked automatically.
          </p>
        </div>
      </div>

      <div className="px-6 mb-4">
        <ReasoningPrivacyCard />
      </div>

      <div className="px-6 flex flex-col gap-2.5">
        {rules.map((rule, i) => (
          <motion.div 
            key={rule.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className={`
              bg-card rounded-2xl p-5 border transition-all duration-300
              ${rule.enabled 
                ? 'border-border/40' 
                : 'border-border/15 opacity-50'
              }
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className={`text-[14px] font-semibold leading-snug mb-1 transition-colors ${rule.enabled ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                  {rule.name}
                </h3>
                <p className="text-[11px] text-muted-foreground/40 leading-relaxed">{rule.description}</p>
              </div>
              
              <button
                data-testid={`toggle-rule-${rule.id}`}
                onClick={() => handleToggle(rule.id, rule.name, !rule.enabled)}
                className={`
                  relative inline-flex h-[24px] w-[42px] shrink-0 cursor-pointer items-center rounded-full 
                  transition-all duration-300 ease-out focus:outline-none mt-1
                  ${rule.enabled 
                    ? 'bg-emerald-500 shadow-[0_0_10px_-3px_rgba(52,211,153,0.35)]' 
                    : 'bg-zinc-700/50'
                  }
                `}
              >
                <span className="sr-only">Toggle rule</span>
                <span
                  className={`
                    pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-sm
                    transition-all duration-300 ease-out
                    ${rule.enabled ? 'translate-x-[20px]' : 'translate-x-[2px]'}
                  `}
                />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto pt-10 text-center pb-4">
        <p className="text-[10px] text-muted-foreground/20 font-medium tracking-widest uppercase">
          Rules managed by Hashapp
        </p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 16, x: '-50%' }}
            className="fixed bottom-28 left-1/2 w-max max-w-[80%] bg-zinc-800/95 backdrop-blur-sm text-white text-[12px] font-medium px-5 py-2.5 rounded-full shadow-2xl border border-zinc-700/40 z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReasoningPrivacyCard() {
  const { feed, privateReasoningEnabled, setPrivateReasoningEnabled } = useDemo();
  const [expanded, setExpanded] = useState(false);

  const lastAnalysis = useMemo(() => {
    const veniceItem = feed.find(i => i.privateReasoningUsed);
    if (!veniceItem) return null;
    if (veniceItem.dateGroup === 'TODAY') return 'Today';
    if (veniceItem.dateGroup === 'YESTERDAY') return 'Yesterday';
    return veniceItem.dateGroup;
  }, [feed]);

  return (
    <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-violet-400/60" />
            <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Reasoning & Privacy</span>
          </div>
          <button
            onClick={() => setPrivateReasoningEnabled(!privateReasoningEnabled)}
            className={`relative w-[36px] h-[20px] rounded-full transition-colors duration-200 ${privateReasoningEnabled ? 'bg-emerald-500/80' : 'bg-zinc-600/60'}`}
          >
            <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform duration-200 ${privateReasoningEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>

        <p className={`text-[11px] font-medium mb-3 ${privateReasoningEnabled ? 'text-emerald-400/80' : 'text-muted-foreground/40'}`}>
          {privateReasoningEnabled ? 'Private review enabled' : 'Private review disabled'}
        </p>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[10px] text-muted-foreground/30 font-medium">Privacy details</span>
        <ChevronDown size={12} className={`text-muted-foreground/30 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 space-y-3">
          <DetailRow label="Provider" value="Venice" />
          <DetailRow label="Inputs allowed" value="Text" />
          <DetailRow label="Disclosure policy" value="Summary only" />
          {lastAnalysis && (
            <DetailRow label="Last private analysis" value={lastAnalysis} />
          )}
          <p className="text-[10px] text-muted-foreground/30 mt-2 leading-relaxed">
            {privateReasoningEnabled
              ? 'Venice reasoning may inform actions while keeping raw inputs private.'
              : 'Actions will not use Venice private reasoning.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[12px] text-muted-foreground/40">{label}</span>
      <span className="text-[12px] font-medium text-foreground/90">{value}</span>
    </div>
  );
}

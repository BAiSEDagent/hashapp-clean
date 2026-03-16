import { ExternalLink } from 'lucide-react';

type BadgeType = 'onchain' | 'demo' | 'pending';

const BADGE_CONFIG = {
  onchain: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/15',
    text: 'text-emerald-400/80',
    dot: 'bg-emerald-400',
    label: 'Onchain',
  },
  demo: {
    bg: 'bg-zinc-500/8',
    border: 'border-zinc-500/10',
    text: 'text-zinc-400/60',
    dot: 'bg-zinc-500/50',
    label: 'Demo',
  },
  pending: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/15',
    text: 'text-amber-400/80',
    dot: 'bg-amber-400',
    label: 'Pending',
  },
} as const;

export function TruthBadge({
  type,
  txHash,
}: {
  type: BadgeType;
  txHash?: string;
}) {
  const c = BADGE_CONFIG[type];

  if (type === 'onchain' && txHash) {
    return (
      <a
        href={`https://sepolia.basescan.org/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${c.bg} border ${c.border} ${c.text} text-[9px] font-semibold uppercase tracking-[0.06em] hover:opacity-80 transition-opacity`}
      >
        <div className={`w-[4px] h-[4px] rounded-full ${c.dot}`} />
        {c.label}
        <ExternalLink size={7} />
      </a>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${c.bg} border ${c.border} ${c.text} text-[9px] font-semibold uppercase tracking-[0.06em]`}>
      <div className={`w-[4px] h-[4px] rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

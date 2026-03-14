import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { useDemo, type FeedItem, type StatusType } from '@/context/DemoContext';
import { AvatarIcon } from '@/components/ui/AvatarIcon';

const TRUSTED_DESTINATIONS = [
  { name: 'PitchBook', initial: 'P', color: 'bg-blue-600' },
  { name: 'Perplexity', initial: 'P', color: 'bg-teal-500' },
  { name: 'OpenAI', initial: 'O', color: 'bg-zinc-700' },
  { name: 'Statista', initial: 'S', color: 'bg-orange-500' },
  { name: 'DataStream', initial: 'D', color: 'bg-purple-600' },
];

export default function Activity() {
  const { feed, approvePending, declinePending } = useDemo();
  const [, setLocation] = useLocation();

  const groupedFeed = feed.reduce((acc, item) => {
    if (!acc[item.dateGroup]) acc[item.dateGroup] = [];
    acc[item.dateGroup].push(item);
    return acc;
  }, {} as Record<string, FeedItem[]>);

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-md z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
          <p className="text-xs text-muted-foreground/70 mt-1 font-mono">scout.base.eth</p>
        </div>
        <div className="relative">
          <AvatarIcon initial="S" colorClass="bg-zinc-800 border border-zinc-700" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
        </div>
      </header>

      <div className="mb-5 pt-1">
        <div className="px-6 mb-3">
          <h2 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">Trusted Destinations</h2>
        </div>
        <div className="flex overflow-x-auto gap-5 px-6 pb-3 snap-x snap-mandatory hide-scrollbar">
          {TRUSTED_DESTINATIONS.map((payee) => (
            <motion.div 
              key={payee.name} 
              className="flex flex-col items-center gap-1.5 snap-start shrink-0 cursor-pointer group"
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <AvatarIcon initial={payee.initial} colorClass={payee.color} size="md" className="shadow-lg group-hover:shadow-xl transition-shadow" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center bg-blue-500">
                  <ShieldCheck size={8} className="text-white" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground/80 w-16 text-center truncate group-hover:text-foreground transition-colors">
                {payee.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="relative flex items-center w-full h-11 rounded-xl bg-secondary/40 border border-border/40 text-muted-foreground/60 px-4 hover:border-border/70 transition-colors">
          <Search size={15} className="mr-3" />
          <span className="text-[13px]">Search activity or destinations</span>
        </div>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-7">
        {Object.entries(groupedFeed).map(([dateGroup, items]) => (
          <div key={dateGroup} className="flex flex-col gap-1.5">
            <h2 className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] pl-2 mb-1">
              {dateGroup}
            </h2>
            <div className="flex flex-col gap-0.5">
              <AnimatePresence initial={false}>
                {items.map(item => (
                  <FeedCard 
                    key={item.id} 
                    item={item} 
                    onApprove={() => approvePending(item.id)}
                    onDecline={() => declinePending(item.id)}
                    onClick={() => {
                      if (item.status !== 'PENDING') {
                        setLocation(`/receipt/${item.id}`);
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedCard({ 
  item, 
  onApprove, 
  onDecline,
  onClick
}: { 
  item: FeedItem; 
  onApprove: () => void; 
  onDecline: () => void;
  onClick: () => void;
}) {
  const isPending = item.status === 'PENDING';

  if (isPending) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.25 }}
        data-testid={`card-feed-${item.id}`}
        className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.06] to-transparent p-5 my-1"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.04] via-transparent to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/20">
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Spend Permission Request</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <AvatarIcon initial={item.merchantInitial} colorClass={item.merchantColor} size="lg" />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex justify-between items-start mb-1.5">
                <h3 className="text-lg font-semibold text-foreground">{item.merchant}</h3>
                <span className="text-2xl font-bold tracking-tight shrink-0 ml-2">{item.amountStr}<span className="text-sm font-medium text-muted-foreground">/mo</span></span>
              </div>
              <p className="text-[13px] text-muted-foreground/80 leading-relaxed">
                Scout wants recurring access to real-time market data
              </p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 mt-5 pt-5 border-t border-border/30"
          >
            <button 
              data-testid={`button-decline-${item.id}`}
              onClick={(e) => { e.stopPropagation(); onDecline(); }}
              className="flex-1 py-3 rounded-xl font-semibold text-foreground/80 bg-secondary/80 hover:bg-secondary active:scale-[0.98] transition-all"
            >
              Decline
            </button>
            <button 
              data-testid={`button-approve-${item.id}`}
              onClick={(e) => { e.stopPropagation(); onApprove(); }}
              className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              Grant Permission
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
      data-testid={`card-feed-${item.id}`}
      onClick={onClick}
      className="flex items-center gap-3.5 py-3.5 px-2 rounded-xl hover:bg-white/[0.02] active:bg-white/[0.04] cursor-pointer transition-colors"
    >
      <AvatarIcon initial={item.merchantInitial} colorClass={item.merchantColor} size="md" />
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="text-[15px] font-semibold text-foreground truncate pr-3">{item.merchant}</h3>
          <span className="text-[15px] font-semibold tabular-nums shrink-0">
            {item.status === 'BLOCKED' || item.status === 'DECLINED' ? (
              <span className="text-muted-foreground/50 line-through">{item.amountStr}</span>
            ) : item.amountStr}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[12px] text-muted-foreground/60 truncate pr-3">{item.intent}</p>
          <StatusDot status={item.status} />
        </div>
      </div>
    </motion.div>
  );
}

function StatusDot({ status }: { status: StatusType }) {
  const config = {
    APPROVED: { color: 'bg-emerald-400', label: 'Approved' },
    AUTO_APPROVED: { color: 'bg-emerald-500/70', label: 'Auto' },
    PENDING: { color: 'bg-amber-400', label: 'Pending' },
    BLOCKED: { color: 'bg-rose-400', label: 'Blocked' },
    DECLINED: { color: 'bg-rose-400', label: 'Declined' },
  };

  const c = config[status];

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
      <span className="text-[10px] text-muted-foreground/50 font-medium">{c.label}</span>
    </div>
  );
}

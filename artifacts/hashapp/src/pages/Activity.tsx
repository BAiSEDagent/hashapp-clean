import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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
          <p className="text-xs text-muted-foreground mt-1">Scout · Research Agent</p>
        </div>
        <div className="relative">
          <AvatarIcon initial="S" colorClass="bg-zinc-800 border border-zinc-700" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background"></div>
        </div>
      </header>

      <div className="mb-4">
        <div className="px-6 mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Trusted Destinations</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 px-6 pb-2 snap-x snap-mandatory hide-scrollbar">
          {TRUSTED_DESTINATIONS.map((payee) => (
            <div key={payee.name} className="flex flex-col items-center gap-1.5 snap-start shrink-0">
              <AvatarIcon initial={payee.initial} colorClass={payee.color} size="md" className="shadow-lg" />
              <span className="text-[10px] font-medium text-muted-foreground w-14 text-center truncate">
                {payee.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mb-5">
        <div className="relative flex items-center w-full h-11 rounded-xl bg-secondary/50 border border-border/50 text-muted-foreground px-4">
          <Search size={16} className="mr-3" />
          <span className="text-sm">Search activity or payees</span>
        </div>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-6">
        {Object.entries(groupedFeed).map(([dateGroup, items]) => (
          <div key={dateGroup} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-2">
              {dateGroup}
            </h2>
            <div className="flex flex-col gap-2">
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
      data-testid={`card-feed-${item.id}`}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border transition-all duration-300
        ${isPending 
          ? 'bg-card border-amber-500/30 shadow-[0_0_30px_-10px_rgba(245,158,11,0.15)] p-5' 
          : 'bg-transparent border-transparent hover:bg-secondary/30 p-3 cursor-pointer'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <AvatarIcon 
          initial={item.merchantInitial} 
          colorClass={item.merchantColor} 
          size={isPending ? 'lg' : 'md'} 
        />
        
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-start mb-1">
            <h3 className={`font-semibold text-foreground truncate pr-2 ${isPending ? 'text-lg' : 'text-base'}`}>
              {item.merchant}
            </h3>
            <span className={`font-bold shrink-0 ${isPending ? 'text-2xl tracking-tight mt-1' : 'text-base'}`}>
              {item.amountStr}
            </span>
          </div>
          
          <p className={`text-muted-foreground leading-snug mb-3 ${isPending ? 'text-base' : 'text-sm line-clamp-1'}`}>
            {item.intent}
          </p>

          {!isPending && (
            <div className="flex items-center gap-1.5">
              <StatusBadge status={item.status} text={item.statusMessage} />
            </div>
          )}
        </div>
      </div>

      {isPending && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-3 mt-5 pt-5 border-t border-border/50"
        >
          <button 
            data-testid={`button-decline-${item.id}`}
            onClick={(e) => { e.stopPropagation(); onDecline(); }}
            className="flex-1 py-3.5 rounded-xl font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
          >
            Decline
          </button>
          <button 
            data-testid={`button-approve-${item.id}`}
            onClick={(e) => { e.stopPropagation(); onApprove(); }}
            className="flex-1 py-3.5 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-colors"
          >
            Approve
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status, text }: { status: StatusType, text: string }) {
  const config = {
    APPROVED: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    AUTO_APPROVED: { icon: CheckCircle2, color: 'text-emerald-500/80', bg: 'bg-emerald-500/10 border-emerald-500/10' },
    PENDING: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    BLOCKED: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
    DECLINED: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${c.bg} ${c.color} text-[11px] font-medium`}>
      <Icon size={12} strokeWidth={2.5} />
      <span>{text}</span>
    </div>
  );
}

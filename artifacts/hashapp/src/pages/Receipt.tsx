import { useRoute, Link } from 'wouter';
import { X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDemo } from '@/context/DemoContext';
import { AvatarIcon } from '@/components/ui/AvatarIcon';

export default function Receipt() {
  const [, params] = useRoute('/receipt/:id');
  const { feed } = useDemo();
  
  const item = feed.find(f => f.id === params?.id);

  if (!item) return <div className="p-8 text-center mt-20 text-muted-foreground">Receipt not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="fixed inset-0 z-[100] flex justify-center bg-background"
    >
      <div className="w-full max-w-[430px] bg-background h-full flex flex-col relative">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary/50 active:bg-secondary transition-colors">
            <X size={22} className="text-foreground" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col items-center">
          <AvatarIcon 
            initial={item.merchantInitial} 
            colorClass={item.merchantColor} 
            size="xl" 
            className="mb-5 shadow-2xl"
          />
          
          <h2 className="text-lg font-medium text-muted-foreground/70 mb-3">{item.merchant}</h2>
          <h1 className="text-[52px] font-bold tracking-tighter text-foreground leading-none mb-6">
            {item.amountStr}
          </h1>

          <div className={`px-4 py-1.5 rounded-full text-[13px] font-medium mb-10 flex items-center gap-2
            ${item.status === 'BLOCKED' || item.status === 'DECLINED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' : 
              item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' : 
              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'}
          `}>
            <div className={`w-1.5 h-1.5 rounded-full 
              ${item.status === 'BLOCKED' || item.status === 'DECLINED' ? 'bg-rose-400' : 
                item.status === 'PENDING' ? 'bg-amber-400' : 
                'bg-emerald-400'}
            `} />
            {item.statusMessage}
          </div>

          <div className="w-full bg-card rounded-2xl p-5 border border-border/40 space-y-0">
            <DetailRow label="Date & Time" value={`${item.dateGroup === 'TODAY' ? 'Today' : item.dateGroup === 'YESTERDAY' ? 'Yesterday' : item.dateGroup} at ${item.timestamp}`} />
            <DetailRow label="Category" value={item.category} />
            <div className="flex flex-col gap-1.5 py-4 border-t border-border/30">
              <span className="text-[12px] text-muted-foreground/50 font-medium">Stated Purpose</span>
              <span className="text-[13px] text-foreground font-medium leading-relaxed">{item.intent}</span>
            </div>
            <DetailRow 
              label="Approval" 
              value={item.status === 'AUTO_APPROVED' ? 'Auto-approved' : item.status === 'APPROVED' ? 'Human-approved' : item.status === 'BLOCKED' ? 'Blocked by rule' : item.status === 'DECLINED' ? 'Declined' : 'Pending'} 
            />
            <div className="flex items-center justify-between py-4 border-t border-border/30">
              <span className="text-[12px] text-muted-foreground/50 font-medium">
                {item.status === 'BLOCKED' || item.status === 'DECLINED' ? 'Requested by' : 'Authorized by'}
              </span>
              <div className="flex items-center gap-2">
                <AvatarIcon initial="S" colorClass="bg-zinc-800" size="sm" />
                <div className="text-right">
                  <span className="text-[13px] font-medium block">Scout</span>
                  <span className="text-[10px] text-muted-foreground/40 font-mono">scout.base.eth</span>
                </div>
              </div>
            </div>
          </div>

          {(item.status === 'APPROVED' || item.status === 'AUTO_APPROVED') && item.txHash && (
            <div className="mt-8 text-center space-y-2">
              <p className="text-[12px] text-muted-foreground/40 flex items-center justify-center gap-1.5 tracking-wide">
                Settled in USDC on Base · proof available
              </p>
              <a 
                href={`https://basescan.org/tx/${item.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-muted-foreground/30 flex items-center justify-center gap-1 cursor-pointer hover:text-muted-foreground/50 transition-colors"
              >
                tx {item.txHash.slice(0, 6)}...{item.txHash.slice(-4)} <ExternalLink size={9} />
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-t border-border/30 first:border-t-0 first:pt-0">
      <span className="text-[12px] text-muted-foreground/50 font-medium">{label}</span>
      <span className="text-[13px] text-foreground font-medium text-right">{value}</span>
    </div>
  );
}

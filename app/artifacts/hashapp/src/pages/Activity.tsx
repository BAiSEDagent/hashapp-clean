import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAccount, useWriteContract, useConnect } from 'wagmi';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { walletConfig } from '@/config/wallet';
import { useDemo, type FeedItem, type StatusType } from '@/context/DemoContext';
import { AvatarIcon } from '@/components/ui/AvatarIcon';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TruthBadge } from '@/components/TruthBadge';
import {
  SPEND_PERMISSION_MANAGER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ABI,
  SCOUT_SPENDER_ADDRESS,
  USDC_BASE_SEPOLIA,
} from '@/config/spendPermission';

const TRUSTED_DESTINATIONS = [
  { name: 'PitchBook', initial: 'P', color: 'bg-blue-600' },
  { name: 'Perplexity', initial: 'P', color: 'bg-teal-500' },
  { name: 'OpenAI', initial: 'O', color: 'bg-zinc-700' },
  { name: 'Statista', initial: 'S', color: 'bg-orange-500' },
  { name: 'DataStream', initial: 'D', color: 'bg-purple-600' },
];

export default function Activity() {
  const { feed, approvePending, declinePending, threads, setActiveThreadId, markThreadRead } = useDemo();
  const [, setLocation] = useLocation();

  const groupedFeed = feed.reduce((acc, item) => {
    if (!acc[item.dateGroup]) acc[item.dateGroup] = [];
    acc[item.dateGroup].push(item);
    return acc;
  }, {} as Record<string, FeedItem[]>);

  const firstUnreadThread = threads.find(thread =>
    thread.messages.some(message => message.role === 'assistant' && !message.read),
  );
  const lastUnreadMessage = firstUnreadThread
    ? firstUnreadThread.messages.filter(message => message.role === 'assistant' && !message.read).at(-1)
    : undefined;

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 pt-12 pb-5 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-xl z-10">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Activity</h1>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-mono tracking-wide">scout.base.eth</p>
        </div>
        <div className="relative">
          <AgentAvatar size="sm" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
        </div>
      </header>

      <div className="mb-6 pt-1">
        <div className="px-6 mb-3">
          <h2 className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.2em]">Trusted Destinations</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 px-6 pb-2 snap-x snap-mandatory hide-scrollbar">
          {TRUSTED_DESTINATIONS.map((payee) => (
            <div 
              key={payee.name} 
              className="flex flex-col items-center gap-2 snap-start shrink-0"
            >
              <div className="relative">
                <AvatarIcon initial={payee.initial} colorClass={payee.color} size="md" className="shadow-md ring-1 ring-white/[0.06]" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[1.5px] border-background flex items-center justify-center bg-blue-500 shadow-sm">
                  <ShieldCheck size={8} className="text-white" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground/50 w-16 text-center truncate">
                {payee.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8 flex flex-col gap-8">
        {firstUnreadThread && lastUnreadMessage && (
          <button
            onClick={() => {
              setActiveThreadId(firstUnreadThread.id);
              markThreadRead(firstUnreadThread.id);
              setLocation('/agent');
            }}
            className="flex items-center gap-3 rounded-2xl border border-[#7F77DD]/20 bg-[#7F77DD]/[0.07] px-4 py-3 text-left hover:bg-[#7F77DD]/[0.1] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-semibold text-foreground truncate">The agent wants to discuss a purchase</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider shrink-0 border border-[#7F77DD]/30 bg-[#7F77DD]/15 text-[#AFA9EC]">
                  <span className="w-1 h-1 rounded-full bg-[#7F77DD]" />
                  Venice
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/60 truncate">
                {lastUnreadMessage.content.slice(0, 40)}{lastUnreadMessage.content.length > 40 ? '…' : ''}
              </p>
            </div>
            <span className="text-[9px] text-muted-foreground/35 shrink-0">{new Date(lastUnreadMessage.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </button>
        )}

        {Object.entries(groupedFeed).map(([dateGroup, items]) => (
          <div key={dateGroup} className="flex flex-col">
            <h2 className="text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-[0.2em] pl-1 mb-2">
              {dateGroup}
            </h2>
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {items.map((item, i) => (
                  <FeedCard 
                    key={item.id} 
                    item={item} 
                    isLast={i === items.length - 1}
                    onApprove={approvePending}
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
  isLast,
  onApprove, 
  onDecline,
  onClick
}: { 
  item: FeedItem; 
  isLast: boolean;
  onApprove: (
    id: string,
    realTxHash?: string,
    permissionStruct?: import('@/context/DemoContext').SpendPermission['permissionStruct'],
    onchainVerified?: boolean,
  ) => void;
  onDecline: () => void;
  onClick: () => void;
}) {
  const isPending = item.status === 'PENDING';
  const isBlocked = item.status === 'BLOCKED' || item.status === 'DECLINED';
  const isApprovedOrAuto = item.status === 'APPROVED' || item.status === 'AUTO_APPROVED';

  if (isPending) {
    return <PendingCard item={item} onApprove={onApprove} onDecline={onDecline} />;
  }

  let badgeType: 'onchain' | 'demo' | 'pending' | null = null;
  if (isApprovedOrAuto) {
    if (item.isReal && item.txHash) {
      badgeType = item.onchainVerified === true ? 'onchain' : 'pending';
    } else {
      badgeType = 'demo';
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, type: "spring", bounce: 0.15 }}
      data-testid={`card-feed-${item.id}`}
      onClick={onClick}
      className={`flex items-center gap-3.5 py-3.5 px-2 rounded-xl cursor-pointer transition-colors
        ${isBlocked ? 'hover:bg-rose-500/[0.03] active:bg-rose-500/[0.05]' : 'hover:bg-white/[0.025] active:bg-white/[0.04]'}
        ${!isLast ? 'border-b border-white/[0.04]' : ''}
      `}
    >
      <AvatarIcon initial={item.merchantInitial} colorClass={item.merchantColor} size="md" className={isBlocked ? 'opacity-60' : ''} />
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`text-[14px] font-semibold truncate pr-3 ${isBlocked ? 'text-foreground/50' : 'text-foreground'}`}>{item.merchant}</h3>
          <span className={`text-[14px] font-semibold tabular-nums shrink-0 ${isBlocked ? 'text-muted-foreground/35 line-through decoration-rose-500/40' : 'text-foreground'}`}>
            {item.amountStr}
          </span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`text-[11px] truncate leading-relaxed ${isBlocked ? 'text-muted-foreground/35' : 'text-muted-foreground/50'}`}>{item.intent}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {badgeType && <TruthBadge type={badgeType} txHash={item.txHash} />}
            <StatusDot status={item.status} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PendingCard({
  item,
  onApprove,
  onDecline,
}: {
  item: FeedItem;
  onApprove: (
    id: string,
    realTxHash?: string,
    permissionStruct?: import('@/context/DemoContext').SpendPermission['permissionStruct'],
    onchainVerified?: boolean,
  ) => void;
  onDecline: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedHash, setConfirmedHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const handleGrantPermission = async () => {
    if (!isConnected || !address) return;

    setIsApproving(true);
    setError(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const allowanceRaw = BigInt(Math.round(item.amount * 1_000_000));

      const permissionArgs = {
        account: address,
        spender: SCOUT_SPENDER_ADDRESS,
        token: USDC_BASE_SEPOLIA,
        allowance: allowanceRaw,
        period: 86400,
        start: now,
        end: now + 3600,
        salt: BigInt(Date.now()),
        extraData: '0x' as `0x${string}`,
      };

      const txHash = await writeContractAsync({
        address: SPEND_PERMISSION_MANAGER_ADDRESS,
        abi: SPEND_PERMISSION_MANAGER_ABI,
        functionName: 'approve',
        args: [permissionArgs],
      });

      const receipt = await waitForTransactionReceipt(walletConfig, { hash: txHash });

      if (receipt.status === 'reverted') {
        setError('Transaction reverted onchain');
        return;
      }

      let onchainVerified = false;
      try {
        const approved = await readContract(walletConfig, {
          address: SPEND_PERMISSION_MANAGER_ADDRESS,
          abi: SPEND_PERMISSION_MANAGER_ABI,
          functionName: 'isApproved',
          args: [permissionArgs],
        });
        onchainVerified = !!approved;
      } catch {}

      const storedStruct = {
        account: permissionArgs.account,
        spender: permissionArgs.spender,
        token: permissionArgs.token,
        allowance: permissionArgs.allowance.toString(),
        period: permissionArgs.period,
        start: permissionArgs.start,
        end: permissionArgs.end,
        salt: permissionArgs.salt.toString(),
        extraData: permissionArgs.extraData,
      };

      setConfirmedHash(txHash);
      onApprove(item.id, txHash, storedStruct, onchainVerified);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Transaction failed';
      if (message.includes('User rejected') || message.includes('user rejected')) {
        setError('Transaction rejected');
      } else {
        setError(message.length > 80 ? message.slice(0, 80) + '…' : message);
      }
    } finally {
      setIsApproving(false);
    }
  };

  const isBusy = isApproving;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, type: "spring", bounce: 0.2 }}
      data-testid={`card-feed-${item.id}`}
      className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] to-transparent p-5 my-2"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.03] via-transparent to-transparent" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2 py-0.5 rounded-md bg-amber-500/12 border border-amber-500/15">
            <span className="text-[9px] font-semibold text-amber-400/90 uppercase tracking-[0.1em]">Spend Permission Request</span>
          </div>
          <TruthBadge type="pending" />
        </div>

        <div className="flex items-start gap-4">
          <AvatarIcon initial={item.merchantInitial} colorClass={item.merchantColor} size="lg" />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[17px] font-semibold text-foreground leading-tight">{item.merchant}</h3>
              <div className="text-right shrink-0 ml-3">
                <span className="text-[22px] font-bold tracking-tight">{item.amountStr}</span>
                <span className="text-[12px] font-medium text-muted-foreground/50">/mo</span>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground/60 leading-relaxed pr-2">
              Scout wants recurring access to real-time market data
            </p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20"
          >
            <p className="text-[11px] text-rose-400">{error}</p>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-3 mt-5 pt-4 border-t border-white/[0.06]"
        >
          {!isConnected ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const connector = connectors[0];
                if (connector) connect({ connector });
              }}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
            >
              Connect wallet to grant
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                data-testid={`button-decline-${item.id}`}
                disabled={isBusy}
                onClick={(e) => { e.stopPropagation(); onDecline(); }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-foreground/70 bg-white/[0.06] hover:bg-white/[0.09] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Decline
              </button>
              <button 
                data-testid={`button-approve-${item.id}`}
                disabled={isBusy}
                onClick={(e) => { e.stopPropagation(); handleGrantPermission(); }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isBusy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Approving…
                  </>
                ) : (
                  'Grant Permission'
                )}
              </button>
            </div>
          )}

          {confirmedHash && (
            <motion.a
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              href={`https://sepolia.basescan.org/tx/${confirmedHash}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-400/80 hover:text-emerald-400 transition-colors"
            >
              <ExternalLink size={10} />
              View on Basescan
            </motion.a>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatusDot({ status }: { status: StatusType }) {
  const config = {
    APPROVED: { color: 'bg-emerald-400', label: 'Approved' },
    AUTO_APPROVED: { color: 'bg-emerald-400/60', label: 'Auto' },
    PENDING: { color: 'bg-amber-400', label: 'Pending' },
    BLOCKED: { color: 'bg-rose-400', label: 'Blocked' },
    DECLINED: { color: 'bg-rose-400', label: 'Declined' },
  };

  const c = config[status];

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className={`w-[5px] h-[5px] rounded-full ${c.color}`} />
      <span className={`text-[10px] font-medium ${status === 'BLOCKED' || status === 'DECLINED' ? 'text-rose-400/60' : 'text-muted-foreground/40'}`}>{c.label}</span>
    </div>
  );
}

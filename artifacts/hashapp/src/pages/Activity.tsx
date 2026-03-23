import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, ExternalLink, ArrowDownUp, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAccount, useWriteContract, useConnect, useWalletClient } from 'wagmi';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { walletConfig } from '@/config/wallet';
import { USE_METAMASK_DELEGATION } from '@/config/delegation';
import { requestDelegatedPermission } from '@/lib/metamaskPermissions';
import { registerDelegation } from '@/lib/delegationAuth';
import { useDemo, type FeedItem, type StatusType, type Thread } from '@/context/DemoContext';
import { AvatarIcon } from '@/components/ui/AvatarIcon';
import { TruthBadge } from '@/components/TruthBadge';
import {
  SPEND_PERMISSION_MANAGER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ABI,
  AGENT_SPENDER_ADDRESS,
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
  const { feed, approvePending, declinePending, threads, connectedAgent, setActiveThreadId, markThreadRead } = useDemo();
  const agentName = connectedAgent?.name ?? 'Your agent';
  const [, setLocation] = useLocation();

  const firstUnreadThread = threads.find((t: Thread) =>
    t.messages.some(m => m.role === 'assistant' && !m.read)
  );
  const lastUnreadMessage = firstUnreadThread?.messages
    .filter(m => m.role === 'assistant' && !m.read)
    .at(-1);

  const groupedFeed = feed.reduce((acc, item) => {
    if (!acc[item.dateGroup]) acc[item.dateGroup] = [];
    acc[item.dateGroup].push(item);
    return acc;
  }, {} as Record<string, FeedItem[]>);

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 pt-12 pb-5 sticky top-0 bg-background/95 backdrop-blur-xl z-10">
        <h1 className="text-[28px] font-bold tracking-tight">Activity</h1>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">Connected activity feed</p>
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
          <div
            onClick={() => {
              setActiveThreadId(firstUnreadThread.id);
              markThreadRead(firstUnreadThread.id);
              setLocation('/agent');
            }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-colors hover:bg-[rgba(100,80,255,0.08)] active:bg-[rgba(100,80,255,0.12)]"
            style={{
              background: 'rgba(100,80,255,0.05)',
              borderLeft: '3px solid rgba(100,80,255,0.4)',
            }}
          >
            <div className="w-[28px] h-[28px] rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white text-[11px] font-semibold">
              {agentName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">
                {agentName} wants to discuss a purchase
              </p>
              <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">
                {lastUnreadMessage.content.slice(0, 40)}{lastUnreadMessage.content.length > 40 ? '…' : ''}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider shrink-0"
              style={{ background: 'rgba(100,80,255,0.12)', border: '0.5px solid rgba(100,80,255,0.28)', color: '#AFA9EC' }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: '#7F77DD' }} />
              Venice
            </span>
            <span className="text-[9px] text-muted-foreground/30 shrink-0">
              {new Date(lastUnreadMessage.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
            <ChevronRight size={12} className="text-muted-foreground/20 shrink-0" />
          </div>
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
    delegationFields?: {
      permissionsContext: `0x${string}`;
      delegationManager: `0x${string}`;
      spendToken?: string;
    },
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
    if (item.isDelegation) {
      badgeType = 'onchain';
    } else if (item.isReal && item.txHash) {
      badgeType = item.onchainVerified === true ? 'onchain' : 'pending';
    } else {
      badgeType = 'demo';
    }
  }

  const isSwap = item.type === 'SWAP';

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
      {isSwap ? (
        <div className="w-10 h-10 rounded-full bg-pink-500/15 flex items-center justify-center shrink-0">
          <ArrowDownUp size={16} className="text-pink-400" />
        </div>
      ) : (
        <AvatarIcon initial={item.merchantInitial} colorClass={item.merchantColor} size="md" className={isBlocked ? 'opacity-60' : ''} />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`text-[14px] font-semibold truncate pr-3 ${isBlocked ? 'text-foreground/50' : 'text-foreground'}`}>
            {isSwap ? 'Swap' : item.merchant}
          </h3>
          <span className={`text-[14px] font-semibold tabular-nums shrink-0 ${isBlocked ? 'text-muted-foreground/35 line-through decoration-rose-500/40' : 'text-foreground'}`}>
            {item.amountStr}
          </span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <p className={`text-[11px] truncate leading-relaxed ${isBlocked ? 'text-muted-foreground/35' : 'text-muted-foreground/50'}`}>{item.intent}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {item.swapTxHash && !isSwap && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider bg-pink-500/10 border border-pink-500/20 text-pink-400/80">
                <ArrowDownUp size={7} />
                Uniswap
              </span>
            )}
            {badgeType && <TruthBadge type={badgeType} txHash={item.txHash} />}
            <StatusDot status={item.status} />
          </div>
        </div>
        {isSwap && item.swapDetails && isApprovedOrAuto && (
          <div className="flex gap-3 mt-1.5 text-[9px] text-muted-foreground/35">
            <span>Rate: 1 {item.swapDetails.tokenInSymbol} = {item.swapDetails.exchangeRate} {item.swapDetails.tokenOutSymbol}</span>
            <span>Gas: ${parseFloat(item.swapDetails.gasCostUSD).toFixed(4)}</span>
            {item.swapDetails.priceImpact !== undefined && (
              <span>Impact: {item.swapDetails.priceImpact.toFixed(2)}%</span>
            )}
          </div>
        )}
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
    delegationFields?: {
      permissionsContext: `0x${string}`;
      delegationManager: `0x${string}`;
      spendToken?: string;
    },
  ) => void;
  onDecline: () => void;
}) {
  const { connectedAgent } = useDemo();
  const agentName = connectedAgent?.name ?? 'Your agent';
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { data: walletClient } = useWalletClient();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedHash, setConfirmedHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const handleGrantDelegation = async () => {
    if (!isConnected || !address || !walletClient) return;

    setIsApproving(true);
    setError(null);

    try {
      const result = await requestDelegatedPermission(item.amount);

      const signMessage = async (args: { message: string }) => {
        return walletClient.signMessage({ message: args.message, account: address });
      };

      const authResult = await registerDelegation(result.permissionsContext, address, signMessage);

      onApprove(item.id, undefined, undefined, true, {
        permissionsContext: result.permissionsContext,
        delegationManager: result.delegationManager,
        spendToken: authResult.spendToken,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Delegation request failed';
      if (message.includes('User rejected') || message.includes('user rejected')) {
        setError('Request rejected');
      } else {
        setError(message.length > 80 ? message.slice(0, 80) + '…' : message);
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleGrantPermissionCoinbase = async () => {
    if (!isConnected || !address) return;

    setIsApproving(true);
    setError(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const allowanceRaw = BigInt(Math.round(item.amount * 1_000_000));

      const permissionArgs = {
        account: address,
        spender: AGENT_SPENDER_ADDRESS,
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

  const handleGrantPermission = USE_METAMASK_DELEGATION
    ? handleGrantDelegation
    : handleGrantPermissionCoinbase;

  const isBusy = isApproving;

  const buttonLabel = USE_METAMASK_DELEGATION ? 'Grant Delegation' : 'Grant Permission';

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
            <span className="text-[9px] font-semibold text-amber-400/90 uppercase tracking-[0.1em]">
              {USE_METAMASK_DELEGATION ? 'Delegation Request' : 'Spend Permission Request'}
            </span>
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
              {USE_METAMASK_DELEGATION
                ? `${agentName} wants delegated periodic USDC authority for real-time market data`
                : `${agentName} wants recurring access to real-time market data`}
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
                    {USE_METAMASK_DELEGATION ? 'Requesting…' : 'Approving…'}
                  </>
                ) : (
                  buttonLabel
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

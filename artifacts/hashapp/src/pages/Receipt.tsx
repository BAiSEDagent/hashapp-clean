import { useState } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { X, ExternalLink, Loader2, Zap, MessageCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTransactionReceipt, useBlock, useReadContract } from 'wagmi';
import { useDemo } from '@/context/DemoContext';
import { USE_METAMASK_DELEGATION, SCOUT_SESSION_ADDRESS } from '@/config/delegation';
import { executeDelegationSpend } from '@/lib/delegationSpend';
import {
  SPEND_PERMISSION_MANAGER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ABI,
} from '@/config/spendPermission';
import { AvatarIcon } from '@/components/ui/AvatarIcon';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TruthBadge } from '@/components/TruthBadge';

export default function Receipt() {
  const [, params] = useRoute('/receipt/:id');
  const { feed, spendPermissions, recordDelegationSpend, threads, activeThreadId, setActiveThreadId, linkThreadToTx } = useDemo();
  const [, setLocation] = useLocation();
  const [isSpending, setIsSpending] = useState(false);
  const [spendError, setSpendError] = useState<string | null>(null);
  const [spendTxHash, setSpendTxHash] = useState<string | null>(null);
  
  const item = feed.find(f => f.id === params?.id);

  const txHash = item?.txHash as `0x${string}` | undefined;

  const { data: txReceipt } = useTransactionReceipt({
    hash: txHash,
    chainId: 84532,
    query: { enabled: !!txHash },
  });

  const { data: block } = useBlock({
    blockNumber: txReceipt?.blockNumber,
    chainId: 84532,
    query: { enabled: !!txReceipt?.blockNumber },
  });

  const linkedPerm = item
    ? spendPermissions.find(p =>
        (p.isDelegation && p.permissionsContext && (p.permissionsContext === item.permissionsContext)) ||
        (p.txHash && p.txHash === item.txHash)
      )
    : undefined;
  const permStruct = linkedPerm?.permissionStruct;
  const isDelegation = USE_METAMASK_DELEGATION && (item?.isDelegation || linkedPerm?.isDelegation);

  const delegationContext = item?.permissionsContext || linkedPerm?.permissionsContext;
  const delegationMgr = item?.delegationManager || linkedPerm?.delegationManager;
  const delegationSpendToken = item?.spendToken || linkedPerm?.spendToken;
  const canSpend = isDelegation && !!delegationContext && !!delegationMgr && !!delegationSpendToken && !spendTxHash;

  const handleDelegatedSpend = async () => {
    if (!delegationContext || !delegationMgr || !delegationSpendToken) return;
    setIsSpending(true);
    setSpendError(null);
    try {
      if (import.meta.env.DEV) {
        console.log('[Spend] Triggering delegated spend...', {
          permissionsContext: delegationContext.slice(0, 20) + '...',
          delegationManager: delegationMgr,
          recipient: SCOUT_SESSION_ADDRESS,
          amountUsdc: 5,
        });
      }
      const result = await executeDelegationSpend({
        permissionsContext: delegationContext,
        delegationManager: delegationMgr,
        amountUsdc: 5,
        recipient: SCOUT_SESSION_ADDRESS,
        spendToken: delegationSpendToken,
      });
      if (import.meta.env.DEV) {
        console.log('[Spend] Success! txHash:', result.txHash);
      }
      setSpendTxHash(result.txHash);
      if (linkedPerm) {
        recordDelegationSpend(linkedPerm.id, result.txHash);
      }
      if (activeThreadId) {
        linkThreadToTx(activeThreadId, result.txHash);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Delegated spend failed';
      console.error('[Spend] Error:', message);
      setSpendError(message.length > 120 ? message.slice(0, 120) + '…' : message);
    } finally {
      setIsSpending(false);
    }
  };

  const { data: isApprovedLive } = useReadContract({
    address: SPEND_PERMISSION_MANAGER_ADDRESS,
    abi: SPEND_PERMISSION_MANAGER_ABI,
    functionName: 'isApproved',
    args: permStruct ? [{
      account: permStruct.account,
      spender: permStruct.spender,
      token: permStruct.token,
      allowance: BigInt(permStruct.allowance),
      period: permStruct.period,
      start: permStruct.start,
      end: permStruct.end,
      salt: BigInt(permStruct.salt),
      extraData: permStruct.extraData,
    }] : undefined,
    chainId: 84532,
    query: { enabled: !isDelegation && !!permStruct && !!item?.isReal },
  });

  if (!item) return <div className="p-8 text-center mt-20 text-muted-foreground">Receipt not found</div>;

  const isBlocked = item.status === 'BLOCKED' || item.status === 'DECLINED';
  const hasRealProof = item.isReal && item.txHash;
  const isApprovedOrAuto = item.status === 'APPROVED' || item.status === 'AUTO_APPROVED';

  let onchainVerified: boolean | undefined;
  if (isDelegation) {
    onchainVerified = true;
  } else {
    onchainVerified = isApprovedLive ?? item.onchainVerified;
  }

  const confirmedAt = block?.timestamp
    ? new Date(Number(block.timestamp) * 1000).toLocaleString()
    : null;

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
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors">
            <X size={20} className="text-foreground/80" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col items-center">
          <AvatarIcon 
            initial={item.merchantInitial} 
            colorClass={item.merchantColor} 
            size="xl" 
            className="mb-4 shadow-2xl"
          />
          
          <h2 className="text-[16px] font-medium text-muted-foreground/60 mb-3">{item.merchant}</h2>
          <h1 className="text-[48px] font-bold tracking-tighter text-foreground leading-none mb-5">
            {item.amountStr}
          </h1>

          <div className={`px-4 py-1.5 rounded-full text-[12px] font-medium mb-4 flex items-center gap-2
            ${isBlocked ? 'bg-rose-500/8 text-rose-400/80 border border-rose-500/10' : 
              item.status === 'PENDING' ? 'bg-amber-500/8 text-amber-400/80 border border-amber-500/10' : 
              'bg-emerald-500/8 text-emerald-400/80 border border-emerald-500/10'}
          `}>
            <div className={`w-[5px] h-[5px] rounded-full 
              ${isBlocked ? 'bg-rose-400' : 
                item.status === 'PENDING' ? 'bg-amber-400' : 
                'bg-emerald-400'}
            `} />
            {item.statusMessage}
          </div>

          {isApprovedOrAuto && (
            <div className="mb-8">
              <TruthBadge
                type={
                  isDelegation
                    ? 'onchain'
                    : hasRealProof
                      ? (onchainVerified === true ? 'onchain' : 'pending')
                      : 'demo'
                }
                txHash={item.txHash}
              />
            </div>
          )}

          {item.status === 'PENDING' && (
            <div className="mb-8">
              <TruthBadge type="pending" />
            </div>
          )}

          <div className="w-full bg-card rounded-2xl p-5 border border-border/30 space-y-0">
            <DetailRow label="Date & Time" value={`${item.dateGroup === 'TODAY' ? 'Today' : item.dateGroup === 'YESTERDAY' ? 'Yesterday' : item.dateGroup} at ${item.timestamp}`} />
            <DetailRow label="Category" value={item.category} />
            <div className="flex flex-col gap-1.5 py-4 border-t border-white/[0.05]">
              <span className="text-[11px] text-muted-foreground/40 font-medium">Stated Purpose</span>
              <span className="text-[12px] text-foreground/90 font-medium leading-relaxed">{item.intent}</span>
            </div>
            <DetailRow 
              label="Approval" 
              value={item.status === 'AUTO_APPROVED' ? 'Auto-approved' : item.status === 'APPROVED' ? 'Human-approved' : item.status === 'BLOCKED' ? 'Blocked by rule' : item.status === 'DECLINED' ? 'Declined' : 'Pending'} 
            />
            {isDelegation && (
              <DetailRow label="Authority" value="MetaMask Delegation (ERC-7710)" />
            )}
            <div className="flex items-center justify-between py-4 border-t border-white/[0.05]">
              <span className="text-[11px] text-muted-foreground/40 font-medium">
                {isBlocked ? 'Requested by' : 'Authorized by'}
              </span>
              <div className="flex items-center gap-2">
                <AgentAvatar size="sm" />
                <div className="text-right">
                  <span className="text-[12px] font-medium block">Scout</span>
                  <span className="text-[9px] text-muted-foreground/30 font-mono tracking-wide">scout.base.eth</span>
                </div>
              </div>
            </div>

            {hasRealProof && (
              <>
                <DetailRow label="Network" value="Base Sepolia" />
                {txReceipt && (
                  <DetailRow label="Block" value={txReceipt.blockNumber.toString()} />
                )}
                {confirmedAt && (
                  <DetailRow label="Confirmed" value={confirmedAt} />
                )}
                <div className="flex items-center justify-between py-4 border-t border-white/[0.05]">
                  <span className="text-[11px] text-muted-foreground/40 font-medium">Transaction</span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[11px] font-medium text-emerald-400/80 hover:text-emerald-400 transition-colors"
                  >
                    {item.txHash!.slice(0, 10)}...{item.txHash!.slice(-6)}
                    <ExternalLink size={9} />
                  </a>
                </div>
              </>
            )}
          </div>

          {(() => {
            const linkedThread = item.txHash
              ? threads.find(t => t.txHash === item.txHash)
              : undefined;
            if (!linkedThread) return null;
            return (
              <div
                onClick={() => {
                  setActiveThreadId(linkedThread.id);
                  setLocation('/agent');
                }}
                className="w-full mt-4 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-colors hover:bg-[rgba(100,80,255,0.08)] active:bg-[rgba(100,80,255,0.12)]"
                style={{
                  background: 'rgba(100,80,255,0.06)',
                  border: '0.5px solid rgba(100,80,255,0.20)',
                }}
              >
                <MessageCircle size={16} style={{ color: '#AFA9EC' }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-foreground">View reasoning</span>
                </div>
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider shrink-0"
                  style={{ background: 'rgba(100,80,255,0.12)', border: '0.5px solid rgba(100,80,255,0.28)', color: '#AFA9EC' }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ background: '#7F77DD' }} />
                  Venice
                </span>
                <span className="text-[10px] text-muted-foreground/40 shrink-0">{linkedThread.messages.length} messages</span>
                <ChevronRight size={12} className="text-muted-foreground/20 shrink-0" />
              </div>
            );
          })()}

          {canSpend && (
            <div className="w-full mt-6 space-y-3">
              <button
                onClick={handleDelegatedSpend}
                disabled={isSpending}
                className="w-full py-3 rounded-xl text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isSpending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Executing spend…
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Test Delegated Spend ($5 USDC)
                  </>
                )}
              </button>
              <p className="text-[10px] text-muted-foreground/40 text-center">
                Redeems $5 USDC from the granted delegation via Scout session key
              </p>
            </div>
          )}

          {spendError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
            >
              <p className="text-[11px] text-rose-400 break-all">{spendError}</p>
            </motion.div>
          )}

          {spendTxHash && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-4 space-y-2"
            >
              <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[12px] text-emerald-400 font-medium mb-1">Delegated spend executed!</p>
                <a
                  href={`https://sepolia.basescan.org/tx/${spendTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400/80 hover:text-emerald-400 transition-colors"
                >
                  <ExternalLink size={10} />
                  {spendTxHash.slice(0, 14)}...{spendTxHash.slice(-6)} — View on BaseScan
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-t border-white/[0.05] first:border-t-0 first:pt-0">
      <span className="text-[11px] text-muted-foreground/40 font-medium">{label}</span>
      <span className="text-[12px] text-foreground/90 font-medium text-right">{value}</span>
    </div>
  );
}

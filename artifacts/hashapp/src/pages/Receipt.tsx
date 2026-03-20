import { useRoute, Link } from 'wouter';
import { X, ExternalLink, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTransactionReceipt, useBlock, useReadContract } from 'wagmi';
import { useDemo } from '@/context/DemoContext';
import { USE_METAMASK_DELEGATION } from '@/config/delegation';
import {
  SPEND_PERMISSION_MANAGER_ADDRESS,
  SPEND_PERMISSION_MANAGER_ABI,
} from '@/config/spendPermission';
import { AvatarIcon } from '@/components/ui/AvatarIcon';
import { AgentAvatar } from '@/components/AgentAvatar';
import { TruthBadge } from '@/components/TruthBadge';

export default function Receipt() {
  const [, params] = useRoute('/receipt/:id');
  const { feed, spendPermissions, connectedAgent } = useDemo();
  
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

  if (!item) return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-background">
      <div className="w-full max-w-[430px] bg-background h-full flex flex-col relative">
        <div className="flex items-center justify-between p-6">
          <Link href="/activity" className="p-2 -ml-2 rounded-full hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors">
            <X size={20} className="text-foreground/80" />
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div className="w-14 h-14 rounded-full bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center mb-4">
            <Eye size={20} className="text-zinc-500" />
          </div>
          <p className="text-[15px] font-medium text-muted-foreground/60 mb-1">Receipt not found</p>
          <p className="text-[12px] text-muted-foreground/30">This transaction may have been removed.</p>
        </div>
      </div>
    </div>
  );

  const isBlocked = item.status === 'BLOCKED' || item.status === 'DECLINED';
  const hasRealProof = item.isReal && item.txHash;
  const isApprovedOrAuto = item.status === 'APPROVED' || item.status === 'AUTO_APPROVED';

  const onchainVerified = isDelegation ? undefined : (isApprovedLive ?? item.onchainVerified);

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
          <Link href="/activity" className="p-2 -ml-2 rounded-full hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors">
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
                    ? 'delegation'
                    : hasRealProof
                      ? (onchainVerified === true ? 'onchain' : 'pending')
                      : 'demo'
                }
                txHash={item.txHash}
                expiresAt={item.delegationExpiry}
                showCaveat={isDelegation}
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
                  <span className="text-[12px] font-medium block">{connectedAgent?.name ?? 'Agent'}</span>
                  {connectedAgent?.address ? (
                    <span className="text-[9px] text-muted-foreground/30 font-mono tracking-wide">{connectedAgent.address}</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/20">Demo agent</span>
                  )}
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

          {item.privateReasoningUsed && (
            <div className="w-full bg-card rounded-2xl p-5 border border-violet-500/15 mt-4 space-y-0">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={12} className="text-violet-400/60" />
                <span className="text-[10px] font-semibold text-violet-400/60 uppercase tracking-[0.15em]">Reasoning Provenance</span>
              </div>
              <DetailRow label="Provider" value={`Private analysis via ${item.reasoningProvider || 'Venice'}`} />
              {item.reasonSummary && (
                <div className="flex flex-col gap-1.5 py-4 border-t border-white/[0.05]">
                  <span className="text-[11px] text-muted-foreground/40 font-medium">Reason summary</span>
                  <span className="text-[12px] text-foreground/80 font-medium leading-relaxed">{item.reasonSummary}</span>
                </div>
              )}
              {item.disclosureSummary && (
                <div className="flex flex-col gap-1.5 py-4 border-t border-white/[0.05]">
                  <span className="text-[11px] text-muted-foreground/40 font-medium">Disclosure summary</span>
                  <span className="text-[12px] text-foreground/80 font-medium leading-relaxed">{item.disclosureSummary}</span>
                </div>
              )}
            </div>
          )}

          {isDelegation && (
            <div className="w-full mt-6 px-4 py-3 rounded-xl bg-card border border-border/30 flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium text-foreground">Manage delegated spend in Activity</p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                  Activity is the canonical control surface for allowed and blocked delegated spend tests.
                </p>
              </div>
              <Link href="/activity" className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors">
                Open Activity
              </Link>
            </div>
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

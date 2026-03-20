import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, ExternalLink, ArrowDownUp, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAccount, useWriteContract, useWalletClient } from 'wagmi';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { walletConfig } from '@/config/wallet';
import { USE_METAMASK_DELEGATION, DELEGATION_CHAIN_ID } from '@/config/delegation';
import { requestDelegatedPermission } from '@/lib/metamaskPermissions';
import { registerDelegation } from '@/lib/delegationAuth';
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
  const { feed, approvePending, declinePending, connectedAgent, spendPermissions, recordDelegationSpend, recordDelegationSpendBlocked } = useDemo();
  const { isConnected } = useAccount();
  const [, setLocation] = useLocation();

  const pendingItem = feed.find(item => item.status === 'PENDING');
  const activeDelegationPermission = spendPermissions.find(
    permission => permission.isDelegation && permission.vendor === 'DataStream Pro' && permission.state === 'active',
  );
  const [demoActionState, setDemoActionState] = useState<'idle' | 'allowed-running' | 'blocked-running'>('idle');
  const [demoActionError, setDemoActionError] = useState<string | null>(null);
  const recentDelegationItem = feed.find(
    item => item.isDelegation && item.merchant === 'DataStream Pro' && (item.status === 'APPROVED' || item.status === 'AUTO_APPROVED'),
  );

  const shouldShowDelegationControl = USE_METAMASK_DELEGATION && isConnected;
  const stableDelegationItem: FeedItem | null = shouldShowDelegationControl
    ? (
        pendingItem
        ?? (activeDelegationPermission ? {
          id: 'delegation-control',
          dateGroup: 'TODAY',
          merchant: 'DataStream Pro',
          merchantColor: 'bg-purple-600',
          merchantInitial: 'D',
          amount: 89.0,
          amountStr: '$89.00',
          intent: `${connectedAgent?.name ?? 'Agent'} has delegated periodic USDC authority for real-time market data from DataStream Pro`,
          status: 'APPROVED',
          statusMessage: 'Delegation active',
          timestamp: 'Now',
          category: 'Data Services',
          isDelegation: true,
          isReal: true,
          txHash: recentDelegationItem?.txHash,
          delegationExpiry: activeDelegationPermission.delegationExpiry,
        } : {
          id: 'delegation-control',
          dateGroup: 'TODAY',
          merchant: 'DataStream Pro',
          merchantColor: 'bg-purple-600',
          merchantInitial: 'D',
          amount: 89.0,
          amountStr: '$89.00',
          intent: `${connectedAgent?.name ?? 'Agent'} is requesting a recurring spend permission — $89 USDC/mo for real-time market data from DataStream Pro`,
          status: 'PENDING',
          statusMessage: 'Spend permission · needs approval',
          timestamp: 'Now',
          category: 'Data Services',
        })
      )
    : null;

  const historyFeed = stableDelegationItem ? feed.filter(item => item.id !== stableDelegationItem.id) : feed;

  const groupedFeed = historyFeed.reduce((acc, item) => {
    if (!acc[item.dateGroup]) acc[item.dateGroup] = [];
    acc[item.dateGroup].push(item);
    return acc;
  }, {} as Record<string, FeedItem[]>);

  const runDelegatedSpendDemo = async (amountUsdc: string, mode: 'allowed' | 'blocked') => {
    if (!activeDelegationPermission?.permissionsContext || !activeDelegationPermission.delegationManager || !activeDelegationPermission.spendToken) {
      setDemoActionError('Grant delegation first. No active delegated permission is available yet.');
      return;
    }

    setDemoActionError(null);
    setDemoActionState(mode === 'allowed' ? 'allowed-running' : 'blocked-running');

    try {
      const response = await fetch('/api/delegation/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionsContext: activeDelegationPermission.permissionsContext,
          delegationManager: activeDelegationPermission.delegationManager,
          tokenAddress: USDC_BASE_SEPOLIA,
          amountUsdc,
          recipient: '0xbf8bfde4b42baa2f4377b8ebc5d2602d3080a4d4',
          spendToken: activeDelegationPermission.spendToken,
          idempotencyKey: `${mode}-${Date.now()}`,
        }),
      });

      const body = await response.json().catch(() => ({ error: 'Delegated spend failed' }));

      if (!response.ok) {
        const rawReason = body.error || 'Delegated spend failed';
        const reason = rawReason === 'Transaction reverted onchain'
          ? 'Blocked by delegated spend limit'
          : rawReason;
        recordDelegationSpendBlocked(activeDelegationPermission.id, Number(amountUsdc), reason, 'DataStream Pro');
        setDemoActionError(reason);
        return;
      }

      recordDelegationSpend(activeDelegationPermission.id, body.txHash, Number(amountUsdc), 'DataStream Pro');
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Delegated spend failed';
      const message = rawMessage === 'Transaction reverted onchain'
        ? 'Blocked by delegated spend limit'
        : rawMessage;
      recordDelegationSpendBlocked(activeDelegationPermission.id, Number(amountUsdc), message, 'DataStream Pro');
      setDemoActionError(message);
    } finally {
      setDemoActionState('idle');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 pt-12 pb-5 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-xl z-10">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Activity</h1>
          {connectedAgent ? (
            <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-mono tracking-wide">{connectedAgent.address}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground/30 mt-0.5">No agent connected</p>
          )}
        </div>
        <div className="relative">
          <AgentAvatar size="sm" />
          {connectedAgent && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
          )}
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
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center bg-emerald-500 shadow-sm">
                  <ShieldCheck size={9} className="text-white" />
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
        {stableDelegationItem && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-[0.2em] pl-1 mb-2">
                Active Delegation
              </h2>
              {stableDelegationItem.status === 'PENDING' ? (
                <PendingCard
                  item={stableDelegationItem}
                  onApprove={approvePending}
                  onDecline={() => declinePending(stableDelegationItem.id)}
                />
              ) : (
                <FeedCard
                  item={stableDelegationItem}
                  isLast
                  onApprove={approvePending}
                  onDecline={() => declinePending(stableDelegationItem.id)}
                  onClick={() => stableDelegationItem.id !== 'delegation-control' && setLocation(`/receipt/${stableDelegationItem.id}`)}
                />
              )}
            </div>

            {activeDelegationPermission && (
              <div className="rounded-2xl border border-white/[0.06] bg-card/70 px-4 py-4">
                <div className="mb-3">
                  <h3 className="text-[13px] font-semibold text-foreground">Delegated Spend Tests</h3>
                  <p className="text-[11px] text-muted-foreground/45 mt-0.5">
                    Test one spend within scope and one that exceeds delegated authority.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => void runDelegatedSpendDemo('5', 'allowed')}
                    disabled={demoActionState !== 'idle'}
                    className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {demoActionState === 'allowed-running' ? <><Loader2 size={14} className="animate-spin" /> Requesting…</> : 'Run $5 spend'}
                  </button>
                  <button
                    onClick={() => void runDelegatedSpendDemo('150', 'blocked')}
                    disabled={demoActionState !== 'idle'}
                    className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all bg-rose-500/12 text-rose-300 border border-rose-500/20 hover:bg-rose-500/18 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {demoActionState === 'blocked-running' ? <><Loader2 size={14} className="animate-spin" /> Requesting…</> : 'Run $150 blocked spend'}
                  </button>
                </div>

                {demoActionError && (
                  <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2">
                    <p className="text-[11px] text-rose-300/90">{demoActionError}</p>
                  </div>
                )}
              </div>
            )}
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

type VeniceFields = {
  privateReasoningUsed: boolean;
  reasoningProvider: string;
  reasonSummary: string;
  disclosureSummary: string;
  demo?: boolean;
  failed?: boolean;
};

type ApproveHandler = (
  id: string,
  realTxHash?: string,
  permissionStruct?: import('@/context/DemoContext').SpendPermission['permissionStruct'],
  onchainVerified?: boolean,
  delegationFields?: {
    permissionsContext: `0x${string}`;
    delegationManager: `0x${string}`;
    spendToken?: string;
    delegationExpiry?: number;
  },
  veniceFields?: VeniceFields,
) => void;

function FeedCard({ 
  item, 
  isLast,
  onApprove, 
  onDecline,
  onClick
}: { 
  item: FeedItem; 
  isLast: boolean;
  onApprove: ApproveHandler;
  onDecline: () => void;
  onClick: () => void;
}) {
  const { privateReasoningEnabled } = useDemo();
  const isPending = item.status === 'PENDING';
  const isBlocked = item.status === 'BLOCKED' || item.status === 'DECLINED';
  const isApprovedOrAuto = item.status === 'APPROVED' || item.status === 'AUTO_APPROVED';

  if (isPending) {
    return <PendingCard item={item} onApprove={onApprove} onDecline={onDecline} />;
  }

  let badgeType: 'onchain' | 'demo' | 'pending' | 'delegation' | null = null;
  if (isApprovedOrAuto) {
    if (item.isDelegation) {
      badgeType = 'delegation';
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
          <h3 className={`text-[14px] font-semibold truncate pr-3 ${isBlocked ? 'text-rose-300/90' : 'text-foreground'}`}>
            {isSwap ? 'Swap' : item.merchant}
          </h3>
          <span className={`text-[14px] font-semibold tabular-nums shrink-0 ${isBlocked ? 'text-rose-300/85 line-through decoration-rose-400/70' : 'text-foreground'}`}>
            {item.amountStr}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className={`text-[11px] truncate leading-relaxed flex-1 min-w-0 ${isBlocked ? 'text-rose-200/55' : 'text-muted-foreground/50'}`}>{item.intent}</p>
          <StatusDot status={item.status} />
        </div>
        {(item.privateReasoningUsed || badgeType) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {item.privateReasoningUsed && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-500/8 border border-violet-500/10 text-[8px] font-medium text-violet-400/70 uppercase tracking-[0.06em]">
                <Eye size={7} className="opacity-70" />
                Venice
              </span>
            )}
            {badgeType && <TruthBadge type={badgeType} txHash={item.txHash} expiresAt={item.delegationExpiry} />}
          </div>
        )}
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

async function callVeniceAnalyze(item: FeedItem): Promise<VeniceFields> {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
  const agentToken = import.meta.env.VITE_AGENT_API_TOKEN || import.meta.env.VITE_SCOUT_API_TOKEN || '';
  const prompt = `Privately review a spend request for ${item.merchant} costing ${item.amountStr} in the category "${item.category}". Evaluate whether this purchase is reasonable, assess vendor pricing, and identify any risk factors.`;

  try {
    const res = await fetch(`${API_BASE}/venice/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(agentToken ? { 'Authorization': `Bearer ${agentToken}` } : {}),
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Venice call failed' }));
      throw new Error(body.error || `Venice returned ${res.status}`);
    }

    const data = await res.json();
    return {
      privateReasoningUsed: true,
      reasoningProvider: data.provider || 'Venice',
      reasonSummary: data.summary,
      disclosureSummary: `Vendor, amount, and settlement proof are public. Purchase evaluation inputs and risk assessment remained private.${data.demo ? ' (demo — VENICE_API_KEY not configured)' : ''}`,
      demo: !!data.demo,
    };
  } catch (e) {
    console.error('[Venice] Analysis failed:', e);
    return {
      privateReasoningUsed: true,
      reasoningProvider: 'Venice',
      reasonSummary: '',
      disclosureSummary: '',
      failed: true,
    };
  }
}

function PendingCard({
  item,
  onApprove,
  onDecline,
}: {
  item: FeedItem;
  onApprove: ApproveHandler;
  onDecline: () => void;
}) {
  const { connectedAgent, privateReasoningEnabled } = useDemo();
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isApproving, setIsApproving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [approvalPhase, setApprovalPhase] = useState<'idle' | 'analyzing' | 'requesting' | 'confirming' | 'finalizing'>('idle');
  const [approvalCooldown, setApprovalCooldown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedHash, setConfirmedHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const runVeniceIfEnabled = async (): Promise<VeniceFields | undefined> => {
    if (!privateReasoningEnabled) return undefined;
    setApprovalPhase('analyzing');
    setIsAnalyzing(true);
    try {
      return await callVeniceAnalyze(item);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const wrongNetworkReason = isConnected && chainId !== DELEGATION_CHAIN_ID
    ? 'Wrong network. Switch to Base Sepolia to continue.'
    : null;

  const delegationUnavailableReason = !isConnected
    ? 'Wallet not connected'
    : wrongNetworkReason
      ? wrongNetworkReason
      : !window.ethereum
        ? 'MetaMask not detected. Please install MetaMask Flask 13.5.0+.'
        : !walletClient
          ? 'Waiting for wallet...'
          : null;

  const handleGrantDelegation = async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask Flask 13.5.0+.');
      return;
    }

    if (!walletClient) {
      setError('Waiting for wallet...');
      return;
    }

    setIsApproving(true);
    setError(null);
    setApprovalPhase(privateReasoningEnabled ? 'analyzing' : 'requesting');

    try {
      const veniceResult = await runVeniceIfEnabled();

      setApprovalPhase('requesting');
      const result = await requestDelegatedPermission(item.amount);

      const signMessage = async (args: { message: string }) => {
        return walletClient.signMessage({ message: args.message, account: address });
      };

      setApprovalPhase('finalizing');
      const authResult = await registerDelegation(result.permissionsContext, address, signMessage);

      onApprove(item.id, undefined, undefined, undefined, {
        permissionsContext: result.permissionsContext,
        delegationManager: result.delegationManager,
        spendToken: authResult.spendToken,
        delegationExpiry: result.expiry,
      }, veniceResult);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Delegation request failed';
      if (message.includes('User rejected') || message.includes('user rejected')) {
        setError('Request rejected');
      } else {
        setError(message.length > 80 ? message.slice(0, 80) + '…' : message);
      }
    } finally {
      setIsApproving(false);
      setApprovalPhase('idle');
    }
  };

  const handleGrantPermissionCoinbase = async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    if (wrongNetworkReason) {
      setError(wrongNetworkReason);
      return;
    }

    setIsApproving(true);
    setError(null);
    setApprovalPhase(privateReasoningEnabled ? 'analyzing' : 'requesting');

    try {
      const veniceResult = await runVeniceIfEnabled();

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

      setApprovalPhase('requesting');
      const txHash = await writeContractAsync({
        address: SPEND_PERMISSION_MANAGER_ADDRESS,
        abi: SPEND_PERMISSION_MANAGER_ABI,
        functionName: 'approve',
        args: [permissionArgs],
      });

      setApprovalPhase('confirming');
      const receipt = await waitForTransactionReceipt(walletConfig, { hash: txHash });

      if (receipt.status === 'reverted') {
        setError('Transaction reverted onchain');
        return;
      }

      setApprovalPhase('finalizing');
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
      onApprove(item.id, txHash, storedStruct, onchainVerified, undefined, veniceResult);
      setApprovalCooldown(true);
      window.setTimeout(() => setApprovalCooldown(false), 4000);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Transaction failed';
      if (message.includes('User rejected') || message.includes('user rejected')) {
        setError('Transaction rejected');
      } else {
        setError(message.length > 80 ? message.slice(0, 80) + '…' : message);
      }
    } finally {
      setIsApproving(false);
      setApprovalPhase('idle');
    }
  };

  const handleGrantPermission = USE_METAMASK_DELEGATION
    ? handleGrantDelegation
    : handleGrantPermissionCoinbase;

  const isBusy = isApproving || isAnalyzing || approvalCooldown;

  const buttonLabel = USE_METAMASK_DELEGATION ? 'Grant Delegation' : 'Grant Permission';
  const activeButtonLabel = approvalPhase === 'analyzing'
    ? 'Analyzing…'
    : approvalPhase === 'requesting'
      ? USE_METAMASK_DELEGATION ? 'Requesting in MetaMask…' : 'Requesting approval…'
      : approvalPhase === 'confirming'
        ? 'Confirming onchain…'
        : approvalPhase === 'finalizing'
          ? USE_METAMASK_DELEGATION ? 'Finalizing delegation…' : 'Finalizing permission…'
          : approvalCooldown
            ? USE_METAMASK_DELEGATION ? 'Delegation granted' : 'Permission granted'
            : buttonLabel;

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
                ? `${connectedAgent?.name ?? 'Agent'} wants delegated periodic USDC authority for real-time market data`
                : `${connectedAgent?.name ?? 'Agent'} wants recurring access to real-time market data`}
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
          <div className="flex gap-3">
            <button 
              data-testid={`button-decline-${item.id}`}
              disabled={isBusy}
              onClick={(e) => { e.stopPropagation(); onDecline(); }}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-foreground/70 bg-white/[0.06] hover:bg-white/[0.09] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Decline
            </button>
            {isConnected ? (
              <button 
                data-testid={`button-approve-${item.id}`}
                disabled={isBusy || (!!USE_METAMASK_DELEGATION && !!delegationUnavailableReason)}
                onClick={(e) => { e.stopPropagation(); handleGrantPermission(); }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isBusy ? (
                  <>
                    <Loader2 size={14} className={approvalCooldown ? '' : 'animate-spin'} />
                    {activeButtonLabel}
                  </>
                ) : delegationUnavailableReason ? (
                  'Grant Delegation'
                ) : (
                  buttonLabel
                )}
              </button>
            ) : (
              <button 
                data-testid={`button-approve-${item.id}`}
                disabled={isBusy}
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsApproving(true);
                  setError(null);
                  try {
                    const veniceResult = await runVeniceIfEnabled();
                    onApprove(item.id, undefined, undefined, undefined, undefined, veniceResult);
                  } catch {
                    setError('Approval failed');
                  } finally {
                    setIsApproving(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isBusy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {isAnalyzing ? 'Analyzing…' : 'Approving…'}
                  </>
                ) : (
                  'Approve (demo)'
                )}
              </button>
            )}
          </div>

          {delegationUnavailableReason && USE_METAMASK_DELEGATION && !error && (
            <p className="text-[11px] text-amber-400/80 text-center">
              {delegationUnavailableReason}
            </p>
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

import { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { Wallet, Shield, Eye, ArrowRight, Loader2, ChevronDown, AlertTriangle } from 'lucide-react';
import { USE_METAMASK_DELEGATION } from '@/config/delegation';

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <>{children}</>;
  }

  return <LandingPage />;
}

function LandingPage() {
  const { connectors, connect, isPending } = useConnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showOtherWallets, setShowOtherWallets] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnect = (connector: (typeof connectors)[number]) => {
    setConnectError(null);
    setConnectingId(connector.uid);
    connect(
      { connector },
      {
        onError: (error) => {
          const message = error?.message?.toLowerCase?.() ?? '';
          if (message.includes('not found') || message.includes('not installed')) {
            setConnectError('MetaMask not detected. Open this in MetaMask browser or install the extension.');
          } else if (message.includes('rejected')) {
            setConnectError('Connection request rejected.');
          } else {
            setConnectError(error?.message || 'Wallet connection failed.');
          }
        },
        onSettled: () => setConnectingId(null),
      },
    );
  };

  const primaryConnector = connectors[0];
  const otherConnectors = connectors.slice(1);
  const hasPrimary = !!primaryConnector;

  return (
    <div className="min-h-screen bg-[#000000] w-full flex justify-center text-foreground font-sans">
      <div className="w-full max-w-[430px] bg-background min-h-screen relative flex flex-col shadow-2xl border-x border-white/[0.04]">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="flex flex-col items-center text-center w-full">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-8">
              <span className="text-[28px] font-bold text-primary tracking-tighter">#</span>
            </div>

            <h1 className="text-[32px] font-bold tracking-tight leading-tight mb-3">
              Hashapp
            </h1>
            <p className="text-[15px] text-muted-foreground/70 leading-relaxed mb-12 max-w-[300px]">
              A money app for your AI agents. Control what they spend, see what they do, prove what happened.
            </p>

            <div className="w-full flex flex-col gap-3 mb-8">
              <Feature
                icon={<Shield size={16} className="text-emerald-400" />}
                title="Bounded authority"
                desc="Set spending rules. Your agent operates within your limits."
              />
              <Feature
                icon={<Eye size={16} className="text-violet-400" />}
                title="Proof & receipts"
                desc="Every action is logged. Private reasoning stays private."
              />
              <Feature
                icon={<ArrowRight size={16} className="text-primary" />}
                title="Bring your own agent"
                desc="Connect any agent. Not locked to a single provider."
              />
            </div>

            <div className="w-full flex flex-col gap-3">
              {hasPrimary && (
                <button
                  onClick={() => handleConnect(primaryConnector)}
                  disabled={isPending}
                  className="w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {connectingId === primaryConnector.uid ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet size={16} />
                      {USE_METAMASK_DELEGATION ? 'Connect MetaMask' : 'Connect Wallet'}
                    </>
                  )}
                </button>
              )}

              {otherConnectors.length > 0 && !showOtherWallets && (
                <button
                  onClick={() => setShowOtherWallets(true)}
                  className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors py-1"
                >
                  Other wallets
                  <ChevronDown size={12} />
                </button>
              )}

              {showOtherWallets && otherConnectors.map((connector) => {
                const isLoading = connectingId === connector.uid;
                return (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                    className="w-full py-3 rounded-2xl text-[14px] font-medium transition-all bg-zinc-800/60 border border-zinc-700/30 text-foreground/80 hover:bg-zinc-800/80 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      connector.name
                    )}
                  </button>
                );
              })}

              {connectError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-left">
                  <AlertTriangle size={14} className="text-rose-400/80 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-rose-300/90 leading-relaxed">{connectError}</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground/35 mt-4 leading-relaxed max-w-[260px]">
              Non-custodial. Your keys stay yours. Hashapp never holds your funds.
            </p>
          </div>
        </div>

        <div className="pb-8 pt-4 text-center">
          <p className="text-[10px] text-muted-foreground/30 font-medium tracking-widest uppercase">
            Base Sepolia · Testnet
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 text-left px-2 py-3">
      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-semibold text-foreground mb-0.5">{title}</h3>
        <p className="text-[12px] text-muted-foreground/60 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

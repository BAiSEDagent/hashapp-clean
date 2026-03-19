import { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useLocation } from 'wouter';
import { Copy, Check, LogOut, X, Wallet, AlertTriangle } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { useResolvedWalletLabel } from '@/lib/addressDisplay';

export function AccountSheet({ onClose }: { onClose: () => void }) {
  const { address, chain, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { disconnectAgent } = useDemo();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const { displayLabel } = useResolvedWalletLabel(address);

  useEffect(() => {
    if (!isConnected || !address) {
      onClose();
      setLocation('/');
    }
  }, [address, isConnected, onClose, setLocation]);

  if (!address) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDisconnect = () => {
    disconnectAgent();
    disconnect();
    onClose();
    setLocation('/');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card border-t border-border/40 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
        <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-5" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold tracking-tight">Account</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        <div className="bg-zinc-800/40 rounded-2xl p-4 border border-zinc-700/30 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
              <Wallet size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[12px] text-emerald-400/80 font-medium">Connected</span>
              </div>
              <p className="text-[11px] text-muted-foreground/40 mt-0.5">{chain?.name ?? 'Base Sepolia'}</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 rounded-xl px-4 py-3 border border-zinc-700/20">
            <p className="text-[10px] text-muted-foreground/35 font-medium mb-1">Wallet address</p>
            <p className="text-[14px] font-mono text-foreground/90 tracking-wide mb-1.5">{displayLabel}</p>
            <p className="text-[10px] font-mono text-muted-foreground/40 break-all leading-relaxed">{address}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-zinc-800/40 border border-zinc-700/30 hover:bg-zinc-800/60 active:scale-[0.98] transition-all"
          >
            {copied ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Copy size={16} className="text-muted-foreground/50" />
            )}
            <span className="text-[14px] font-medium text-foreground">
              {copied ? 'Copied!' : 'Copy address'}
            </span>
          </button>

          {!confirmingDisconnect ? (
            <button
              onClick={() => setConfirmingDisconnect(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 active:scale-[0.98] transition-all"
            >
              <LogOut size={16} className="text-rose-400/70" />
              <span className="text-[14px] font-medium text-rose-400/80">Disconnect wallet</span>
            </button>
          ) : (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-rose-400/80" />
                <span className="text-[13px] font-medium text-rose-400/90">Disconnect wallet?</span>
              </div>
              <p className="text-[11px] text-muted-foreground/50 mb-3">You'll return to the landing page and need to reconnect to use the app.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDisconnect(false)}
                  className="flex-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700/40 text-[13px] font-medium text-foreground/70 hover:bg-zinc-700 active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex-1 py-2.5 rounded-lg bg-rose-500/15 border border-rose-500/20 text-[13px] font-medium text-rose-400 hover:bg-rose-500/25 active:scale-[0.98] transition-all"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

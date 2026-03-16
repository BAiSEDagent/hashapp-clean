import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownUp, Loader2, ExternalLink, AlertTriangle, ChevronDown } from 'lucide-react';
import { useAccount, useSendTransaction } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { walletConfig } from '@/config/wallet';
import { useDemo } from '@/context/DemoContext';
import { TruthBadge } from '@/components/TruthBadge';
import {
  SWAP_TOKENS,
  fetchQuote,
  parseTokenAmount,
  formatTokenAmount,
  type QuoteResult,
  type SwapToken,
} from '@/lib/swapApi';

type SwapState = 'idle' | 'quoting' | 'quoted' | 'approving' | 'swapping' | 'confirmed' | 'error';

export function SwapPanel() {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { recordSwap, checkSwapRules, recordBlockedSwap } = useDemo();

  const [tokenIn, setTokenIn] = useState<SwapToken>(SWAP_TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<SwapToken>(SWAP_TOKENS[2]);
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [state, setState] = useState<SwapState>('idle');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showTokenInMenu, setShowTokenInMenu] = useState(false);
  const [showTokenOutMenu, setShowTokenOutMenu] = useState(false);

  useEffect(() => {
    setQuote(null);
    setState('idle');
    setError(null);
    setTxHash(null);
  }, [tokenIn, tokenOut, amountIn]);

  const handleFlipTokens = () => {
    const prevIn = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(prevIn);
  };

  const handleGetQuote = useCallback(async () => {
    if (!amountIn || !address || parseFloat(amountIn) <= 0) return;

    const ruleCheck = checkSwapRules({
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      amountUsd: parseFloat(amountIn),
      slippage,
    });

    if (!ruleCheck.allowed) {
      setError(ruleCheck.reason || 'Blocked by rules');
      setState('error');
      recordBlockedSwap({
        tokenInSymbol: tokenIn.symbol,
        tokenOutSymbol: tokenOut.symbol,
        amountIn,
        reason: ruleCheck.reason || 'Blocked by rules',
      });
      return;
    }

    setState('quoting');
    setError(null);

    try {
      const rawAmount = parseTokenAmount(amountIn, tokenIn.decimals);
      const result = await fetchQuote({
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amount: rawAmount,
        swapper: address,
        slippageTolerance: slippage,
      });
      setQuote(result);
      setState('quoted');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get quote';
      setError(msg.length > 100 ? msg.slice(0, 100) + '...' : msg);
      setState('error');
    }
  }, [amountIn, address, tokenIn, tokenOut, slippage, checkSwapRules]);

  const handleExecuteSwap = useCallback(async () => {
    if (!quote || !address) return;

    setState('swapping');
    setError(null);

    try {
      if (quote.approval) {
        setState('approving');
        const approvalHash = await sendTransactionAsync({
          to: quote.approval.to as `0x${string}`,
          data: quote.approval.data as `0x${string}`,
          value: quote.approval.value ? BigInt(quote.approval.value) : 0n,
        });
        await waitForTransactionReceipt(walletConfig, { hash: approvalHash });
        setState('swapping');
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${API_BASE}/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: quote.quote,
          mode: 'user',
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          slippage,
          routing: quote.routing,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Swap failed' }));
        throw new Error(body.error || 'Swap execution failed');
      }

      const data = await res.json();

      if (data.tx) {
        const hash = await sendTransactionAsync({
          to: data.tx.to as `0x${string}`,
          data: data.tx.data as `0x${string}`,
          value: data.tx.value ? BigInt(data.tx.value) : 0n,
        });

        await waitForTransactionReceipt(walletConfig, { hash });

        setTxHash(hash);
        setState('confirmed');

        const outputFormatted = formatTokenAmount(quote.outputAmount, tokenOut.decimals);
        recordSwap({
          txHash: hash,
          swapDetails: {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            tokenInSymbol: tokenIn.symbol,
            tokenOutSymbol: tokenOut.symbol,
            amountIn,
            amountOut: outputFormatted,
            exchangeRate: (parseFloat(outputFormatted) / parseFloat(amountIn)).toFixed(6),
            gasCostUSD: quote.gasFeeUSD,
            priceImpact: quote.priceImpact,
          },
          isReal: true,
        });
      } else if (data.txHash) {
        setTxHash(data.txHash);
        setState('confirmed');
        const outputFormatted = formatTokenAmount(quote.outputAmount, tokenOut.decimals);
        recordSwap({
          txHash: data.txHash,
          swapDetails: {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            tokenInSymbol: tokenIn.symbol,
            tokenOutSymbol: tokenOut.symbol,
            amountIn,
            amountOut: outputFormatted,
            exchangeRate: (parseFloat(outputFormatted) / parseFloat(amountIn)).toFixed(6),
            gasCostUSD: quote.gasFeeUSD,
            priceImpact: quote.priceImpact,
          },
          isReal: true,
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Swap failed';
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError('Transaction rejected');
      } else {
        setError(msg.length > 100 ? msg.slice(0, 100) + '...' : msg);
      }
      setState('error');
    }
  }, [quote, address, amountIn, tokenIn, tokenOut, sendTransactionAsync, recordSwap]);

  const outputFormatted = quote ? formatTokenAmount(quote.outputAmount, tokenOut.decimals) : null;

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <ArrowDownUp size={14} className="text-pink-400/80" />
          <span className="text-[12px] font-semibold text-foreground">Swap</span>
        </div>
        <span className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider">Uniswap</span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="bg-white/[0.03] rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground/40">You pay</span>
            <div className="relative">
              <button
                onClick={() => setShowTokenInMenu(!showTokenInMenu)}
                className="flex items-center gap-1 text-[11px] font-semibold text-foreground hover:text-primary transition-colors"
              >
                {tokenIn.symbol}
                <ChevronDown size={10} />
              </button>
              {showTokenInMenu && (
                <div className="absolute right-0 top-6 z-20 bg-card border border-border/50 rounded-lg shadow-xl py-1 min-w-[100px]">
                  {SWAP_TOKENS.filter(t => t.address !== tokenOut.address).map(t => (
                    <button
                      key={t.address}
                      onClick={() => { setTokenIn(t); setShowTokenInMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] font-medium hover:bg-white/[0.06] transition-colors ${t.address === tokenIn.address ? 'text-primary' : 'text-foreground'}`}
                    >
                      {t.symbol}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <input
            type="number"
            value={amountIn}
            onChange={e => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent text-[24px] font-bold text-foreground outline-none placeholder:text-muted-foreground/20 tabular-nums"
          />
        </div>

        <div className="flex justify-center -my-1">
          <button
            onClick={handleFlipTokens}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            <ArrowDownUp size={14} className="text-muted-foreground/50" />
          </button>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground/40">You receive</span>
            <div className="relative">
              <button
                onClick={() => setShowTokenOutMenu(!showTokenOutMenu)}
                className="flex items-center gap-1 text-[11px] font-semibold text-foreground hover:text-primary transition-colors"
              >
                {tokenOut.symbol}
                <ChevronDown size={10} />
              </button>
              {showTokenOutMenu && (
                <div className="absolute right-0 top-6 z-20 bg-card border border-border/50 rounded-lg shadow-xl py-1 min-w-[100px]">
                  {SWAP_TOKENS.filter(t => t.address !== tokenIn.address).map(t => (
                    <button
                      key={t.address}
                      onClick={() => { setTokenOut(t); setShowTokenOutMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] font-medium hover:bg-white/[0.06] transition-colors ${t.address === tokenOut.address ? 'text-primary' : 'text-foreground'}`}
                    >
                      {t.symbol}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-[24px] font-bold tabular-nums text-foreground/60">
            {state === 'quoting' ? (
              <Loader2 size={24} className="animate-spin text-muted-foreground/30" />
            ) : outputFormatted ? (
              outputFormatted
            ) : (
              <span className="text-muted-foreground/20">0.0</span>
            )}
          </div>
        </div>

        {quote && state === 'quoted' && (
          <div className="flex flex-col gap-1.5 px-1">
            {quote.priceImpact !== undefined && quote.priceImpact !== null && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground/40">Price impact</span>
                <span className={`font-medium ${Math.abs(quote.priceImpact) > 3 ? 'text-rose-400' : 'text-muted-foreground/60'}`}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground/40">Gas cost</span>
              <span className="text-muted-foreground/60 font-medium">${parseFloat(quote.gasFeeUSD).toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground/40">Route</span>
              <span className="text-muted-foreground/60 font-medium">{quote.routing}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground/40">Slippage tolerance</span>
              <span className="text-muted-foreground/60 font-medium">{slippage}%</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle size={12} className="text-rose-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-rose-400">{error}</p>
          </div>
        )}

        {state === 'confirmed' && txHash && (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-2">
              <TruthBadge type="onchain" txHash={txHash} />
              <span className="text-[11px] text-emerald-400/80 font-medium">Swap confirmed</span>
            </div>
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
            >
              <ExternalLink size={9} />
              View on Basescan
            </a>
          </div>
        )}

        {state === 'idle' || state === 'error' ? (
          <button
            onClick={handleGetQuote}
            disabled={!amountIn || parseFloat(amountIn) <= 0}
            className="w-full py-3 rounded-xl text-[13px] font-semibold bg-pink-500/15 text-pink-400 hover:bg-pink-500/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            Get Quote
          </button>
        ) : state === 'quoting' ? (
          <button disabled className="w-full py-3 rounded-xl text-[13px] font-semibold bg-pink-500/10 text-pink-400/60 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Getting quote...
          </button>
        ) : state === 'quoted' ? (
          <button
            onClick={handleExecuteSwap}
            className="w-full py-3 rounded-xl text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Confirm Swap
          </button>
        ) : state === 'swapping' || state === 'approving' ? (
          <button disabled className="w-full py-3 rounded-xl text-[13px] font-semibold bg-primary/70 text-primary-foreground flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            {state === 'approving' ? 'Approving...' : 'Swapping...'}
          </button>
        ) : state === 'confirmed' ? (
          <button
            onClick={() => { setState('idle'); setAmountIn(''); setQuote(null); setTxHash(null); }}
            className="w-full py-3 rounded-xl text-[13px] font-semibold bg-white/[0.06] text-foreground/70 hover:bg-white/[0.09] transition-all"
          >
            New Swap
          </button>
        ) : null}
      </div>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SwapToken {
  address: string;
  symbol: string;
  decimals: number;
  chainId: string;
}

export const SWAP_TOKENS: SwapToken[] = [
  { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18, chainId: '84532' },
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18, chainId: '84532' },
  { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', symbol: 'USDC', decimals: 6, chainId: '84532' },
];

export interface QuoteResult {
  approval: {
    to: string;
    data: string;
    value: string;
    chainId: string;
  } | null;
  quote: Record<string, unknown>;
  routing: string;
  outputAmount: string;
  gasFeeUSD: string;
  priceImpact?: number;
  chainId: string;
}

export async function fetchQuote(params: {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  swapper: string;
  slippageTolerance?: number;
}): Promise<QuoteResult> {
  const res = await fetch(`${API_BASE}/swap/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Quote request failed' }));
    throw new Error(body.error || `Quote failed (${res.status})`);
  }

  return res.json();
}

export async function executeSwapViaBackend(params: {
  quote: Record<string, unknown>;
  mode: 'scout' | 'user';
}): Promise<{ txHash?: string; tx?: Record<string, unknown>; success: boolean }> {
  const res = await fetch(`${API_BASE}/swap/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Swap execution failed' }));
    throw new Error(body.error || `Swap failed (${res.status})`);
  }

  return res.json();
}

export function formatTokenAmount(amount: string, decimals: number): string {
  if (!amount || amount === '0') return '0';
  const raw = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmed = fractionStr.slice(0, Math.min(6, decimals)).replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

export function parseTokenAmount(value: string, decimals: number): string {
  if (!value || value === '0') return '0';
  const [whole, fraction = ''] = value.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const raw = BigInt(whole + paddedFraction);
  return raw.toString();
}

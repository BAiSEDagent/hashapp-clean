import { createWalletClient, createPublicClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const UNISWAP_API_BASE = 'https://trading-api.gateway.uniswap.org/v1';

const CHAIN_ID = '84532';

const NATIVE_ETH = '0x0000000000000000000000000000000000000000';

const TOKEN_DECIMALS: Record<string, number> = {
  [NATIVE_ETH]: 18,
  '0x4200000000000000000000000000000000000006': 18,
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e': 6,
};

const APPROVED_TOKENS: Record<string, string> = {
  [NATIVE_ETH]: 'ETH',
  '0x4200000000000000000000000000000000000006': 'WETH',
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e': 'USDC',
};

function getHeaders(): Record<string, string> {
  const apiKey = process.env.UNISWAP_API_KEY;
  if (!apiKey) throw new Error('UNISWAP_API_KEY not configured');
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-universal-router-version': '2.0',
  };
}

export interface CheckApprovalResult {
  approval: {
    to: string;
    data: string;
    value: string;
    chainId: string;
  } | null;
}

export async function checkApproval(
  tokenIn: string,
  amount: string,
  walletAddress: string,
): Promise<CheckApprovalResult> {
  if (tokenIn.toLowerCase() === NATIVE_ETH.toLowerCase()) {
    return { approval: null };
  }

  const body = {
    token: tokenIn,
    amount,
    chainId: CHAIN_ID,
    walletAddress,
  };

  const res = await fetch(`${UNISWAP_API_BASE}/check_approval`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`check_approval failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  return { approval: (data.approval as CheckApprovalResult['approval']) ?? null };
}

export async function executeApprovalTx(
  approval: NonNullable<CheckApprovalResult['approval']>,
  privateKey: Hex,
): Promise<string> {
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const txHash = await walletClient.sendTransaction({
    to: approval.to as Hex,
    data: approval.data as Hex,
    value: approval.value ? BigInt(approval.value) : 0n,
    chain: baseSepolia,
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

export interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  swapper: string;
  slippageTolerance?: number;
}

export interface QuoteResponse {
  quote: Record<string, unknown>;
  routing: string;
  outputAmount: string;
  gasFeeUSD: string;
  priceImpact?: number;
}

export async function getQuote(req: QuoteRequest): Promise<QuoteResponse> {
  const slippage = req.slippageTolerance ?? 0.5;

  const body: Record<string, unknown> = {
    type: 'EXACT_INPUT',
    tokenIn: req.tokenIn,
    tokenOut: req.tokenOut,
    amount: req.amount,
    chainId: CHAIN_ID,
    swapper: req.swapper,
    slippageTolerance: slippage,
    urgency: 'normal',
  };

  const res = await fetch(`${UNISWAP_API_BASE}/quote`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`quote failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const routing: string = (data.routing as string) ?? 'CLASSIC';
  const quote = (data.quote ?? data) as Record<string, unknown>;

  let outputAmount: string;
  if (routing === 'CLASSIC') {
    const output = quote.output as Record<string, unknown> | undefined;
    outputAmount = (output?.amount as string) ?? (quote.outputAmount as string) ?? '0';
  } else {
    const orderInfo = quote.orderInfo as Record<string, unknown> | undefined;
    const outputs = orderInfo?.outputs as Array<Record<string, unknown>> | undefined;
    const output = quote.output as Record<string, unknown> | undefined;
    outputAmount =
      (outputs?.[0]?.startAmount as string) ??
      (output?.amount as string) ??
      '0';
  }

  return {
    quote: data as Record<string, unknown>,
    routing,
    outputAmount,
    gasFeeUSD: (data.gasFeeUSD as string) ?? (quote.gasFeeUSD as string) ?? '0',
    priceImpact: (data.priceImpact as number | undefined) ?? (quote.priceImpact as number | undefined),
  };
}

function stripNulls(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        result[key] = stripNulls(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

function prepareSwapBody(quoteResponse: Record<string, unknown>, routing?: string): Record<string, unknown> {
  const body = stripNulls({ ...quoteResponse });

  if (routing && routing !== 'CLASSIC') {
    delete body.permitData;
    const quote = body.quote as Record<string, unknown> | undefined;
    if (quote) {
      delete quote.permitData;
    }
  }

  return body;
}

export async function executeSwap(
  quoteResponse: Record<string, unknown>,
  routing?: string,
): Promise<{ tx: Record<string, unknown> }> {
  const body = prepareSwapBody(quoteResponse, routing);

  const res = await fetch(`${UNISWAP_API_BASE}/swap`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`swap failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  return { tx: (data.swap as Record<string, unknown>) ?? data };
}

function getScoutKey(): Hex {
  const rawKey = process.env.SCOUT_PRIVATE_KEY?.trim();
  if (!rawKey) throw new Error('SCOUT_PRIVATE_KEY not configured');
  return rawKey.startsWith('0x')
    ? (rawKey as Hex)
    : (`0x${rawKey}` as Hex);
}

export async function executeSwapWithScoutWallet(
  quoteResponse: Record<string, unknown>,
  tokenIn?: string,
  amount?: string,
  routing?: string,
): Promise<string> {
  const sessionKey = getScoutKey();
  const account = privateKeyToAccount(sessionKey);

  if (tokenIn && amount) {
    const approvalResult = await checkApproval(tokenIn, amount, account.address);
    if (approvalResult.approval) {
      await executeApprovalTx(approvalResult.approval, sessionKey);
    }
  }

  const { tx } = await executeSwap(quoteResponse, routing);

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  if (tx.to && tx.data) {
    const txHash = await walletClient.sendTransaction({
      to: tx.to as Hex,
      data: tx.data as Hex,
      value: tx.value ? BigInt(tx.value as string) : 0n,
      chain: baseSepolia,
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  throw new Error('Swap response did not contain transaction data');
}

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const CONSERVATIVE_ETH_PRICE_USD = 2000;

export function estimateUsdFromTokenAmount(tokenAddress: string, rawAmount: string): number {
  const addr = tokenAddress.toLowerCase();
  const decimals = TOKEN_DECIMALS[tokenAddress] ?? TOKEN_DECIMALS[addr] ?? 18;
  const amount = Number(BigInt(rawAmount)) / 10 ** decimals;

  if (addr === USDC_ADDRESS.toLowerCase()) {
    return amount;
  }

  if (addr === NATIVE_ETH.toLowerCase() || addr === WETH_ADDRESS.toLowerCase()) {
    return amount * CONSERVATIVE_ETH_PRICE_USD;
  }

  return amount * CONSERVATIVE_ETH_PRICE_USD;
}

export function estimateUsdFromQuote(
  tokenIn: string,
  tokenOut: string,
  inputAmount: string,
  outputAmount: string,
): number {
  const inUsd = estimateUsdFromTokenAmount(tokenIn, inputAmount);
  const outUsd = estimateUsdFromTokenAmount(tokenOut, outputAmount);
  return Math.max(inUsd, outUsd);
}

export { APPROVED_TOKENS, TOKEN_DECIMALS, CHAIN_ID, NATIVE_ETH };

import { Router, type Request, type Response } from 'express';
import { isAddress } from 'viem';
import {
  checkApproval,
  getQuote,
  executeSwap,
  executeSwapWithAgentWallet,
  estimateUsdFromTokenAmount,
  APPROVED_TOKENS,
  TOKEN_DECIMALS,
  CHAIN_ID,
} from '../lib/uniswap.js';

const swapRouter = Router();

const MAX_SWAP_AMOUNT_USD = 50;
const MAX_SLIPPAGE = 1;

function isApprovedToken(addr: string): boolean {
  return !!APPROVED_TOKENS[addr] || !!APPROVED_TOKENS[addr.toLowerCase()];
}

function validateSwapRules(tokenIn: string, tokenOut: string, slippage: number, amountUsd: number): string | null {
  if (!isApprovedToken(tokenIn)) return `Token ${tokenIn} not in approved list`;
  if (!isApprovedToken(tokenOut)) return `Token ${tokenOut} not in approved list`;
  if (slippage > MAX_SLIPPAGE) return `Slippage tolerance ${slippage}% exceeds maximum of ${MAX_SLIPPAGE}%`;
  if (amountUsd > 0 && amountUsd > MAX_SWAP_AMOUNT_USD) return `Swap amount $${amountUsd} exceeds per-swap cap of $${MAX_SWAP_AMOUNT_USD}`;
  return null;
}

function requireAgentAuth(authHeader: string | undefined): boolean {
  const token = process.env.AGENT_API_TOKEN || process.env.SCOUT_API_TOKEN;
  if (!token) return false;
  if (!authHeader) return false;
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return provided === token;
}

swapRouter.post('/swap/quote', async (req, res) => {
  try {
    const { tokenIn, tokenOut, amount, swapper, slippageTolerance } = req.body;

    if (!tokenIn || !tokenOut || !amount || !swapper) {
      res.status(400).json({ error: 'Missing required fields: tokenIn, tokenOut, amount, swapper' });
      return;
    }

    const slippage = slippageTolerance ?? 0.5;
    const estimatedUsd = estimateUsdFromTokenAmount(tokenIn, amount);
    const ruleError = validateSwapRules(tokenIn, tokenOut, slippage, estimatedUsd);
    if (ruleError) {
      res.status(403).json({ error: ruleError });
      return;
    }

    const approvalResult = await checkApproval(tokenIn, amount, swapper);

    const quoteResult = await getQuote({
      tokenIn,
      tokenOut,
      amount,
      swapper,
      slippageTolerance: slippage,
    });

    res.json({
      approval: approvalResult.approval,
      quote: quoteResult.quote,
      routing: quoteResult.routing,
      outputAmount: quoteResult.outputAmount,
      gasFeeUSD: quoteResult.gasFeeUSD,
      priceImpact: quoteResult.priceImpact,
      chainId: CHAIN_ID,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Quote failed';
    console.error('Swap quote error:', message);
    res.status(500).json({ error: message });
  }
});

swapRouter.post('/swap/execute', async (req, res) => {
  try {
    const { quote, mode, tokenIn, tokenOut, slippage, routing } = req.body;

    if (!quote) {
      res.status(400).json({ error: 'Missing required field: quote' });
      return;
    }

    if (!tokenIn || !tokenOut) {
      res.status(400).json({ error: 'Missing required fields: tokenIn, tokenOut' });
      return;
    }

    const sl = slippage ?? 0.5;

    const quoteObj = (quote.quote ?? quote) as Record<string, unknown>;
    const inputAmount = (quoteObj.amount as string) ?? (quote.amount as string) ?? '0';
    const estimatedUsd = estimateUsdFromTokenAmount(tokenIn, inputAmount);
    const ruleError = validateSwapRules(tokenIn, tokenOut, sl, estimatedUsd);
    if (ruleError) {
      res.status(403).json({ error: ruleError });
      return;
    }

    if (mode === 'agent' || mode === 'scout') {
      if (!requireAgentAuth(req.headers.authorization)) {
        res.status(401).json({ error: 'Unauthorized: valid AGENT_API_TOKEN required for agent mode' });
        return;
      }
      const txHash = await executeSwapWithAgentWallet(
        quote,
        tokenIn,
        quote.quote?.amount ?? quote.amount,
        routing,
      );
      res.json({ txHash, success: true });
      return;
    }

    const { tx } = await executeSwap(quote, routing);
    res.json({ tx, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Swap execution failed';
    console.error('Swap execute error:', message);
    res.status(500).json({ error: message });
  }
});

async function handleAgentSwapAndPay(req: Request, res: Response) {
  try {
    if (!requireAgentAuth(req.headers.authorization)) {
      res.status(401).json({ error: 'Unauthorized: valid AGENT_API_TOKEN required' });
      return;
    }

    const { tokenIn, tokenOut, amount, recipient, paymentAmountUsdc } = req.body;

    if (!tokenIn || !tokenOut || !amount || !recipient || !paymentAmountUsdc) {
      res.status(400).json({ error: 'Missing required fields: tokenIn, tokenOut, amount, recipient, paymentAmountUsdc' });
      return;
    }

    if (!isAddress(recipient)) {
      res.status(400).json({ error: 'Invalid recipient address' });
      return;
    }

    const payAmount = Number(paymentAmountUsdc);
    if (isNaN(payAmount) || payAmount <= 0 || payAmount > MAX_SWAP_AMOUNT_USD) {
      res.status(400).json({ error: `Payment amount must be between 0 and ${MAX_SWAP_AMOUNT_USD} USDC` });
      return;
    }

    const ruleError = validateSwapRules(tokenIn, tokenOut, 0.5, payAmount);
    if (ruleError) {
      res.status(403).json({ error: ruleError });
      return;
    }

    const rawKey = (process.env.AGENT_PRIVATE_KEY || process.env.SCOUT_PRIVATE_KEY)?.trim();
    if (!rawKey) {
      res.status(500).json({ error: 'AGENT_PRIVATE_KEY not configured' });
      return;
    }

    const { privateKeyToAccount } = await import('viem/accounts');
    const { createWalletClient, createPublicClient, http, encodeFunctionData, erc20Abi, parseUnits } = await import('viem');
    const { baseSepolia } = await import('viem/chains');

    const sessionKey = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) as `0x${string}`;
    const account = privateKeyToAccount(sessionKey);

    const quoteResult = await getQuote({
      tokenIn,
      tokenOut,
      amount,
      swapper: account.address,
      slippageTolerance: 0.5,
    });

    const swapTxHash = await executeSwapWithAgentWallet(
      quoteResult.quote,
      tokenIn,
      amount,
      quoteResult.routing,
    );

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;
    const calldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient as `0x${string}`, parseUnits(payAmount.toFixed(6), 6)],
    });

    const payTxHash = await walletClient.sendTransaction({
      to: usdcAddress,
      data: calldata,
      chain: baseSepolia,
    });

    await publicClient.waitForTransactionReceipt({ hash: payTxHash });

    res.json({
      success: true,
      swapTxHash,
      paymentTxHash: payTxHash,
      outputAmount: quoteResult.outputAmount,
      gasFeeUSD: quoteResult.gasFeeUSD,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Swap-and-pay failed';
    console.error('Agent swap-and-pay error:', message);
    res.status(500).json({ error: message });
  }
}

swapRouter.post('/swap/agent-swap-and-pay', handleAgentSwapAndPay);
swapRouter.post('/swap/scout-swap-and-pay', handleAgentSwapAndPay);

swapRouter.get('/swap/tokens', (_req, res) => {
  const tokens = Object.entries(APPROVED_TOKENS).map(([address, symbol]) => ({
    address,
    symbol,
    decimals: TOKEN_DECIMALS[address] ?? 18,
    chainId: CHAIN_ID,
  }));
  res.json({ tokens });
});

export default swapRouter;

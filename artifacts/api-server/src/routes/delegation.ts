import { Router } from 'express';
import { createWalletClient, http, encodeFunctionData, erc20Abi, parseUnits, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { erc7710WalletActions } from '@metamask/smart-accounts-kit/actions';

const delegationRouter = Router();

const ALLOWED_TOKENS: Record<string, boolean> = {
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e': true,
};

const ALLOWED_DELEGATION_MANAGER = '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3';

const MAX_SPEND_AMOUNT = 1000;

delegationRouter.post('/delegation/spend', async (req, res) => {
  try {
    const { permissionsContext, delegationManager, tokenAddress, amountUsdc, recipient } = req.body;

    if (!permissionsContext || !delegationManager || !tokenAddress || !amountUsdc || !recipient) {
      res.status(400).json({ error: 'Missing required fields: permissionsContext, delegationManager, tokenAddress, amountUsdc, recipient' });
      return;
    }

    if (typeof permissionsContext !== 'string' || !permissionsContext.startsWith('0x')) {
      res.status(400).json({ error: 'Invalid permissionsContext format' });
      return;
    }

    if (!isAddress(tokenAddress)) {
      res.status(400).json({ error: 'Invalid tokenAddress' });
      return;
    }

    if (!isAddress(recipient)) {
      res.status(400).json({ error: 'Invalid recipient address' });
      return;
    }

    if (!isAddress(delegationManager)) {
      res.status(400).json({ error: 'Invalid delegationManager address' });
      return;
    }

    if (!ALLOWED_TOKENS[tokenAddress]) {
      res.status(403).json({ error: 'Token not in allowlist' });
      return;
    }

    if (delegationManager.toLowerCase() !== ALLOWED_DELEGATION_MANAGER.toLowerCase()) {
      res.status(403).json({ error: 'Unrecognized delegation manager' });
      return;
    }

    const amount = Number(amountUsdc);
    if (isNaN(amount) || amount <= 0 || amount > MAX_SPEND_AMOUNT) {
      res.status(400).json({ error: `Amount must be between 0 and ${MAX_SPEND_AMOUNT} USDC` });
      return;
    }

    const sessionKey = process.env.SCOUT_SESSION_PRIVATE_KEY;
    if (!sessionKey) {
      res.status(500).json({ error: 'SCOUT_SESSION_PRIVATE_KEY not configured' });
      return;
    }

    const sessionAccount = privateKeyToAccount(sessionKey as `0x${string}`);

    const walletClient = createWalletClient({
      account: sessionAccount,
      chain: baseSepolia,
      transport: http(),
    }).extend(erc7710WalletActions());

    const calldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient as `0x${string}`, parseUnits(amount.toFixed(6), 6)],
    });

    const txHash = await walletClient.sendTransactionWithDelegation({
      account: sessionAccount,
      chain: baseSepolia,
      to: tokenAddress as `0x${string}`,
      data: calldata,
      permissionsContext: permissionsContext as `0x${string}`,
      delegationManager: delegationManager as `0x${string}`,
    } as Parameters<typeof walletClient.sendTransactionWithDelegation>[0]);

    res.json({ txHash, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delegation spend error:', message);
    res.status(500).json({ error: message });
  }
});

export default delegationRouter;

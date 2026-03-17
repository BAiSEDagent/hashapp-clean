import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { createWalletClient, http, encodeFunctionData, erc20Abi, parseUnits, isAddress, verifyMessage } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { erc7710WalletActions } from '@metamask/smart-accounts-kit/actions';

const delegationRouter = Router();

const ALLOWED_TOKENS: Record<string, boolean> = {
  '0x036cbd53842c5426634e7929541ec2318f3dcf7e': true,
};

const ALLOWED_RECIPIENTS: Record<string, boolean> = {
  '0xbf8bfde4b42baa2f4377b8ebc5d2602d3080a4d4': true,
  '0x000000000000000000000000000000000000dead': true,
};

const ALLOWED_DELEGATION_MANAGER = '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3';

const MAX_SPEND_AMOUNT = 1000;
const SPEND_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_CONTEXT = 5;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

const IDEMPOTENCY_TTL_MS = 300_000;
const idempotencyMap = new Map<string, { txHash: string; ts: number }>();

const CHALLENGE_TTL_SECONDS = 120;
const CHALLENGE_PREFIX = 'hashapp-delegation-register';
const usedChallenges = new Map<string, number>();

function pruneExpiredEntries() {
  const now = Date.now();
  const nowSec = Math.floor(now / 1000);
  for (const [key, entry] of idempotencyMap) {
    if (now - entry.ts > IDEMPOTENCY_TTL_MS) idempotencyMap.delete(key);
  }
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
  }
  for (const [msg, ts] of usedChallenges) {
    if (nowSec - ts > CHALLENGE_TTL_SECONDS * 2) usedChallenges.delete(msg);
  }
}

setInterval(pruneExpiredEntries, 60_000);

function getHmacSecret(): string {
  const raw = process.env.SCOUT_PRIVATE_KEY?.trim();
  if (!raw) throw new Error('SCOUT_PRIVATE_KEY not configured');
  return createHmac('sha256', 'hashapp-delegation-auth-v1').update(raw).digest('hex');
}

function createSpendToken(permissionsContext: string, delegatorAddress: string, issuedAt: number): string {
  const secret = getHmacSecret();
  const payload = `${permissionsContext.toLowerCase()}:${delegatorAddress.toLowerCase()}:${issuedAt}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  const tokenData = JSON.stringify({ ctx: permissionsContext.toLowerCase(), addr: delegatorAddress.toLowerCase(), iat: issuedAt, sig });
  return Buffer.from(tokenData).toString('base64url');
}

function validateSpendToken(token: string, permissionsContext: string): { valid: boolean; error?: string; delegatorAddress?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
    const { ctx, addr, iat, sig } = decoded;

    if (!ctx || !addr || !iat || !sig) {
      return { valid: false, error: 'Malformed spend token' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now - iat > SPEND_TOKEN_TTL_SECONDS) {
      return { valid: false, error: 'Spend token expired' };
    }

    if (ctx !== permissionsContext.toLowerCase()) {
      return { valid: false, error: 'Token does not match permissionsContext' };
    }

    const secret = getHmacSecret();
    const payload = `${ctx}:${addr}:${iat}`;
    const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');

    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, error: 'Invalid token signature' };
    }

    return { valid: true, delegatorAddress: addr };
  } catch {
    return { valid: false, error: 'Invalid spend token format' };
  }
}

delegationRouter.post('/delegation/register', async (req, res) => {
  try {
    const { permissionsContext, delegatorAddress, signature, message } = req.body;

    if (!permissionsContext || !delegatorAddress) {
      res.status(400).json({ error: 'Missing required fields: permissionsContext, delegatorAddress' });
      return;
    }

    if (!signature || !message) {
      res.status(401).json({ error: 'Missing wallet signature' });
      return;
    }

    if (typeof permissionsContext !== 'string' || !permissionsContext.startsWith('0x') || permissionsContext.length < 10) {
      res.status(400).json({ error: 'Invalid permissionsContext format' });
      return;
    }

    if (!isAddress(delegatorAddress)) {
      res.status(400).json({ error: 'Invalid delegatorAddress' });
      return;
    }

    const expectedPattern = new RegExp(
      `^${CHALLENGE_PREFIX}:0x[0-9a-f]+:0x[0-9a-fA-F]{40}:(\\d+)$`
    );
    const match = message.match(expectedPattern);
    if (!match) {
      res.status(401).json({ error: 'Invalid challenge format' });
      return;
    }

    const challengeTimestamp = parseInt(match[1], 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (challengeTimestamp > nowSec || nowSec - challengeTimestamp > CHALLENGE_TTL_SECONDS) {
      res.status(401).json({ error: 'Challenge expired' });
      return;
    }

    const expectedMessage = `${CHALLENGE_PREFIX}:${permissionsContext.toLowerCase()}:${delegatorAddress}:${challengeTimestamp}`;
    if (message !== expectedMessage) {
      res.status(401).json({ error: 'Challenge does not match request' });
      return;
    }

    if (usedChallenges.has(message)) {
      res.status(401).json({ error: 'Challenge already used' });
      return;
    }

    usedChallenges.set(message, nowSec);

    let recoveredValid = false;
    try {
      recoveredValid = await verifyMessage({
        address: delegatorAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch {
      recoveredValid = false;
    }

    if (!recoveredValid) {
      res.status(401).json({ error: 'Signature verification failed' });
      return;
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const spendToken = createSpendToken(permissionsContext, delegatorAddress, issuedAt);

    console.log('[DelegationRegister] Issued spend token for delegator:', delegatorAddress.slice(0, 10) + '...');

    res.json({ spendToken, expiresAt: issuedAt + SPEND_TOKEN_TTL_SECONDS });
  } catch (error: unknown) {
    const rawMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DelegationRegister] ERROR:', rawMessage);
    res.status(500).json({ error: 'Failed to register delegation' });
  }
});

delegationRouter.post('/delegation/spend', async (req, res) => {
  try {
    const { permissionsContext, delegationManager, tokenAddress, amountUsdc, recipient, idempotencyKey, spendToken } = req.body;

    if (!spendToken || typeof spendToken !== 'string') {
      res.status(401).json({ error: 'Missing spend authorization token' });
      return;
    }

    if (!permissionsContext || !delegationManager || !tokenAddress || !amountUsdc || !recipient) {
      res.status(400).json({ error: 'Missing required fields: permissionsContext, delegationManager, tokenAddress, amountUsdc, recipient' });
      return;
    }

    if (typeof permissionsContext !== 'string' || !permissionsContext.startsWith('0x') || permissionsContext.length < 10) {
      res.status(400).json({ error: 'Invalid permissionsContext format' });
      return;
    }

    const tokenValidation = validateSpendToken(spendToken, permissionsContext);
    if (!tokenValidation.valid) {
      res.status(401).json({ error: tokenValidation.error || 'Unauthorized' });
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

    if (!ALLOWED_TOKENS[tokenAddress.toLowerCase()]) {
      res.status(403).json({ error: 'Token not in allowlist' });
      return;
    }

    if (!ALLOWED_RECIPIENTS[recipient.toLowerCase()]) {
      res.status(403).json({ error: 'Recipient not in allowlist' });
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

    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const existing = idempotencyMap.get(idempotencyKey);
      if (existing) {
        res.json({ txHash: existing.txHash, success: true, deduplicated: true });
        return;
      }
    }

    const now = Date.now();
    const contextKey = permissionsContext.slice(0, 66).toLowerCase();
    const rateEntry = rateLimitMap.get(contextKey);
    if (rateEntry) {
      if (now - rateEntry.windowStart < RATE_LIMIT_WINDOW_MS) {
        if (rateEntry.count >= RATE_LIMIT_MAX_PER_CONTEXT) {
          res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
          return;
        }
        rateEntry.count++;
      } else {
        rateLimitMap.set(contextKey, { count: 1, windowStart: now });
      }
    } else {
      rateLimitMap.set(contextKey, { count: 1, windowStart: now });
    }

    const rawKey = process.env.SCOUT_PRIVATE_KEY?.trim();
    if (!rawKey) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const sessionKey: `0x${string}` = rawKey.startsWith('0x')
      ? (rawKey as `0x${string}`)
      : (`0x${rawKey}` as `0x${string}`);
    const sessionAccount = privateKeyToAccount(sessionKey);

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

    if (idempotencyKey && typeof idempotencyKey === 'string') {
      idempotencyMap.set(idempotencyKey, { txHash, ts: Date.now() });
    }

    console.log('[DelegationSpend] SUCCESS for delegator:', tokenValidation.delegatorAddress?.slice(0, 10) + '...', 'txHash:', txHash);

    res.json({ txHash, success: true });
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    const rawMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DelegationSpend] ERROR:', rawMessage);
    console.error('[DelegationSpend] Error code:', err?.code);
    console.error('[DelegationSpend] Error data:', JSON.stringify(err?.data));
    console.error('[DelegationSpend] Error details:', err?.details);
    try {
      console.error('[DelegationSpend] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2));
    } catch { console.error('[DelegationSpend] Full error (non-serializable):', err); }

    let safeMessage = 'Delegation spend execution failed';
    if (rawMessage.includes('reverted')) safeMessage = 'Transaction reverted onchain';
    else if (rawMessage.includes('insufficient')) safeMessage = 'Insufficient funds or allowance';
    else if (rawMessage.includes('nonce')) safeMessage = 'Nonce conflict — please retry';

    res.status(500).json({ error: safeMessage });
  }
});

export default delegationRouter;

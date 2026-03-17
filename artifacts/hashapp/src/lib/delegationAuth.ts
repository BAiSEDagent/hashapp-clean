export interface RegisterDelegationResult {
  spendToken: string;
  expiresAt: number;
}

export type SignMessageFn = (args: { message: string }) => Promise<`0x${string}`>;

const CHALLENGE_PREFIX = 'hashapp-delegation-register';

export async function registerDelegation(
  permissionsContext: `0x${string}`,
  delegatorAddress: `0x${string}`,
  signMessage: SignMessageFn,
): Promise<RegisterDelegationResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${CHALLENGE_PREFIX}:${permissionsContext.toLowerCase()}:${delegatorAddress}:${timestamp}`;

  const signature = await signMessage({ message });

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBase}/delegation/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      permissionsContext,
      delegatorAddress,
      signature,
      message,
    }),
  });

  if (!response.ok) {
    let errorMsg = 'Delegation registration failed';
    try {
      const body = await response.json();
      if (body?.error) errorMsg = body.error;
    } catch {
      errorMsg = `Registration failed (HTTP ${response.status})`;
    }
    throw new Error(errorMsg);
  }

  const result = await response.json();
  if (!result.spendToken) {
    throw new Error('No spend token returned from server');
  }

  return {
    spendToken: result.spendToken,
    expiresAt: result.expiresAt,
  };
}

import { USDC_BASE_SEPOLIA } from '@/config/delegation';

export interface DelegationSpendParams {
  permissionsContext: `0x${string}`;
  delegationManager: `0x${string}`;
  amountUsdc: number;
  recipient: `0x${string}`;
  spendToken: string;
}

export interface DelegationSpendResult {
  txHash: string;
  success: boolean;
}

let spendCounter = 0;

function generateIdempotencyKey(context: string, amount: number, recipient: string): string {
  spendCounter++;
  return `${context.slice(0, 40)}-${recipient.slice(0, 10)}-${amount}-${spendCounter}`;
}

export async function executeDelegationSpend(
  params: DelegationSpendParams,
): Promise<DelegationSpendResult> {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  const idempotencyKey = generateIdempotencyKey(params.permissionsContext, params.amountUsdc, params.recipient);
  const response = await fetch(`${apiBase}/delegation/spend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      permissionsContext: params.permissionsContext,
      delegationManager: params.delegationManager,
      tokenAddress: USDC_BASE_SEPOLIA,
      amountUsdc: params.amountUsdc,
      recipient: params.recipient,
      idempotencyKey,
      spendToken: params.spendToken,
    }),
  });

  if (!response.ok) {
    let errorMsg = 'Delegation spend failed';
    try {
      const body = await response.json();
      if (body?.error) errorMsg = body.error;
    } catch {
      errorMsg = `Delegation spend failed (HTTP ${response.status})`;
    }
    throw new Error(errorMsg);
  }

  const result = await response.json();
  return {
    txHash: result.txHash,
    success: true,
  };
}

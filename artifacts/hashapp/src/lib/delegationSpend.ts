import { USDC_BASE_SEPOLIA } from '@/config/delegation';

export interface DelegationSpendParams {
  permissionsContext: `0x${string}`;
  delegationManager: `0x${string}`;
  amountUsdc: number;
  recipient: `0x${string}`;
}

export interface DelegationSpendResult {
  txHash: string;
  success: boolean;
}

export async function executeDelegationSpend(
  params: DelegationSpendParams,
): Promise<DelegationSpendResult> {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  const response = await fetch(`${apiBase}/delegation/spend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      permissionsContext: params.permissionsContext,
      delegationManager: params.delegationManager,
      tokenAddress: USDC_BASE_SEPOLIA,
      amountUsdc: params.amountUsdc,
      recipient: params.recipient,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Delegation spend failed: ${body}`);
  }

  const result = await response.json();
  return {
    txHash: result.txHash,
    success: true,
  };
}

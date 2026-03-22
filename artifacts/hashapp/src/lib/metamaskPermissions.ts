import { type EIP1193Provider, createWalletClient, custom, parseUnits } from 'viem';
import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions';
import {
  DELEGATION_CHAIN,
  USDC_BASE_SEPOLIA,
  DELEGATION_RECIPIENT_ADDRESS,
  PERMISSION_PERIOD_DURATION,
  PERMISSION_EXPIRY_SECONDS,
} from '@/config/delegation';

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export interface GrantedDelegation {
  permissionsContext: `0x${string}`;
  delegationManager: `0x${string}`;
  grantedPermissions: unknown;
  expiry: number;
}

function isHexAddress(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isHexContext(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[a-fA-F0-9]+$/.test(value);
}

function validateGrantedPermissionShape(grantedPermissions: unknown) {
  if (!Array.isArray(grantedPermissions) || grantedPermissions.length === 0) {
    throw new Error('Wallet returned no delegated permissions');
  }

  const firstPermission = grantedPermissions[0] as Record<string, unknown> | undefined;
  if (!firstPermission) {
    throw new Error('Wallet returned an empty delegated permission entry');
  }

  const permissionsContext = firstPermission.context;
  const delegationManager = firstPermission.delegationManager;
  if (!isHexContext(permissionsContext)) {
    throw new Error('Wallet returned delegated permission without a valid context');
  }
  if (!isHexAddress(delegationManager)) {
    throw new Error('Wallet returned delegated permission without a valid delegation manager');
  }

  const permission = firstPermission.permission as Record<string, unknown> | undefined;
  const permissionData = permission?.data as Record<string, unknown> | undefined;
  if (permission?.type !== 'erc20-token-periodic') {
    throw new Error('Wallet returned unexpected delegated permission type');
  }
  if (!permissionData || !isHexAddress(permissionData.tokenAddress)) {
    throw new Error('Wallet returned delegated permission without a valid token address');
  }

  return {
    permissionsContext,
    delegationManager,
  };
}

function normalizeDelegationError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code?: unknown }).code) : '';
  const lower = message.toLowerCase();

  if (lower.includes('user rejected')) {
    return new Error('Request rejected');
  }

  if (
    code === '4200' ||
    lower.includes('requestexecutionpermissions') ||
    lower.includes('delegation') && lower.includes('not supported') ||
    lower.includes('invalid parameters were provided to the rpc method') ||
    lower.includes('unsupported method')
  ) {
    return new Error("Your wallet doesn't support delegation permissions. MetaMask Flask 13.5.0+ required.");
  }

  return err instanceof Error ? err : new Error(message);
}

export async function requestDelegatedPermission(
  amountUsdc: number,
): Promise<GrantedDelegation> {
  if (!window.ethereum) {
    throw new Error('MetaMask not detected. Please install MetaMask Flask 13.5.0+.');
  }

  const walletClient = createWalletClient({
    chain: DELEGATION_CHAIN,
    transport: custom(window.ethereum),
  }).extend(erc7715ProviderActions());

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + PERMISSION_EXPIRY_SECONDS;
  const periodAmount = parseUnits(amountUsdc.toString(), 6);

  const permissionRequest = [
    {
      chainId: DELEGATION_CHAIN.id,
      expiry,
      to: DELEGATION_RECIPIENT_ADDRESS,
      permission: {
        type: 'erc20-token-periodic' as const,
        data: {
          tokenAddress: USDC_BASE_SEPOLIA,
          periodAmount,
          periodDuration: PERMISSION_PERIOD_DURATION,
          justification: `Delegate ${amountUsdc} USDC periodic spending authority to agent`,
        },
      },
      isAdjustmentAllowed: true,
    },
  ];

  if (import.meta.env.DEV) {
    console.log('[Delegation] requestExecutionPermissions payload:', JSON.stringify(permissionRequest, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  }

  try {
    const grantedPermissions = await walletClient.requestExecutionPermissions(permissionRequest);

    if (import.meta.env.DEV) {
      console.log('[Delegation] Granted permissions:', JSON.stringify(grantedPermissions, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    }

    const { permissionsContext, delegationManager } = validateGrantedPermissionShape(grantedPermissions);

    return {
      permissionsContext,
      delegationManager,
      grantedPermissions,
      expiry,
    };
  } catch (err: unknown) {
    const error = err as Record<string, unknown>;
    console.error('[Delegation] requestExecutionPermissions FAILED');
    console.error('[Delegation] Error code:', error?.code);
    console.error('[Delegation] Error message:', error?.message);
    console.error('[Delegation] Error data:', error?.data);
    console.error('[Delegation] Error details:', error?.details);
    console.error('[Delegation] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('[Delegation] Raw error object:', err);
    throw normalizeDelegationError(err);
  }
}

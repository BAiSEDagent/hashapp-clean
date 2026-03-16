export const SPEND_PERMISSION_MANAGER_ADDRESS = '0xf85210B21cC50302F477BA56686d2019dC9b67Ad' as const;

export const SCOUT_SPENDER_ADDRESS = '0xbf8BFDe4B42baa2F4377B8Ebc5D2602d3080a4D4' as const;

export const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

export interface SpendPermissionStruct {
  account: `0x${string}`;
  spender: `0x${string}`;
  token: `0x${string}`;
  allowance: bigint;
  period: number;
  start: number;
  end: number;
  salt: bigint;
  extraData: `0x${string}`;
}

const spendPermissionTuple = {
  name: 'spendPermission',
  type: 'tuple',
  components: [
    { name: 'account', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'allowance', type: 'uint160' },
    { name: 'period', type: 'uint48' },
    { name: 'start', type: 'uint48' },
    { name: 'end', type: 'uint48' },
    { name: 'salt', type: 'uint256' },
    { name: 'extraData', type: 'bytes' },
  ],
} as const;

export const SPEND_PERMISSION_MANAGER_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [spendPermissionTuple],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isApproved',
    inputs: [spendPermissionTuple],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

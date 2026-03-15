# Proof

Base-native spend permission proof artifacts from the separate technical Replit agent.

## What this is
These scripts demonstrate real onchain enforcement of scoped spending permissions using the audited `SpendPermissionManager` contract on Base Sepolia.

## Key addresses
- SpendPermissionManager: `0xf85210B21cC50302F477BA56686d2019dC9b67Ad`
- USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- CoinbaseSmartWallet factory: `0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a`
- Network: Base Sepolia (chainId 84532)

## What was proved
1. human smart wallet approved a 50 USDC/day spend permission for Scout
2. Scout spent within that bound — succeeded onchain
3. Scout exceeded the allowance — rejected: `ExceededSpendPermission`
4. Scout attempted an expired permission — rejected: `AfterSpendPermissionEnd`
5. Scout attempted under a wrong-spender permission — rejected: `InvalidSender`

## Approval path used
NOT `approveWithSignature`.
The working path is the human smart wallet owner calling `SPM.approve(spendPermission)` directly.

## To run
From this `proof/` directory:
```bash
pnpm install
HUMAN_PRIVATE_KEY=0x... SCOUT_PRIVATE_KEY=0x... pnpm run preflight-check
HUMAN_PRIVATE_KEY=0x... SCOUT_PRIVATE_KEY=0x... pnpm run spend-permission-proof
```

Use fresh throwaway Base Sepolia wallets. Never use mainnet or long-lived keys.

## Integration target
The next engineering move is wiring `Grant Permission` in the app to call `SPM.approve()` via the connected wallet, then calling `approvePending(id, realTxHash)` to surface a real tx hash and Basescan link.

Hook point in the app:
- `app/artifacts/hashapp/src/pages/Activity.tsx` — Grant Permission button
- `app/artifacts/hashapp/src/context/DemoContext.tsx` — `approvePending(id, realTxHash?)` already designed for this

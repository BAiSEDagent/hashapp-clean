# Track 1 Proof — Agents That Pay

## What Hashapp now proves
Hashapp is no longer just a design or product concept. We now have a real Base-native proof that demonstrates:
- scoped spending permissions
- onchain settlement
- auditable transaction proof
- autonomous rejection of out-of-bounds behavior

## Proof summary
Using Base Sepolia and the audited `SpendPermissionManager`, we demonstrated that:
1. a human smart wallet can grant Research Agent bounded spending authority
2. Research Agent can spend within that authority successfully
3. Base rejects out-of-bounds behavior automatically with named onchain errors
4. the proof requires no custom Solidity

## What succeeded
- Human smart wallet approved a spend permission for Research Agent
- Research Agent successfully spent within a 50 USDC/day bound
- successful approval and spend transactions were confirmed onchain

## What was rejected
### Over-limit spend
Research Agent attempted to spend after the allowance was exhausted.
Rejected with:
- `ExceededSpendPermission`

### Expired permission
Research Agent attempted to spend under an expired permission.
Rejected with:
- `AfterSpendPermissionEnd`

### Wrong spender
Research Agent attempted to spend under a permission granted to another spender.
Rejected with:
- `InvalidSender`

## Why this matters
This means Hashapp can credibly claim:
- **scoped spending permissions** are real
- **onchain settlement** is real
- **auditable tx history and proof** are real
- **agents that pay — and prove it** is not just UI language

## Honest caveat
Payee / destination enforcement is still partially app-layer rather than fully enforced by the contract. We should be explicit about that and avoid overclaiming.

## Strongest submission line
Hashapp proves that a human can grant an agent bounded spend authority on Base, let it act autonomously within those bounds, and rely on audited onchain infrastructure to reject out-of-policy behavior automatically.

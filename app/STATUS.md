# App Status

## Current app location
The active integrated app workspace lives under:
- `app/`
- frontend app: `app/artifacts/hashapp`

## What is real today
- wallet connection via wagmi + Base Sepolia (injected + Coinbase Wallet)
- honest non-custodial language throughout
- **Grant Permission → real `SPM.approve()` call** (commit `6a1a7fb2`)
  - waits for block confirmation before marking approved (not just signing)
  - real tx hash surfaced to DemoContext
  - real Basescan link shown on success
  - wallet-not-connected guard
  - revert detection with honest error message
- receipt proof conditioned on real tx hash (no fake hashes)
- localStorage persistence for demo state

## What is still simulated
- scout spending behavior is demo-layer (the real Scout spender EOA is not wired to UI)
- rule enforcement is app/demo-layer — blocked states are UI state, not onchain rejections
- most receipt detail data is demo content, not live API data
- Activity feed items are seeded demo data, not live agent transaction stream

## Proven primitive that exists separately
Separately proven on Base Sepolia (proof-output.json):
- in-bounds spend succeeded
- over-limit rejected: `ExceededSpendPermission`
- expired rejected: `AfterSpendPermissionEnd`
- wrong-spender rejected: `InvalidSender`

## Working rule
If something is not real yet, keep it honestly labeled. Do not reintroduce fake trust signals.

## Next engineering moves
1. Wire real wallet address readback into Money tab permission display
2. Confirm permission state onchain via `SPM.isApproved()` view call after grant
3. Implement real onboarding flow from ONBOARDING.md

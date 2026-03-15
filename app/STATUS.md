# App Status

## Current app location
The active integrated app workspace lives under:
- `app/`
- frontend app: `app/artifacts/hashapp`

## What is real today
- wallet connection surface via wagmi + Base Sepolia
- honest non-custodial language
- truth-pass UI cleanup
- local persistence for demo state
- repo-local typecheck and build validation

## What is still simulated
- `Grant Permission` is still demo/UI state, not yet the real contract flow
- receipt proof is only real when a real tx hash is supplied
- most rule enforcement remains app/demo-layer unless explicitly wired

## Proven primitive that exists separately
A separate technical proof already demonstrated on Base Sepolia:
- bounded spend permission approval
- in-bounds spend success
- over-limit rejection
- expired rejection
- wrong-spender rejection

That proof is real, but not yet integrated end-to-end into this UI.

## Next engineering move
Connect one real permission path from the app into the already-proven Base Sepolia spend-permission flow.

## Working rule
If something is not real yet, keep it honestly labeled. Do not reintroduce fake trust signals.

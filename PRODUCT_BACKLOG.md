# Product Backlog

Track product improvements separately from plumbing truth issues.

---

## P0 — Working product blockers
- [ ] Run working-product audit across wallet, permissions, receipts, and endpoints
- [ ] Confirm real vs mocked state for Money, Activity, Scout, Rules
- [ ] Prove one Base-native permission issuance flow
- [ ] Prove one in-bounds allowed action
- [ ] Prove one out-of-bounds rejected action
- [ ] Remove or fix any dead proof/explorer links

## P1 — High-value product improvements
- [ ] Design and implement first-run onboarding flow
- [ ] Make emergency stop / freeze all more accessible
- [ ] Add proactive trusted destination management (not just historical list)
- [ ] Group rules into clearer categories (e.g. Safety vs Behavior)
- [ ] Keep non-custodial language rigorously clear across the app
- [ ] Refine spend permission object visibility and control
- [ ] Add “why approved / why blocked” explanation layer
- [ ] Explore permission presets / personalities
- [ ] Parallel track: Uniswap Trading API integration for Scout swap capability after delegation proof closes
  - pass 1 should be backend-only, Scout-executed, Base Sepolia, CLASSIC route only
  - use real `UNISWAP_API_KEY` via env, never hardcoded
  - prove one real swap tx before any frontend swap panel or autonomous swap-then-pay chaining

## P2 — Optional polish / track leverage
- [ ] Add stronger but honest Base value cue (speed / low-cost settlement)
- [ ] Add optional Venice “Private Review” toggle without derailing core flow
- [ ] Refine partner-track-specific proof lines only where real
- [ ] Add permission timeline / history layer
- [ ] Explore smart suggestions for trusted destinations and recurring permissions

## Rule
P0 beats P1. P1 beats P2.
Do not spend time polishing fake flows before product truth is established.

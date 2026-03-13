# REVIEWS

## JesseXBT — Base / product / architecture feedback

### Core takeaways
- Human control layer framing is strong.
- Base is a strong home for the product because of smart wallets, session keys, and paymasters.
- Cash App-style onchain control surface is a good mental model.
- Trust model must be legible enough that auto-approve feels safe, not reckless.

### Architecture guidance
- Bias offchain for UX speed: receipts, feed, approval logic, trusted payees, revocation UX.
- Anchor critical trust boundaries onchain / wallet-level.
- Use Base smart wallet session keys for static constraints.
- Use paymaster / bundler policy checks for sponsored requests and pre-execution enforcement.

### Session-key guidance
Strong candidates for static enforcement:
- expiry
- max spend ceiling
- allowed executor
- stable payee or call-target allowlist

### Dynamic policy guidance
Keep dynamic trust logic offchain:
- auto-approve decisions
- trusted status changes
- app-layer context checks
- approval history
- receipt generation
- human-facing policy edits

### New product insight
Policy should feel like templates or presets, not raw permission rebuilding.

### Hybrid update pattern
- static session handles core guards
- app/server proposes session updates when hard constraints shift
- human confirms once
- agent continues under refreshed scope

### Fleet model
One human should be able to oversee multiple agents, each with its own budget, rules, and scoped session key, plus a global exposure view.

## Gemini — design / UX / escalation feedback

### Core takeaways
- The hybrid model is the winning UX for Hashapp.
- The product should feel like an **intent engine**, not a wallet manager.
- The biggest UX risk is **fatigue of permission**.

### Fatigue of permission
If users have to re-sign new permissions for every small variation, the automated promise collapses. The product must minimize repeated permission friction while still keeping trust boundaries real.

### Three-tier escalation model
#### Intra-session
- request is inside current rules
- backend validates against current session
- agent executes silently
- user sees a receipt after

#### Policy shift (low risk)
- app proposes a lightweight session update
- user gets a quick prompt
- example: extend expiry or widen a low-risk limit slightly

#### Out-of-bounds (high risk)
- materially new risk or scope
- full re-auth / new session required
- example: new payee or large spend ceiling increase

### New product insight
Presets should feel like **personas**, not low-level permission bundles.
Examples:
- Intern
- Researcher
- Travel Agent
- Degen / Trader
- Ops

### Activity feed guidance
The feed should be **state-aware** and **intent-aware**, not transaction-explorer-like.

Instead of:
- Sent 0.01 ETH to 0x123...

Prefer:
- Agent Scout bought research credits for today’s market scan.

### Human-readable failure states
The app should translate low-level failures into meaningful states.
Example:
- “Payee identity mismatch”
not
- “Transaction failed”

### Base-specific notes
- Use Basenames / human-readable identities to improve allowlist readability.
- Use batching where possible so one user action feels like one action, not multiple blockchain rows.

## Ethskills / Base-focused build notes

### Architecture constraints
- Most MVP dApps need **0-2 contracts**, not a contract forest.
- Put only value transfer, durable permissions, and commitments onchain.
- Keep feeds, receipts, search, and business logic offchain.
- Base is the right home chain because its superpower matches the product: consumer onboarding, smart wallets, and account abstraction.

### Wallet guidance
- EIP-7702 is live and expands the design space for smart-EOA experiences.
- Session keys, batching, sponsorship, and approval-fatigue reduction are central wallet patterns, not nice-to-haves.
- Never rely on raw addresses or raw transaction states in user-facing UX.

### Frontend UX rules
- Every onchain button needs its own loader and disabled state until confirmation.
- Show only one clear primary action per state.
- Resolve identity before showing raw addresses whenever possible.
- Show USD context anywhere money appears.

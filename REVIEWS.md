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

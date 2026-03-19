# AUDIT LOG

Track review findings, corrections, and implementation follow-ups here.

---

## Template

### Date
YYYY-MM-DD

### Source
- Replit Agent 4 / Gemini / JesseXBT / Opus / manual review / etc.

### Findings
- issue 1
- issue 2
- issue 3

### Severity
- High / Medium / Low

### Action taken
- what was changed

### Status
- Fixed / Partially fixed / Deferred / Rejected

### Notes
- extra context

---

## 2026-03-13 — Replit audit corrections

### Source
- Replit Agent 4 audit pass
- manual validation against Synthesis + ethskills context

### Findings
- settlement/proof line appeared on blocked or declined items
- tx hash external link had no real destination
- receipts lacked clear USDC labeling
- recurring charge framing was weaker than Base spend-permission language
- inconsistent amount formatting for recurring spend example
- audit incorrectly claimed ERC-8004 was fictional

### Severity
- High: settlement line on blocked/declined items
- High: dead external link
- Medium: no USDC labeling
- Medium: weak spend-permission framing
- Low: inconsistent amount formatting
- High (false finding): ERC-8004 claim was wrong and had to be explicitly rejected

### Action taken
- settlement/proof context made conditional on approved states with tx hashes only
- basescan tx links added
- USDC language added to proof and rule context
- recurring charge rule reframed around spend permissions
- amount formatting made consistent
- ERC-8004 identity kept intact

### Status
Fixed

### Notes
This was a good example of mixed audit quality: several useful corrections plus one major hallucinated standards claim. We should keep logging both valid findings and invalid reviewer claims.

---

## 2026-03-14 — Navigation and money-model review

### Source
- manual product review
- comparison against Cash App reference patterns

### Findings
- separate Trusted Destinations tab overlapped too much with Activity
- app lacked a true Money tab, weakening the financial-product grammar
- money representation risked sounding custodial without clearer connected-wallet language

### Severity
- High: missing Money tab / unclear product grammar
- Medium: duplicate payee/history surfaces
- High: custody ambiguity risk

### Action taken
- moved trusted destinations/search into Activity
- adopted Money / Activity / Scout / Rules top-level nav direction
- clarified non-custodial language around connected wallet and Scout allocation

### Status
Partially fixed / in progress through Replit iterations

### Notes
This was a key product-shape correction rather than a visual polish pass.

---

## 2026-03-14 — Base-native spend permission proof

### Source
- Replit technical agent
- Base Sepolia proof run

### Findings
- Base-native SpendPermissionManager can enforce spend cap, expiry, and spender identity without custom Solidity
- in-bounds spend succeeds onchain
- over-limit, expired, and wrong-spender cases all reject onchain with named errors
- payee restriction remains partially app-layer rather than contract-enforced

### Severity
- High positive finding: Track 1 proof is real
- Medium caveat: destination/payee enforcement is not fully onchain yet

### Action taken
- recorded tx hashes, revert names, proof output, and human-readable summary
- elevated Spend Permissions to a stronger Track 1 submission artifact

### Status
Verified

### Notes
This proof materially upgrades Hashapp from a credible product prototype to a product with a real technical spine.

---

## 2026-03-18 — Canonical truth-pass rescue audit

### Source
- manual audit of `origin/frontend/truth-pass`
- selective port into canonical integration branch

### Findings
- Replit branch contained real product work mixed with repo noise and accidental canonical-doc deletions
- disconnect flow left stale agent identity/address visible after wallet disconnect
- landing-page return after disconnect regressed
- `Scout` token/env naming leaked into new Venice/agent flows
- delegation DB hardening landed without migrations in the branch diff

### Severity
- High: stale address / disconnect trust regression
- High: branch could not be merged wholesale without deleting canonical docs
- High: delegation schema migration gap
- Medium: lingering `Scout` naming in agent flows

### Action taken
- selectively ported real app/server changes into clean integration branch instead of merging raw Replit branch
- fixed disconnect flow to clear connected agent state and route back to landing page
- added `AGENT_API_TOKEN` alias/fallback support in new agent-facing flows while preserving legacy compatibility
- preserved canonical docs / proof / partner-track files by excluding destructive branch noise

### Status
Partially fixed

### Notes
Current clean integration branch: `audit/integrate-truth-pass-clean`.
Local receipts so far:
- `6acb4077` — initial clean port of truth-pass into canonical line

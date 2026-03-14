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

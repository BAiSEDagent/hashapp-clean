# CHANGELOG

## 2026-03-18 — canonical integration rescue

### Branch
- `audit/integrate-truth-pass-clean`

### Purpose
Create one clean integration branch on canonical `hashapp` that ports the real `frontend/truth-pass` product/server work without dragging along Replit repo noise, screenshot artifacts, pasted transcripts, or destructive doc deletions.

### Receipts
- `6acb4077` — `feat: port truth-pass hardening into canonical line`
- `7240e92b` — `fix: restore disconnect truth and agent naming`
- `26cd9cfd` — `fix: restore per-wallet identity and delegation errors`

### Included
- Venice integration layer
- wallet-gated app shell
- account sheet / wallet chip work
- disconnect returns to landing page
- per-wallet demo + agent restore
- explicit delegation error states
- agent-token naming alias (`AGENT_API_TOKEN` fallback to legacy `SCOUT_API_TOKEN`)

### Explicitly excluded
- `.agents/**`
- `attached_assets/**`
- pasted prompt files
- screenshot-only branch noise
- destructive deletions of canonical docs / proof / partner-track files

### Current branch truth
- Canonical working integration branch: `audit/integrate-truth-pass-clean`
- Replit workspace was moved onto this branch at commit `26cd9cfd`
- `main` remains untouched until verification is complete

### Next verification checkpoint
1. connected identity display
2. wallet disconnect → landing return
3. same-wallet reconnect restores agent state
4. Grant Delegation triggers wallet flow or explicit inline error

## 2026-03-19 — wallet-flow hardening follow-up

### Branch
- `audit/integrate-truth-pass-clean`

### Purpose
Address the two highest-risk remaining product issues from the ETHSkills-guided audit:
- transaction-state honesty during permission/delegation actions
- missing explicit wrong-network flow

### Receipts
- pending current commit — wrong-network gate + approval state hardening

### Included
- app-shell wrong-network gate with primary `Switch to Base Sepolia` action
- explicit switch failure messaging
- approval/delegation phase labeling (`Analyzing`, `Requesting`, `Confirming onchain`, `Finalizing`)
- short post-success cooldown to prevent duplicate approval clicks during state refresh
- landing page moved from hardcoded black wrapper to theme-aware base colors

### Audit gate
- `pnpm run typecheck` ✅
- `pnpm --filter @workspace/hashapp run build` ✅
- `pnpm audit --audit-level=high` ✅
- `gitleaks` still reports pre-existing workspace leaks; no new secret-handling changes introduced in this pass

### Remaining notable findings
- custom address-display surfaces should still be unified further
- internal `Scout` backend/env naming still needs cleanup
- branch still vulnerable to Replit publish-noise unless collapsed soon

### Branch discipline note
The existence of multiple branches here is a temporary recovery artifact, not the desired steady state. After verification, merge the clean integration line intentionally and collapse branch sprawl.

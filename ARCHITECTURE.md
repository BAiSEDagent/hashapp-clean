# ARCHITECTURE

## System overview
Hashapp has four layers:

1. **Identity layer**
   - human wallet
   - linked agent identity
   - ENS / Basename / avatar
   - trusted payees and services
   - one human may manage multiple agents

2. **Policy layer**
   - max spend
   - approved services / payees
   - time windows
   - auto-approve rules
   - revoke / pause controls
   - per-agent policies plus optional global exposure ceiling

3. **Execution layer**
   - agent submits purchase request
   - app evaluates against policy
   - human approval or auto-approval
   - payment execution through Base smart wallet path

4. **Verification layer**
   - activity feed
   - receipt detail
   - proof / transaction references
   - optional attestations

## Onchain litmus test
Put it onchain only if it involves:
- trustless value transfer
- durable permission boundaries
- composable execution other contracts or wallets need to trust
- permanent commitments or proofs

Keep it offchain if it involves:
- feeds
- receipts formatting
- search / filtering / sorting
- trusted status labels
- human-readable reasoning
- fast-changing business logic

## Contract count bias
Hashapp should not overbuild onchain.

MVP target:
- **0-2 contracts**
- ideally none beyond existing wallet / paymaster / identity infrastructure unless a minimal policy or budget contract becomes necessary

## Enforcement thesis
The product should be fast and consumer-grade, but the scariest part of the system must have a real enforcement answer.

### Static constraints belong closer to the wallet/session layer
Examples:
- expiry
- max spend ceiling
- allowed executor
- allowed payees or call targets

### Dynamic trust logic can stay offchain in MVP
Examples:
- auto-approve decisions
- trusted status changes
- receipt formatting
- approval history
- human-readable policy changes

## MVP architecture
### Frontend
- Next.js app
- mobile-first UI
- OnchainKit / Base-oriented wallet UX
- consumer finance interaction model

### Backend
- simple API for:
  - link agent
  - create policy
  - submit purchase request
  - approve / deny request
  - log receipt
  - manage trusted payees
  - pause / revoke agents

### Onchain
- Base-first
- actual payment execution
- session-key / smart-wallet enforcement for critical constraints
- minimal onchain footprint required for believable demo

### Agent connection
Preferred MVP model:
- linked agent profile
- agent wallet address
- scoped session key or session credential
- structured request payloads into app backend

## Base-native architecture bias
### Session keys
Session keys are the core enforcement primitive for the MVP.
Each linked agent should receive a scoped execution key tied to policy parameters like:
- spend cap
- approved payees
- expiry window
- optional action type

This gives the app lightweight UX while ensuring the wallet itself rejects out-of-bounds actions.

### Paymaster constraints
If requests are sponsored, paymaster policy checks should enforce constraints before execution:
- max spend ceilings
- allowed addresses / payees
- approved windows
- optional per-agent limits

This supports a gasless feel without making the trust model soft.

### EIP-7702 awareness
EIP-7702 is live and matters to the product direction because EOAs can access smart-wallet-like capabilities without full migration. For the MVP, Hashapp should stay focused on the clearest Base smart wallet/session path, but the product narrative should acknowledge that smart EOAs make this category bigger, not smaller.

## Hybrid trust model
### Offchain
- purchase request ingestion
- approval engine
- trusted payee resolution
- activity feed
- receipt formatting
- fast revoke / pause UX
- policy history and logs

### Onchain / wallet-level
- scoped session permissions
- spend cap enforcement
- actual payment execution
- durable rejection of out-of-policy actions

### Hybrid
- revocation pauses instantly in app
- durable enforcement happens by invalidating or rotating the session / permission path

## Fleet model
Hashapp should support **one human, multiple agents**.

Each agent gets:
- its own session key
- its own budget
- its own payee allowlist
- its own approval mode
- its own activity stream

The human gets:
- one global dashboard
- cross-agent activity feed
- per-agent pause / revoke
- total exposure view

## Open questions
- How expressive can session-key policy be without making updates painful?
- How much payee allowlisting belongs onchain vs app-layer?
- Do we use x402 directly in the first demo?
- Do we support service payments first or swaps first?
- How much privacy is real in MVP vs narrative?

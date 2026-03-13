# ARCHITECTURE

## System overview
Hashapp has four layers:

1. **Identity layer**
   - human wallet
   - linked agent identity
   - ENS / Basename / avatar
   - trusted payees and services

2. **Policy layer**
   - max spend
   - approved services / payees
   - time windows
   - auto-approve rules
   - revoke / pause controls

3. **Execution layer**
   - agent submits purchase request
   - app evaluates against policy
   - human approval or auto-approval
   - payment execution

4. **Verification layer**
   - activity feed
   - receipt detail
   - proof / transaction references
   - optional attestations

## MVP architecture
### Frontend
- Next.js app
- mobile-first UI
- OnchainKit / Base-oriented wallet UX

### Backend
- simple API for:
  - link agent
  - create policy
  - submit purchase request
  - approve / deny request
  - log receipt

### Onchain
- Base-first
- budget / spend / settlement records
- minimal onchain footprint required for believable demo

### Agent connection
Preferred MVP model:
- linked agent profile
- agent wallet address
- scoped session token or API credential
- structured request payloads into app backend

## Open questions
- How much of approval state should live onchain?
- Do we use x402 directly in the first demo?
- Do we support service payments first or swaps first?
- How much privacy is real in MVP vs narrative?

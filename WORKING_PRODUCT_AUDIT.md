# Working Product Audit

## Purpose
Hashapp is now past the concept stage. This audit exists to answer one question:

**What must become real so Hashapp is a working product rather than a beautiful prototype?**

## Audit categories

### 1. Wallet / custody truth
Check:
- does the product clearly reflect a non-custodial model?
- does connected wallet behavior match the UI story?
- does any copy still imply funds are held by Hashapp?
- does the Money tab reflect real state or just mocked balances?

### 2. Permission handshake truth
Check:
- what actually happens when the user taps **Grant Permission**?
- is session key issuance real, mocked, or partially stubbed?
- are scoped limits real or just represented in UI?
- can the permission path be demonstrated end-to-end?

### 3. In-bounds vs out-of-bounds enforcement
Check:
- can one approved/in-bounds action truly succeed?
- can one out-of-bounds action truly fail because of the permission boundary?
- is the failure clean and believable?
- which parts are enforced onchain vs app-layer only?

### 4. Receipt / proof truth
Check:
- which receipt fields are real?
- which proof lines are mocked?
- do all proof links resolve?
- are blocked/declined items correctly separated from settled items?
- is settlement context technically accurate?

### 5. Endpoint / data flow truth
Check:
- which endpoints are live?
- which are stubbed?
- which buttons are dead or fake?
- which state transitions are simulated only?
- where are the brittle points?

### 6. Identity truth
Check:
- which identities are real?
- which ENS/Basenames are real vs decorative?
- are any vendor identities misleading or over-literal?
- is Scout identity anchored appropriately?

### 7. UX breakpoints under real plumbing
Check:
- does the wallet/session flow destroy the cinematic “Grant Permission” moment?
- where does loading/error state need to be redesigned for real integration?
- what interactions currently look great but will collapse when connected to real state?

## Output format
For each finding, record:
- area
- current state
- real / fake / partial
- severity
- fix required
- owner

## Definition of “working product” for Hashapp
To count as a working product, Hashapp should have:
- a real wallet connection story
- a real or credibly demonstrated permission issuance flow
- one real in-bounds permissioned action
- one real out-of-bounds rejection
- no dead CTAs in the core flow
- no fake proof on failed actions
- no major custody ambiguity

## Rule
Do not confuse beautiful simulation with product truth.
A strong prototype is useful, but this audit exists to force clarity on what is actually real.

# SPEND PERMISSIONS

## Core model
Hashapp should be explicitly **non-custodial**.

Money lives in:
- the user’s connected wallet
- or preferably a Base smart wallet / smart account

Hashapp does not hold funds. It manages:
- allocations
- permissions
- approvals
- receipts
- trusted destinations

## Product promise
**Your wallet, your linked agent’s permissions.**

## Plumbing
### Layer 1 — funds
Funds remain under user control in the connected wallet / smart wallet.

### Layer 2 — rules
Hashapp stores user-facing policy:
- max spend
- allowed vendors
- recurring allowed/blocked
- approval thresholds
- active spend permissions

### Layer 3 — scoped authority
The linked agent acts through bounded authority:
- session key
- smart wallet permission
- or spend permission primitive

The linked agent never gets full wallet control.

### Layer 4 — enforcement
#### App / backend layer
Fast policy logic decides:
- auto-approve
- quick prompt
- block
- escalate

#### Wallet / session / paymaster layer
Hard constraints enforce:
- allowed vendor / payee
- max spend
- cadence
- expiry
- active or revoked permission state

## Important framing
Rules decide what **should** happen.
Permissions decide what **can** happen.

## Recurring spend permission example
### DataStream Pro
User approves:
- vendor = DataStream Pro
- amount = $89 USDC
- cadence = monthly
- revocable = yes

When the linked agent renews:
1. app checks if policy still allows it
2. permission layer checks if spend permission is still valid
3. if valid, payment settles
4. if revoked or rule changed, payment is blocked

This is Hashapp’s clearest Track 1 feature for conditional payment.

## Product objects
### Presets
Simple, consumer-friendly bundles:
- Research mode
- Trusted vendors only
- Manual approval only
- No recurring charges

### Custom permissions
Power-user controls:
- add vendor
- remove vendor
- raise cap
- lower cap
- toggle recurring
- change approval threshold
- shorten or extend expiry
- revoke specific permission

## UX placement
### Rules
- presets
- general rule toggles

### Money / Linked Agent
- active spend permissions
- recurring permissions
- vendor-specific limits
- revoke / edit / pause actions

## Language guidance
Preferred:
- Available for linked agent
- Allocated to linked agent
- Protected by your rules
- Spend permission
- Active permission
- Revoked

Avoid:
- Hashapp balance
- deposit into Hashapp
- funds stored here

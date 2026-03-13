# UX

## Visual direction
- dark mode first
- Cash App-style financial UI
- soft cards, large numbers, clear spacing
- dense but readable activity list
- premium consumer feel, not enterprise tooling
- normal money app for abnormal agent behavior
- consumer-grade clarity over protocol jargon

## UX principles
- minimize **fatigue of permission**
- default to silent success when safely in-bounds
- make approvals feel lightweight and reversible
- show intent, not raw blockchain internals
- translate failures into human-readable explanations
- show USD value wherever money appears
- one obvious next action per state

## Main tabs
1. Home
2. Activity
3. Pay / Approvals
4. Payees
5. Agents / Rules

## Core screens
### Home
- total balance
- active agent budgets
- pending approvals
- recent activity
- quick actions
- global exposure across the fleet

### Activity
- chronological feed
- large amounts
- short event labels
- human-readable statuses
- tap into receipt detail
- support filtering by agent, service, or status
- feed should be intent-aware, not explorer-style
- every money amount should have USD context

### Pay / Approval
- incoming purchase requests
- approve / deny / always allow under rule
- show reason, vendor, amount, policy match
- clearly distinguish manual approvals vs auto-approved actions
- clearly distinguish low-risk scope updates vs high-risk re-auths
- only one obvious primary action at a time

### Payees
- search by ENS, Basename, address, agent name, service name
- trusted payees
- verified services
- avatars everywhere
- recent and favorite destinations
- human-readable identity first, raw address second

### Agent detail
- linked identity
- active rules / persona
- allowed vendors
- daily / per-tx limits
- budget remaining
- pause / revoke
- session status

## Escalation UX
### Intra-session
- no prompt
- silent execution
- receipt appears after action

### Policy shift
- quick prompt
- simple language like “ResearchBot needs 1 more week” or “Approve this related vendor?”

### Out-of-bounds
- full re-auth
- clear explanation of what changed materially

## Failure states
Avoid generic blockchain failure language.

Prefer:
- Payee identity mismatch
- Budget exceeded
- Session expired
- Requires updated approval
- New vendor needs confirmation

Avoid:
- Transaction failed
- Execution reverted
- Policy hook rejected

## Onchain UX rules
- onchain actions need their own loader and disabled state
- buttons should stay disabled until confirmation, not just wallet signature
- do not show multiple conflicting primary actions at once
- address displays should prefer resolved identity and readable components over raw hex

## Fleet UX
The product should feel just as good with one agent as with five.

### Human mental model
- one owner
- multiple agents
- each agent has a role, budget, and trust boundary
- one place to see aggregate exposure and recent behavior

## UX thesis
The app should make compartmentalized agent autonomy feel safe, legible, and fast.

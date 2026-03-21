# FLOWS

## Core demo flow
### Goal
Show Hashapp as the spending app for a research agent.

### Demo actor
- Human owner
- Agent: **Research Agent**

### Demo sequence
1. User opens Hashapp directly on the **Activity** screen.
2. Feed shows recent activity from Research Agent.
3. A new purchase request arrives live.
4. User approves the request.
5. Successful receipt appears in the feed.
6. User visits rules and changes one plain-English policy.
7. Research Agent attempts another purchase.
8. Request is blocked.
9. Blocked receipt appears in the feed with a clear reason.

## Screen-by-screen flow

### 1. Activity (hero screen)
#### Purpose
This is the product. Trust is made visible here.

#### What the user sees
- agent avatar + name
- merchant/service
- amount
- one-line reason
- matched rule or blocked reason
- status chip
- timestamp

#### Key actions
- tap into receipt detail
- filter by agent or status
- jump to request needing approval

#### Example rows
- Research Agent bought research credits for today’s market scan.
- Approved — within research budget.
- Blocked — exceeds daily research limit.
- New vendor needs confirmation.

### 2. Receipt detail
#### Purpose
Show that every action has an understandable explanation and proof trail.

#### Sections
- header with icon, vendor, amount, status
- agent name + avatar
- why the purchase happened
- which rule matched or failed
- session / approval mode
- transaction hash or proof link
- timestamp

### 3. Approval request
#### Purpose
Handle manual approvals with a single obvious decision.

#### What the user sees
- agent name
- vendor/service
- amount with USD context
- one-sentence rationale
- matched rule status
- approve / deny / always allow options

#### UX rule
Only one clear next action at a time.

### 4. Rules / preset screen
#### Purpose
Make policy understandable in plain English.

#### What the user sees
- active preset/persona
- plain-language rules
- toggle or slider style edits
- preview of what changes trigger quick prompt vs full re-auth

#### Example rules
- Up to $20/day on research tools
- Always ask above $5
- Never buy from unknown vendors
- Trusted vendors can auto-renew within budget

### 5. Agent detail
#### Purpose
Show the trust boundary for one agent.

#### What the user sees
- agent identity
- avatar
- ENS / Basename if available
- current budget remaining
- session status
- active preset
- trusted payees
- pause / revoke controls

### 6. Payees
#### Purpose
Let the user inspect trusted destinations and understand who the agent is allowed to spend with.

#### What the user sees
- search by ENS, Basename, address, agent name, service name
- trusted payees
- recent vendors
- verified services
- identity-first display, address second

## Escalation flows
### Intra-session
- no prompt
- request executes
- receipt appears in feed

### Policy shift
- quick prompt
- user approves a lightweight scope adjustment
- agent continues under updated scope

### Out-of-bounds
- full re-auth required
- clear explanation of what changed materially

## Build broad, demo narrow note
The app can support many surfaces, but the live story should stay centered on the activity feed, one approval, one rule change, and one blocked purchase.

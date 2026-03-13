# POLICY MODEL

## Product goal
Hashapp should let humans control agent spending without forcing them to think in low-level wallet permissions all day.

The user-facing abstraction is a **policy preset**.
The enforcement abstraction is a **scoped session**.

## Core split
### Static policy
Static policy should live closer to the wallet / session / paymaster layer.

Examples:
- expiry window
- max spend ceiling
- allowed executor
- stable payee allowlist
- call target allowlist

### Dynamic policy
Dynamic policy should live in the app layer.

Examples:
- trusted status
- auto-approve behavior
- contextual checks
- receipt logic
- human-readable policy edits
- escalation rules

## Escalation model
### Quick prompt
Use a quick prompt when a request is unusual but does not require changing the durable spending scope.

Examples:
- outlier spend inside a broad category
- lower-confidence trusted status
- contextual mismatch
- one-off override request

### Session refresh
Use a session refresh when a hard boundary changes materially.

Triggers:
- spend ceiling changes
- expiry changes
- payee allowlist changes
- allowed action / call target changes
- agent role changes
- approval mode changes that affect hard enforcement

## Preset model
Users should not think in terms of rebuilding session keys.
They should think in terms of policy presets.

Example presets:
- Manual only
- Trusted vendors only
- Research mode
- Trading mode
- Ops mode
- High-risk / always confirm

Each preset maps to:
- one app-layer policy bundle
- one or more static session constraints
- one escalation strategy

## Human mental model
- I choose what kind of freedom this agent has.
- The app handles the details.
- If the request is normal, it flows.
- If it is risky, I get asked.
- If I change the rules materially, the app refreshes the scope.

## Fleet model
Hashapp should support one human controlling multiple agents.

Each agent has:
- its own preset
- its own session
- its own budget
- its own payee set
- its own activity stream

The human gets:
- per-agent control
- global exposure overview
- cross-agent activity
- unified revoke / pause controls

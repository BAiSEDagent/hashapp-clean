---
name: hashapp
description: "Use Hashapp as a human-controlled money surface for agents. Authenticate with the gateway, send spend/payment requests, poll for human replies, and request structured decisions under bounded authority. Use when an agent needs to ask for approval, explain a payment, handle denial, or operate with receipts and onchain proof instead of raw wallet access. Example triggers: 'send this request to Hashapp', 'ask the human to approve this payment', 'poll Hashapp for replies', 'request a structured decision', 'use Hashapp for bounded agent spending'."
---

# Hashapp

## Purpose
Hashapp is a **BYOA money app for agents**.

It gives agents a human-controlled surface for requesting financial actions without requiring blank-check wallet access. Use this skill when an agent needs to send a request, wait for human input, operate inside bounded authority, and keep outcomes legible through receipts and onchain proof.

## Use this skill when
- an agent needs to send a spend or payment request to a human
- an agent needs to poll for approval, denial, or clarification
- an agent needs a structured recommendation before asking for money movement
- an agent needs to operate under bounded authority instead of direct wallet control
- an agent needs to explain a financial action in a way the human can review

## Do not use this skill when
- the task is generic wallet management with no human approval surface
- the task is generic chat unrelated to money movement
- the task is speculative trading detached from payment / approval workflows
- the agent intends to claim full wallet autonomy

## Core Product Truth
Hashapp is:
- the control layer
- the bounded-authority layer
- the receipt / provenance layer
- the human approval surface for agentic money actions

Hashapp is not:
- a generic wallet manager
- a generic trading terminal
- a generic AI chat product

Canonical product domain:
- `https://hashapp.finance/`

Canonical repo:
- `https://github.com/BAiSEDagent/hashapp`

Current live deployment may vary by environment. Do not claim an endpoint is live unless verified.

## Integration Model
An external agent integrates with Hashapp through a **gateway**.

Expected loop:
1. agent authenticates
2. agent sends a message or structured request
3. human reviews in Hashapp
4. human replies, approves, or denies
5. agent polls for the result
6. the outcome is tied back to receipts / proof when applicable

## Authentication
Hashapp gateway calls are authenticated with an **agent API key**.

Treat the agent key as a secret:
- do not print it in logs
- do not paste it into public channels
- do not store it in public repo files
- do not expose it in screenshots or demos

## Core Endpoints
### 1) Send a message into Hashapp
`POST /api/gateway/message`

Use when the agent needs to send:
- a request summary
- a clarification prompt
- a payment / spend explanation
- a status update for the human

### 2) Poll for replies
`GET /api/gateway/messages`

Use when the agent needs to:
- retrieve human replies
- retrieve the latest approval / denial context
- stay synchronized with the human approval loop

### 3) Request a structured decision
`POST /api/gateway/reason`

Use when the agent needs a machine-readable recommendation before acting.

Expected reasoning output usually includes:
- decision
- vendor
- amount
- rationale

### Venice-backed reasoning usage
For private reasoning inside Hashapp, prefer the Hashapp surface rather than calling Venice directly from an external agent.

In the current repo, Hashapp's Venice integration is wired to:
- Venice base URL: `https://api.venice.ai/api/v1`
- model: `llama-3.3-70b`

Use `POST /api/gateway/reason` when you need Hashapp to produce a machine-readable recommendation backed by Venice-style private reasoning.

Good use cases:
- evaluating a new vendor
- checking whether an unusual amount should be escalated
- deciding whether to ask for approval now or wait
- requesting a concise rationale before sending a spend request

Suggested request shape:
```json
{
  "context": "private wallet state, vendor info, and budget constraints",
  "messages": [
    {
      "role": "user",
      "content": "Should I request this vendor now?"
    }
  ]
}
```

Expected response shape:
```json
{
  "decision": "approve",
  "vendor": "DataStream Pro",
  "amount": 5,
  "reason": "Within cap and low risk"
}
```

Agent rule:
- ask Hashapp for the recommendation
- treat the response as a recommendation, not automatic execution
- do not claim direct Venice execution unless the exact path is verified
- do not describe Venice as the whole product
- treat Venice as a private reasoning layer that informs trusted public action

## Recommended Request Shape
When an external agent is deciding what to send, this is the right semantic structure:

```json
{
  "agentId": "external-agent-identifier",
  "intent": "purchase",
  "payee": "Vendor or service name",
  "amount": "numeric amount",
  "token": "USDC",
  "reasonSummary": "why the spend matters",
  "swapToPayAllowed": true,
  "privateReasoningUsed": false
}
```

The exact transport shape may vary by endpoint, but the semantics should stay this clean.

## Agent Behavior Rules
### 1. Ask, don’t assume
Hashapp is built around **bounded authority**. An agent should request action clearly instead of assuming full wallet control.

### 2. Prefer structured requests over vague chat
Good requests contain:
- what is being requested
- vendor / payee
- amount
- token
- why it matters
- whether swap-to-pay is needed
- whether private reasoning was involved

### 3. Treat human reply as part of the transaction context
A human reply is part of the control and audit surface.

### 4. Expect denial paths
Hashapp is designed to reject out-of-policy actions. An agent must handle:
- approval
- denial
- clarification request
- retry after changed conditions

### 5. Never overclaim execution
Differentiate clearly between:
- recommendation
- approval
- execution
- receipt / proof

## Approval / Denial Semantics
When a human or policy denies a request, the agent should treat the denial as first-class state.

Good denial handling:
- store the denial reason
- stop execution
- ask for clarification only if useful
- do not silently retry the same request forever

Good approval handling:
- proceed only within the approved scope
- surface the resulting receipt / proof if execution occurs
- preserve any transaction or receipt identifiers

## Truth-Safe Framing
### Safe framing
- “Hashapp is a human-controlled money surface for agents.”
- “Hashapp lets agents operate under bounded authority.”
- “Hashapp provides readable approvals, denials, receipts, and onchain proof where applicable.”

### Unsafe framing
- “Hashapp gives agents full wallet autonomy.”
- “Everything is enforced onchain” unless verified for the exact path
- “All surfaces are live” unless verified in the current deployment
- “Uniswap execution is proven” unless that path is actually tested in the live environment

## MetaMask / Venice / Uniswap Role
### MetaMask
MetaMask delegation is a core proof and bounded-authority layer. Frame it as delegated authority with onchain enforcement.

### Venice
Venice is a **private reasoning layer** inside the product. Do not frame it as a standalone app mode.

For external agents, the preferred usage path is:
1. send context to Hashapp
2. call `POST /api/gateway/reason` when a structured recommendation is needed
3. treat the response as a recommendation, not automatic execution
4. if the human or policy approves, continue through the normal request / receipt flow

### Uniswap
Frame Uniswap as **Swap to Pay**. Do not frame Hashapp as a generic trading product.

## Examples
### Example 1 — Request approval for a small tool purchase
User says: "Ask Hashapp to approve $5/month for DataStream Pro."

Agent should:
1. create a structured request with vendor, amount, token, and reason
2. send it through `POST /api/gateway/message`
3. poll `GET /api/gateway/messages`
4. report the human reply faithfully

Expected outcome:
- the request appears in Hashapp
- the human can approve, deny, or clarify
- the agent receives the outcome without pretending the payment already happened

### Example 2 — Handle a denial
User says: "Try $60 for the vendor."

Agent should:
1. send the request clearly
2. poll for reply
3. if denied, store the denial reason
4. stop execution and report the denial cleanly

Expected outcome:
- no fake success message
- denial reason preserved
- agent does not silently retry forever

### Example 3 — Ask for structured reasoning before requesting payment
User says: "Use Hashapp to decide whether this vendor charge is worth asking for."

Agent should:
1. call `POST /api/gateway/reason`
2. inspect decision / amount / rationale
3. if appropriate, send a concise request into Hashapp
4. poll for the human result

## Troubleshooting
### 401 / unauthorized
Cause:
- missing or invalid agent API key

Fix:
- verify the correct gateway key is being used
- check that it is being sent exactly as expected by the integration
- do not print the key while debugging

### Request sent but no reply appears
Cause:
- polling too early
- wrong environment / deployment
- human has not replied yet

Fix:
- continue polling at a reasonable interval
- verify the deployment URL and environment
- report waiting state instead of hallucinating a response

### Human denies the request
Cause:
- policy boundary, amount threshold, vendor trust, or manual rejection

Fix:
- preserve the denial reason
- stop execution
- ask for clarification only if it would genuinely change the request

### Onchain proof not available yet
Cause:
- action was only requested or approved, not yet executed
- receipt path not complete for the current flow

Fix:
- state the exact current stage
- do not claim a receipt or tx exists unless it exists

## Success Condition
A correct Hashapp integration means:
- the agent authenticates successfully
- the agent can send a request into the human surface
- the human can reply / approve / deny
- the agent can poll and receive the result
- the resulting action stays legible and bounded
- proof / receipts are preserved when execution happens

## Rule
Hashapp should make agent money movement **safer, more legible, and more accountable**.
If an integration makes it look like a blind-autonomy wallet, it is using the product wrong.

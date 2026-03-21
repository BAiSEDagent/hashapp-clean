# DEMO SCENARIO

## Chosen demo lane
**Research agent**

This is the best current demo scenario because it is:
- believable for the hackathon audience
- easy to explain
- aligned with agent usage today
- compatible with paid APIs, credits, or research tooling
- more natural for receipts and approvals than travel or consumer lifestyle examples

## Named agent
Use a real agent identity with:
- name
- avatar
- ENS / Basename if available

Working name options:
- Research Agent
- Kai
- Atlas

Current favorite: **Research Agent**

## Demo thesis
Your research agent should be able to buy what it needs without getting your whole wallet.

## 90-second demo loop
1. Open Hashapp on the **activity feed**.
2. Show recent purchases from Research Agent with reasoning and status.
3. New live request appears:
   - Research Agent wants to spend a small amount on research credits / API access for today’s market scan.
4. User taps approve.
5. Receipt lands in the feed with:
   - agent name
   - vendor/service
   - amount
   - matched rule
   - short reason
   - success state
6. User flips a plain-language rule.
7. Research Agent tries another request that now violates policy.
8. Request is auto-blocked.
9. Feed shows a clear human-readable blocked state.

## Example feed copy
- Research Agent bought research credits for today’s market scan.
- Approved — within research budget.
- Blocked — exceeds daily research limit.
- New vendor needs confirmation.

## Rule style
Rules should be plain English.

Examples:
- Up to $20/day on research tools
- Always ask above $5
- Never buy from unknown vendors
- Trusted vendors can auto-renew within budget

## Demo hero
The hero of the demo is the **receipt feed**, not just the approval modal.

The feed should make trust visible.

## Product framing for demo
Hashapp is the spending app for your AI.

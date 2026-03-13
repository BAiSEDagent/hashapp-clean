# Replit Agent 4 Handoff

Use `SKILL.md` in this repo first.

Repo:
`https://github.com/BAiSEDagent/hashapp-design`

## Build request
Build the first Hashapp prototype from this repo.

Hashapp is a **consumer-grade spending app for AI agents**.
It should feel like a premium, mobile-first finance app — not a crypto dashboard, not an admin panel, not a terminal.

## What to build first
Focus on the core research-agent demo lane.

Named agent: **Scout**

The hero of the product is the **activity feed**.
That is the most important screen.

## Required v1 surfaces
- Activity feed
- Receipt detail
- Approval request flow
- Rules / preset screen
- Agent detail
- Payees / trusted destinations

## Required demo behavior
1. Open on the Activity screen.
2. Show recent purchases from Scout.
3. A new purchase request appears live.
4. User approves it.
5. Receipt appears in the feed.
6. User changes one plain-English rule.
7. Scout attempts another purchase.
8. The request is blocked.
9. Blocked state appears clearly in the feed.

## Design direction
Use the attached Cash App references for:
- hierarchy
- spacing
- rhythm
- avatar treatment
- financial confidence

Do **not** clone Cash App literally.
Hashapp should feel:
- darker
- more premium
- more trust-oriented
- more agent-native

## Use these reference images
- `IMG_8008.jpg` → Activity feed
- `IMG_8009.PNG` → Receipt detail
- `IMG_8010.PNG` → Amount entry / CTA hierarchy
- `IMG_8012.PNG` → Home / balance hierarchy
- `IMG_8023.PNG` → Payees / contacts search and selection
- optional: `IMG_8022.PNG` → no-match / search-empty state

## Product rules
- show intent, not raw tx data
- plain-English rules only
- human-readable failure states
- avatar-first identity
- one clear next action per state
- the feed is the product

## Anti-patterns
Do not build:
- a cyber dashboard
- a terminal UI
- chart-heavy admin software
- raw-hex-first wallet screens
- multiple competing primary CTAs

## Supporting docs in repo
Read these after `SKILL.md`:
- `README.md`
- `PRODUCT.md`
- `ARCHITECTURE.md`
- `UX.md`
- `POLICY_MODEL.md`
- `FLOWS.md`
- `DATA_MODEL.md`
- `REVIEWS.md`
- `DEMO_SCENARIO.md`
- `STRATEGY.md`

## Success condition
A judge should see the prototype for 30 seconds and immediately understand:
- this is the spending app for AI agents
- this makes agent purchases feel safe
- this is consumer-grade
- this should exist

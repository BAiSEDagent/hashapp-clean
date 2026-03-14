# DECISION LOG

Track meaningful product, UX, architecture, and scope decisions here.

---

## Template

### Date
YYYY-MM-DD

### Decision
What was decided

### Why
Why we chose it

### Alternatives considered
- option A
- option B

### Status
- Active / Revisit later / Rejected / Replaced

### Notes
Additional context

---

## 2026-03-13 — Hashapp name and product direction

### Decision
Use **Hashapp** as the working product name and define it as a consumer-grade spending app for AI agents.

### Why
It has more product energy than dry infrastructure names and supports the trust/receipt/proof narrative without sounding like generic middleware.

### Alternatives considered
- Scope
- Clerk
- Tab
- Allowance

### Status
Active

### Notes
Hashapp reads better as a product, while the repo `hashapp-design` remains the concept workspace.

---

## 2026-03-13 — Build broad, demo narrow

### Decision
Use agents to build broad product surface area, but keep the live demo centered on one tight story.

### Why
Implementation speed is abundant; clarity and emotional punch are scarce.

### Alternatives considered
- tiny build / tiny demo
- broad build / broad demo

### Status
Active

### Notes
This is now a core strategic principle for the project.

---

## 2026-03-13 — Research agent demo lane

### Decision
Use a **research agent** as the primary demo scenario, with Scout as the named example agent.

### Why
It is believable for the hackathon audience, fits agent tooling, and makes approvals/receipts legible.

### Alternatives considered
- travel assistant
- grocery assistant
- generic agent wallet demo

### Status
Active

### Notes
The activity feed is the hero of this demo.

---

## 2026-03-13 — Hybrid trust model

### Decision
Keep hard constraints near the wallet/session layer and dynamic trust logic offchain.

### Why
This gives real enforcement without turning the product into a slow or overcomplicated permissions console.

### Alternatives considered
- everything onchain
- everything offchain

### Status
Active

### Notes
Session keys and paymaster constraints are central to the product narrative.

---

## 2026-03-13 — Activity feed is the hero

### Decision
Center the product and demo on the activity feed rather than settings, rules, or architecture views.

### Why
Trust is made visible in the feed. That is the most emotionally legible surface.

### Alternatives considered
- rules-first demo
- money-first demo
- agent profile-first demo

### Status
Active

### Notes
Approvals are a feature. The feed is the product.

---

## 2026-03-13 — Money is non-custodial

### Decision
Hashapp should represent money as living in the user’s connected wallet / smart wallet, not inside Hashapp.

### Why
The app should manage permissions and allocations, not custody user funds.

### Alternatives considered
- custodial app balance
- app-held escrow as default product model

### Status
Active

### Notes
Preferred language: “Available for Scout”, “Allocated to Scout”, “Protected by your rules”.

---

## 2026-03-13 — Trusted Destinations merged into Activity

### Decision
Move trusted payee rail + search into Activity instead of keeping Trusted Destinations as a fully separate top-level history surface.

### Why
Cash App’s product grammar already merges contacts/search/history in Activity. Separate tabs created redundancy.

### Alternatives considered
- keep Trusted Destinations as separate top-level tab
- repurpose Trusted Destinations as a relationship management screen

### Status
Active

### Notes
Preferred top-level nav direction: Money, Activity, Scout, Rules.

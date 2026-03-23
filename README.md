# Hashapp

Hashapp is a BYOA money app for agents — a control, proof, and receipt layer for agentic spending.

Humans connect a wallet, link an agent, set bounded authority, approve or deny requests, and inspect what happened afterward through readable receipts and onchain proof.

## What Hashapp is
Hashapp is built around one idea:

**agents should be able to act with bounded authority, not blank-check access.**

That means the product focuses on:
- linking agents to a human-controlled wallet
- defining spend boundaries and approval rules
- making agent actions legible
- producing proof and receipts after money moves

Hashapp is **not**:
- a generic wallet manager
- a generic trading terminal
- a chat shell with a wallet bolted on

## Current thesis
Hashapp lets humans:
- link agents
- set bounded authority
- approve or auto-approve safe actions
- monitor activity in a readable feed
- revoke access instantly
- verify outcomes through onchain proof

## What is real today
The strongest proven part of Hashapp today is the **bounded spend / proof layer**.

From the current proof work in this repo:
- a human smart wallet can grant an agent bounded spend authority
- the agent can spend within those bounds successfully
- out-of-policy behavior is rejected onchain with named errors
- the proof runs on Base Sepolia using audited infrastructure

See:
- [`TRACK1_PROOF.md`](./TRACK1_PROOF.md)
- [`SPEND_PERMISSIONS.md`](./SPEND_PERMISSIONS.md)

## Venice track fit
Venice fits Hashapp as an **optional private reasoning layer** behind money decisions.

Best framing:
- private cognition
- trusted public action
- user-controlled privacy

In Hashapp, Venice should help with things like:
- evaluating new vendors
- reviewing unusual charges
- escalating ambiguous requests
- adding a private reasoning layer before a human approves a spend

Important:
- Venice is **not** the product
- Venice is a capability layer inside the product
- Venice should appear as a private reasoning layer, not as a separate “Venice Mode” or a hardcoded assistant flow

See:
- [`partner-tracks/VENICE.md`](./partner-tracks/VENICE.md)

## MetaMask track fit
Hashapp is strongly aligned with MetaMask’s delegation direction because the core user promise is bounded agent authority.

Submission-relevant proof already points to:
- scoped spending permissions
- delegated spend execution
- rejection of out-of-policy actions
- auditable onchain history

## Uniswap track fit
Uniswap fits Hashapp when framed as **Swap to Pay**, not as a generic DEX UI.

The strategic role of Uniswap inside Hashapp is:
- letting agents or humans move into the right asset to complete a payment
- preserving transparency and composability
- keeping settlement inside the same money-action flow

## Demo lane
Current demo lane:
- **Research agent**

The clean demo story is:
1. human links an agent
2. human gives bounded authority
3. agent requests or executes a payment within policy
4. human sees the request / approval state
5. result appears with proof and receipt context

## Repo guide
- `/app` — integrated application workspace
- `/docs` — product, proof, ops, and strategy docs
- `/partner-tracks` — sponsor-specific framing
- `/scripts` — helper scripts and demo utilities
- `/TRACK1_PROOF.md` — current proof summary
- `/PRODUCT.md` — product truth

## Read this next
If you are evaluating the project, start here:
- [`PRODUCT.md`](./PRODUCT.md)
- [`TRACK1_PROOF.md`](./TRACK1_PROOF.md)
- [`partner-tracks/VENICE.md`](./partner-tracks/VENICE.md)

## Honest status
Hashapp is best understood today as a serious prototype with real proof in the bounded-spend layer and a strong product thesis around agent control, approvals, and receipting.

The repo already contains product framing, partner-track strategy, and proof work. The job now is to compress that into one coherent submission story without overclaiming what is not yet proven.

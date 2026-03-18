---
name: hashapp
description: "Repo-local operating guide for Hashapp. Use when onboarding agents, refining BYOA identity, integrating MetaMask delegation, Venice private reasoning, Uniswap Swap to Pay, or updating product/proof docs in the canonical Hashapp repo."
---

# Hashapp Repo Skill

## Product truth
Hashapp is a **BYOA money app for agents**.

It is:
- a bounded-authority control plane
- a payment and receipt layer
- a proof surface for agentic actions

It is not:
- a generic wallet manager
- a generic swap terminal
- a chat-first shell
- a partner-feature showcase

## Locked stances
### MetaMask
- MetaMask delegation flow is real and proven
- Treat the delegation rail as the canonical payment proof path

### Uniswap
- Feature name: **Swap to Pay**
- Uniswap is conversion/settlement infrastructure inside payment flow
- Do not let Hashapp read like a DEX dashboard

### Venice
- Venice is an agent capability, not the product
- No `Venice Mode`
- No separate Venice tab
- Best surfaces: Agent page, Activity provenance, Receipt disclosure

### Agent identity
- Defaulting to `Scout` weakens BYOA
- Honest empty state: `No Agent Connected`
- CTA: `Connect Agent`
- Internal concept: `Link Agent`
- Structured request flow beats chat-first for v1

## Start here in the repo
Read these first:
- `PRODUCT.md`
- `TRACK1_PROOF.md`
- `docs/product/AGENT_LINK.md`
- `partner-tracks/VENICE.md`
- `partner-tracks/UNISWAP.md`

## Current high-value surfaces
- `app/artifacts/hashapp/src/pages/Agent.tsx`
- `app/artifacts/hashapp/src/pages/Activity.tsx`
- `app/artifacts/hashapp/src/pages/Receipt.tsx`
- `app/artifacts/hashapp/src/context/DemoContext.tsx`

## Repo rule
Canonical repo: `BAiSEDagent/hashapp`
Use repo docs for project truth and keep changes aligned with the canonical `main` branch.

# Base-Native Execution Checkpoint

## Decision rule
Hashapp should default to a **fully Base-native permission stack** unless the Base session-key path proves materially risky in practice.

MetaMask remains a fallback / comparison path, not the default.

## Why
- strongest product coherence
- strongest Base-native demo story
- strongest partner alignment
- better chance of looking like we built the category instead of adapting a generic delegated-permission toolkit

## The risk
The real risk is not architecture purity. The risk is implementation drag around:
- dynamic payee allowlists
- revocation mid-session
- updating scope without awkward UX
- session-key nuances under deadline pressure

## Engineering checkpoint
Before widening the discussion again, prove one minimal Base-native scoped-session flow.

### Minimal proof scope
1. Human sets policy params
2. Human issues scoped key to a linked agent
3. Linked agent attempts in-bounds action
4. In-bounds action succeeds
5. Linked agent attempts out-of-bounds action
6. Out-of-bounds action auto-rejects

## Success criteria
If this flow works cleanly, we stay fully Base-native.

If this flow breaks badly or becomes too costly in engineering time, we reopen the MetaMask fallback discussion.

## What this proves
- Base session-key path is viable for Hashapp
- spend caps are real
- scoped permissions are real
- revocable control story is believable
- Track 1 foundation is credible

## Rule
Do not reopen the Base vs MetaMask debate on vibes alone.
Reopen it only if the minimal Base-native proof exposes a concrete blocker.

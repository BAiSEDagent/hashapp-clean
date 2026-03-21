# Base-Native Permission Proof Brief

## Goal
Prove the minimal Base-native permission model for Hashapp.

This is not a full production implementation. It is a narrow technical checkpoint to answer one question:

**Can Base smart wallet / session primitives enforce the Hashapp spend-permission model cleanly enough for the hackathon?**

## Success criteria
The proof is successful if we can demonstrate:
1. Human sets policy params
2. Human issues scoped authority to Agent
3. Agent performs one in-bounds action successfully
4. Agent attempts one out-of-bounds action
5. The out-of-bounds action is rejected automatically by the permission boundary

## Scope
### Keep it minimal
Do not build the whole app stack.
Do not build full backend orchestration.
Do not build polished UI.

This is an engineering proof, not a demo product.

## Required policy params
At minimum:
- spend cap
- expiry window
- allowed payee or call target
- executor identity (Agent)

## Suggested example
### In-bounds case
- Agent is allowed to spend up to `$50 USDC`
- only to an approved research vendor / call target
- within an active expiry window

### Out-of-bounds case
- Agent attempts `$89 USDC`
- or a different vendor / target
- or after expiry

Expected result:
- in-bounds passes
- out-of-bounds rejects cleanly

## What to capture
- which Base primitive is being used (session key, smart wallet permission, paymaster policy, etc.)
- exact constraints that are enforceable today
- anything that had to remain app-layer only
- any Base-specific gotchas
- whether recurring / spend-permission behavior feels realistic enough for Hashapp

## Output format
Please return:
1. **Recommendation** — is the Base-native path viable?
2. **What worked**
3. **What failed / was awkward**
4. **What remains offchain only**
5. **Go / no-go** on staying fully Base-native for the hackathon

## Important
We are not optimizing for abstract architecture purity.
We are optimizing for:
- strongest real demo
- least wasted plumbing work
- clearest Track 1 story
- highest confidence path to something judges will believe

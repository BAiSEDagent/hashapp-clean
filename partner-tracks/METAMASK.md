# MetaMask

## Why it fits Hashapp
MetaMask delegation is one of the strongest real proof surfaces in Hashapp.

Hashapp’s core promise is that an agent can act with bounded authority instead of raw wallet access. MetaMask’s delegation model maps directly to that promise:
- scoped permissions
- delegated execution
- bounded spend
- auditable onchain enforcement

## Product role
MetaMask is not decorative sponsor fit.
It is a core implementation and proof layer for Hashapp’s money-control model.

In Hashapp, MetaMask helps prove that:
- humans can grant limited authority to agents
- agents can act inside those limits
- out-of-policy behavior can be rejected by infrastructure, not just UI copy
- receipts and proof can point to something real onchain

## Best framing
The right MetaMask framing for Hashapp is:

> Delegated authority with verifiable onchain enforcement.

That is stronger than generic wallet connectivity and more specific than “smart wallets.”

## What MetaMask proves in Hashapp
MetaMask is strongest when it proves a real bounded-authority loop:
1. human grants scoped authority
2. agent requests or executes within scope
3. allowed action succeeds
4. out-of-bounds action is rejected
5. result is legible through receipts and proof

That makes MetaMask central to the product’s trust story.

## Submission value
For Synthesis, MetaMask strengthens Hashapp because it turns the product thesis into something judges can verify:
- delegated permissions are real
- bounded spend is real
- enforcement is real
- onchain proof exists

This is one of the clearest links between the product story and the technical proof.

## What not to do
- do not reduce MetaMask to “wallet support”
- do not bury it as a secondary compatibility note
- do not widen the pitch into a generic multi-wallet story
- do not let the implementation detail overpower the product thesis

## Rule
MetaMask delegation should be framed as a core bounded-authority primitive inside Hashapp, not as a side integration.

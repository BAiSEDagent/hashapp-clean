# CURRENT_TRUTH

## Product
Hashapp is the spending app for AI agents.

## Product truth
- BYOA remains the product model
- user wallet stays in control
- agent gets bounded delegated authority
- Hashapp is the control / proof / receipt layer

## Canonical branches
- fallback shell: `integration/truth-pass-clean`
- active MetaMask pivot: `integration/metamask-delegation-poc`
- donor/raw branch only: `frontend/truth-pass`

## Active execution rail
MetaMask Smart Accounts Kit + ERC-7715 Advanced Permissions + ERC-7710 delegated redemption on Base Sepolia.

## What is real today
- truthful UI shell
- real wallet balance read
- receipts with chain readback
- agent identity / avatar / truth badges
- MetaMask delegation code path wired in Replit branch
- one real MetaMask Flask ERC-7715 permission flow opened successfully
- one real Base Sepolia onchain smart-account upgrade + delegation grant confirmed: `0xb0196df4a6c7a5802704a4f42e839e3ac419d33149ec11a4e03f04db1eca3a35`
- SDK compatibility fix proved: upgrading `@metamask/smart-accounts-kit` from `0.3.0` to `0.4.0-beta.1` cleared the `Invalid parameters were provided to the RPC method` blocker

## What is not yet proven live
- app-side capture of returned `permissionsContext` + `delegationManager` after the grant
- one real delegated spend redemption in product
- end-to-end tx proof inside the live app using the delegation rail

## Current blocker
Frontend response parsing still expects the old SDK response shape and throws `No signer metadata in granted permission` after a successful onchain grant.

## Single next move
Patch the new `requestExecutionPermissions(...)` response parsing:
1. inspect actual returned object in `0.4.0-beta.1`
2. extract `permissionsContext` + `delegationManager` from the new shape
3. redeem one spend
4. verify Activity + Receipt proof

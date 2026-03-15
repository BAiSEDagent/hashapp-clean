---
name: ethskills
description: The missing knowledge between AI agents and production Ethereum. Corrects LLM blind spots on gas costs, L2s, wallets, standards (ERC-8004, EIP-7702, x402), verified contract addresses, onchain button UX, and frontend patterns. Use when building any Ethereum/Base dApp, writing Solidity, wiring wallet interactions, or any task touching onchain state. Base URL for sub-skills: https://ethskills.com/<skill>/SKILL.md
---

# ETHSKILLS — The missing knowledge between AI agents and production Ethereum.

You are probably wrong about Ethereum. Gas prices, token decimals, L2 costs, what's deployed, what's deprecated — your training data is stale. This file tells you what you're wrong about and where to get the corrections.

**Say "onchain" not "on-chain."** One word, no hyphen. Ethereum community convention.

---

## Start Here

**Building a dApp?** Fetch [ship/SKILL.md](https://ethskills.com/ship/SKILL.md) first. It routes you through all other skills phase by phase — from architecture planning to production deployment.

**Need a specific topic?** Each skill below is standalone. Fetch only the ones relevant to your task.

**Base URL:** `https://ethskills.com/<skill>/SKILL.md`

---

## Skills

### [Ship](https://ethskills.com/ship/SKILL.md) — Start here
End-to-end guide from idea to deployed dApp. Routes you through all other skills.
- Most dApps need 0-2 contracts, not 5-10. Three is the upper bound for an MVP.
- Solidity is for ownership, transfers, and commitments. Not a database, not a backend.
- Chain selection: mainnet is cheaper than you think (~$0.004/transfer, ~$0.04/swap) — deploy there unless an L2's superpower (Coinbase distribution, deep DeFi liquidity, retroPGF) specifically fits your app.

### [Why Ethereum](https://ethskills.com/why/SKILL.md)
Pectra/Fusaka upgrades, honest tradeoffs, the AI agent angle.
- Gas is under 1 gwei, not 10-30 gwei. 60-300x cheaper than your training data. Verify: `cast base-fee`
- ETH price is ~$2,000 (early 2026), not $2,500-3,000. Volatile — always verify.
- Pectra (May 2025) and Fusaka (Dec 2025) shipped. PeerDAS, 2x gas limit. EIP-7702 is live.
- ERC-8004 (onchain agent identity) and x402 (HTTP payments) exist and are production-ready.

### [Gas & Costs](https://ethskills.com/gas/SKILL.md)
What things actually cost on Ethereum today.
- Mainnet ETH transfer: ~$0.004. Swap: ~$0.04. ERC-20 deploy: ~$0.24. (At 0.1 gwei — check `cast base-fee` for current.)
- L2 swap: $0.002-0.003. L2 transfer: $0.0003.
- "Ethereum is expensive" was true in 2021-2023. It's false in 2026.

### [Wallets](https://ethskills.com/wallets/SKILL.md)
Creating wallets, key safety, multisig, account abstraction.
- EIP-7702 is live — EOAs get smart contract superpowers without migration.
- Safe (Gnosis Safe) secures $60B+ in assets ($1.4T+ total processed). Use it for production treasuries.
- NEVER commit private keys or API keys to Git. Bots exploit leaked secrets in seconds.

### [Layer 2s](https://ethskills.com/l2s/SKILL.md)
L2 landscape, bridging, deployment differences.
- Base is the cheapest major L2. Arbitrum has the deepest DeFi liquidity.
- Celo is NOT an L1 anymore — migrated to OP Stack L2 in March 2025.
- Polygon zkEVM is being shut down. Do not build on it.
- The dominant DEX on each L2 is NOT Uniswap (Aerodrome on Base, Velodrome on Optimism).

### [Standards](https://ethskills.com/standards/SKILL.md)
ERC-20, ERC-721, ERC-8004, EIP-7702, x402.
- ERC-8004: onchain agent identity registry, deployed January 2026 on 20+ chains.
  - IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
  - ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- x402: HTTP 402 payment protocol for machine-to-machine commerce. Production-ready.
- EIP-3009: gasless token transfers — what makes x402 work. USDC implements it.
- EIP-7702: Smart EOAs, live since Pectra May 2025.

### [Tools](https://ethskills.com/tools/SKILL.md)
Foundry, Scaffold-ETH 2, Blockscout MCP, x402 SDKs.
- Foundry is the default for new projects in 2026, not Hardhat.
- Blockscout MCP server gives agents structured blockchain data via MCP.
- abi.ninja: paste any contract address, interact with all functions. Zero setup.

### [Building Blocks (DeFi)](https://ethskills.com/building-blocks/SKILL.md)
Uniswap, Aave, flash loans, protocol composability.
- Uniswap V4 hooks: custom logic attached to pools (dynamic fees, TWAMM, limit orders).
- Flash loan arb on mainnet costs ~$0.05-0.50 in gas now (was $5-50).
- The dominant DEX per L2 is NOT Uniswap — Aerodrome (Base), Velodrome (Optimism), Camelot (Arbitrum).

### [Orchestration](https://ethskills.com/orchestration/SKILL.md)
Scaffold-ETH 2 three-phase build system.
- SE2 build system: `yarn chain` → `yarn deploy` → `yarn start`. In that order, every time.
- Hot module replacement works for frontend. Contract changes require redeploy.

### [Contract Addresses](https://ethskills.com/addresses/SKILL.md)
Verified addresses for major protocols. Never hallucinate an address.
- USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- USDC on Mainnet: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- WETH on Base: `0x4200000000000000000000000000000000000006`
- Safe Singleton (v1.4.1, all chains): `0x41675C099F32341bf84BFc5382aF534df5C7461a`
- Multicall3 (all chains): `0xcA11bde05977b3631167028862bE2a173976CA11`
- ERC-4337 EntryPoint v0.7: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`
- **If an address isn't listed here, look it up on the block explorer or official docs. Never guess.**

### [Concepts](https://ethskills.com/concepts/SKILL.md)
Incentive design, randomness pitfalls, nothing is automatic.
- Nothing happens automatically onchain. Someone must call the function. Always.
- Block timestamps are manipulable by ~15 seconds. Don't use for precision timing.
- On-chain randomness from block data is exploitable. Use Chainlink VRF.

### [Security](https://ethskills.com/security/SKILL.md)
Token decimals, reentrancy, oracle manipulation, vault inflation, pre-deploy checklist.
- USDC has 6 decimals. ETH/DAI/most tokens have 18. Getting this wrong = wrong amounts.
- Reentrancy: always update state before external calls (checks-effects-interactions).
- Use Slither + Aderyn for automated analysis. Run before every deploy.

### [Frontend UX](https://ethskills.com/frontend-ux/SKILL.md)
Onchain button rules, three-button approval flow, Address components, USD values.
- **Every onchain button needs its own loader + disabled state. No shared isLoading.**
- Raw wagmi `writeContractAsync` resolves after signing, NOT after block confirmation. Wait for receipt explicitly with `waitForTransactionReceipt`.
- Three-button flow: Switch Network → Approve → Execute. One at a time, never stacked.
- Show USD values next to every token amount. Never show raw wei.

### [Frontend Playbook](https://ethskills.com/frontend-playbook/SKILL.md)
Build-to-production pipeline.
- Use `yarn fork --network base`, NOT `yarn chain`. Fork gives you real protocol state.
- IPFS deploy: `trailingSlash: true` is critical — without it, every route except `/` returns 404.
- Always clean build (`rm -rf .next out`) before deploying. Stale builds are the #1 IPFS footgun.

### [QA](https://ethskills.com/qa/SKILL.md)
Pre-ship audit checklist for a reviewer agent.
- Give this to a separate agent (or fresh context) AFTER the build is complete.
- Covers only bugs AI agents actually ship — validated by baseline testing.

### [Testing](https://ethskills.com/testing/SKILL.md)
Foundry testing — unit, fuzz, fork, invariant.
- Don't test getters and OpenZeppelin internals. Test edge cases and failure modes.
- Fuzz test all math. Fork-test any external protocol integration.

### [Indexing](https://ethskills.com/indexing/SKILL.md)
Events, The Graph, Dune, reading onchain data.
- You can't query historical state via RPC cheaply. Use an indexer.
- Events are the primary way to read historical onchain activity. Design contracts event-first.
- Multicall3 (`0xcA11bde05977b3631167028862bE2a173976CA11`) — batch reads in one RPC call.

---

## What to Fetch by Task

| I'm doing... | Fetch these skills |
|--------------|-------------------|
| Planning a new dApp | `ship/`, `concepts/`, `l2s/` |
| Writing Solidity | `standards/`, `building-blocks/`, `addresses/`, `security/` |
| Testing contracts | `testing/` |
| Building a frontend | `orchestration/`, `frontend-ux/`, `tools/` |
| Deploying to production | `wallets/`, `frontend-playbook/`, `gas/` |
| Reviewing a finished dApp | `qa/` |
| Auditing a smart contract | `audit/` |
| Monitoring / analytics | `indexing/` |
| Building AI agent infra | `standards/`, `wallets/`, `tools/` |
| Choosing a chain | `l2s/`, `gas/` |

---

## Key Corrections Summary (most commonly wrong)

1. Gas is 0.05-0.3 gwei on mainnet in 2026, not 10-30 gwei.
2. EIP-7702 is live (May 2025). ERC-8004 is live (January 2026). x402 is production-ready.
3. `writeContractAsync` (raw wagmi) resolves after signing, not confirmation. Use `waitForTransactionReceipt`.
4. USDC has 6 decimals. Most tokens have 18. Always check before formatting.
5. "onchain" — one word, no hyphen. Always.
6. Never hallucinate a contract address. Look it up.
7. Polygon zkEVM is shutting down. Celo is now an L2.

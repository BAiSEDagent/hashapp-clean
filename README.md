# Hashapp — Agentic Finance on Base

Hashapp is a consumer-grade spending app for AI agents, built on Base Sepolia. It demonstrates the core primitive that **any agent that pays needs to swap** — closing the gap between holding tokens and paying for things.

## Uniswap Trading API Integration

Hashapp integrates the [Uniswap Trading API](https://docs.uniswap.org/api/trading-api) to enable autonomous token swaps as part of Scout's (the AI agent) spending flow. When Scout needs to pay a vendor in USDC but holds ETH, it automatically swaps via Uniswap before paying.

### Architecture

```
User / Scout Wallet
       │
       ▼
┌─────────────────────────────────┐
│  Hashapp Frontend (React/Vite)  │
│  - Swap Panel on Money page     │
│  - Live quote preview           │
│  - Token pair selector          │
│  - Tx confirmation + Basescan   │
└──────────────┬──────────────────┘
               │ POST /api/swap/*
               ▼
┌─────────────────────────────────┐
│  API Server (Express)           │
│  - /swap/quote                  │
│  - /swap/execute                │
│  - /swap/scout-swap-and-pay     │
│  - /swap/tokens                 │
└──────────────┬──────────────────┘
               │ Uniswap Trading API
               ▼
┌─────────────────────────────────┐
│  Uniswap Trading API           │
│  - POST /v1/check_approval     │
│  - POST /v1/quote               │
│  - POST /v1/swap                │
│  (Universal Router v2.0)        │
└─────────────────────────────────┘
```

### 3-Step Swap Flow

1. **`check_approval`** — Checks if the token requires Permit2 approval before swapping. Native ETH skips this step.
2. **`quote`** — Gets a real-time quote with output amount, gas fee (in USD), price impact, and routing info. Handles both CLASSIC and UniswapX response shapes.
3. **`swap`** — Executes the swap. The quote response is spread (not wrapped) into the request body, with null `permitData` fields stripped.

### Agentic Swap-Then-Pay Flow

Scout's autonomous spending flow:
1. Scout determines it needs to pay a vendor in USDC
2. If Scout's wallet holds ETH, it calls `/swap/scout-swap-and-pay`
3. The backend swaps ETH → USDC via Uniswap
4. Immediately transfers USDC to the vendor
5. Both the SWAP and PAYMENT events appear in the Activity feed with Onchain truth badges

### Swap Rules & Safety

The Rules system enforces constraints on all swaps:
- **Max slippage: 1%** — Blocks swaps with excessive slippage
- **Per-swap cap: $50** — Blocks swaps above the amount limit
- **Approved tokens only** — Only ETH, WETH, and USDC are allowed
- Violations are blocked and shown in the feed, same as spend rule violations

### Supported Tokens (Base Sepolia)

| Token | Address | Decimals |
|-------|---------|----------|
| ETH   | `0x0000000000000000000000000000000000000000` | 18 |
| WETH  | `0x4200000000000000000000000000000000000006` | 18 |
| USDC  | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 6 |

## API Key Setup

1. Register at [Uniswap Developer Platform](https://developers.uniswap.org/dashboard/)
2. Create a new API key
3. Set the environment variable:
   ```
   UNISWAP_API_KEY=your_api_key_here
   ```
4. Also set `SCOUT_PRIVATE_KEY` for Scout's backend wallet

## Running Locally

```bash
pnpm install
pnpm run dev
```

The app runs on Base Sepolia (chain ID 84532). Connect a wallet with testnet ETH/USDC to try swaps.

## Key Files

- `artifacts/api-server/src/lib/uniswap.ts` — Uniswap Trading API service layer
- `artifacts/api-server/src/routes/swap.ts` — Swap API endpoints (quote, execute, scout-swap-and-pay)
- `artifacts/hashapp/src/components/SwapPanel.tsx` — Frontend swap UI
- `artifacts/hashapp/src/lib/swapApi.ts` — Frontend API client for swaps
- `artifacts/hashapp/src/context/DemoContext.tsx` — Swap feed items and rule enforcement
- `artifacts/hashapp/src/pages/Activity.tsx` — SWAP event rendering in activity feed
- `artifacts/hashapp/src/pages/Money.tsx` — Money page with swap panel
- `artifacts/hashapp/src/pages/Rules.tsx` — Swap-specific rules (slippage, cap, token allowlist)

## Tech Stack

- React + Vite + Tailwind CSS (frontend)
- Express 5 (API server)
- viem + wagmi (wallet interaction)
- Uniswap Trading API (token swaps)
- MetaMask Smart Accounts Kit (ERC-7710 delegation)
- Base Sepolia (testnet)

## License

Open source — see repository for details.

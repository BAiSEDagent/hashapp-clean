# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── hashapp/            # Hashapp - dark premium spending app for AI agents
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/hashapp` (`@workspace/hashapp`)

Hashapp — consumer-grade dark premium spending app for AI agents. Demo-only frontend prototype (no backend). Built with React + Vite + Tailwind CSS + framer-motion + wouter.

- **Theme**: Dark-only (near-black bg hsl 220 20% 4%), blue accent (hsl 220 60% 55%), mobile-first max-width 430px
- **Routes**: `/money` (Money — non-custodial wallet allocation), `/` (Activity Feed with trusted destinations rail), `/agent` (Scout Agent Detail), `/rules` (Spending Rules), `/receipt/:id` (Receipt Detail)
- **Nav tabs**: Money | Activity | Scout | Rules
- **Money model**: Explicitly non-custodial — funds live in user's connected Base smart wallet with scoped allocation to Scout. Language: "Available for Scout", "USDC · remaining under active rules", "Hashapp never takes custody"
- **Wallet connection**: wagmi + viem configured for Base Sepolia (injected + Coinbase Wallet connectors). Shows real wallet address when connected, honest "No Wallet Connected" when not. Connect buttons rendered from wagmi connectors list.
- **Demo Flow**: Load → 3s pause → pending spend permission slides in → user approves → navigate to Rules → toggle off "Block spend permissions (recurring)" → return to Activity → 2s → new blocked entry appears
- **Honesty rules**: No fake tx hashes in hardcoded feed. Receipt shows "Demo transaction · no onchain proof" for demo items. Basescan links only appear when `isReal && txHash`. Rules footer: "Rules managed by Hashapp" (not "enforced onchain"). Agent footer: "ERC-8004 · Base Sepolia" (no fake token ID). Dead CTAs removed (no "Increase limit", "Adjust budget", "Pause Scout").
- **Persistence**: localStorage (key: `hashapp_demo_state`, version 5) persists feed, rules, spendPermissions, and stage across refreshes.
- **Key Design**: Intent-aware language ("Scout bought research credits..."), plain-English rules, honest onchain references only when backed by real proof, spend permission terminology for recurring charges
- **MetaMask Delegation Pivot**: Feature-gated behind `VITE_USE_METAMASK_DELEGATION=true`. Replaces Coinbase SpendPermissionManager with MetaMask Smart Accounts Kit + ERC-7715/ERC-7710 Delegation Framework. Key files:
  - `src/config/delegation.ts` — feature flag, chain, USDC address, DelegationManager address, session account address
  - `src/lib/metamaskPermissions.ts` — ERC-7715 `requestExecutionPermissions` wrapper
  - `src/lib/sessionAccount.ts` — Scout session account from `VITE_SCOUT_SESSION_ADDRESS` env var
  - `src/lib/delegationSpend.ts` — POSTs to `/api/delegation/spend` for server-side ERC-7710 redemption
  - `src/config/wallet.ts` — feature-gated connectors (delegation: injected only; fallback: coinbaseWallet)
  - All pages (Activity, Money, Agent, Receipt) are feature-gated for delegation path
- **Dependencies**: react, framer-motion, wouter, lucide-react, tailwindcss, clsx, tailwind-merge, wagmi, viem, @metamask/smart-accounts-kit@0.4.0-beta.1

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Delegation route: `src/routes/delegation.ts` — `POST /api/delegation/spend` executes ERC-7710 delegated USDC transfers server-side using `SCOUT_PRIVATE_KEY`. Enforces token allowlist (USDC only), delegation manager address check, amount bounds ($0–$1000), and address format validation.
- Swap routes: `src/routes/swap.ts` — Uniswap Trading API integration:
  - `POST /api/swap/quote` — Gets a swap quote (check_approval + quote). Server-side validates token allowlist, slippage cap (1%), USD per-swap cap ($50 via estimateUsdFromTokenAmount).
  - `POST /api/swap/execute` — Executes a swap. Mode: `scout` (backend wallet signs, requires SCOUT_API_TOKEN) or `user` (returns unsigned tx). Validates token allowlist + slippage + server-side USD cap.
  - `POST /api/swap/scout-swap-and-pay` — Autonomous swap-then-pay: swaps tokens via Uniswap then transfers USDC to a vendor. Requires SCOUT_API_TOKEN. Validates paymentAmountUsdc against $50 cap.
  - `GET /api/swap/tokens` — Returns approved token list.
  - Auth: Scout wallet endpoints use default-deny (returns 401 when SCOUT_API_TOKEN is unset or missing).
- Uniswap service: `src/lib/uniswap.ts` — Wraps the Uniswap Trading API 3-step flow (check_approval → quote → swap). Handles CLASSIC and UniswapX response shapes, strips null permitData, sends chain IDs as strings. executeSwapWithScoutWallet handles Permit2 approval before swap. estimateUsdFromTokenAmount derives USD value server-side from token address + raw amount.
- Env vars needed: `UNISWAP_API_KEY` (from Uniswap Developer Platform), `SCOUT_PRIVATE_KEY` (Scout's backend wallet), `SCOUT_API_TOKEN` (auth for Scout endpoints)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

## Branch Policy

| Branch | Role | Rule |
|--------|------|------|
| `integration/truth-pass-clean` | Stable fallback shell + proof assets | No new delegation/execution-rail work |
| `integration/metamask-delegation-poc` | Active MetaMask delegation pivot | All new ERC-7715/7710/Smart Accounts work goes here |
| `frontend/truth-pass` | Raw donor/archive only | No new work; surgical extraction source only |

- Never land new MetaMask pivot work on `frontend/truth-pass`
- Never land new execution-rail work on `integration/truth-pass-clean`
- If progress is accidentally made on the wrong branch, stop and port files to `integration/metamask-delegation-poc` immediately

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

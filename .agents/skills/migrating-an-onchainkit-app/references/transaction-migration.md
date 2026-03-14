\# Transaction Migration: OnchainKit Transaction to wagmi

Replace OnchainKit's \`Transaction\`, \`TransactionButton\`, \`TransactionStatus\`, \`TransactionSponsor\`, and related components with a standalone \`TransactionForm\` component built on wagmi hooks.

\## What OnchainKit's Transaction Components Do

OnchainKit provides a composable transaction system:
\- \`\` \-\- container that manages the full transaction lifecycle, accepts \`calls\`, \`chainId\`, \`onStatus\`
\- \`\` \-\- submits the transaction, shows status-dependent text (Transact/Confirm/Try again/View transaction)
\- \`\` \-\- displays current transaction state with label and action
\- \`\` \-\- text label ("Confirm in wallet", "Transaction in progress", "Successful", error message)
\- \`\` \-\- link to block explorer or call status viewer
\- \`\` \-\- shows "Zero transaction fee" when paymaster is configured
\- \`LifecycleStatus\` type -- status object with \`statusName\` and \`statusData\`

Internally, OnchainKit uses two submission paths:
\- \*\*Smart Wallet (batched):\*\* \`useSendCalls\` (EIP-5792) for wallets with \`atomicBatch\` capability
\- \*\*EOA (single):\*\* \`useSendTransaction\` with \`encodeFunctionData\` for standard wallets

The replacement component uses \`useWriteContract\` which handles both EOA and smart wallet scenarios for single contract calls.

\## Prerequisites

\- Provider migration must be completed first (WagmiProvider + QueryClientProvider in the tree)
\- Tailwind CSS installed (if not, install it or adapt styles)
\- If the transaction targets a chain other than what's in the wagmi config, add that chain to \`wagmi-config.ts\`

\## Important: Chain Configuration

OnchainKit's Transaction accepts a \`chainId\` prop and handles chain switching. The replacement does too, BUT the target chain must exist in the wagmi config's \`chains\` array and \`transports\` object.

For example, if transactions target Base Sepolia (84532):

\`\`\`typescript
import { base, baseSepolia } from "wagmi/chains";

export const wagmiConfig = createConfig({
 chains: \[base, baseSepolia\],
 transports: {
 \[base.id\]: http(),
 \[baseSepolia.id\]: http(),
 },
 // ...rest
});
\`\`\`

\## The TransactionForm Component

Create \`app/components/TransactionForm.tsx\` (or wherever components live in the project):

\`\`\`typescript
"use client";
import { useCallback, useEffect, useState } from "react";
import {
 useAccount,
 useWriteContract,
 useWaitForTransactionReceipt,
 useSwitchChain,
} from "wagmi";
import type { Abi, Address } from "viem";

type ContractCall = {
 address: Address;
 abi: Abi;
 functionName: string;
 args?: readonly unknown\[\];
 value?: bigint;
};

type LifecycleStatus =
 \| { statusName: "init"; statusData: null }
 \| { statusName: "pending"; statusData: null }
 \| { statusName: "confirmed"; statusData: { transactionHash: string } }
 \| {
 statusName: "success";
 statusData: { transactionHash: string; blockNumber: bigint };
 }
 \| { statusName: "error"; statusData: { message: string } };

type TransactionFormProps = {
 calls: ContractCall\[\];
 chainId?: number;
 buttonText?: string;
 onStatus?: (status: LifecycleStatus) => void;
 disabled?: boolean;
 className?: string;
};

export function TransactionForm({
 calls,
 chainId,
 buttonText = "Transact",
 onStatus,
 disabled = false,
 className,
}: TransactionFormProps) {
 const { isConnected, chainId: currentChainId } = useAccount();
 const { switchChainAsync } = useSwitchChain();

 const \[status, setStatus\] = useState({
 statusName: "init",
 statusData: null,
 });

 const updateStatus = useCallback(
 (newStatus: LifecycleStatus) => {
 setStatus(newStatus);
 onStatus?.(newStatus);
 },
 \[onStatus\]
 );

 const {
 writeContract,
 data: txHash,
 isPending: isWritePending,
 reset: resetWrite,
 } = useWriteContract();

 // CRITICAL: Always pass chainId so wagmi polls the correct chain's RPC.
 // Without this, if the user's wallet is on a different chain than the
 // transaction target, wagmi has no transport to poll and the receipt
 // is never found -- the UI hangs in "pending" forever.
 const { data: receipt, isLoading: isWaiting } =
 useWaitForTransactionReceipt({
 hash: txHash,
 chainId,
 });

 useEffect(() => {
 if (isWritePending) {
 updateStatus({ statusName: "pending", statusData: null });
 }
 }, \[isWritePending, updateStatus\]);

 useEffect(() => {
 if (txHash && !receipt) {
 updateStatus({
 statusName: "confirmed",
 statusData: { transactionHash: txHash },
 });
 }
 }, \[txHash, receipt, updateStatus\]);

 useEffect(() => {
 if (receipt) {
 updateStatus({
 statusName: "success",
 statusData: {
 transactionHash: receipt.transactionHash,
 blockNumber: receipt.blockNumber,
 },
 });
 }
 }, \[receipt, updateStatus\]);

 const handleSubmit = useCallback(async () => {
 if (!isConnected \|\| calls.length === 0) return;

 try {
 if (chainId && currentChainId !== chainId) {
 await switchChainAsync({ chainId });
 }

 const call = calls\[0\];
 writeContract(
 {
 address: call.address,
 abi: call.abi,
 functionName: call.functionName,
 args: call.args ?? \[\],
 value: call.value,
 chainId,
 },
 {
 onError: (error) => {
 const isUserRejection =
 error.message?.includes("User rejected") \|\|
 error.message?.includes("User denied") \|\|
 error.message?.includes("Request denied");
 const message = isUserRejection
 ? "Request denied."
 : error.message \|\| "Transaction failed";
 updateStatus({ statusName: "error", statusData: { message } });
 },
 }
 );
 } catch (error) {
 const message =
 error instanceof Error ? error.message : "Transaction failed";
 updateStatus({ statusName: "error", statusData: { message } });
 }
 }, \[\
 isConnected,\
 calls,\
 chainId,\
 currentChainId,\
 switchChainAsync,\
 writeContract,\
 updateStatus,\
 \]);

 const handleReset = useCallback(() => {
 resetWrite();
 updateStatus({ statusName: "init", statusData: null });
 }, \[resetWrite, updateStatus\]);

 const isLoading = isWritePending \|\| isWaiting;

 return (


{status.statusName === "success" ? (


{
const hash = status.statusData.transactionHash;
const explorerBase = chainId === 84532
? "https://sepolia.basescan.org"
: "https://basescan.org";
window.open(\`${explorerBase}/tx/${hash}\`, "\_blank");
}}
className="rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
>
View transaction

Send another


) : (

{isWritePending && (

Confirm in wallet...

)}
{isWaiting && (

Transaction in progress...

)}
{status.statusName === "error" && "Try again"}
{status.statusName === "init" && buttonText}
{status.statusName === "confirmed" && !isWaiting && buttonText}

)}



 );
}

function TransactionStatusDisplay({
 status,
 chainId,
}: {
 status: LifecycleStatus;
 chainId?: number;
}) {
 if (status.statusName === "init") return null;

 const explorerBase =
 chainId === 84532
 ? "https://sepolia.basescan.org"
 : "https://basescan.org";

 return (


{status.statusName === "pending" && (


Confirm in wallet.


)}
{status.statusName === "confirmed" && (


Transaction in progress...


)}
{status.statusName === "success" && (


Successful!

[View on explorer](https://raw.githubusercontent.com/base/skills/master/skills/migrating-an-onchainkit-app/references/%7B%60$%7BexplorerBase%7D/tx/$%7Bstatus.statusData.transactionHash%7D%60%7D)

)}
{status.statusName === "error" && (


{status.statusData.message}


)}


 );
}
\`\`\`

\## Step-by-Step Replacement

\### 1\. Check Chain Configuration

Look at the \`chainId\` prop on the existing \`\` component. If it references a chain not in the wagmi config, add it:

\`\`\`typescript
// Common: Base Sepolia for testnet
import { base, baseSepolia } from "wagmi/chains";
// Add to wagmi config chains array and transports
\`\`\`

\### 2\. Create the Component File

Copy the \`TransactionForm\` component code above into the project's components directory.

\### 3\. Replace OnchainKit Transaction Imports and Usage

\*\*Before (OnchainKit):\*\*
\`\`\`typescript
import {
 Transaction,
 TransactionButton,
 TransactionSponsor,
 TransactionStatus,
 TransactionStatusAction,
 TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';

const calls = \[\
 {\
 address: '0x67c97D1FB8184F038592b2109F854dfb09C77C75',\
 abi: clickContractAbi,\
 functionName: 'click',\
 args: \[\],\
 }\
\];

\`\`\`

\*\*After (wagmi):\*\*
\`\`\`typescript
import { TransactionForm } from "./components/TransactionForm";
import type { Address } from "viem";

const clickContractAddress: Address = '0x67c97D1FB8184F038592b2109F854dfb09C77C75';
const clickContractAbi = \[\
 {\
 type: 'function' as const,\
 name: 'click',\
 inputs: \[\],\
 outputs: \[\],\
 stateMutability: 'nonpayable' as const,\
 },\
\] as const;

const calls = \[\
 {\
 address: clickContractAddress,\
 abi: clickContractAbi,\
 functionName: 'click',\
 args: \[\],\
 },\
\];

\`\`\`

\### 4\. Handle the onStatus Callback

The OnchainKit \`LifecycleStatus\` type has these states: \`init\`, \`transactionIdle\`, \`buildingTransaction\`, \`transactionPending\`, \`transactionLegacyExecuted\`, \`success\`, \`error\`, \`reset\`.

The replacement uses a simplified set: \`init\`, \`pending\`, \`confirmed\`, \`success\`, \`error\`.

\*\*Mapping:\*\*

\| OnchainKit Status \| Replacement Status \|
\|---\|---\|
\| \`init\` / \`transactionIdle\` \| \`init\` \|
\| \`buildingTransaction\` / \`transactionPending\` \| \`pending\` \|
\| \`transactionLegacyExecuted\` \| \`confirmed\` \|
\| \`success\` \| \`success\` \|
\| \`error\` \| \`error\` \|

If the existing \`onStatus\` callback checks specific OnchainKit status names, update the checks to use the new names.

\### 5\. Verify

Run \`npm run build\` and confirm no errors.

\## What's Not Covered

\### Gas Sponsorship (TransactionSponsor)
OnchainKit's \`TransactionSponsor\` uses a paymaster URL to sponsor gas fees. This requires a paymaster service (e.g., Coinbase Developer Platform Paymaster). The replacement component does not include paymaster support. To add it, you would need to use wagmi's \`useSendCalls\` with the paymaster capability.

\### Batched Calls (EIP-5792)
OnchainKit's Transaction supports batching multiple calls into a single transaction for smart wallets. The replacement uses \`useWriteContract\` which handles one call at a time. For batched calls, use wagmi's \`useSendCalls\` hook directly.

\### Transaction Toast
OnchainKit's \`TransactionToast\` provides toast-style notifications. The replacement shows inline status instead. Add a toast library if toast notifications are needed.

\## Common Issues

\### Transaction receipt stuck in pending (UI hangs after wallet confirms)
\*\*This is the most common bug.\*\* The transaction hash appears, the tx confirms on-chain, but the UI stays stuck on "Transaction in progress..." forever.

\*\*Cause:\*\* \`useWaitForTransactionReceipt\` needs an RPC to poll for the receipt. If the transaction's chain is not in the wagmi config's \`chains\` + \`transports\`, wagmi has no RPC endpoint to poll, so \`isSuccess\` never becomes \`true\`.

\*\*Fix (two parts):\*\*
1\. Add the transaction's target chain to \`wagmi-config.ts\`:
\`\`\`typescript
import { base, baseSepolia } from "wagmi/chains";

export const wagmiConfig = createConfig({
 chains: \[base, baseSepolia\], // Must include every chain the app transacts on
 transports: {
 \[base.id\]: http(),
 \[baseSepolia.id\]: http(), // Must have a transport for each chain
 },
 // ...rest
});
\`\`\`
2\. Always pass \`chainId\` to \`useWaitForTransactionReceipt\`:
\`\`\`typescript
const { data: receipt } = useWaitForTransactionReceipt({
 hash: txHash,
 chainId, // Ensures polling uses the correct chain's transport
});
\`\`\`

\### Next.js page export restrictions
Next.js only allows specific named exports from page files (\`default\`, \`metadata\`, \`generateMetadata\`, \`generateStaticParams\`, etc.). If you export contract call arrays, ABI constants, or other non-page values from a page file, the build will fail with an error like: \`"calls" is not a valid Page export field\`.

\*\*Fix:\*\* Move contract call arrays, ABIs, and addresses to a separate module (e.g., \`contracts.ts\`) or make them non-exported \`const\` declarations within the page file.

\### Type error: comparison with "UserRejectedRequestError"
The wagmi error types don't include \`UserRejectedRequestError\` as a direct name match. Instead, check \`error.message\` for "User rejected" or "User denied" strings.

\### Transaction targets wrong chain
The component auto-switches chains via \`useSwitchChain\`. But the target chain must exist in the wagmi config. If you get a chain error, add the chain to \`wagmi-config.ts\`.

\### "useWriteContract must be used within WagmiProvider"
Same as wallet: ensure the component is inside the WagmiProvider tree.

\### ABI type errors
When defining the ABI inline, use \`as const\` on the array to get proper type inference:
\`\`\`typescript
const abi = \[\
 {\
 type: 'function' as const,\
 name: 'click',\
 inputs: \[\],\
 outputs: \[\],\
 stateMutability: 'nonpayable' as const,\
 },\
\] as const;
\`\`\`
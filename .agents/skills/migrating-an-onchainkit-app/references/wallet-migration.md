\# Wallet Migration: OnchainKit Wallet to WalletConnect

Replace OnchainKit's \`Wallet\`, \`ConnectWallet\`, \`WalletDropdown\`, \`WalletModal\`, and \`Connected\` components with a standalone \`WalletConnect\` component built on wagmi hooks.

\## What OnchainKit's Wallet Components Do

OnchainKit provides several wallet components:
\- \`\` \-\- container that manages open/closed state
\- \`\` \-\- button that triggers connection (renders as "Connect Wallet" when disconnected)
\- \`\` \-\- dropdown with identity info and actions
\- \`\` \-\- modal with multiple wallet options (Base Account, Coinbase, MetaMask, Phantom, etc.)
\- \`\` \-\- conditional renderer based on wallet connection state

The replacement \`WalletConnect\` component combines all of this into one component.

\## Prerequisites

\- Provider migration must be completed first (WagmiProvider + QueryClientProvider in the tree)
\- Tailwind CSS installed (if not, install it or adapt styles)

\## The WalletConnect Component

Create \`app/components/WalletConnect.tsx\` (or wherever components live in the project):

\`\`\`typescript
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
 baseAccount,
 coinbaseWallet,
 metaMask,
} from "wagmi/connectors";

function truncateAddress(address: string): string {
 return \`${address.slice(0, 6)}...${address.slice(-4)}\`;
}

type WalletOption = {
 id: string;
 name: string;
 connect: () => void;
};

function WalletModal({
 onClose,
 appName = "My App",
}: {
 onClose: () => void;
 appName?: string;
}) {
 const { connect } = useConnect();
 const backdropRef = useRef(null);

 const handleBackdropClick = useCallback(
 (e: React.MouseEvent) => {
 if (e.target === backdropRef.current) onClose();
 },
 \[onClose\]
 );

 useEffect(() => {
 const handleEsc = (e: KeyboardEvent) => {
 if (e.key === "Escape") onClose();
 };
 document.addEventListener("keydown", handleEsc);
 return () => document.removeEventListener("keydown", handleEsc);
 }, \[onClose\]);

 const walletOptions: WalletOption\[\] = \[\
 {\
 id: "base-account",\
 name: "Sign in with Base",\
 connect: () => {\
 connect({ connector: baseAccount({ appName }) });\
 onClose();\
 },\
 },\
 {\
 id: "coinbase-wallet",\
 name: "Coinbase Wallet",\
 connect: () => {\
 connect({\
 connector: coinbaseWallet({ appName, preference: "all" }),\
 });\
 onClose();\
 },\
 },\
 {\
 id: "metamask",\
 name: "MetaMask",\
 connect: () => {\
 connect({\
 connector: metaMask({\
 dappMetadata: {\
 name: appName,\
 url: typeof window !== "undefined" ? window.location.origin : "",\
 },\
 }),\
 });\
 onClose();\
 },\
 },\
 \];

 const \[primaryOption, ...otherOptions\] = walletOptions;

 return (


## Connect Wallet

{primaryOption.name}


or use another wallet


{otherOptions.map((wallet) => (

{wallet.name}

))}


);
}

export function WalletConnect({ appName = "My App" }: { appName?: string }) {
const { address, isConnected } = useAccount();
const { disconnect } = useDisconnect();
const \[isModalOpen, setIsModalOpen\] = useState(false);

if (isConnected && address) {
return (


{truncateAddress(address)}
disconnect()}
className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
>
Disconnect


);
}

return (
<>
setIsModalOpen(true)}
className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
>
Connect Wallet

{isModalOpen && (
setIsModalOpen(false)}
appName={appName}
/>
)}

);
}
\`\`\`

\## Step-by-Step Replacement

\### 1\. Create the Component File

Copy the component code above into the project's components directory.

\### 2\. Replace OnchainKit Wallet Imports

Find all files importing from \`@coinbase/onchainkit/wallet\` or using \`Connected\` from \`@coinbase/onchainkit\`:

\*\*Before:\*\*
\`\`\`typescript
import { Wallet } from "@coinbase/onchainkit/wallet";
// or
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from "@coinbase/onchainkit/wallet";
// or
import { Connected } from "@coinbase/onchainkit";
\`\`\`

\*\*After:\*\*
\`\`\`typescript
import { WalletConnect } from "./components/WalletConnect";
\`\`\`

\### 3\. Replace Component Usage

\*\*Simple \`\`:\*\*
\`\`\`typescript
// Before

// After

\`\`\`

\*\*Composed wallet with children:\*\*
\`\`\`typescript
// Before



// After

\`\`\`

\*\*\`\` conditional rendering:\*\*
\`\`\`typescript
// Before
import { Connected } from "@coinbase/onchainkit";

Please connect

}>


You are connected

// After -- use wagmi's useAccount directly
import { useAccount } from "wagmi";

const { isConnected } = useAccount();
{isConnected ?

You are connected

:

Please connect

}
\`\`\`

\### 4\. Remove MiniKit Usage

If the page uses \`useMiniKit\` or other MiniKit hooks, remove them:

\`\`\`typescript
// Remove these
import { useMiniKit } from "@coinbase/onchainkit/minikit";
const { setMiniAppReady, isMiniAppReady } = useMiniKit();
useEffect(() => {
if (!isMiniAppReady) setMiniAppReady();
}, \[setMiniAppReady, isMiniAppReady\]);
\`\`\`

\### 5\. Verify

Run \`npm run build\` and confirm no errors.

\## Customization

\### Changing the app name
Pass the \`appName\` prop to \`WalletConnect\`:
\`\`\`typescript

\`\`\`

\### Adding more wallet options
Add entries to the \`walletOptions\` array in the \`WalletModal\` component. Use \`injected({ target: 'walletName' })\` from \`wagmi/connectors\` for browser extension wallets.

\### Changing styles
The component uses Tailwind utility classes. Modify the \`className\` strings to match the project's design system. All styling is inline via Tailwind -- no external CSS files needed.

\### Using without Tailwind
If the project doesn't use Tailwind, convert the Tailwind classes to inline styles or CSS modules. The key visual elements are:
\- Fixed overlay with semi-transparent black background
\- Centered card with white background, rounded corners, shadow
\- Primary button (blue) for Base Account
\- Secondary buttons (white/bordered) for other wallets
\- Dark mode support via \`dark:\` variants

\## Common Issues

\### "useAccount must be used within WagmiProvider"
The component is being rendered outside the provider tree. Ensure \`WagmiProvider\` wraps the entire app in the layout or root provider.

\### Modal doesn't close after connecting
This can happen if the connection is async and the component unmounts. The current implementation calls \`onClose()\` synchronously after \`connect()\`. If you need to wait for the connection, use the \`onSuccess\` callback from \`useConnect\`.

\### baseAccount connector not found
Ensure wagmi version is >= 2.16. The \`baseAccount\` connector was added in recent wagmi versions. Check with:
\`\`\`bash
npm ls wagmi
\`\`\`
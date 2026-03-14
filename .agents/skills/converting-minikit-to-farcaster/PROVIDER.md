\# Provider Migration

Remove \`MiniKitProvider\`, add FrameProvider and Wagmi setup.

\## Contents
\- FrameProvider setup
\- Wagmi provider setup
\- Combined providers
\- Usage in components

\-\-\-

\## Step 1: Create FrameProvider

\`src/components/providers/FrameProvider.tsx\`:

\`\`\`typescript
'use client'

import { sdk } from '@farcaster/miniapp-sdk';
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type FrameContextType = {
 context: any;
 isInMiniApp: boolean;
} \| null;

const FrameContext = createContext(null);

export const useFrameContext = () => useContext(FrameContext);

export default function FrameProvider({ children }: { children: ReactNode }) {
 const \[frameContext, setFrameContext\] = useState(null);

 useEffect(() => {
 const init = async () => {
 try {
 // No parameters in v0.2.0+
 const isInMiniApp = await sdk.isInMiniApp();

 if (isInMiniApp) {
 // Must await - context is a Promise
 const context = await sdk.context;
 setFrameContext({ context, isInMiniApp: true });
 } else {
 setFrameContext({ context: null, isInMiniApp: false });
 }
 } catch (error) {
 console.error('FrameProvider init error:', error);
 setFrameContext({ context: null, isInMiniApp: false });
 }
 };
 init();
 }, \[\]);

 return (

 {children}

 );
}
\`\`\`

\-\-\-

\## Step 2: Create Wagmi Provider

\`src/components/providers/WagmiProvider.tsx\`:

\`\`\`typescript
'use client'

import { createConfig, http, WagmiProvider as WagmiBase } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { ReactNode, useState } from 'react';

const config = createConfig({
 chains: \[base\],
 transports: { \[base.id\]: http() },
 connectors: \[farcasterMiniApp()\],
});

export default function WagmiProvider({ children }: { children: ReactNode }) {
 const \[queryClient\] = useState(() => new QueryClient());

 return (

 {children}

 );
}
\`\`\`

\-\-\-

\## Step 3: Combine Providers

\`src/app/providers.tsx\`:

\`\`\`typescript
'use client'

import { ReactNode } from 'react';
import FrameProvider from '@/components/providers/FrameProvider';
import WagmiProvider from '@/components/providers/WagmiProvider';

export function Providers({ children }: { children: ReactNode }) {
 return (

 {children}

 );
}
\`\`\`

\-\-\-

\## Step 4: Use in Layout

\`src/app/layout.tsx\`:

\`\`\`typescript
import { Providers } from './providers';

export default function RootLayout({ children }) {
 return (


 {children}


 );
}
\`\`\`

\-\-\-

\## Using the Context

\`\`\`typescript
import { useFrameContext } from '@/components/providers/FrameProvider';

function MyComponent() {
 const frameContext = useFrameContext();

 if (!frameContext) return

Loading...

;
 if (!frameContext.isInMiniApp) return

Open in Farcaster

;

 return

Welcome {frameContext.context?.user?.displayName}

;
}
\`\`\`

\-\-\-

\## Remove Old Imports

\`\`\`typescript
// Delete these
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import '@coinbase/onchainkit/styles.css';

// Delete from .env
NEXT\_PUBLIC\_ONCHAINKIT\_API\_KEY=xxx
\`\`\`
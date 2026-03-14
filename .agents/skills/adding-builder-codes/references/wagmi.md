\# Wagmi Integration

Configure \`dataSuffix\` at the Wagmi client level to automatically append your Builder Code to all transactions.

\## Requirements

\- \`wagmi\` with \`viem >= 2.45.0\`
\- \`ox\` library installed

\## Client-Level Setup (Recommended)

Add \`dataSuffix\` to your Wagmi config. All transactions via \`useSendTransaction\`, \`useWriteContract\`, and \`useSendCalls\` will automatically include attribution.

\`\`\`typescript
// config.ts
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { Attribution } from "ox/erc8021";

const DATA\_SUFFIX = Attribution.toDataSuffix({
 codes: \["YOUR-BUILDER-CODE"\],
});

export const config = createConfig({
 chains: \[base\],
 transports: {
 \[base.id\]: http(),
 },
 dataSuffix: DATA\_SUFFIX,
});
\`\`\`

With this in place, hooks work unchanged:

\`\`\`tsx
import { useSendTransaction } from "wagmi";
import { parseEther } from "viem";

function SendButton() {
 const { sendTransaction } = useSendTransaction();
 return (
  sendTransaction({
 to: "0x...",
 value: parseEther("0.01"),
 })}>
 Send ETH

 );
}
\`\`\`

\## Per-Transaction Override (If Needed)

For conditional attribution, pass \`dataSuffix\` directly on individual calls:

\### useSendTransaction

\`\`\`tsx
sendTransaction({
 to: "0x...",
 value: parseEther("0.01"),
 dataSuffix: DATA\_SUFFIX,
});
\`\`\`

\### useSendCalls (EIP-5792 / Smart Wallets)

\`\`\`tsx
sendCalls({
 calls: \[{ to: "0x...", value: parseEther("1") }\],
 capabilities: {
 dataSuffix: {
 value: DATA\_SUFFIX,
 optional: true,
 },
 },
});
\`\`\`

See \[smart-wallets.md\](smart-wallets.md) for more on \`useSendCalls\` and EIP-5792.

\## Multi-Chain Configs

If your config includes multiple chains, \`dataSuffix\` applies to all of them. This is fine — only Base's indexer reads the suffix.

\`\`\`typescript
export const config = createConfig({
 chains: \[base, mainnet, optimism\],
 transports: {
 \[base.id\]: http(),
 \[mainnet.id\]: http(),
 \[optimism.id\]: http(),
 },
 dataSuffix: DATA\_SUFFIX,
});
\`\`\`
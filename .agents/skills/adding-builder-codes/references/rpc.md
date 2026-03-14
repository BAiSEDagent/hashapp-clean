\# Standard Ethereum RPC / ethers.js Integration

For projects using raw \`window.ethereum\`, \`ethers.js\`, or any standard EIP-1193 provider without a higher-level framework.

\## Requirements

\- \`ox\` library installed: \`npm install ox\`

\## Generate the dataSuffix

Create a shared constant:

\`\`\`typescript
import { Attribution } from "ox/erc8021";

export const DATA\_SUFFIX = Attribution.toDataSuffix({
 codes: \["YOUR-BUILDER-CODE"\],
});
\`\`\`

\## ethers.js Integration

\### v6 (Recommended)

\`\`\`typescript
import { ethers } from "ethers";
import { DATA\_SUFFIX } from "./attribution";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Simple ETH transfer
const tx = await signer.sendTransaction({
 to: "0x...",
 value: ethers.parseEther("0.01"),
 data: DATA\_SUFFIX,
});
\`\`\`

\### Appending to existing calldata (contract calls)

If the transaction already has \`data\`, concatenate the suffix after it:

\`\`\`typescript
import { ethers } from "ethers";
import { DATA\_SUFFIX } from "./attribution";

function withAttribution(data: string): string {
 // data is a hex string starting with '0x'
 return data + DATA\_SUFFIX.slice(2); // strip '0x' from suffix before concatenating
}

const iface = new ethers.Interface(ABI);
const calldata = iface.encodeFunctionData("transfer", \[recipient, amount\]);

const tx = await signer.sendTransaction({
 to: contractAddress,
 data: withAttribution(calldata),
});
\`\`\`

\### ethers v5

\`\`\`typescript
import { ethers } from "ethers";
import { DATA\_SUFFIX } from "./attribution";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const tx = await signer.sendTransaction({
 to: "0x...",
 value: ethers.utils.parseEther("0.01"),
 data: DATA\_SUFFIX,
});
\`\`\`

\## Raw window.ethereum (EIP-1193)

\### Simple ETH transfer

\`\`\`typescript
import { DATA\_SUFFIX } from "./attribution";

const accounts = await window.ethereum.request({ method: "eth\_accounts" });

const txHash = await window.ethereum.request({
 method: "eth\_sendTransaction",
 params: \[{\
 from: accounts\[0\],\
 to: "0x...",\
 value: "0x" + BigInt("10000000000000000").toString(16), // 0.01 ETH in wei hex\
 data: DATA\_SUFFIX,\
 }\],
});
\`\`\`

\### With existing calldata

\`\`\`typescript
import { DATA\_SUFFIX } from "./attribution";

const existingData = "0xabcdef..."; // your ABI-encoded contract call

const txHash = await window.ethereum.request({
 method: "eth\_sendTransaction",
 params: \[{\
 from: accounts\[0\],\
 to: contractAddress,\
 data: existingData + DATA\_SUFFIX.slice(2), // append without '0x' prefix\
 }\],
});
\`\`\`

\## How It Works

\`DATA\_SUFFIX\` is appended to the transaction's \`data\` field. Smart contracts process only the calldata they expect (ABI-encoded function selector + parameters) and ignore trailing bytes. Base's indexer reads the suffix to attribute the transaction to your builder code.
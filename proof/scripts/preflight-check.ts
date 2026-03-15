import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  http,
  encodeAbiParameters,
  parseAbiParameters,
  formatUnits,
  type Address,
  type Hex,
} from "viem";
import { baseSepolia } from "viem/chains";

const COINBASE_SMART_WALLET_FACTORY: Address = "0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a";
const USDC_BASE_SEPOLIA: Address = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const SPEND_PERMISSION_MANAGER: Address = "0xf85210B21cC50302F477BA56686d2019dC9b67Ad";

const MIN_ETH = 0.001;
const MIN_USDC = 50;

const factoryAbi = [
  {
    name: "getAddress",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owners", type: "bytes[]" },
      { name: "nonce", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function line(char = "═", len = 60) {
  return char.repeat(len);
}

function check(ok: boolean): string {
  return ok ? "✓ ready" : "✗ NEEDS FUNDING";
}

async function main() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
  const humanKey = process.env.HUMAN_PRIVATE_KEY;
  const scoutKey = process.env.SCOUT_PRIVATE_KEY;

  console.log(line());
  console.log("  HASHAPP — Preflight Environment Check");
  console.log("  Network: Base Sepolia (84532)");
  console.log(line());

  if (!humanKey || !scoutKey) {
    console.log("\n  ERROR: Missing environment variables.\n");
    if (!humanKey) console.log("  - HUMAN_PRIVATE_KEY is not set");
    if (!scoutKey) console.log("  - SCOUT_PRIVATE_KEY is not set");
    console.log("\n  Set both as 0x-prefixed hex private keys.");
    console.log("  Generate fresh ones:");
    console.log("    node -e \"console.log('0x'+require('crypto').randomBytes(32).toString('hex'))\"");
    console.log(line());
    process.exit(1);
  }

  const humanAccount = privateKeyToAccount(humanKey as Hex);
  const scoutAccount = privateKeyToAccount(scoutKey as Hex);

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const owners = [encodeAbiParameters(parseAbiParameters("address"), [humanAccount.address])];
  const smartWalletAddress = await client.readContract({
    address: COINBASE_SMART_WALLET_FACTORY,
    abi: factoryAbi,
    functionName: "getAddress",
    args: [owners, 0n],
  });

  console.log("\n[ADDRESSES]");
  console.log(`  Human EOA          : ${humanAccount.address}`);
  console.log(`  Scout EOA          : ${scoutAccount.address}`);
  console.log(`  Human Smart Wallet : ${smartWalletAddress}`);
  console.log(`  (counterfactual — auto-deploys on first use)`);

  const humanEth = await client.getBalance({ address: humanAccount.address });
  const scoutEth = await client.getBalance({ address: scoutAccount.address });
  const walletEth = await client.getBalance({ address: smartWalletAddress });

  const humanEthNum = Number(formatUnits(humanEth, 18));
  const scoutEthNum = Number(formatUnits(scoutEth, 18));

  const walletUsdc = await client.readContract({
    address: USDC_BASE_SEPOLIA,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [smartWalletAddress],
  });
  const walletUsdcNum = Number(formatUnits(walletUsdc, 6));

  const humanEthOk = humanEthNum >= MIN_ETH;
  const scoutEthOk = scoutEthNum >= MIN_ETH;
  const walletUsdcOk = walletUsdcNum >= MIN_USDC;

  console.log("\n[BALANCES]");
  console.log(`  Human EOA ETH      : ${humanEthNum.toFixed(6)} ETH  ${check(humanEthOk)}`);
  console.log(`  Scout EOA ETH      : ${scoutEthNum.toFixed(6)} ETH  ${check(scoutEthOk)}`);
  console.log(`  Smart Wallet ETH   : ${Number(formatUnits(walletEth, 18)).toFixed(6)} ETH  (not required)`);
  console.log(`  Smart Wallet USDC  : ${walletUsdcNum.toFixed(2)} USDC  ${check(walletUsdcOk)}`);

  const walletCode = await client.getCode({ address: smartWalletAddress });
  const walletDeployed = walletCode !== undefined && walletCode !== "0x";
  console.log(`\n[SMART WALLET STATUS]`);
  console.log(`  Deployed           : ${walletDeployed ? "yes" : "no (will deploy on first run)"}`);

  if (walletDeployed) {
    const smartWalletAbi = [
      {
        name: "isOwnerAddress",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "bool" }],
      },
    ] as const;

    const spmIsOwner = await client
      .readContract({
        address: smartWalletAddress,
        abi: smartWalletAbi,
        functionName: "isOwnerAddress",
        args: [SPEND_PERMISSION_MANAGER],
      })
      .catch(() => false);

    console.log(`  SPM is owner       : ${spmIsOwner ? "yes" : "no (will be added on first run)"}`);
  }

  const allReady = humanEthOk && scoutEthOk && walletUsdcOk;

  console.log(`\n${line("-", 60)}`);

  if (allReady) {
    console.log("  STATUS: ALL CHECKS PASSED — ready to run the proof\n");
    console.log("  Run the proof script:");
    console.log("    pnpm --filter @workspace/scripts run spend-permission-proof");
  } else {
    console.log("  STATUS: NOT READY — the following items need funding\n");

    if (!humanEthOk) {
      console.log("  1. Fund Human EOA with Base Sepolia ETH (need ≥0.001 ETH)");
      console.log(`     Address: ${humanAccount.address}`);
      console.log("     Faucet:  https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
      console.log("");
    }

    if (!scoutEthOk) {
      console.log(`  ${humanEthOk ? "1" : "2"}. Fund Scout EOA with Base Sepolia ETH (need ≥0.001 ETH)`);
      console.log(`     Address: ${scoutAccount.address}`);
      console.log("     Faucet:  https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
      console.log("");
    }

    if (!walletUsdcOk) {
      const step = [!humanEthOk, !scoutEthOk].filter(Boolean).length + 1;
      console.log(`  ${step}. Fund Smart Wallet with Base Sepolia USDC (need ≥50 USDC)`);
      console.log(`     Address: ${smartWalletAddress}`);
      console.log("     Faucet:  https://faucet.circle.com/ (select Base Sepolia)");
      console.log("");
    }

    console.log("  After funding, re-run this check:");
    console.log("    pnpm --filter @workspace/scripts run preflight-check");
  }

  console.log(line());
}

main().catch((err) => {
  console.error("\nFATAL ERROR:");
  console.error(err);
  process.exit(1);
});

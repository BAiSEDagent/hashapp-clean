import { useEnsName } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

export function formatAddress(address?: `0x${string}` | string | null): string | null {
  if (!address) return null;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function useResolvedWalletLabel(address?: `0x${string}`) {
  const { data: resolvedName } = useEnsName({
    address,
    chainId: baseSepolia.id,
    query: { enabled: !!address },
  });

  return {
    resolvedName: resolvedName ?? null,
    fallbackAddress: formatAddress(address),
    displayLabel: resolvedName ?? formatAddress(address),
  };
}

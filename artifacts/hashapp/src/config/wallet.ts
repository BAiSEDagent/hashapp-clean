import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { USE_METAMASK_DELEGATION } from '@/config/delegation';

const connectors = USE_METAMASK_DELEGATION
  ? [injected({ target: 'metaMask' })]
  : [injected(), coinbaseWallet({ appName: 'Hashapp' })];

export const walletConfig = createConfig({
  chains: [baseSepolia],
  connectors,
  transports: {
    [baseSepolia.id]: http(),
  },
});

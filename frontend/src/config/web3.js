import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Create query client
const queryClient = new QueryClient();

// WalletConnect Project ID - Get yours at https://cloud.walletconnect.com
// Using WalletConnect's public demo project ID for localhost/development
const projectId = 'b56e18d47c72ab683b10814fe9495694';

// Metadata for your app
const metadata = {
  name: 'NeuroClaim Support',
  description: 'Workers Compensation Support for TBI Injuries',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://neuroclaim.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Supported networks
const networks = [mainnet, polygon, arbitrum, optimism, base];

// Create Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
});

// Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': 'hsl(217, 91%, 60%)',
    '--w3m-border-radius-master': '12px'
  }
});

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { wagmiAdapter };

import { useState, useCallback } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function useWalletAuth() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const { disconnect } = useDisconnect();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authenticateWithWallet = useCallback(async (walletAddress) => {
    if (!walletAddress) {
      throw new Error('No wallet address provided');
    }

    setIsAuthenticating(true);
    
    try {
      // Get authentication message from backend
      const messageResponse = await fetch(
        `${API_URL}/api/auth/wallet/message?address=${walletAddress}`
      );
      
      if (!messageResponse.ok) {
        throw new Error('Failed to get authentication message');
      }
      
      const { message, nonce } = await messageResponse.json();
      
      // Request signature from wallet
      let signature;
      
      if (walletProvider) {
        // Use WalletConnect provider
        signature = await walletProvider.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
      } else if (typeof window.ethereum !== 'undefined') {
        // Fallback to injected provider
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
      } else {
        throw new Error('No wallet provider available');
      }
      
      // Verify signature with backend
      const verifyResponse = await fetch(`${API_URL}/api/auth/wallet/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: walletAddress, 
          message, 
          signature, 
          nonce 
        })
      });
      
      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.detail || 'Wallet verification failed');
      }
      
      const data = await verifyResponse.json();
      localStorage.setItem('token', data.token);
      
      return data;
      
    } finally {
      setIsAuthenticating(false);
    }
  }, [walletProvider]);

  const openWalletModal = useCallback(() => {
    open({ view: 'Connect' });
  }, [open]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [disconnect]);

  return {
    address,
    isConnected,
    isAuthenticating,
    openWalletModal,
    authenticateWithWallet,
    disconnectWallet
  };
}

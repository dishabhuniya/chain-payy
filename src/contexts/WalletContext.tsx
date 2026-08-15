import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { walletConnector, WalletType } from '../wallet/connector';
import { NETWORK_CONFIG } from '../config/network';
import { toast } from 'react-hot-toast';

interface WalletContextType {
  address: string | null;
  walletType: WalletType | null;
  isConnected: boolean;
  network: 'testnet' | 'futurenet';
  balance: string;
  isLoading: boolean;
  isWrongNetwork: boolean;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
  signTx: (xdr: string) => Promise<string>;
  refreshBalance: () => Promise<void>;
  changeNetwork: (net: 'testnet' | 'futurenet') => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [network, setNetwork] = useState<'testnet' | 'futurenet'>(NETWORK_CONFIG.selectedNetwork);
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);

  const activeConfig = NETWORK_CONFIG.networks[network];

  // Fetches balance from Stellar Horizon RPC
  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalance('0');
      return;
    }

    // For mock wallet, simulate a balance
    if (walletType === 'Mock') {
      const mockBalance = localStorage.getItem(`mock_balance_${address}`) || '10000.00';
      setBalance(mockBalance);
      return;
    }

    try {
      const response = await fetch(`${activeConfig.horizonUrl}/accounts/${address}`);
      if (response.ok) {
        const data = await response.json();
        const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
        if (nativeBalance) {
          setBalance(parseFloat(nativeBalance.balance).toFixed(2));
        }
      } else if (response.status === 404) {
        // Account not created/funded on testnet yet
        setBalance('0.00');
      }
    } catch (error) {
      console.error('Error fetching account balance:', error);
    }
  }, [address, walletType, activeConfig.horizonUrl]);

  // Connects the wallet
  const connect = async (type: WalletType) => {
    setIsLoading(true);
    try {
      let connectedAddress = '';
      if (type === 'Freighter') {
        connectedAddress = await walletConnector.connectFreighter();
      } else if (type === 'Mock') {
        connectedAddress = walletConnector.connectMock();
      } else {
        throw new Error('Albedo wallet support is coming soon. Please use Freighter.');
      }

      setAddress(connectedAddress);
      setWalletType(type);
      localStorage.setItem('connected_wallet_type', type);
      localStorage.setItem('connected_wallet_address', connectedAddress);
      toast.success('Wallet connected successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnects the wallet
  const disconnect = () => {
    setAddress(null);
    setWalletType(null);
    setBalance('0');
    localStorage.removeItem('connected_wallet_type');
    localStorage.removeItem('connected_wallet_address');
    toast.success('Wallet disconnected');
  };

  // Signs a transaction XDR
  const signTx = async (xdr: string): Promise<string> => {
    if (!isConnected || !walletType) {
      throw new Error('Wallet is not connected');
    }

    if (walletType === 'Freighter') {
      return await walletConnector.signWithFreighter(xdr, activeConfig.networkPassphrase);
    } else if (walletType === 'Mock') {
      return await walletConnector.signWithMock(xdr);
    } else {
      throw new Error('Selected wallet type not supported for signing.');
    }
  };

  // Changes the active network configuration
  const changeNetwork = (net: 'testnet' | 'futurenet') => {
    setNetwork(net);
    toast.success(`Switched network to ${net.toUpperCase()}`);
  };

  // Check auto reconnect on mount
  useEffect(() => {
    const savedType = localStorage.getItem('connected_wallet_type') as WalletType | null;
    const savedAddress = localStorage.getItem('connected_wallet_address');
    
    if (savedType && savedAddress) {
      setAddress(savedAddress);
      setWalletType(savedType);
    }
    setIsLoading(false);
  }, []);

  // Fetch balance when address or network changes
  useEffect(() => {
    if (address) {
      refreshBalance();
      // Poll balance every 10 seconds
      const interval = setInterval(refreshBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [address, network, refreshBalance]);

  const isConnected = !!address;

  return (
    <WalletContext.Provider
      value={{
        address,
        walletType,
        isConnected,
        network,
        balance,
        isLoading,
        isWrongNetwork,
        connect,
        disconnect,
        signTx,
        refreshBalance,
        changeNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

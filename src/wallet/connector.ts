import {
  isConnected,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api';
import { analyticsService } from '../services/analytics';

export type WalletType = 'Freighter' | 'Albedo' | 'Mock';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  walletType: WalletType | null;
  network: string | null;
  error: string | null;
}

export const walletConnector = {
  async isFreighterInstalled(): Promise<boolean> {
    try {
      return await isConnected();
    } catch {
      return false;
    }
  },

  async connectFreighter(): Promise<string> {
    const installed = await this.isFreighterInstalled();
    if (!installed) {
      throw new Error('Freighter wallet is not installed. Please install it to continue.');
    }

    try {
      const publicKey = await getPublicKey();
      if (!publicKey) {
        throw new Error('No public key returned. Please unlock your Freighter wallet.');
      }
      analyticsService.trackWalletConnection(publicKey, 'Freighter');
      return publicKey;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to connect Freighter wallet.');
    }
  },

  async signWithFreighter(xdr: string, networkPassphrase: string): Promise<string> {
    try {
      const signedXdr = await signTransaction(xdr, {
        network: 'TESTNET',
        networkPassphrase,
      });
      return signedXdr;
    } catch (err: any) {
      analyticsService.trackError('wallet_sign', err.message || 'User rejected signature', { wallet: 'Freighter' });
      throw new Error(err.message || 'Transaction signing rejected or failed.');
    }
  },

  // Mock wallet for instant onboarding and debugging
  connectMock(): string {
    // Generate a random public key or fetch a saved one
    let savedKey = localStorage.getItem('stellar_mock_wallet_address');
    if (!savedKey) {
      // Mock Stellar G Address format
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let mockKey = 'GB';
      for (let i = 0; i < 54; i++) {
        mockKey += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      savedKey = mockKey;
      localStorage.setItem('stellar_mock_wallet_address', savedKey);
    }
    analyticsService.trackWalletConnection(savedKey, 'Mock');
    return savedKey;
  },

  async signWithMock(xdr: string): Promise<string> {
    // Simulates a short signing delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return xdr; // In mock mode, we bypass actual ledger signing and return the XDR as is
  }
};

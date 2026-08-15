import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stellarService, OnChainPaymentRequest, ContractEvent } from '../services/stellar';
import { useWallet } from '../contexts/WalletContext';
import { toast } from 'react-hot-toast';

export const usePaymentRequests = () => {
  const { network } = useWallet();

  return useQuery<OnChainPaymentRequest[]>({
    queryKey: ['paymentRequests', network],
    queryFn: async () => {
      return await stellarService.fetchAllRequests(network);
    },
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });
};

export const usePaymentRequestById = (id: number) => {
  const { network } = useWallet();

  return useQuery<OnChainPaymentRequest | null>({
    queryKey: ['paymentRequest', id, network],
    queryFn: async () => {
      return await stellarService.fetchRequestById(id, network);
    },
    refetchInterval: 5000,
  });
};

export const useCreatePaymentRequest = () => {
  const queryClient = useQueryClient();
  const { address, walletType, network, signTx } = useWallet();

  return useMutation({
    mutationFn: async (data: {
      recipient: string;
      amount: number;
      description: string;
      tokenSymbol: string;
      onStatusChange?: (status: string, txHash?: string) => void;
    }) => {
      if (!address) throw new Error('Wallet not connected');

      let requestId: number;

      if (walletType === 'Mock') {
        data.onStatusChange?.('Preparing...');
        await new Promise((r) => setTimeout(r, 500));
        data.onStatusChange?.('Waiting for wallet approval...');
        requestId = await stellarService.mockCreateRequest(
          address,
          data.recipient,
          data.amount,
          data.description,
          data.tokenSymbol
        );
        data.onStatusChange?.('Success ✓', 'mock-tx-hash-' + Date.now());
      } else {
        data.onStatusChange?.('Preparing...');
        const unsignedXdr = await stellarService.buildCreateRequestTx(
          address,
          data.recipient,
          data.amount,
          data.description,
          data.tokenSymbol,
          network
        );

        data.onStatusChange?.('Waiting for wallet approval...');
        const signedXdr = await signTx(unsignedXdr);

        data.onStatusChange?.('Submitted...');
        const txResult = await stellarService.submitAndPollTx(signedXdr, network);
        
        data.onStatusChange?.('Success ✓', txResult.hash);

        // Fetch requests to get the newly created request ID
        const requests = await stellarService.fetchAllRequests(network);
        requestId = requests.length > 0 ? Math.max(...requests.map((r) => r.id)) : 1;
      }

      return requestId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentRequests'] });
      toast.success('Payment request created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create payment request');
    },
  });
};

export const usePayPaymentRequest = () => {
  const queryClient = useQueryClient();
  const { address, walletType, network, signTx } = useWallet();

  return useMutation({
    mutationFn: async ({
      requestId,
      onStatusChange,
    }: {
      requestId: number;
      onStatusChange?: (status: string, txHash?: string) => void;
    }) => {
      if (!address) throw new Error('Wallet not connected');

      if (walletType === 'Mock') {
        onStatusChange?.('Preparing...');
        await new Promise((r) => setTimeout(r, 500));
        onStatusChange?.('Waiting for wallet approval...');
        await stellarService.mockPayRequest(address, requestId);
        onStatusChange?.('Success ✓', 'mock-tx-hash-' + Date.now());
      } else {
        onStatusChange?.('Preparing...');
        const unsignedXdr = await stellarService.buildPayRequestTx(address, requestId, network);

        onStatusChange?.('Waiting for wallet approval...');
        const signedXdr = await signTx(unsignedXdr);

        onStatusChange?.('Submitted...');
        const txResult = await stellarService.submitAndPollTx(signedXdr, network);

        onStatusChange?.('Success ✓', txResult.hash);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paymentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['paymentRequest', variables.requestId] });
      toast.success(`Paid Payment Request #${variables.requestId} successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to pay request');
    },
  });
};

export const useCancelPaymentRequest = () => {
  const queryClient = useQueryClient();
  const { address, walletType, network, signTx } = useWallet();

  return useMutation({
    mutationFn: async ({
      requestId,
      onStatusChange,
    }: {
      requestId: number;
      onStatusChange?: (status: string, txHash?: string) => void;
    }) => {
      if (!address) throw new Error('Wallet not connected');

      if (walletType === 'Mock') {
        onStatusChange?.('Preparing...');
        await new Promise((r) => setTimeout(r, 500));
        onStatusChange?.('Waiting for wallet approval...');
        await stellarService.mockCancelRequest(address, requestId);
        onStatusChange?.('Success ✓', 'mock-tx-hash-' + Date.now());
      } else {
        onStatusChange?.('Preparing...');
        const unsignedXdr = await stellarService.buildCancelRequestTx(address, requestId, network);

        onStatusChange?.('Waiting for wallet approval...');
        const signedXdr = await signTx(unsignedXdr);

        onStatusChange?.('Submitted...');
        const txResult = await stellarService.submitAndPollTx(signedXdr, network);

        onStatusChange?.('Success ✓', txResult.hash);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paymentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['paymentRequest', variables.requestId] });
      toast.success(`Cancelled Payment Request #${variables.requestId}.`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel request');
    },
  });
};

export const useContractEvents = () => {
  const { network } = useWallet();

  return useQuery<ContractEvent[]>({
    queryKey: ['contractEvents', network],
    queryFn: async () => {
      return await stellarService.fetchContractEvents(network);
    },
    refetchInterval: 4000, // Poll every 4 seconds for events
  });
};

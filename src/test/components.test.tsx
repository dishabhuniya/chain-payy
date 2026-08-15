import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import PaymentRequestPage from '../pages/PaymentRequestPage';
import { TransactionStatusTracker } from '../components/TransactionStatusTracker';

// Mock Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: '1' }),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Mock hooks
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockRefetch = vi.fn();

vi.mock('../contexts/WalletContext', () => ({
  useWallet: () => ({
    isConnected: true,
    address: 'GDV56WIK33JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJWX36QJ',
    balance: '500.00',
    connect: mockConnect,
    disconnect: mockDisconnect,
    network: 'testnet',
  }),
}));

const mockMutateCreate = vi.fn();
const mockMutatePay = vi.fn();
const mockMutateCancel = vi.fn();

vi.mock('../hooks/usePaymentRequests', () => ({
  usePaymentRequests: () => ({
    data: [
      {
        id: 1,
        creator: 'GDV56WIK33JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJWX36QJ',
        recipient: 'GCJ7KNLQJCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJW42LKD3',
        amount: '100.00',
        description: 'Dinner split',
        status: 'PENDING',
        createdAt: Date.now(),
        paidAt: null,
      },
    ],
    isLoading: false,
    refetch: mockRefetch,
    isRefetching: false,
  }),
  usePaymentRequestById: () => ({
    data: {
      id: 1,
      creator: 'GDV56WIK33JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJWX36QJ',
      recipient: 'GCJ7KNLQJCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJW42LKD3',
      amount: '100.00',
      description: 'Dinner split',
      status: 'PENDING',
      createdAt: Date.now(),
      paidAt: null,
    },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useCreatePaymentRequest: () => ({
    mutateAsync: mockMutateCreate,
    isPending: false,
  }),
  usePayPaymentRequest: () => ({
    mutateAsync: mockMutatePay,
    isPending: false,
  }),
  useCancelPaymentRequest: () => ({
    mutateAsync: mockMutateCancel,
    isPending: false,
  }),
  useContractEvents: () => ({
    data: [
      {
        id: '1',
        type: 'created',
        requestId: 1,
        message: '🔔 New payment request #1 created by GDV5... for 100.00 XLM',
        timestamp: Date.now(),
      },
    ],
    isLoading: false,
  }),
}));

describe('ChainPay Frontend Components', () => {
  it('renders Dashboard with statistics and activity feed', () => {
    render(<Dashboard />);
    expect(screen.getByText('ChainPay Dashboard')).toBeInTheDocument();
    expect(screen.getByText('500.00 XLM')).toBeInTheDocument();
    expect(screen.getByText('Dinner split')).toBeInTheDocument();
    expect(screen.getByText('🔔 New payment request #1 created by GDV5... for 100.00 XLM')).toBeInTheDocument();
  });

  it('validates Create Request Form inputs', async () => {
    render(<Dashboard />);
    const submitBtn = screen.getByRole('button', { name: /Create Request/i });
    expect(submitBtn).toBeInTheDocument();
  });

  it('renders TransactionStatusTracker step progress', () => {
    const { rerender } = render(<TransactionStatusTracker status="Preparing..." onClose={() => {}} />);
    expect(screen.getByText('Preparing...')).toBeInTheDocument();
    expect(screen.getByText('Transaction Status')).toBeInTheDocument();

    rerender(<TransactionStatusTracker status="Success ✓" txHash="test-hash-xyz" onClose={() => {}} />);
    expect(screen.getByText('Transaction Successful!')).toBeInTheDocument();
    expect(screen.getByText(/test-hash-/i)).toBeInTheDocument();
  });

  it('renders Shareable PaymentRequestPage with Pay and Cancel buttons', () => {
    render(<PaymentRequestPage />);
    expect(screen.getByText('Payment Request #1')).toBeInTheDocument();
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay Request/i })).toBeInTheDocument();
  });
});

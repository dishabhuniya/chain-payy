import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { usePaymentRequestById, usePayPaymentRequest, useCancelPaymentRequest } from '../hooks/usePaymentRequests';
import {
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { TransactionStatusTracker } from '../components/TransactionStatusTracker';
import { toast } from 'react-hot-toast';

const PaymentRequestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const requestId = Number(id || 0);

  const { isConnected, address, connect } = useWallet();
  const { data: request, isLoading, error: fetchError, refetch } = usePaymentRequestById(requestId);

  const payMutation = usePayPaymentRequest();
  const cancelMutation = useCancelPaymentRequest();

  // Transaction Steps Tracker State
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txError, setTxError] = useState<string | null>(null);

  const handlePay = async () => {
    setTxError(null);
    setTxHash(undefined);
    try {
      await payMutation.mutateAsync({
        requestId,
        onStatusChange: (status, hash) => {
          setTxStatus(status);
          if (hash) setTxHash(hash);
        },
      });
      refetch();
    } catch (err: any) {
      setTxError(err.message || 'Payment execution failed.');
    }
  };

  const handleCancel = async () => {
    setTxError(null);
    setTxHash(undefined);
    try {
      await cancelMutation.mutateAsync({
        requestId,
        onStatusChange: (status, hash) => {
          setTxStatus(status);
          if (hash) setTxHash(hash);
        },
      });
      refetch();
    } catch (err: any) {
      setTxError(err.message || 'Cancellation failed.');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Shareable invoice link copied to clipboard!');
  };

  const closeTracker = () => {
    setTxStatus(null);
    setTxError(null);
    setTxHash(undefined);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400">Loading payment request #{requestId}...</span>
      </div>
    );
  }

  if (fetchError || !request) {
    return (
      <div className="max-w-md mx-auto py-20 flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
          <XCircle className="h-10 w-10" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white">Invoice Not Found</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          The requested payment request ID #{requestId} could not be resolved. Please verify the URL or ensure the request exists on Stellar Testnet.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  const isPending = request.status === 'PENDING';
  const isPaid = request.status === 'PAID';
  const isCancelled = request.status === 'CANCELLED';

  const isCreator = address === request.creator;

  return (
    <div className="max-w-xl mx-auto space-y-6 py-8">
      {/* Transaction Stepper Modal */}
      <TransactionStatusTracker
        status={txStatus}
        txHash={txHash}
        error={txError}
        onClose={closeTracker}
      />

      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-all text-sm font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Main Glassmorphic Invoice Card */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 relative overflow-hidden space-y-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Status header banner */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest font-mono">
            Payment Request #{request.id}
          </span>
          <span
            className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full ${
              isPaid
                ? 'bg-emerald-500/10 text-emerald-400'
                : isCancelled
                ? 'bg-red-500/10 text-red-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {isPaid ? (
              <CheckCircle className="h-3.5 w-3.5 animate-pulse" />
            ) : isCancelled ? (
              <XCircle className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            )}
            <span>{request.status}</span>
          </span>
        </div>

        {/* Big Amount display */}
        <div className="text-center py-6 border-y border-white/5 space-y-2">
          <span className="text-xs text-slate-400 uppercase tracking-widest block font-bold">Total Request Amount</span>
          <span className="text-5xl font-black text-white block select-all">
            {request.amount} <span className="text-indigo-400">XLM</span>
          </span>
          <span className="text-slate-350 text-sm font-semibold block italic">
            "{request.description}"
          </span>
        </div>

        {/* Details List */}
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-semibold">Request Creator (Payer)</span>
            <code className="text-xs font-mono text-slate-300 select-all max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
              {request.creator}
            </code>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-semibold">Recipient Address</span>
            <code className="text-xs font-mono text-slate-300 select-all max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
              {request.recipient}
            </code>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400 font-semibold">Created On</span>
            <span className="text-slate-300">
              {new Date(request.createdAt).toLocaleString()}
            </span>
          </div>
          {request.paidAt && (
            <div className="flex justify-between items-start">
              <span className="text-slate-400 font-semibold">Paid On</span>
              <span className="text-emerald-400 font-medium">
                {new Date(request.paidAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="pt-6 border-t border-white/5 space-y-3">
          {isPaid && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <span className="text-emerald-400 font-bold block">✓ Payment Completed</span>
              <button
                onClick={copyShareLink}
                className="inline-flex items-center space-x-1 text-xs text-indigo-400 font-semibold hover:text-indigo-300"
              >
                <Share2 className="h-3 w-3" />
                <span>Copy Share Link</span>
              </button>
            </div>
          )}

          {isCancelled && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-red-400 font-bold">
              ✕ Request Cancelled
            </div>
          )}

          {isPending && (
            <div className="flex flex-col space-y-3">
              {!isConnected ? (
                <>
                  <button
                    onClick={() => connect('Freighter')}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Connect Freighter Wallet</span>
                  </button>
                  <button
                    onClick={() => connect('Mock')}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all"
                  >
                    Use Mock Ledger Simulator
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePay}
                    disabled={payMutation.isPending}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Coins className="h-4 w-4" />
                    <span>{payMutation.isPending ? 'Processing Payment...' : 'Pay Request'}</span>
                  </button>

                  {isCreator && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelMutation.isPending}
                      className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold transition-all disabled:opacity-50"
                    >
                      <span>{cancelMutation.isPending ? 'Cancelling...' : 'Cancel Request'}</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={copyShareLink}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all flex items-center justify-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Payment Request</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestPage;

import React, { useState, useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import {
  usePaymentRequests,
  useCreatePaymentRequest,
  useCancelPaymentRequest,
  usePayPaymentRequest,
  useContractEvents,
} from '../hooks/usePaymentRequests';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Activity,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TransactionStatusTracker } from '../components/TransactionStatusTracker';

const Dashboard: React.FC = () => {
  const { isConnected, address, balance, connect, disconnect } = useWallet();
  const { data: requests, isLoading: isRequestsLoading, refetch, isRefetching } = usePaymentRequests();
  const { data: events, isLoading: isEventsLoading } = useContractEvents();
  
  const createMutation = useCreatePaymentRequest();
  const payMutation = usePayPaymentRequest();
  const cancelMutation = useCancelPaymentRequest();
  
  const navigate = useNavigate();

  // Create Form State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Transaction Steps Tracker State
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txError, setTxError] = useState<string | null>(null);

  // Tab State: 'sent' or 'received'
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (!requests || !address) return { sent: [], received: [] };
    return {
      sent: requests.filter((r) => r.creator === address),
      received: requests.filter((r) => r.recipient === address),
    };
  }, [requests, address]);

  // Aggregate user stats
  const stats = useMemo(() => {
    const defaultStats = {
      totalRequests: 0,
      pendingRequests: 0,
      paidRequests: 0,
      xlmReceived: 0,
      xlmSent: 0,
    };

    if (!requests || !address) return defaultStats;

    const userSent = filteredRequests.sent;
    const userRecv = filteredRequests.received;

    const totalRequests = requests.filter(r => r.creator === address || r.recipient === address).length;
    const pendingRequests = requests.filter(r => (r.creator === address || r.recipient === address) && r.status === 'PENDING').length;
    const paidRequests = requests.filter(r => (r.creator === address || r.recipient === address) && r.status === 'PAID').length;

    // Received XLM = PAID requests where user is recipient
    const xlmReceived = userRecv
      .filter((r) => r.status === 'PAID')
      .reduce((acc, r) => acc + parseFloat(r.amount), 0);

    // Sent XLM = PAID requests where user is creator (payer)
    const xlmSent = userSent
      .filter((r) => r.status === 'PAID')
      .reduce((acc, r) => acc + parseFloat(r.amount), 0);

    return {
      totalRequests,
      pendingRequests,
      paidRequests,
      xlmReceived,
      xlmSent,
    };
  }, [requests, address, filteredRequests]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);
    setTxHash(undefined);

    // Form validations
    if (!recipient.startsWith('G') || recipient.length !== 56) {
      setTxError('Invalid Stellar address. Must be a G... public key (56 characters).');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setTxError('Amount must be a positive number greater than zero.');
      return;
    }
    if (!description.trim()) {
      setTxError('Description cannot be empty.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        recipient,
        amount: amt,
        description,
        tokenSymbol: 'XLM',
        onStatusChange: (status, hash) => {
          setTxStatus(status);
          if (hash) setTxHash(hash);
        },
      });
      // Clear form
      setRecipient('');
      setAmount('');
      setDescription('');
    } catch (err: any) {
      setTxError(err.message || 'Failed to create payment request.');
    }
  };

  const handlePayRequest = async (requestId: number) => {
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
    } catch (err: any) {
      setTxError(err.message || 'Failed to submit payment.');
    }
  };

  const handleCancelRequest = async (requestId: number) => {
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
    } catch (err: any) {
      setTxError(err.message || 'Failed to cancel request.');
    }
  };

  const closeTracker = () => {
    setTxStatus(null);
    setTxError(null);
    setTxHash(undefined);
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto py-16 flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Coins className="h-10 w-10 animate-pulse" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white">Connect Freighter Wallet</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Welcome to ChainPay. Connect your wallet to request XLM payments, track real-time transaction events, and view stats on Stellar Testnet.
        </p>
        <div className="flex flex-col space-y-3 w-full">
          <button
            onClick={() => connect('Freighter')}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20 w-full"
          >
            Connect Freighter Wallet
          </button>
          <button
            onClick={() => connect('Mock')}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all w-full"
          >
            Use Mock Ledger Simulator
          </button>
        </div>
      </div>
    );
  }

  const currentRequests = activeTab === 'sent' ? filteredRequests.sent : filteredRequests.received;

  return (
    <div className="space-y-8">
      {/* Transaction Stepper Modal */}
      <TransactionStatusTracker
        status={txStatus}
        txHash={txHash}
        error={txError}
        onClose={closeTracker}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white flex items-center gap-2">
            ChainPay Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Request, track, and pay invoices instantly using Soroban smart contracts.
          </p>
        </div>
        
        <button
          onClick={() => refetch()}
          disabled={isRequestsLoading || isRefetching}
          className="self-start md:self-auto flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-350 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          <span>{isRefetching ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </div>

      {/* Wallet Info Panel */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
            Stellar Testnet
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Connected Wallet Address</span>
            <code className="text-sm text-slate-100 font-mono select-all">
              {address}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Balance</span>
            <span className="text-2xl font-black text-white">{balance} XLM</span>
          </div>
          <button
            onClick={disconnect}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Requests</span>
          <span className="text-2xl font-black text-white block">{stats.totalRequests}</span>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Pending</span>
          <span className="text-2xl font-black text-amber-400 block">{stats.pendingRequests}</span>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Paid</span>
          <span className="text-2xl font-black text-emerald-400 block">{stats.paidRequests}</span>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">XLM Received</span>
          <span className="text-2xl font-black text-indigo-400 block">{stats.xlmReceived.toFixed(2)}</span>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">XLM Sent</span>
          <span className="text-2xl font-black text-violet-400 block">{stats.xlmSent.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Center - Forms & Tables */}
        <div className="lg:col-span-2 space-y-8">
          {/* Create Request Form */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-400" />
              Create Payment Request
            </h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Recipient Stellar Address</label>
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="G..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Amount (XLM)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Description / Purpose</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dinner split, office supplies, etc."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{createMutation.isPending ? 'Creating Request...' : 'Create Request'}</span>
              </button>
            </form>
          </div>

          {/* My Requests Workspace */}
          <div className="space-y-4">
            {/* Tabs selector */}
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex items-center space-x-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                  activeTab === 'sent'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>My Sent Requests</span>
              </button>
              
              <button
                onClick={() => setActiveTab('received')}
                className={`flex items-center space-x-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
                  activeTab === 'received'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                <span>My Received Invoices</span>
              </button>
            </div>

            {/* List Table */}
            {isRequestsLoading ? (
              <div className="py-12 flex justify-center items-center">
                <span className="text-slate-400 text-sm">Loading requests...</span>
              </div>
            ) : currentRequests.length === 0 ? (
              <div className="py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <FileText className="h-8 w-8 text-slate-500" />
                <span className="text-slate-400 text-sm">No payment requests found.</span>
              </div>
            ) : (
              <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-900/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">ID</th>
                        <th className="p-4">{activeTab === 'sent' ? 'Recipient' : 'Sender'}</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {currentRequests.map((req) => {
                        const isPending = req.status === 'PENDING';
                        const isPaid = req.status === 'PAID';
                        const isCancelled = req.status === 'CANCELLED';

                        return (
                          <tr key={req.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-300">#{req.id}</td>
                            <td className="p-4 font-mono text-xs text-slate-400">
                              {activeTab === 'sent' ? `${req.recipient.slice(0, 4)}...${req.recipient.slice(-4)}` : `${req.creator.slice(0, 4)}...${req.creator.slice(-4)}`}
                            </td>
                            <td className="p-4 font-black text-white">{req.amount} XLM</td>
                            <td className="p-4 text-slate-300 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">{req.description}</td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  isPaid
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : isCancelled
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {isPaid ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : isCancelled ? (
                                  <XCircle className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                <span>{req.status}</span>
                              </span>
                            </td>
                            <td className="p-4 flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/request/${req.id}`)}
                                className="text-xs font-semibold px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-indigo-400 flex items-center gap-1 transition-all"
                              >
                                View
                                <ExternalLink className="h-3 w-3" />
                              </button>

                              {activeTab === 'received' && isPending && (
                                <button
                                  onClick={() => handlePayRequest(req.id)}
                                  className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                                >
                                  Pay
                                </button>
                              )}

                              {activeTab === 'sent' && isPending && (
                                <button
                                  onClick={() => handleCancelRequest(req.id)}
                                  className="text-xs font-semibold px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Activity Feed */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
              Live activity feed
            </h3>
            
            {isEventsLoading ? (
              <span className="text-slate-400 text-xs block">Polling ledger events...</span>
            ) : !events || events.length === 0 ? (
              <span className="text-slate-400 text-xs block">No recent event activity detected on-chain.</span>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg border border-white/5 bg-slate-900/60 text-xs flex flex-col space-y-2 transition-all hover:bg-white/5"
                  >
                    <p className="text-slate-200 leading-relaxed font-medium">{ev.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Event #{ev.id.slice(0, 8)}</span>
                      <span>
                        {new Date(ev.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-indigo-400" />
              Need Testnet XLM?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you need more funds to test on Testnet, you can use Friendbot to fund your Freighter address by visiting the{' '}
              <a
                href="https://laboratory.stellar.org/#account-creator?network=testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
              >
                Stellar Lab Creator
                <ExternalLink className="h-2 w-2" />
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

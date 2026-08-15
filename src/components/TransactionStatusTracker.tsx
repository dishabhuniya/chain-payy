import React from 'react';
import { Loader2, ExternalLink, XCircle } from 'lucide-react';

interface TransactionStatusTrackerProps {
  status: string | null;
  txHash?: string;
  error?: string | null;
  onClose?: () => void;
}

export const TransactionStatusTracker: React.FC<TransactionStatusTrackerProps> = ({
  status,
  txHash,
  error,
  onClose,
}) => {
  if (!status && !error) return null;

  const steps = [
    'Preparing...',
    'Waiting for wallet approval...',
    'Submitted...',
    'Confirming...',
    'Success ✓',
  ];

  const currentStepIndex = steps.indexOf(status || '');
  const isFailed = !!error;
  const isSuccess = status?.includes('Success') || status?.includes('✓');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Transaction Status</h3>
          {(isSuccess || isFailed) && onClose && (
            <button
              onClick={onClose}
              className="text-xs font-semibold px-3 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 transition-all"
            >
              Close
            </button>
          )}
        </div>

        {isFailed ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full animate-bounce">
              <XCircle className="h-10 w-10" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">Transaction Failed</h4>
              <p className="text-sm text-red-400 mt-2 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                {error}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {steps.slice(0, 4).map((step, idx) => {
              const isActive = status === step;
              const isCompleted = currentStepIndex > idx || isSuccess;

              return (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="relative flex items-center justify-center">
                    {isCompleted ? (
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                        ✓
                      </div>
                    ) : isActive ? (
                      <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center text-indigo-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 text-xs">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold transition-all ${
                      isCompleted
                        ? 'text-slate-400 line-through decoration-slate-600'
                        : isActive
                        ? 'text-white scale-105'
                        : 'text-slate-500'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}

            {/* Success step */}
            <div className="flex items-center space-x-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-center">
                {isSuccess ? (
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 animate-pulse">
                    ✓
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 text-xs">
                    5
                  </div>
                )}
              </div>
              <span className={`text-sm font-bold ${isSuccess ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                Transaction Successful!
              </span>
            </div>
          </div>
        )}

        {txHash && (
          <div className="pt-4 border-t border-white/5 flex flex-col space-y-2">
            <span className="text-xs text-slate-400 font-medium">Transaction Hash:</span>
            <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-2">
              <code className="text-xs text-indigo-300 font-mono select-all">
                {txHash.slice(0, 10)}...{txHash.slice(-10)}
              </code>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all"
              >
                <span>Explorer</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

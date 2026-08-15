import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { WalletType } from '../wallet/connector';
import { X, ExternalLink, HelpCircle, Shield, Award, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connect } = useWallet();
  const [activeTab, setActiveTab] = useState<'connect' | 'guide'>('connect');
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (type: WalletType) => {
    setConnecting(type);
    try {
      await connect(type);
      onClose();
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setConnecting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="font-display font-bold text-xl text-white">Access Stellar Platform</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 bg-slate-900/40">
            <button
              onClick={() => setActiveTab('connect')}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'connect'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Connect Wallet
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'guide'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              New to Stellar? Onboarding Guide
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto max-h-[400px]">
            {activeTab === 'connect' ? (
              <div className="space-y-4">
                {/* Freighter Option */}
                <button
                  onClick={() => handleConnect('Freighter')}
                  disabled={connecting !== null}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">Freighter Wallet</h3>
                      <p className="text-xs text-slate-400">Official browser extension. Highly recommended.</p>
                    </div>
                  </div>
                  {connecting === 'Freighter' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                  ) : (
                    <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  )}
                </button>

                {/* Albedo Option */}
                <button
                  onClick={() => handleConnect('Albedo')}
                  disabled={connecting !== null}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">Albedo Wallet</h3>
                      <p className="text-xs text-slate-400">Browser-based wallet. Safe & fast.</p>
                    </div>
                  </div>
                  {connecting === 'Albedo' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                  ) : (
                    <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  )}
                </button>

                {/* Mock Wallet Option */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-white/5" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-950 px-2 text-slate-500 font-semibold tracking-wider">Alternative Developer Mode</span>
                  </div>
                </div>

                <button
                  onClick={() => handleConnect('Mock')}
                  disabled={connecting !== null}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Play className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">Mock Ledger Simulator</h3>
                      <p className="text-xs text-slate-400">Test all functions instantly without signing or paying gas.</p>
                    </div>
                  </div>
                  {connecting === 'Mock' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">Quick Test</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                <div>
                  <h3 className="font-bold text-white text-base mb-2">Step 1: Install Freighter Wallet</h3>
                  <p className="mb-2">Freighter is the official Chrome/Firefox wallet extension for the Stellar ecosystem.</p>
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    <span>Download Freighter Extension</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base mb-2">Step 2: Configure Network to Testnet</h3>
                  <p>Open Freighter, click the network dropdown (defaults to Public), and switch it to **Testnet** (or Futurenet if testing future features).</p>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base mb-2">Step 3: Get Testnet Assets (Friendbot)</h3>
                  <p className="mb-2">You need test tokens to pay contract gas and fund micro-loans. Once you copy your public key, fund it instantly via the Stellar Lab Friendbot:</p>
                  <a
                    href="https://laboratory.stellar.org/#account-creator?network=testnet"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    <span>Go to Stellar Friendbot Creator</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start space-x-3 text-xs text-indigo-300">
                  <HelpCircle className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                  <div>
                    <span className="font-semibold block mb-0.5 text-white">Don't want to install an extension?</span>
                    Choose the **Mock Ledger Simulator** tab to explore full platform functionalities immediately!
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalletModal;

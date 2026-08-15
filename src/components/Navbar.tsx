import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, Copy, Check, LogOut, Menu, X, Coins } from 'lucide-react';
import WalletModal from './WalletModal';
import { toast } from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { address, isConnected, balance, network, changeNetwork, disconnect } = useWallet();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'FAQ & Help', path: '/faq' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-slate-950/80 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Coins className="h-6 w-6" />
                </span>
                <span className="font-display font-bold text-xl tracking-tight text-white">
                  Chain<span className="text-indigo-400">Pay</span>
                </span>
              </Link>
              
              {/* Desktop Nav Links */}
              <div className="hidden md:flex ml-10 space-x-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path || (link.path === '/' && location.pathname === '/dashboard');
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right-aligned actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Network select */}
              <select
                value={network}
                onChange={(e) => changeNetwork(e.target.value as 'testnet' | 'futurenet')}
                className="bg-slate-900 border border-white/10 rounded-lg text-xs font-semibold px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="testnet">Testnet</option>
                <option value="futurenet">Futurenet</option>
              </select>

              {isConnected && address ? (
                <div className="flex items-center space-x-3 bg-white/5 border border-white/5 pl-4 pr-1 py-1 rounded-full">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Balance</span>
                    <span className="text-xs font-bold text-emerald-400">{balance} XLM</span>
                  </div>
                  
                  {/* Truncated wallet address */}
                  <button
                    onClick={copyAddress}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 hover:border-indigo-500/30 text-slate-200 text-xs font-mono transition-colors group"
                  >
                    <span>{`${address.substring(0, 5)}...${address.substring(address.length - 4)}`}</span>
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </button>

                  {/* Disconnect button */}
                  <button
                    onClick={disconnect}
                    title="Disconnect Wallet"
                    className="p-1.5 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 scale-100 hover:scale-[1.02]"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Mobile menu trigger */}
            <div className="flex items-center md:hidden space-x-2">
              <select
                value={network}
                onChange={(e) => changeNetwork(e.target.value as 'testnet' | 'futurenet')}
                className="bg-slate-900 border border-white/10 rounded-lg text-xs font-semibold px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="testnet">Testnet</option>
                <option value="futurenet">Futurenet</option>
              </select>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/5 px-4 pt-2 pb-4 space-y-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path === '/' && location.pathname === '/dashboard');
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-base font-semibold ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {isConnected && address ? (
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between px-4">
                  <span className="text-slate-400 text-sm">XLM Balance</span>
                  <span className="font-bold text-emerald-400 text-sm">{balance} XLM</span>
                </div>
                <div className="flex items-center justify-between px-4">
                  <span className="text-slate-400 text-sm font-mono text-xs">{`${address.substring(0, 8)}...${address.substring(address.length - 8)}`}</span>
                  <button onClick={copyAddress} className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center space-x-1">
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-sm font-semibold transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Wallet modal */}
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Navbar;

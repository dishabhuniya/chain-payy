import React from 'react';
import { HelpCircle, ShieldCheck, Zap, Wallet, Landmark, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const FAQ: React.FC = () => {
  const faqSections = [
    {
      title: 'Getting Started on Stellar Testnet',
      icon: Zap,
      items: [
        {
          q: 'How do I set up a Freighter wallet?',
          a: 'Install the official Freighter browser extension from freighter.app. Create a seed phrase, set a secure password, and you will receive a new public address (starting with G). Open the Freighter network selector and ensure it is configured to "Testnet" instead of "Public".'
        },
        {
          q: 'How do I acquire free Testnet XLM?',
          a: 'Stellar provides a free faucet called Friendbot to fund test addresses. Copy your Freighter wallet address, go to laboratory.stellar.org/#account-creator?network=testnet, paste your address, and click "Create Account". Your address will instantly be funded with 10,000 testnet XLM.'
        },
        {
          q: 'Can I test this app without installing any extensions?',
          a: 'Yes! Connect using the "Mock Ledger Simulator" option. It simulates all ledger changes, balance updates, and contract events in your browser local storage, allowing you to test creating, paying, and cancelling requests immediately.'
        }
      ]
    },
    {
      title: 'Smart Payment Requests',
      icon: ShieldCheck,
      items: [
        {
          q: 'What is a Smart Payment Request?',
          a: 'ChainPay generates a unique payment request on-chain utilizing Soroban. Each payment request records the creator, recipient, amount, description, status, and creation time directly in Stellar Testnet ledger storage, making payments easily trackable and verifiable.'
        },
        {
          q: 'How do payment transfers occur?',
          a: 'When a payer clicks "Pay Request" and signs the transaction, the Soroban contract atomically verifies the request state and invokes the asset contract to transfer the requested amount from the payer to the recipient. This guarantees that the payment and status change occur together in a single atomic transaction.'
        },
        {
          q: 'Can a payment request be cancelled or modified?',
          a: 'Yes, a pending request can be cancelled on-chain, but only by the original creator. Once a request status changes to PAID or CANCELLED, it can never be paid or cancelled again. This prevents duplicate payments or unauthorized modifications.'
        }
      ]
    },
    {
      title: 'Real-time Feeds & Statistics',
      icon: Landmark,
      items: [
        {
          q: 'Where do the events in the activity feed come from?',
          a: 'The contract emits real-time events (req_crea, req_paid, req_canc) upon execution of transactions on-chain. ChainPay queries the Stellar RPC server to load these event logs and displays updates dynamically in the dashboard feed.'
        },
        {
          q: 'How are payment statistics calculated?',
          a: 'Statistics like Total Requests, Pending count, and XLM received/sent are computed dynamically by filtering on-chain request data associated with your connected public address. No static mocks or hardcoding is used.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mx-auto">
          <HelpCircle className="h-8 w-8 animate-bounce" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">FAQ & Platform Help</h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Learn how to request XLM payments, authorize transactions using Freighter, and explore how Soroban events work.
        </p>
      </div>

      {/* Onboarding Guide Quickcards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit">
            <Wallet className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-sm">1. Install Wallet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get the Freighter browser extension, secure your account key, and configure the network to **Stellar Testnet**.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
            <RefreshCw className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-sm">2. Create Request</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter a recipient address, the XLM amount, and a description. Sign the transaction to register the invoice on-chain.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit">
            <Landmark className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-sm">3. Pay Shareable Link</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Share the generated `/request/:id` link with payers so they can pay the invoice with one click from their Freighter wallet.
          </p>
        </div>
      </section>

      {/* Accordion / Sections */}
      <div className="space-y-10">
        {faqSections.map((section, idx) => {
          const SectionIcon = section.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              key={section.title}
              className="space-y-4"
            >
              <h2 className="font-display font-bold text-lg text-white flex items-center space-x-2">
                <SectionIcon className="h-5 w-5 text-indigo-400" />
                <span>{section.title}</span>
              </h2>

              <div className="space-y-4">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:border-indigo-500/10 transition-all"
                  >
                    <h3 className="font-semibold text-white text-sm flex items-start space-x-2">
                      <span className="text-indigo-400 font-bold">Q:</span>
                      <span>{item.q}</span>
                    </h3>
                    <p className="text-xs text-slate-350 leading-relaxed pl-5">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQ;

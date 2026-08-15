import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400"
      >
        <AlertCircle className="h-12 w-12 animate-pulse" />
      </motion.div>

      <div className="space-y-2">
        <h1 className="font-display font-black text-5xl text-white">404</h1>
        <h2 className="font-display font-extrabold text-2xl text-slate-200">Page Not Found</h2>
        <p className="text-sm text-slate-400 leading-relaxed font-light">
          The requested page does not exist or has been moved. Check the URL parameters or return to the platform landing page.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20 w-full"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Homepage</span>
      </button>
    </div>
  );
};

export default NotFound;

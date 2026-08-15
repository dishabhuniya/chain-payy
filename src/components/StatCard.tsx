import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'violet';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  color = 'indigo',
}) => {
  const colorStyles = {
    indigo: {
      border: 'hover:border-indigo-500/30',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      glow: 'shadow-indigo-500/5',
    },
    emerald: {
      border: 'hover:border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'shadow-emerald-500/5',
    },
    amber: {
      border: 'hover:border-amber-500/30',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      glow: 'shadow-amber-500/5',
    },
    violet: {
      border: 'hover:border-violet-500/30',
      iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      glow: 'shadow-violet-500/5',
    },
  };

  const currentStyles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass p-6 rounded-2xl flex items-center justify-between border border-white/5 transition-all duration-300 hover:bg-slate-900/50 ${currentStyles.border} shadow-lg ${currentStyles.glow}`}
    >
      <div className="space-y-2">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
          {title}
        </span>
        <h3 className="text-3xl font-display font-bold text-white tracking-tight">{value}</h3>
        {change && (
          <div className="flex items-center space-x-1">
            <span
              className={`text-xs font-semibold ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {change}
            </span>
            <span className="text-[10px] text-slate-500">vs last month</span>
          </div>
        )}
      </div>

      <div className={`p-4 rounded-xl border ${currentStyles.iconBg}`}>
        <Icon className="h-6 w-6" />
      </div>
    </motion.div>
  );
};

export default StatCard;

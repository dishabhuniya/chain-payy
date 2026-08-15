import React from 'react';

export const LoanCardSkeleton: React.FC = () => {
  return (
    <div className="glass p-6 rounded-2xl border border-white/5 animate-pulse flex flex-col justify-between h-[300px]">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded w-16" />
            <div className="h-6 bg-slate-800 rounded w-48" />
            <div className="h-3 bg-slate-800 rounded w-32" />
          </div>
          <div className="h-5 bg-slate-800 rounded-full w-24" />
        </div>
        <div className="space-y-2 mb-5">
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-5/6" />
        </div>
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/40 border border-white/5 mb-5">
          <div className="space-y-1.5">
            <div className="h-3 bg-slate-800 rounded w-10" />
            <div className="h-4 bg-slate-800 rounded w-14" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-slate-800 rounded w-10" />
            <div className="h-4 bg-slate-800 rounded w-14" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-slate-800 rounded w-10" />
            <div className="h-4 bg-slate-800 rounded w-14" />
          </div>
        </div>
      </div>
      <div className="h-8 bg-slate-800 rounded w-full mt-4" />
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="glass p-6 rounded-2xl border border-white/5 animate-pulse flex items-center justify-between">
      <div className="space-y-2.5">
        <div className="h-3.5 bg-slate-800 rounded w-28" />
        <div className="h-8 bg-slate-800 rounded w-20" />
        <div className="h-3 bg-slate-800 rounded w-24" />
      </div>
      <div className="h-14 w-14 bg-slate-800 rounded-xl" />
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-900 border-b border-white/5 flex items-center px-6">
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="h-4 bg-slate-800 rounded w-1/4 ml-auto" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-slate-800 rounded-full" />
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-800 rounded w-1/6 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

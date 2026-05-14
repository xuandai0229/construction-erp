
'use client';

import React from 'react';

interface GuidanceProps {
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  actions?: { label: string; onClick: () => void; primary?: boolean }[];
}

export default function GuidanceBanner({ title, message, severity, actions }: GuidanceProps) {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '🚨',
    success: '✅'
  };

  return (
    <div className={`px-3 py-2 rounded-lg border ${styles[severity]} flex flex-col md:flex-row gap-3 items-start md:items-center animate-in slide-in-from-top-4 duration-500 hover:shadow-sm transition-all backdrop-blur-sm`}>
      <div className="flex gap-2.5 flex-1">
        <span className="text-lg shrink-0 mt-0.5">{icons[severity]}</span>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">{title}</h4>
          <p className="text-[10px] mt-0.5 opacity-95 leading-tight font-black">{message}</p>
        </div>
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex gap-1.5 shrink-0">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`text-[9px] font-black px-2.5 py-1.5 rounded-md uppercase tracking-widest transition-all ${
                action.primary 
                  ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' 
                  : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

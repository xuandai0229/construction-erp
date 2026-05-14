
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
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '🚨',
    success: '✅'
  };

  return (
    <div className={`p-4 rounded-xl border ${styles[severity]} flex flex-col md:flex-row gap-4 items-start md:items-center animate-in slide-in-from-top-4 duration-500`}>
      <div className="flex gap-3 flex-1">
        <span className="text-xl shrink-0">{icons[severity]}</span>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-tight">{title}</h4>
          <p className="text-xs mt-0.5 opacity-90 leading-relaxed font-medium">{message}</p>
        </div>
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex gap-2 shrink-0">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`text-[11px] font-black px-4 py-2 rounded-lg uppercase tracking-widest transition-all ${
                action.primary 
                  ? 'bg-current text-white invert shadow-lg' 
                  : 'bg-transparent border border-current opacity-80 hover:opacity-100'
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

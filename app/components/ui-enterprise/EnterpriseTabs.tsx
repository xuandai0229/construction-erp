"use client";

import React from "react";

export interface Tab {
  id: string;
  label: string;
}

interface EnterpriseTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function EnterpriseTabs({ tabs, activeTab, onTabChange, className = "" }: EnterpriseTabsProps) {
  return (
    <div className={`flex border-b border-[var(--border)] overflow-x-auto scrollbar-hide ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              isActive 
                ? "border-blue-500 text-[var(--text-accent)]" 
                : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--secondary)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

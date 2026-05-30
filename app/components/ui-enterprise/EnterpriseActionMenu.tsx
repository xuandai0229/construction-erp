'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}

interface EnterpriseActionMenuProps {
  actions: ActionMenuItem[];
  align?: 'left' | 'right';
}

export function EnterpriseActionMenu({ actions, align = 'right' }: EnterpriseActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-center h-8 w-8 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
        title="Thao tác"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-1 w-44 rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg z-50 py-1 focus:outline-none animate-fade-in`}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors duration-150 cursor-pointer ${
                action.variant === 'danger'
                  ? 'text-rose-500 hover:bg-rose-500/10'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {action.icon && <span className="shrink-0">{action.icon}</span>}
              <span className="font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

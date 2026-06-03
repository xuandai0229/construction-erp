'use client';

import React, { useEffect, useRef, useState } from 'react';
import PortalOverlay from '@/app/components/shared/PortalOverlay';

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
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative inline-flex justify-center text-left">
      <button
        ref={buttonRef}
        onClick={(event) => {
          event.stopPropagation();
          setAnchorElement(event.currentTarget);
          setIsOpen((open) => !open);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] shadow-sm transition-all hover:bg-[var(--muted)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        title="Thao tác"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      <PortalOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorElement={anchorElement}
        align={align}
        width={192}
        zIndex={500}
        className="py-1"
      >
        <div
          role="menu"
          onClick={(event) => event.stopPropagation()}
          className="max-h-[min(320px,calc(100vh-48px))] overflow-y-auto py-1 focus:outline-none scrollbar-thin"
        >
          {actions.map((action, index) => (
            <button
              key={`${action.label}-${index}`}
              role="menuitem"
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors duration-150 ${
                action.variant === 'danger'
                  ? 'text-rose-500 hover:bg-rose-500/10'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {action.icon && <span className="shrink-0">{action.icon}</span>}
              <span className="truncate font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      </PortalOverlay>
    </div>
  );
}

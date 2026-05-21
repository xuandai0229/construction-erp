'use client';

import React, { useEffect, useRef, useState } from 'react';
import Portal from './Portal';
import { Z_INDEX, ELEVATION_SHADOWS } from '@/lib/zindex-constants';

export interface ActionMenuOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isDangerous?: boolean;
  onClick: () => void;
  divider?: boolean;
}

interface ActionMenuProps {
  isOpen: boolean;
  options: ActionMenuOption[];
  onClose: () => void;
  triggerX?: number;
  triggerY?: number;
  triggerWidth?: number;
  triggerHeight?: number;
}

/**
 * Enterprise Action Menu Component
 * 
 * Features:
 * - Portal rendering to document.body
 * - Viewport collision detection with auto-flip
 * - Proper z-indexing (Layer 500)
 * - Keyboard navigation
 * - Click-outside close
 * - Smooth animations
 */
export function ActionMenu({
  isOpen,
  options,
  onClose,
  triggerX = 0,
  triggerY = 0,
  triggerWidth = 0,
  triggerHeight = 0,
}: ActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Calculate position with viewport collision detection
  useEffect(() => {
    if (!isOpen) return;

    const menuHeight = Math.min(options.length * 36 + 16, 400);
    const menuWidth = 200;

    let top = triggerY + triggerHeight + 8;
    let left = triggerX;
    let flipped = false;

    // Check if menu would exceed bottom
    if (top + menuHeight > window.innerHeight - 16) {
      top = triggerY - menuHeight - 8;
      flipped = true;
    }

    // Check if menu would exceed right - flip to left
    if (left + menuWidth > window.innerWidth - 16) {
      left = triggerX + triggerWidth - menuWidth;
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, window.innerWidth - menuWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - menuHeight - 16));

    setPosition({ top, left });
    setIsFlipped(flipped);
  }, [isOpen, options.length, triggerX, triggerY, triggerWidth, triggerHeight]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          options[highlightedIndex]?.onClick();
          onClose();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, options, highlightedIndex, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: Z_INDEX.ACTION_MENU,
          width: '200px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          boxShadow: ELEVATION_SHADOWS.DROPDOWN,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: `dropdownEnter 100ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {options.map((option, index) => (
          <div key={option.id}>
            {option.divider ? (
              <div style={{
                height: '1px',
                backgroundColor: 'var(--border)',
                margin: '4px 0',
              }} />
            ) : (
              <button
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  option.onClick();
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: highlightedIndex === index ? 'var(--bg-subtle)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 100ms',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: option.isDangerous ? 'var(--danger)' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {option.icon && (
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    {option.icon}
                  </div>
                )}
                <span>{option.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </Portal>
  );
}

export default ActionMenu;

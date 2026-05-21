'use client';

import React, { useEffect, useRef, useState } from 'react';
import Portal from './Portal';
import { Z_INDEX, ELEVATION_SHADOWS } from '@/lib/zindex-constants';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  count?: number;
  color?: string;
}

interface EnterpriseDropdownProps {
  isOpen: boolean;
  options: DropdownOption[];
  value?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  trigger?: React.ReactNode;
  searchable?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

/**
 * Enterprise Dropdown Component
 * 
 * Features:
 * - Portal rendering to prevent overflow clipping
 * - Auto-positioning with viewport collision detection
 * - Smooth animations
 * - Keyboard navigation (Arrow keys, Enter, Esc)
 * - Click-outside close
 * - Searchable interface
 * - Proper stacking context (z-index 300)
 */
export function EnterpriseDropdown({
  isOpen,
  options,
  value,
  onSelect,
  onClose,
  trigger,
  searchable = false,
  placeholder = 'Select...',
  className = '',
  triggerClassName = '',
}: EnterpriseDropdownProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Calculate position and detect edge collisions
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuHeight = Math.min(filteredOptions.length * 40 + (searchable ? 50 : 0), 400);
    const menuWidth = Math.max(triggerRect.width, 240);

    let top = triggerRect.bottom + 8;
    let left = triggerRect.left;
    let flipped = false;

    // Check if menu would exceed bottom of viewport
    if (top + menuHeight > window.innerHeight - 16) {
      top = triggerRect.top - menuHeight - 8;
      flipped = true;
    }

    // Check if menu would exceed right of viewport
    if (left + menuWidth > window.innerWidth - 16) {
      left = triggerRect.right - menuWidth;
    }

    // Clamp to viewport edges
    left = Math.max(16, Math.min(left, window.innerWidth - menuWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - menuHeight - 16));

    setPosition({ top, left });
    setIsFlipped(flipped);
  }, [isOpen, filteredOptions.length, searchable]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            onSelect(filteredOptions[highlightedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredOptions, highlightedIndex, onSelect, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Trigger - stays in normal flow */}
      <div ref={triggerRef} className={triggerClassName}>
        {trigger}
      </div>

      {/* Menu - rendered via portal */}
      <Portal>
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: Z_INDEX.DROPDOWN,
            minWidth: '240px',
            maxWidth: '400px',
            maxHeight: '400px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            boxShadow: ELEVATION_SHADOWS.DROPDOWN,
            display: 'flex',
            flexDirection: 'column',
            animation: `dropdownEnter 150ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
          className={className}
        >
          {/* Search box */}
          {searchable && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                }}
                onKeyDown={e => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{
                padding: '16px 12px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}>
                No options
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => onSelect(option.value)}
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
                  }}
                >
                  {option.icon && (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      {option.icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: value === option.value ? 'var(--brand)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                      }}>
                        {option.description}
                      </div>
                    )}
                  </div>
                  {option.count !== undefined && (
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-muted)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}>
                      {option.count}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </Portal>
    </>
  );
}

export default EnterpriseDropdown;

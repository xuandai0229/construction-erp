'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRect?: DOMRect | null; // Deprecated: Use anchorElement instead
  anchorElement?: HTMLElement | null;
  children: ReactNode;
  width?: number;
  align?: 'left' | 'right';
  className?: string;
  zIndex?: number;
}

export default function PortalOverlay({
  isOpen,
  onClose,
  triggerRect,
  anchorElement,
  children,
  width = 200,
  align = 'left',
  className = '',
  zIndex = 300, // Default to dropdown layer
}: PortalOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, transformOrigin: 'top left' });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const calculatePosition = () => {
      // Use dynamic element if provided, otherwise fallback to static rect
      const rect = anchorElement ? anchorElement.getBoundingClientRect() : triggerRect;
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Use fixed positioning relative to viewport to avoid scrolling bugs
      let top = rect.bottom + 4; // 4px gap
      let left = align === 'left' 
        ? rect.left 
        : rect.right - width;

      let originY = 'top';
      let originX = align;

      // Dropdown height approximation (max 320px)
      const approxHeight = 320;

      // Viewport collision / Edge detection & flipping
      if (top + approxHeight > viewportHeight && rect.top > approxHeight) {
        // Not enough space below, flip up
        top = rect.top - approxHeight - 4;
        originY = 'bottom';
      }

      if (left + width > viewportWidth) {
        // Overflow right, align right
        left = rect.right - width;
        originX = 'right';
      }

      if (left < 0) {
        // Overflow left, align left
        left = rect.left;
        originX = 'left';
      }

      setCoords({
        top,
        left,
        transformOrigin: `${originY} ${originX}`,
      });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isOpen, triggerRect, anchorElement, align, width]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        // Do not close if clicking on the trigger element itself
        if (anchorElement && anchorElement.contains(e.target as Node)) {
          return;
        }
        onClose();
      }
    };

    // Use capturing phase to handle the click early
    // Need a slight delay to avoid closing immediately on trigger click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleOutsideClick, true);
    };
  }, [isOpen, onClose]);

  // Esc key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || (!triggerRect && !anchorElement)) return null;

  return createPortal(
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width,
        transformOrigin: coords.transformOrigin,
        zIndex, // Controlled by Enterprise Architecture layers
      }}
      className={`bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-scale-up pointer-events-auto ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}

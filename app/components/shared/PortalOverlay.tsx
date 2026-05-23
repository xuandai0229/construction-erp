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
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; transformOrigin: string } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    const calculatePosition = () => {
      // Use dynamic element if provided, otherwise fallback to static rect
      const rect = anchorElement ? anchorElement.getBoundingClientRect() : triggerRect;
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Use fixed positioning relative to viewport to avoid scrolling bugs
      let top: number | undefined = rect.bottom + 4; // 4px gap
      let bottom: number | undefined = undefined;
      let left = align === 'left' 
        ? rect.left 
        : rect.right - width;

      let originY = 'top';
      let originX = align;

      // Dropdown height approximation for threshold checks
      const approxHeight = 160;

      // Viewport collision / Edge detection & flipping
      if (top + approxHeight > viewportHeight && rect.top > approxHeight) {
        // Not enough space below, flip up and anchor bottom edge to the top of trigger button
        top = undefined;
        bottom = viewportHeight - rect.top + 4;
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
        bottom,
        left,
        transformOrigin: `${originY} ${originX}`,
      });
    };

    const handleScroll = (e: Event) => {
      // Don't close if scrolling inside the overlay itself
      if (overlayRef.current && overlayRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, triggerRect, anchorElement, align, width, onClose]);

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
  }, [isOpen, onClose, anchorElement]);

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

  if (!isOpen || !mounted || !coords) return null;

  return createPortal(
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: coords.top !== undefined ? `${coords.top}px` : 'auto',
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
        left: `${coords.left}px`,
        width: `${width}px`,
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

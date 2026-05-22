'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRect: DOMRect | null;
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
    if (!isOpen || !triggerRect) return;

    const calculatePosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = triggerRect.bottom + scrollY + 4; // 4px gap
      let left = align === 'left' 
        ? triggerRect.left + scrollX 
        : triggerRect.right + scrollX - width;

      let originY = 'top';
      let originX = align;

      // Dropdown height approximation (max 320px)
      const approxHeight = 320;

      // Viewport collision / Edge detection & flipping
      if (top + approxHeight - scrollY > viewportHeight && triggerRect.top > approxHeight) {
        // Not enough space below, flip up
        top = triggerRect.top + scrollY - approxHeight - 4;
        originY = 'bottom';
      }

      if (left + width - scrollX > viewportWidth) {
        // Overflow right, align right
        left = triggerRect.right + scrollX - width;
        originX = 'right';
      }

      if (left < scrollX) {
        // Overflow left, align left
        left = triggerRect.left + scrollX;
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
  }, [isOpen, triggerRect, align, width]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        // Only close if click is not inside the trigger button
        // We assume the caller handles button clicks natively
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

  if (!isOpen || !mounted || !triggerRect) return null;

  return createPortal(
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        width,
        transformOrigin: coords.transformOrigin,
        zIndex, // Controlled by Enterprise Architecture layers
      }}
      className={`bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-scale-up ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}

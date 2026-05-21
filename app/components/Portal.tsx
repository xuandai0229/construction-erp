'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: Element | null;
}

/**
 * Enterprise Portal Component
 * 
 * Renders children directly to document.body (or specified container)
 * This prevents stacking context issues from overflow:auto/hidden containers
 * 
 * Usage:
 * <Portal>
 *   <Dropdown />
 * </Portal>
 */
export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = container || (typeof document !== 'undefined' ? document.body : null);
  
  if (!target) return null;

  return createPortal(children, target);
}

export default Portal;

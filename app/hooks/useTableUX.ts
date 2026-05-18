'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

export function useTableUX() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false); // Track if mouse actually moved (drag vs click)
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Check if scrollable
  const checkScrollable = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const canScroll = el.scrollWidth > el.clientWidth + 4;
      const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
      setIsScrollable(canScroll);
      setShowScrollHint(canScroll && !isAtEnd);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollable();

    const observer = new ResizeObserver(checkScrollable);
    observer.observe(el);
    window.addEventListener('resize', checkScrollable);
    el.addEventListener('scroll', checkScrollable);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkScrollable);
      el.removeEventListener('scroll', checkScrollable);
    };
  }, [checkScrollable]);

  // Shift + Wheel handling
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Drag to scroll: use refs to avoid stale closure, use native events for precision
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      // Only proceed if table is scrollable horizontally
      if (el.scrollWidth <= el.clientWidth + 4) return;
      // Skip interactive elements
      if ((e.target as HTMLElement).closest('button, a, input, select, [role="button"]')) return;
      // Only left mouse button
      if (e.button !== 0) return;

      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      startXRef.current = e.pageX - el.getBoundingClientRect().left;
      scrollLeftRef.current = el.scrollLeft;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const x = e.pageX - el.getBoundingClientRect().left;
      const walk = (x - startXRef.current) * 1.2;

      // Only commit to drag if moved more than 4px (prevents accidental drags on clicks)
      if (Math.abs(walk) > 4) {
        hasDraggedRef.current = true;
        e.preventDefault();
        el.scrollLeft = scrollLeftRef.current - walk;
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      el.style.removeProperty('cursor');
      el.style.removeProperty('user-select');
    };

    const onClickCapture = (e: MouseEvent) => {
      if (hasDraggedRef.current) {
        e.stopPropagation();
        e.preventDefault();
        hasDraggedRef.current = false;
      }
    };

    const onMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        el.style.removeProperty('cursor');
        el.style.removeProperty('user-select');
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return {
    scrollContainerRef,
    showScrollHint,
    // cursor is managed imperatively via refs — no style prop needed
    dragCursorClass: isScrollable ? 'cursor-grab active:cursor-grabbing select-none touch-none' : '',
  };
}

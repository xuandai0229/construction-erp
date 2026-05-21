'use client';

import { useEffect, useMemo, useState } from "react";
import { Z_INDEX } from '@/lib/zindex-constants';

type OverlayType = 'dropdown' | 'action_menu' | 'modal' | 'date_picker';

type OverlayDebugReport = {
  overlayType: OverlayType;
  componentName: string;
  domNode: string; // selector-ish
  parentNode: string;
  portalRoot: string;
  position: { top: number; left: number; width: number; height: number };
  computed: {
    zIndex: string;
    position: string;
  };
  overflow: {
    overflowX: string;
    overflowY: string;
    overflowClip?: boolean;
  };
  nearestStackingContext: string;
  coveringElement?: {
    selector: string;
    zIndex: string;
    position: string;
  };
  timestamp: number;
};

const OVERLAY_ATTR = {
  dropdown: 'data-overlay-dropdown',
  action_menu: 'data-overlay-action-menu',
  modal: 'data-overlay-modal',
  date_picker: 'data-overlay-date-picker',
} as const;

function safeGetComputed(el: Element | null) {
  if (!el) return { zIndex: 'auto', position: 'static' };
  const cs = window.getComputedStyle(el as Element);
  return {
    zIndex: cs.zIndex,
    position: cs.position,
  };
}

function getNearestStackingContext(el: Element | null) {
  if (!el) return '';
  const candidates = [
    'transform',
    'filter',
    'backdrop-filter',
    'opacity',
    'will-change',
    'contain',
    'isolation',
  ];

  let cur: Element | null = el;
  while (cur && cur !== document.documentElement) {
    const cs = window.getComputedStyle(cur);
    for (const prop of candidates) {
      const v = (cs as any)[prop] as string;
      if (v && v !== 'none' && v !== 'auto') {
        // opacity: special case ("1" is fine)
        if (prop === 'opacity') {
          const num = Number(v);
          if (!Number.isNaN(num) && num !== 1) return `${cur.tagName.toLowerCase()}[${prop}=${v}]`;
        } else {
          return `${cur.tagName.toLowerCase()}[${prop}=${v}]`;
        }
      }
    }

    // z-index only matters on positioned elements / flex/grid
    if (cs.position && cs.position !== 'static') {
      if (cs.zIndex && cs.zIndex !== 'auto') return `${cur.tagName.toLowerCase()}[position=${cs.position},zIndex=${cs.zIndex}]`;
    }

    cur = cur.parentElement;
  }

  return `${el.tagName.toLowerCase()}[root]`;
}

function getOverflowOnAncestors(el: Element | null) {
  if (!el) {
    return { overflowX: 'unknown', overflowY: 'unknown' };
  }

  let cur: Element | null = el;
  while (cur && cur !== document.documentElement) {
    const cs = window.getComputedStyle(cur);
    const overflowX = cs.overflowX;
    const overflowY = cs.overflowY;

    const isClipping =
      overflowX === 'hidden' ||
      overflowY === 'hidden' ||
      overflowX === 'clip' ||
      overflowY === 'clip' ||
      (overflowX === 'auto' || overflowY === 'auto' || overflowX === 'scroll' || overflowY === 'scroll');

    if (isClipping) {
      return {
        overflowX,
        overflowY,
        overflowClip: overflowX === 'clip' || overflowY === 'clip',
      };
    }
    cur = cur.parentElement;
  }

  return { overflowX: 'visible', overflowY: 'visible' };
}

function elementSelector(el: Element) {
  const id = el.getAttribute('id');
  if (id) return `#${id}`;
  const cls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3) : [];
  const tag = el.tagName.toLowerCase();
  const c = cls.length ? `.${cls.join('.')}` : '';
  return `${tag}${c}`;
}

function findCoveringElementAtCenter(target: Element) {
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  if (!rect.width || !rect.height) return undefined;

  const topEl = document.elementFromPoint(cx, cy);
  if (!topEl) return undefined;
  if (topEl === target || target.contains(topEl)) return undefined;

  const { zIndex, position } = safeGetComputed(topEl);
  return {
    selector: elementSelector(topEl),
    zIndex,
    position,
  };
}

export default function OverlayInspector() { /* TODO */
  const enabled = useMemo(() => {
    // Dev-only: enable when explicitly mounted.
    // You can turn it on by rendering this component from a dev route/layout.
    return true;
  }, []);

  const [reports, setReports] = useState<OverlayDebugReport[]>([]);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const snapshot = (overlayType: OverlayType) => {
      const attr = (OVERLAY_ATTR as any)[overlayType] as string;
      const nodes = document.querySelectorAll(`[${attr}]`);
      if (!nodes.length) return;

      // Prefer the top-most by bounding rect area & DOM order
      const arr = Array.from(nodes) as HTMLElement[];
      const pick = arr
        .map((n) => {
          const r = n.getBoundingClientRect();
          return { n, area: r.width * r.height, z: Number(window.getComputedStyle(n).zIndex) || 0 };
        })
        .sort((a, b) => b.area - a.area || b.z - a.z)[0]?.n;

      if (!pick) return;

      const rect = pick.getBoundingClientRect();
      const parent = pick.parentElement;

      const { zIndex, position } = safeGetComputed(pick);
      const overflow = getOverflowOnAncestors(pick);
      const nearestStackingContext = getNearestStackingContext(pick);

      const portalRoot = pick.closest('body') ? 'document.body' : pick.closest('html') ? 'document.documentElement' : 'unknown';

      const coveringElement = findCoveringElementAtCenter(pick);

      const report: OverlayDebugReport = {
        overlayType,
        componentName: pick.getAttribute('data-overlay-component') || 'unknown',
        domNode: elementSelector(pick),
        parentNode: parent ? elementSelector(parent) : 'none',
        portalRoot,
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        computed: { zIndex, position },
        overflow,
        nearestStackingContext,
        coveringElement,
        timestamp: Date.now(),
      };

      setReports((prev) => {
        const next = [report, ...prev].slice(0, 30);
        return next;
      });
      setLastSnapshotAt(Date.now());

      // Auto-log (console)
      // eslint-disable-next-line no-console
      console.log('[OverlayInspector] Overlay Debug Report:', report);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.altKey || e.ctrlKey) || e.key.toLowerCase() !== 'd') return;

      // Snapshot all overlay types
      snapshot('dropdown');
      snapshot('action_menu');
      snapshot('modal');
      snapshot('date_picker');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        width: 420,
        maxHeight: 380,
        overflow: 'auto',
        zIndex: Z_INDEX.SYSTEM_ALERT,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>Overlay Inspector (DEV)</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Press <b>Alt</b>+<b>D</b> (or <b>Ctrl</b>+<b>D</b>) after opening overlays.
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'flex-start' }}>
          {lastSnapshotAt ? new Date(lastSnapshotAt).toLocaleTimeString('vi-VN') : '—'}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        {reports.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No overlay snapshots yet.</div>
        ) : (
          reports.map((r, idx) => (
            <div key={r.timestamp + ':' + idx} style={{ marginBottom: 12, border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {r.overlayType.toUpperCase()} · {r.componentName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.timestamp).toLocaleTimeString('vi-VN')}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                <div><b>DOM:</b> {r.domNode}</div>
                <div><b>Portal:</b> {r.portalRoot}</div>
                <div><b>Computed:</b> {r.computed.position} / zIndex={r.computed.zIndex}</div>
                <div><b>Overflow:</b> x={r.overflow.overflowX}, y={r.overflow.overflowY}</div>
                <div><b>Nearest stacking:</b> {r.nearestStackingContext}</div>
              </div>
              {r.coveringElement && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6 }}>
                  <b>Covering element:</b> {r.coveringElement.selector} (zIndex={r.coveringElement.zIndex}, position={r.coveringElement.position})
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


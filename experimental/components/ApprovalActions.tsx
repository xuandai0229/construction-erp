'use client';

import React, { useState } from 'react';

interface ApprovalActionsProps {
  id: string;
  entity: string;
  status: string;
  onUpdate: () => void;
}

function IconPath({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function ApprovalActions({ id, entity, status, onUpdate }: ApprovalActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (newStatus: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      // Use the appropriate API based on entity
      const endpoint = entity === 'Invoice' ? `/api/invoices/${id}/approve` : `/api/costs/${id}/approve`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) onUpdate();
      else throw new Error('Failed to update status');
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[11px] font-bold uppercase tracking-tighter">
      <IconPath path="M20 6L9 17l-5-5" />
      Đã duyệt
    </span>
  );

  if (status === 'REJECTED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[11px] font-bold uppercase tracking-tighter">
      <IconPath path="M18 6L6 18M6 6l12 12" />
      Từ chối
    </span>
  );

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleAction('APPROVED')}
        disabled={loading}
        className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
        title="Duyệt nhanh"
      >
        <IconPath path="M20 6L9 17l-5-5" />
      </button>
      <button
        onClick={() => handleAction('REJECTED')}
        disabled={loading}
        className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
        title="Từ chối"
      >
        <IconPath path="M18 6L6 18M6 6l12 12" />
      </button>
    </div>
  );
}

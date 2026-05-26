import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'archive' | 'close';
  businessContext?: string;
  requireReason?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'danger',
  businessContext,
  requireReason = false
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const variantStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
    info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
    archive: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
    close: 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-600/20'
  };

  const iconStyles = {
    danger: 'text-rose-600 bg-rose-500/10',
    warning: 'text-amber-600 bg-amber-500/10',
    info: 'text-blue-600 bg-blue-500/10',
    archive: 'text-amber-500 bg-amber-500/10',
    close: 'text-slate-600 bg-slate-500/10'
  };

  const modalContent = (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 overflow-hidden pointer-events-none">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500 pointer-events-auto" onClick={onClose} />
      
      <div className="relative w-full max-w-[420px] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 pointer-events-auto">
        {/* Governance Header */}
        <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-rose-600' : 'bg-amber-500'}`} />
        
        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconStyles[variant]} shadow-inner`}>
              {variant === 'danger' && (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {(variant === 'warning' || variant === 'archive') && (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              )}
              {variant === 'info' && (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {variant === 'close' && (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-[17px] font-black text-[var(--text-primary)] leading-tight tracking-tight">{title}</h3>
              <p className="mt-2.5 text-[13px] font-bold text-[var(--text-secondary)] leading-relaxed">{message}</p>
              
              {businessContext && (
                <div className="mt-4 p-4 rounded-xl bg-[var(--secondary)] border border-[var(--border)] relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${variant === 'danger' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 opacity-50">Quy tắc nghiệp vụ ERP</div>
                  <div className="text-[11.5px] font-bold text-[var(--text-primary)] leading-snug">{businessContext}</div>
                </div>
              )}

              {requireReason && (
                <div className="mt-4">
                  <label className="erp-label !text-[10px]">Lý do thực hiện (Bắt buộc cho Kiểm toán)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập lý do chi tiết..."
                    className="erp-input h-auto py-2 !text-[12px] min-h-[60px] resize-none"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-5 bg-[var(--secondary)]/30 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-[11px] font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-all disabled:opacity-30"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(requireReason ? reason : undefined)}
            disabled={isLoading || (requireReason && reason.trim().length < 5)}
            className={`px-7 py-2.5 text-[11px] font-black rounded-xl uppercase tracking-[0.15em] shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 ${variantStyles[variant]}`}
          >
            {isLoading && (
              <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

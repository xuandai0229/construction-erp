
'use client';

import React from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  isRead: boolean;
  createdAt: string | Date;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
}

export default function NotificationCenter({ notifications, onRead, onReadAll }: NotificationCenterProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🔴';
      case 'ERROR': return '🟠';
      case 'WARNING': return '🟡';
      default: return '🔵';
    }
  };

  return (
    <div className="w-80 bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card)] sticky top-0">
        <h3 className="font-black text-[var(--text-primary)] text-[11px] uppercase tracking-widest">Thông báo</h3>
        <button
          onClick={onReadAll}
          className="text-[10px] text-blue-600 hover:underline font-black uppercase tracking-widest"
        >
          Đọc tất cả
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border)] scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">
            Không có thông báo mới
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 erp-table-row cursor-pointer relative ${!notif.isRead ? 'bg-blue-500/5' : ''}`}
              onClick={() => onRead(notif.id)}
            >
              {!notif.isRead && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
              <div className="flex gap-3">
                <span className="text-lg">{getSeverityIcon(notif.severity)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-[11px] font-black text-[var(--text-primary)] ${!notif.isRead ? 'pr-4' : ''} leading-tight`}>
                    {notif.title}
                  </h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed font-bold">
                    {notif.message}
                  </p>
                  <span className="text-[9px] text-[var(--text-muted)] mt-2 block font-bold tabular-nums">
                    {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-[var(--secondary)] border-t border-[var(--border)] text-center">
        <button className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-colors">
          Xem lịch sử thông báo
        </button>
      </div>
    </div>
  );
}

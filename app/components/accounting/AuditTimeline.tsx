'use client';

import React from 'react';

interface AuditLogEntry {
  id?: string;
  action: string;
  userId?: string;
  createdAt: string | Date;
  details?: string;
  newData?: any;
  user?: {
    email: string;
  };
}

interface AuditTimelineProps {
  logs: AuditLogEntry[];
  className?: string;
}

export default function AuditTimeline({ logs, className = "" }: AuditTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-[var(--text-tertiary)] bg-[var(--card)] border border-[var(--border)] rounded-lg">
        Chưa ghi nhận lịch sử kiểm toán (Audit Trail) nào.
      </div>
    );
  }

  return (
    <div className={`space-y-4 select-none ${className}`}>
      <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Lịch sử tác động (Audit Trail)</h4>
      <div className="relative border-l border-[var(--border)] ml-3 pl-4 space-y-4 py-2">
        {logs.map((log, idx) => {
          const email = log.user?.email || log.userId || "Hệ thống";
          const date = new Date(log.createdAt).toLocaleString("vi-VN");

          let badgeVariant = "bg-gray-500/10 text-gray-400";
          if (log.action === "CREATE") badgeVariant = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
          else if (log.action === "SUBMIT") badgeVariant = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
          else if (log.action === "APPROVE") badgeVariant = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
          else if (log.action === "POST") badgeVariant = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
          else if (log.action === "REVERSE") badgeVariant = "bg-rose-500/10 text-rose-400 border border-rose-500/20";

          return (
            <div key={log.id || idx} className="relative">
              {/* Bullet node */}
              <div className="absolute -left-[21.5px] top-1.5 h-3 w-3 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
              </div>

              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${badgeVariant}`}>
                    {log.action}
                  </span>
                  <span className="text-[10px] font-extrabold text-[var(--text-primary)]">{email}</span>
                  <span className="text-[9px] text-[var(--text-tertiary)] font-mono tabular-nums">{date}</span>
                </div>
                {log.details && (
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pl-1">
                    {log.details}
                  </p>
                )}
                {log.newData?.reason && (
                  <p className="text-[11px] text-rose-400 font-bold leading-relaxed pl-1">
                    Lý do: {log.newData.reason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

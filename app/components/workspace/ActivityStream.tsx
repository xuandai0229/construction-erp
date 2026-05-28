
'use client';

import React from 'react';

interface Activity {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string | Date;
  user: { name: string | null };
}

export default function ActivityStream({ activities }: { activities: any[] }) {
  return (
    <section className="erp-card p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl h-full">
      <div className="mb-5 flex items-center justify-between">
        <div className="accent-line border-l-4 border-slate-500 pl-4">
          <h3 className="text-[10px] font-black text-[var(--text-primary)] tracking-widest uppercase">LỊCH SỬ HOẠT ĐỘNG</h3>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[350px] overflow-y-auto scrollbar-hide px-1">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-[10px] italic font-bold uppercase tracking-widest">
            Hệ thống đang đồng bộ...
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="flex gap-4 group cursor-default">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[var(--border)] group-hover:bg-blue-400 transition-colors mt-1.5 shadow-sm" />
                <div className="w-px flex-1 bg-[var(--divider)] mt-1" />
              </div>
              <div className="pb-5 flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                    {act.action} • {act.entityType}
                  </span>
                  <span className="text-[9px] font-bold text-[var(--text-tertiary)] tabular-nums">
                    {new Date(act.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-primary)] leading-snug font-black group-hover:text-blue-500 transition-colors truncate">
                   {act.action} bởi <span className="text-[var(--text-secondary)]">{act.User?.name || 'Hệ thống'}</span>
                </p>
                <div className="mt-1 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                  {new Date(act.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

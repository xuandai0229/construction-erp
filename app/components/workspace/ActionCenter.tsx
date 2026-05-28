
'use client';

import React, { useState } from 'react';
import { formatVnd } from '../dashboard-data';

export interface ActionTask {
  id: string;
  type: "APPROVAL" | "OVERDUE" | "RISK" | "GOVERNANCE" | "RECONCILIATION";
  title: string;
  description: string;
  priority: number;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  entityType: string;
  entityId: string;
  createdAt: string | Date;
  metadata?: any;
}

interface ActionCenterProps {
  tasks: ActionTask[];
  onAction: (taskId: string, action: string) => void;
}

export default function ActionCenter({ tasks, onAction }: ActionCenterProps) {
  const [showAll, setShowAll] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-100';
      case 'ERROR': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'WARNING': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'APPROVAL': return 'Phê duyệt';
      case 'OVERDUE': return 'Quá hạn';
      case 'RISK': return 'Rủi ro';
      case 'GOVERNANCE': return 'Quản trị';
      default: return 'Hệ thống';
    }
  };

  const visibleTasks = showAll ? tasks : tasks.slice(0, 3);


  return (
    <div className="erp-card overflow-hidden flex flex-col h-full border border-[var(--border)] bg-[var(--card)]">
      <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--secondary)]">
        <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
          <div className="w-1 h-3 bg-blue-600 rounded-full" />
          NGHIỆP VỤ CẦN XỬ LÝ
        </h2>
        <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-600/10 text-blue-600 rounded-md border border-blue-600/20">
          {tasks.length} cảnh báo
        </span>
      </div>

      <div className="divide-y divide-[var(--border)] max-h-[420px] overflow-y-auto scrollbar-hide flex-1">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-[10px] italic font-bold uppercase tracking-widest">
            Hoàn tất xử lý cảnh báo
          </div>
        ) : (
          visibleTasks.map((task) => (
            <div key={task.id} className="p-3 transition-colors hover:bg-[var(--table-row-hover)] group cursor-pointer border-b border-[var(--border)] last:border-0">
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${task.severity === 'CRITICAL' ? 'bg-rose-500' :
                    task.severity === 'ERROR' ? 'bg-orange-500' :
                      task.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">
                      {getTypeLabel(task.type)}
                    </span>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] tabular-nums">
                      {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="text-[11px] font-bold text-[var(--text-primary)] leading-snug group-hover:text-blue-500 transition-colors truncate">
                    {task.title}
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-1 leading-tight font-medium">
                    {task.description}
                  </p>

                  <div className="mt-2.5 flex gap-3">
                    <button
                      onClick={() => onAction(task.id, 'PROCESS')}
                      className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest border-b border-blue-600/30 pb-0.5"
                    >
                      Tiến hành xử lý
                    </button>
                    <button
                      onClick={() => onAction(task.id, 'DISMISS')}
                      className="text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-secondary)] uppercase tracking-widest border-b border-transparent pb-0.5"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {tasks.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2.5 bg-[var(--secondary)] border-t border-[var(--border)] text-[9px] font-black text-[var(--text-secondary)] hover:text-blue-600 hover:bg-[var(--accent)] uppercase tracking-widest transition-all"
        >
          {showAll ? 'Thu gọn danh sách' : `Xem tất cả ${tasks.length} cảnh báo`}
        </button>
      )}
    </div>
  );
}

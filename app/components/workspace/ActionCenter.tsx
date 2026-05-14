
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
        <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-3.5 bg-blue-600 rounded-full"></span>
          Trung tâm điều phối (Actions)
        </h2>
        <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-600/10 text-blue-600 rounded-md border border-blue-600/20">
          {tasks.length}
        </span>
      </div>
      
      <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto scrollbar-hide">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-[11px] italic font-medium">
            Tất cả công việc đã được xử lý.
          </div>
        ) : (
          visibleTasks.map((task) => (
            <div key={task.id} className="p-3 hover:bg-gray-50 transition-colors group">
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                  task.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 
                  task.severity === 'ERROR' ? 'bg-orange-500' : 
                  task.severity === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className={`text-[8px] font-black uppercase tracking-tighter px-1 rounded border ${getSeverityColor(task.severity)}`}>
                      {getTypeLabel(task.type)}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400">
                      {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  <h3 className="text-[11px] font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors truncate">
                    {task.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 leading-tight">
                    {task.description}
                  </p>
                  
                  <div className="mt-2 flex gap-2">
                    <button 
                      onClick={() => onAction(task.id, 'PROCESS')}
                      className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                    >
                      Xử lý
                    </button>
                    <button 
                      onClick={() => onAction(task.id, 'DISMISS')}
                      className="text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
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
          className="w-full py-2 bg-gray-50/50 border-t border-gray-100 text-[9px] font-black text-gray-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
        >
          {showAll ? 'Thu gọn danh sách' : `Xem tất cả ${tasks.length} công việc`}
        </button>
      )}
    </div>
  );
}

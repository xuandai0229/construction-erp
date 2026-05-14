
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
    <div className="w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
        <h3 className="font-bold text-gray-800">Thông báo</h3>
        <button 
          onClick={onReadAll}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Không có thông báo mới.
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
              onClick={() => onRead(notif.id)}
            >
              {!notif.isRead && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full" />
              )}
              <div className="flex gap-3">
                <span className="text-lg">{getSeverityIcon(notif.severity)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold text-gray-900 ${!notif.isRead ? 'pr-4' : ''}`}>
                    {notif.title}
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-2 block">
                    {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
        <button className="text-xs font-bold text-gray-500 hover:text-gray-700">
          Xem lịch sử thông báo
        </button>
      </div>
    </div>
  );
}

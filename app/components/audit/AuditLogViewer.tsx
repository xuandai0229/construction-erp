'use client';

import React, { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  userId: string | null;
  oldData: any;
  newData: any;
  user?: {
    name: string | null;
    email: string;
  };
}

function IconPath({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function AuditLogViewer({ entity, entityId }: { entity: string, entityId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/audit?entity=${entity}&entityId=${entityId}`);
        const json = await res.json();
        if (json.success) setLogs(json.data);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [entity, entityId]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  if (loading) return <div className="animate-pulse h-20 bg-slate-800 rounded-lg"></div>;
  if (logs.length === 0) return <div className="text-slate-500 text-sm italic py-4">Chưa có lịch sử thay đổi.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-slate-400">
        <IconPath path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <span className="text-sm font-medium uppercase tracking-wider">Lịch sử hoạt động</span>
      </div>
      
      <div className="space-y-2">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden transition-all hover:border-slate-700"
          >
            <div 
              className="p-3 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md ${
                  log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-500' :
                  log.action === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  <IconPath path="M22 12h-4l-3 9L9 3l-3 9H2" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">
                    {log.action} - {log.entity}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <IconPath path="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z" />
                    {log.user?.name || log.user?.email || 'Hệ thống'} • {formatDate(log.timestamp)}
                  </div>
                </div>
              </div>
              {expandedId === log.id ? 
                <IconPath path="m18 15-6-6-6 6" /> : 
                <IconPath path="m6 9 6 6 6-6" />
              }
            </div>

            {expandedId === log.id && (
              <div className="px-3 pb-3 pt-0 border-t border-slate-800/50 bg-slate-900/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                  <div>
                    <div className="text-slate-500 mb-1 font-medium">DỮ LIỆU CŨ</div>
                    <pre className="bg-black/30 p-2 rounded max-h-40 overflow-auto text-slate-400">
                      {log.oldData ? JSON.stringify(log.oldData, null, 2) : 'N/A'}
                    </pre>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1 font-medium">DỮ LIỆU MỚI</div>
                    <pre className="bg-black/30 p-2 rounded max-h-40 overflow-auto text-emerald-400/80">
                      {log.newData ? JSON.stringify(log.newData, null, 2) : 'N/A'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

interface InventoryStatusTimelineProps {
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'REVERSED';
  auditLogs?: any[];
}

export function InventoryStatusTimeline({ status, auditLogs = [] }: InventoryStatusTimelineProps) {
  const steps = [
    { label: 'NHÁP', value: 'DRAFT' },
    { label: 'CHỜ DUYỆT', value: 'SUBMITTED' },
    { label: 'ĐÃ DUYỆT', value: 'APPROVED' },
    { label: 'ĐÃ GHI SỔ', value: 'POSTED' }
  ];

  const getStepStatus = (stepVal: string) => {
    if (status === 'REVERSED') {
      return 'reversed';
    }
    const statusOrder = ['DRAFT', 'SUBMITTED', 'APPROVED', 'POSTED'];
    const currentIdx = statusOrder.indexOf(status);
    const stepIdx = statusOrder.indexOf(stepVal);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6 bg-[var(--secondary)]/40 p-6 rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">Tiến trình chứng từ</h4>
        {status === 'REVERSED' && (
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 uppercase">
            ĐÃ HỦY GHI SỔ
          </span>
        )}
      </div>

      <div className="flex items-center justify-between w-full relative pt-4 pb-2">
        <div className="absolute top-1/2 left-[5%] right-[5%] h-[2px] bg-[var(--border)] -translate-y-1/2 z-0" />

        {steps.map((step, idx) => {
          const stepStatus = getStepStatus(step.value);
          let dotColor = 'bg-[var(--secondary)] border-[var(--border)] text-[var(--text-muted)]';
          let textColor = 'text-[var(--text-muted)]';

          if (stepStatus === 'completed') {
            dotColor = 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]';
            textColor = 'text-blue-400 font-bold';
          } else if (stepStatus === 'active') {
            dotColor = 'bg-yellow-600 border-yellow-500 text-white shadow-[0_0_15px_rgba(202,138,4,0.4)]';
            textColor = 'text-yellow-500 font-black scale-105';
          } else if (stepStatus === 'reversed') {
            dotColor = 'bg-red-900 border-red-800 text-red-200 line-through';
            textColor = 'text-red-400 font-semibold';
          }

          return (
            <div key={idx} className="flex flex-col items-center z-10 w-[20%] text-center">
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all duration-300 ${dotColor}`}>
                {idx + 1}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider mt-3 transition-all duration-300 ${textColor}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {auditLogs && auditLogs.length > 0 && (
        <div className="pt-4 border-t border-[var(--border)]">
          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-3">Nhật ký tác vụ</span>
          <div className="space-y-2 max-h-[120px] overflow-y-auto scrollbar-thin">
            {auditLogs.map((log: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs text-[var(--text-secondary)] py-1 border-b border-[var(--border)]/40 last:border-0">
                <span className="font-semibold text-[var(--text-primary)]">{log.action} bởi {log.user?.name || log.userId}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useERPStore } from '@/store/erpStore';

interface IntegrityProps {
  analyticsData?: any;
  stats?: any;
}

export default function FinancialIntegrityDashboard({ analyticsData, stats }: IntegrityProps) {
  const currentProjectId = useERPStore(state => state.currentProjectId);

  // Derive mock/real data based on stats & analytics
  const lastSynced = new Date();
  const syncHealth = 'HEALTHY'; // HEALTHY, WARNING, CRITICAL
  const pendingCount = stats?.pendingApprovals || 0;
  const reversedCount = stats?.reversedTransactions || 0;
  const lockedPeriodWarnings = 0; // Number of attempts to write to a locked period

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <h3 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Kiểm Soát Tính Toàn Vẹn (Integrity)
        </h3>
        <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${syncHealth === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'}`}>
          {syncHealth === 'HEALTHY' ? 'SYNCED' : 'DESYNC'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[var(--secondary)]/50 rounded-lg border border-[var(--border)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Trạng Thái Đồng Bộ</div>
          <div className="text-[12px] font-black text-[var(--text-primary)] tabular-nums">
            {lastSynced.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[8.5px] font-bold text-[var(--text-tertiary)] mt-1">Hôm nay</div>
        </div>

        <div className="p-3 bg-[var(--secondary)]/50 rounded-lg border border-[var(--border)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Cảnh Báo Khóa Kỳ</div>
          <div className="text-[12px] font-black text-[var(--text-primary)] tabular-nums">
            {lockedPeriodWarnings}
          </div>
          <div className="text-[8.5px] font-bold text-[var(--text-tertiary)] mt-1">Bản ghi bị chặn</div>
        </div>

        <div className="p-3 bg-[var(--secondary)]/50 rounded-lg border border-[var(--border)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Chờ Phê Duyệt</div>
          <div className="text-[12px] font-black text-[var(--text-primary)] tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[8.5px] font-bold text-[var(--text-tertiary)] mt-1">Chứng từ</div>
        </div>

        <div className="p-3 bg-[var(--secondary)]/50 rounded-lg border border-[var(--border)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Đã Hoàn Bút Toán</div>
          <div className="text-[12px] font-black text-[var(--text-primary)] tabular-nums">
            {reversedCount}
          </div>
          <div className="text-[8.5px] font-bold text-[var(--text-tertiary)] mt-1">Giao dịch đảo</div>
        </div>
      </div>
      
      <div className="mt-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <div className="flex gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-[10px] font-bold text-[var(--text-primary)]">Sổ Cái Kế Toán (Ledger) Đã Khóa</div>
            <div className="text-[9px] text-[var(--text-secondary)] mt-1 leading-relaxed">
              Mọi thay đổi trên chứng từ đã duyệt sẽ sinh ra giao dịch đảo (Reversal) để đảm bảo tính toàn vẹn (Immutability).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

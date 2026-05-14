
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { useProjectStatsQuery } from '@/services/queries/useProjects';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { sidebarCollapsed, setCurrentProject } = useERPStore();
  const { data: stats, isLoading } = useProjectStatsQuery(id);

  useEffect(() => {
    setCurrentProject(id);
  }, [id, setCurrentProject]);

  if (isLoading) {
    return (
      <div className="erp-page">
        <Sidebar activeItem="projects" />
        <main className={`erp-page-main flex items-center justify-center ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="erp-page">
        <Sidebar activeItem="projects" />
        <main className={`erp-page-main flex flex-col items-center justify-center ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}>
          <h2 className="text-xl font-bold text-white mb-4">Không tìm thấy thông tin dự án</h2>
          <button onClick={() => router.push('/projects')} className="erp-btn bg-blue-600 text-white px-6">Quay lại danh sách</button>
        </main>
      </div>
    );
  }

  return (
    <div className="erp-page">
      <Sidebar activeItem="projects" />
      
      <main className={`erp-page-main transition-all duration-500 ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}>
        <Header />
        
        <div className="p-8 space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="accent-line border-l-4 border-blue-500 pl-4">
              <h1 className="text-2xl font-black text-[var(--text-primary)]">Chi tiết hồ sơ dự án</h1>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Quản lý chuyên sâu và phân tích tài chính</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="erp-btn bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              Xem Dashboard Dự án
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Info Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card-elevation p-8 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="erp-label">Giá trị Hợp đồng</label>
                    <div className="text-2xl font-black text-blue-500 tabular-nums">{formatVnd(stats.totalRevenue || 0)} <span className="text-[10px] text-[var(--text-muted)]">VNĐ</span></div>
                  </div>
                  <div>
                    <label className="erp-label">Tổng chi phí thực tế</label>
                    <div className="text-2xl font-black text-rose-500 tabular-nums">{formatVnd(stats.totalCost || 0)} <span className="text-[10px] text-[var(--text-muted)]">VNĐ</span></div>
                  </div>
                  <div>
                    <label className="erp-label">Tiến độ công việc</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${stats.taskProgress}%` }} />
                      </div>
                      <span className="text-sm font-black text-emerald-500 tabular-nums">{stats.taskProgress}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="erp-label">Số lượng hạng mục (WBS)</label>
                    <div className="text-xl font-black text-[var(--text-primary)] tabular-nums">{stats.wbsCount} <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest ml-1">Hạng mục</span></div>
                  </div>
                </div>
              </div>

              <div className="card-elevation p-8 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-6">Phân bổ chi phí theo loại</h3>
                <div className="space-y-4">
                  {Object.entries(stats.costByType || {}).map(([type, value]: [string, any]) => (
                    <div key={type} className="flex items-center justify-between p-4 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                      <span className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{type}</span>
                      <span className="text-[13px] font-black text-[var(--text-secondary)] tabular-nums">{formatVnd(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="card-elevation p-6 bg-[var(--secondary)] border border-[var(--border)] rounded-2xl">
                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Tình trạng thanh toán</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-[var(--text-secondary)]">Đã thanh toán</span>
                      <span className="text-emerald-500">{formatVnd(stats.totalPaidInvoice)}</span>
                    </div>
                    <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(stats.totalPaidInvoice / stats.totalInvoiced) * 100 || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-[var(--text-secondary)]">Còn nợ</span>
                      <span className="text-rose-500">{formatVnd(stats.totalRemainingInvoice)}</span>
                    </div>
                    <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${(stats.totalRemainingInvoice / stats.totalInvoiced) * 100 || 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-elevation p-6 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Hoạt động tài chính</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[var(--text-muted)]">Hóa đơn quá hạn</span>
                  <span className="h-6 px-2 rounded bg-rose-500/20 text-rose-500 text-[10px] font-black grid place-items-center">{stats.overdueInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-muted)]">Cam kết chi phí (PO)</span>
                  <span className="text-[11px] font-black text-blue-400">{formatVnd(stats.committedCost)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

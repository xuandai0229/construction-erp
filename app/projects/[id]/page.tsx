'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useERPStore } from '@/store/erpStore';
import { useProjectStatsQuery } from '@/services/queries/useProjects';
import { formatVnd } from '@/app/components/dashboard-data';

import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';

import { EnterpriseCard } from '@/app/components/ui-enterprise';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setCurrentProject } = useERPStore();
  const { data: stats, isLoading } = useProjectStatsQuery(id);

  useEffect(() => {
    setCurrentProject(id);
  }, [id, setCurrentProject]);

  if (isLoading) {
    return (
      <EnterpriseAppShell activeItem="projects">
        <EnterpriseHeader title="Chi tiết hồ sơ dự án" subtitle="Quản lý chuyên sâu và phân tích tài chính" />
        <EnterprisePageContainer>
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        </EnterprisePageContainer>
      </EnterpriseAppShell>
    );
  }

  if (!stats) {
    return (
      <EnterpriseAppShell activeItem="projects">
        <EnterpriseHeader title="Chi tiết hồ sơ dự án" subtitle="Quản lý chuyên sâu và phân tích tài chính" />
        <EnterprisePageContainer>
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <h2 className="text-xs font-bold text-[var(--text-primary)]">Không tìm thấy thông tin dự án</h2>
            <button
              onClick={() => router.push('/projects')}
              className="h-[36px] px-5 rounded-[var(--radius-sm)] bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </EnterprisePageContainer>
      </EnterpriseAppShell>
    );
  }

  return (
    <EnterpriseAppShell activeItem="projects">
      <EnterpriseHeader
        title={`CHI TIẾT HỒ SƠ DỰ ÁN: ${stats.name || id}`}
        subtitle="Quản lý chuyên sâu, theo dõi định mức BOQ và chi tiết phân bổ tài chính công trình"
      />
      <EnterprisePageContainer>
        
        {/* Accent Header row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Chi tiết hồ sơ dự án</h1>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-1">Mã định danh dự án: {id}</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="h-[36px] px-4 rounded-[var(--radius-sm)] bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors self-start md:self-auto"
          >
            Xem Dashboard Dự án
          </button>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Project Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <EnterpriseCard title="CHỈ TIÊU KINH DOANH CHÍNH">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div>
                  <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Giá trị Hợp đồng</label>
                  <div className="text-[18px] font-mono font-black text-blue-500 tabular-nums">{formatVnd(stats.totalRevenue || 0)}</div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Tổng chi phí thực tế</label>
                  <div className="text-[18px] font-mono font-black text-rose-500 tabular-nums">{formatVnd(stats.totalCost || 0)}</div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Tiến độ công việc</label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-2.5 bg-[var(--secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-emerald-500" style={{ width: `${stats.taskProgress}%` }} />
                    </div>
                    <span className="text-[12px] font-black text-emerald-500 font-mono tabular-nums">{stats.taskProgress}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1">Số lượng hạng mục (WBS)</label>
                  <div className="text-[16px] font-mono font-black text-[var(--text-primary)] tabular-nums">{stats.wbsCount} <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest ml-1">Hạng mục</span></div>
                </div>
              </div>
            </EnterpriseCard>

            <EnterpriseCard title="PHÂN BỔ CHI PHÍ THEO LOẠI VẬT TƯ / NHÂN CÔNG">
              <div className="space-y-3 mt-2">
                {Object.entries(stats.costByType || {}).map(([type, value]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary)]/40 border border-[var(--border)]">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">{type}</span>
                    <span className="text-[12px] font-mono font-black text-[var(--text-primary)] tabular-nums">{formatVnd(value)}</span>
                  </div>
                ))}
              </div>
            </EnterpriseCard>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <EnterpriseCard title="TÌNH TRẠNG THANH TOÁN HÓA ĐƠN">
              <div className="space-y-4 mt-2">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-[var(--text-secondary)]">Đã thanh toán</span>
                    <span className="text-emerald-500 font-mono">{formatVnd(stats.totalPaidInvoice)}</span>
                  </div>
                  <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div className="h-full bg-emerald-500" style={{ width: `${(stats.totalPaidInvoice / stats.totalInvoiced) * 100 || 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-[var(--text-secondary)]">Còn nợ phải trả</span>
                    <span className="text-rose-500 font-mono">{formatVnd(stats.totalRemainingInvoice)}</span>
                  </div>
                  <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div className="h-full bg-rose-500" style={{ width: `${(stats.totalRemainingInvoice / stats.totalInvoiced) * 100 || 0}%` }} />
                  </div>
                </div>
              </div>
            </EnterpriseCard>

            <EnterpriseCard title="HOẠT ĐỘNG TÀI CHÍNH PHỤ TRỢ">
              <div className="space-y-3 mt-2 text-[11px]">
                <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                  <span className="font-bold text-[var(--text-muted)]">Hóa đơn quá hạn</span>
                  <span className="h-5 px-2 rounded bg-rose-500/10 text-rose-500 text-[10px] font-black grid place-items-center">{stats.overdueInvoices} hóa đơn</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-bold text-[var(--text-muted)]">Cam kết chi phí (PO)</span>
                  <span className="text-[11px] font-black text-blue-400 font-mono">{formatVnd(stats.committedCost)}</span>
                </div>
              </div>
            </EnterpriseCard>
          </div>
        </div>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

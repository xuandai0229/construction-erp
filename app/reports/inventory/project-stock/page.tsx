'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { 
  EnterpriseSection, 
  EnterpriseEmptyState,
  EnterpriseLoadingState,
  EnterpriseErrorState
} from '@/app/components/ui-enterprise';

export default function ProjectStockReportPage() {
  const [projectId, setProjectId] = useState('');
  const sidebarCollapsed = useERPStore((state) => state.sidebarCollapsed);

  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  const { data: reportRes, isLoading, error, refetch } = useQuery({
    queryKey: ['report-project-stock', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`/api/inventory/reports/project-stock?projectId=${projectId}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!projectId
  });

  const projects = Array.isArray(projectsRes) ? projectsRes : [];
  const items = Array.isArray(reportRes) ? reportRes : [];
  const totalValue = items.reduce((sum: number, item: any) => sum + (item.totalCost || 0), 0);

  const handleExportCsv = () => {
    if (!projectId) return;
    window.open(`/api/export/inventory/project-stock?projectId=${projectId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="reports" />
      <main className={`erp-page-main flex-1 flex flex-col h-screen overflow-hidden ${sidebarCollapsed ? 'pl-[var(--erp-sidebar-collapsed)]' : 'pl-[var(--erp-sidebar-width)]'}`}>
        <Header data={{ project: { name: "Báo cáo Tồn Kho Theo Công Trình" } } as any} />
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          <EnterpriseSection 
            title="BÁO CÁO TỒN KHO THEO CÔNG TRÌNH / DỰ ÁN" 
            subtitle="Kiểm soát chi tiết tồn bãi tại công trường để tránh thất thoát nguyên vật liệu xây dựng"
          >
            {null}
          </EnterpriseSection>

          {/* Selector panel */}
          <div className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] flex items-end gap-4 text-xs">
            <div className="w-[300px]">
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Chọn công trình *</label>
              <select 
                value={projectId} 
                onChange={(e) => setProjectId(e.target.value)} 
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:border-[var(--primary)] outline-none text-xs font-bold"
              >
                <option value="">-- Chọn công trình --</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {projectId && (
              <button 
                onClick={handleExportCsv} 
                className="h-10 px-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-bold ml-auto transition-colors cursor-pointer"
              >
                Xuất dữ liệu CSV
              </button>
            )}
          </div>

          {!projectId ? (
            <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--card)] rounded-xl border border-[var(--border)] text-sm">
              Vui lòng chọn Công trình/Dự án để tra cứu tồn bãi.
            </div>
          ) : isLoading ? (
            <EnterpriseLoadingState message="Đang tải dữ liệu tồn kho công trình..." />
          ) : error ? (
            <EnterpriseErrorState 
              title="Lỗi tải dữ liệu" 
              description="Không thể tải báo cáo tồn bãi công trình vào lúc này." 
              onRetry={refetch}
            />
          ) : items.length === 0 ? (
            <EnterpriseEmptyState title="Không có tồn bãi" description="Dự án/Công trình chưa có vật liệu tồn bãi nào hạch toán." />
          ) : (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[var(--secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Mã kho</th>
                      <th className="p-3">Tên kho</th>
                      <th className="p-3">Mã vật tư</th>
                      <th className="p-3">Tên vật tư</th>
                      <th className="p-3">ĐVT</th>
                      <th className="p-3 text-right">Số lượng</th>
                      <th className="p-3 text-right">Đơn giá BQ</th>
                      <th className="p-3 text-right">Tổng giá trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[var(--secondary)]/25 transition-colors">
                        <td className="p-3">{item.warehouseCode}</td>
                        <td className="p-3">{item.warehouseName}</td>
                        <td className="p-3 font-semibold text-[var(--primary)]">{item.materialCode}</td>
                        <td className="p-3">{item.materialName}</td>
                        <td className="p-3">{item.unit}</td>
                        <td className="p-3 text-right font-mono font-semibold">{item.quantity?.toLocaleString('vi-VN')}</td>
                        <td className="p-3 text-right font-mono text-[var(--text-secondary)]">{item.avgCost?.toLocaleString('vi-VN')} đ</td>
                        <td className="p-3 text-right font-mono font-bold text-[var(--primary)]">{item.totalCost?.toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                    <tr className="bg-[var(--secondary)] font-black">
                      <td colSpan={7} className="p-4 text-right">TỔNG CỘNG GIÁ TRỊ TỒN BÃI:</td>
                      <td className="p-4 text-right font-mono text-[var(--primary)] text-sm">{totalValue.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

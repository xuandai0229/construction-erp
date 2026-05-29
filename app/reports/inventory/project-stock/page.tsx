'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { EnterpriseSection, EnterpriseEmptyState } from '@/app/components/ui-enterprise';

export default function ProjectStockReportPage() {
  const [projectId, setProjectId] = useState('');

  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  const { data: reportRes, isLoading, error } = useQuery({
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
      <main className="erp-page-main flex-1 flex flex-col h-screen overflow-hidden pl-[var(--erp-sidebar-width)]">
        <Header data={{ project: { name: "Báo cáo Tồn Kho Theo Công Trình" } } as any} />
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-zinc-50/30">
          <EnterpriseSection title="BÁO CÁO TỒN KHO THEO CÔNG TRÌNH / DỰ ÁN" subtitle="Kiểm soát chi tiết tồn bãi tại công trường để tránh thất thoát nguyên vật liệu xây dựng">
            {null}
          </EnterpriseSection>
          <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/80 flex items-end gap-4">
            <div className="w-[300px]">
              <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2">Chọn công trình *</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs focus:outline-none focus:border-blue-500 font-bold">
                <option value="">-- Chọn công trình --</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {projectId && <button onClick={handleExportCsv} className="h-10 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold ml-auto">Xuất CSV</button>}
          </div>
          {!projectId ? (
            <div className="p-8 text-center text-zinc-500 italic bg-zinc-900/10 rounded-xl border border-zinc-800/40">Vui lòng chọn Công trình/Dự án để tra cứu.</div>
          ) : isLoading ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-12 w-full animate-pulse bg-zinc-800/40 rounded-lg" />)}</div>
          ) : error ? (
            <div className="p-4 rounded bg-red-950/20 border border-red-900/50 text-red-400">Lỗi khi tải báo cáo.</div>
          ) : items.length === 0 ? (
            <EnterpriseEmptyState title="Không có tồn kho" description="Dự án chưa có vật tư nào." />
          ) : (
            <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/80 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Mã kho</th><th className="p-3">Tên kho</th><th className="p-3">Mã vật tư</th><th className="p-3">Tên vật tư</th><th className="p-3">ĐVT</th>
                    <th className="p-3 text-right">Số lượng</th><th className="p-3 text-right">Đơn giá BQ</th><th className="p-3 text-right">Tổng giá trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-800/20">
                      <td className="p-3">{item.warehouseCode}</td><td className="p-3">{item.warehouseName}</td>
                      <td className="p-3 font-bold text-zinc-300">{item.materialCode}</td><td className="p-3">{item.materialName}</td><td className="p-3">{item.unit}</td>
                      <td className="p-3 text-right font-mono font-semibold">{item.quantity?.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-right font-mono text-zinc-400">{item.avgCost?.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-400">{item.totalCost?.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-900 font-black text-white">
                    <td colSpan={7} className="p-3 text-right">TỔNG CỘNG:</td>
                    <td className="p-3 text-right font-mono text-blue-400 text-base">{totalValue.toLocaleString('vi-VN')} đ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import { 
  EnterpriseEmptyState,
  EnterpriseLoadingState,
  EnterpriseErrorState,
  EnterpriseDataTable,
  EnterpriseColumn
} from '@/app/components/ui-enterprise';

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

  const columns: EnterpriseColumn<any>[] = [
    { key: 'warehouseCode', header: 'Mã kho', render: row => row.warehouseCode, width: '110px' },
    { key: 'warehouseName', header: 'Tên kho bãi', render: row => row.warehouseName, minWidth: '150px' },
    { key: 'materialCode', header: 'Mã vật tư', render: row => <span className="font-bold text-[var(--primary)]">{row.materialCode}</span>, width: '120px' },
    { key: 'materialName', header: 'Tên vật tư', render: row => row.materialName, minWidth: '200px' },
    { key: 'unit', header: 'ĐVT', render: row => row.unit, width: '70px', align: 'center' },
    { key: 'quantity', header: 'Số lượng tồn', render: row => row.quantity?.toLocaleString('vi-VN'), width: '120px', align: 'right', className: 'font-semibold' },
    { key: 'avgCost', header: 'Đơn giá BQ', render: row => `${row.avgCost?.toLocaleString('vi-VN')} đ`, width: '140px', align: 'right', className: 'text-[var(--text-muted)] font-mono' },
    { key: 'totalCost', header: 'Tổng giá trị', render: row => `${row.totalCost?.toLocaleString('vi-VN')} đ`, width: '150px', align: 'right', className: 'font-bold text-[var(--primary)] font-mono' }
  ];

  const footerElement = (
    <tr className="bg-[var(--secondary)] border-t border-[var(--border)] font-bold text-[var(--text-primary)] h-[40px] text-[11px]">
      <td className="px-4 py-2" colSpan={7}>TỔNG CỘNG GIÁ TRỊ VẬT TƯ TỒN BÃI CÔNG TRÌNH</td>
      <td className="px-4 py-2 text-right font-mono text-[var(--primary)]">{totalValue.toLocaleString('vi-VN')} đ</td>
    </tr>
  );

  return (
    <EnterpriseAppShell activeItem="reports">
      <EnterpriseHeader
        title="BÁO CÁO TỒN KHO THEO CÔNG TRÌNH"
        subtitle="Kiểm soát chi tiết tồn bãi tại công trường để tránh thất thoát nguyên vật liệu xây dựng"
      />
      <EnterprisePageContainer>
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

        <div className="mt-4">
          {!projectId ? (
            <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--secondary)] rounded-xl border border-[var(--border)] text-xs italic">
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
            <EnterpriseEmptyState 
              title="Không có tồn bãi" 
              description="Dự án/Công trình chưa có vật liệu tồn bãi nào hạch toán." 
              iconType="report"
            />
          ) : (
            <EnterpriseDataTable
              data={items}
              columns={columns}
              getRowKey={(row, idx) => idx}
              minWidth="1100px"
              footer={footerElement}
            />
          )}
        </div>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

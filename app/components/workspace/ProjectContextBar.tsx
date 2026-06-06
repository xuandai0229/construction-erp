'use client';

import { useEffect, useMemo } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useProjectStatsQuery, useProjectsQuery } from '@/services/queries/useProjects';
import { formatVnd } from '@/app/components/dashboard-data';
import { ProjectStatus } from '@/app/types';

const STATUS_LABELS: Record<string, string> = {
  [ProjectStatus.PLANNED]: 'Lập kế hoạch',
  [ProjectStatus.IN_PROGRESS]: 'Đang thi công',
  [ProjectStatus.ACTIVE]: 'Đang hoạt động',
  [ProjectStatus.COMPLETED]: 'Hoàn thành',
  [ProjectStatus.CLOSED]: 'Đã đóng',
  [ProjectStatus.CANCELLED]: 'Đã hủy',
  [ProjectStatus.ARCHIVED]: 'Đã lưu trữ',
};

function CompactMetric({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'good' | 'bad' }) {
  const toneClass = tone === 'good' ? 'text-emerald-500' : tone === 'bad' ? 'text-rose-500' : 'text-[var(--text-primary)]';
  return (
    <div className="min-w-[128px] border-l border-[var(--divider)] pl-3">
      <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">{label}</div>
      <div className={`mt-0.5 truncate font-mono text-[12px] font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

export default function ProjectContextBar() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const { data: paginatedData, isLoading: isLoadingProjects } = useProjectsQuery({ limit: 100 });
  const { data: stats, isLoading: isLoadingStats } = useProjectStatsQuery(currentProjectId);

  const projects = paginatedData?.data || [];
  const project = useMemo(() => projects.find(item => item.id === currentProjectId), [projects, currentProjectId]);

  useEffect(() => {
    if (!currentProjectId && !isLoadingProjects && projects.length > 0) {
      setCurrentProject(projects[0].id);
    }
  }, [currentProjectId, isLoadingProjects, projects, setCurrentProject]);

  if (!currentProjectId) {
    if (isLoadingProjects) {
      return (
        <div className="sticky top-[var(--erp-header-height)] z-30 border-b border-[var(--border)] bg-[var(--card)] px-6 py-2.5 text-[12px] font-semibold text-[var(--text-secondary)]">
          Đang tải danh sách công trình...
        </div>
      );
    }

    if (projects.length > 0) {
      return (
        <div className="sticky top-[var(--erp-header-height)] z-30 border-b border-blue-500/20 bg-blue-500/10 px-6 py-2.5 text-[12px] font-semibold text-blue-600">
          Đang thiết lập công trình làm việc mặc định...
        </div>
      );
    }

    return (
      <div className="sticky top-[var(--erp-header-height)] z-30 border-b border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-[12px] font-semibold text-amber-600">
        Chưa chọn công trình. Vui lòng chọn công trình ở thanh điều hướng trước khi nhập WBS, dự toán, chi phí hoặc công nợ.
      </div>
    );
  }

  if (isLoadingProjects || !project) {
    return (
      <div className="sticky top-[var(--erp-header-height)] z-30 border-b border-[var(--border)] bg-[var(--card)] px-6 py-2.5 text-[12px] font-semibold text-[var(--text-secondary)]">
        Đang tải thông tin công trình...
      </div>
    );
  }

  const cost = Number(stats?.totalCost || 0);
  const budget = Number(stats?.totalBudget || project.totalBudget || 0);
  const receivable = Number(stats?.totalRemainingInvoice || 0);
  const profit = Number(stats?.profit || 0);
  const isOverBudget = budget > 0 && cost > budget;

  return (
    <div className="sticky top-[var(--erp-header-height)] z-30 border-b border-[var(--border)] bg-[var(--card)] px-6 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-[260px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--text-secondary)]">
              {project.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="truncate text-[13px] font-black text-[var(--text-primary)]">{project.name}</span>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-500">
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>
          <div className="mt-1 truncate text-[11px] font-medium text-[var(--text-secondary)]">
            Chủ đầu tư: {project.investor || 'Chưa khai báo'} · Loại công trình: {project.projectType || 'Chưa phân loại'}
          </div>
        </div>

        <CompactMetric label="Giá trị HĐ" value={formatVnd(project.contractValue || project.totalValue || 0)} />
        <CompactMetric label="Tổng dự toán" value={formatVnd(budget)} />
        <CompactMetric label="Tổng chi phí" value={isLoadingStats ? 'Đang tải...' : formatVnd(cost)} tone={isOverBudget ? 'bad' : 'default'} />
        <CompactMetric label="Công nợ phải thu" value={isLoadingStats ? 'Đang tải...' : formatVnd(receivable)} />
        <CompactMetric label="Lãi/Lỗ" value={isLoadingStats ? 'Đang tải...' : formatVnd(profit)} tone={profit >= 0 ? 'good' : 'bad'} />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/app/types';
import ConfirmModal from '@/app/components/modals/ConfirmModal';
import { Column, EnterpriseEmptyState, EnterpriseTable } from '@/app/components/ui-enterprise';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import { useERPStore } from '@/store/erpStore';
import { useDeleteProjectMutation, useUpdateProjectMutation } from '@/services/queries/useProjects';

type ProjectRow = Project & {
  code: string;
  type: string;
  progress: number;
  actualCost: number;
};

const statusConfig: Record<string, { text: string; className: string }> = {
  PLANNED: { text: 'Lập kế hoạch', className: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20' },
  IN_PROGRESS: { text: 'Đang thi công', className: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20' },
  ACTIVE: { text: 'Đang vận hành', className: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' },
  COMPLETED: { text: 'Hoàn thành', className: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' },
  CLOSED: { text: 'Đã đóng', className: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20' },
  CANCELLED: { text: 'Tạm dừng', className: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' },
};

function enrichProject(project: Project): ProjectRow {
  return {
    ...project,
    code: `PRJ-${project.id.substring(0, 4).toUpperCase()}`,
    type: project.projectType || 'Dân dụng',
    progress: Number((project as any).progress || 0),
    actualCost: Number((project as any).actualCost || 0),
  };
}

export default function ProjectTable({
  projects,
  onEdit,
  totalGlobal,
}: {
  projects: Project[];
  onEdit: (project: Project) => void;
  totalGlobal: number;
}) {
  const rows = projects.map(enrichProject);
  const router = useRouter();
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const { mutateAsync: deleteProject } = useDeleteProjectMutation();
  const { mutateAsync: updateProject } = useUpdateProjectMutation();

  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    type: 'DELETE' | 'CLOSE';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openDashboard = (projectId: string) => {
    setCurrentProject(projectId);
    router.push('/');
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setIsLoading(true);
    setError(null);

    try {
      if (confirmAction.type === 'DELETE') {
        await deleteProject(confirmAction.id);
        if (currentProjectId === confirmAction.id) setCurrentProject('');
      } else {
        await updateProject({ id: confirmAction.id, updates: { status: 'CLOSED' as any } });
      }
      setConfirmAction(null);
    } catch (err: any) {
      setError(err.message || 'Không thể thực hiện thao tác. Vui lòng kiểm tra lại hệ thống.');
      setConfirmAction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<ProjectRow>[] = [
    {
      header: 'STT',
      accessor: row => rows.indexOf(row) + 1,
      align: 'center',
      width: '72px',
    },
    {
      header: 'Hồ sơ công trình',
      accessor: row => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 21h18M3 7v14M12 3v18M21 7v14M7 7h2M7 11h2M7 15h2M15 7h2M15 11h2M15 15h2" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold text-[var(--text-primary)]">{row.name}</div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>{row.code}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--divider)]" />
              <span className="truncate">{row.type}</span>
            </div>
          </div>
        </div>
      ),
      width: '300px',
    },
    {
      header: 'Chủ đầu tư',
      accessor: row => row.investor || '---',
      width: '220px',
    },
    {
      header: 'Bắt đầu',
      accessor: row => row.startDate ? formatDate(row.startDate) : '---',
      align: 'center',
      width: '128px',
    },
    {
      header: 'Kết thúc',
      accessor: row => row.endDate ? formatDate(row.endDate) : '---',
      align: 'center',
      width: '128px',
    },
    {
      header: 'Ngân sách',
      accessor: row => formatVnd(Number(row.totalBudget || 0)),
      align: 'right',
      width: '160px',
    },
    {
      header: 'Thực chi',
      accessor: row => formatVnd(row.actualCost),
      align: 'right',
      width: '160px',
    },
    {
      header: 'Tiến độ',
      accessor: row => (
        <div className="mx-auto flex w-full max-w-[110px] flex-col gap-1">
          <span className="text-center font-bold tabular-nums text-[var(--text-primary)]">{row.progress}%</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-[var(--secondary)]">
            <span
              className={`block h-full rounded-full ${row.progress >= 100 ? 'bg-green-500' : row.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(row.progress, 100)}%` }}
            />
          </span>
        </div>
      ),
      align: 'center',
      width: '140px',
    },
    {
      header: 'Trạng thái',
      accessor: row => {
        const status = statusConfig[row.status] || { text: row.status, className: 'bg-slate-500/10 text-slate-400' };
        return (
          <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.className}`}>
            {status.text}
          </span>
        );
      },
      align: 'center',
      width: '150px',
    },
    {
      header: 'Thao tác',
      accessor: row => (
        <div className="flex items-center justify-center gap-1" onClick={event => event.stopPropagation()}>
          <button className="erp-btn h-8 px-1.5 text-[11px]" onClick={() => router.push(`/projects/${row.id}`)}>
            Chi tiết
          </button>
          <button className="erp-btn h-8 px-1.5 text-[11px]" onClick={() => onEdit(row)}>
            Sửa
          </button>
          {row.status !== 'CLOSED' && (
            <button className="erp-btn h-8 px-1.5 text-[11px]" onClick={() => setConfirmAction({ id: row.id, name: row.name, type: 'CLOSE' })}>
              Đóng
            </button>
          )}
          <button className="erp-btn h-8 px-1.5 text-[11px] text-rose-500" onClick={() => setConfirmAction({ id: row.id, name: row.name, type: 'DELETE' })}>
            Xóa
          </button>
        </div>
      ),
      align: 'center',
      width: '300px',
    },
  ];

  return (
    <>
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-rose-500/20 bg-rose-500/10 p-3">
          <div className="text-[12px] font-semibold text-rose-500">{error}</div>
          <button onClick={() => setError(null)} className="text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Đóng
          </button>
        </div>
      )}

      <EnterpriseTable
        data={rows}
        columns={columns}
        minWidth="1750px"
        getRowKey={row => row.id}
        onRowClick={row => openDashboard(row.id)}
        emptyState={
          <EnterpriseEmptyState
            title="Chưa có công trình"
            description="Thêm hồ sơ công trình mới hoặc điều chỉnh bộ lọc để hiển thị danh sách."
            iconType="generic"
          />
        }
      />

      <div className="mt-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Tổng <span className="font-bold tabular-nums text-[var(--text-primary)]">{totalGlobal}</span> hồ sơ dự án
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Hiển thị <span className="font-bold tabular-nums text-[var(--text-primary)]">{rows.length}</span> hồ sơ
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => {
          setConfirmAction(null);
          setError(null);
        }}
        onConfirm={executeAction}
        isLoading={isLoading}
        title={confirmAction?.type === 'DELETE' ? 'Xác nhận xóa vĩnh viễn' : 'Đóng hồ sơ dự án'}
        message={`Bạn có chắc chắn muốn ${confirmAction?.type === 'DELETE' ? 'xóa vĩnh viễn' : 'đóng'} hồ sơ "${confirmAction?.name}"?`}
        variant={confirmAction?.type === 'DELETE' ? 'danger' : 'close'}
        confirmLabel={confirmAction?.type === 'DELETE' ? 'Xóa vĩnh viễn' : 'Đóng hồ sơ'}
        businessContext={
          confirmAction?.type === 'DELETE'
            ? 'Hành động này sẽ xóa toàn bộ dữ liệu liên quan của dự án và không thể khôi phục.'
            : 'Hành động này sẽ chuyển hồ sơ sang trạng thái đã đóng.'
        }
      />
    </>
  );
}

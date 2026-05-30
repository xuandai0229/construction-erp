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

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
      minWidth: '72px'
    },
    {
      header: 'Hồ sơ công trình',
      accessor: row => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]">
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
      minWidth: '260px'
    },
    {
      header: 'Chủ đầu tư',
      accessor: row => row.investor || '---',
      width: '220px',
      minWidth: '180px'
    },
    {
      header: 'Bắt đầu',
      accessor: row => row.startDate ? formatDate(row.startDate) : '---',
      align: 'center',
      width: '128px',
      minWidth: '110px'
    },
    {
      header: 'Kết thúc',
      accessor: row => row.endDate ? formatDate(row.endDate) : '---',
      align: 'center',
      width: '128px',
      minWidth: '110px'
    },
    {
      header: 'Ngân sách',
      accessor: row => formatVnd(Number(row.totalBudget || 0)),
      align: 'right',
      width: '160px',
      minWidth: '140px'
    },
    {
      header: 'Thực chi',
      accessor: row => formatVnd(row.actualCost),
      align: 'right',
      width: '160px',
      minWidth: '140px'
    },
    {
      header: 'Tiến độ',
      accessor: row => (
        <div className="mx-auto flex w-full max-w-[110px] flex-col gap-1">
          <span className="text-center font-bold tabular-nums text-[var(--text-primary)]">{row.progress}%</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-[var(--secondary)]">
            <span
              className={`block h-full rounded-full ${row.progress >= 100 ? 'bg-green-500' : row.progress >= 50 ? 'bg-[var(--primary)]' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(row.progress, 100)}%` }}
            />
          </span>
        </div>
      ),
      align: 'center',
      width: '140px',
      minWidth: '115px'
    },
    {
      header: 'Trạng thái',
      accessor: row => {
        const status = statusConfig[row.status] || { text: row.status, className: 'bg-slate-500/10 text-slate-400' };
        return (
          <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.className} whitespace-nowrap`}>
            {status.text}
          </span>
        );
      },
      align: 'center',
      width: '150px',
      minWidth: '130px'
    },
    {
      header: 'Thao tác',
      accessor: row => {
        const isMenuOpen = activeMenuId === row.id;
        return (
          <div className="relative flex items-center justify-center gap-1.5" onClick={event => event.stopPropagation()}>
            <button 
              className="h-7 px-3 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 rounded-[var(--radius-sm)] text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              onClick={() => openDashboard(row.id)}
            >
              Chi tiết
            </button>
            <div className="relative">
              <button 
                className="h-7 w-7 flex items-center justify-center bg-[var(--secondary)] hover:bg-[var(--muted)] text-[var(--text-primary)] rounded-[var(--radius-sm)] transition-colors cursor-pointer border border-[var(--border)]"
                onClick={() => setActiveMenuId(isMenuOpen ? null : row.id)}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                  <div className="absolute right-0 mt-1.5 w-32 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg z-30 animate-fade-in text-left">
                    <button
                      className="w-full text-left h-8 px-2.5 hover:bg-[var(--muted)] rounded-md text-[11px] font-semibold text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-2"
                      onClick={() => { onEdit(row); setActiveMenuId(null); }}
                    >
                      <span>Sửa</span>
                    </button>
                    {row.status !== 'CLOSED' && (
                      <button
                        className="w-full text-left h-8 px-2.5 hover:bg-[var(--muted)] rounded-md text-[11px] font-semibold text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-2"
                        onClick={() => { setConfirmAction({ id: row.id, name: row.name, type: 'CLOSE' }); setActiveMenuId(null); }}
                      >
                        <span>Đóng</span>
                      </button>
                    )}
                    <button
                      className="w-full text-left h-8 px-2.5 hover:bg-rose-500/10 text-rose-500 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-2"
                      onClick={() => { setConfirmAction({ id: row.id, name: row.name, type: 'DELETE' }); setActiveMenuId(null); }}
                    >
                      <span>Xóa</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      },
      align: 'center',
      width: '140px',
      minWidth: '140px'
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
        minWidth="1360px"
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

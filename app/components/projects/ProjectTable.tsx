'use client';

import { Project } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { useDeleteProjectMutation, useUpdateProjectMutation } from '@/services/queries/useProjects';
import { COL_WIDTHS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';
import ConfirmModal from '@/app/components/modals/ConfirmModal';

const statusConfig: Record<string, { text: string; icon: string; class: string }> = {
  PLANNED: { text: 'Lập kế hoạch', icon: '📋', class: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20' },
  IN_PROGRESS: { text: 'Đang thi công', icon: '🚧', class: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20' },
  ACTIVE: { text: 'Đang vận hành', icon: '⚡', class: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' },
  COMPLETED: { text: 'Hoàn thành', icon: '✅', class: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' },
  CLOSED: { text: 'Đã đóng', icon: '🔒', class: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20' },
  CANCELLED: { text: 'Tạm dừng', icon: '⏸', class: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' },
};

const enrichProject = (p: Project, index: number) => {
  return {
    ...p,
    code: `PRJ-${p.id.substring(0, 4).toUpperCase()}`,
    type: p.projectType || 'Dân dụng',
    progress: (p as any).progress || 0,
  };
};

import { useTableUX } from '@/app/hooks/useTableUX';
import PortalOverlay from '@/app/components/shared/PortalOverlay';

export default function ProjectTable({ projects, onEdit, totalGlobal }: { projects: Project[], onEdit: (p: Project) => void, totalGlobal: number }) {
  const enrichedProjects = projects.map((p, i) => enrichProject(p, i));
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const { mutateAsync: deleteProject } = useDeleteProjectMutation();
  const { mutateAsync: updateProject } = useUpdateProjectMutation();
  const router = useRouter();

  const { scrollContainerRef, showScrollHint, dragCursorClass } = useTableUX();

  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionTriggerRect, setActionTriggerRect] = useState<DOMRect | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // PortalOverlay handles click outside natively

  const [confirmAction, setConfirmAction] = useState<{
    id: string,
    name: string,
    type: 'DELETE' | 'CLOSE',
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRowClick = (id: string) => {
    setCurrentProject(id);
    router.push('/');
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setIsLoading(true);
    setError(null);
    try {
      if (confirmAction.type === 'DELETE') {
        await deleteProject(confirmAction.id);
        if (currentProjectId === confirmAction.id) {
          setCurrentProject('');
        }
        setConfirmAction(null);
      } else if (confirmAction.type === 'CLOSE') {
        await updateProject({ id: confirmAction.id, updates: { status: 'CLOSED' as any } });
        setConfirmAction(null);
      }
    } catch (err: any) {
      setError(err.message || "Không thể thực hiện thao tác. Vui lòng kiểm tra lại hệ thống.");
      setConfirmAction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (p: Project, type: 'DELETE' | 'CLOSE') => {
    setOpenMenuId(null);
    setConfirmAction({ id: p.id, name: p.name, type });
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3.5 bg-rose-500/8 border border-rose-500/20 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Lỗi hệ thống</div>
              <div className="text-[12px] font-semibold text-[var(--text-primary)]">{error}</div>
            </div>
          </div>
          <button onClick={() => setError(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className={`overflow-hidden bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm relative`}>
        <div
          ref={scrollContainerRef}
          className={`overflow-x-auto overflow-y-visible scrollbar-thin ${dragCursorClass}`}
          style={{ scrollBehavior: 'smooth' }}
        >
          {enrichedProjects.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-[var(--secondary)] border border-[var(--border)]">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--text-muted)] opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 21h18M3 7v14M12 3v18M21 7v14M7 7h2M7 11h2M7 15h2M15 7h2M15 11h2M15 15h2" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-semibold text-[var(--text-secondary)]">Không tìm thấy hồ sơ công trình</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">Thử thay đổi bộ lọc hoặc thêm dự án mới</div>
              </div>
            </div>
          ) : (
            <TableVirtuoso
              useWindowScroll
              data={enrichedProjects}
              computeItemKey={(index, project) => project.id}
              components={{
                Table: (props) => <table {...props} className="erp-table w-full table-fixed" />,
                TableHead: (props) => <thead {...props} className="bg-[var(--table-head-bg)] z-[200] sticky top-0" />,
                TableRow: (props) => {
                  const project = props.item as any;
                  return (
                    <tr
                      {...props}
                      onClick={() => handleRowClick(project.id)}
                      className="group cursor-pointer erp-table-row border-b border-[var(--border)] last:border-0"
                    />
                  );
                }
              }}
              fixedHeaderContent={() => (
                <tr className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)]">
                  <th className={`text-center border-r border-[var(--border)] ${COL_WIDTHS.CHECKBOX}`}>STT</th>
                  <th className={`text-left border-r border-[var(--border)] ${COL_WIDTHS.PROJECT_PROFILE}`}>{ERP_TERMINOLOGY.PROJECT.COL_PROFILE}</th>
                  <th className={`text-left border-r border-[var(--border)] ${COL_WIDTHS.INVESTOR}`}>{ERP_TERMINOLOGY.PROJECT.COL_INVESTOR}</th>
                  <th className={`text-center border-r border-[var(--border)] ${COL_WIDTHS.DATE}`}>{ERP_TERMINOLOGY.PROJECT.START_DATE}</th>
                  <th className={`text-center border-r border-[var(--border)] ${COL_WIDTHS.DATE}`}>{ERP_TERMINOLOGY.PROJECT.END_DATE}</th>
                  <th className={`text-right border-r border-[var(--border)] ${COL_WIDTHS.FINANCIAL}`}>{ERP_TERMINOLOGY.FINANCE.BUDGET}</th>
                  <th className={`text-right border-r border-[var(--border)] ${COL_WIDTHS.FINANCIAL}`}>{ERP_TERMINOLOGY.FINANCE.ACTUAL}</th>
                  <th className={`text-center border-r border-[var(--border)] ${COL_WIDTHS.PROGRESS}`}>Tiến độ %</th>
                  <th className={`text-center border-r border-[var(--border)] ${COL_WIDTHS.STATUS}`}>{ERP_TERMINOLOGY.STATUS.TITLE}</th>
                  <th className={`text-center ${COL_WIDTHS.ACTIONS}`}>{ERP_TERMINOLOGY.ACTIONS.TITLE}</th>
                </tr>
              )}
              itemContent={(i, p) => (
                <>
                  <td className={`${COL_WIDTHS.CHECKBOX} py-3 px-4 text-center text-[12px] font-medium text-[var(--text-muted)] tabular-nums border-r border-[var(--border)]`}>{i + 1}</td>
                  <td className={`${COL_WIDTHS.PROJECT_PROFILE} py-3 px-4 border-r border-[var(--border)]`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Project type indicator */}
                      <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 21h18M3 7v14M12 3v18M21 7v14M7 7h2M7 11h2M7 15h2M15 7h2M15 11h2M15 15h2" />
                        </svg>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold text-[var(--text-primary)] line-clamp-2 whitespace-normal leading-tight break-words group-hover:text-blue-400 transition-colors">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">
                            {p.code}
                          </span>
                          {p.type && (
                            <>
                              <span className="h-0.5 w-0.5 rounded-full bg-[var(--text-muted)] opacity-30" />
                              <span className="text-[9px] font-medium text-[var(--text-muted)] opacity-40">{p.type}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`${COL_WIDTHS.INVESTOR} py-3 px-4 text-[12px] font-medium text-[var(--text-secondary)] truncate border-r border-[var(--border)]`}>{p.investor || '---'}</td>
                  <td className={`${COL_WIDTHS.DATE} py-3 px-4 text-center text-[11px] font-bold text-[var(--text-muted)] tabular-nums border-r border-[var(--border)]`}>
                    {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '---'}
                  </td>
                  <td className={`${COL_WIDTHS.DATE} py-3 px-4 text-center text-[11px] font-bold text-[var(--text-muted)] tabular-nums border-r border-[var(--border)]`}>
                    {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '---'}
                  </td>
                  <td className={`${COL_WIDTHS.FINANCIAL} py-3 px-4 text-right border-r border-[var(--border)]`}>
                    <div className="flex items-baseline gap-1 justify-end whitespace-nowrap">
                      <span className="text-[12px] font-bold text-[var(--text-primary)] tabular-nums">{(p.totalBudget ?? 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">VND</span>
                    </div>
                  </td>
                  <td className={`${COL_WIDTHS.FINANCIAL} py-3 px-4 text-right border-r border-[var(--border)]`}>
                    <div className="flex items-baseline gap-1 justify-end whitespace-nowrap">
                      <span className="text-[12px] font-bold text-blue-400 tabular-nums">{((p as any).actualCost ?? 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">VND</span>
                    </div>
                  </td>
                  <td className={`${COL_WIDTHS.PROGRESS} py-3 px-4 text-center border-r border-[var(--border)]`}>
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="text-[11px] font-bold tabular-nums text-[var(--text-primary)]">{p.progress}%</div>
                      <div className="h-1.5 w-full bg-[var(--secondary)] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            p.progress >= 100 ? 'bg-green-500' : p.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                          }`} 
                          style={{ width: `${Math.min(p.progress, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className={`${COL_WIDTHS.STATUS} py-3 px-4 text-center border-r border-[var(--border)]`}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusConfig[p.status]?.class || 'bg-slate-500/10 text-slate-400'}`}>
                      <span className="text-xs leading-none">{statusConfig[p.status]?.icon || '•'}</span>
                      {statusConfig[p.status]?.text || p.status}
                    </span>
                  </td>
                  {/* Action Menu */}
                  <td className={`${COL_WIDTHS.ACTIONS} py-3 px-4 text-center`}>
                    <div className="relative flex items-center justify-center" ref={openMenuId === p.id ? menuRef : undefined}>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (openMenuId === p.id) {
                            setOpenMenuId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActionTriggerRect(rect);
                            setOpenMenuId(p.id);
                          }
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--secondary)] transition-all opacity-60 group-hover:opacity-100"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>

                      <PortalOverlay
                        isOpen={openMenuId === p.id}
                        onClose={() => setOpenMenuId(null)}
                        triggerRect={actionTriggerRect}
                        width={200}
                        align="right"
                        zIndex={500} // var(--z-action-menu)
                      >
                        <div className="py-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); router.push(`/projects/${p.id}`); }}
                            className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-[var(--secondary)] transition-colors"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Xem chi tiết</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onEdit(p); }}
                            className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-[var(--secondary)] transition-colors"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Chỉnh sửa</span>
                          </button>
                          {p.status !== 'CLOSED' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleActionClick(p, 'CLOSE'); }}
                              className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-[var(--secondary)] transition-colors"
                            >
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-[12px] font-medium text-[var(--text-secondary)]">Đóng hồ sơ</span>
                            </button>
                          )}
                          <div className="my-1 mx-3 h-px bg-[var(--divider)]" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleActionClick(p, 'DELETE'); }}
                            className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-rose-500/10 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="text-[12px] font-medium text-rose-400">Xóa vĩnh viễn</span>
                          </button>
                        </div>
                      </PortalOverlay>
                    </div>
                  </td>
                </>
              )}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => { setConfirmAction(null); setError(null); }}
        onConfirm={executeAction}
        isLoading={isLoading}
        title={
            confirmAction?.type === 'DELETE' ? "Xác nhận xóa vĩnh viễn" : "Đóng hồ sơ dự án"
        }
        message={
            `Bạn có chắc chắn muốn ${confirmAction?.type === 'DELETE' ? 'xóa vĩnh viễn' : 'đóng'} hồ sơ "${confirmAction?.name}"?`
        }
        variant={confirmAction?.type === 'DELETE' ? 'danger' : 'close'}
        confirmLabel={
            confirmAction?.type === 'DELETE' ? "Xóa vĩnh viễn" : "Đóng hồ sơ"
        }
        businessContext={
            confirmAction?.type === 'DELETE' ? "Lưu ý: Hành động này sẽ xóa toàn bộ dữ liệu kế toán và nghiệp vụ của dự án một cách vĩnh viễn và không thể khôi phục." : "Lưu ý: Hành động này có thể ảnh hưởng đến khả năng truy xuất dữ liệu vận hành trong tương lai."
        }
      />

      <div className="mt-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">
            Tổng <span className="text-[var(--text-primary)] font-bold tabular-nums">{totalGlobal}</span> hồ sơ dự án
          </p>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">
            Hiển thị <span className="text-[var(--text-primary)] font-bold tabular-nums">{enrichedProjects.length}</span> hồ sơ
          </p>
        </div>
      </div>
    </>
  );
}

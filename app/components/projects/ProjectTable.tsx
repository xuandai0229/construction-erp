'use client';

import { Project } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { useDeleteProjectMutation, useUpdateProjectMutation } from '@/services/queries/useProjects';
import { formatVnd } from '../dashboard-data';
import { COL_WIDTHS, FINANCIAL_CELL_CLASS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';
import ConfirmModal from '@/app/components/modals/ConfirmModal';

const statusLabels: Record<string, { text: string; class: string }> = {
  PLANNED: { text: 'Lập kế hoạch', class: 'bg-slate-500/5 text-slate-500 border-slate-500/10' },
  IN_PROGRESS: { text: 'Đang thi công', class: 'bg-blue-500/5 text-blue-500 border-blue-500/10' },
  ACTIVE: { text: 'Đang vận hành', class: 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' },
  COMPLETED: { text: 'Hoàn thành', class: 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' },
  CLOSED: { text: 'Đã đóng', class: 'bg-rose-500/5 text-rose-500 border-rose-500/10' },
  CANCELLED: { text: 'Tạm dừng', class: 'bg-amber-500/5 text-amber-500 border-amber-500/10' },
  ARCHIVED: { text: 'Lưu trữ', class: 'bg-slate-800 text-slate-400 border-slate-700' },
};

// Rule 2 & 6: Technical Construction Imagery with Base64 Fallback
const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 21h18M3 7v14M12 3v18M21 7v14M7 7h2M7 11h2M7 15h2M15 7h2M15 11h2M15 15h2'/%3E%3C/svg%3E";

const CONSTRUCTION_IMAGES = [
  'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=120&h=120&fit=crop', // Site
  'https://images.unsplash.com/photo-1503387762-592dea58ef23?w=120&h=120&fit=crop', // Blueprint
  'https://images.unsplash.com/photo-1504307651254-35682fd917ff?w=120&h=120&fit=crop', // Crane
  'https://images.unsplash.com/photo-1581094288338-2314dddb7ec4?w=120&h=120&fit=crop', // Technical
];

const enrichProject = (p: Project, index: number) => {
  return {
    ...p,
    code: `PRJ-${p.id.substring(0, 4).toUpperCase()}`,
    type: p.projectType || 'Dân dụng',
    typeColor: 'text-[var(--text-muted)]',
    progress: Math.floor(Math.random() * 100),
    thumbnail: CONSTRUCTION_IMAGES[index % CONSTRUCTION_IMAGES.length]
  };
};

function ProjectThumbnail({ src }: { src: string }) {
  const [error, setError] = useState(false);
  return (
    <div className="h-9 w-9 rounded-lg bg-[var(--secondary)] border border-[var(--border)] overflow-hidden shrink-0">
      <img
        src={error ? PLACEHOLDER_SVG : src}
        alt=""
        className={`h-full w-full object-cover transition-opacity duration-300 ${error ? 'p-2 opacity-40' : 'opacity-80 group-hover:opacity-100'}`}
        onError={() => setError(true)}
      />
    </div>
  );
}

import { useTableUX } from '@/app/hooks/useTableUX';

export default function ProjectTable({ projects, onEdit, totalGlobal }: { projects: Project[], onEdit: (p: Project) => void, totalGlobal: number }) {
  const enrichedProjects = projects.map((p, i) => enrichProject(p, i));
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const { mutateAsync: deleteProject } = useDeleteProjectMutation();
  const { mutateAsync: updateProject } = useUpdateProjectMutation();
  const router = useRouter();

  const { scrollContainerRef, showScrollHint, dragCursorClass } = useTableUX();

  // Micro-nudge animation for scroll discoverability
  useEffect(() => {
    let t1: any, t2: any;
    if (scrollContainerRef.current) {
      t1 = setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ left: 40, behavior: 'smooth' });
        t2 = setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
        }, 600);
      }, 800);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  const [confirmAction, setConfirmAction] = useState<{
    id: string,
    name: string,
    type: 'DELETE' | 'ARCHIVE' | 'CLOSE' | 'LOCKED_BY_FINANCE',
    counts?: { invoices: number, costs: number, revenues: number }
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
        setConfirmAction(null);
      } else if (confirmAction.type === 'ARCHIVE' || confirmAction.type === 'LOCKED_BY_FINANCE') {
        await updateProject({ id: confirmAction.id, updates: { status: 'ARCHIVED' as any } });
        setConfirmAction(null);
      } else if (confirmAction.type === 'CLOSE') {
        await updateProject({ id: confirmAction.id, updates: { status: 'CLOSED' as any } });
        setConfirmAction(null);
      }
    } catch (err: any) {
      if (err.metadata?.isFinancialLocked) {
        // Morph the modal into a Locked Warning with CTA
        setConfirmAction(prev => prev ? {
          ...prev,
          type: 'LOCKED_BY_FINANCE',
          counts: err.metadata.counts
        } : null);
      } else {
        setError(err.message || "Không thể thực hiện thao tác. Vui lòng kiểm tra lại hệ thống.");
        setConfirmAction(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (p: Project, type: 'DELETE' | 'ARCHIVE' | 'CLOSE') => {
    setConfirmAction({ id: p.id, name: p.name, type });
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Quy tắc nghiệp vụ</div>
              <div className="text-[12.5px] font-bold text-[var(--text-primary)]">{error}</div>
            </div>
          </div>
          <button onClick={() => setError(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="overflow-hidden bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm relative">
        <div
          ref={scrollContainerRef}
          className={`overflow-x-auto scrollbar-thin ${dragCursorClass}`}
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Gradient fade hint - subtle theme-aware style */}
          {showScrollHint && (
            <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-20"
              style={{
                background: 'linear-gradient(to left, var(--card) 0%, transparent 100%)',
                opacity: 0.9
              }}
            />
          )}
          {enrichedProjects.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest opacity-40 italic">
              Không tìm thấy hồ sơ công trình
            </div>
          ) : (
            <TableVirtuoso
              useWindowScroll
              data={enrichedProjects}
              components={{
                Table: (props) => <table {...props} className="erp-table w-full table-fixed" />,
                TableHead: (props) => <thead {...props} className="bg-[var(--table-head-bg)] z-30 sticky top-0" />,
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
                <tr className="bg-[var(--table-head-bg)]">
                  <th className={`py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.CHECKBOX}`}>STT</th>
                  <th className={`py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.PROJECT_PROFILE}`}>{ERP_TERMINOLOGY.PROJECT.COL_PROFILE}</th>
                  <th className={`py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.INVESTOR}`}>{ERP_TERMINOLOGY.PROJECT.COL_INVESTOR}</th>
                  <th className={`py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.DATE}`}>{ERP_TERMINOLOGY.PROJECT.START_DATE}</th>
                  <th className={`py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.DATE}`}>{ERP_TERMINOLOGY.PROJECT.END_DATE}</th>
                  <th className={`py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.FINANCIAL}`}>{ERP_TERMINOLOGY.FINANCE.BUDGET}</th>
                  <th className={`py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.FINANCIAL}`}>{ERP_TERMINOLOGY.FINANCE.ACTUAL}</th>
                  <th className={`py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.PROGRESS}`}>Tiến độ %</th>
                  <th className={`py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-r border-[var(--border)] ${COL_WIDTHS.STATUS}`}>{ERP_TERMINOLOGY.STATUS.TITLE}</th>
                  <th className={`py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.05em] whitespace-nowrap border-b border-[var(--border)] ${COL_WIDTHS.ACTIONS}`}>{ERP_TERMINOLOGY.ACTIONS.TITLE}</th>
                </tr>
              )}
              itemContent={(i, p) => (
                <>
                  <td className={`${COL_WIDTHS.CHECKBOX} py-3 px-4 text-center text-[12px] font-medium text-[var(--text-muted)] tabular-nums border-r border-[var(--border)]`}>{i + 1}</td>
                  <td className={`${COL_WIDTHS.PROJECT_PROFILE} py-3 px-4 border-r border-[var(--border)]`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <ProjectThumbnail src={p.thumbnail} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold text-[var(--text-primary)] line-clamp-2 whitespace-normal leading-tight break-words group-hover:text-blue-500 transition-colors">
                          {p.name}
                        </span>
                        <span className="text-[8.5px] font-medium text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-40">
                          {p.code}
                        </span>
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
                      <span className="text-[12px] font-bold text-[var(--text-primary)] tabular-nums">{(p.totalValue ?? 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">VND</span>
                    </div>
                  </td>
                  <td className={`${COL_WIDTHS.FINANCIAL} py-3 px-4 text-right border-r border-[var(--border)]`}>
                    <div className="flex items-baseline gap-1 justify-end whitespace-nowrap">
                      <span className="text-[12px] font-bold text-blue-500 tabular-nums">{(p.totalValue ?? 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">VND</span>
                    </div>
                  </td>
                  <td className={`${COL_WIDTHS.PROGRESS} py-3 px-4 text-center border-r border-[var(--border)]`}>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between text-[9px] font-bold tabular-nums opacity-60">
                        <span>{p.progress}%</span>
                      </div>
                      <div className="h-1 w-full bg-[var(--secondary)] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/60 rounded-full transition-all duration-1000" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className={`${COL_WIDTHS.STATUS} py-3 px-4 text-center border-r border-[var(--border)]`}>
                    <span className={`erp-badge whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${statusLabels[p.status]?.class || ''}`}>
                      {statusLabels[p.status]?.text || p.status}
                    </span>
                  </td>
                  <td className={`${COL_WIDTHS.ACTIONS} py-3 px-4 text-center`}>
                    <div className="flex items-center justify-center gap-1.5 opacity-70 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/projects/${p.id}`); }}
                        className="p-1.5 text-[var(--text-muted)] hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"
                        title="Xem chi tiết"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                        className="p-1.5 text-[var(--text-muted)] hover:text-emerald-500 rounded-lg hover:bg-emerald-500/10 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleActionClick(p, 'DELETE'); }}
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Hủy bỏ hồ sơ"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
          confirmAction?.type === 'LOCKED_BY_FINANCE' ? "KHÔNG THỂ XÓA VĨNH VIỄN" :
            confirmAction?.type === 'DELETE' ? "Xác nhận xóa vĩnh viễn" :
              confirmAction?.type === 'ARCHIVE' ? "Chuyển vào lưu trữ" : "Đóng hồ sơ dự án"
        }
        message={
          confirmAction?.type === 'LOCKED_BY_FINANCE' ?
            `Hệ thống phát hiện hồ sơ dự án "${confirmAction?.name}" đã phát sinh dữ liệu tài chính (Hóa đơn: ${confirmAction.counts?.invoices || 0}, Chi phí: ${confirmAction.counts?.costs || 0}). Để đảm bảo tính toàn vẹn kế toán và phục vụ kiểm toán, hệ thống không cho phép xóa vĩnh viễn hồ sơ này. Bạn có muốn chuyển hồ sơ sang trạng thái Lưu Trữ?` :
            `Bạn có chắc chắn muốn ${confirmAction?.type === 'DELETE' ? 'xóa vĩnh viễn' : confirmAction?.type === 'ARCHIVE' ? 'lưu trữ' : 'đóng'} hồ sơ "${confirmAction?.name}"?`
        }
        variant={confirmAction?.type === 'LOCKED_BY_FINANCE' ? 'archive' : confirmAction?.type === 'DELETE' ? 'danger' : 'close'}
        confirmLabel={
          confirmAction?.type === 'LOCKED_BY_FINANCE' ? "Chuyển vào lưu trữ" :
            confirmAction?.type === 'DELETE' ? "Xóa vĩnh viễn" :
              confirmAction?.type === 'ARCHIVE' ? "Lưu trữ" : "Đóng hồ sơ"
        }
        businessContext={
          confirmAction?.type === 'LOCKED_BY_FINANCE' ? "Dữ liệu kế toán đã phát sinh. Lưu trữ là phương thức an toàn nhất để bảo toàn lịch sử audit hệ thống." :
            "Lưu ý: Hành động này có thể ảnh hưởng đến khả năng truy xuất dữ liệu vận hành trong tương lai."
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

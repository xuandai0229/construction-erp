'use client';

import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { useState } from 'react';
import ConfirmModal from '@/app/components/modals/ConfirmModal';

import { TableVirtuoso } from 'react-virtuoso';
import { useMemo } from 'react';
import { useDeleteWBSMutation } from '@/services/queries/useWBS';
import { COL_WIDTHS, FINANCIAL_CELL_CLASS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';

// Stable references to prevent re-render loops with TableVirtuoso
const WBSStableTableComponents = {
  Table: (props: any) => <table {...props} className="erp-table w-full min-w-max table-fixed" />,
  TableHead: (props: any) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
  TableRow: (props: any) => {
    const node = props.item as FlattenedNode;
    const isParent = node.children && node.children.length > 0;
    return (
      <tr
        {...props}
        className={`transition-colors hover:bg-[var(--secondary)] select-none ${isParent && node.level === 0 ? 'bg-[var(--secondary)]/50' : ''}`}
      />
    );
  }
};

import { useTableUX } from '@/app/hooks/useTableUX';

interface WBSTableProps {
  nodes: EnrichedWBSNode[];
  onToggleExpand: (id: string) => void;
  onEdit: (w: WBSItem) => void;
  onAddChild?: (parentId: string) => void;
  totalBudget: number;
  totalActual: number;
  variance: number;
  progress: number;
}

type FlattenedNode = EnrichedWBSNode & { rowIndex: string };

const flattenWBS = (nodes: EnrichedWBSNode[], indexPrefix: string = ''): FlattenedNode[] => {
  let result: FlattenedNode[] = [];
  nodes.forEach((node, idx) => {
    const currentIndex = indexPrefix ? `${indexPrefix}.${idx + 1}` : `${idx + 1}`;
    result.push({ ...node, rowIndex: currentIndex });
    if (node.isExpanded && node.children && node.children.length > 0) {
      result = result.concat(flattenWBS(node.children, currentIndex));
    }
  });
  return result;
};

export default function WBSTable({ nodes, onToggleExpand, onEdit, onAddChild, totalBudget, totalActual, variance, progress }: WBSTableProps) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { mutateAsync: deleteWBS } = useDeleteWBSMutation(currentProjectId);

  const flattenedNodes = useMemo(() => flattenWBS(nodes), [nodes]);

  const { scrollContainerRef, showScrollHint, dragCursorClass } = useTableUX();
  const [confirmAction, setConfirmAction] = useState<{ id: string, name: string, type: 'DELETE' | 'LOCKED' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (node: FlattenedNode) => {
    // Frontend preemptive check
    if (node.actual > 0 || node.revenue > 0) {
      setConfirmAction({ id: node.id, name: node.name, type: 'LOCKED' });
    } else {
      setConfirmAction({ id: node.id, name: node.name, type: 'DELETE' });
    }
  };

  const executeDelete = async () => {
    if (!confirmAction || confirmAction.type === 'LOCKED') {
      setConfirmAction(null);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteWBS(confirmAction.id);
      setConfirmAction(null);
    } catch (err: any) {
      if (err.metadata?.isFinancialLocked) {
        setConfirmAction(prev => prev ? { ...prev, type: 'LOCKED' } : null);
      } else {
        alert(err.message || "Lỗi khi xóa hạng mục");
        setConfirmAction(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (node: FlattenedNode) => {
    const baseItem: WBSItem = {
      id: node.id,
      projectId: node.projectId,
      name: node.name,
      parentId: node.parentId,
      level: node.level,
      sortOrder: node.sortOrder,
      budgetAmount: node.budgetAmount,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };
    onEdit(baseItem);
  };

  const statusMap: Record<string, string> = {
    'Đang thi công': 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10',
    'Chậm tiến độ': 'border-orange-500/30 text-orange-600 bg-orange-500/10',
    'Chưa triển khai': 'border-[var(--border)] text-[var(--text-secondary)] bg-[var(--secondary)]',
    'Hoàn thành': 'border-blue-500/30 text-blue-600 bg-blue-500/10',
    'Vượt ngân sách': 'border-rose-500/30 text-rose-600 bg-rose-500/10 font-bold animate-pulse',
    'Chưa lập dự toán': 'border-rose-500/30 text-rose-600 bg-rose-500/10 italic',
  };

  const getSemanticStatus = (node: FlattenedNode) => {
    if (node.budget === 0 && node.actual > 0) return 'Chưa lập dự toán';
    if (node.profit < 0) return 'Vượt ngân sách';
    if (node.percentage === 0) return 'Chưa triển khai';
    if (node.percentage >= 100) return 'Hoàn thành';
    return 'Đang thi công';
  };

  return (
    <>
      <div className="scroll-hint-container">
        <div
          ref={scrollContainerRef}
          className={`overflow-x-auto scrollbar-thin border border-[var(--border)] rounded-lg ${dragCursorClass} relative`}
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
          {flattenedNodes.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--table-head-bg)]">
              Không có dữ liệu hạng mục
            </div>
          ) : (
            <TableVirtuoso
              useWindowScroll
              data={flattenedNodes}
              components={WBSStableTableComponents}
              fixedHeaderContent={() => (
                <tr>
                  <th className={`${COL_WIDTHS.CHECKBOX} text-center bg-[var(--table-head-bg)] border-r border-[var(--border)]`}>
                    <input type="checkbox" className="rounded border-[var(--border)] bg-[var(--secondary)] text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0" />
                  </th>
                  <th className={`${COL_WIDTHS.INDEX} text-center bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] tracking-widest text-[var(--text-secondary)] border-r border-[var(--border)]`}>Mã WBS</th>
                  <th className={`${COL_WIDTHS.NAME_WBS} bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] tracking-widest text-[var(--text-secondary)] text-left px-4 border-r border-[var(--border)]`}>{ERP_TERMINOLOGY.WBS.COL_NAME}</th>
                  <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] tracking-widest text-[var(--text-secondary)] border-r border-[var(--border)]`}>{ERP_TERMINOLOGY.FINANCE.BUDGET}</th>
                  <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] tracking-widest text-[var(--text-secondary)] border-r border-[var(--border)]`}>{ERP_TERMINOLOGY.FINANCE.ACTUAL}</th>
                  <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] tracking-widest text-[var(--text-secondary)] border-r border-[var(--border)]`}>{ERP_TERMINOLOGY.FINANCE.VARIANCE}</th>
                  <th className={`${COL_WIDTHS.PROGRESS} text-center bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] tracking-widest text-[var(--text-secondary)] border-r border-[var(--border)]`}>Tiến độ %</th>
                  <th className={`${COL_WIDTHS.STATUS} text-center bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] tracking-widest text-[var(--text-secondary)] border-r border-[var(--border)]`}>{ERP_TERMINOLOGY.STATUS.TITLE}</th>
                  <th className={`${COL_WIDTHS.ACTIONS} text-center bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] tracking-widest text-[var(--text-secondary)]`}>{ERP_TERMINOLOGY.ACTIONS.TITLE}</th>
                </tr>
              )}
              itemContent={(i, node) => {
                const isParent = node.children && node.children.length > 0;
                const semanticStatus = getSemanticStatus(node);
                const isOverBudget = node.profit < 0;

                return (
                  <>
                    <td className={`${COL_WIDTHS.CHECKBOX} px-4 py-3 text-center border-r border-[var(--border)]`}>
                      <input type="checkbox" className="rounded border-[var(--border)] bg-[var(--secondary)] text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0" />
                    </td>
                    <td className={`${COL_WIDTHS.INDEX} px-4 py-3 text-center text-[12px] font-bold text-[var(--text-accent)] border-r border-[var(--border)] bg-[var(--accent)]`}>
                      {node.rowIndex}
                    </td>
                    <td className={`${COL_WIDTHS.NAME_WBS} px-4 py-3 border-r border-[var(--border)]`}>
                      <div className="flex items-center" style={{ paddingLeft: `${node.level * 20}px` }}>
                        {isParent ? (
                          <button onClick={() => onToggleExpand(node.id)} className="mr-2 flex h-5 w-5 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
                            <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${node.isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>
                        ) : (
                          <div className="mr-2 w-5 flex justify-center text-[var(--text-secondary)] opacity-40 text-[10px]">●</div>
                        )}
                        <span className={`text-[13px] ${isParent ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                          {node.name === 'Foundation' ? 'Hầm & Móng' :
                            node.name === 'Structure' ? 'Kết cấu thân' :
                              node.name === 'Electrical' ? 'Cơ điện (MEP)' :
                                node.name === 'Finishing' ? 'Hoàn thiện' :
                                  node.name}
                        </span>
                      </div>
                    </td>
                    <td className={`${COL_WIDTHS.FINANCIAL} px-4 py-3 text-right text-[13px] font-bold text-[var(--text-tertiary)] border-r border-[var(--border)] tabular-nums`}>
                      {node.budget === 0 ? <span className="text-rose-500/50">0</span> : node.budget.toLocaleString()}
                    </td>
                    <td className={`${COL_WIDTHS.FINANCIAL} px-4 py-3 text-right text-[13px] font-bold text-[var(--text-primary)] border-r border-[var(--border)] tabular-nums`}>
                      {node.actual.toLocaleString()}
                    </td>
                    <td className={`${COL_WIDTHS.FINANCIAL} px-4 py-3 text-right text-[13px] font-bold border-r border-[var(--border)] tabular-nums ${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {isOverBudget ? '' : '+'}{node.profit.toLocaleString()}
                    </td>
                    <td className={`${COL_WIDTHS.PROGRESS} px-4 py-3 border-r border-[var(--border)]`}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold ${isOverBudget ? 'text-rose-500' : 'text-[var(--text-secondary)]'}`}>
                            {node.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(node.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={`${COL_WIDTHS.STATUS} px-4 py-3 text-center border-r border-[var(--border)]`}>
                      <span className={`erp-badge whitespace-nowrap inline-flex items-center justify-center rounded border px-2.5 py-1 text-[10px] font-bold shadow-sm ${statusMap[semanticStatus]}`}>
                        {semanticStatus}
                      </span>
                    </td>
                    <td className={`${COL_WIDTHS.ACTIONS} px-4 py-3 text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(node)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] shadow-sm transition-all hover:text-blue-500 hover:bg-blue-500/10"
                          title="Sửa"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onAddChild && onAddChild(node.id)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] shadow-sm transition-all hover:text-emerald-500 hover:bg-emerald-500/10"
                          title="Thêm mục con"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(node)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] shadow-sm transition-all hover:text-rose-500 hover:bg-rose-500/10"
                          title="Xóa"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </>
                );
              }}
            />
          )}

          {/* TFOOT implementation - Perfectly aligned with Header/Body */}
          <div className="border-t-2 border-[var(--border)] bg-[var(--table-head-bg)] sticky bottom-0 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
            <table className="erp-table w-full table-fixed min-w-max">
              <tbody>
                <tr className="group">
                  <td className={`${COL_WIDTHS.CHECKBOX} border-r border-[var(--border)]`}></td>
                  <td className={`${COL_WIDTHS.INDEX} border-r border-[var(--border)]`}></td>
                  <td className={`${COL_WIDTHS.NAME_WBS} px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-primary)] border-r border-[var(--border)]`}>
                    TỔNG CỘNG DỰ TOÁN DỰ ÁN
                  </td>
                  <td className={`${COL_WIDTHS.FINANCIAL} px-4 py-3 text-right ${FINANCIAL_CELL_CLASS} text-[13px] text-[var(--text-primary)] border-r border-[var(--border)]`}>
                    {totalBudget.toLocaleString()}
                  </td>
                  <td className={`${COL_WIDTHS.FINANCIAL} px-4 py-3 text-right ${FINANCIAL_CELL_CLASS} text-[13px] text-[var(--text-primary)] border-r border-[var(--border)]`}>
                    {totalActual.toLocaleString()}
                  </td>
                  <td className={`${COL_WIDTHS.FINANCIAL} px-4 py-3 text-right ${FINANCIAL_CELL_CLASS} text-[13px] border-r border-[var(--border)] ${variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {variance < 0 ? '' : '+'}{variance.toLocaleString()}
                  </td>
                  <td className={`${COL_WIDTHS.PROGRESS} px-4 py-3 text-center border-r border-[var(--border)]`}>
                    <span className="text-[12px] font-bold text-blue-500 tabular-nums">{progress.toFixed(1)}%</span>
                  </td>
                  <td className={`${COL_WIDTHS.STATUS} border-r border-[var(--border)]`}></td>
                  <td className={`${COL_WIDTHS.ACTIONS}`}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeDelete}
          isLoading={isDeleting}
          title={confirmAction?.type === 'LOCKED' ? "KHÔNG THỂ XÓA HẠNG MỤC" : "Xác nhận xóa vĩnh viễn"}
          message={
            confirmAction?.type === 'LOCKED'
              ? `Hạng mục "${confirmAction?.name}" đã có dữ liệu phân bổ (Chi phí/Dự toán). Để đảm bảo tính toàn vẹn kế toán, hệ thống khóa chức năng xóa đối với hạng mục này.`
              : `Bạn có chắc chắn muốn xóa vĩnh viễn hạng mục "${confirmAction?.name}" và toàn bộ các mục con của nó? Hành động này không thể hoàn tác.`
          }
          variant={confirmAction?.type === 'LOCKED' ? 'close' : 'danger'}
          confirmLabel={confirmAction?.type === 'LOCKED' ? "Đã hiểu" : "Xóa vĩnh viễn"}
          businessContext={confirmAction?.type === 'LOCKED' ? "Vui lòng điều chỉnh lại chứng từ tài chính (nếu nhập sai) trước khi xóa hạng mục này." : undefined}
        />
      </div>
    </>
  );
}



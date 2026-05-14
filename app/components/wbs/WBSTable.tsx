'use client';

import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { useState } from 'react';
import ConfirmModal from '@/app/components/modals/ConfirmModal';

// ... (existing WBSTableProps, FlattenedNode, flattenWBS) ...

export default function WBSTable({ nodes, onToggleExpand, onEdit, onAddChild, totalBudget, totalActual, variance, progress }: WBSTableProps) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { mutateAsync: deleteWBS } = useDeleteWBSMutation(currentProjectId);

  const flattenedNodes = useMemo(() => flattenWBS(nodes), [nodes]);

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
    'Chưa triển khai': 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--secondary)]',
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
      <div className="overflow-x-auto scrollbar-hide border border-[var(--border)] rounded-lg">
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
                <th className="w-10 text-center bg-[var(--table-head-bg)]">
                  <input type="checkbox" className="rounded border-[var(--border)] bg-[var(--secondary)] text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0" />
                </th>
                <th className="w-16 text-center bg-[var(--table-head-bg)]">Mã số</th>
                <th className="min-w-[250px] bg-[var(--table-head-bg)]">Tên hạng mục (WBS)</th>
                <th className="w-[140px] text-right bg-[var(--table-head-bg)]">Dự toán (VNĐ)</th>
                <th className="w-[140px] text-right bg-[var(--table-head-bg)]">Thực tế (VNĐ)</th>
                <th className="w-[140px] text-right bg-[var(--table-head-bg)]">Chênh lệch</th>
                <th className="w-[120px] text-center bg-[var(--table-head-bg)]">% HT</th>
                <th className="w-[120px] text-center bg-[var(--table-head-bg)]">Trạng thái</th>
                <th className="w-[120px] text-center bg-[var(--table-head-bg)]">Thao tác</th>
              </tr>
            )}
            itemContent={(i, node) => {
              const isParent = node.children && node.children.length > 0;
              const semanticStatus = getSemanticStatus(node);
              const isOverBudget = node.profit < 0;

              return (
                <>
                  <td className="px-4 py-3 text-center border-r border-[var(--border)]">
                    <input type="checkbox" className="rounded border-[var(--border)] bg-[var(--secondary)] text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0" />
                  </td>
                  <td className="px-4 py-3 text-center text-[12px] font-bold text-[var(--text-accent)] border-r border-[var(--border)] bg-[var(--accent)]">
                    {node.rowIndex}
                  </td>
                  <td className="px-4 py-3 border-r border-[var(--border)]">
                    <div className="flex items-center" style={{ paddingLeft: `${node.level * 20}px` }}>
                      {isParent ? (
                        <button onClick={() => onToggleExpand(node.id)} className="mr-2 flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
                          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${node.isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      ) : (
                        <div className="mr-2 w-5 flex justify-center text-[var(--text-muted)] opacity-30 text-[10px]">●</div>
                      )}
                      <span className={`text-[13px] ${isParent ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                        {node.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-[var(--text-tertiary)] border-r border-[var(--border)]">
                    {node.budget === 0 ? <span className="text-rose-500/50">0</span> : node.budget.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-black text-[var(--text-primary)] border-r border-[var(--border)]">
                    {node.actual.toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-right text-[13px] font-black border-r border-[var(--border)] ${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isOverBudget ? '' : '+'}{node.profit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 border-r border-[var(--border)]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black ${isOverBudget ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
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
                  <td className="px-4 py-3 text-center border-r border-[var(--border)]">
                    <span className={`erp-badge whitespace-nowrap inline-flex items-center justify-center rounded border px-2.5 py-1 text-[10px] font-bold shadow-sm ${statusMap[semanticStatus]}`}>
                      {semanticStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleEdit(node)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] shadow-sm transition-all hover:text-blue-500 hover:bg-blue-500/10" 
                        title="Sửa"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onAddChild && onAddChild(node.id)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] shadow-sm transition-all hover:text-emerald-500 hover:bg-emerald-500/10" 
                        title="Thêm mục con"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(node)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] shadow-sm transition-all hover:text-rose-500 hover:bg-rose-500/10" 
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
        
        {/* TFOOT implementation */}
        <div className="border-t-2 border-[var(--border)] bg-[var(--table-head-bg)] flex justify-between px-4 py-3 min-w-[1200px] sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
           <div className="w-[330px] text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">Tổng cộng dự án</div>
           <div className="w-[140px] text-right text-[14px] font-black text-[var(--text-primary)] tabular-nums">{totalBudget.toLocaleString()}</div>
           <div className="w-[140px] text-right text-[14px] font-black text-[var(--text-primary)] tabular-nums">{totalActual.toLocaleString()}</div>
           <div className={`w-[140px] text-right text-[14px] font-black tabular-nums ${variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {variance < 0 ? '' : '+'}{variance.toLocaleString()}
           </div>
           <div className="w-[120px] flex items-center justify-center px-4">
              <span className="text-[13px] font-black text-blue-500 tabular-nums">{progress.toFixed(1)}%</span>
           </div>
           <div className="w-[240px]"></div>
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
    </>
  );
}


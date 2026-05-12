'use client';

import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { TableVirtuoso } from 'react-virtuoso';
import { useMemo } from 'react';
import { useDeleteWBSMutation } from '@/services/queries/useWBS';

interface WBSTableProps {
  nodes: EnrichedWBSNode[];
  onToggleExpand: (id: string) => void;
  onEdit: (w: WBSItem) => void;
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

export default function WBSTable({ nodes, onToggleExpand, onEdit, totalBudget, totalActual, variance, progress }: WBSTableProps) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { mutate: deleteWBS } = useDeleteWBSMutation(currentProjectId);

  const flattenedNodes = useMemo(() => flattenWBS(nodes), [nodes]);

  const handleDelete = (node: FlattenedNode) => {
    if (window.confirm(`Bạn có chắc muốn xóa hạng mục "${node.name}" và toàn bộ hạng mục con?`)) {
      deleteWBS(node.id);
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
    'Đang thi công': 'border-green-500/30 text-green-400 bg-green-500/10',
    'Chậm tiến độ': 'border-orange-500/30 text-orange-400 bg-orange-500/10',
    'Chưa triển khai': 'border-slate-500/30 text-slate-400 bg-slate-500/10',
    'Hoàn thành': 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  };

  return (
    <div className="overflow-x-auto scrollbar-hide border border-[var(--border)] rounded-lg">
      {flattenedNodes.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--table-head-bg)]">
          Không có dữ liệu hạng mục
        </div>
      ) : (
        <TableVirtuoso
          useWindowScroll
          data={flattenedNodes}
          components={{
            Table: (props) => <table {...props} className="erp-table w-full min-w-[1200px]" />,
            TableHead: (props) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
            TableRow: (props) => {
              const node = props.item as FlattenedNode;
              const isParent = node.children && node.children.length > 0;
              return (
                <tr 
                  {...props} 
                  className={`transition-colors hover:bg-[var(--secondary)] ${isParent && node.level === 0 ? 'bg-[var(--secondary)]/50' : ''}`} 
                />
              );
            }
          }}
          fixedHeaderContent={() => (
            <tr>
              <th className="w-10 text-center bg-[var(--table-head-bg)]">
                <input type="checkbox" className="rounded border-[var(--border)] bg-[var(--secondary)] text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0" />
              </th>
              <th className="w-12 text-center bg-[var(--table-head-bg)]">#</th>
              <th className="min-w-[100px] bg-[var(--table-head-bg)]">Mã hạng mục</th>
              <th className="min-w-[200px] bg-[var(--table-head-bg)]">Tên hạng mục</th>
              <th className="w-[140px] text-right bg-[var(--table-head-bg)]">Dự toán (VND)</th>
              <th className="w-[140px] text-right bg-[var(--table-head-bg)]">Thực tế (VND)</th>
              <th className="w-[140px] text-right bg-[var(--table-head-bg)]">Chênh lệch</th>
              <th className="w-[110px] text-center bg-[var(--table-head-bg)]">% HT</th>
              <th className="w-[90px] text-center bg-[var(--table-head-bg)]">Trạng thái</th>
              <th className="w-[90px] text-center bg-[var(--table-head-bg)]">Thao tác</th>
            </tr>
          )}
          itemContent={(i, node) => {
            const isParent = node.children && node.children.length > 0;
            return (
              <>
                <td className="px-5 py-3 text-center border-r border-[var(--border)]">
                  <input type="checkbox" className="rounded border-[var(--border)] bg-[var(--secondary)] text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0" />
                </td>
                <td className="px-5 py-3 text-center text-[12px] font-medium text-[var(--text-muted)] border-r border-[var(--border)]">{node.rowIndex}</td>
                <td className="px-5 py-3 text-[13px] font-medium text-[var(--text-secondary)] border-r border-[var(--border)]">{node.code}</td>
                <td className="px-5 py-3 border-r border-[var(--border)]">
                  <div className="flex items-center" style={{ paddingLeft: `${node.level * 24}px` }}>
                    {isParent ? (
                      <button onClick={() => onToggleExpand(node.id)} className="mr-2 flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${node.isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    ) : (
                      <div className="mr-2 w-5"></div>
                    )}
                    {isParent && node.level === 0 ? (
                      <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 text-amber-500" fill="currentColor">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                    ) : (
                      <span className="mr-2 text-[var(--text-muted)]">-</span>
                    )}
                    <span className={`text-[13px] ${isParent && node.level === 0 ? 'font-bold text-[var(--text-primary)] uppercase' : 'font-medium text-[var(--text-secondary)]'}`}>
                      {node.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-[13px] font-bold text-[var(--text-primary)] border-r border-[var(--border)]">{node.budget.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-[13px] font-bold text-[var(--text-primary)] border-r border-[var(--border)]">{node.actual.toLocaleString()}</td>
                <td className={`px-5 py-3 text-right text-[13px] font-bold border-r border-[var(--border)] ${node.profit < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {node.profit.toLocaleString()}
                </td>
                <td className="px-5 py-3 w-32 border-r border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-[var(--text-secondary)] w-10 text-right">{node.percentage.toFixed(isParent ? 0 : 1)}%</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--secondary)] border border-[var(--border)]">
                      <div 
                        className={`h-full rounded-full ${node.percentage >= 100 ? 'bg-blue-500' : node.status === 'Chậm tiến độ' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(node.percentage, 100)}%` }} 
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-center border-r border-[var(--border)]">
                  <span className={`inline-flex items-center justify-center rounded border px-2 py-0.5 text-[11px] font-medium shadow-sm ${statusMap[node.status] || statusMap['Chưa triển khai']}`}>
                    {node.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => alert(`Chi tiết hạng mục: ${node.name}\nMã: ${node.code || 'N/A'}\nDự toán: ${node.budget.toLocaleString()} VND\nThực tế: ${node.actual.toLocaleString()} VND`)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]" 
                      title="Xem chi tiết"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleEdit(node)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]" 
                      title="Chỉnh sửa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(node)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] transition-colors hover:text-rose-500 hover:bg-rose-500/10" 
                      title="Xóa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
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
      
      {/* TFOOT implementation below table */}
      <div className="border-t-2 border-[var(--border)] bg-[var(--table-head-bg)] flex justify-between px-5 py-4 min-w-[1200px]">
         <div className="w-[352px] text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)]">Tổng cộng</div>
         <div className="w-[140px] text-right text-[13px] font-black text-[var(--text-primary)] tabular-nums">{totalBudget.toLocaleString()}</div>
         <div className="w-[140px] text-right text-[13px] font-black text-[var(--text-primary)] tabular-nums">{totalActual.toLocaleString()}</div>
         <div className={`w-[140px] text-right text-[13px] font-black tabular-nums ${variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {variance < 0 ? '' : '+'}{variance.toLocaleString()}
         </div>
         <div className="w-[110px] flex items-center justify-center px-5">
            <span className="text-[12px] font-black text-[var(--text-primary)] tabular-nums mr-2">{progress.toFixed(0)}%</span>
         </div>
         <div className="w-[180px]"></div>
      </div>
    </div>
  );
}

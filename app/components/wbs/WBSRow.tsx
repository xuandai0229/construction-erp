'use client';

import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';

import { useDeleteWBSMutation } from '@/services/queries/useWBS';

export default function WBSRow({ node, onToggleExpand, onEdit, index }: { node: EnrichedWBSNode, onToggleExpand: (id: string) => void, onEdit: (w: WBSItem) => void, index: string }) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { mutate: deleteWBS } = useDeleteWBSMutation(currentProjectId);
  
  const isParent = node.children && node.children.length > 0;
  const isOverBudget = node.variance < 0; 

  const handleEdit = () => {
    // Reconstruct WBSItem from EnrichedWBSNode
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

  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc muốn xóa hạng mục "${node.name}" và toàn bộ hạng mục con?`)) {
      deleteWBS(node.id);
    }
  };

  const statusMap: Record<string, string> = {
    'Đang thi công': 'border-green-500/30 text-green-400 bg-green-500/10',
    'Chậm tiến độ': 'border-orange-500/30 text-orange-400 bg-orange-500/10',
    'Chưa triển khai': 'border-slate-500/30 text-slate-400 bg-slate-500/10',
    'Hoàn thành': 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  };

  return (
    <>
      <tr className={`transition-colors hover:bg-slate-800/30 ${isParent && node.level === 0 ? 'bg-slate-800/10' : ''}`}>
        <td className="px-5 py-3 text-center border-r border-slate-800/50">
          <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0" />
        </td>
        <td className="px-5 py-3 text-center text-[12px] font-medium text-slate-500 border-r border-slate-800/50">{index}</td>
        <td className="px-5 py-3 text-[13px] font-medium text-slate-400 border-r border-slate-800/50">{node.code}</td>
        <td className="px-5 py-3 border-r border-slate-800/50">
          <div className="flex items-center" style={{ paddingLeft: `${node.level * 24}px` }}>
            {isParent ? (
              <button onClick={() => onToggleExpand(node.id)} className="mr-2 flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
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
              <span className="mr-2 text-slate-600">-</span>
            )}
            <span className={`text-[13px] ${isParent && node.level === 0 ? 'font-bold text-slate-200 uppercase' : 'font-medium text-slate-300'}`}>
              {node.name}
            </span>
          </div>
        </td>
        <td className="px-5 py-3 text-right text-[13px] font-bold text-slate-300 border-r border-slate-800/50">{node.budget.toLocaleString()}</td>
        <td className="px-5 py-3 text-right text-[13px] font-bold text-slate-300 border-r border-slate-800/50">{node.actual.toLocaleString()}</td>
        <td className={`px-5 py-3 text-right text-[13px] font-bold border-r border-slate-800/50 ${node.profit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
          {node.profit.toLocaleString()}
        </td>
        <td className="px-5 py-3 w-32 border-r border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-slate-300 w-10 text-right">{node.percentage.toFixed(isParent ? 0 : 1)}%</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div 
                className={`h-full rounded-full ${node.percentage >= 100 ? 'bg-blue-500' : node.status === 'Chậm tiến độ' ? 'bg-orange-500' : 'bg-green-500'}`} 
                style={{ width: `${Math.min(node.percentage, 100)}%` }} 
              />
            </div>
          </div>
        </td>
        <td className="px-5 py-3 text-center border-r border-slate-800/50">
          <span className={`inline-flex items-center justify-center rounded border px-2 py-0.5 text-[11px] font-medium shadow-sm ${statusMap[node.status] || statusMap['Chưa triển khai']}`}>
            {node.status}
          </span>
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center justify-center gap-1.5">
            <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white" title="Xem chi tiết">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button 
              onClick={handleEdit}
              className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white" 
              title="Chỉnh sửa"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
            <button 
              onClick={handleDelete}
              className="flex h-7 w-7 items-center justify-center rounded border border-red-900/30 bg-red-900/10 text-red-500 transition-colors hover:bg-red-900/30 hover:text-red-400" 
              title="Xóa"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      {node.isExpanded && isParent && node.children.map((child, i) => (
        <WBSRow key={child.id} node={child} onToggleExpand={onToggleExpand} onEdit={onEdit} index={node.level === 0 ? `${index}.${i + 1}` : `${index}.${i + 1}`} />
      ))}
    </>
  );
}


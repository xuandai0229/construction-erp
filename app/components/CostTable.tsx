'use client';

import { costType_LABELS, CostRecord } from '@/app/types';
import { WBSTreeNode } from '@/app/types';
import { DashboardData, formatDate, formatVnd } from './dashboard-data';
import { useERPStore } from '@/store/erpStore';

export default function CostTable({ data, onEdit }: { data: DashboardData, onEdit: (c: CostRecord) => void }) {
  const collect = (node: WBSTreeNode): [string, string][] => [
    [node.id, node.name.replace(/^\d+(\.\d+)*\s*/, '')],
    ...node.children.flatMap((child) => collect(child as WBSTreeNode)),
  ];
  const wbsNames = new Map(data.wbsTree.flatMap((node) => collect(node)));
  const deleteCost = useERPStore(state => state.deleteCost);
  const currentProjectId = useERPStore(state => state.currentProjectId);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi chi phí này?')) {
      deleteCost(currentProjectId, id);
    }
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <h3 className="text-[15px] font-extrabold text-slate-50">CHI PHÍ GẦN NHẤT</h3>
        <button className="text-xs font-semibold text-blue-400 hover:text-blue-300">Xem tất cả</button>
      </div>
      <table className="w-full table-fixed text-sm">
        <thead className="bg-slate-900 text-xs font-bold text-slate-300">
          <tr className="border-b border-slate-800">
            <th className="w-[12%] px-4 py-3 text-left">Ngày</th>
            <th className="w-[20%] px-4 py-3 text-left">Nội dung</th>
            <th className="w-[15%] px-4 py-3 text-left">Hạng mục</th>
            <th className="w-[15%] px-4 py-3 text-left">Loại chi phí</th>
            <th className="w-[18%] px-4 py-3 text-left">Nhà cung cấp</th>
            <th className="w-[16%] px-4 py-3 text-right">Số tiền</th>
            <th className="w-[14%] px-4 py-3 text-left">Trạng thái</th>
            <th className="w-[12%] px-4 py-3 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {[...data.costs]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5)
            .map((cost) => (
              <tr key={cost.id} className="border-b border-slate-800/80 hover:bg-slate-800/40">
                <td className="px-4 py-2.5 text-slate-100">{formatDate(cost.date)}</td>
                <td className="truncate px-4 py-2.5 font-medium text-slate-100" title={cost.note ?? ''}>{cost.note ?? 'No description'}</td>
                <td className="truncate px-4 py-2.5 text-slate-300">{wbsNames.get(cost.wbsId) ?? cost.wbsId}</td>
                <td className="px-4 py-2.5 text-slate-300">{costType_LABELS[cost.costType]}</td>
                <td className="truncate px-4 py-2.5 text-slate-300">{cost.supplier}</td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-100">{formatVnd(cost.amount)}</td>
                <td className={`px-4 py-2.5 font-extrabold ${cost.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {cost.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(cost)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(cost.id)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}


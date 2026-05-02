'use client';

import { COST_TYPE_LABELS } from '@/app/types';
import { WBSTreeNode } from '@/app/types';
import { DashboardData, formatDate, formatVnd } from './dashboard-data';

export default function CostTable({ data }: { data: DashboardData }) {
  const collect = (node: WBSTreeNode): [string, string][] => [
    [node.id, node.name.replace(/^\d+(\.\d+)*\s*/, '')],
    ...node.children.flatMap((child) => collect(child as WBSTreeNode)),
  ];
  const wbsNames = new Map(data.wbsTree.flatMap((node) => collect(node)));

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
            <th className="w-[24%] px-4 py-3 text-left">Nội dung</th>
            <th className="w-[15%] px-4 py-3 text-left">Hạng mục</th>
            <th className="w-[15%] px-4 py-3 text-left">Loại chi phí</th>
            <th className="w-[18%] px-4 py-3 text-left">Nhà cung cấp</th>
            <th className="w-[16%] px-4 py-3 text-right">Số tiền</th>
            <th className="w-[14%] px-4 py-3 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {[...data.costs]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5)
            .map((cost) => (
              <tr key={cost.id} className="border-b border-slate-800/80 hover:bg-slate-800/40">
                <td className="px-4 py-2.5 text-slate-100">{formatDate(cost.date)}</td>
                <td className="truncate px-4 py-2.5 font-medium text-slate-100">{cost.note}</td>
                <td className="truncate px-4 py-2.5 text-slate-300">{wbsNames.get(cost.wbs_id) ?? cost.wbs_id}</td>
                <td className="px-4 py-2.5 text-slate-300">{COST_TYPE_LABELS[cost.cost_type]}</td>
                <td className="truncate px-4 py-2.5 text-slate-300">{cost.supplier}</td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-100">{formatVnd(cost.amount)}</td>
                <td className={`px-4 py-2.5 font-extrabold ${cost.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {cost.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}

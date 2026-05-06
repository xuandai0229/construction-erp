'use client';

import { EnrichedWBSNode, WBSItem } from '@/app/types';
import WBSRow from './WBSRow';

interface WBSTableProps {
  nodes: EnrichedWBSNode[];
  onToggleExpand: (id: string) => void;
  onEdit: (w: WBSItem) => void;
  totalBudget: number;
  totalActual: number;
  variance: number;
  progress: number;
}

export default function WBSTable({ nodes, onToggleExpand, onEdit, totalBudget, totalActual, variance, progress }: WBSTableProps) {
  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-4 text-center w-10 border-r border-slate-800">
                <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0" />
              </th>
              <th className="px-5 py-4 text-center w-12 border-r border-slate-800">#</th>
              <th className="px-5 py-4 border-r border-slate-800">Mã hạng mục</th>
              <th className="px-5 py-4 border-r border-slate-800">Tên hạng mục</th>
              <th className="px-5 py-4 text-right border-r border-slate-800">Dự toán (VND)</th>
              <th className="px-5 py-4 text-right border-r border-slate-800">Chi phí thực tế (VND)</th>
              <th className="px-5 py-4 text-right border-r border-slate-800">Lợi nhuận (VND)</th>
              <th className="px-5 py-4 text-center w-36 border-r border-slate-800">% HT</th>
              <th className="px-5 py-4 text-center border-r border-slate-800">Trạng thái</th>
              <th className="px-5 py-4 text-center w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {nodes.map((node, index) => (
              <WBSRow key={node.id} node={node} onToggleExpand={onToggleExpand} onEdit={onEdit} index={(index + 1).toString()} />
            ))}
            {nodes.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-center text-slate-500">
                  Không có dữ liệu hạng mục
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t-2 border-slate-700 bg-slate-800/40">
            <tr>
              <td colSpan={4} className="px-5 py-4 text-center font-black uppercase tracking-widest text-slate-200 border-r border-slate-800">
                Tổng cộng
              </td>
              <td className="px-5 py-4 text-right text-[14px] font-black text-slate-200 border-r border-slate-800">
                {totalBudget.toLocaleString()}
              </td>
              <td className="px-5 py-4 text-right text-[14px] font-black text-slate-200 border-r border-slate-800">
                {totalActual.toLocaleString()}
              </td>
              <td className={`px-5 py-4 text-right text-[14px] font-black border-r border-slate-800 ${variance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {variance.toLocaleString()}
              </td>
              <td className="px-5 py-4 text-right text-[14px] font-black text-blue-400 border-r border-slate-800">
                {(totalBudget - totalActual).toLocaleString()}
              </td>
              <td className="px-5 py-4 text-center border-r border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-slate-200 w-10 text-right">{progress.toFixed(0)}%</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/30 px-5 py-3">
        <div className="text-[13px] text-slate-400">
          Hiển thị <span className="font-semibold text-slate-200">1</span> đến <span className="font-semibold text-slate-200">15</span> trong tổng số <span className="font-semibold text-slate-200">156</span> hạng mục
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-900/20">
            1
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            2
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            3
          </button>
          <span className="text-slate-500">...</span>
          <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <div className="ml-4 flex items-center gap-2">
            <div className="relative">
              <select className="h-8 appearance-none rounded border border-slate-700 bg-slate-800/50 py-0 pl-2 pr-6 text-[13px] text-slate-300 outline-none focus:border-blue-500">
                <option>15 / trang</option>
                <option>30 / trang</option>
                <option>50 / trang</option>
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


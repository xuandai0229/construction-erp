'use client';

import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';

export default function RevenueListPage() {
  const revenues = useERPStore(state => state.revenues);
  const wbs = useERPStore(state => state.wbs);
  const updateRevenue = useERPStore(state => state.updateRevenue);

  const getWbsName = (id: string) => wbs.find(w => w.id === id)?.name || 'N/A';

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    updateRevenue(id, { status: newStatus as any });
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100">
      <Sidebar activeItem="revenue" />
      <main className="ml-[258px] flex-1">
        <Header />
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Danh sách doanh thu</h1>
            <p className="text-slate-400 text-sm">Quản lý các khoản thu và trạng thái thanh toán</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                  <th className="px-5 py-4 text-left">Ngày</th>
                  <th className="px-5 py-4 text-left">Hạng mục (WBS)</th>
                  <th className="px-5 py-4 text-left">Diễn giải</th>
                  <th className="px-5 py-4 text-right">Số tiền</th>
                  <th className="px-5 py-4 text-center">Trạng thái</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((rev) => (
                  <tr key={rev.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-5 py-4 text-slate-400">{formatDate(rev.date)}</td>
                    <td className="px-5 py-4 font-medium text-slate-200">{getWbsName(rev.wbs_id)}</td>
                    <td className="px-5 py-4 text-slate-400">{rev.description}</td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-400">{formatVnd(rev.amount)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${rev.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30'}`}>
                        {rev.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => handleToggleStatus(rev.id, rev.status)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4"
                      >
                        {rev.status === 'paid' ? 'Đánh dấu chưa thu' : 'Xác nhận đã thu'}
                      </button>
                    </td>
                  </tr>
                ))}
                {revenues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">Chưa có bản ghi doanh thu nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

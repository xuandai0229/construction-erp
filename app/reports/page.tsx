'use client';

import { useMemo, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import { exportToCsv } from '@/app/services/export.service';

export default function ReportsPage() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const projects = useERPStore(state => state.projects);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const getMonthlyReport = useERPStore(state => state.getMonthlyReport);
  const getAgingReport = useERPStore(state => state.getAgingReport);
  const locks = useERPStore(state => state.locks);
  const toggleLock = useERPStore(state => state.toggleLock);
  
  const monthlyData = useMemo(() => getMonthlyReport(currentProjectId), [currentProjectId, getMonthlyReport]);
  const agingData = useMemo(() => getAgingReport(currentProjectId), [currentProjectId, getAgingReport]);

  const agingCategories = ['0-30', '31-60', '61-90', '90+'];

  const handleExport = () => {
    const project = projects.find(p => p.id === currentProjectId);
    const filename = `BC_Thang_${project?.name || 'Project'}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCsv(filename, monthlyData);
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100">
      <Sidebar activeItem="reports" />
      <main className="ml-[258px] flex-1">
        <Header />
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Báo cáo tài chính & Quản trị</h1>
              <p className="text-slate-400 text-sm">Phân tích dòng tiền, công nợ và chốt kỳ kế toán</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={currentProjectId}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="h-10 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm text-slate-200 outline-none"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button 
                onClick={handleExport}
                className="flex h-10 items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 text-sm font-bold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                </svg>
                Xuất Excel/CSV
              </button>
            </div>
          </div>

          {/* Monthly Report Table */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-1">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-200">Báo cáo kết quả kinh doanh theo tháng</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Kỳ đã chốt (không thể sửa dữ liệu)
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <th className="px-5 py-3 text-left">Tháng</th>
                    <th className="px-5 py-3 text-right">Dòng tiền vào</th>
                    <th className="px-5 py-3 text-right">Dòng tiền ra</th>
                    <th className="px-5 py-3 text-right">Doanh thu</th>
                    <th className="px-5 py-3 text-right">Chi phí</th>
                    <th className="px-5 py-3 text-right">Lợi nhuận</th>
                    <th className="px-5 py-3 text-right">Số dư</th>
                    <th className="px-5 py-3 text-center">Chốt kỳ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row) => {
                    const isLocked = locks.includes(row.month);
                    return (
                      <tr key={row.month} className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${isLocked ? 'bg-rose-500/5' : ''}`}>
                        <td className="px-5 py-4 font-bold text-slate-200">
                          <div className="flex items-center gap-2">
                            {isLocked && <svg viewBox="0 0 24 24" className="h-3 w-3 text-rose-500" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>}
                            {row.month}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-emerald-400 font-medium">{formatVnd(row.cashIn)}</td>
                        <td className="px-5 py-4 text-right text-rose-400 font-medium">{formatVnd(row.cashOut)}</td>
                        <td className="px-5 py-4 text-right text-slate-300">{formatVnd(row.revenue)}</td>
                        <td className="px-5 py-4 text-right text-slate-300">{formatVnd(row.cost)}</td>
                        <td className={`px-5 py-4 text-right font-bold ${row.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatVnd(row.profit)}
                        </td>
                        <td className={`px-5 py-4 text-right font-extrabold ${row.runningBalance >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                          {formatVnd(row.runningBalance)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button 
                            onClick={() => toggleLock(row.month)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${isLocked ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}
                          >
                            {isLocked ? 'Mở khóa' : 'Chốt kỳ'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {monthlyData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-500 italic">Chưa có dữ liệu phát sinh</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Aging Report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 bg-emerald-500/5">
                <h3 className="text-lg font-bold text-emerald-400">Phân tích tuổi nợ Phải thu (Receivable)</h3>
              </div>
              <div className="p-5 space-y-4">
                {agingCategories.map(cat => {
                  const items = agingData.filter(i => i.type === 'receivable' && i.category === cat);
                  const total = items.reduce((sum, i) => sum + i.amount, 0);
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat} ngày</span>
                        <div className="text-lg font-extrabold text-slate-100">{formatVnd(total)}</div>
                      </div>
                      <div className="text-xs text-slate-400">{items.length} khoản nợ</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 bg-rose-500/5">
                <h3 className="text-lg font-bold text-rose-400">Phân tích tuổi nợ Phải trả (Payable)</h3>
              </div>
              <div className="p-5 space-y-4">
                {agingCategories.map(cat => {
                  const items = agingData.filter(i => i.type === 'payable' && i.category === cat);
                  const total = items.reduce((sum, i) => sum + i.amount, 0);
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat} ngày</span>
                        <div className="text-lg font-extrabold text-slate-100">{formatVnd(total)}</div>
                      </div>
                      <div className="text-xs text-slate-400">{items.length} khoản nợ</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}


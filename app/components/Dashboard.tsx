'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import KPISection from './KPISection';
import ChartSection from './ChartSection';
import WBSTable from './WBSTable';
import CostTable from './CostTable';
import DebtPanel from './DebtPanel';
import ProfitPanel from './ProfitPanel';
import { useERPStore } from '@/store/erpStore';
import AddCostModal from './modals/AddCostModal';
import { CostRecord } from '../types';

export default function Dashboard() {
  const init = useERPStore(state => state.init);
  const getDashboardData = useERPStore(state => state.getDashboardData);
  const projects = useERPStore(state => state.projects);
  const costs = useERPStore(state => state.costs);
  const budgets = useERPStore(state => state.budgets);
  const isInitialized = useERPStore(state => state.initialized);

  useEffect(() => {
    init();
  }, [init]);

  const data = getDashboardData();
  const [editingCost, setEditingCost] = useState<CostRecord | null>(null);

  console.log('[UI] Dashboard Render', { isInitialized, hasProjects: projects.length > 0 });

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100">
        <Sidebar activeItem="overview" />
        <main className="ml-[258px] grid min-h-screen place-items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <div className="text-sm font-medium text-slate-400">Đang tải dữ liệu...</div>
          </div>
        </main>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100">
        <Sidebar activeItem="overview" />
        <main className="ml-[258px] grid min-h-screen place-items-center">
          <div className="flex flex-col items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-16 w-16 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-300">Chưa có dự án nào</h3>
            <p className="text-sm text-slate-500">Vui lòng tạo dự án mới ở mục Dự án để xem báo cáo.</p>
          </div>
        </main>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <Sidebar activeItem="overview" />
      <main className="ml-[258px] min-h-screen">
        <Header data={data} />
        <div className="space-y-5 px-6 py-5">
          <KPISection data={data} />
          <ChartSection data={data} />
          <div className="grid grid-cols-[1.05fr_1.25fr] gap-4">
            <WBSTable data={data} />
            <div className="space-y-4">
              <CostTable data={data} onEdit={setEditingCost} />
              <div className="grid grid-cols-[1.05fr_.95fr] gap-4">
                <DebtPanel data={data} />
                <ProfitPanel data={data} />
              </div>
            </div>
          </div>
          <footer className="py-2 text-center text-xs text-slate-500">© 2024 Construction ERP. All rights reserved.</footer>
        </div>
      </main>

      <AddCostModal 
        isOpen={!!editingCost} 
        onClose={() => setEditingCost(null)} 
        costRecord={editingCost} 
      />
    </div>
  );
}

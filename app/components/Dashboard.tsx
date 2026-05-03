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

  const data = isInitialized && projects.length > 0 ? getDashboardData() : null;
  const [editingCost, setEditingCost] = useState<CostRecord | null>(null);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100">
        <Sidebar activeItem="overview" />
        <main className="ml-[258px] grid min-h-screen place-items-center">
          <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-4 text-sm font-semibold text-slate-300">Đang tải dữ liệu dự án...</div>
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

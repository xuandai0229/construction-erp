'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { EnterpriseSection } from '@/app/components/ui-enterprise';
import { InventoryReportFilterBar } from '@/app/components/inventory/InventoryReportFilterBar';
import { InOutBalanceTable } from '@/app/components/inventory/InOutBalanceTable';

export default function InOutBalanceReportPage() {
  const [filters, setFilters] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="reports" />
      <main className="erp-page-main flex-1 flex flex-col h-screen overflow-hidden pl-[var(--erp-sidebar-width)]">
        <Header data={{ project: { name: "Báo cáo Nhập Xuất Tồn Kho" } } as any} />
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-zinc-50/30">
          <EnterpriseSection title="BÁO CÁO NHẬP XUẤT TỒN KHO" subtitle="Tổng hợp số dư đầu kỳ, phát sinh nhập xuất trong kỳ, và số dư tồn kho cuối kỳ">
            {null}
          </EnterpriseSection>
          <InventoryReportFilterBar onFilterChange={setFilters} showMaterialSelect={false} />
          <InOutBalanceTable filters={filters} />
        </div>
      </main>
    </div>
  );
}

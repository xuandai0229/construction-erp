'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { EnterpriseSection } from '@/app/components/ui-enterprise';
import { InventoryReportFilterBar } from '@/app/components/inventory/InventoryReportFilterBar';
import { StockCardTable } from '@/app/components/inventory/StockCardTable';
import { useRouter } from 'next/navigation';

export default function StockCardReportPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<any>(null);
  const sidebarCollapsed = useERPStore((state) => state.sidebarCollapsed);

  const handleDrillDown = (docNo: string) => {
    router.push(`/inventory?tab=documents&docNo=${docNo}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="reports" />
      <main className={`erp-page-main flex-1 flex flex-col h-screen overflow-hidden ${sidebarCollapsed ? 'pl-[var(--erp-sidebar-collapsed)]' : 'pl-[var(--erp-sidebar-width)]'}`}>
        <Header data={{ project: { name: "Báo cáo Thẻ Kho Vật Tư" } } as any} />
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          <EnterpriseSection
            title="BÁO CÁO THẺ KHO CHI TIẾT"
            subtitle="Theo dõi biến động xuất nhập tồn lũy kế của một loại vật tư cụ thể"
          >
            {null}
          </EnterpriseSection>
          <InventoryReportFilterBar onFilterChange={setFilters} showMaterialSelect={true} />
          <StockCardTable filters={filters} onDrillDown={handleDrillDown} />
        </div>
      </main>
    </div>
  );
}

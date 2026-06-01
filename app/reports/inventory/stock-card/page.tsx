'use client';

import { useState } from 'react';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import { InventoryReportFilterBar } from '@/app/components/inventory/InventoryReportFilterBar';
import { StockCardTable } from '@/app/components/inventory/StockCardTable';
import { useRouter } from 'next/navigation';

export default function StockCardReportPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<any>(null);

  const handleDrillDown = (docNo: string) => {
    router.push(`/inventory?tab=documents&docNo=${docNo}`);
  };

  return (
    <EnterpriseAppShell activeItem="reports">
      <EnterpriseHeader
        title="BÁO CÁO THẺ KHO CHI TIẾT"
        subtitle="Theo dõi biến động xuất nhập tồn lũy kế của một loại vật tư cụ thể tại kho bãi"
      />
      <EnterprisePageContainer>
        <InventoryReportFilterBar onFilterChange={setFilters} showMaterialSelect={true} />
        <div className="mt-4">
          <StockCardTable filters={filters} onDrillDown={handleDrillDown} />
        </div>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

'use client';

import { useState } from 'react';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import { InventoryReportFilterBar } from '@/app/components/inventory/InventoryReportFilterBar';
import { InOutBalanceTable } from '@/app/components/inventory/InOutBalanceTable';

export default function InOutBalanceReportPage() {
  const [filters, setFilters] = useState<any>(null);

  return (
    <EnterpriseAppShell activeItem="reports">
      <EnterpriseHeader
        title="BÁO CÁO NHẬP XUẤT TỒN KHO"
        subtitle="Tổng hợp số dư đầu kỳ, phát sinh nhập xuất trong kỳ, và số dư tồn kho cuối kỳ"
      />
      <EnterprisePageContainer>
        <InventoryReportFilterBar onFilterChange={setFilters} showMaterialSelect={false} />
        <div className="mt-4">
          <InOutBalanceTable filters={filters} />
        </div>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

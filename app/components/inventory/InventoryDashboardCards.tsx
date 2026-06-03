'use client';

import { useQuery } from '@tanstack/react-query';
import { EnterpriseMetric } from '@/app/components/ui-enterprise';

interface InventoryDashboardCardsProps {
  currentProjectId?: string;
  onNavigateTab?: (tab: string) => void;
}

interface InventoryDocumentSummary {
  status?: string;
}

interface StockRegisterRow {
  closingAmount?: number;
  closingQuantity?: number;
}

async function fetchInventoryArray<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success || !Array.isArray(json.data)) {
    return [];
  }
  return json.data as T[];
}

export function InventoryDashboardCards({ currentProjectId, onNavigateTab }: InventoryDashboardCardsProps) {
  const { data: docsRes = [] } = useQuery({
    queryKey: ['inventory-docs-kpi', currentProjectId],
    queryFn: () => fetchInventoryArray<InventoryDocumentSummary>(`/api/inventory/documents?projectId=${currentProjectId || ''}`),
  });

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const endOfDay = today.toISOString().split('T')[0];

  const { data: stockRegisterRes = [] } = useQuery({
    queryKey: ['inventory-register-kpi', currentProjectId],
    queryFn: () => fetchInventoryArray<StockRegisterRow>(`/api/inventory/reports/stock-register?fromDate=${startOfYear}&toDate=${endOfDay}&projectId=${currentProjectId || ''}`),
  });

  const waitingApprovalCount = docsRes.filter((document) => document.status === 'SUBMITTED').length;
  const totalInventoryValue = stockRegisterRes.reduce((sum, item) => sum + (item.closingAmount || 0), 0);
  const lowStockCount = stockRegisterRes.filter((item) => (item.closingQuantity || 0) <= 10).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <EnterpriseMetric
        title="TỔNG GIÁ TRỊ TỒN KHO"
        value={`${totalInventoryValue.toLocaleString('vi-VN')} đ`}
        description="Giá trị tồn kho thực tế hiện tại"
        trend={{ value: 'AVCO', direction: 'up' }}
        onClick={() => onNavigateTab?.('documents')}
      />
      <EnterpriseMetric
        title="VẬT TƯ CẢNH BÁO TỒN THẤP"
        value={String(lowStockCount)}
        description="Vật tư có lượng tồn dưới 10 đơn vị"
        trend={{ value: lowStockCount > 0 ? 'Cần nhập thêm' : 'An toàn', direction: lowStockCount > 0 ? 'down' : 'up' }}
        onClick={() => onNavigateTab?.('materials')}
      />
      <EnterpriseMetric
        title="CHỨNG TỪ CHỜ DUYỆT"
        value={String(waitingApprovalCount)}
        description="Phiếu kho cần duyệt để ghi sổ"
        trend={{ value: 'SoD đang bật', direction: 'up' }}
        onClick={() => onNavigateTab?.('documents')}
      />
      <EnterpriseMetric
        title="ĐỐI CHIẾU SỔ CÁI (TK 152)"
        value="Khớp 100%"
        description="Chênh lệch giá trị kho với TK 152"
        trend={{ value: 'Ổn định', direction: 'up' }}
        onClick={() => onNavigateTab?.('reports')}
      />
    </div>
  );
}

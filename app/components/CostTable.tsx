'use client';

import { DashboardData, formatVnd, formatDate } from './dashboard-data';
import { CostRecord } from '../types';

export default function CostTable({
  data,
  onEdit,
}: {
  data: DashboardData;
  onEdit?: (record: CostRecord) => void;
}) {
  const latestCosts = [...data.costs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const getWbsName = (id: string) => data.wbs.find(w => w.id === id)?.name || 'N/A';

  const COST_TYPE_LABELS: Record<string, string> = {
    'material': 'Vật liệu',
    'labor':    'Nhân công',
    'machine':  'Máy móc',
    'subcon':   'Thầu phụ',
    'other':    'Khác',
  };

  return (
    <div className="erp-card flex flex-col h-full">
      <div className="erp-panel-header">
        <h3 className="t-section-title">Chi phí gần nhất</h3>
        <button className="text-[12px] font-bold text-[var(--brand)] hover:underline">Xem tất cả</button>
      </div>
      
      <div className="erp-table-wrap flex-1 border-none rounded-none">
        <table className="erp-table zebra">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Nội dung</th>
              <th>Hạng mục</th>
              <th>Loại</th>
              <th className="text-right">Số tiền (VND)</th>
              <th className="text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {latestCosts.map((cost) => (
              <tr key={cost.id} className="cursor-pointer group" onClick={() => onEdit?.(cost)}>
                <td className="whitespace-nowrap text-[var(--text-secondary)]">{formatDate(cost.date)}</td>
                <td className="font-semibold text-[var(--text-primary)]">{cost.description}</td>
                <td className="text-[var(--text-secondary)]">{getWbsName(cost.wbsId)}</td>
                <td>
                  <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                    {COST_TYPE_LABELS[cost.costType] || cost.costType}
                  </span>
                </td>
                <td className="text-right text-money text-[var(--brand)]">
                  {formatVnd(cost.amount)}
                </td>
                <td className="text-center">
                  <span className={`badge ${cost.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {cost.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </span>
                </td>
              </tr>
            ))}
            {latestCosts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[var(--text-muted)] italic">
                  Chưa có phát sinh chi phí
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

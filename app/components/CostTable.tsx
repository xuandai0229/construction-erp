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
    .slice(0, 10);

  const getWbsName = (id: string) => data.wbs.find(w => w.id === id)?.name || 'N/A';

  const COST_TYPE_LABELS: Record<string, string> = {
    'material': 'Vật liệu',
    'labor':    'Nhân công',
    'machine':  'Máy móc',
    'subcon':   'Thầu phụ',
    'other':    'Khác',
  };

  return (
    <div className="erp-card flex flex-col h-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ height: '44px', padding: '0 var(--sp-16)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHI PHÍ GẦN NHẤT</h3>
        <button style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>Xem tất cả</button>
      </div>
      
      <div className="erp-table-wrap flex-1 border-none rounded-none overflow-y-auto">
        <table className="erp-table zebra">
          <thead>
            <tr>
              <th style={{ width: '80px', paddingLeft: 'var(--sp-16)', fontSize: '11px', color: 'var(--text-secondary)', background: '#F9FAFB' }}>Ngày</th>
              <th style={{ fontSize: '11px', color: 'var(--text-secondary)', background: '#F9FAFB' }}>Nội dung</th>
              <th style={{ fontSize: '11px', color: 'var(--text-secondary)', background: '#F9FAFB' }}>Hạng mục</th>
              <th style={{ fontSize: '11px', color: 'var(--text-secondary)', background: '#F9FAFB' }}>Loại</th>
              <th className="text-right" style={{ fontSize: '11px', color: 'var(--text-secondary)', background: '#F9FAFB' }}>Số tiền (VND)</th>
              <th className="text-center" style={{ width: '100px', fontSize: '11px', color: 'var(--text-secondary)', background: '#F9FAFB' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {latestCosts.map((cost) => (
              <tr key={cost.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onEdit?.(cost)} style={{ height: '36px' }}>
                <td style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: 'var(--sp-16)' }}>{formatDate(cost.date)}</td>
                <td style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500 }}>{cost.supplier || 'N/A'}</td>
                <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{getWbsName(cost.wbsId)}</td>
                <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{COST_TYPE_LABELS[cost.costType] || cost.costType}</td>
                <td className="text-right" style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontSize: '11px' }}>
                  {formatVnd(cost.amount)}
                </td>
                <td className="text-center">
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: cost.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                  }}>
                    {cost.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </div>
                </td>
              </tr>
            ))}
            {latestCosts.length === 0 && (
              <tr><td colSpan={6} style={{ height: '200px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>Chưa có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
    <div className="erp-card flex flex-col h-full" style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '40px', padding: '0 16px', borderBottom: '2px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, #f9fafb 0%, #f0f1f5 100%)' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Chi phí gần nhất</h3>
        <button style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease', padding: '4px 8px' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')} onMouseLeave={(e) => (e.currentTarget.style.color = '#2563eb')}>Xem tất cả →</button>
      </div>
      
      <div className="erp-table-wrap flex-1 border-none rounded-none overflow-y-auto">
        <table className="erp-table zebra">
          <thead>
            <tr>
              <th style={{ width: '70px', paddingLeft: '16px', fontSize: '11px', fontWeight: 700, color: '#6b7280', background: 'linear-gradient(180deg, #f3f4f6 0%, #f0f1f5 100%)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #d1d5db' }}>Ngày</th>
              <th style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', background: 'linear-gradient(180deg, #f3f4f6 0%, #f0f1f5 100%)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #d1d5db' }}>Nội dung</th>
              <th style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', background: 'linear-gradient(180deg, #f3f4f6 0%, #f0f1f5 100%)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #d1d5db' }}>Hạng mục</th>
              <th style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', background: 'linear-gradient(180deg, #f3f4f6 0%, #f0f1f5 100%)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #d1d5db' }}>Loại</th>
              <th className="text-right" style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', background: 'linear-gradient(180deg, #f3f4f6 0%, #f0f1f5 100%)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #d1d5db', paddingRight: '16px' }}>Số tiền</th>
              <th className="text-center" style={{ width: '90px', fontSize: '11px', fontWeight: 700, color: '#6b7280', background: 'linear-gradient(180deg, #f3f4f6 0%, #f0f1f5 100%)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #d1d5db' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {latestCosts.map((cost) => (
              <tr key={cost.id} className="cursor-pointer" onClick={() => onEdit?.(cost)} style={{ height: '38px', transition: 'background-color 0.15s ease', borderBottom: '1px solid #f0f0f0' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')} onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                <td style={{ fontSize: '12px', color: '#6b7280', paddingLeft: '16px', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatDate(cost.date)}</td>
                <td style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>{cost.supplier || '—'}</td>
                <td style={{ fontSize: '12px', color: '#6b7280' }}>{getWbsName(cost.wbsId)}</td>
                <td style={{ fontSize: '12px', color: '#6b7280' }}>{COST_TYPE_LABELS[cost.costType] || cost.costType}</td>
                <td className="text-right" style={{ fontWeight: 700, color: '#1f2937', fontVariantNumeric: 'tabular-nums', fontSize: '12px', paddingRight: '16px' }}>
                  {formatVnd(cost.amount)}
                </td>
                <td className="text-center">
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: cost.status === 'paid' ? '#10B981' : '#F59E0B',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: cost.status === 'paid' ? '#ecfdf5' : '#fffbeb',
                    display: 'inline-block',
                    minWidth: '70px'
                  }}>
                    {cost.status === 'paid' ? 'Thanh toán' : 'Chờ TT'}
                  </div>
                </td>
              </tr>
            ))}
            {latestCosts.length === 0 && (
              <tr><td colSpan={6} style={{ height: '140px', textAlign: 'center', fontSize: '12px', color: '#9CA3AF', paddingTop: '40px' }}>Chưa có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

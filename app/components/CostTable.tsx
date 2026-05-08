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
    <div className="erp-card flex flex-col h-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderRadius: '12px' }}>
      <div style={{ height: '44px', padding: '0 var(--sp-16)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHI PHÍ GẦN NHẤT</h3>
        <button style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')} onMouseLeave={(e) => (e.currentTarget.style.color = '#2563eb')}>Xem tất cả</button>
      </div>
      
      <div className="erp-table-wrap flex-1 border-none rounded-none overflow-y-auto">
        <table className="erp-table zebra">
          <thead>
            <tr>
              <th style={{ width: '80px', paddingLeft: 'var(--sp-16)', fontSize: '12px', fontWeight: 700, color: '#94a3b8', background: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ngày</th>
              <th style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', background: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nội dung</th>
              <th style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', background: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hạng mục</th>
              <th style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', background: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loại</th>
              <th className="text-right" style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', background: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Số tiền (VND)</th>
              <th className="text-center" style={{ width: '100px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', background: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {latestCosts.map((cost) => (
              <tr key={cost.id} className="cursor-pointer" onClick={() => onEdit?.(cost)} style={{ height: '44px', transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                <td style={{ fontSize: '12px', color: '#64748b', paddingLeft: 'var(--sp-16)', fontVariantNumeric: 'tabular-nums' }}>{formatDate(cost.date)}</td>
                <td style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>{cost.supplier || 'N/A'}</td>
                <td style={{ fontSize: '12px', color: '#64748b' }}>{getWbsName(cost.wbsId)}</td>
                <td style={{ fontSize: '12px', color: '#64748b' }}>{COST_TYPE_LABELS[cost.costType] || cost.costType}</td>
                <td className="text-right" style={{ fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                  {formatVnd(cost.amount)}
                </td>
                <td className="text-center">
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: cost.status === 'paid' ? '#10B981' : '#F59E0B',
                  }}>
                    {cost.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </div>
                </td>
              </tr>
            ))}
            {latestCosts.length === 0 && (
              <tr><td colSpan={6} style={{ height: '200px', textAlign: 'center', fontSize: '12px', color: '#9CA3AF' }}>Chưa có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

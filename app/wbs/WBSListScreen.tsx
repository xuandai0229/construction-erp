'use client';

import { useMemo, useState } from 'react';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import AddWBSModal from '@/app/components/modals/AddWBSModal';
import { formatVnd } from '@/app/components/dashboard-data';
import {
  Column,
  EnterpriseBadge,
  EnterpriseCard,
  EnterpriseEmptyState,
  EnterpriseFilterBar,
  EnterpriseMetric,
  EnterpriseSection,
  EnterpriseTable,
  FormGroup,
  Input,
  EnterpriseActionMenu
} from '@/app/components/ui-enterprise';
import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { useWBSQuery } from '@/services/queries/useWBS';

export default function WBSListScreen() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { data, isLoading } = useWBSQuery(currentProjectId);
  const rawTree = data?.tree || [];
  const flatWbs = data?.flat || [];

  const [editingWBS, setEditingWBS] = useState<WBSItem | null>(null);
  const [isAddingWBS, setIsAddingWBS] = useState(false);
  const [initialParentId, setInitialParentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const rows = useMemo(() => {
    const flatten = (nodes: any[], prefix = ''): EnrichedWBSNode[] => {
      return nodes.flatMap((node, index) => {
        const rowIndex = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        return [
          { ...node, rowIndex },
          ...flatten(node.children || [], rowIndex),
        ];
      });
    };

    const query = searchTerm.trim().toLowerCase();
    return flatten(rawTree).filter((node: any) => {
      if (!query) return true;
      return String(node.name || '').toLowerCase().includes(query) || String(node.code || '').toLowerCase().includes(query);
    });
  }, [rawTree, searchTerm]);

  const stats = useMemo(() => {
    const totalBudget = rawTree.reduce((sum: number, node: any) => sum + Number(node.budget || 0), 0);
    const totalActual = rawTree.reduce((sum: number, node: any) => sum + Number(node.actual || 0), 0);
    const variance = totalBudget - totalActual;
    const progress = totalBudget > 0 ? Math.min(100, (totalActual / totalBudget) * 100) : 0;
    return { totalItems: flatWbs.length, totalBudget, totalActual, variance, progress };
  }, [rawTree, flatWbs]);

  const handleExport = () => {
    if (flatWbs.length === 0) return;
    const headers = ['Mã', 'Tên hạng mục', 'Ngân sách', 'Thực tế', 'Chênh lệch', 'Tiến độ (%)'];
    const body = flatWbs.map((w: any) => {
      const budget = Number(w.budget || 0);
      const actual = Number(w.actual || 0);
      const variance = budget - actual;
      const progress = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0;
      return [`"${w.code || ''}"`, `"${String(w.name || '').replace(/"/g, '""')}"`, budget, actual, variance, `${progress.toFixed(1)}%`];
    });
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + body.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WBS_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: Column<any>[] = [
    { header: 'Mã', accessor: row => row.rowIndex, align: 'center', width: '90px', minWidth: '70px' },
    { 
      header: 'Hạng mục thi công', 
      accessor: row => {
        const level = row.rowIndex ? row.rowIndex.split('.').length - 1 : 0;
        return (
          <span 
            style={{ paddingLeft: `${level * 16}px` }} 
            className={`${level === 0 ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'} block`}
          >
            {level > 0 && <span className="text-[var(--text-muted)] mr-1.5">└─</span>}
            {row.name}
          </span>
        );
      }, 
      width: '380px', 
      minWidth: '260px' 
    },
    { header: 'Ngân sách', accessor: row => formatVnd(row.budget || 0), align: 'right', width: '170px', minWidth: '130px' },
    { header: 'Thực tế', accessor: row => formatVnd(row.actual || 0), align: 'right', width: '170px', minWidth: '130px' },
    {
      header: 'Chênh lệch',
      accessor: row => {
        const variance = Number(row.budget || 0) - Number(row.actual || 0);
        return <span className={variance >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>{formatVnd(variance)}</span>;
      },
      align: 'right',
      width: '170px',
      minWidth: '130px'
    },
    {
      header: 'Tiến độ',
      accessor: row => `${row.percentage?.toFixed?.(1) || 0}%`,
      align: 'right',
      width: '130px',
      minWidth: '90px'
    },
    {
      header: 'Trạng thái',
      accessor: row => (
        <EnterpriseBadge variant={row.status === 'over' ? 'error' : Number(row.actual || 0) > 0 ? 'success' : 'neutral'}>
          {row.status === 'over' ? 'Vượt' : Number(row.actual || 0) > 0 ? 'Đang làm' : 'Kế hoạch'}
        </EnterpriseBadge>
      ),
      align: 'center',
      width: '140px',
      minWidth: '110px'
    },
    {
      header: 'Nghiệp vụ',
      accessor: row => (
        <div className="flex justify-center">
          <EnterpriseActionMenu 
            actions={[
              { label: 'Chỉnh sửa', onClick: () => setEditingWBS(row) },
              { label: 'Thêm hạng mục con', onClick: () => { setInitialParentId(row.id); setIsAddingWBS(true); } }
            ]}
          />
        </div>
      ),
      align: 'center',
      width: '100px',
      minWidth: '90px'
    },
  ];

  return (
    <EnterpriseAppShell activeItem="wbs">
      <EnterpriseHeader 
        title="Hạng mục thi công (WBS)" 
        subtitle="Phân tích ngân sách và thực tế theo cấu trúc hạng mục" 
        actions={
          <div className="flex gap-2">
            <button onClick={handleExport} className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer shadow-sm">Xuất CSV</button>
            <button onClick={() => { setInitialParentId(null); setIsAddingWBS(true); }} className="h-9 rounded-md bg-[var(--primary)] px-4 text-[12px] font-bold text-white hover:bg-[var(--primary)]/90 cursor-pointer transition-colors shadow-sm">+ THÊM WBS</button>
          </div>
        }
      />
      <EnterprisePageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <EnterpriseMetric title="Tổng hạng mục" value={stats.totalItems} />
          <EnterpriseMetric title="Tổng ngân sách" value={formatVnd(stats.totalBudget)} />
          <EnterpriseMetric title="Thực tế" value={formatVnd(stats.totalActual)} />
          <EnterpriseMetric title="Chênh lệch" value={formatVnd(stats.variance)} />
          <EnterpriseMetric title="Tiến độ" value={`${stats.progress.toFixed(1)}%`} />
        </div>

        <EnterpriseSection title="BỘ LỌC WBS">
          <EnterpriseFilterBar>
            <FormGroup label="Tìm kiếm" className="min-w-[260px] flex-1">
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo mã hoặc tên hạng mục..." />
            </FormGroup>
          </EnterpriseFilterBar>
        </EnterpriseSection>

        <EnterpriseSection title="BẢNG HẠNG MỤC PHÂN CẤP (WBS STRUCTURE)">
          <EnterpriseCard bodyClassName="p-0">
            <EnterpriseTable
              data={rows}
              columns={columns}
              loading={isLoading}
              minWidth="1310px"
              getRowKey={row => row.id}
              emptyState={<EnterpriseEmptyState title="Chưa có hạng mục WBS" description="Tạo hạng mục đầu tiên để quản lý ngân sách, chi phí và tiến độ công trình." iconType="report" />}
              footer={
                <tr className="h-[40px] text-[12px] font-bold text-[var(--text-primary)]">
                  <td colSpan={2} className="px-4 text-right uppercase text-[var(--text-secondary)]">Tổng cộng</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(stats.totalBudget)}</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(stats.totalActual)}</td>
                  <td className={`px-4 text-right font-mono tabular-nums ${stats.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatVnd(stats.variance)}</td>
                  <td className="px-4 text-right font-mono tabular-nums">{stats.progress.toFixed(1)}%</td>
                  <td colSpan={1} />
                </tr>
              }
            />
          </EnterpriseCard>
        </EnterpriseSection>
      </EnterprisePageContainer>

      <AddWBSModal
        isOpen={isAddingWBS || !!editingWBS}
        onClose={() => { setIsAddingWBS(false); setEditingWBS(null); setInitialParentId(null); }}
        wbsItem={editingWBS}
        initialParentId={initialParentId}
      />
    </EnterpriseAppShell>
  );
}

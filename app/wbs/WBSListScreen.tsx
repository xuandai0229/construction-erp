'use client';

import { useMemo, useState } from 'react';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import ProjectContextBar from '@/app/components/workspace/ProjectContextBar';
import AddWBSModal from '@/app/components/modals/AddWBSModal';
import ConfirmModal from '@/app/components/modals/ConfirmModal';
import { formatVnd } from '@/app/components/dashboard-data';
import {
  EnterpriseBadge,
  EnterpriseCard,
  EnterpriseEmptyState,
  EnterpriseFilterBar,
  EnterpriseMetric,
  EnterpriseSection,
  EnterpriseDataTable,
  EnterpriseColumn,
  FormGroup,
  Input,
  EnterpriseActionMenu
} from '@/app/components/ui-enterprise';
import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { useDeleteWBSMutation, useWBSQuery } from '@/services/queries/useWBS';

export default function WBSListScreen() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { data, isLoading } = useWBSQuery(currentProjectId);
  const { mutateAsync: deleteWBS } = useDeleteWBSMutation(currentProjectId);
  const rawTree = data?.tree || [];
  const flatWbs = data?.flat || [];

  const [editingWBS, setEditingWBS] = useState<WBSItem | null>(null);
  const [isAddingWBS, setIsAddingWBS] = useState(false);
  const [initialParentId, setInitialParentId] = useState<string | null>(null);
  const [deletingWBS, setDeletingWBS] = useState<WBSItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  const columns: EnterpriseColumn<any>[] = [
    { 
      key: 'rowIndex',
      header: 'Mã', 
      render: row => row.rowIndex, 
      align: 'center', 
      width: '120px', 
      minWidth: '100px' 
    },
    { 
      key: 'name',
      header: 'Hạng mục thi công', 
      render: row => {
        const level = row.rowIndex ? row.rowIndex.split('.').length - 1 : 0;
        return (
          <span 
            style={{ paddingLeft: `${level * 16}px` }} 
            className={`${level === 0 ? 'font-black text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'} block truncate`}
            title={row.name}
          >
            {level > 0 && <span className="text-[var(--text-muted)] mr-1.5 font-bold">└─</span>}
            {row.name}
          </span>
        );
      }, 
      width: '420px', 
      minWidth: '320px' 
    },
    { 
      key: 'budget',
      header: 'Ngân sách', 
      render: row => formatVnd(row.budget || 0), 
      align: 'right', 
      width: '180px', 
      minWidth: '160px' 
    },
    { 
      key: 'actual',
      header: 'Thực tế', 
      render: row => formatVnd(row.actual || 0), 
      align: 'right', 
      width: '180px', 
      minWidth: '160px' 
    },
    {
      key: 'variance',
      header: 'Chênh lệch',
      render: row => {
        const variance = Number(row.budget || 0) - Number(row.actual || 0);
        return <span className={variance >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>{formatVnd(variance)}</span>;
      },
      align: 'right',
      width: '180px',
      minWidth: '160px'
    },
    {
      key: 'percentage',
      header: 'Tiến độ',
      render: row => `${row.percentage?.toFixed?.(1) || 0}%`,
      align: 'right',
      width: '120px',
      minWidth: '110px'
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: row => (
        <EnterpriseBadge variant={row.status === 'over' ? 'error' : Number(row.actual || 0) > 0 ? 'success' : 'neutral'}>
          {row.status === 'over' ? 'Vượt định mức' : Number(row.actual || 0) > 0 ? 'Đang thi công' : 'Lập kế hoạch'}
        </EnterpriseBadge>
      ),
      align: 'center',
      width: '140px',
      minWidth: '130px'
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: row => (
        <div className="flex justify-center">
          <EnterpriseActionMenu 
            actions={[
              { label: 'Chỉnh sửa hạng mục', onClick: () => setEditingWBS(row) },
              { label: 'Thêm hạng mục con', onClick: () => { setInitialParentId(row.id); setIsAddingWBS(true); } },
              { label: 'Xóa hạng mục', onClick: () => { setDeleteError(null); setDeletingWBS(row); }, variant: 'danger' }
            ]}
          />
        </div>
      ),
      align: 'center',
      width: '120px',
      minWidth: '110px'
    },
  ];

  return (
    <EnterpriseAppShell activeItem="wbs">
      <EnterpriseHeader 
        title="Hạng mục thi công (WBS)" 
        subtitle="Quản lý cấu trúc hạng mục và giám sát ngân sách, thực tế dự án" 
        actions={
          <div className="flex gap-2">
            <button onClick={handleExport} className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer transition-all shadow-sm">Xuất dữ liệu</button>
            <button onClick={() => { setInitialParentId(null); setIsAddingWBS(true); }} className="h-9 rounded-md bg-[var(--primary)] px-4 text-[12px] font-bold text-white hover:opacity-90 cursor-pointer transition-colors shadow-sm">+ Thêm Hạng mục (WBS)</button>
          </div>
        }
      />
      <ProjectContextBar />
      <EnterprisePageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <EnterpriseMetric title="Tổng số hạng mục" value={stats.totalItems} />
          <EnterpriseMetric title="Tổng ngân sách" value={formatVnd(stats.totalBudget)} />
          <EnterpriseMetric title="Tổng thực tế" value={formatVnd(stats.totalActual)} />
          <EnterpriseMetric title="Chênh lệch còn lại" value={formatVnd(stats.variance)} />
          <EnterpriseMetric title="Tiến độ thực tế" value={`${stats.progress.toFixed(1)}%`} />
        </div>

        <EnterpriseSection title="Bộ lọc hạng mục (WBS)">
          <EnterpriseFilterBar>
            <FormGroup label="Tìm kiếm hạng mục" className="min-w-[260px] flex-1">
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo mã hoặc tên hạng mục..." />
            </FormGroup>
          </EnterpriseFilterBar>
        </EnterpriseSection>

        <EnterpriseSection title="Cấu trúc phân cấp hạng mục (WBS)">
          <EnterpriseCard bodyClassName="p-0">
            <EnterpriseDataTable
              data={rows}
              columns={columns}
              loading={isLoading}
              minWidth="1420px"
              getRowKey={row => row.id}
              emptyState={<EnterpriseEmptyState title="Chưa có hạng mục WBS" description="Tạo hạng mục đầu tiên để quản lý ngân sách, chi phí và tiến độ công trình." iconType="report" />}
              footer={
                <tr className="h-[40px] text-[12px] font-bold text-[var(--text-primary)] bg-[var(--secondary)]">
                  <td colSpan={2} className="px-4 text-right uppercase text-[var(--text-secondary)] font-bold">Tổng cộng</td>
                  <td className="px-4 text-right font-mono tabular-nums text-[var(--text-primary)]">{formatVnd(stats.totalBudget)}</td>
                  <td className="px-4 text-right font-mono tabular-nums text-[var(--text-primary)]">{formatVnd(stats.totalActual)}</td>
                  <td className={`px-4 text-right font-mono tabular-nums ${stats.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatVnd(stats.variance)}</td>
                  <td className="px-4 text-right font-mono tabular-nums text-[var(--text-primary)]">{stats.progress.toFixed(1)}%</td>
                  <td colSpan={2} />
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
      <ConfirmModal
        isOpen={!!deletingWBS}
        onClose={() => { setDeletingWBS(null); setDeleteError(null); }}
        onConfirm={async () => {
          if (!deletingWBS) return;
          try {
            await deleteWBS(deletingWBS.id);
            setDeletingWBS(null);
            setDeleteError(null);
          } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'Không thể xóa hạng mục WBS.');
          }
        }}
        title="Xác nhận xóa hạng mục WBS"
        message={deleteError || 'Hạng mục chỉ được xóa khi chưa phát sinh dự toán, chi phí hoặc hạng mục con liên quan.'}
      />
    </EnterpriseAppShell>
  );
}

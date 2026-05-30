/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useRef, useState } from 'react';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';
import ConfirmModal from '@/app/components/modals/ConfirmModal';
import EditBudgetModal from '@/app/components/modals/EditBudgetModal';
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
  Select,
  EnterpriseActionMenu
} from '@/app/components/ui-enterprise';
import { exportToCsv } from '@/app/services/export.service';
import { useERPStore } from '@/store/erpStore';
import { useBudgetsQuery, useDeleteBudgetMutation, useImportBudgetMutation } from '@/services/queries/useBudgets';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';

const COST_TYPE_LABELS: Record<string, string> = {
  material: 'Vật tư',
  labor: 'Nhân công',
  machine: 'Máy thi công',
  subcontract: 'Thầu phụ',
  overhead: 'Chi phí chung',
  other: 'Khác',
};

export default function BudgetPage() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialWbsIdForAdd, setInitialWbsIdForAdd] = useState<string | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deletingBudget, setDeletingBudget] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterCostType, setFilterCostType] = useState('ALL');

  const { data: budgets = [] } = useBudgetsQuery(currentProjectId);
  const { data: costsData = [] } = useCostsQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const { mutateAsync: deleteBudget } = useDeleteBudgetMutation(currentProjectId);
  const { mutateAsync: importBudgets } = useImportBudgetMutation(currentProjectId);

  const costs = Array.isArray(costsData) ? costsData.filter((cost: any) => cost.approvalStatus === 'APPROVED') : [];

  const wbsRows = useMemo(() => {
    const nodes = wbsData?.tree || [];
    const flatten = (items: any[], prefix = ''): any[] => {
      return items.flatMap((node, index) => {
        const rowIndex = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        return [
          { ...node, rowIndex },
          ...flatten(node.children || [], rowIndex),
        ];
      });
    };

    const rows = flatten(nodes).map((node) => {
      const nodeBudgets = budgets.filter((budget: any) => budget.wbsId === node.id);
      const budgetByType = nodeBudgets.reduce((sum: number, budget: any) => sum + Number(budget.estimatedAmount || 0), 0);
      const budget = Number(node.budget || budgetByType || 0);
      const actual = Number(node.actual || 0);
      const variance = budget - actual;
      return {
        ...node,
        budget,
        actual,
        variance,
        budgetRecords: nodeBudgets,
        status: budget === 0 ? 'UNBUDGETED' : variance < 0 ? 'OVERRUN' : actual > 0 ? 'EXECUTING' : 'PLANNED',
      };
    });

    const query = search.trim().toLowerCase();
    return rows.filter(row => {
      if (query && !String(row.name || '').toLowerCase().includes(query) && !String(row.code || '').toLowerCase().includes(query)) return false;
      if (filterCostType !== 'ALL' && !row.budgetRecords.some((budget: any) => budget.costType === filterCostType)) return false;
      return true;
    });
  }, [wbsData, budgets, search, filterCostType]);

  const totals = useMemo(() => {
    const rootNodes = (wbsData?.tree || []).filter((node: any) => node.parentId === null);
    const totalBudget = rootNodes.reduce((sum: number, node: any) => sum + Number(node.budget || 0), 0);
    const totalActual = rootNodes.reduce((sum: number, node: any) => sum + Number(node.actual || 0), 0);
    const variance = totalBudget - totalActual;
    const pct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
    return {
      totalBudget,
      totalActual,
      variance,
      pct,
      overrunCount: wbsRows.filter(row => row.status === 'OVERRUN').length,
      unbudgetedCount: wbsRows.filter(row => row.status === 'UNBUDGETED').length,
    };
  }, [wbsData, wbsRows]);

  const executeDelete = async () => {
    if (!deletingBudget) return;
    try {
      await deleteBudget(deletingBudget.id);
      setDeletingBudget(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const payload = rows.slice(1).filter(row => row.length > 2).map(row => ({
        projectId: currentProjectId,
        wbsId: row[0]?.trim(),
        estimatedAmount: Number(row[2]?.trim() || 0),
      }));
      if (payload.length > 0) await importBudgets(payload);
    } catch {
      alert('Lỗi import');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const columns: Column<any>[] = [
    { header: 'Mã', accessor: row => row.rowIndex, align: 'center', width: '80px', minWidth: '70px' },
    { 
      header: 'Hạng mục WBS / CBS', 
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
      width: '360px', 
      minWidth: '260px' 
    },
    { header: 'Dự toán', accessor: row => formatVnd(row.budget), align: 'right', width: '170px', minWidth: '130px' },
    { header: 'Thực tế', accessor: row => formatVnd(row.actual), align: 'right', width: '170px', minWidth: '130px' },
    {
      header: 'Chênh lệch',
      accessor: row => <span className={row.variance >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>{formatVnd(row.variance)}</span>,
      align: 'right',
      width: '170px',
      minWidth: '130px'
    },
    {
      header: 'Trạng thái',
      accessor: row => (
        <EnterpriseBadge variant={row.status === 'OVERRUN' ? 'error' : row.status === 'UNBUDGETED' ? 'warning' : row.status === 'EXECUTING' ? 'success' : 'neutral'}>
          {row.status === 'OVERRUN' ? 'Vượt ngân sách' : row.status === 'UNBUDGETED' ? 'Chưa lập' : row.status === 'EXECUTING' ? 'Đang thi công' : 'Kế hoạch'}
        </EnterpriseBadge>
      ),
      align: 'center',
      width: '160px',
      minWidth: '120px'
    },
    {
      header: 'Nghiệp vụ',
      accessor: row => {
        const menuActions: any[] = [
          { label: 'Lập dự toán', onClick: () => { setInitialWbsIdForAdd(row.id); setIsAddModalOpen(true); } }
        ];
        if (row.budgetRecords[0]) {
          menuActions.push({ label: 'Chỉnh sửa', onClick: () => { setEditingBudget(row.budgetRecords[0]); setIsEditModalOpen(true); } });
          menuActions.push({ label: 'Xóa dự toán', onClick: () => setDeletingBudget(row.budgetRecords[0]), variant: 'danger' });
        }
        return (
          <div className="flex justify-center">
            <EnterpriseActionMenu actions={menuActions} />
          </div>
        );
      },
      align: 'center',
      width: '100px',
      minWidth: '90px'
    },
  ];

  return (
    <EnterpriseAppShell activeItem="budget">
      <AddBudgetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} initialWbsId={initialWbsIdForAdd} />
      <EditBudgetModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} editingBudget={editingBudget} />
      <ConfirmModal isOpen={!!deletingBudget} onClose={() => setDeletingBudget(null)} onConfirm={executeDelete} title="Xác nhận xóa dự toán" message="Dự toán sẽ bị xóa khỏi màn hình quản trị ngân sách." />

      <EnterpriseHeader 
        title="Quản lý Dự toán & Chi phí (CBS)" 
        subtitle="Hoạch định chi tiết cấu trúc phân rã chi phí công trình"
        actions={
          <div className="flex gap-2">
            <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer shadow-sm">Import CSV</button>
            <button onClick={() => exportToCsv(`ERP_Budget_Breakdown_${currentProjectId}.csv`, budgets)} className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer shadow-sm">Xuất CSV</button>
            <button onClick={() => { setInitialWbsIdForAdd(undefined); setIsAddModalOpen(true); }} className="h-9 rounded-md bg-[var(--primary)] px-4 text-[12px] font-bold text-white hover:bg-[var(--primary)]/90 cursor-pointer transition-colors shadow-sm">+ LẬP DỰ TOÁN</button>
          </div>
        }
      />

      <EnterprisePageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <EnterpriseMetric title="Tổng dự toán" value={formatVnd(totals.totalBudget)} />
          <EnterpriseMetric title="Chi phí thực tế" value={formatVnd(totals.totalActual)} />
          <EnterpriseMetric title="Chênh lệch" value={formatVnd(totals.variance)} />
          <EnterpriseMetric title="% sử dụng" value={`${totals.pct.toFixed(1)}%`} />
          <EnterpriseMetric title="Hạng mục vượt" value={totals.overrunCount} />
          <EnterpriseMetric title="Chưa có dự toán" value={totals.unbudgetedCount} />
        </div>

        <EnterpriseSection title="BỘ LỌC DỰ TOÁN & CHI PHÍ">
          <EnterpriseFilterBar>
            <FormGroup label="Tìm kiếm" className="min-w-[260px] flex-1">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo mã WBS, tên hạng mục..." />
            </FormGroup>
            <FormGroup label="Loại chi phí" className="min-w-[200px]">
              <Select value={filterCostType} onChange={(event) => setFilterCostType(event.target.value)}>
                <option value="ALL">Tất cả loại chi phí</option>
                {Object.entries(COST_TYPE_LABELS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
              </Select>
            </FormGroup>
          </EnterpriseFilterBar>
        </EnterpriseSection>

        <EnterpriseSection title="BẢNG NGÂN SÁCH CHI TIẾT CBS WBS STRUCTURE">
          <EnterpriseCard bodyClassName="p-0">
            <EnterpriseTable
              data={wbsRows}
              columns={columns}
              minWidth="1260px"
              getRowKey={row => row.id}
              emptyState={<EnterpriseEmptyState title="Chưa có dự toán" description="Lập dự toán đầu tiên cho hạng mục WBS để theo dõi ngân sách công trình." iconType="report" />}
              footer={
                <tr className="h-[40px] text-[12px] font-bold text-[var(--text-primary)]">
                  <td colSpan={2} className="px-4 text-right uppercase text-[var(--text-secondary)]">Tổng cộng hệ thống</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.totalBudget)}</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.totalActual)}</td>
                  <td className={`px-4 text-right font-mono tabular-nums ${totals.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatVnd(totals.variance)}</td>
                  <td className="px-4 text-center font-mono tabular-nums">{totals.pct.toFixed(1)}%</td>
                  <td />
                </tr>
              }
            />
          </EnterpriseCard>
        </EnterpriseSection>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

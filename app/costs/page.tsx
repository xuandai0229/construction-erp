'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import AddCostModal from '@/app/components/modals/AddCostModal';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import {
  Column,
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
import { CostRecord, CostType, costType_LABELS } from '@/app/types';
import { useDebounce } from '@/app/hooks/useDebounce';
import { queryKeys } from '@/lib/query-keys';
import { useERPStore } from '@/store/erpStore';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';

const costTypes = Object.keys(costType_LABELS) as CostType[];

export default function CostsPage() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const queryClient = useQueryClient();

  const { data: costs = [], isLoading: isLoadingCosts } = useCostsQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbsList = wbsData?.flat || [];

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCost, setSelectedCost] = useState<CostRecord | null>(null);
  const [editingCost, setEditingCost] = useState<CostRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredCosts = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return costs.filter(cost => {
      const matchesSearch =
        (cost.note?.toLowerCase() || '').includes(searchLower) ||
        (cost.supplier?.toLowerCase() || '').includes(searchLower) ||
        cost.id.toLowerCase().includes(searchLower);
      const matchesType = typeFilter === 'ALL' || cost.costType === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || cost.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [costs, debouncedSearch, typeFilter, statusFilter]);

  const totals = useMemo(() => {
    return filteredCosts.reduce(
      (acc, cost) => {
        const vatRate = cost.vatRate !== undefined ? cost.vatRate : 10;
        const retentionRate = cost.retentionRate !== undefined ? cost.retentionRate : 0;
        const net = Math.round(cost.netAmount || cost.amount / (1 + vatRate / 100));
        const vat = Math.round(cost.vatAmount || (cost.amount - net));
        const retention = Math.round(cost.retentionAmount || (cost.amount * (retentionRate / 100)));
        acc.net += net;
        acc.vat += vat;
        acc.retention += retention;
        acc.amount += cost.amount;
        acc.payable += cost.amount - retention;
        return acc;
      },
      { net: 0, vat: 0, retention: 0, amount: 0, payable: 0 },
    );
  }, [filteredCosts]);

  const handleDelete = async (cost: CostRecord) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chi phí này?')) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/costs/${cost.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Không thể xóa chi phí');
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(currentProjectId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(currentProjectId), 'stats'] });
      setSelectedCost(null);
    } catch (error: any) {
      alert(error.message || 'Lỗi kết nối');
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: Column<CostRecord>[] = [
    { header: 'Ngày', accessor: cost => formatDate(cost.date), align: 'center', width: '128px', minWidth: '100px' },
    { header: 'Nhà cung cấp & nội dung', accessor: cost => `${cost.supplier || 'Nhiều nhà CC'} - ${cost.note || ''}`, width: '320px', minWidth: '240px' },
    { header: 'Hạng mục WBS', accessor: cost => wbsList.find(w => w.id === cost.wbsId)?.name || 'N/A', width: '240px', minWidth: '180px' },
    {
      header: 'Loại',
      accessor: cost => <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--text-muted)]">{costType_LABELS[cost.costType] || cost.costType}</span>,
      align: 'center',
      width: '150px',
      minWidth: '110px'
    },
    { header: 'SL', accessor: cost => cost.quantity || 1, align: 'right', width: '80px', minWidth: '60px' },
    { header: 'Đơn giá', accessor: cost => formatVnd(cost.unitPrice || cost.amount), align: 'right', width: '140px', minWidth: '110px' },
    {
      header: 'Chưa thuế',
      accessor: cost => {
        const vatRate = cost.vatRate !== undefined ? cost.vatRate : 10;
        return formatVnd(Math.round(cost.netAmount || cost.amount / (1 + vatRate / 100)));
      },
      align: 'right',
      width: '150px',
      minWidth: '120px'
    },
    {
      header: 'VAT',
      accessor: cost => {
        const vatRate = cost.vatRate !== undefined ? cost.vatRate : 10;
        const net = Math.round(cost.netAmount || cost.amount / (1 + vatRate / 100));
        return formatVnd(Math.round(cost.vatAmount || (cost.amount - net)));
      },
      align: 'right',
      width: '130px',
      minWidth: '100px'
    },
    { header: 'Bảo hành', accessor: cost => <span className="text-rose-500 font-semibold">-{formatVnd(Math.round(cost.retentionAmount || 0))}</span>, align: 'right', width: '140px', minWidth: '110px' },
    { header: 'Hạch toán', accessor: cost => <span className="font-bold">{formatVnd(cost.amount)}</span>, align: 'right', width: '150px', minWidth: '120px' },
    { header: 'Thực thanh toán', accessor: cost => <span className="font-bold text-emerald-500">{formatVnd(Math.round(cost.amount - (cost.retentionAmount || 0)))}</span>, align: 'right', width: '160px', minWidth: '130px' },
    {
      header: 'Trạng thái',
      accessor: cost => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${cost.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30'}`}>{cost.status === 'paid' ? 'Đã trả' : 'Công nợ'}</span>,
      align: 'center',
      width: '140px',
      minWidth: '110px'
    },
    {
      header: 'Nghiệp vụ',
      accessor: cost => (
        <div className="flex justify-center" onClick={e => e.stopPropagation()}>
          <EnterpriseActionMenu 
            actions={[
              { label: 'Xem chi tiết', onClick: () => setSelectedCost(cost) },
              { label: 'Chỉnh sửa', onClick: () => { setEditingCost(cost); setShowAddModal(true); } },
              { label: 'Xóa bỏ', onClick: () => handleDelete(cost), variant: 'danger' }
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
    <EnterpriseAppShell activeItem="costs">
      <EnterpriseHeader 
        title="Quản lý chi phí công trình" 
        subtitle="Phân tích dòng tiền chi ra và theo dõi hạch toán công nợ phải trả"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => exportToCsv('ERP_Costs.csv', filteredCosts)} className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer shadow-sm">
              Xuất CSV
            </button>
            <button onClick={() => { setEditingCost(null); setShowAddModal(true); }} className="h-9 rounded-md bg-[var(--primary)] px-4 text-[12px] font-bold text-white hover:bg-[var(--primary)]/90 cursor-pointer shadow-sm">
              + THÊM CHI PHÍ
            </button>
          </div>
        }
      />

      <EnterprisePageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <EnterpriseMetric title="Chi phí hạch toán" value={formatVnd(totals.amount)} />
          <EnterpriseMetric title="Trước thuế" value={formatVnd(totals.net)} />
          <EnterpriseMetric title="VAT đầu vào" value={formatVnd(totals.vat)} />
          <EnterpriseMetric title="Thực thanh toán" value={formatVnd(totals.payable)} />
        </div>

        <EnterpriseSection title="BỘ LỌC CHI PHÍ">
          <EnterpriseFilterBar>
            <FormGroup label="Tìm kiếm" className="min-w-[240px] flex-1">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhà cung cấp, nội dung..." />
            </FormGroup>
            <FormGroup label="Loại chi phí" className="min-w-[180px]">
              <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="ALL">Tất cả loại</option>
                {costTypes.map(type => <option key={type} value={type}>{costType_LABELS[type]}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Trạng thái" className="min-w-[180px]">
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">Tất cả trạng thái</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
              </Select>
            </FormGroup>
            <div className="flex items-end">
              <button onClick={() => { setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }} className="h-[38px] rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer shadow-sm">
                Xóa bộ lọc
              </button>
            </div>
          </EnterpriseFilterBar>
        </EnterpriseSection>

        <EnterpriseSection title="BẢNG CHI TIẾT GHI NHẬN CHI PHÍ (COST RECORD)" subtitle={`Hiển thị ${filteredCosts.length} / ${costs.length} bản ghi`}>
          <EnterpriseCard bodyClassName="p-0">
            <EnterpriseTable
              data={filteredCosts}
              columns={columns}
              loading={isLoadingCosts}
              minWidth="1800px"
              getRowKey={cost => cost.id}
              onRowClick={setSelectedCost}
              emptyState={<EnterpriseEmptyState title="Chưa có chi phí" description="Ghi nhận chi phí đầu tiên để theo dõi công nợ phải trả và chi phí công trình." iconType="debt" />}
              footer={
                <tr className="h-[40px] text-[12px] font-bold text-[var(--text-primary)]">
                  <td colSpan={6} className="px-4 text-right uppercase text-[var(--text-secondary)]">Tổng cộng</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.net)}</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.vat)}</td>
                  <td className="px-4 text-right font-mono tabular-nums text-rose-500">-{formatVnd(totals.retention)}</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.amount)}</td>
                  <td className="px-4 text-right font-mono tabular-nums text-emerald-500">{formatVnd(totals.payable)}</td>
                  <td colSpan={2} />
                </tr>
              }
            />
          </EnterpriseCard>
        </EnterpriseSection>
      </EnterprisePageContainer>

      {selectedCost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedCost(null)}>
          <div className="w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
            <EnterpriseCard title="CHI TIẾT CHI PHÍ THỜI GIAN THỰC">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Nhà cung cấp</div>
                    <div className="mt-1 text-[14px] font-bold text-[var(--text-primary)]">{selectedCost.supplier || 'Nhiều nhà CC'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Ngày ghi nhận</div>
                    <div className="mt-1 text-[14px] font-bold text-[var(--text-primary)]">{formatDate(selectedCost.date)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Loại chi phí</div>
                    <div className="mt-1 text-[14px] font-bold text-[var(--text-primary)]">{costType_LABELS[selectedCost.costType] || selectedCost.costType}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Số tiền</div>
                    <div className="mt-1 font-mono text-[16px] font-bold tabular-nums text-[var(--text-accent)]">{formatVnd(selectedCost.amount)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Diễn giải</div>
                  <div className="mt-1 text-[14px] text-[var(--text-secondary)]">{selectedCost.note || '-'}</div>
                </div>
                <div className="flex gap-3 border-t border-[var(--border)] pt-4">
                  <button onClick={() => { setEditingCost(selectedCost); setShowAddModal(true); setSelectedCost(null); }} className="h-[36px] flex-1 rounded-md bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-all cursor-pointer font-bold text-[12px]">
                    Chỉnh sửa
                  </button>
                  <button disabled={isProcessing} onClick={() => handleDelete(selectedCost)} className="h-[36px] flex-1 rounded-md bg-rose-600 px-4 text-[12px] font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition-all cursor-pointer">
                    Xóa bỏ
                  </button>
                  <button onClick={() => setSelectedCost(null)} className="h-[36px] flex-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] transition-all cursor-pointer">
                    Đóng
                  </button>
                </div>
              </div>
            </EnterpriseCard>
          </div>
        </div>
      )}

      <AddCostModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingCost(null); }} costRecord={editingCost} />
    </EnterpriseAppShell>
  );
}

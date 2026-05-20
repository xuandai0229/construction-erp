'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useERPStore } from '@/store/erpStore';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import { CostType, CostRecord, costType_LABELS } from '@/app/types';
import AddCostModal from '@/app/components/modals/AddCostModal';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';
import { TableVirtuoso } from 'react-virtuoso';
import { useProjectStatsQuery } from '@/services/queries/useProjects';
import { queryKeys } from '@/lib/query-keys';
import { exportToCsv } from '@/app/services/export.service';

import { useDebounce } from '@/app/hooks/useDebounce';

const costTypes = Object.keys(costType_LABELS) as CostType[];

// Define Table Components outside to ensure stability and avoid infinite loops
const TableComponents = {
  Table: (props: any) => <table {...props} className="erp-table w-full min-w-[1600px] table-fixed" />,
  TableHead: (props: any) => <thead {...props} className="bg-[var(--table-head-bg)] z-30 sticky top-0" />,
};

import { COL_WIDTHS } from '@/app/utils/table-constants';

export default function CostsPage() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  
  // React Query server state
  const queryClient = useQueryClient();
  const { data: costs = [], isLoading: isLoadingCosts } = useCostsQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const { data: stats } = useProjectStatsQuery(currentProjectId);
  
  const wbsList = wbsData?.flat || [];

  // Filters & State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCost, setSelectedCost] = useState<CostRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Audit Trail states (Batch 5.2)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCost(null);
      }
    };
    if (selectedCost) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCost]);

  useEffect(() => {
    if (selectedCost) {
      setLoadingAudit(true);
      fetch(`/api/audit?entity=CostRecord&entityId=${selectedCost.id}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setAuditLogs(res.data || []);
          }
        })
        .catch(err => console.warn('Failed to fetch audit logs', err))
        .finally(() => setLoadingAudit(false));
    } else {
      setAuditLogs([]);
    }
  }, [selectedCost]);

  const filteredCosts = useMemo(() => {
    return costs.filter(c => {
      const matchesSearch = c.note?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                           c.supplier?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = typeFilter === 'ALL' || c.costType === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [costs, debouncedSearch, typeFilter, statusFilter]);

  const virtuosoComponents = useMemo(() => ({
    ...TableComponents,
    TableRow: (props: any) => {
      const { item, ...rest } = props;
      return <tr {...rest} className="group erp-table-row cursor-pointer" onClick={() => setSelectedCost(item)} />;
    }
  }), []);

  return (
    <div className="erp-page">
      <Sidebar activeItem="costs" />
      
      <main
        className={`erp-page-main transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}
      >
        <Header />
        
        <div className="p-6 md:p-8 animate-fade-in">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="accent-line border-l-4 border-[var(--text-accent)] pl-4">
              <h1 className="erp-section-title">Quản lý chi phí</h1>
              <p className="erp-section-subtitle">Phân tích dòng tiền chi ra và công nợ phải trả</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => {
                  if (filteredCosts.length === 0) return;
                  const headers = ['Ngày', 'Nội dung', 'Hạng mục', 'Loại', 'Số tiền', 'Trạng thái'];
                  const rows = filteredCosts.map(c => [
                    formatDate(c.date),
                    c.note || '',
                    wbsList.find(w => w.id === c.wbsId)?.name || '',
                    costType_LABELS[c.costType] || c.costType,
                    c.amount,
                    c.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
                  ]);
                  exportToCsv('ERP_Costs', headers, rows);
                }}
                className="erp-btn bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--hover-bg)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4-4-4m4 4V4" /></svg>
                Xuất Excel
              </button>
              <button
                onClick={() => {
                  setSelectedCost(null);
                  setShowAddModal(true);
                }}
                className="erp-btn bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Thêm chi phí mới
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-1">
              <label className="erp-label">Tìm kiếm</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  className="erp-input pl-10 text-[13px]" 
                  placeholder="Nhà cung cấp, nội dung..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="erp-label">Loại chi phí</label>
              <select className="erp-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="ALL">Tất cả loại</option>
                {costTypes.map(t => <option key={t} value={t}>{costType_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Trạng thái</label>
              <select className="erp-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">Tất cả trạng thái</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }} className="text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider mb-3 transition-colors">Xóa bộ lọc</button>
            </div>
          </div>

          {/* Costs Table with Virtualization */}
          <div className="card-elevation overflow-hidden border border-[var(--border)] rounded-lg">
            <div className="overflow-x-auto scrollbar-thin">
              {isLoadingCosts ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-4">Đang tải chi phí...</div>
                </div>
              ) : filteredCosts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-[var(--secondary)] grid place-items-center text-[var(--text-muted)] mb-3">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Không tìm thấy chi phí phù hợp</div>
                </div>
              ) : (
                <TableVirtuoso
                  useWindowScroll
                  data={filteredCosts}
                  components={virtuosoComponents}
                  fixedHeaderContent={() => (
                    <tr className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)]">
                      <th className={`${COL_WIDTHS.DATE} py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)]`}>Ngày</th>
                      <th className="py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[280px]">Nhà cung cấp & Nội dung</th>
                      <th className="py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[200px]">Hạng mục (WBS)</th>
                      <th className={`${COL_WIDTHS.STATUS} py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)]`}>Loại</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[60px]">SL</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[110px]">Đơn giá</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[120px]">Chưa thuế</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[100px]">Thuế VAT</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[110px]">Bảo hành</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[130px]">Hạch toán</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] w-[130px]">Thực thanh toán</th>
                      <th className={`${COL_WIDTHS.STATUS} py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)]`}>Trạng thái</th>
                      <th className={`${COL_WIDTHS.ACTIONS} py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-[var(--border)]`}>Thao tác</th>
                    </tr>
                  )}
                  itemContent={(i, c) => {
                    const vatRate = c.vatRate !== undefined ? c.vatRate : 10;
                    const retentionRate = c.retentionRate !== undefined ? c.retentionRate : 0;
                    const net = Math.round(c.netAmount || c.amount / (1 + vatRate / 100));
                    const vat = Math.round(c.vatAmount || (c.amount - net));
                    const retention = Math.round(c.retentionAmount || (c.amount * (retentionRate / 100)));
                    const payable = Math.round(c.amount - retention);

                    return (
                      <>
                        <td className={`${COL_WIDTHS.DATE} py-3 px-4 whitespace-nowrap font-bold text-[var(--text-muted)] border-r border-[var(--border)]`}>{formatDate(c.date)}</td>
                        <td className="py-3 px-4 border-r border-[var(--border)] w-[280px]">
                          <div className="font-bold text-[var(--text-primary)] truncate">{c.supplier || 'Nhiều nhà CC'}</div>
                          <div className="text-[11px] text-[var(--text-muted)] font-medium truncate mt-0.5">{c.note}</div>
                        </td>
                        <td className="py-3 px-4 border-r border-[var(--border)] w-[200px]">
                          <div className="text-[12px] font-bold text-[var(--text-secondary)] truncate">{wbsList.find(w => w.id === c.wbsId)?.name || 'N/A'}</div>
                        </td>
                        <td className={`${COL_WIDTHS.STATUS} py-3 px-4 border-r border-[var(--border)]`}>
                          <span className="inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                            {costType_LABELS[c.costType] || c.costType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-[var(--text-secondary)] border-r border-[var(--border)] w-[60px]">{c.quantity || 1}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-[var(--text-secondary)] border-r border-[var(--border)] w-[110px]">{formatVnd(c.unitPrice || c.amount)}</td>
                        
                        {/* VAT Breakdowns */}
                        <td className="py-3 px-4 text-right tabular-nums font-medium text-[var(--text-secondary)] border-r border-[var(--border)] w-[120px]">{formatVnd(net)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-medium text-[var(--text-secondary)] border-r border-[var(--border)] w-[100px]">
                          <div className="text-[var(--text-primary)] font-bold">{formatVnd(vat)}</div>
                          <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{vatRate}% VAT</div>
                        </td>
                        
                        {/* Subcontractor Retention */}
                        <td className="py-3 px-4 text-right tabular-nums font-medium text-amber-500 border-r border-[var(--border)] w-[110px]">
                          <div>-{formatVnd(retention)}</div>
                          <div className="text-[9px] mt-0.5">{retentionRate}% Bảo hành</div>
                        </td>

                        <td className="py-3 px-4 text-right tabular-nums font-black text-[var(--text-primary)] border-r border-[var(--border)] w-[130px]">{formatVnd(c.amount)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-black text-emerald-500 border-r border-[var(--border)] w-[130px]">{formatVnd(payable)}</td>

                        <td className={`${COL_WIDTHS.STATUS} py-3 px-4 text-center border-r border-[var(--border)]`}>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            c.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`}></span>
                            {c.status === 'paid' ? 'Đã trả' : 'Công nợ'}
                          </span>
                        </td>
                        <td className={`${COL_WIDTHS.ACTIONS} text-center`}>
                          <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
                              onClick={(e) => { e.stopPropagation(); setSelectedCost(c); }}
                            >
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            </button>
                          </div>
                        </td>
                      </>
                    );
                  }}
                />
              )}
            </div>
            
            {/* Pagination */}
            <div className="h-14 border-t border-[var(--border)] flex items-center justify-between px-6 bg-[var(--table-head-bg)]">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Hiển thị <span className="text-[var(--text-primary)] font-bold">{filteredCosts.length}</span> / {costs.length} bản ghi</div>
              <div className="flex items-center gap-2">
                <button disabled className="h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--secondary)] flex items-center justify-center text-[var(--text-muted)] disabled:opacity-30"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg></button>
                <button className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-900/20">1</button>
                <button disabled className="h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--secondary)] flex items-center justify-center text-[var(--text-muted)] disabled:opacity-30"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg></button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedCost && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedCost(null)}
        >
          <div 
            className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelectedCost(null)} className="absolute right-6 top-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-8">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4 ${
                selectedCost.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30'
              }`}>
                {selectedCost.status === 'paid' ? 'Đã thanh toán' : 'Công nợ'}
              </span>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedCost.supplier || 'Nhiều nhà CC'}</h2>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Mã: {selectedCost.id.slice(0, 12).toUpperCase()}</p>
            </div>

            {/* Stepper Timeline Visualizer */}
            <div className="mb-6 p-4 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Quy trình phê duyệt</div>
              <div className="flex items-center justify-between relative">
                {/* Stepper Line */}
                <div className="absolute left-1 right-1 top-[13px] h-[2px] bg-[var(--border)] z-0" />
                
                {/* Steps */}
                {[
                  { key: "DRAFT", label: "Nháp" },
                  { key: "PENDING_PM", label: "PM duyệt" },
                  { key: "PENDING_FINANCE", label: "Kế toán" },
                  { key: "APPROVED", label: "Đã duyệt" },
                  { key: "POSTED", label: "Ghi sổ" }
                ].map((step, idx) => {
                  const states = ["DRAFT", "PENDING_PM", "PENDING_FINANCE", "APPROVED", "POSTED"];
                  const currentIdx = states.indexOf(selectedCost.workflowStatus);
                  const stepIdx = states.indexOf(step.key);
                  const isCompleted = currentIdx >= stepIdx && selectedCost.workflowStatus !== "REJECTED" && selectedCost.workflowStatus !== "REVERSED";
                  const isActive = selectedCost.workflowStatus === step.key;
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center z-10">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all shadow-sm ${
                        isActive 
                          ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' 
                          : isCompleted 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)]'
                      }`}>
                        {isCompleted && !isActive ? (
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={`text-[8.5px] font-black uppercase tracking-wider mt-1.5 ${
                        isActive ? 'text-blue-500' : isCompleted ? 'text-emerald-500' : 'text-[var(--text-muted)]'
                      }`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Handle special states like REJECTED or REVERSED */}
              {(selectedCost.workflowStatus === "REJECTED" || selectedCost.workflowStatus === "REVERSED") && (
                <div className={`mt-3 p-2 rounded text-center text-[10px] font-black uppercase tracking-wider ${
                  selectedCost.workflowStatus === "REJECTED" ? "bg-rose-500/10 text-rose-500" : "bg-purple-500/10 text-purple-500"
                }`}>
                  {selectedCost.workflowStatus === "REJECTED" ? "⚠️ Chứng từ bị từ chối / trả lại" : "🔄 Bút toán đảo / Hoàn bút toán"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="erp-label">Ngày ghi nhận</label>
                <div className="text-[13px] font-bold text-[var(--text-primary)]">{formatDate(selectedCost.date)}</div>
              </div>
              <div>
                <label className="erp-label">Loại chi phí</label>
                <div className="text-[13px] font-bold text-[var(--text-primary)] uppercase">{costType_LABELS[selectedCost.costType] || selectedCost.costType}</div>
              </div>
              <div>
                <label className="erp-label">Số lượng</label>
                <div className="text-[13px] font-bold text-[var(--text-primary)] tabular-nums">{selectedCost.quantity || 1}</div>
              </div>
              <div>
                <label className="erp-label">Đơn giá</label>
                <div className="text-[13px] font-bold text-[var(--text-primary)] tabular-nums">{(selectedCost.unitPrice || selectedCost.amount).toLocaleString('vi-VN')} ₫</div>
              </div>
            </div>
            <div className="mb-8 p-4 rounded-xl bg-[var(--secondary)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between mb-1">
                <label className="erp-label mb-0">Trạng thái sổ cái</label>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                  selectedCost.workflowStatus === 'POSTED' ? 'bg-emerald-500/20 text-emerald-500' : 
                  selectedCost.workflowStatus === 'REVERSED' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {selectedCost.workflowStatus === 'POSTED' ? 'Đã ghi sổ' : 
                   selectedCost.workflowStatus === 'REVERSED' ? 'Đã hoàn nhập' : 
                   selectedCost.workflowStatus === 'DRAFT' ? 'Bản nháp' : 'Chờ duyệt'}
                </span>
              </div>
              
              {/* Financial Breakdowns */}
              <div className="border-t border-[var(--border)] pt-2 space-y-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <div className="flex justify-between">
                  <span>Trước thuế:</span>
                  <span className="font-extrabold text-[var(--text-secondary)] tabular-nums">{Math.round(selectedCost.netAmount || selectedCost.amount / (1 + (selectedCost.vatRate || 10) / 100)).toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Thuế VAT ({selectedCost.vatRate || 10}%):</span>
                  <span className="font-extrabold text-[var(--text-secondary)] tabular-nums">{Math.round(selectedCost.vatAmount || (selectedCost.amount - (selectedCost.netAmount || selectedCost.amount / (1 + (selectedCost.vatRate || 10) / 100)))).toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2 mb-2">
                  <span>Giữ lại bảo hành ({selectedCost.retentionRate || 0}%):</span>
                  <span className="font-extrabold text-amber-500 tabular-nums">-{Math.round(selectedCost.retentionAmount || 0).toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              <div>
                <label className="erp-label mb-0.5">Tổng hạch toán</label>
                <div className="text-3xl font-black text-[var(--text-accent)] tabular-nums">{selectedCost.amount.toLocaleString('vi-VN')} <span className="text-[11px] text-[var(--text-muted)] uppercase">VNĐ</span></div>
              </div>

              <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-1 text-xs">
                <span className="text-emerald-500 font-extrabold uppercase tracking-widest text-[10px]">Thực thanh toán đợt:</span>
                <span className="font-black text-emerald-500 tabular-nums">{Math.round(selectedCost.amount - (selectedCost.retentionAmount || 0)).toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            {/* Audit Trail Section (Batch 5.2) */}
            <div className="mt-6 border-t border-[var(--border)] pt-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Nhật ký kiểm toán (Audit Trail)
              </div>
              {loadingAudit ? (
                <div className="text-[11px] text-[var(--text-muted)] italic animate-pulse">Đang tải nhật ký...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-[11px] text-[var(--text-muted)] italic">Không có lịch sử thay đổi ghi nhận.</div>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="text-[11px] p-2.5 rounded-lg bg-[var(--secondary)]/45 border border-[var(--border)]">
                      <div className="flex justify-between font-bold text-[var(--text-secondary)]">
                        <span className="uppercase text-[9px] tracking-wider text-blue-500">{log.action}</span>
                        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="text-[var(--text-primary)] font-semibold mt-1">
                        Người thực hiện: <span className="font-bold text-blue-400">{log.user?.name || log.userId || 'Hệ thống'}</span>
                      </div>
                      {log.reason && (
                        <div className="text-[10px] text-amber-500 italic mt-0.5">Lý do: {log.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transition handler function inside UI markup to satisfy React lexical scoping */}
            {(() => {
              const handleTransition = async (nextStatus: string, actionLabel: string) => {
                if (confirm(`Bạn có chắc chắn muốn thực hiện hành động "${actionLabel}"?`)) {
                  try {
                    const res = await fetch(`/api/costs/${selectedCost.id}/approve`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-user-id': 'admin' },
                      body: JSON.stringify({ status: nextStatus })
                    });
                    if (res.ok) {
                      queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(currentProjectId) });
                      queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(currentProjectId), 'stats'] });
                      alert(`${actionLabel} thành công!`);
                      setSelectedCost(null);
                    } else {
                      const err = await res.json();
                      alert('Lỗi: ' + err.error);
                    }
                  } catch (e) {
                    alert('Lỗi kết nối');
                  }
                }
              };

              return (
                <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-[var(--border)]">
                  <div className="flex gap-4">
                    <button 
                      disabled={selectedCost.workflowStatus !== 'DRAFT' && selectedCost.workflowStatus !== 'REJECTED'}
                      onClick={() => setShowAddModal(true)}
                      className="flex-1 erp-btn bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Chỉnh sửa
                    </button>

                    <button 
                      disabled={selectedCost.workflowStatus !== 'DRAFT' && selectedCost.workflowStatus !== 'REJECTED'}
                      onClick={async () => {
                        if (confirm('Bạn có chắc chắn muốn XÓA chi phí này?')) {
                          try {
                            const res = await fetch(`/api/costs/${selectedCost.id}`, {
                              method: 'DELETE',
                              headers: { 'x-user-id': 'admin' }
                            });
                            if (res.ok) {
                              queryClient.invalidateQueries({ queryKey: queryKeys.costs.byProject(currentProjectId) });
                              queryClient.invalidateQueries({ queryKey: [...queryKeys.projects.detail(currentProjectId), 'stats'] });
                              alert('Đã xóa thành công!');
                              setSelectedCost(null);
                            } else {
                              const err = await res.json();
                              alert('Lỗi: ' + err.error);
                            }
                          } catch (e) {
                            alert('Lỗi kết nối');
                          }
                        }
                      }}
                      className="flex-1 erp-btn bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      Xóa bỏ
                    </button>
                  </div>

                  {/* Action Buttons for Workflow Status Transitions */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Nghiệp vụ phê duyệt</div>
                    
                    {selectedCost.workflowStatus === 'DRAFT' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleTransition('PENDING_PM', 'Trình duyệt PM')}
                          className="flex-1 erp-btn bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
                        >
                          Trình duyệt PM
                        </button>
                        <button 
                          onClick={() => handleTransition('PENDING_FINANCE', 'Gửi thẳng Kế toán')}
                          className="flex-1 erp-btn bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                        >
                          Trình Kế Toán
                        </button>
                      </div>
                    )}

                    {selectedCost.workflowStatus === 'PENDING_PM' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleTransition('PENDING_FINANCE', 'Duyệt & Chuyển Kế toán')}
                          className="flex-1 erp-btn bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                        >
                          Duyệt chuyển Kế toán
                        </button>
                        <button 
                          onClick={() => handleTransition('REJECTED', 'Từ chối')}
                          className="flex-1 erp-btn bg-rose-600 text-white hover:bg-rose-500 shadow-sm"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}

                    {selectedCost.workflowStatus === 'PENDING_FINANCE' && (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleTransition('APPROVED', 'Phê duyệt chi phí')}
                            className="flex-1 erp-btn bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                          >
                            Phê duyệt
                          </button>
                          <button 
                            onClick={() => handleTransition('PENDING_DIRECTOR', 'Trình Giám đốc phê duyệt')}
                            className="flex-1 erp-btn bg-amber-600 text-white hover:bg-amber-500 shadow-sm"
                          >
                            Trình Giám Đốc
                          </button>
                        </div>
                        <button 
                          onClick={() => handleTransition('REJECTED', 'Từ chối')}
                          className="w-full erp-btn bg-rose-600 text-white hover:bg-rose-500 shadow-sm"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}

                    {selectedCost.workflowStatus === 'PENDING_DIRECTOR' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleTransition('APPROVED', 'Phê duyệt')}
                          className="flex-1 erp-btn bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                        >
                          Phê duyệt
                        </button>
                        <button 
                          onClick={() => handleTransition('REJECTED', 'Từ chối')}
                          className="flex-1 erp-btn bg-rose-600 text-white hover:bg-rose-500 shadow-sm"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}

                    {selectedCost.workflowStatus === 'APPROVED' && (
                      <button 
                        onClick={() => handleTransition('POSTED', 'Ghi sổ cái')}
                        className="w-full erp-btn bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20"
                      >
                        Ghi sổ cái kế toán
                      </button>
                    )}

                    {selectedCost.workflowStatus === 'POSTED' && (
                      <button 
                        onClick={() => handleTransition('REVERSED', 'Hoàn bút toán')}
                        className="w-full erp-btn bg-purple-600 text-white hover:bg-purple-500 shadow-sm"
                      >
                        Hoàn bút toán
                      </button>
                    )}

                    {selectedCost.workflowStatus === 'REJECTED' && (
                      <button 
                        onClick={() => handleTransition('DRAFT', 'Đưa về Nháp')}
                        className="w-full erp-btn bg-gray-600 text-white hover:bg-gray-500 shadow-sm"
                      >
                        Đưa về Nháp để chỉnh sửa
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <AddCostModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        costRecord={selectedCost}
      />
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useERPStore } from '@/store/erpStore';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import { CostType, CostRecord } from '@/app/types';
import AddCostModal from '@/app/components/modals/AddCostModal';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';
import { TableVirtuoso } from 'react-virtuoso';
import { useProjectStatsQuery } from '@/services/queries/useProjects';

export default function CostsPage() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  
  // React Query server state
  const { data: costs = [], isLoading: isLoadingCosts } = useCostsQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const { data: stats } = useProjectStatsQuery(currentProjectId);
  
  const wbsList = wbsData?.flat || [];

  // Filters & State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCost, setSelectedCost] = useState<CostRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredCosts = useMemo(() => {
    return costs.filter(c => {
      const matchesSearch = c.note?.toLowerCase().includes(search.toLowerCase()) || 
                           c.supplier?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'ALL' || c.costType === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [costs, search, typeFilter, statusFilter]);

  const costTypes: CostType[] = ['material', 'labor', 'machine', 'subcontract', 'overhead', 'other'];

  return (
    <div className="erp-page">
      <Sidebar activeItem="costs" />
      
      <main
        className="erp-page-main"
        style={{ marginLeft: sidebarCollapsed ? 'var(--erp-sidebar-collapsed)' : 'var(--erp-sidebar-width)' }}
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
                    `"${c.note?.replace(/"/g, '""') || ''}"`,
                    `"${(wbsList.find(w => w.id === c.wbsId)?.name || '').replace(/"/g, '""')}"`,
                    c.costType,
                    c.amount,
                    c.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
                  ]);
                  const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `ERP_Costs_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="erp-btn bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--hover-bg)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4-4-4m4 4V4" /></svg>
                Export Excel
              </button>
              <button
                onClick={() => setShowAddModal(true)}
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
                {costTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
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
            <div className="overflow-x-auto scrollbar-hide">
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
                  components={{
                    Table: (props) => <table {...props} className="erp-table w-full min-w-[1000px]" />,
                    TableHead: (props) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
                    TableRow: (props) => <tr {...props} className="group hover:bg-[var(--secondary)] transition-colors cursor-pointer" onClick={() => setSelectedCost(props.item)} />
                  }}
                  fixedHeaderContent={() => (
                    <tr>
                      <th className="bg-[var(--table-head-bg)] w-[100px]">Ngày</th>
                      <th className="bg-[var(--table-head-bg)] min-w-[200px]">Nhà cung cấp & Nội dung</th>
                      <th className="bg-[var(--table-head-bg)] min-w-[150px]">Hạng mục (WBS)</th>
                      <th className="bg-[var(--table-head-bg)] w-[100px]">Loại</th>
                      <th className="bg-[var(--table-head-bg)] w-[100px] text-right">Số lượng</th>
                      <th className="bg-[var(--table-head-bg)] w-[150px] text-right">Thành tiền (VND)</th>
                      <th className="bg-[var(--table-head-bg)] w-[120px] text-center">Trạng thái</th>
                      <th className="bg-[var(--table-head-bg)] w-[80px] text-center">Thao tác</th>
                    </tr>
                  )}
                  itemContent={(i, c) => (
                    <>
                      <td className="whitespace-nowrap font-bold text-[var(--text-muted)] group-hover:text-[var(--text-accent)] transition-colors">{formatDate(c.date)}</td>
                      <td>
                        <div className="font-bold text-[var(--text-primary)]">{c.supplier || 'Nhiều nhà CC'}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-medium truncate max-w-[200px] mt-0.5">{c.note}</div>
                      </td>
                      <td>
                        <div className="text-[12px] font-bold text-[var(--text-secondary)]">{wbsList.find(w => w.id === c.wbsId)?.name || 'N/A'}</div>
                      </td>
                      <td>
                        <span className="rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                          {c.costType}
                        </span>
                      </td>
                      <td className="text-right tabular-nums font-bold text-[var(--text-secondary)]">{c.quantity || 1}</td>
                      <td className="text-right tabular-nums font-black text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors">{formatVnd(c.amount)}</td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                          c.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`}></span>
                          {c.status === 'paid' ? 'Đã trả' : 'Công nợ'}
                        </span>
                      </td>
                      <td className="text-center">
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
                  )}
                />
              )}
            </div>
            
            {/* Pagination */}
            <div className="h-14 border-t border-[var(--border)] flex items-center justify-between px-6 bg-[var(--table-head-bg)]">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Hiển thị <span className="text-[var(--text-primary)] font-black">{filteredCosts.length}</span> / {costs.length} bản ghi</div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 relative shadow-2xl">
            <button onClick={() => setSelectedCost(null)} className="absolute right-6 top-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-8">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 ${
                selectedCost.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30'
              }`}>
                {selectedCost.status === 'paid' ? 'Đã thanh toán' : 'Công nợ'}
              </span>
              <h2 className="text-2xl font-black text-[var(--text-primary)]">{selectedCost.supplier || 'Nhiều nhà CC'}</h2>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">ID: {selectedCost.id.slice(0, 12).toUpperCase()}</p>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="erp-label">Ngày ghi nhận</label>
                <div className="text-[13px] font-bold text-[var(--text-primary)]">{formatDate(selectedCost.date)}</div>
              </div>
              <div>
                <label className="erp-label">Loại chi phí</label>
                <div className="text-[13px] font-bold text-[var(--text-primary)] uppercase">{selectedCost.costType}</div>
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
            <div className="p-4 rounded-xl bg-[var(--secondary)] border border-[var(--border)] mb-8">
              <label className="erp-label">Tổng cộng</label>
              <div className="text-3xl font-black text-[var(--text-accent)] tabular-nums">{selectedCost.amount.toLocaleString('vi-VN')} <span className="text-[11px] text-[var(--text-muted)] uppercase">VND</span></div>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 erp-btn bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--hover-bg)]">In phiếu chi</button>
              <button className="flex-1 erp-btn bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20">Chỉnh sửa</button>
            </div>
          </div>
        </div>
      )}

      <AddCostModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}

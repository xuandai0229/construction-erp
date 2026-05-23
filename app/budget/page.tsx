/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useERPStore } from '@/store/erpStore';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { COL_WIDTHS } from '@/app/utils/table-constants';
import { formatVnd } from '@/app/components/dashboard-data';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';
import EditBudgetModal from '@/app/components/modals/EditBudgetModal';
import ConfirmModal from '@/app/components/modals/ConfirmModal';
import PortalOverlay from '@/app/components/shared/PortalOverlay';

import { useBudgetsQuery, useDeleteBudgetMutation, useImportBudgetMutation } from '@/services/queries/useBudgets';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';
import { exportToCsv } from '@/app/services/export.service';
import { useTableUX } from '@/app/hooks/useTableUX';

const COST_TYPE_LABELS: Record<string, string> = {
  material: 'Vật tư',
  labor: 'Nhân công',
  machine: 'Máy thi công',
  subcontract: 'Thầu phụ',
  overhead: 'Chi phí chung',
  other: 'Khác',
};

const WBSActionMenu = ({ wbsId, onAdd }: { wbsId: string, onAdd: (wbsId: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      setAnchorEl(e.currentTarget);
      setIsOpen(true);
    }
  };

  return (
    <>
      <button 
        onClick={handleToggle}
        className="flex h-7 w-7 items-center justify-center rounded border border-transparent hover:bg-[var(--secondary)] text-[var(--text-secondary)] transition-colors mx-auto"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      <PortalOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} anchorElement={anchorEl} align="right" width={160}>
        <div className="w-full bg-[var(--card)] flex flex-col py-1 border border-[var(--border)] rounded-md shadow-lg">
          <button onClick={() => { setIsOpen(false); onAdd(wbsId); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[var(--text-primary)] hover:bg-[var(--secondary)] text-left">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Thêm chi phí
          </button>
        </div>
      </PortalOverlay>
    </>
  );
};

const BudgetRecordActionMenu = ({ budget, onEdit, onDelete }: { budget: any, onEdit: (budget: any) => void, onDelete: (budget: any) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      setAnchorEl(e.currentTarget);
      setIsOpen(true);
    }
  };

  return (
    <>
      <button 
        onClick={handleToggle}
        className="flex h-7 w-7 items-center justify-center rounded border border-transparent hover:bg-[var(--secondary)] text-[var(--text-secondary)] transition-colors mx-auto"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      <PortalOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} anchorElement={anchorEl} align="right" width={160}>
        <div className="w-full bg-[var(--card)] flex flex-col py-1 border border-[var(--border)] rounded-md shadow-lg">
          <button onClick={() => { setIsOpen(false); onEdit(budget); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[var(--text-primary)] hover:bg-[var(--secondary)] text-left">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Sửa chi tiết
          </button>
          <button onClick={() => { setIsOpen(false); onDelete(budget); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-rose-500 hover:bg-rose-500/10 text-left">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Xóa vĩnh viễn
          </button>
        </div>
      </PortalOverlay>
    </>
  );
};

export default function BudgetPage() {
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialWbsIdForAdd, setInitialWbsIdForAdd] = useState<string | undefined>(undefined);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  
  const [deletingBudget, setDeletingBudget] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCostType, setFilterCostType] = useState('ALL');
  
  const { data: budgets = [] } = useBudgetsQuery(currentProjectId);
  const { data: costsData = [] } = useCostsQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  
  const { mutateAsync: deleteBudget } = useDeleteBudgetMutation(currentProjectId);
  const { mutateAsync: importBudgets } = useImportBudgetMutation(currentProjectId);

  const { scrollContainerRef, showScrollHint, dragCursorClass } = useTableUX();

  const costs = Array.isArray(costsData) ? costsData.filter((c: any) => c.approvalStatus === "APPROVED") : [];

  const { totalBudget, totalActual, variance, pct, filteredTree, overrunCount, unbudgetedCount } = useMemo(() => {
    // 1. Calculate base KPIs from WBS Tree root nodes to match WBS Source of Truth
    const wbsTreeNodes = wbsData?.tree || [];
    
    const tBudget = wbsTreeNodes.filter((n: any) => n.parentId === null).reduce((sum: number, n: any) => sum + n.budget, 0);
    const tActual = wbsTreeNodes.filter((n: any) => n.parentId === null).reduce((sum: number, n: any) => sum + n.actual, 0);
    
    // Virtual nodes aren't real WBS, check wbsId presence vs WBS Tree.
    const validWbsIds = new Set(wbsTreeNodes.filter((n: any) => n.id !== 'virtual-unallocated').map((n: any) => n.id));
    const alloc = wbsTreeNodes.filter((n: any) => validWbsIds.has(n.id) && n.parentId === null).reduce((sum: number, n: any) => sum + n.budget, 0);
    const unalloc = tBudget - alloc;
    
    const varTotal = tBudget - tActual;
    const progress = tBudget > 0 ? (tActual / tBudget) * 100 : 0;

    // 2. Flatten and filter tree
    const tree = wbsTreeNodes.map((node: any) => ({
      id: node.id,
      name: node.name,
      budget: node.budget,
      actual: node.actual,
      variance: node.variance,
      progress: node.percentage,
      status: node.status === 'over' ? 'OVERRUN' : (node.actual > 0 ? 'EXECUTING' : 'NORMAL')
    }));

    // Apply filters
    const searchLower = search.toLowerCase();
    const filtered = tree.filter((node: any) => {
      if (search && !node.name.toLowerCase().includes(searchLower)) return false;
      
      if (filterCostType !== 'ALL') {
        const nodeBudgets = budgets.filter((b: any) => b.wbsId === node.id);
        if (!nodeBudgets.some((b: any) => b.costType === filterCostType)) return false;
      }
      return true;
    });

    const overrunCount = tree.filter((n: any) => n.status === 'OVERRUN' || n.status === 'over').length;
    const unbudgetedCount = tree.filter((n: any) => n.budget === 0).length;

    return { 
      totalBudget: tBudget, 
      allocated: alloc,
      unallocated: unalloc,
      totalActual: tActual, 
      variance: varTotal, 
      pct: progress,
      filteredTree: filtered,
      overrunCount,
      unbudgetedCount
    };
  }, [wbsData, budgets, search, filterCostType]);

  const handleOpenAdd = (wbsId?: string) => {
    setInitialWbsIdForAdd(wbsId);
    setIsAddModalOpen(true);
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setIsEditModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deletingBudget) return;
    try {
      await deleteBudget(deletingBudget.id);
      setDeletingBudget(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        const payload = rows.slice(1).filter(r => r.length > 2).map(r => ({
          projectId: currentProjectId,
          wbsId: r[0]?.trim(),
          estimatedAmount: Number(r[2]?.trim() || 0),
        }));
        if (payload.length > 0) {
          await importBudgets(payload);
          alert(`Import thành công ${payload.length} dòng`);
        }
      };
      reader.readAsText(file);
    } catch {
      alert('Lỗi import');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // UI Expanded state for tree rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => setExpandedRows(p => ({ ...p, [id]: !p[id] }));

  const flattenedNodes = useMemo(() => {
    const flatten = (nodes: any[], indexPrefix: string = ''): any[] => {
      let result: any[] = [];
      nodes.forEach((node, idx) => {
        const currentIndex = indexPrefix ? `${indexPrefix}.${idx + 1}` : `${idx + 1}`;
        const isExpanded = expandedRows[node.id] !== false; // default true
        result.push({ ...node, rowIndex: currentIndex, isExpanded });
        if (isExpanded && node.children && node.children.length > 0) {
          result = result.concat(flatten(node.children, currentIndex));
        }
      });
      return result;
    };
    return flatten(filteredTree);
  }, [filteredTree, expandedRows]);

  return (
    <div className="erp-page">
      <AddBudgetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} initialWbsId={initialWbsIdForAdd} />
      <EditBudgetModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} editingBudget={editingBudget} />
      
      <ConfirmModal
        isOpen={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        onConfirm={executeDelete}
        title="Xác nhận xóa vĩnh viễn dự toán"
        message="Xóa vĩnh viễn dự toán. Dữ liệu tài chính sẽ bị loại bỏ hoàn toàn. Không thể khôi phục."
      />

      <Sidebar activeItem="budget" />
      <main className={`erp-page-main transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}>
        <Header data={{ costs, budgets } as any} />

        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
          <div className="accent-line border-purple-500">
            <h1 className="erp-section-title">Quản lý Dự toán & Chi phí (CBS)</h1>
            <p className="erp-section-subtitle">Hoạch định cấu trúc phân rã chi phí (Cost Breakdown Structure)</p>
          </div>

          {/* KPI STATS - CLONED FROM WBS DESIGN SYSTEM */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                title: 'Tổng dự toán', value: totalBudget.toLocaleString(), label: 'VNĐ',
                accent: 'text-purple-400', gradientFrom: 'from-purple-500/8', gradientTo: 'to-transparent',
                ringColor: 'ring-purple-500/20',
                icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
              },
              {
                title: 'Chi phí thực tế', value: totalActual.toLocaleString(), label: 'VNĐ',
                accent: 'text-amber-400', gradientFrom: 'from-amber-500/8', gradientTo: 'to-transparent',
                ringColor: 'ring-amber-500/20',
                icon: <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />,
              },
              {
                title: 'Chênh lệch', value: variance < 0 ? '' + variance.toLocaleString() : '+' + variance.toLocaleString(), label: 'VNĐ',
                accent: variance >= 0 ? 'text-emerald-400' : 'text-rose-400',
                gradientFrom: variance >= 0 ? 'from-emerald-500/8' : 'from-rose-500/8', gradientTo: 'to-transparent',
                ringColor: variance >= 0 ? 'ring-emerald-500/20' : 'ring-rose-500/20',
                icon: <path d="M23 18l-9.5-9.5-5 5L1 6" />,
              },
              {
                title: '% Sử dụng', value: `${pct.toFixed(1)}%`, label: 'Ngân sách',
                accent: pct > 100 ? 'text-rose-400' : 'text-emerald-400', gradientFrom: pct > 100 ? 'from-rose-500/8' : 'from-emerald-500/8', gradientTo: 'to-transparent',
                ringColor: pct > 100 ? 'ring-rose-500/20' : 'ring-emerald-500/20',
                icon: <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />,
              },
              {
                title: 'Hạng mục vượt', value: overrunCount.toString(), label: 'Cảnh báo',
                accent: overrunCount > 0 ? 'text-rose-500' : 'text-[var(--text-muted)]', gradientFrom: overrunCount > 0 ? 'from-rose-500/8' : 'from-transparent', gradientTo: 'to-transparent',
                ringColor: overrunCount > 0 ? 'ring-rose-500/20' : 'ring-transparent border border-[var(--border)]',
                icon: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />,
              },
              {
                title: 'Chưa có dự toán', value: unbudgetedCount.toString(), label: 'WBS',
                accent: unbudgetedCount > 0 ? 'text-amber-500' : 'text-[var(--text-muted)]', gradientFrom: unbudgetedCount > 0 ? 'from-amber-500/8' : 'from-transparent', gradientTo: 'to-transparent',
                ringColor: unbudgetedCount > 0 ? 'ring-amber-500/20' : 'ring-transparent border border-[var(--border)]',
                icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15h6" />,
              },
            ].map((kpi) => (
              <div key={kpi.title} className="erp-kpi-card group relative overflow-hidden bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 card-elevation">
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradientFrom} ${kpi.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--secondary)] ring-1 ${kpi.ringColor} ${kpi.accent}`}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        {kpi.icon}
                      </svg>
                    </div>
                  </div>
                  <div className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 opacity-70">{kpi.title}</div>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className={`text-2xl font-black tabular-nums tracking-tight ${kpi.accent}`}>{kpi.value}</span>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase opacity-50">{kpi.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section className="space-y-4">
            {/* TOOLBAR & SEARCH - CLONED FROM WBS ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-[var(--border)]">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button onClick={() => handleOpenAdd()} className="erp-btn bg-purple-600 text-white hover:bg-purple-500 shadow-sm shadow-purple-900/20 gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  Lập dự toán
                </button>

                {/* Search */}
                <div className="relative flex-1 min-w-[240px] max-w-[360px] group ml-auto md:ml-2 w-full">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--text-muted)] opacity-50 group-focus-within:text-purple-500 group-focus-within:opacity-100 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm theo mã WBS, tên hạng mục..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="erp-input w-full !pl-10 !pr-8 text-[13px]"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="relative min-w-[160px]">
                  <select 
                    value={filterCostType}
                    onChange={(e) => setFilterCostType(e.target.value)}
                    className="erp-input w-full bg-[var(--secondary)]/50 appearance-none pr-8 text-[13px]"
                  >
                    <option value="ALL">Tất cả loại chi phí</option>
                    {Object.entries(COST_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImport} />
                <button onClick={() => fileInputRef.current?.click()} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Import CSV
                </button>
                <button onClick={() => {
                  const dataToExport = budgets.map((b: any) => ({
                    'Mã WBS': b.wbsId,
                    'Hạng mục thi công': b.wbsName,
                    'Loại chi phí': COST_TYPE_LABELS[b.costType] || b.costType,
                    'Dự toán (VNĐ)': b.estimatedAmount
                  }));
                  exportToCsv(`ERP_Budget_Breakdown_${currentProjectId}.csv`, dataToExport);
                }} className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 3v12"/></svg>
                  Xuất Excel
                </button>
              </div>
            </div>

            <div className="scroll-hint-container relative">
              <div ref={scrollContainerRef} className={`card-elevation overflow-auto border border-[var(--border)] rounded-xl scrollbar-thin ${dragCursorClass}`} style={{ height: 'calc(100vh - 290px)' }}>
                {showScrollHint && (
                  <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-20"
                    style={{
                      background: 'linear-gradient(to left, var(--card) 0%, transparent 100%)',
                      opacity: 0.9
                    }}
                  />
                )}
                <table className="erp-table w-full table-fixed min-w-max">
                  <thead className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-0">
                  <tr>
                    <th className={`sticky top-0 z-10 ${COL_WIDTHS.INDEX} text-center uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] bg-[var(--table-head-bg)]`}>Mở</th>
                    <th className={`sticky top-0 z-10 ${COL_WIDTHS.NAME_WBS} text-left px-4 uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] bg-[var(--table-head-bg)]`}>Cấu trúc hạng mục (WBS) / Phân rã (CBS)</th>
                    <th className={`sticky top-0 z-10 ${COL_WIDTHS.FINANCIAL} text-right uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] bg-[var(--table-head-bg)]`}>Dự toán</th>
                    <th className={`sticky top-0 z-10 ${COL_WIDTHS.FINANCIAL} text-right uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] bg-[var(--table-head-bg)]`}>Thực tế</th>
                    <th className={`sticky top-0 z-10 ${COL_WIDTHS.FINANCIAL} text-right uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] bg-[var(--table-head-bg)]`}>Chênh lệch</th>
                    <th className={`sticky top-0 z-10 ${COL_WIDTHS.STATUS} text-center uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] bg-[var(--table-head-bg)]`}>Trạng thái</th>
                    <th className={`sticky top-0 z-10 ${COL_WIDTHS.ACTIONS} text-center uppercase text-[10px] tracking-widest text-[var(--text-muted)] bg-[var(--table-head-bg)]`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTree.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-40 text-center text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--card)]">
                        Không tìm thấy phân bổ ngân sách nào
                      </td>
                    </tr>
                  ) : (
                    flattenedNodes.map((item: any) => {
                        const wbsBudgets = budgets.filter((b: any) => b.wbsId === item.id);
                        const isExpanded = item.isExpanded;
                        const hasWbsChildren = item.children && item.children.length > 0;
                        const hasBudgets = wbsBudgets.length > 0;
                        const hasAnyChildren = hasWbsChildren || hasBudgets;

                        return (
                          <React.Fragment key={item.id}>
                          <tr className={`transition-colors border-b border-[var(--border)] hover:bg-[var(--secondary)] select-none ${hasAnyChildren ? 'bg-[var(--card)]' : 'bg-[var(--secondary)]/10'}`}>
                            <td className={`${COL_WIDTHS.INDEX} px-4 py-3 text-center text-[12px] font-bold text-[var(--text-accent)] border-r border-[var(--border)] bg-[var(--accent)]`}>
                              {item.rowIndex}
                            </td>
                            <td className={`${COL_WIDTHS.NAME_WBS} border-r border-[var(--border)]`}>
                              <div className="flex items-center h-full min-h-[44px]" style={{ paddingLeft: `${item.level * 24}px` }}>
                                {item.level > 0 && (
                                  <div className="absolute border-l border-[var(--border)] opacity-30" style={{ left: `calc(1rem + ${(item.level - 1) * 24}px + 10px)`, top: 0, bottom: 0 }} />
                                )}
                                {hasAnyChildren ? (
                                  <button onClick={() => toggleRow(item.id)} className="mr-2 flex h-5 w-5 items-center justify-center rounded text-blue-500 hover:bg-blue-500/10 transition-colors shrink-0">
                                    <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M9 18l6-6-6-6"/>
                                    </svg>
                                  </button>
                                ) : (
                                  <div className="mr-2 w-5 flex justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] opacity-40"></div>
                                  </div>
                                )}
                                <span className={`text-[13px] truncate uppercase ${hasAnyChildren ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right font-black tabular-nums text-[var(--text-primary)] border-r border-[var(--border)]`}>{formatVnd(item.budget)}</td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right font-bold tabular-nums text-[var(--text-secondary)] border-r border-[var(--border)]`}>{formatVnd(item.actual)}</td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right font-bold tabular-nums border-r border-[var(--border)] ${item.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatVnd(item.variance)}</td>
                            <td className={`${COL_WIDTHS.STATUS} px-4 border-r border-[var(--border)] text-center`}>
                              {item.budget === 0 ? (
                                <span className="erp-badge border-amber-500/30 text-amber-600 bg-amber-500/10 font-bold">CHƯA LẬP</span>
                              ) : item.status === "OVERRUN" ? (
                                <span className="erp-badge border-rose-600 text-white bg-rose-600 font-bold animate-pulse">VƯỢT NGÂN SÁCH</span>
                              ) : item.status === "EXECUTING" ? (
                                <span className="erp-badge border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold">ĐANG THI CÔNG</span>
                              ) : (
                                <span className="erp-badge border-[var(--border)] text-[var(--text-muted)] bg-[var(--secondary)]">KẾ HOẠCH</span>
                              )}
                            </td>
                            <td className={`${COL_WIDTHS.ACTIONS} text-center`}>
                              <WBSActionMenu wbsId={item.id} onAdd={handleOpenAdd} />
                            </td>
                          </tr>
                          
                          {isExpanded ? Array.from(
                            wbsBudgets.reduce((acc: Map<string, any>, b: any) => {
                              if (acc.has(b.costType)) {
                                acc.get(b.costType).estimatedAmount += Number(b.estimatedAmount);
                              } else {
                                acc.set(b.costType, { ...b, estimatedAmount: Number(b.estimatedAmount) });
                              }
                              return acc;
                            }, new Map()).values()
                          ).map((budget: any) => (
                            <tr key={`${item.id}-${budget.costType}`} className="bg-[var(--secondary)]/10 hover:bg-[var(--secondary)] select-none transition-colors border-b border-dashed border-[var(--border)]/30">
                              <td className="border-r border-[var(--border)]"></td>
                              <td className="px-4 py-2.5 border-r border-[var(--border)]">
                                <div className="flex items-center gap-2" style={{ paddingLeft: `calc(1rem + ${(item.level + 1) * 24}px)` }}>
                                  <div className="absolute border-l border-[var(--border)] opacity-30" style={{ left: `calc(1rem + ${item.level * 24}px + 10px)`, top: 0, bottom: 0 }} />
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                  <span className="text-[12px] font-bold text-[var(--text-secondary)] uppercase">
                                    {COST_TYPE_LABELS[budget.costType] || budget.costType}
                                  </span>
                                </div>
                                </td>
                                <td className="text-right font-bold tabular-nums text-[var(--text-primary)] border-r border-[var(--border)] px-4 text-[12px]">{formatVnd(budget.estimatedAmount)}</td>
                                <td className="border-r border-[var(--border)] bg-[var(--table-head-bg)]/20"></td>
                                <td className="border-r border-[var(--border)] bg-[var(--table-head-bg)]/20"></td>
                                <td className="border-r border-[var(--border)] bg-[var(--table-head-bg)]/20"></td>
                                <td className="text-center">
                                  <BudgetRecordActionMenu budget={budget} onEdit={handleEdit} onDelete={setDeletingBudget} />
                                </td>
                              </tr>
                            )) : null}
                          </React.Fragment>
                        );
                      }) )}
                </tbody>
                <tfoot className="border-t-2 border-[var(--border)] bg-[var(--secondary)]/40 font-black">
                  <tr>
                    <td className={`${COL_WIDTHS.INDEX} text-center border-r border-[var(--border)]`}></td>
                    <td className={`${COL_WIDTHS.NAME_WBS} px-4 py-3 text-[11px] uppercase tracking-wider text-[var(--text-primary)] border-r border-[var(--border)]`}>TỔNG CỘNG HỆ THỐNG</td>
                    <td className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-3 tabular-nums border-r border-[var(--border)] text-purple-600`}>{formatVnd(totalBudget)}</td>
                    <td className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-3 tabular-nums border-r border-[var(--border)] text-amber-500`}>{formatVnd(totalActual)}</td>
                    <td className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-3 tabular-nums border-r border-[var(--border)] ${variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatVnd(variance)}</td>
                    <td className={`${COL_WIDTHS.STATUS} text-center px-4 py-3 border-r border-[var(--border)] text-purple-600`}>{pct.toFixed(1)}%</td>
                    <td className={`${COL_WIDTHS.ACTIONS}`}></td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

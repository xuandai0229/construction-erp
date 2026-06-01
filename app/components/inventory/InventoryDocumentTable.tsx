'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  EnterpriseBadge, 
  EnterpriseEmptyState, 
  EnterpriseLoadingState, 
  EnterpriseErrorState,
  getStatusLabel,
  EnterpriseDataTable,
  EnterpriseColumn
} from '@/app/components/ui-enterprise';

interface InventoryDocumentTableProps {
  currentProjectId?: string;
  onViewDetails: (id: string) => void;
  onCreateNew: () => void;
}

const getStatusVariant = (status: string): "info" | "success" | "warning" | "error" | "neutral" => {
  switch (status) {
    case 'DRAFT': return 'neutral';
    case 'SUBMITTED': return 'warning';
    case 'APPROVED': return 'success';
    case 'POSTED': return 'info';
    case 'REVERSED': return 'error';
    default: return 'neutral';
  }
};

const getDocTypeLabel = (type: string) => {
  switch (type) {
    case 'PURCHASE_RECEIPT': return 'Nhập kho mua hàng';
    case 'ISSUE_TO_PROJECT': return 'Xuất kho công trình';
    case 'TRANSFER': return 'Điều chuyển kho';
    case 'ADJUSTMENT': return 'Điều chỉnh tồn kho';
    default: return type;
  }
};

export function InventoryDocumentTable({ currentProjectId, onViewDetails, onCreateNew }: InventoryDocumentTableProps) {
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: docsRes, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory-documents', currentProjectId, docTypeFilter, statusFilter],
    queryFn: async () => {
      let url = `/api/inventory/documents?projectId=${currentProjectId || ""}`;
      if (docTypeFilter) url += `&type=${docTypeFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  const docs = Array.isArray(docsRes) ? docsRes : [];
  const filtered = docs.filter((d: any) => 
    d.documentNo.toLowerCase().includes(search.toLowerCase()) || 
    (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: EnterpriseColumn<any>[] = [
    { key: 'documentNo', header: 'Số phiếu', render: row => (
      <span 
        className={`font-bold text-[var(--primary)] cursor-pointer hover:underline ${row.status === 'REVERSED' ? 'line-through opacity-60 text-[var(--text-muted)]' : ''}`} 
        onClick={() => onViewDetails(row.id)}
      >
        {row.documentNo}
      </span>
    ), width: '150px' },
    { key: 'documentDate', header: 'Ngày HT', render: row => new Date(row.documentDate).toLocaleDateString('vi-VN'), width: '120px', align: 'center' },
    { key: 'documentType', header: 'Loại chứng từ', render: row => getDocTypeLabel(row.documentType), width: '180px' },
    { key: 'project', header: 'Dự án', render: row => row.project?.name || <span className="text-[var(--text-muted)] italic">Kho tổng</span>, minWidth: '180px' },
    { key: 'description', header: 'Diễn giải', render: row => row.description || '-', truncate: true, minWidth: '240px' },
    { key: 'totalAmount', header: 'Tổng tiền', render: row => {
      const totalAmt = row.lines?.reduce((s: number, l: any) => s + (Number(l.quantity) * Number(l.unitCost)), 0) || 0;
      return <span className="font-mono font-semibold">{totalAmt.toLocaleString('vi-VN')} đ</span>;
    }, width: '160px', align: 'right' },
    { key: 'status', header: 'Trạng thái', render: row => (
      <EnterpriseBadge variant={getStatusVariant(row.status)}>
        {getStatusLabel(row.status)}
      </EnterpriseBadge>
    ), width: '140px', align: 'center' },
    { key: 'actions', header: 'Thao tác', render: row => (
      <button 
        onClick={() => onViewDetails(row.id)} 
        className="px-2.5 py-1 text-[10px] font-semibold rounded bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--secondary)]/70 transition-colors cursor-pointer"
      >
        Chi tiết
      </button>
    ), width: '100px', align: 'center' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Tìm theo số phiếu, diễn giải..." 
          className="flex-1 min-w-[200px] h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] text-sm" 
        />
        <select 
          value={docTypeFilter} 
          onChange={(e) => setDocTypeFilter(e.target.value)} 
          className="w-[180px] h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="">-- Tất cả loại --</option>
          <option value="PURCHASE_RECEIPT">Nhập kho</option>
          <option value="ISSUE_TO_PROJECT">Xuất kho</option>
          <option value="TRANSFER">Điều chuyển</option>
          <option value="ADJUSTMENT">Điều chỉnh</option>
        </select>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="w-[180px] h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="DRAFT">Nháp (DRAFT)</option>
          <option value="SUBMITTED">Chờ duyệt (SUBMITTED)</option>
          <option value="APPROVED">Đã duyệt (APPROVED)</option>
          <option value="POSTED">Đã ghi sổ (POSTED)</option>
          <option value="REVERSED">Đã đảo (REVERSED)</option>
        </select>
        <button 
          onClick={onCreateNew} 
          className="h-10 px-5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-bold text-sm shadow-md ml-auto whitespace-nowrap transition-colors"
        >
          + Lập phiếu kho
        </button>
      </div>

      {isLoading ? (
        <EnterpriseLoadingState message="Đang tải danh sách chứng từ kho..." />
      ) : error ? (
        <EnterpriseErrorState 
          title="Lỗi tải dữ liệu" 
          description="Không thể kết nối máy chủ để tải danh sách chứng từ kho." 
          onRetry={refetch} 
        />
      ) : filtered.length === 0 ? (
        <EnterpriseEmptyState 
          title="Không tìm thấy chứng từ kho" 
          description="Chưa có dữ liệu nào khớp với điều kiện tìm kiếm hiện tại." 
          iconType="voucher"
        />
      ) : (
        <EnterpriseDataTable
          data={filtered}
          columns={columns}
          getRowKey={row => row.id}
          minWidth="1200px"
        />
      )}
    </div>
  );
}

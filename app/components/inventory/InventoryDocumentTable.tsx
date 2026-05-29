'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EnterpriseBadge, EnterpriseEmptyState } from '@/app/components/ui-enterprise';

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

  const { data: docsRes, isLoading, error } = useQuery({
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
  const filtered = docs.filter((d: any) => d.documentNo.toLowerCase().includes(search.toLowerCase()) || (d.description && d.description.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/80">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo số phiếu, diễn giải..." className="flex-1 min-w-[200px] h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm" />
        <select value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)} className="w-[180px] h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-none focus:border-blue-500">
          <option value="">-- Tất cả loại --</option><option value="PURCHASE_RECEIPT">Nhập kho</option><option value="ISSUE_TO_PROJECT">Xuất kho</option><option value="TRANSFER">Điều chuyển</option><option value="ADJUSTMENT">Điều chỉnh</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[180px] h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-none focus:border-blue-500">
          <option value="">-- Tất cả trạng thái --</option><option value="DRAFT">DRAFT</option><option value="SUBMITTED">SUBMITTED</option><option value="APPROVED">APPROVED</option><option value="POSTED">POSTED</option><option value="REVERSED">REVERSED</option>
        </select>
        <button onClick={onCreateNew} className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg ml-auto whitespace-nowrap">Lập phiếu kho</button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <div key={i} className="h-12 w-full animate-pulse bg-zinc-800/40 rounded-lg" />)}</div>
      ) : error ? (
        <div className="p-4 rounded bg-red-950/20 border border-red-900/50 text-red-400">Lỗi khi tải danh sách chứng từ kho.</div>
      ) : filtered.length === 0 ? (
        <EnterpriseEmptyState title="Không tìm thấy chứng từ kho" description="Hãy tạo mới chứng từ kho đầu tiên." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
              <tr><th className="p-3">Số phiếu</th><th className="p-3">Ngày HT</th><th className="p-3">Loại chứng từ</th><th className="p-3">Dự án</th><th className="p-3">Diễn giải</th><th className="p-3 text-right">Tổng tiền</th><th className="p-3 text-center">Trạng thái</th><th className="p-3 w-20">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-200">
              {filtered.map((d: any) => {
                const totalAmt = d.lines?.reduce((s: number, l: any) => s + (Number(l.quantity) * Number(l.unitCost)), 0) || 0;
                return (
                  <tr key={d.id} className="hover:bg-zinc-800/20">
                    <td className="p-3"><span className={`font-bold text-blue-400 cursor-pointer hover:underline ${d.status === 'REVERSED' ? 'line-through opacity-65' : ''}`} onClick={() => onViewDetails(d.id)}>{d.documentNo}</span></td>
                    <td className="p-3 font-mono">{new Date(d.documentDate).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3">{getDocTypeLabel(d.documentType)}</td>
                    <td className="p-3">{d.project?.name || <span className="text-zinc-500 italic">Kho tổng</span>}</td>
                    <td className="p-3 max-w-[200px] truncate">{d.description || '-'}</td>
                    <td className="p-3 text-right font-mono font-semibold">{totalAmt.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 text-center"><EnterpriseBadge variant={getStatusVariant(d.status)}>{d.status}</EnterpriseBadge></td>
                    <td className="p-3"><button onClick={() => onViewDetails(d.id)} className="px-2 py-1 text-[10px] font-semibold rounded bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700">Chi tiết</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

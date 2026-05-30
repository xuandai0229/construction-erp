'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryDocumentLinesTable } from './InventoryDocumentLinesTable';
import { InventoryStatusTimeline } from './InventoryStatusTimeline';
import { InventoryJournalPreview } from './InventoryJournalPreview';
import { useERPStore } from '@/store/erpStore';
import { 
  EnterpriseModal, 
  EnterpriseLoadingState,
  getStatusLabel 
} from '@/app/components/ui-enterprise';

interface InventoryDocumentFormProps {
  docId: string | null; // null for creating new
  onBack: () => void;
}

export function InventoryDocumentForm({ docId, onBack }: InventoryDocumentFormProps) {
  const queryClient = useQueryClient();
  const { userRole } = useERPStore();

  // Mode & Loading States
  const [isEditMode, setIsEditMode] = useState(!docId);

  // Form Headers
  const [documentNo, setDocumentNo] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentType, setDocumentType] = useState('PURCHASE_RECEIPT');
  const [projectId, setProjectId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<any[]>([]);

  // Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch projects (for header dropdown)
  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  // Fetch suppliers (for purchase receipt)
  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  // Fetch Document details (if editing/viewing)
  const { data: docRes, isLoading: isLoadingDoc } = useQuery({
    queryKey: ['inventory-doc-detail', docId],
    queryFn: async () => {
      if (!docId) return null;
      const res = await fetch(`/api/inventory/documents/${docId}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!docId
  });

  const doc = docRes;

  // Initialize form fields when document is fetched
  useEffect(() => {
    if (doc) {
      setDocumentNo(doc.documentNo);
      setDocumentDate(new Date(doc.documentDate).toISOString().split('T')[0]);
      setDocumentType(doc.documentType);
      setProjectId(doc.projectId || '');
      setSupplierId(doc.supplierId || '');
      setDescription(doc.description || '');
      setLines(doc.lines.map((l: any) => ({
        id: l.id,
        materialItemId: l.materialItemId,
        sourceWarehouseId: l.sourceWarehouseId || undefined,
        targetWarehouseId: l.targetWarehouseId || undefined,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
        vatRate: l.vatRate || 0,
        wbsId: l.wbsId || ''
      })));
      setIsEditMode(doc.status === 'DRAFT');
    } else if (!docId) {
      // New Doc default number template
      setDocumentNo(`PK-${Date.now().toString().slice(-6)}`);
      setDocumentDate(new Date().toISOString().split('T')[0]);
      setDocumentType('PURCHASE_RECEIPT');
      setProjectId('');
      setSupplierId('');
      setDescription('');
      setLines([]);
      setIsEditMode(true);
    }
  }, [doc, docId]);

  const projects = Array.isArray(projectsRes) ? projectsRes : [];
  const suppliers = Array.isArray(suppliersRes) ? suppliersRes : [];

  const isReadOnly = !isEditMode || (doc && doc.status !== 'DRAFT');

  // Mutation to Save Document
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        documentNo,
        documentDate: new Date(documentDate).toISOString(),
        documentType,
        projectId: projectId || null,
        supplierId: supplierId || null,
        description,
        lines: lines.map(line => ({
          materialItemId: line.materialItemId,
          sourceWarehouseId: line.sourceWarehouseId || null,
          targetWarehouseId: line.targetWarehouseId || null,
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
          vatRate: Number(line.vatRate) || 0,
          wbsId: line.wbsId || null
        }))
      };

      const url = docId ? `/api/inventory/documents/${docId}` : '/api/inventory/documents';
      const method = docId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi lưu chứng từ kho');
      return json.data;
    },
    onSuccess: (savedData) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-documents'] });
      alert('Lưu chứng từ kho thành công!');
      if (!docId) {
        onBack();
      } else {
        queryClient.invalidateQueries({ queryKey: ['inventory-doc-detail', docId] });
        setIsEditMode(false);
      }
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  // State Transition Mutations
  const transitionMutation = useMutation({
    mutationFn: async ({ action, reason }: { action: string; reason?: string }) => {
      const res = await fetch(`/api/inventory/documents/${docId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reason ? JSON.stringify({ reason }) : undefined
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Lỗi khi thực hiện ${action}`);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-documents'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-doc-detail', docId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-journal-preview', docId] });
      alert('Thao tác chuyển trạng thái thành công!');
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleAction = (action: string) => {
    if (action === 'reject') {
      setShowRejectModal(true);
      return;
    }
    if (confirm(`Bạn có chắc muốn thực hiện thao tác này?`)) {
      transitionMutation.mutate({ action });
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectReason.trim().length < 5) {
      alert('Lý do từ chối phải dài tối thiểu 5 ký tự!');
      return;
    }
    transitionMutation.mutate({ action: 'reject', reason: rejectReason });
  };

  const handlePrint = () => {
    if (!docId || !doc) return;
    const printUrl = doc.documentType === 'PURCHASE_RECEIPT'
      ? `/print/inventory/receipt/${docId}`
      : `/print/inventory/issue/${docId}`;
    window.open(printUrl, '_blank', 'width=800,height=600');
  };

  const handleExport = () => {
    if (!docId) return;
    window.open(`/api/export/inventory/document/${docId}`, '_blank');
  };

  if (docId && isLoadingDoc) {
    return <EnterpriseLoadingState message="Đang tải chi tiết chứng từ..." />;
  }

  const totalPayment = lines.reduce((sum, line) => {
    const cost = Number(line.quantity || 0) * Number(line.unitCost || 0);
    const vat = cost * (Number(line.vatRate || 0) / 100);
    return sum + cost + vat;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Readonly Banner for Posted/Reversed */}
      {doc && (doc.status === 'POSTED' || doc.status === 'REVERSED') && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${doc.status === 'POSTED' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              {doc.status === 'POSTED' ? (
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <div className="text-xs font-bold uppercase tracking-wider">
              {doc.status === 'POSTED'
                ? 'CHỨNG TỪ KHO ĐÃ GHI SỔ CÁI (CHỈ XEM) - KHÔNG THỂ CHỈNH SỬA'
                : 'CHỨNG TỪ KHO ĐÃ HỦY GHI SỔ CÁI (ĐÃ ĐẢO CHỨNG TỪ) - NGHIÊM CẤM TÁC ĐỘNG'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold rounded bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-primary)] border border-[var(--border)] transition-colors"
            >
              In phiếu (A4)
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-bold rounded bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-primary)] border border-[var(--border)] transition-colors"
            >
              Xuất dữ liệu
            </button>
          </div>
        </div>
      )}

      {/* Toolbar / Actions */}
      <div className="flex items-center justify-between bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer"
        >
          ← Quay lại danh sách
        </button>

        <div className="flex gap-2">
          {/* Draft operations */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-md transition-colors cursor-pointer"
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
          )}

          {doc && doc.status === 'DRAFT' && (
            <button
              type="button"
              onClick={() => handleAction('submit')}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
            >
              Trình duyệt (Submit)
            </button>
          )}

          {/* Submitted Operations (Approval Inbox Workflow) */}
          {doc && doc.status === 'SUBMITTED' && (
            <>
              <button
                type="button"
                onClick={() => handleAction('approve')}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                Phê duyệt (Approve)
              </button>
              <button
                type="button"
                onClick={() => handleAction('reject')}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                Từ chối (Reject)
              </button>
            </>
          )}

          {/* Approved Operations (Ready to Post) */}
          {doc && doc.status === 'APPROVED' && (
            <button
              type="button"
              onClick={() => handleAction('post')}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            >
              Ghi sổ cái (Post Ledger)
            </button>
          )}

          {/* Posted Operations (Allow Reversal) */}
          {doc && doc.status === 'POSTED' && (
            <button
              type="button"
              onClick={() => handleAction('reverse')}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors cursor-pointer"
            >
              Hủy ghi sổ (Reverse)
            </button>
          )}
        </div>
      </div>

      {/* Header Fields Form Card */}
      <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-6">
        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
          {docId ? `CHI TIẾT CHỨNG TỪ KHO ${documentNo}` : 'LẬP CHỨNG TỪ KHO MỚI'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Số chứng từ *</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-65 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Ngày hạch toán *</label>
            <input
              type="date"
              disabled={isReadOnly}
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-65 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Loại chứng từ *</label>
            <select
              disabled={isReadOnly || !!docId}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-65"
            >
              <option value="PURCHASE_RECEIPT">Nhập kho mua hàng (Receipt)</option>
              <option value="ISSUE_TO_PROJECT">Xuất kho công trình (Issue)</option>
              <option value="TRANSFER">Điều chuyển kho (Transfer)</option>
              <option value="ADJUSTMENT">Điều chỉnh tồn kho (Adjustment)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Dự án công trình</label>
            <select
              disabled={isReadOnly}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-65"
            >
              <option value="">Không liên kết (Kho tổng)</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {documentType === 'PURCHASE_RECEIPT' && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Nhà cung cấp *</label>
              <select
                disabled={isReadOnly}
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-65"
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Diễn giải nghiệp vụ</label>
          <textarea
            disabled={isReadOnly}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả lý do nhập xuất hoặc nguồn vật tư..."
            className="w-full h-20 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-65 text-sm"
          />
        </div>
      </div>

      {/* Grid Lines Table */}
      <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
        <InventoryDocumentLinesTable
          lines={lines}
          onChange={setLines}
          readOnly={isReadOnly}
          docType={documentType}
        />

        <div className="mt-6 flex flex-col items-end gap-2 border-t border-[var(--border)] pt-4 pr-4">
          <div className="text-sm font-semibold text-[var(--text-secondary)]">
            Tổng trị giá hạch toán: <span className="font-mono font-bold text-[var(--text-primary)] text-base">{lines.reduce((sum, l) => sum + (Number(l.quantity) * Number(l.unitCost)), 0).toLocaleString('vi-VN')} đ</span>
          </div>
          {documentType === 'PURCHASE_RECEIPT' && (
            <div className="text-sm font-semibold text-[var(--text-secondary)]">
              Tổng thanh toán gồm VAT: <span className="font-mono font-bold text-[var(--primary)] text-lg">{totalPayment.toLocaleString('vi-VN')} đ</span>
            </div>
          )}
        </div>
      </div>

      {/* Double-entry Ledger Preview (Only when posted) */}
      {docId && doc && doc.status === 'POSTED' && (
        <InventoryJournalPreview docId={docId} isPosted={true} />
      )}

      {/* Timeline Status */}
      {doc && (
        <InventoryStatusTimeline status={doc.status} auditLogs={doc.auditLogs} />
      )}

      {/* Reject Reason Modal */}
      <EnterpriseModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="NHẬP LÝ DO TỪ CHỐI DUYỆT CHỨNG TỪ"
        maxWidth="md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Lý do từ chối (Tối thiểu 5 ký tự) *</label>
            <textarea
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="vd: Sai thông số đơn giá thép hoặc sai mã WBS công trình."
              className="w-full h-24 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--secondary)]/80 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={transitionMutation.isPending}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 transition-colors"
            >
              {transitionMutation.isPending ? 'Đang từ chối...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </form>
      </EnterpriseModal>
    </div>
  );
}

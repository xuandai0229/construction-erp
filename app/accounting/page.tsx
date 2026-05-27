'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import { exportToCsv } from '@/app/services/export.service';

type Project = { id: string; name: string; contractValue: number };
type Supplier = { id: string; code: string; name: string };
type ContractRow = {
  id: string;
  projectId: string;
  projectName: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  contractCode: string;
  title: string;
  contractValue: number;
  totalAcceptance: number;
  totalInvoice: number;
  totalPayment: number;
  debt: number;
  warnings: any[];
  invoices: any[];
};

const defaultForm = {
  supplierCode: '',
  supplierName: '',
  supplierId: '',
  contractId: '',
  contractCode: '',
  contractTitle: '',
  contractValue: '',
  acceptanceNumber: '',
  acceptanceAmount: '',
  invoiceNumber: '',
  invoiceAmount: '',
  paymentAmount: '',
  paymentInvoiceId: '',
  planDueDate: '',
  planAmount: '',
  planMethod: '',
  checklistName: '',
};

async function apiPost(payload: Record<string, any>) {
  const res = await fetch('/api/accounting-core', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Không xử lý được yêu cầu.');
  return json.data;
}

export default function AccountingPage() {
  const router = useRouter();
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  const [workspace, setWorkspace] = useState<{ projects: Project[]; suppliers: Supplier[] }>({ projects: [], suppliers: [] });
  const [ledger, setLedger] = useState<any>(null);
  const [projectId, setProjectId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [contractId, setContractId] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadWorkspace = async () => {
    const res = await fetch('/api/accounting-core?action=workspace');
    const json = await res.json();
    if (json.success) {
      setWorkspace(json.data);
      if (!projectId && json.data.projects[0]) setProjectId(json.data.projects[0].id);
    }
  };

  const loadLedger = async (id = projectId) => {
    if (!id) return;
    const res = await fetch(`/api/accounting-core?action=project&projectId=${id}`);
    const json = await res.json();
    if (json.success) setLedger(json.data);
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    loadLedger(projectId);
    setSupplierId('');
    setContractId('');
  }, [projectId]);

  const projectSuppliers: Supplier[] = ledger?.suppliers || [];
  const contracts: ContractRow[] = ledger?.contracts || [];
  const supplierContracts = useMemo(
    () => contracts.filter(contract => !supplierId || contract.supplierId === supplierId),
    [contracts, supplierId],
  );
  const selectedContract = contracts.find(contract => contract.id === contractId);

  const refreshAll = async () => {
    await loadWorkspace();
    await loadLedger();
  };

  const runAction = async (label: string, payload: Record<string, any>) => {
    setLoading(true);
    setMessage('');
    try {
      const data = await apiPost(payload);
      setMessage(`${label} thành công.`);
      await refreshAll();
      if (payload.action === 'createSupplier') {
        setSupplierId(data.id);
        setForm(prev => ({ ...prev, supplierId: data.id }));
      }
      if (payload.action === 'createContract') {
        setContractId(data.id);
        setForm(prev => ({ ...prev, contractId: data.id }));
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = workspace.projects.find(project => project.id === projectId);
  const warnings = ledger?.warnings || [];
  const redCount = warnings.filter((warning: any) => warning.severity === 'RED').length;
  const yellowCount = warnings.filter((warning: any) => warning.severity === 'YELLOW').length;

  return (
    <div className="erp-page">
      <Sidebar activeItem="accounting" />
      <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
        <Header />
        <div className="erp-content-container space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="accent-line">
              <h1 className="erp-section-title">Tổng hợp tạm ứng, thanh toán</h1>
              <p className="erp-section-subtitle">Nhập liệu theo công trình, nhà cung cấp, hợp đồng và truy ngược chứng từ gốc.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="erp-input h-10 min-w-64">
                {workspace.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <button
                className="erp-btn h-10 border border-[var(--border)] bg-[var(--secondary)]"
                onClick={() => exportToCsv('Tong_Hop_Tam_Ung_Thanh_Toan.csv', ledger?.reports?.payableByContract || [])}
              >
                Xuất Excel/CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              ['Giá trị hợp đồng', ledger?.reports?.projectSummary?.[0]?.contractValue || 0],
              ['Tổng nghiệm thu', ledger?.reports?.projectSummary?.[0]?.acceptance || 0],
              ['Tổng hóa đơn', ledger?.reports?.projectSummary?.[0]?.invoice || 0],
              ['Đã tạm ứng/thanh toán', ledger?.reports?.projectSummary?.[0]?.payment || 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
                <div className="mt-2 text-lg font-black tabular-nums text-[var(--text-primary)]">{formatVnd(Number(value))}</div>
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">1. Công trình</span>
                <div className="erp-input flex h-10 items-center">{selectedProject?.name || 'Chưa chọn'}</div>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">2. Nhà cung cấp thuộc công trình</span>
                <select value={supplierId} onChange={e => { setSupplierId(e.target.value); setContractId(''); }} className="erp-input h-10">
                  <option value="">Tất cả nhà cung cấp</option>
                  {projectSuppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.code} - {supplier.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">3. Hợp đồng gốc</span>
                <select value={contractId} onChange={e => setContractId(e.target.value)} className="erp-input h-10">
                  <option value="">Chọn hợp đồng</option>
                  {supplierContracts.map(contract => <option key={contract.id} value={contract.id}>{contract.contractCode} - {contract.title}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
              <h2 className="text-[12px] font-black uppercase tracking-widest">Nhà cung cấp</h2>
              <input className="erp-input h-10 w-full" placeholder="Mã NCC duy nhất" value={form.supplierCode} onChange={e => setForm({ ...form, supplierCode: e.target.value })} />
              <input className="erp-input h-10 w-full" placeholder="Tên nhà cung cấp" value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} />
              <button disabled={loading || !projectId} className="erp-btn w-full bg-blue-600 text-white" onClick={() => runAction('Tạo nhà cung cấp', { action: 'createSupplier', code: form.supplierCode, name: form.supplierName })}>Tạo NCC</button>
              <select className="erp-input h-10 w-full" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">Chọn NCC có sẵn</option>
                {workspace.suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.code} - {supplier.name}</option>)}
              </select>
              <button disabled={loading || !projectId || !form.supplierId} className="erp-btn w-full border border-[var(--border)] bg-[var(--secondary)]" onClick={() => runAction('Gán NCC vào công trình', { action: 'linkSupplier', projectId, supplierId: form.supplierId })}>Gán vào công trình</button>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
              <h2 className="text-[12px] font-black uppercase tracking-widest">Hợp đồng</h2>
              <input className="erp-input h-10 w-full" placeholder="Mã hợp đồng" value={form.contractCode} onChange={e => setForm({ ...form, contractCode: e.target.value })} />
              <input className="erp-input h-10 w-full" placeholder="Tên hợp đồng" value={form.contractTitle} onChange={e => setForm({ ...form, contractTitle: e.target.value })} />
              <input className="erp-input h-10 w-full" placeholder="Giá trị hợp đồng" type="number" value={form.contractValue} onChange={e => setForm({ ...form, contractValue: e.target.value })} />
              <button
                disabled={loading || !projectId || !(supplierId || form.supplierId)}
                className="erp-btn w-full bg-blue-600 text-white"
                onClick={() => runAction('Tạo hợp đồng', {
                  action: 'createContract',
                  projectId,
                  supplierId: supplierId || form.supplierId,
                  contractCode: form.contractCode,
                  title: form.contractTitle,
                  originalValue: Number(form.contractValue),
                })}
              >
                Tạo hợp đồng
              </button>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
              <h2 className="text-[12px] font-black uppercase tracking-widest">Nghiệm thu / Hóa đơn</h2>
              <input className="erp-input h-10 w-full" placeholder="Số nghiệm thu" value={form.acceptanceNumber} onChange={e => setForm({ ...form, acceptanceNumber: e.target.value })} />
              <input className="erp-input h-10 w-full" placeholder="Giá trị nghiệm thu" type="number" value={form.acceptanceAmount} onChange={e => setForm({ ...form, acceptanceAmount: e.target.value })} />
              <button disabled={loading || !contractId} className="erp-btn w-full border border-[var(--border)] bg-[var(--secondary)]" onClick={() => runAction('Nhập nghiệm thu', { action: 'createAcceptance', contractId, acceptanceNumber: form.acceptanceNumber, amount: Number(form.acceptanceAmount) })}>Nhập nghiệm thu</button>
              <input className="erp-input h-10 w-full" placeholder="Số hóa đơn" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} />
              <input className="erp-input h-10 w-full" placeholder="Giá trị hóa đơn" type="number" value={form.invoiceAmount} onChange={e => setForm({ ...form, invoiceAmount: e.target.value })} />
              <button disabled={loading || !contractId} className="erp-btn w-full bg-blue-600 text-white" onClick={() => runAction('Nhập hóa đơn', { action: 'createInvoice', contractId, invoiceNumber: form.invoiceNumber, amount: Number(form.invoiceAmount) })}>Nhập hóa đơn</button>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
              <h2 className="text-[12px] font-black uppercase tracking-widest">Thanh toán / Kế hoạch</h2>
              <select className="erp-input h-10 w-full" value={form.paymentInvoiceId} onChange={e => setForm({ ...form, paymentInvoiceId: e.target.value })}>
                <option value="">Tạm ứng hoặc chưa chọn hóa đơn</option>
                {selectedContract?.invoices.map(invoice => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber || invoice.id.slice(0, 8)} - {formatVnd(invoice.amount)}</option>)}
              </select>
              <input className="erp-input h-10 w-full" placeholder="Số tiền thanh toán" type="number" value={form.paymentAmount} onChange={e => setForm({ ...form, paymentAmount: e.target.value })} />
              <button disabled={loading || !contractId} className="erp-btn w-full bg-blue-600 text-white" onClick={() => runAction('Nhập thanh toán', { action: 'createPayment', contractId, invoiceId: form.paymentInvoiceId || null, amount: Number(form.paymentAmount) })}>Nhập thanh toán</button>
              <input className="erp-input h-10 w-full" type="date" value={form.planDueDate} onChange={e => setForm({ ...form, planDueDate: e.target.value })} />
              <input className="erp-input h-10 w-full" placeholder="Số tiền kế hoạch" type="number" value={form.planAmount} onChange={e => setForm({ ...form, planAmount: e.target.value })} />
              <button disabled={loading || !contractId} className="erp-btn w-full border border-[var(--border)] bg-[var(--secondary)]" onClick={() => runAction('Thêm kế hoạch thanh toán', { action: 'createPaymentPlan', contractId, dueDate: form.planDueDate, amount: Number(form.planAmount), paymentMethod: form.planMethod })}>Thêm kế hoạch</button>
              <input className="erp-input h-10 w-full" placeholder="Hồ sơ còn thiếu" value={form.checklistName} onChange={e => setForm({ ...form, checklistName: e.target.value })} />
              <button disabled={loading || !contractId} className="erp-btn w-full border border-[var(--border)] bg-[var(--secondary)]" onClick={() => runAction('Thêm hồ sơ cần kiểm tra', { action: 'createChecklistItem', contractId, name: form.checklistName })}>Thêm hồ sơ</button>
            </div>
          </section>

          {message && <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3 text-[13px] font-bold">{message}</div>}

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-[12px] font-black uppercase tracking-widest">Bảng tổng hợp theo hợp đồng</h2>
              <div className="text-[11px] font-bold text-[var(--text-muted)]">Đỏ: {redCount} | Vàng: {yellowCount}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="erp-table min-w-[1100px]">
                <thead>
                  <tr>
                    <th>Công trình</th>
                    <th>Nhà cung cấp</th>
                    <th>Hợp đồng</th>
                    <th className="text-right">Giá trị HĐ</th>
                    <th className="text-right">Nghiệm thu</th>
                    <th className="text-right">Hóa đơn</th>
                    <th className="text-right">Tạm ứng/TT</th>
                    <th className="text-right">Công nợ</th>
                    <th>Cảnh báo</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(contract => (
                    <tr key={contract.id} className="cursor-pointer hover:bg-[var(--secondary)]" onClick={() => router.push(`/accounting/contracts/${contract.id}`)}>
                      <td>{contract.projectName}</td>
                      <td>{contract.supplierCode} - {contract.supplierName}</td>
                      <td className="font-bold text-blue-500">{contract.contractCode}</td>
                      <td className="text-right tabular-nums">{formatVnd(contract.contractValue)}</td>
                      <td className="text-right tabular-nums">{formatVnd(contract.totalAcceptance)}</td>
                      <td className="text-right tabular-nums">{formatVnd(contract.totalInvoice)}</td>
                      <td className="text-right tabular-nums">{formatVnd(contract.totalPayment)}</td>
                      <td className={`text-right tabular-nums font-black ${contract.debt < 0 ? 'text-rose-500' : 'text-amber-500'}`}>{formatVnd(contract.debt)}</td>
                      <td>{contract.warnings.length ? `${contract.warnings.length} cảnh báo` : 'Xanh'}</td>
                    </tr>
                  ))}
                  {contracts.length === 0 && (
                    <tr><td colSpan={9} className="h-28 text-center text-[12px] font-bold text-[var(--text-muted)]">Chưa có hợp đồng kế toán công trình.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-[12px] font-black uppercase tracking-widest">Cảnh báo đỏ offline</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {warnings.slice(0, 30).map((warning: any) => (
                <button key={warning.id} onClick={() => warning.href && router.push(warning.href)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--secondary)]">
                  <div>
                    <div className={`text-[11px] font-black uppercase tracking-widest ${warning.severity === 'RED' ? 'text-rose-500' : 'text-amber-500'}`}>{warning.severity}</div>
                    <div className="text-[13px] font-bold">{warning.reason}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{warning.documentType}: {warning.documentId} | Trạng thái: {warning.status}</div>
                  </div>
                  <div className="text-right font-black tabular-nums">{formatVnd(Number(warning.amount || 0))}</div>
                </button>
              ))}
              {warnings.length === 0 && <div className="p-6 text-[12px] font-bold text-[var(--text-muted)]">Không có cảnh báo đỏ/vàng theo dữ liệu hiện tại.</div>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

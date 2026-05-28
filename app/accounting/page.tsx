'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import { exportToCsv } from '@/app/services/export.service';
import {
  EnterpriseCard,
  EnterpriseTable,
  EnterpriseSection,
  EnterpriseMetric,
  EnterpriseBadge,
  EnterpriseEmptyState,
  EnterpriseFilterBar,
  FormGroup,
  Input,
  Select,
  Column
} from '@/app/components/ui-enterprise';

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

  const columnsContracts: Column<ContractRow>[] = [
    {
      header: "Công trình",
      accessor: (row) => row.projectName || "N/A",
      width: "15%"
    },
    {
      header: "Nhà cung cấp",
      accessor: (row) => `${row.supplierCode} - ${row.supplierName}`,
      width: "20%"
    },
    {
      header: "Hợp đồng",
      accessor: (row) => <span className="font-bold text-blue-500 hover:underline">{row.contractCode}</span>,
      width: "15%"
    },
    {
      header: "Giá trị HĐ",
      accessor: (row) => formatVnd(row.contractValue),
      align: "right",
      width: "12%"
    },
    {
      header: "Nghiệm thu",
      accessor: (row) => formatVnd(row.totalAcceptance),
      align: "right",
      width: "12%"
    },
    {
      header: "Hóa đơn",
      accessor: (row) => formatVnd(row.totalInvoice),
      align: "right",
      width: "12%"
    },
    {
      header: "Tạm ứng/TT",
      accessor: (row) => formatVnd(row.totalPayment),
      align: "right",
      width: "12%"
    },
    {
      header: "Công nợ",
      accessor: (row) => (
        <span className={row.debt < 0 ? 'text-rose-500 font-bold' : 'text-amber-500 font-bold'}>
          {formatVnd(row.debt)}
        </span>
      ),
      align: "right",
      width: "12%"
    },
    {
      header: "Cảnh báo",
      accessor: (row) => row.warnings.length ? (
        <EnterpriseBadge variant="error">{row.warnings.length} cảnh báo</EnterpriseBadge>
      ) : (
        <EnterpriseBadge variant="success">An toàn</EnterpriseBadge>
      ),
      align: "center",
      width: "10%"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="vouchers" />
      <main className={`erp-page-main flex-1 flex flex-col h-screen overflow-hidden ${sidebarCollapsed ? 'pl-[var(--erp-sidebar-collapsed)]' : 'pl-[var(--erp-sidebar-width)]'}`}>
        <Header />
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between select-none pb-4 border-b border-[var(--border)]">
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Tổng hợp tạm ứng, thanh toán</h1>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-1">Nhập liệu theo công trình, nhà cung cấp, hợp đồng và truy ngược chứng từ gốc.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={projectId} onChange={e => setProjectId(e.target.value)} className="min-w-64">
                {workspace.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </Select>
              <button
                className="h-[38px] px-4 text-xs font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--text-primary)] rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer"
                onClick={() => exportToCsv('Tong_Hop_Tam_Ung_Thanh_Toan.csv', ledger?.reports?.payableByContract || [])}
              >
                Xuất Excel/CSV
              </button>
            </div>
          </div>

          {/* Section: Chỉ số tài chính công trình */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnterpriseMetric
              title="GIÁ TRỊ HỢP ĐỒNG"
              value={formatVnd(ledger?.reports?.projectSummary?.[0]?.contractValue || 0)}
              isLoading={loading}
            />
            <EnterpriseMetric
              title="TỔNG NGHIỆM THU"
              value={formatVnd(ledger?.reports?.projectSummary?.[0]?.acceptance || 0)}
              isLoading={loading}
            />
            <EnterpriseMetric
              title="TỔNG HÓA ĐƠN"
              value={formatVnd(ledger?.reports?.projectSummary?.[0]?.invoice || 0)}
              isLoading={loading}
            />
            <EnterpriseMetric
              title="ĐÃ TẠM ỨNG / THANH TOÁN"
              value={formatVnd(ledger?.reports?.projectSummary?.[0]?.payment || 0)}
              isLoading={loading}
            />
          </div>

          {/* Section: Bộ lọc đối tượng */}
          <EnterpriseSection title="1. ĐỐI TƯỢNG HẠCH TOÁN">
            <EnterpriseFilterBar>
              <FormGroup label="Công trình" className="flex-1 min-w-[200px]">
                <div className="flex h-[38px] items-center px-3 text-xs bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-secondary)] font-semibold select-none">
                  {selectedProject?.name || 'Chưa chọn'}
                </div>
              </FormGroup>
              <FormGroup label="Nhà cung cấp thuộc công trình" className="flex-1 min-w-[200px]">
                <Select value={supplierId} onChange={e => { setSupplierId(e.target.value); setContractId(''); }}>
                  <option value="">Tất cả nhà cung cấp</option>
                  {projectSuppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.code} - {supplier.name}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Hợp đồng gốc" className="flex-1 min-w-[200px]">
                <Select value={contractId} onChange={e => setContractId(e.target.value)}>
                  <option value="">Chọn hợp đồng</option>
                  {supplierContracts.map(contract => <option key={contract.id} value={contract.id}>{contract.contractCode} - {contract.title}</option>)}
                </Select>
              </FormGroup>
            </EnterpriseFilterBar>
          </EnterpriseSection>

          {/* Section: Nghiệp vụ chi tiết */}
          <EnterpriseSection title="2. PHÁT SINH NGHIỆP VỤ HẠCH TOÁN (NỢ / CÓ / CHI PHÍ)">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* NCC Card */}
              <EnterpriseCard title="NHÀ CUNG CẤP / TỔ ĐỘI" subtitle="Khai báo đối tượng công nợ">
                <div className="space-y-4">
                  <FormGroup label="Mã NCC duy nhất" required>
                    <Input placeholder="Mã NCC (Ví dụ: NCC001)" value={form.supplierCode} onChange={e => setForm({ ...form, supplierCode: e.target.value })} />
                  </FormGroup>
                  <FormGroup label="Tên nhà cung cấp" required>
                    <Input placeholder="Tên nhà cung cấp / tổ đội" value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} />
                  </FormGroup>
                  <button
                    disabled={loading || !projectId}
                    className="w-full h-[38px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => runAction('Tạo nhà cung cấp', { action: 'createSupplier', code: form.supplierCode, name: form.supplierName })}
                  >
                    Tạo NCC mới
                  </button>
                  <div className="border-t border-[var(--divider)] pt-4">
                    <FormGroup label="Chọn NCC có sẵn">
                      <Select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                        <option value="">Chọn NCC có sẵn</option>
                        {workspace.suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.code} - {supplier.name}</option>)}
                      </Select>
                    </FormGroup>
                  </div>
                  <button
                    disabled={loading || !projectId || !form.supplierId}
                    className="w-full h-[38px] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => runAction('Gán NCC vào công trình', { action: 'linkSupplier', projectId, supplierId: form.supplierId })}
                  >
                    Gán vào công trình
                  </button>
                </div>
              </EnterpriseCard>

              {/* Hợp đồng Card */}
              <EnterpriseCard title="HỢP ĐỒNG XÂY DỰNG" subtitle="Hợp đồng nhà thầu phụ, mua vật tư">
                <div className="space-y-4">
                  <FormGroup label="Mã hợp đồng" required>
                    <Input placeholder="Mã hợp đồng (Ví dụ: HD-001)" value={form.contractCode} onChange={e => setForm({ ...form, contractCode: e.target.value })} />
                  </FormGroup>
                  <FormGroup label="Tên hợp đồng" required>
                    <Input placeholder="Tên gói thầu / vật tư" value={form.contractTitle} onChange={e => setForm({ ...form, contractTitle: e.target.value })} />
                  </FormGroup>
                  <FormGroup label="Giá trị hợp đồng (VND)" required>
                    <Input placeholder="Giá trị hợp đồng" type="number" value={form.contractValue} onChange={e => setForm({ ...form, contractValue: e.target.value })} />
                  </FormGroup>
                  <button
                    disabled={loading || !projectId || !(supplierId || form.supplierId)}
                    className="w-full h-[38px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              </EnterpriseCard>

              {/* Nghiệm thu / Hóa đơn Card */}
              <EnterpriseCard title="NGHIỆM THU & HÓA ĐƠN" subtitle="Hạch toán khối lượng hoàn thành">
                <div className="space-y-4">
                  <FormGroup label="Số nghiệm thu">
                    <Input placeholder="Số biên bản nghiệm thu" value={form.acceptanceNumber} onChange={e => setForm({ ...form, acceptanceNumber: e.target.value })} />
                  </FormGroup>
                  <FormGroup label="Giá trị nghiệm thu (VND)">
                    <Input placeholder="Số tiền nghiệm thu" type="number" value={form.acceptanceAmount} onChange={e => setForm({ ...form, acceptanceAmount: e.target.value })} />
                  </FormGroup>
                  <button
                    disabled={loading || !contractId}
                    className="w-full h-[38px] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => runAction('Nhập nghiệm thu', { action: 'createAcceptance', contractId, acceptanceNumber: form.acceptanceNumber, amount: Number(form.acceptanceAmount) })}
                  >
                    Ghi nhận Nghiệm thu
                  </button>
                  <div className="border-t border-[var(--divider)] pt-4">
                    <FormGroup label="Số hóa đơn VAT">
                      <Input placeholder="Số ký hiệu hóa đơn VAT" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} />
                    </FormGroup>
                  </div>
                  <FormGroup label="Giá trị hóa đơn (VND)">
                    <Input placeholder="Tổng tiền trước thuế" type="number" value={form.invoiceAmount} onChange={e => setForm({ ...form, invoiceAmount: e.target.value })} />
                  </FormGroup>
                  <button
                    disabled={loading || !contractId}
                    className="w-full h-[38px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => runAction('Nhập hóa đơn', { action: 'createInvoice', contractId, invoiceNumber: form.invoiceNumber, amount: Number(form.invoiceAmount) })}
                  >
                    Hạch toán Hóa đơn VAT
                  </button>
                </div>
              </EnterpriseCard>

              {/* Thanh toán / Kế hoạch Card */}
              <EnterpriseCard title="THANH TOÁN & HỒ SƠ" subtitle="Ủy nhiệm chi, chi tiền mặt, hoàn ứng">
                <div className="space-y-4">
                  <FormGroup label="Hóa đơn thanh toán">
                    <Select value={form.paymentInvoiceId} onChange={e => setForm({ ...form, paymentInvoiceId: e.target.value })}>
                      <option value="">Tạm ứng hoặc chưa chọn hóa đơn</option>
                      {selectedContract?.invoices.map(invoice => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber || invoice.id.slice(0, 8)} - {formatVnd(invoice.amount)}</option>)}
                    </Select>
                  </FormGroup>
                  <FormGroup label="Số tiền thanh toán (VND)">
                    <Input placeholder="Số tiền thanh toán thực tế" type="number" value={form.paymentAmount} onChange={e => setForm({ ...form, paymentAmount: e.target.value })} />
                  </FormGroup>
                  <button
                    disabled={loading || !contractId}
                    className="w-full h-[38px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => runAction('Nhập thanh toán', { action: 'createPayment', contractId, invoiceId: form.paymentInvoiceId || null, amount: Number(form.paymentAmount) })}
                  >
                    Hạch toán Chi tiền
                  </button>
                  <div className="border-t border-[var(--divider)] pt-4">
                    <FormGroup label="Hồ sơ còn thiếu">
                      <Input placeholder="Tên hồ sơ cần hoàn thiện" value={form.checklistName} onChange={e => setForm({ ...form, checklistName: e.target.value })} />
                    </FormGroup>
                  </div>
                  <button
                    disabled={loading || !contractId}
                    className="w-full h-[38px] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => runAction('Thêm hồ sơ cần kiểm tra', { action: 'createChecklistItem', contractId, name: form.checklistName })}
                  >
                    Ghi chú thiếu hồ sơ
                  </button>
                </div>
              </EnterpriseCard>

            </div>
          </EnterpriseSection>

          {message && (
            <div className="p-3.5 text-xs font-semibold rounded-[var(--radius-sm)] border bg-blue-500/10 text-blue-400 border-blue-500/20 select-none">
              {message}
            </div>
          )}

          {/* Section: Bảng dữ liệu hợp đồng */}
          <EnterpriseSection title="3. BẢNG TỔNG HỢP DỮ LIỆU PHẢI TRẢ (CÔNG NỢ NHÀ THẦU PHỤ)">
            <EnterpriseCard
              title="BẢNG TỔNG HỢP CÔNG NỢ THEO HỢP ĐỒNG"
              subtitle="Nhấn vào hàng để truy ngược chi tiết thanh toán / hóa đơn của hợp đồng đó"
              headerActions={<div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Đỏ: {redCount} lỗi | Vàng: {yellowCount} cảnh báo</div>}
            >
              <EnterpriseTable
                data={contracts}
                columns={columnsContracts}
                onRowClick={(row) => router.push(`/accounting/contracts/${row.id}`)}
                loading={loading}
                emptyState={
                  <EnterpriseEmptyState
                    title="Chưa có hợp đồng kế toán công trình"
                    description="Khai báo dự án, nhà cung cấp và tạo hợp đồng đầu tiên để hạch toán tạm ứng và thanh toán."
                    iconType="voucher"
                  />
                }
              />
            </EnterpriseCard>
          </EnterpriseSection>

          {/* Section: Cảnh báo đỏ */}
          <EnterpriseSection title="4. CẢNH BÁO TỰ ĐỘNG CHÊNH LỆCH DỮ LIỆU">
            <EnterpriseCard title="DANH SÁCH CẢNH BÁO KẾ TOÁN" subtitle="Hệ thống tự động phát hiện lệch dòng tiền, lệch hóa đơn hoặc vượt giá trị hợp đồng">
              {warnings.length === 0 ? (
                <EnterpriseEmptyState
                  title="Không phát hiện lỗi chênh lệch dữ liệu"
                  description="Mọi số liệu hạch toán giữa Nghiệm thu, Hóa đơn và Tạm ứng đang khớp hoàn hảo."
                  iconType="report"
                />
              ) : (
                <div className="divide-y divide-[var(--divider)]">
                  {warnings.slice(0, 15).map((warning: any) => (
                    <button
                      key={warning.id}
                      onClick={() => warning.href && router.push(warning.href)}
                      className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-[var(--table-row-hover)] transition-colors select-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <EnterpriseBadge variant={warning.severity === 'RED' ? 'error' : 'warning'}>
                            {warning.severity === 'RED' ? 'Lỗi nghiêm trọng' : 'Cảnh báo'}
                          </EnterpriseBadge>
                          <span className="text-xs font-bold text-[var(--text-primary)]">{warning.reason}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {warning.documentType}: {warning.documentId} | Trạng thái: {warning.status}
                        </div>
                      </div>
                      <div className="text-right font-mono font-medium text-xs tabular-nums text-[var(--text-primary)]">
                        {formatVnd(Number(warning.amount || 0))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </EnterpriseCard>
          </EnterpriseSection>

        </div>
      </main>
    </div>
  );
}


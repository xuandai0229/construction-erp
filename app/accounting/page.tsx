'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatVnd, formatProjectName } from '@/app/components/dashboard-data';
import { auditedCsvExport } from '@/app/services/audited-export.service';

import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';

import {
  EnterpriseCard,
  EnterpriseDataTable,
  EnterpriseColumn,
  EnterpriseSection,
  EnterpriseMetric,
  EnterpriseBadge,
  EnterpriseEmptyState,
  EnterpriseFilterBar,
  FormGroup,
  Input,
  Select
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

function formatWarningText(text: string) {
  let clean = text || "";
  if (clean.toLowerCase().includes("missing supplier")) clean = "Hợp đồng thiếu thông tin nhà cung cấp hoặc mã hợp đồng";
  if (clean.toLowerCase().includes("missing")) clean = "Cần bổ sung thông tin hợp đồng trước khi đối chiếu công nợ";
  // Remove UUIDs
  clean = clean.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, '[Mã ẩn]');
  return clean;
}

export default function AccountingPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<{ projects: Project[]; suppliers: Supplier[] }>({ projects: [], suppliers: [] });
  const [ledger, setLedger] = useState<any>(null);
  const [projectId, setProjectId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [contractId, setContractId] = useState('');
  const [period, setPeriod] = useState('current-month');
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'contracts' | 'alerts'>('overview');

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
  const paymentSummary = useMemo(() => {
    const totalInvoice = supplierContracts.reduce((sum, row) => sum + Number(row.totalInvoice || 0), 0);
    const paidAmount = supplierContracts.reduce((sum, row) => sum + Number(row.totalPayment || 0), 0);
    const totalContractValue = supplierContracts.reduce((sum, row) => sum + Number(row.contractValue || 0), 0);
    const outstandingPayment = supplierContracts.reduce((sum, row) => sum + Math.max(Number(row.totalInvoice || 0) - Number(row.totalPayment || 0), 0), 0);
    const outstandingAdvance = supplierContracts.reduce((sum, row) => sum + Math.max(Number(row.totalPayment || 0) - Number(row.totalInvoice || 0), 0), 0);
    
    // Nếu bảng có dữ liệu nhưng payment = 0, thì tổng tạm ứng là totalPayment (dù = 0).
    return {
      totalAdvance: paidAmount, // Tạm coi thanh toán là tạm ứng nếu chưa có hóa đơn
      paidAmount,
      settledAmount: Math.min(totalInvoice, paidAmount),
      outstandingPayment,
      outstandingAdvance,
      hasData: supplierContracts.length > 0
    };
  }, [supplierContracts]);

  const handleAuditedExport = async () => {
    try {
      await auditedCsvExport({ reportType: 'DEBT_PAYABLE', projectId, reason: 'Xuất tổng hợp tạm ứng và thanh toán theo hợp đồng' });
    } catch (error: any) {
      alert(error.message || 'Không thể xuất tổng hợp tạm ứng và thanh toán.');
    }
  };
  const warnings = ledger?.warnings || [];
  const redCount = warnings.filter((warning: any) => warning.severity === 'RED').length;
  const yellowCount = warnings.filter((warning: any) => warning.severity === 'YELLOW').length;

  const columnsContracts: EnterpriseColumn<ContractRow>[] = [
    {
      key: 'projectName',
      header: "Công trình",
      width: "160px",
      render: (row) => formatProjectName(row.projectName)
    },
    {
      key: 'supplier',
      header: "Nhà cung cấp",
      minWidth: "220px",
      render: (row) => `${row.supplierCode} - ${row.supplierName}`
    },
    {
      key: 'contractCode',
      header: "Hợp đồng",
      width: "150px",
      render: (row) => <span className="font-bold text-blue-500 hover:underline">{row.contractCode}</span>
    },
    {
      key: 'contractValue',
      header: "Giá trị HĐ",
      width: "140px",
      align: "right",
      render: (row) => formatVnd(row.contractValue)
    },
    {
      key: 'totalAcceptance',
      header: "Nghiệm thu",
      width: "140px",
      align: "right",
      render: (row) => formatVnd(row.totalAcceptance)
    },
    {
      key: 'totalInvoice',
      header: "Hóa đơn",
      width: "140px",
      align: "right",
      render: (row) => formatVnd(row.totalInvoice)
    },
    {
      key: 'totalPayment',
      header: "Tạm ứng/TT",
      width: "140px",
      align: "right",
      render: (row) => formatVnd(row.totalPayment)
    },
    {
      key: 'debt',
      header: "Công nợ",
      width: "140px",
      align: "right",
      render: (row) => (
        <span className={row.debt < 0 ? 'text-rose-500 font-bold' : 'text-amber-500 font-bold'}>
          {formatVnd(row.debt)}
        </span>
      )
    },
    {
      key: 'warnings',
      header: "Cảnh báo",
      width: "130px",
      align: "center",
      render: (row) => row.warnings.length ? (
        <EnterpriseBadge variant="error">{row.warnings.length} cảnh báo</EnterpriseBadge>
      ) : (
        <EnterpriseBadge variant="success">An toàn</EnterpriseBadge>
      )
    }
  ];

  return (
    <EnterpriseAppShell activeItem="accounting">
      <EnterpriseHeader
        title="Tổng hợp tạm ứng & thanh toán"
        subtitle="Theo dõi tạm ứng, thanh toán, hoàn ứng và công nợ phải trả theo công trình."
      />
      <EnterprisePageContainer>
        
        {/* Title action bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Tổng hợp tạm ứng & thanh toán</h1>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-1">Theo dõi theo công trình, nhà cung cấp, hợp đồng và chứng từ gốc.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={projectId} onChange={e => setProjectId(e.target.value)} className="min-w-64">
              {workspace.projects.map(project => <option key={project.id} value={project.id}>{formatProjectName(project.name)}</option>)}
            </Select>
            <Select value={period} onChange={e => setPeriod(e.target.value)} className="min-w-48">
              <option value="current-month">Tháng hiện tại</option>
              <option value="current-quarter">Quý hiện tại</option>
              <option value="current-year">Năm hiện tại</option>
            </Select>
            <button
              className="h-[38px] px-4 text-xs font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--text-primary)] rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer whitespace-nowrap"
              onClick={handleAuditedExport}
            >
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)] mb-6 overflow-x-auto scrollbar-hide">
          <button
            className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'overview' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveTab('overview')}
          >
            Tổng hợp
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'operations' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveTab('operations')}
          >
            Phát sinh nghiệp vụ
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'contracts' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveTab('contracts')}
          >
            Công nợ theo hợp đồng
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'alerts' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveTab('alerts')}
          >
            Cảnh báo rủi ro <span className="ml-1 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-600">{redCount + yellowCount}</span>
          </button>
        </div>

        {/* Tab 1: Tổng hợp */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <EnterpriseSection title="ĐỐI TƯỢNG HẠCH TOÁN">
              <EnterpriseFilterBar>
                <FormGroup label="Công trình" className="flex-1 min-w-[200px]">
                  <div className="flex h-[38px] items-center px-3 text-xs bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-secondary)] font-semibold select-none">
                    {formatProjectName(selectedProject?.name) || 'Chưa chọn'}
                  </div>
                </FormGroup>
                <FormGroup label="Nhà cung cấp" className="flex-1 min-w-[200px]">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <EnterpriseMetric title="Tổng tạm ứng" value={formatVnd(paymentSummary.totalAdvance)} isLoading={loading} description={paymentSummary.hasData && paymentSummary.totalAdvance === 0 ? "Chưa có phát sinh chi tiền" : undefined} />
              <EnterpriseMetric title="Đã thanh toán" value={formatVnd(paymentSummary.paidAmount)} isLoading={loading} />
              <EnterpriseMetric title="Đã hoàn ứng/đối trừ" value={formatVnd(paymentSummary.settledAmount)} isLoading={loading} />
              <EnterpriseMetric title="Còn phải thanh toán theo hóa đơn" value={formatVnd(paymentSummary.outstandingPayment)} isLoading={loading} />
              <EnterpriseMetric title="Còn phải hoàn ứng" value={formatVnd(paymentSummary.outstandingAdvance)} isLoading={loading} />
            </div>

            {supplierContracts.length > 0 && !loading && (
              <div className="mt-8">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Danh sách công nợ theo hợp đồng</h3>
              <EnterpriseDataTable
                data={supplierContracts}
                minWidth="900px"
                columns={[
                  { key: 'supplier', header: "Nhà cung cấp", minWidth: "220px", render: (row) => `${row.supplierCode} - ${row.supplierName}` },
                  { key: 'contractCode', header: "Hợp đồng", width: "150px", render: (row) => <span className="font-bold text-blue-500 hover:underline">{row.contractCode}</span> },
                  { key: 'contractValue', header: "Giá trị HĐ", width: "140px", align: "right", render: (row) => formatVnd(row.contractValue) },
                  { key: 'totalAcceptance', header: "Nghiệm thu", width: "140px", align: "right", render: (row) => formatVnd(row.totalAcceptance) },
                  { key: 'totalInvoice', header: "Hóa đơn", width: "140px", align: "right", render: (row) => formatVnd(row.totalInvoice) },
                  { key: 'totalPayment', header: "Đã TT", width: "140px", align: "right", render: (row) => formatVnd(row.totalPayment) },
                ]}
                emptyState={<EnterpriseEmptyState title="Không có hợp đồng" description="Chưa có dữ liệu công nợ hợp đồng" />}
              />
            </div>
            )}
            {supplierContracts.length === 0 && !loading && (
               <div className="mt-8">
                 <EnterpriseEmptyState
                    title="Chưa có dữ liệu thanh toán"
                    description="Hiện chưa có hợp đồng hoặc nhà cung cấp nào được chọn. Vui lòng thiết lập ở tab Phát sinh nghiệp vụ."
                    iconType="voucher"
                  />
               </div>
            )}
          </div>
        )}

        {/* Tab 2: Phát sinh nghiệp vụ */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            <EnterpriseSection title="Phát sinh nghiệp vụ kế toán">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* NCC Card */}
                <EnterpriseCard title="NHÀ CUNG CẤP / TỔ ĐỘI" subtitle="Khai báo đối tượng công nợ">
                  <div className="space-y-4">
                    <FormGroup label="Mã nhà cung cấp" required>
                      <Input placeholder="Mã nhà cung cấp, ví dụ NCC001" value={form.supplierCode} onChange={e => setForm({ ...form, supplierCode: e.target.value })} />
                    </FormGroup>
                    <FormGroup label="Tên nhà cung cấp" required>
                      <Input placeholder="Tên nhà cung cấp / tổ đội" value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} />
                    </FormGroup>
                    <button
                      disabled={loading || !projectId}
                      className="w-full h-[38px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => runAction('Tạo nhà cung cấp', { action: 'createSupplier', code: form.supplierCode, name: form.supplierName })}
                    >
                      Tạo nhà cung cấp mới
                    </button>
                    <div className="border-t border-[var(--divider)] pt-4">
                      <FormGroup label="Chọn nhà cung cấp có sẵn">
                        <Select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                          <option value="">Chọn nhà cung cấp có sẵn</option>
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
                    <FormGroup label="Giá trị hợp đồng (đ)" required>
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
                    <FormGroup label="Giá trị nghiệm thu (đ)">
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
                    <FormGroup label="Giá trị hóa đơn (đ)">
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
                        {selectedContract?.invoices.map((invoice: any) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber || invoice.id.slice(0, 8)} - {formatVnd(invoice.amount)}</option>)}
                      </Select>
                    </FormGroup>
                    <FormGroup label="Số tiền thanh toán (đ)">
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
              <div className="p-3.5 text-xs font-semibold rounded-[var(--radius-sm)] border bg-blue-500/10 text-blue-400 border-blue-500/20 select-none animate-fade-in">
                {message}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bảng dữ liệu hợp đồng */}
        {activeTab === 'contracts' && (
          <EnterpriseSection title="Bảng tổng hợp công nợ phải trả">
            <EnterpriseCard
              title="CÔNG NỢ THEO HỢP ĐỒNG"
              subtitle="Nhấn vào hàng để xem chi tiết thanh toán và hóa đơn của hợp đồng."
              headerActions={<div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Lọc hiển thị {supplierContracts.length} hợp đồng</div>}
              bodyClassName="p-0"
            >
              <EnterpriseDataTable
                data={supplierContracts}
                columns={columnsContracts}
                onRowClick={(row) => router.push(`/accounting/contracts/${row.id}`)}
                loading={loading}
                minWidth="1420px"
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
        )}

        {/* Tab 4: Cảnh báo đỏ */}
        {activeTab === 'alerts' && (
          <EnterpriseSection title="CẢNH BÁO TỰ ĐỘNG CHÊNH LỆCH DỮ LIỆU">
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
                      className="flex w-full items-center justify-between gap-4 py-3 px-4 text-left hover:bg-[var(--table-row-hover)] transition-colors select-none cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <EnterpriseBadge variant={warning.severity === 'RED' ? 'error' : 'warning'}>
                            {warning.severity === 'RED' ? 'Cần xử lý' : 'Cảnh báo'}
                          </EnterpriseBadge>
                          <span className="text-xs font-bold text-[var(--text-primary)]">{formatWarningText(warning.reason)}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                          {warning.documentType === 'CONTRACT' ? 'Hợp đồng' : warning.documentType === 'INVOICE' ? 'Hóa đơn' : 'Chứng từ'} {warning.projectName ? '- ' + warning.projectName : ''} | Trạng thái: Cần bổ sung thông tin
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-xs tabular-nums text-[var(--text-primary)]">
                        {formatVnd(Number(warning.amount || 0))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </EnterpriseCard>
          </EnterpriseSection>
        )}

      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

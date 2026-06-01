'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useProjectsQuery } from '@/services/queries/useProjects';

import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';

import {
  EnterpriseDataTable,
  EnterpriseColumn,
  EnterpriseCard,
  EnterpriseSection,
  EnterpriseMetric,
  EnterpriseTabs,
  EnterpriseEmptyState,
  EnterpriseFilterBar,
  EnterpriseBadge,
  EnterpriseModal,
  FormGroup,
  Input,
  Select
} from '@/app/components/ui-enterprise';

interface TaxInvoice {
  id: string;
  invoiceType: 'OUTBOUND' | 'INBOUND';
  invoiceNumber: string;
  invoiceSeries: string;
  invoiceTemplate: string;
  invoiceDate: string;
  partnerName: string;
  partnerTaxCode: string;
  partnerAddress?: string;
  netAmount: string;
  vatRate: string;
  vatAmount: string;
  grossAmount: string;
  status: 'DRAFT' | 'ISSUED' | 'POSTED' | 'CANCELLED' | 'REVERSED';
  description?: string;
  postedJournalEntryId?: string;
  project?: { name: string };
  contract?: { contractNumber: string; title: string };
}

interface VatSummary {
  totalSalesNet: number;
  totalSalesVat: number;
  totalPurchasesNet: number;
  totalPurchasesVat: number;
  vatPayable: number;
  vatRefundable: number;
  invoiceCount: number;
}

export default function TaxDashboard() {
  const { currentProjectId } = useERPStore();
  const { data: paginatedData } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const currentProject = projects.find((p: any) => p.id === currentProjectId);
  
  // State
  const [activeTab, setActiveTab] = useState<'registry' | 'reports'>('registry');
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [summary, setSummary] = useState<VatSummary>({
    totalSalesNet: 0,
    totalSalesVat: 0,
    totalPurchasesNet: 0,
    totalPurchasesVat: 0,
    vatPayable: 0,
    vatRefundable: 0,
    invoiceCount: 0,
  });

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  
  // Form values
  const [invoiceType, setInvoiceType] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceSeries, setInvoiceSeries] = useState('');
  const [invoiceTemplate, setInvoiceTemplate] = useState('1C26TBB');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [partnerName, setPartnerName] = useState('');
  const [partnerTaxCode, setPartnerTaxCode] = useState('');
  const [partnerAddress, setPartnerAddress] = useState('');
  const [netAmount, setNetAmount] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(10);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [manualVat, setManualVat] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [description, setDescription] = useState('');
  
  // Reason Dialogs
  const [showReasonModal, setShowReasonModal] = useState<'cancel' | 'reverse' | null>(null);
  const [reasonInvoiceId, setReasonInvoiceId] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const projId = currentProject?.id || 'ALL';
      const qParams = new URLSearchParams();
      if (projId !== 'ALL') qParams.append('projectId', projId);
      if (filterType !== 'ALL') qParams.append('invoiceType', filterType);
      if (filterStatus !== 'ALL') qParams.append('status', filterStatus);
      if (search) qParams.append('search', search);
      if (startDate) qParams.append('startDate', startDate);
      if (endDate) qParams.append('endDate', endDate);

      // Fetch Invoices
      const resInv = await fetch(`/api/tax/invoices?${qParams.toString()}`);
      const invData = await resInv.json();
      if (invData.success) {
        setInvoices(invData.data);
      } else {
        throw new Error(invData.error || 'Failed to fetch invoices');
      }

      // Fetch Summary
      const resSum = await fetch(`/api/tax/reports/summary?${startDate ? `startDate=${startDate}&` : ''}${endDate ? `endDate=${endDate}` : ''}`);
      const sumData = await resSum.json();
      if (sumData.success) {
        setSummary(sumData.data);
      } else {
        throw new Error(sumData.error || 'Failed to fetch summary');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProject, filterType, filterStatus, startDate, endDate]);

  // Handle auto-calculation of VAT
  useEffect(() => {
    if (!manualVat) {
      const calculated = Math.round(netAmount * (vatRate / 100));
      setVatAmount(calculated);
    }
  }, [netAmount, vatRate, manualVat]);

  // Actions
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        invoiceType,
        invoiceNumber,
        invoiceSeries,
        invoiceTemplate,
        invoiceDate: new Date(invoiceDate),
        partnerName,
        partnerTaxCode,
        partnerAddress,
        netAmount,
        vatRate,
        vatAmount,
        description,
        overrideReason: manualVat ? overrideReason : undefined,
        projectId: currentProject?.id !== 'ALL' ? currentProject?.id : undefined,
      };

      let res;
      if (selectedInvoice) {
        // Update
        res = await fetch(`/api/tax/invoices/${selectedInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await fetch('/api/tax/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Lỗi hệ thống: ${err.message}`);
    }
  };

  const resetForm = () => {
    setSelectedInvoice(null);
    setInvoiceType('OUTBOUND');
    setInvoiceNumber('');
    setInvoiceSeries('');
    setInvoiceTemplate('1C26TBB');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPartnerName('');
    setPartnerTaxCode('');
    setPartnerAddress('');
    setNetAmount(0);
    setVatRate(10);
    setVatAmount(0);
    setManualVat(false);
    setOverrideReason('');
    setDescription('');
  };

  const handleEditClick = (inv: TaxInvoice) => {
    setSelectedInvoice(inv);
    setInvoiceType(inv.invoiceType);
    setInvoiceNumber(inv.invoiceNumber);
    setInvoiceSeries(inv.invoiceSeries);
    setInvoiceTemplate(inv.invoiceTemplate);
    setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
    setPartnerName(inv.partnerName);
    setPartnerTaxCode(inv.partnerTaxCode);
    setPartnerAddress(inv.partnerAddress || '');
    setNetAmount(Number(inv.netAmount));
    setVatRate(Number(inv.vatRate));
    setVatAmount(Number(inv.vatAmount));
    setManualVat(false);
    setOverrideReason('');
    setDescription(inv.description || '');
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hóa đơn Nháp này?')) return;
    try {
      const res = await fetch(`/api/tax/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssue = async (id: string) => {
    if (!confirm('Xác nhận Phát hành hóa đơn VAT này? Sau khi phát hành sẽ không được sửa thông tin.')) return;
    try {
      const res = await fetch(`/api/tax/invoices/${id}/issue`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePost = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn ghi sổ hóa đơn thuế này vào Sổ cái?')) return;
    try {
      const res = await fetch(`/api/tax/invoices/${id}/post`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReasonAction = async () => {
    if (actionReason.trim().length < 5) {
      alert('Vui lòng nhập lý do giải trình tối thiểu 5 ký tự.');
      return;
    }

    try {
      const endpoint = showReasonModal === 'cancel' ? 'cancel' : 'reverse';
      const res = await fetch(`/api/tax/invoices/${reasonInvoiceId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionReason }),
      });
      const data = await res.json();
      if (data.success) {
        setShowReasonModal(null);
        setReasonInvoiceId(null);
        setActionReason('');
        fetchData();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info' | 'error' | 'neutral'> = {
      DRAFT: 'neutral',
      ISSUED: 'info',
      POSTED: 'success',
      CANCELLED: 'error',
      REVERSED: 'warning',
    };
    const labels = {
      DRAFT: 'Nháp',
      ISSUED: 'Phát hành',
      POSTED: 'Đã ghi sổ',
      CANCELLED: 'Đã hủy',
      REVERSED: 'Đã đảo',
    };
    const variant = variants[status] || 'neutral';
    const label = labels[status as keyof typeof labels] || status;
    return <EnterpriseBadge variant={variant}>{label}</EnterpriseBadge>;
  };

  // DataTable column definitions for VAT invoices
  const columns: EnterpriseColumn<TaxInvoice>[] = [
    {
      key: 'invoiceDate',
      header: 'Ngày HĐ',
      width: '120px',
      render: (row) => new Date(row.invoiceDate).toLocaleDateString('vi-VN')
    },
    {
      key: 'template_series',
      header: 'Mẫu số / Ký hiệu',
      width: '160px',
      render: (row) => <span className="font-mono text-[10px] text-[var(--text-secondary)]">{row.invoiceTemplate} / {row.invoiceSeries}</span>
    },
    {
      key: 'invoiceNumber',
      header: 'Số HĐ',
      width: '130px',
      render: (row) => <span className="font-bold text-blue-500 font-mono">{row.invoiceNumber}</span>
    },
    {
      key: 'partner',
      header: 'Đối tác / MST',
      minWidth: '260px',
      render: (row) => (
        <div>
          <div className="font-bold text-[var(--text-primary)]">{row.partnerName}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">MST: {row.partnerTaxCode}</div>
        </div>
      )
    },
    {
      key: 'netAmount',
      header: 'Tiền trước thuế (Net)',
      width: '170px',
      align: 'right',
      render: (row) => <span className="font-mono tabular-nums">{Number(row.netAmount).toLocaleString()}</span>
    },
    {
      key: 'vatRate',
      header: 'Thuế suất',
      width: '110px',
      align: 'center',
      render: (row) => <span className="font-semibold text-amber-500">{row.vatRate}%</span>
    },
    {
      key: 'vatAmount',
      header: 'Tiền thuế (VAT)',
      width: '150px',
      align: 'right',
      render: (row) => <span className="font-mono tabular-nums text-emerald-500">{Number(row.vatAmount).toLocaleString()}</span>
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '140px',
      align: 'center',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'actions',
      header: 'Hành động',
      width: '180px',
      align: 'right',
      render: (row) => (
        <div className="space-x-1.5 whitespace-nowrap">
          {row.status === 'DRAFT' && (
            <>
              <button onClick={() => handleEditClick(row)} className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-[10px] font-bold cursor-pointer transition-colors">Sửa</button>
              <button onClick={() => handleDelete(row.id)} className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-bold cursor-pointer transition-colors">Xóa</button>
              <button onClick={() => handleIssue(row.id)} className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-black cursor-pointer transition-colors">Phát hành</button>
            </>
          )}
          {row.status === 'ISSUED' && (
            <>
              <button onClick={() => handlePost(row.id)} className="px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 text-[10px] font-black cursor-pointer transition-colors">Ghi sổ</button>
              <button
                onClick={() => { setReasonInvoiceId(row.id); setShowReasonModal('cancel'); }}
                className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-bold cursor-pointer transition-colors"
              >
                Hủy HĐ
              </button>
            </>
          )}
          {row.status === 'POSTED' && (
            <button
              onClick={() => { setReasonInvoiceId(row.id); setShowReasonModal('reverse'); }}
              className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 text-[10px] font-black cursor-pointer transition-colors"
            >
              Đảo bút toán
            </button>
          )}
        </div>
      )
    }
  ];

  // Columns for sales VAT report book 01-1
  const columnsSalesBook: EnterpriseColumn<TaxInvoice>[] = [
    { key: 'invoiceNumber', header: 'Số HĐ', width: '130px', render: (row) => <span className="font-bold text-blue-500 font-mono">{row.invoiceNumber}</span> },
    { key: 'invoiceSeries', header: 'Ký hiệu', width: '110px', render: (row) => <span className="font-mono">{row.invoiceSeries}</span> },
    { key: 'invoiceDate', header: 'Ngày HĐ', width: '120px', render: (row) => new Date(row.invoiceDate).toLocaleDateString('vi-VN') },
    { key: 'partnerName', header: 'Khách hàng', minWidth: '260px', render: (row) => row.partnerName },
    { key: 'partnerTaxCode', header: 'Mã số thuế', width: '150px', render: (row) => <span className="font-mono">{row.partnerTaxCode}</span> },
    { key: 'netAmount', header: 'Doanh số chưa thuế', width: '170px', align: 'right', render: (row) => <span className="font-mono tabular-nums">{Number(row.netAmount).toLocaleString()}</span> },
    { key: 'vatRate', header: 'Thuế suất', width: '110px', align: 'center', render: (row) => <span className="font-semibold text-amber-500">{row.vatRate}%</span> },
    { key: 'vatAmount', header: 'Thuế đầu ra', width: '160px', align: 'right', render: (row) => <span className="font-mono tabular-nums text-emerald-500 font-bold">{Number(row.vatAmount).toLocaleString()}</span> }
  ];

  return (
    <EnterpriseAppShell activeItem="tax-invoice">
      <EnterpriseHeader
        title="QUẢN LÝ THUẾ & HÓA ĐƠN ĐIỆN TỬ VAT"
        subtitle="Hệ thống tự động đồng bộ hóa đơn đầu vào, đầu ra, hạch toán tờ khai thuế 01/GTGT"
      />
      <EnterprisePageContainer>
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="p-5 relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10 rounded-xl bg-[var(--card)] shadow-sm">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Doanh số bán ra trước thuế</div>
            <div className="text-[20px] font-black text-blue-500 mt-2 font-mono tabular-nums">{(summary.totalSalesNet || 0).toLocaleString()} <span className="text-[11px] font-normal text-[var(--text-muted)]">VND</span></div>
            <div className="text-[10px] font-semibold text-blue-400/80 mt-1">Thuế đầu ra: {(summary.totalSalesVat || 0).toLocaleString()} VND</div>
          </div>
          
          <div className="p-5 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-xl bg-[var(--card)] shadow-sm">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Doanh số mua vào trước thuế</div>
            <div className="text-[20px] font-black text-emerald-500 mt-2 font-mono tabular-nums">{(summary.totalPurchasesNet || 0).toLocaleString()} <span className="text-[11px] font-normal text-[var(--text-muted)]">VND</span></div>
            <div className="text-[10px] font-semibold text-emerald-400/80 mt-1">Thuế khấu trừ: {(summary.totalPurchasesVat || 0).toLocaleString()} VND</div>
          </div>

          <div className="p-5 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 rounded-xl bg-[var(--card)] shadow-sm">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Thuế GTGT phải nộp</div>
            <div className="text-[20px] font-black text-amber-500 mt-2 font-mono tabular-nums">{(summary.vatPayable || 0).toLocaleString()} <span className="text-[11px] font-normal text-[var(--text-muted)]">VND</span></div>
            <div className="text-[10px] font-semibold text-amber-400/80 mt-1">Do số bán ra lớn hơn mua vào</div>
          </div>

          <div className="p-5 relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10 rounded-xl bg-[var(--card)] shadow-sm">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Thuế GTGT được khấu trừ tiếp</div>
            <div className="text-[20px] font-black text-purple-400 mt-2 font-mono tabular-nums">{(summary.vatRefundable || 0).toLocaleString()} <span className="text-[11px] font-normal text-[var(--text-muted)]">VND</span></div>
            <div className="text-[10px] font-semibold text-purple-400/80 mt-1">Do mua vào lớn hơn bán ra</div>
          </div>
        </div>

        {/* Tab Navigation Wrapper */}
        <EnterpriseSection
          title="TỜ KHAI VÀ SỔ HÓA ĐƠN"
          subtitle="Đối chiếu và quản lý chứng từ thuế GTGT"
        >
          <EnterpriseTabs
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as any)}
            tabs={[
              { id: 'registry', label: 'Sổ Đăng Ký Hóa Đơn VAT' },
              { id: 'reports', label: 'Báo cáo Thuế VAT (01-1 & 01-2)' }
            ]}
          />
        </EnterpriseSection>

        {activeTab === 'registry' ? (
          <div className="space-y-6">
            {/* Filter Area using EnterpriseFilterBar */}
            <EnterpriseFilterBar>
              <FormGroup label="Tìm kiếm đối tác hoặc số HĐ" className="flex-1 min-w-[200px]">
                <Input
                  type="text"
                  placeholder="Tìm Số HĐ, MST, Tên..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); fetchData(); }}
                />
              </FormGroup>

              <FormGroup label="Loại hóa đơn" className="w-[160px]">
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="ALL">Tất cả loại HĐ</option>
                  <option value="OUTBOUND">Bán ra (Output)</option>
                  <option value="INBOUND">Mua vào (Input)</option>
                </Select>
              </FormGroup>

              <FormGroup label="Trạng thái hạch toán" className="w-[160px]">
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="DRAFT">Nháp (DRAFT)</option>
                  <option value="ISSUED">Phát hành (ISSUED)</option>
                  <option value="POSTED">Đã ghi sổ (POSTED)</option>
                  <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                  <option value="REVERSED">Đã đảo (REVERSED)</option>
                </Select>
              </FormGroup>

              <FormGroup label="Từ ngày" className="w-[150px]">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </FormGroup>

              <FormGroup label="Đến ngày" className="w-[150px]">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </FormGroup>

              <div className="flex items-end pb-0.5">
                <button
                  onClick={() => { resetForm(); setShowAddModal(true); }}
                  className="h-[38px] px-5 rounded-[var(--radius-sm)] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  + Lập hóa đơn VAT
                </button>
              </div>
            </EnterpriseFilterBar>

            {/* Main EnterpriseDataTable */}
            <EnterpriseSection title="DANH SÁCH HÓA ĐƠN VAT PHÁT SINH">
              <EnterpriseCard bodyClassName="p-0">
                <EnterpriseDataTable
                  data={invoices}
                  columns={columns}
                  loading={loading}
                  minWidth="1480px"
                  emptyState={
                    <EnterpriseEmptyState
                      title="Chưa có hóa đơn tài chính"
                      description="Hãy lập hóa đơn VAT mới để quản lý thuế đầu vào và đầu ra của công trình."
                      iconType="report"
                    />
                  }
                />
              </EnterpriseCard>
            </EnterpriseSection>
          </div>
        ) : (
          /* VAT Reports view (01-1 and 01-2) */
          <div className="space-y-6 animate-fade-in">
            {/* Sales VAT Book (01-1) */}
            <EnterpriseSection 
              title="1. BẢNG KÊ HÓA ĐƠN HÀNG HÓA DỊCH VỤ BÁN RA (MẪU 01-1/GTGT)"
              subtitle="Chỉ thống kê các hóa đơn bán ra ở trạng thái ĐÃ GHI SỔ (POSTED)"
            >
              <EnterpriseCard bodyClassName="p-0">
                <EnterpriseDataTable
                  data={invoices.filter(i => i.invoiceType === 'OUTBOUND' && i.status === 'POSTED')}
                  columns={columnsSalesBook}
                  loading={loading}
                  minWidth="1200px"
                  emptyState={
                    <EnterpriseEmptyState
                      title="Chưa có hóa đơn bán ra được ghi sổ"
                      description="Các hóa đơn bán ra sau khi ghi sổ kế toán (POSTED) sẽ được lập vào bảng kê này."
                      iconType="report"
                    />
                  }
                />
              </EnterpriseCard>
            </EnterpriseSection>

            {/* Purchases VAT Book (01-2) */}
            <EnterpriseSection 
              title="2. BẢNG KÊ HÓA ĐƠN HÀNG HÓA DỊCH VỤ MUA VÀO (MẪU 01-2/GTGT)"
              subtitle="Chỉ thống kê các hóa đơn mua vào ở trạng thái ĐÃ GHI SỔ (POSTED)"
            >
              <EnterpriseCard bodyClassName="p-0">
                <EnterpriseDataTable
                  data={invoices.filter(i => i.invoiceType === 'INBOUND' && i.status === 'POSTED')}
                  columns={columnsSalesBook.map(col => {
                    if (col.key === 'partnerName') return { ...col, header: 'Nhà cung cấp' };
                    if (col.key === 'vatAmount') return { ...col, header: 'Thuế được khấu trừ' };
                    return col;
                  })}
                  loading={loading}
                  minWidth="1200px"
                  emptyState={
                    <EnterpriseEmptyState
                      title="Chưa có hóa đơn mua vào được ghi sổ"
                      description="Các hóa đơn mua vào sau khi ghi sổ kế toán (POSTED) sẽ được lập vào bảng kê này."
                      iconType="report"
                    />
                  }
                />
              </EnterpriseCard>
            </EnterpriseSection>
          </div>
        )}

        {/* Modal: Write Invoice Form */}
        <EnterpriseModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          title={selectedInvoice ? 'Cập Nhật Hóa Đơn VAT' : 'Tạo Mới Hóa Đơn VAT'}
          maxWidth="3xl"
        >
          <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <FormGroup label="Loại Hóa Đơn">
                <Select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as any)}
                >
                  <option value="OUTBOUND">Bán ra (Output VAT)</option>
                  <option value="INBOUND">Mua vào (Input VAT)</option>
                </Select>
              </FormGroup>
              
              <FormGroup label="Ngày Hóa Đơn">
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </FormGroup>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormGroup label="Mẫu Số">
                <Input
                  type="text"
                  value={invoiceTemplate}
                  onChange={(e) => setInvoiceTemplate(e.target.value)}
                  required
                  className="font-mono"
                />
              </FormGroup>

              <FormGroup label="Ký Hiệu">
                <Input
                  type="text"
                  placeholder="C26TBB"
                  value={invoiceSeries}
                  onChange={(e) => setInvoiceSeries(e.target.value)}
                  required
                  className="font-mono uppercase"
                />
              </FormGroup>

              <FormGroup label="Số Hóa Đơn">
                <Input
                  type="text"
                  placeholder="7 chữ số"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                  className="font-mono"
                />
              </FormGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormGroup label="Tên Đối Tác (Khách hàng/NCC)">
                <Input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup label="Mã Số Thuế Đối Tác">
                <Input
                  type="text"
                  value={partnerTaxCode}
                  onChange={(e) => setPartnerTaxCode(e.target.value)}
                  required
                  className="font-mono"
                />
              </FormGroup>
            </div>

            <FormGroup label="Địa Chỉ Thuế Đối Tác">
              <Input
                type="text"
                value={partnerAddress}
                onChange={(e) => setPartnerAddress(e.target.value)}
              />
            </FormGroup>

            <div className="grid grid-cols-3 gap-4">
              <FormGroup label="Tiền hàng chưa thuế (Net)">
                <Input
                  type="number"
                  value={netAmount || ''}
                  onChange={(e) => setNetAmount(Number(e.target.value))}
                  required
                  className="font-mono text-right"
                />
              </FormGroup>

              <FormGroup label="Thuế Suất">
                <Select
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={8}>8% (Giảm thuế)</option>
                  <option value={10}>10%</option>
                </Select>
              </FormGroup>

              <FormGroup
                label={
                  <div className="flex justify-between items-center w-full">
                    <span>Tiền Thuế VAT</span>
                    <label className="flex items-center gap-1 text-[10px] text-amber-500 cursor-pointer select-none">
                      <input type="checkbox" checked={manualVat} onChange={(e) => setManualVat(e.target.checked)} className="rounded" />
                      Ghi đè
                    </label>
                  </div>
                }
              >
                <Input
                  type="number"
                  value={vatAmount || ''}
                  onChange={(e) => setVatAmount(Number(e.target.value))}
                  disabled={!manualVat}
                  required
                  className="font-mono text-right disabled:opacity-60"
                />
              </FormGroup>
            </div>

            {manualVat && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg space-y-2 animate-fade-in">
                <label className="block font-bold text-amber-500 text-[10px] uppercase tracking-wider">Lý do giải trình ghi đè thuế GTGT</label>
                <Input
                  type="text"
                  placeholder="Mô tả lý do lệch thuế suất tiêu chuẩn (tối thiểu 5 ký tự)..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required
                />
              </div>
            )}

            <FormGroup label="Nội Dung Hàng Hóa Dịch Vụ">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] h-20 text-xs focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
              />
            </FormGroup>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="h-[38px] px-5 rounded-[var(--radius-sm)] bg-[var(--secondary)] hover:bg-[var(--muted)] text-[var(--text-primary)] font-bold cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-[38px] px-6 rounded-[var(--radius-sm)] bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold shadow-sm cursor-pointer transition-colors"
              >
                Lưu lại
              </button>
            </div>
          </form>
        </EnterpriseModal>

        {/* Modal: Reason for Cancel / Reverse */}
        <EnterpriseModal
          isOpen={showReasonModal !== null}
          onClose={() => { setShowReasonModal(null); setReasonInvoiceId(null); setActionReason(''); }}
          title={showReasonModal === 'cancel' ? 'Yêu cầu Hủy Hóa Đơn VAT' : 'Yêu cầu Đảo Bút Toán Hơn Đơn'}
          maxWidth="md"
        >
          <div className="space-y-4">
            <FormGroup label="Nhập lý do chi tiết giải trình (tối thiểu 5 ký tự):">
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ví dụ: Hóa đơn sai thông tin tên đối tác/mã số thuế..."
                className="w-full p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs h-24 focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
              />
            </FormGroup>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowReasonModal(null); setReasonInvoiceId(null); setActionReason(''); }}
                className="h-[36px] px-4 rounded-[var(--radius-sm)] bg-[var(--secondary)] hover:bg-[var(--muted)] text-[var(--text-primary)] text-xs font-bold cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleReasonAction}
                className="h-[36px] px-5 rounded-[var(--radius-sm)] bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </EnterpriseModal>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}

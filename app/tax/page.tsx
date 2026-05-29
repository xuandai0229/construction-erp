'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useProjectsQuery } from '@/services/queries/useProjects';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

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
  const { currentProjectId, sidebarCollapsed } = useERPStore();
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
    const badges = {
      DRAFT: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      ISSUED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      POSTED: 'bg-green-500/10 text-green-400 border-green-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
      REVERSED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    const labels = {
      DRAFT: 'Nháp',
      ISSUED: 'Phát hành',
      POSTED: 'Đã ghi sổ',
      CANCELLED: 'Đã hủy',
      REVERSED: 'Đã đảo',
    };
    const style = badges[status as keyof typeof badges] || 'bg-gray-500/10 text-gray-400';
    const label = labels[status as keyof typeof labels] || status;
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${style}`}>{label}</span>;
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar activeItem="tax-invoice" />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:pl-[var(--erp-sidebar-collapsed)]' : 'md:pl-[var(--erp-sidebar-width)]'}`}>
        <Header />
        
        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="erp-card p-5 relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10 rounded-xl">
              <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Doanh số bán ra trước thuế</div>
              <div className="text-[20px] font-black text-blue-500 mt-2">{(summary.totalSalesNet || 0).toLocaleString()} <span className="text-[12px] font-normal">VND</span></div>
              <div className="text-[10px] font-semibold text-blue-400/70 mt-1">Thuế đầu ra: {(summary.totalSalesVat || 0).toLocaleString()} VND</div>
            </div>
            
            <div className="erp-card p-5 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-xl">
              <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Doanh số mua vào trước thuế</div>
              <div className="text-[20px] font-black text-emerald-500 mt-2">{(summary.totalPurchasesNet || 0).toLocaleString()} <span className="text-[12px] font-normal">VND</span></div>
              <div className="text-[10px] font-semibold text-emerald-400/70 mt-1">Thuế khấu trừ: {(summary.totalPurchasesVat || 0).toLocaleString()} VND</div>
            </div>

            <div className="erp-card p-5 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 rounded-xl">
              <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Thuế GTGT phải nộp</div>
              <div className="text-[20px] font-black text-amber-500 mt-2">{(summary.vatPayable || 0).toLocaleString()} <span className="text-[12px] font-normal">VND</span></div>
              <div className="text-[10px] font-semibold text-amber-400/70 mt-1">Do số bán ra lớn hơn mua vào</div>
            </div>

            <div className="erp-card p-5 relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10 rounded-xl">
              <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Thuế GTGT được hoàn / khấu trừ chuyển tiếp</div>
              <div className="text-[20px] font-black text-purple-400 mt-2">{(summary.vatRefundable || 0).toLocaleString()} <span className="text-[12px] font-normal">VND</span></div>
              <div className="text-[10px] font-semibold text-purple-400/70 mt-1">Do mua vào lớn hơn bán ra</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[var(--border)] gap-6">
            <button
              onClick={() => setActiveTab('registry')}
              className={`pb-3 text-[13px] font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === 'registry' ? 'border-blue-500 text-blue-500' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]'}`}
            >
              Sổ Đăng Ký Hóa Đơn VAT
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 text-[13px] font-bold tracking-wider uppercase border-b-2 transition-all ${activeTab === 'reports' ? 'border-blue-500 text-blue-500' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)]'}`}
            >
              Báo cáo Thuế VAT (01-1 & 01-2)
            </button>
          </div>

          {activeTab === 'registry' ? (
            <div className="space-y-4">
              {/* Filter Area */}
              <div className="erp-card p-4 flex flex-wrap items-center gap-4 bg-[var(--secondary)] border border-[var(--border)] rounded-xl">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Tìm theo Số HĐ, MST, Tên đối tác..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); fetchData(); }}
                    className="w-full h-10 px-4 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[12px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="w-[150px]">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[12px] focus:outline-none"
                  >
                    <option value="ALL">Tất cả loại HĐ</option>
                    <option value="OUTBOUND">Bán ra (Output)</option>
                    <option value="INBOUND">Mua vào (Input)</option>
                  </select>
                </div>

                <div className="w-[150px]">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[12px] focus:outline-none"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="DRAFT">Nháp (DRAFT)</option>
                    <option value="ISSUED">Phát hành (ISSUED)</option>
                    <option value="POSTED">Đã ghi sổ (POSTED)</option>
                    <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                    <option value="REVERSED">Đã đảo (REVERSED)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[12px] focus:outline-none"
                  />
                  <span className="text-[12px] text-[var(--text-tertiary)]">đến</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[12px] focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => { resetForm(); setShowAddModal(true); }}
                  className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold shadow-lg transition-all"
                >
                  + Lập hóa đơn VAT
                </button>
              </div>

              {/* Data Table */}
              <div className="erp-card overflow-hidden bg-[var(--secondary)] border border-[var(--border)] rounded-xl">
                {loading ? (
                  <div className="p-8 text-center text-[12px] text-[var(--text-tertiary)]">Đang tải dữ liệu...</div>
                ) : invoices.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-[var(--text-tertiary)]">Không có hóa đơn nào khớp bộ lọc.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider bg-black/10">
                          <th className="p-4">Ngày HĐ</th>
                          <th className="p-4">Mẫu số / Ký hiệu</th>
                          <th className="p-4">Số HĐ</th>
                          <th className="p-4">Đối tác / MST</th>
                          <th className="p-4 text-right">Tiền trước thuế (Net)</th>
                          <th className="p-4 text-center">Thuế suất</th>
                          <th className="p-4 text-right">Tiền thuế (VAT)</th>
                          <th className="p-4 text-center">Trạng thái</th>
                          <th className="p-4 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="border-b border-[var(--border)] hover:bg-black/5 text-[11px] transition-all">
                            <td className="p-4 whitespace-nowrap">{new Date(inv.invoiceDate).toLocaleDateString('vi-VN')}</td>
                            <td className="p-4 whitespace-nowrap font-mono text-[10px] text-[var(--text-secondary)]">{inv.invoiceTemplate} / {inv.invoiceSeries}</td>
                            <td className="p-4 whitespace-nowrap font-bold text-blue-500 font-mono">{inv.invoiceNumber}</td>
                            <td className="p-4">
                              <div className="font-bold">{inv.partnerName}</div>
                              <div className="text-[10px] text-[var(--text-tertiary)] font-mono">MST: {inv.partnerTaxCode}</div>
                            </td>
                            <td className="p-4 text-right font-semibold font-mono">{Number(inv.netAmount).toLocaleString()}</td>
                            <td className="p-4 text-center font-semibold text-amber-500">{inv.vatRate}%</td>
                            <td className="p-4 text-right font-semibold font-mono text-emerald-500">{Number(inv.vatAmount).toLocaleString()}</td>
                            <td className="p-4 text-center whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              {inv.status === 'DRAFT' && (
                                <>
                                  <button onClick={() => handleEditClick(inv)} className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-[10px]">Sửa</button>
                                  <button onClick={() => handleDelete(inv.id)} className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px]">Xóa</button>
                                  <button onClick={() => handleIssue(inv.id)} className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-bold">Phát hành</button>
                                </>
                              )}
                              {inv.status === 'ISSUED' && (
                                <>
                                  <button onClick={() => handlePost(inv.id)} className="px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 text-[10px] font-bold">Ghi sổ (Post)</button>
                                  <button
                                    onClick={() => { setReasonInvoiceId(inv.id); setShowReasonModal('cancel'); }}
                                    className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px]"
                                  >
                                    Hủy HĐ
                                  </button>
                                </>
                              )}
                              {inv.status === 'POSTED' && (
                                <button
                                  onClick={() => { setReasonInvoiceId(inv.id); setShowReasonModal('reverse'); }}
                                  className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 text-[10px] font-bold"
                                >
                                  Đảo bút toán (Reverse)
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VAT Reports view */
            <div className="space-y-6">
              {/* Sales VAT Book (01-1) */}
              <div className="erp-card p-6 bg-[var(--secondary)] border border-[var(--border)] rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="text-[14px] font-black text-blue-500 uppercase">Bảng Kê Hóa Đơn Hàng Hóa Dịch Vụ Bán Ra (Mẫu 01-1/GTGT)</h3>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Chỉ hiển thị các hóa đơn bán ra đã ghi sổ (POSTED)</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase bg-black/10">
                        <th className="p-3">Số HĐ</th>
                        <th className="p-3">Ký hiệu</th>
                        <th className="p-3">Ngày HĐ</th>
                        <th className="p-3">Khách hàng</th>
                        <th className="p-3">Mã số thuế</th>
                        <th className="p-3 text-right">Doanh số chưa thuế</th>
                        <th className="p-3 text-center">Thuế suất</th>
                        <th className="p-3 text-right">Thuế đầu ra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.filter(i => i.invoiceType === 'OUTBOUND' && i.status === 'POSTED').map(i => (
                        <tr key={i.id} className="border-b border-[var(--border)]">
                          <td className="p-3 font-bold font-mono text-blue-500">{i.invoiceNumber}</td>
                          <td className="p-3 font-mono">{i.invoiceSeries}</td>
                          <td className="p-3">{new Date(i.invoiceDate).toLocaleDateString('vi-VN')}</td>
                          <td className="p-3">{i.partnerName}</td>
                          <td className="p-3 font-mono">{i.partnerTaxCode}</td>
                          <td className="p-3 text-right font-mono font-semibold">{Number(i.netAmount).toLocaleString()}</td>
                          <td className="p-3 text-center font-semibold text-amber-500">{i.vatRate}%</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-500">{Number(i.vatAmount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Purchases VAT Book (01-2) */}
              <div className="erp-card p-6 bg-[var(--secondary)] border border-[var(--border)] rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="text-[14px] font-black text-emerald-500 uppercase">Bảng Kê Hóa Đơn Hàng Hóa Dịch Vụ Mua Vào (Mẫu 01-2/GTGT)</h3>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Chỉ hiển thị các hóa đơn mua vào đã ghi sổ (POSTED)</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase bg-black/10">
                        <th className="p-3">Số HĐ</th>
                        <th className="p-3">Ký hiệu</th>
                        <th className="p-3">Ngày HĐ</th>
                        <th className="p-3">Nhà cung cấp</th>
                        <th className="p-3">Mã số thuế</th>
                        <th className="p-3 text-right">Doanh số chưa thuế</th>
                        <th className="p-3 text-center">Thuế suất</th>
                        <th className="p-3 text-right">Thuế được khấu trừ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.filter(i => i.invoiceType === 'INBOUND' && i.status === 'POSTED').map(i => (
                        <tr key={i.id} className="border-b border-[var(--border)]">
                          <td className="p-3 font-bold font-mono text-blue-500">{i.invoiceNumber}</td>
                          <td className="p-3 font-mono">{i.invoiceSeries}</td>
                          <td className="p-3">{new Date(i.invoiceDate).toLocaleDateString('vi-VN')}</td>
                          <td className="p-3">{i.partnerName}</td>
                          <td className="p-3 font-mono">{i.partnerTaxCode}</td>
                          <td className="p-3 text-right font-mono font-semibold">{Number(i.netAmount).toLocaleString()}</td>
                          <td className="p-3 text-center font-semibold text-amber-500">{i.vatRate}%</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-500">{Number(i.vatAmount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Write Invoice Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="text-[14px] font-black uppercase text-blue-500">{selectedInvoice ? 'Cập Nhật Hóa Đơn VAT' : 'Tạo Mới Hóa Đơn VAT'}</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-[12px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Loại Hóa Đơn</label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none"
                  >
                    <option value="OUTBOUND">Bán ra (Output VAT)</option>
                    <option value="INBOUND">Mua vào (Input VAT)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Ngày Hóa Đơn</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Mẫu Số</label>
                  <input
                    type="text"
                    value={invoiceTemplate}
                    onChange={(e) => setInvoiceTemplate(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] font-mono"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Ký Hiệu</label>
                  <input
                    type="text"
                    placeholder="ví dụ: C26TBB"
                    value={invoiceSeries}
                    onChange={(e) => setInvoiceSeries(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Số Hóa Đơn</label>
                  <input
                    type="text"
                    placeholder="7 chữ số"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Tên Đối Tác (Khách hàng/NCC)</label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)]"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Mã Số Thuế Đối Tác</label>
                  <input
                    type="text"
                    value={partnerTaxCode}
                    onChange={(e) => setPartnerTaxCode(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Địa Chỉ Thuế Đối Tác</label>
                <input
                  type="text"
                  value={partnerAddress}
                  onChange={(e) => setPartnerAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Tiền hàng chưa thuế (Net)</label>
                  <input
                    type="number"
                    value={netAmount || ''}
                    onChange={(e) => setNetAmount(Number(e.target.value))}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] font-mono"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Thuế Suất</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)]"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={8}>8% (Giảm thuế)</option>
                    <option value={10}>10%</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-[var(--text-secondary)] flex justify-between">
                    <span>Tiền Thuế VAT</span>
                    <label className="flex items-center gap-1 text-[10px] text-amber-500 cursor-pointer select-none">
                      <input type="checkbox" checked={manualVat} onChange={(e) => setManualVat(e.target.checked)} className="rounded" />
                      Ghi đè
                    </label>
                  </label>
                  <input
                    type="number"
                    value={vatAmount || ''}
                    onChange={(e) => setVatAmount(Number(e.target.value))}
                    disabled={!manualVat}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] disabled:opacity-60 font-mono"
                  />
                </div>
              </div>

              {manualVat && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg space-y-2">
                  <label className="block font-bold text-amber-500 text-[10px] uppercase tracking-wider">Lý do giải trình ghi đè thuế GTGT</label>
                  <input
                    type="text"
                    placeholder="Mô tả lý do lệch thuế suất tiêu chuẩn (tối thiểu 5 ký tự)..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg bg-[var(--background)] border border-amber-500/20 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block mb-1.5 font-semibold text-[var(--text-secondary)]">Nội Dung Hàng Hóa Dịch Vụ</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="h-10 px-5 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 font-bold">Hủy</button>
                <button type="submit" className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reason Modal (Cancel / Reverse) */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-[13px] font-black uppercase text-red-500">
              {showReasonModal === 'cancel' ? 'Yêu cầu Hủy Hóa Đơn VAT' : 'Yêu cầu Đảo Bút Toán Hóa Đơn'}
            </h3>
            
            <div className="space-y-3">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">Nhập lý do giải trình (tối thiểu 5 ký tự):</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[12px] h-24"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowReasonModal(null); setReasonInvoiceId(null); setActionReason(''); }}
                className="px-4 py-2 rounded bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 text-[11px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleReasonAction}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

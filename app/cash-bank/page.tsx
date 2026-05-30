'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { Column, EnterpriseCard, EnterpriseEmptyState, EnterpriseMetric, EnterpriseSection, EnterpriseTable, EnterpriseTabs } from '@/app/components/ui-enterprise';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import { CashBankDocumentType, CashBankDocumentStatus } from '@/generated/prisma-client';

export default function CashBankPage() {
  // Tabs: 'documents' | 'cashBook' | 'bankBook'
  const [activeTab, setActiveTab] = useState<'documents' | 'cashBook' | 'bankBook'>('documents');
  const [documents, setDocuments] = useState<any[]>([]);
  const [cashBookData, setCashBookData] = useState<any>({ lines: [], totalReceipts: 0, totalPayments: 0, endingBalance: 0 });
  const [bankBookData, setBankBookData] = useState<any>({ lines: [], totalReceipts: 0, totalPayments: 0, endingBalance: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  
  // Form state
  const [formType, setFormType] = useState<CashBankDocumentType>('CASH_RECEIPT');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDesc, setFormDesc] = useState<string>('');
  const [formPartner, setFormPartner] = useState<string>('');
  const [formProject, setFormProject] = useState<string>('');
  const [formDebitAcc, setFormDebitAcc] = useState<string>('');
  const [formCreditAcc, setFormCreditAcc] = useState<string>('');
  const [formDocDate, setFormDocDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formAccDate, setFormAccDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Actions process state
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  const [showReverseInput, setShowReverseInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);

  // Fetch Documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let url = '/api/cash-bank/documents?';
      if (filterType !== 'ALL') url += `documentType=${filterType}&`;
      if (filterStatus !== 'ALL') url += `status=${filterStatus}&`;
      if (filterProject !== 'ALL') url += `projectId=${filterProject}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch cash bank documents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Books
  const fetchBooks = async () => {
    setLoadingBook(true);
    try {
      let cashUrl = '/api/reports/cash-book?';
      let bankUrl = '/api/reports/bank-book?';
      
      if (filterProject !== 'ALL') {
        cashUrl += `projectId=${filterProject}&`;
        bankUrl += `projectId=${filterProject}&`;
      }
      if (startDate) {
        cashUrl += `startDate=${startDate}&`;
        bankUrl += `startDate=${startDate}&`;
      }
      if (endDate) {
        cashUrl += `endDate=${endDate}&`;
        bankUrl += `endDate=${endDate}&`;
      }

      const [cashRes, bankRes] = await Promise.all([fetch(cashUrl), fetch(bankUrl)]);
      if (cashRes.ok) {
        const data = await cashRes.json();
        setCashBookData(data);
      }
      if (bankRes.ok) {
        const data = await bankRes.json();
        setBankBookData(data);
      }
    } catch (err) {
      console.error('Failed to fetch accounting books:', err);
    } finally {
      setLoadingBook(false);
    }
  };

  // Fetch metadata dropdowns
  const fetchMetadata = async () => {
    try {
      const [accRes, projRes] = await Promise.all([
        fetch('/api/accounting/accounts'),
        fetch('/api/projects?limit=100')
      ]);
      if (accRes.ok) {
        const json = await accRes.json();
        if (json.success) setAccounts(json.data);
      }
      if (projRes.ok) {
        const json = await projRes.json();
        if (json.success) setProjects(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown metadata:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchBooks();
  }, [filterType, filterStatus, filterProject, searchQuery, startDate, endDate]);

  // Compute Metrics from current database states
  const metrics = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;
    let bankIn = 0;
    let bankOut = 0;

    documents.forEach(doc => {
      if (doc.status !== 'POSTED') return;
      const amount = Number(doc.amount || 0);
      if (doc.paymentMethod === 'CASH') {
        if (doc.documentType === 'CASH_RECEIPT') cashIn += amount;
        else cashOut += amount;
      } else {
        if (doc.documentType === 'BANK_CREDIT_NOTICE') bankIn += amount;
        else bankOut += amount;
      }
    });

    return {
      cashIn,
      cashOut,
      cashBalance: cashIn - cashOut,
      bankBalance: bankIn - bankOut
    };
  }, [documents]);

  // Default Account Auto-Wiring when Form Type changes
  useEffect(() => {
    if (accounts.length === 0) return;
    
    // Auto wire accounts based on standard VAS/Vietnamese double entry
    if (formType === 'CASH_RECEIPT') {
      const dAcc = accounts.find(a => a.code === '1111' || a.code === '111');
      const cAcc = accounts.find(a => a.code === '131' || a.code === '1310');
      setFormDebitAcc(dAcc?.id || '');
      setFormCreditAcc(cAcc?.id || '');
    } else if (formType === 'CASH_PAYMENT') {
      const dAcc = accounts.find(a => a.code === '331' || a.code === '3310');
      const cAcc = accounts.find(a => a.code === '1111' || a.code === '111');
      setFormDebitAcc(dAcc?.id || '');
      setFormCreditAcc(cAcc?.id || '');
    } else if (formType === 'BANK_TRANSFER') {
      const dAcc = accounts.find(a => a.code === '331' || a.code === '3310');
      const cAcc = accounts.find(a => a.code === '1121' || a.code === '112');
      setFormDebitAcc(dAcc?.id || '');
      setFormCreditAcc(cAcc?.id || '');
    } else if (formType === 'BANK_CREDIT_NOTICE') {
      const dAcc = accounts.find(a => a.code === '1121' || a.code === '112');
      const cAcc = accounts.find(a => a.code === '131' || a.code === '1310');
      setFormDebitAcc(dAcc?.id || '');
      setFormCreditAcc(cAcc?.id || '');
    } else if (formType === 'BANK_DEBIT_NOTICE') {
      const dAcc = accounts.find(a => a.code === '6428' || a.code === '642' || a.code === '6277');
      const cAcc = accounts.find(a => a.code === '1121' || a.code === '112');
      setFormDebitAcc(dAcc?.id || '');
      setFormCreditAcc(cAcc?.id || '');
    }
  }, [formType, accounts]);

  // Form Submit Handler
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0) {
      alert('Số tiền phải lớn hơn 0');
      return;
    }
    if (formDesc.trim().length < 5) {
      alert('Lý do nộp/nhận phải dài tối thiểu 5 ký tự');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        documentType: formType,
        amount: Number(formAmount),
        description: formDesc,
        partnerName: formPartner,
        projectId: formProject || undefined,
        debitAccountId: formDebitAcc,
        creditAccountId: formCreditAcc,
        documentDate: new Date(formDocDate),
        accountingDate: new Date(formAccDate),
        paymentMethod: (formType === 'CASH_RECEIPT' || formType === 'CASH_PAYMENT') ? 'CASH' : 'BANK'
      };

      const res = await fetch('/api/cash-bank/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormAmount(0);
        setFormDesc('');
        setFormPartner('');
        setFormProject('');
        fetchDocuments();
        fetchBooks();
        alert('Tạo chứng từ Quỹ/Ngân hàng thành công!');
      } else {
        const error = await res.json();
        alert(`Lỗi lập phiếu: ${error.error || 'Vui lòng kiểm tra lại thông tin.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // Lifecycle Action Handlers
  const handleLifecycleAction = async (action: 'submit' | 'approve' | 'reject' | 'post' | 'reverse' | 'cancel') => {
    if (!selectedDoc) return;
    
    // Safety guard logic validation checks
    if (action === 'reject' && (!rejectReason || rejectReason.trim().length < 5)) {
      alert('Lý do từ chối phải có ít nhất 5 ký tự.');
      return;
    }
    if (action === 'reverse' && (!reverseReason || reverseReason.trim().length < 5)) {
      alert('Lý do hủy ghi sổ cái phải có ít nhất 5 ký tự.');
      return;
    }
    if (action === 'cancel' && (!cancelReason || cancelReason.trim().length < 5)) {
      alert('Lý do hủy chứng từ phải có ít nhất 5 ký tự.');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn thực hiện nghiệp vụ này?`)) return;

    setActionLoading(true);
    try {
      const url = `/api/cash-bank/documents/${selectedDoc.id}/${action}`;
      const payload = action === 'reject' ? { reason: rejectReason } :
                      action === 'reverse' ? { reason: reverseReason } :
                      action === 'cancel' ? { reason: cancelReason } : {};
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedDoc(updated);
        setShowRejectInput(false);
        setShowReverseInput(false);
        setShowCancelInput(false);
        setRejectReason('');
        setReverseReason('');
        setCancelReason('');
        fetchDocuments();
        fetchBooks();
        alert('Nghiệp vụ hạch toán & cập nhật trạng thái đã thực thi thành công!');
      } else {
        const err = await res.json();
        alert(`Lỗi thực thi: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ khi phê duyệt.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status: CashBankDocumentStatus) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/30';
      case 'SUBMITTED': return 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30';
      case 'APPROVED': return 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30';
      case 'POSTED': return 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 font-bold';
      case 'REVERSED': return 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30 font-bold';
      case 'CANCELLED': return 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  const translateDocType = (type: CashBankDocumentType) => {
    switch (type) {
      case 'CASH_RECEIPT': return 'Phiếu thu tiền mặt';
      case 'CASH_PAYMENT': return 'Phiếu chi tiền mặt';
      case 'BANK_TRANSFER': return 'Ủy nhiệm chi';
      case 'BANK_CREDIT_NOTICE': return 'Giấy báo Có';
      case 'BANK_DEBIT_NOTICE': return 'Giấy báo Nợ';
      default: return type;
    }
  };

  const translateStatus = (status: CashBankDocumentStatus) => {
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'SUBMITTED': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'POSTED': return 'Đã ghi sổ';
      case 'REVERSED': return 'Đã đảo bút toán';
      case 'CANCELLED': return 'Đã hủy bỏ';
      default: return status;
    }
  };

  // A4 A5 Print coordinators
  const handlePrint = (id: string, type: CashBankDocumentType) => {
    let url = `/print/cash-receipt/${id}`;
    if (type === 'CASH_PAYMENT') url = `/print/cash-payment/${id}`;
    else if (type === 'BANK_TRANSFER') url = `/print/bank-transfer/${id}`;
    window.open(url, '_blank');
  };

  // Table Columns config for Documents
  const columns: Column<any>[] = [
    { header: 'Số chứng từ', accessor: row => <span className="font-mono font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => { setSelectedDoc(row); setShowDetailModal(true); }}>{row.documentNo}</span>, width: '150px' },
    { header: 'Ngày hạch toán', accessor: row => formatDate(row.accountingDate), align: 'center', width: '130px' },
    { header: 'Loại chứng từ', accessor: row => <span className="text-[12px]">{translateDocType(row.documentType)}</span>, width: '160px' },
    { header: 'Đối tượng', accessor: row => row.partnerName || '-', width: '200px' },
    { header: 'Diễn giải / Lý do', accessor: row => <div className="max-w-[300px] truncate">{row.description}</div>, width: '280px' },
    { header: 'Tài khoản Nợ', accessor: row => <span className="font-mono text-gray-300 font-semibold">{row.debitAccount.code}</span>, align: 'center', width: '120px' },
    { header: 'Tài khoản Có', accessor: row => <span className="font-mono text-gray-300 font-semibold">{row.creditAccount.code}</span>, align: 'center', width: '120px' },
    { header: 'Số tiền', accessor: row => <span className={`font-mono font-black ${row.documentType.includes('PAYMENT') || row.documentType.includes('TRANSFER') || row.documentType === 'BANK_DEBIT_NOTICE' ? 'text-rose-400' : 'text-emerald-400'}`}>{formatVnd(row.amount)}</span>, align: 'right', width: '160px' },
    { header: 'Trạng thái', accessor: row => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusBadgeClass(row.status)}`}>{translateStatus(row.status)}</span>, align: 'center', width: '140px' },
    { header: 'Thao tác', accessor: row => (
      <div className="flex gap-2 justify-center">
        <button onClick={() => { setSelectedDoc(row); setShowDetailModal(true); }} className="text-blue-500 font-bold hover:underline text-[12px]">Chi tiết</button>
        {(row.status === 'POSTED' || row.status === 'APPROVED') && (
          <button onClick={() => handlePrint(row.id, row.documentType)} className="text-purple-500 font-bold hover:underline text-[12px]">In A4</button>
        )}
      </div>
    ), align: 'center', width: '140px' }
  ];

  return (
    <div className="erp-page">
      <Sidebar activeItem="cash-bank" />
      <main className="erp-page-main with-sidebar-expanded">
        <Header />
        
        <div className="erp-content-container animate-fade-in space-y-6">
          {/* Header page component */}
          <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[20px] font-black text-[var(--text-primary)]">QUỸ TIỀN MẶT & TIỀN GỬI NGÂN HÀNG</h1>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Phân hệ quản lý Thu/Chi tiền mặt, Ủy nhiệm chi, Báo Có, Báo Nợ ngân hàng</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="h-[38px] rounded-[var(--radius-sm)] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-5 text-[12px] font-black text-white shadow-lg transition-transform"
              >
                + LẬP CHỨNG TỪ QUỸ & NH
              </button>
            </div>
          </div>

          {/* Tab switches */}
          <EnterpriseTabs
            tabs={[
              { id: 'documents', label: 'Danh sách chứng từ' },
              { id: 'cashBook', label: 'Sổ Quỹ Tiền Mặt' },
              { id: 'bankBook', label: 'Sổ Tiền Gửi Ngân Hàng' }
            ]}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as any)}
          />

          {/* METRICS PANEL */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <EnterpriseMetric title="Tổng Thu tiền mặt (POSTED)" value={formatVnd(metrics.cashIn)} />
            <EnterpriseMetric title="Tổng Chi tiền mặt (POSTED)" value={formatVnd(metrics.cashOut)} />
            <EnterpriseMetric title="Tồn Quỹ tiền mặt cuối kỳ" value={formatVnd(metrics.cashBalance)} />
            <EnterpriseMetric title="Số dư tiền gửi ngân hàng" value={formatVnd(metrics.bankBalance)} />
          </div>

          {/* ENTERPRISE FILTERS */}
          <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Loại chứng từ</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full h-9 rounded-md bg-[var(--background)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] px-3">
                <option value="ALL">Tất cả loại phiếu</option>
                <option value="CASH_RECEIPT">Phiếu thu tiền mặt</option>
                <option value="CASH_PAYMENT">Phiếu chi tiền mặt</option>
                <option value="BANK_TRANSFER">Ủy nhiệm chi (UNC)</option>
                <option value="BANK_CREDIT_NOTICE">Giấy báo Có</option>
                <option value="BANK_DEBIT_NOTICE">Giấy báo Nợ</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Trạng thái duyệt</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-9 rounded-md bg-[var(--background)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] px-3">
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DRAFT">Nháp</option>
                <option value="SUBMITTED">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt (Chờ ghi sổ)</option>
                <option value="POSTED">Đã ghi sổ cái</option>
                <option value="REVERSED">Đã đảo bút toán</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Dự án công trình</label>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="w-full h-9 rounded-md bg-[var(--background)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] px-3">
                <option value="ALL">Tất cả dự án</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Tìm kiếm nội dung</label>
              <input type="text" placeholder="Số chứng từ, lý do, đối tác..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-9 rounded-md bg-[var(--background)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] px-3" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Từ ngày</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-9 rounded-md bg-[var(--background)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] px-3" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Đến ngày</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-9 rounded-md bg-[var(--background)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] px-3" />
            </div>
          </div>

          {/* TAB 1: DOCUMENTS TABLE */}
          {activeTab === 'documents' && (
            <EnterpriseSection title="DANH SÁCH CHỨNG TỪ QUỸ & NGÂN HÀNG" subtitle={`${documents.length} phiếu hạch toán`}>
              <EnterpriseCard bodyClassName="p-0">
                <EnterpriseTable
                  data={documents}
                  columns={columns}
                  loading={loading}
                  minWidth="1400px"
                  getRowKey={row => row.id}
                  emptyState={<EnterpriseEmptyState title="Không tìm thấy chứng từ" description="Chưa lập chứng từ quỹ nào hoặc bộ lọc không khớp với kết quả nào." iconType="report" />}
                />
              </EnterpriseCard>
            </EnterpriseSection>
          )}

          {activeTab === 'cashBook' && (
            <EnterpriseSection title="SỔ QUỸ TIỀN MẶT (CASH BOOK)" subtitle="Theo mẫu Sổ kế toán chuẩn Việt Nam">
              <EnterpriseCard bodyClassName="p-0">
                <div className="text-center space-y-1 p-6 pb-2">
                  <h2 className="text-[18px] font-black tracking-wide uppercase text-[var(--text-primary)]">SỔ QUỸ TIỀN MẶT</h2>
                  <p className="text-[11px] text-[var(--text-secondary)] italic">Dành cho Tài khoản 111 (Tiền mặt Việt Nam đồng)</p>
                  {(startDate || endDate) && <p className="text-[11px] text-blue-500">Kỳ báo cáo: {startDate ? formatDate(startDate) : 'Đầu kỳ'} - {endDate ? formatDate(endDate) : 'Hiện tại'}</p>}
                </div>
                
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[var(--secondary)] text-[var(--text-secondary)] font-bold border-y border-[var(--border)]">
                        <th className="p-3 border-r border-[var(--border)] text-center w-[120px]">Ngày hạch toán</th>
                        <th className="p-3 border-r border-[var(--border)] text-center w-[120px]">Số chứng từ</th>
                        <th className="p-3 border-r border-[var(--border)] text-left w-[180px]">Người nộp/Nhận</th>
                        <th className="p-3 border-r border-[var(--border)] text-left">Diễn giải</th>
                        <th className="p-3 border-r border-[var(--border)] text-center w-[80px]">TK ĐC</th>
                        <th className="p-3 border-r border-[var(--border)] text-right w-[140px]">Số tiền Thu</th>
                        <th className="p-3 border-r border-[var(--border)] text-right w-[140px]">Số tiền Chi</th>
                        <th className="p-3 text-right w-[150px]">Tồn quỹ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingBook ? (
                        <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">Đang tạo sổ quỹ...</td></tr>
                      ) : cashBookData.lines.length === 0 ? (
                        <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">Không có giao dịch tiền mặt đã ghi sổ nào trong kỳ.</td></tr>
                      ) : (
                        cashBookData.lines.map((l: any, idx: number) => (
                          <tr key={idx} className="border-b border-[var(--border)] hover:bg-[var(--secondary)] transition-colors text-[var(--text-primary)]">
                            <td className="p-3 border-r border-[var(--border)] text-center font-mono">{formatDate(l.accountingDate)}</td>
                            <td className="p-3 border-r border-[var(--border)] text-center font-mono font-bold text-blue-500">{l.documentNo}</td>
                            <td className="p-3 border-r border-[var(--border)]">{l.partnerName}</td>
                            <td className="p-3 border-r border-[var(--border)] text-[var(--text-secondary)]">{l.description}</td>
                            <td className="p-3 border-r border-[var(--border)] text-center font-mono text-[var(--text-muted)]">{l.debitAccountCode.startsWith('111') ? l.creditAccountCode : l.debitAccountCode}</td>
                            <td className="p-3 border-r border-[var(--border)] text-right font-mono text-emerald-500">{l.debitAmount > 0 ? formatVnd(l.debitAmount) : '-'}</td>
                            <td className="p-3 border-r border-[var(--border)] text-right font-mono text-rose-500">{l.creditAmount > 0 ? formatVnd(l.creditAmount) : '-'}</td>
                            <td className="p-3 text-right font-mono font-bold">{formatVnd(l.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-[var(--secondary)] font-bold text-[var(--text-primary)] border-t border-[var(--border)]">
                      <tr>
                        <td colSpan={5} className="p-3 text-right uppercase text-[var(--text-secondary)]">Tổng phát sinh trong kỳ</td>
                        <td className="p-3 text-right border-r border-[var(--border)] font-mono text-emerald-500">{formatVnd(cashBookData.totalReceipts)}</td>
                        <td className="p-3 text-right border-r border-[var(--border)] font-mono text-rose-500">{formatVnd(cashBookData.totalPayments)}</td>
                        <td className="p-3 text-right font-mono text-blue-500">{formatVnd(cashBookData.endingBalance)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </EnterpriseCard>
            </EnterpriseSection>
          )}

          {/* TAB 3: BANK BOOK */}
          {activeTab === 'bankBook' && (
            <EnterpriseSection title="SỔ TIỀN GỬI NGÂN HÀNG (BANK BOOK)" subtitle="Theo mẫu Sổ chi tiết tiền gửi ngân hàng">
              <EnterpriseCard bodyClassName="p-0">
                <div className="text-center space-y-1 p-6 pb-2">
                  <h2 className="text-[18px] font-black tracking-wide uppercase text-[var(--text-primary)]">SỔ TIỀN GỬI NGÂN HÀNG</h2>
                  <p className="text-[11px] text-[var(--text-secondary)] italic">Dành cho Tài khoản 112 (Tiền gửi ngân hàng bằng Việt Nam đồng)</p>
                  {(startDate || endDate) && <p className="text-[11px] text-blue-500">Kỳ báo cáo: {startDate ? formatDate(startDate) : 'Đầu kỳ'} - {endDate ? formatDate(endDate) : 'Hiện tại'}</p>}
                </div>
                
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[var(--secondary)] text-[var(--text-secondary)] font-bold border-y border-[var(--border)]">
                        <th className="p-3 border-r border-[var(--border)] text-center w-[120px]">Ngày hạch toán</th>
                        <th className="p-3 border-r border-[var(--border)] text-center w-[120px]">Số chứng từ</th>
                        <th className="p-3 border-r border-[var(--border)] text-left w-[180px]">Người nộp/Nhận</th>
                        <th className="p-3 border-r border-[var(--border)] text-left">Diễn giải</th>
                        <th className="p-3 border-r border-[var(--border)] text-center w-[80px]">TK ĐC</th>
                        <th className="p-3 border-r border-[var(--border)] text-right w-[140px]">Số tiền Nợ (Gửi)</th>
                        <th className="p-3 border-r border-[var(--border)] text-right w-[140px]">Số tiền Có (Rút)</th>
                        <th className="p-3 text-right w-[150px]">Số dư tồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingBook ? (
                        <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">Đang tạo sổ tiền gửi ngân hàng...</td></tr>
                      ) : bankBookData.lines.length === 0 ? (
                        <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">Không có giao dịch gửi/rút ngân hàng đã ghi sổ nào trong kỳ.</td></tr>
                      ) : (
                        bankBookData.lines.map((l: any, idx: number) => (
                          <tr key={idx} className="border-b border-[var(--border)] hover:bg-[var(--secondary)] transition-colors text-[var(--text-primary)]">
                            <td className="p-3 border-r border-[var(--border)] text-center font-mono">{formatDate(l.accountingDate)}</td>
                            <td className="p-3 border-r border-[var(--border)] text-center font-mono font-bold text-blue-500">{l.documentNo}</td>
                            <td className="p-3 border-r border-[var(--border)]">{l.partnerName}</td>
                            <td className="p-3 border-r border-[var(--border)] text-[var(--text-secondary)]">{l.description}</td>
                            <td className="p-3 border-r border-[var(--border)] text-center font-mono text-[var(--text-muted)]">{l.debitAccountCode.startsWith('112') ? l.creditAccountCode : l.debitAccountCode}</td>
                            <td className="p-3 border-r border-[var(--border)] text-right font-mono text-emerald-500">{l.debitAmount > 0 ? formatVnd(l.debitAmount) : '-'}</td>
                            <td className="p-3 border-r border-[var(--border)] text-right font-mono text-rose-500">{l.creditAmount > 0 ? formatVnd(l.creditAmount) : '-'}</td>
                            <td className="p-3 text-right font-mono font-bold">{formatVnd(l.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-[var(--secondary)] font-bold text-[var(--text-primary)] border-t border-[var(--border)]">
                      <tr>
                        <td colSpan={5} className="p-3 text-right uppercase text-[var(--text-secondary)]">Tổng phát sinh ngân gửi</td>
                        <td className="p-3 text-right border-r border-[var(--border)] font-mono text-emerald-500">{formatVnd(bankBookData.totalReceipts)}</td>
                        <td className="p-3 text-right border-r border-[var(--border)] font-mono text-rose-500">{formatVnd(bankBookData.totalPayments)}</td>
                        <td className="p-3 text-right font-mono text-blue-500">{formatVnd(bankBookData.endingBalance)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </EnterpriseCard>
            </EnterpriseSection>
          )}

        </div>
      </main>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-[var(--text-primary)] animate-scale-in">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-[16px] font-black uppercase text-[var(--text-primary)]">LẬP CHỨNG TỪ PHIẾU THU / PHIẾU CHI / ỦY NHIỆM CHI</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[20px] font-bold">×</button>
            </div>
            
            <form onSubmit={handleCreateDocument} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Loại chứng từ</label>
                  <select 
                    value={formType} 
                    onChange={e => setFormType(e.target.value as CashBankDocumentType)}
                    className="w-full h-10 rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] px-3"
                  >
                    <option value="CASH_RECEIPT">Phiếu thu tiền mặt</option>
                    <option value="CASH_PAYMENT">Phiếu chi tiền mặt</option>
                    <option value="BANK_TRANSFER">Ủy nhiệm chi (Chuyển khoản)</option>
                    <option value="BANK_CREDIT_NOTICE">Giấy báo Có (NH)</option>
                    <option value="BANK_DEBIT_NOTICE">Giấy báo Nợ (NH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Số tiền (VND)</label>
                  <input 
                    type="number" 
                    required 
                    value={formAmount} 
                    onChange={e => setFormAmount(Number(e.target.value))}
                    className="w-full h-10 rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] px-3 font-mono font-bold" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Đối tác / Người nộp nhận</label>
                  <input 
                    type="text" 
                    placeholder="Tên khách hàng, NCC, nhân viên..."
                    value={formPartner} 
                    onChange={e => setFormPartner(e.target.value)}
                    className="w-full h-10 rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] px-3" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Liên kết Dự án</label>
                  <select 
                    value={formProject} 
                    onChange={e => setFormProject(e.target.value)}
                    className="w-full h-10 rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] px-3"
                  >
                    <option value="">Không thuộc dự án nào</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Tài khoản ghi Nợ (Debit)</label>
                  <select 
                    value={formDebitAcc} 
                    onChange={e => setFormDebitAcc(e.target.value)}
                    className="w-full h-10 rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] px-3 font-mono"
                  >
                    <option value="">Chọn tài khoản</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Tài khoản ghi Có (Credit)</label>
                  <select 
                    value={formCreditAcc} 
                    onChange={e => setFormCreditAcc(e.target.value)}
                    className="w-full h-10 rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] px-3 font-mono"
                  >
                    <option value="">Chọn tài khoản</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Ngày chứng từ</label>
                  <input 
                    type="date" 
                    value={formDocDate} 
                    onChange={e => setFormDocDate(e.target.value)}
                    className="w-full h-10 rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] px-3" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Ngày hạch toán kế toán</label>
                  <input 
                    type="date" 
                    value={formAccDate} 
                    onChange={e => setFormAccDate(e.target.value)}
                    className="w-full h-10 rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] px-3" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[var(--text-muted)] uppercase mb-1">Diễn giải lý do thu / chi (tối thiểu 5 ký tự)</label>
                <textarea 
                  required 
                  rows={3} 
                  placeholder="Nhập lý do, căn cứ kèm theo chứng từ..."
                  value={formDesc} 
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full rounded-md bg-[var(--background)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] p-3"
                />
              </div>

              <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="h-[36px] px-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--muted)] text-[12px] font-bold text-[var(--text-secondary)]">Hủy</button>
                <button type="submit" className="h-[36px] px-5 rounded-[var(--radius-sm)] bg-gradient-to-r from-blue-600 to-indigo-600 text-[12px] font-black text-white hover:from-blue-500 hover:to-indigo-500 shadow-md">LẬP CHỨNG TỪ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL / DRAWER */}
      {showDetailModal && selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl text-[var(--text-primary)] animate-scale-in">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-[15px] font-black uppercase text-[var(--text-primary)]">CHI TIẾT CHỨNG TỪ QUỸ & NGÂN HÀNG</h3>
                <p className="text-[11px] text-blue-500 font-mono">ID: {selectedDoc.id}</p>
              </div>
              <button onClick={() => { setShowDetailModal(false); setShowRejectInput(false); setShowReverseInput(false); setShowCancelInput(false); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[20px] font-bold">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Top Banner details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[var(--secondary)] rounded-lg border border-[var(--border)]">
                <div>
                  <span className="text-[10px] uppercase font-black text-[var(--text-muted)]">Số chứng từ</span>
                  <p className="text-[13px] font-bold text-blue-500 font-mono mt-0.5">{selectedDoc.documentNo}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-[var(--text-muted)]">Loại phiếu</span>
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] mt-0.5">{translateDocType(selectedDoc.documentType)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-[var(--text-muted)]">Ngày hạch toán</span>
                  <p className="text-[13px] font-mono text-[var(--text-primary)] mt-0.5">{formatDate(selectedDoc.accountingDate)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-[var(--text-muted)]">Trạng thái</span>
                  <div className="mt-0.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${getStatusBadgeClass(selectedDoc.status)}`}>
                      {translateStatus(selectedDoc.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main parameters details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-black text-[var(--text-muted)] tracking-wider border-b border-[var(--border)] pb-1">THÔNG TIN GIAO DỊCH</h4>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Người nộp/nhận:</span><span className="font-bold text-[var(--text-primary)]">{selectedDoc.partnerName || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Dự án công trình:</span><span className="font-bold text-[var(--text-primary)]">{selectedDoc.project?.name || 'Không thuộc dự án'}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Phương thức:</span><span className="font-bold text-[var(--text-primary)] uppercase">{selectedDoc.paymentMethod}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-muted)]">Số tiền gốc:</span><span className="font-mono font-black text-emerald-500 text-[14px]">{formatVnd(selectedDoc.amount)}</span></div>
                    <div className="pt-2"><span className="text-[var(--text-muted)] block mb-1">Lý do thu chi:</span><p className="text-[var(--text-primary)] bg-[var(--background)] p-3 rounded border border-[var(--border)] text-[12px] leading-relaxed italic">"{selectedDoc.description}"</p></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-black text-[var(--text-muted)] tracking-wider border-b border-[var(--border)] pb-1">ĐỊNH KHOẢN KẾ TOÁN (DOUBLE ENTRY)</h4>
                  <div className="bg-[var(--background)] border border-[var(--border)] rounded overflow-hidden">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="bg-[var(--secondary)] text-[var(--text-secondary)] font-bold border-b border-[var(--border)]">
                          <th className="p-2 border-r border-[var(--border)] text-center">Tài khoản</th>
                          <th className="p-2 border-r border-[var(--border)] text-center">Bên Nợ (Dr)</th>
                          <th className="p-2 text-center">Bên Có (Cr)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[var(--border)]/50">
                          <td className="p-3 border-r border-[var(--border)] text-center font-mono font-bold text-[var(--text-primary)]">{selectedDoc.debitAccount.code} ({selectedDoc.debitAccount.name})</td>
                          <td className="p-3 border-r border-[var(--border)] text-right font-mono text-emerald-500 font-bold">{formatVnd(selectedDoc.amount)}</td>
                          <td className="p-3 text-right text-[var(--text-muted)]">-</td>
                        </tr>
                        <tr>
                          <td className="p-3 border-r border-[var(--border)] text-center font-mono font-bold text-[var(--text-primary)]">{selectedDoc.creditAccount.code} ({selectedDoc.creditAccount.name})</td>
                          <td className="p-3 border-r border-[var(--border)] text-right text-[var(--text-muted)]">-</td>
                          <td className="p-3 text-right font-mono text-rose-500 font-bold">{formatVnd(selectedDoc.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {selectedDoc.postedJournalEntryId && (
                    <div className="p-3 bg-emerald-500/10 rounded border border-emerald-500/20 text-[11px] text-emerald-500 flex items-center justify-between">
                      <span>✓ Đã cập nhật thành công vào Sổ Cái kế toán</span>
                      <span className="font-mono text-emerald-400 font-bold">Bút toán Sổ Cái: {selectedDoc.postedJournalEntryId.slice(0, 8)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DYNAMIC ACTION INPUTS */}
              {showRejectInput && (
                <div className="p-4 bg-amber-500/10 rounded border border-amber-500/20 space-y-3">
                  <span className="text-[11px] text-amber-500 font-black uppercase">Nhập lý do từ chối (tối thiểu 5 ký tự)</span>
                  <input type="text" required value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full h-10 rounded bg-[var(--background)] border border-amber-500/30 px-3 text-[13px] text-[var(--text-primary)]" placeholder="Ví dụ: Định khoản sai tài khoản đối ứng, yêu cầu kiểm tra lại..." />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowRejectInput(false)} className="px-4 py-1.5 rounded text-[12px] bg-[var(--secondary)] hover:bg-[var(--muted)] font-bold text-[var(--text-secondary)]">Hủy</button>
                    <button onClick={() => handleLifecycleAction('reject')} className="px-4 py-1.5 rounded text-[12px] bg-amber-600 hover:bg-amber-500 font-bold text-white">Gửi từ chối</button>
                  </div>
                </div>
              )}

              {showReverseInput && (
                <div className="p-4 bg-rose-500/10 rounded border border-rose-500/20 space-y-3">
                  <span className="text-[11px] text-rose-500 font-black uppercase">Nhập lý do hủy ghi sổ / bút toán đảo (tối thiểu 5 ký tự)</span>
                  <input type="text" required value={reverseReason} onChange={e => setReverseReason(e.target.value)} className="w-full h-10 rounded bg-[var(--background)] border border-rose-500/30 px-3 text-[13px] text-[var(--text-primary)]" placeholder="Ví dụ: Đối tác thanh toán nhầm, hủy bút toán..." />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowReverseInput(false)} className="px-4 py-1.5 rounded text-[12px] bg-[var(--secondary)] hover:bg-[var(--muted)] font-bold text-[var(--text-secondary)]">Hủy</button>
                    <button onClick={() => handleLifecycleAction('reverse')} className="px-4 py-1.5 rounded text-[12px] bg-rose-600 hover:bg-rose-500 font-bold text-white">Hủy ghi sổ & Đảo bút toán</button>
                  </div>
                </div>
              )}

              {showCancelInput && (
                <div className="p-4 bg-amber-500/10 rounded border border-amber-500/20 space-y-3">
                  <span className="text-[11px] text-amber-500 font-black uppercase">Nhập lý do hủy bỏ chứng từ (tối thiểu 5 ký tự)</span>
                  <input type="text" required value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full h-10 rounded bg-[var(--background)] border border-amber-500/30 px-3 text-[13px] text-[var(--text-primary)]" placeholder="Ví dụ: Chứng từ nháp bị sai, hủy phiếu..." />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowCancelInput(false)} className="px-4 py-1.5 rounded text-[12px] bg-[var(--secondary)] hover:bg-[var(--muted)] font-bold text-[var(--text-secondary)]">Hủy</button>
                    <button onClick={() => handleLifecycleAction('cancel')} className="px-4 py-1.5 rounded text-[12px] bg-amber-600 hover:bg-amber-500 font-bold text-white">Xác nhận hủy phiếu</button>
                  </div>
                </div>
              )}

              {/* ACTION MENU CONTROLLER */}
              <div className="p-4 border-t border-[var(--border)] flex flex-wrap justify-end gap-2 pt-6">
                {selectedDoc.status === 'DRAFT' && (
                  <>
                    <button onClick={() => handleLifecycleAction('submit')} className="h-[36px] px-5 rounded bg-blue-600 text-[12px] font-black text-white hover:bg-blue-500 shadow-md">TRÌNH DUYỆT</button>
                    <button onClick={() => setShowCancelInput(true)} className="h-[36px] px-5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--muted)]">HỦY PHIẾU</button>
                  </>
                )}

                {selectedDoc.status === 'SUBMITTED' && (
                  <>
                    <button onClick={() => handleLifecycleAction('approve')} className="h-[36px] px-5 rounded bg-gradient-to-r from-emerald-600 to-teal-600 text-[12px] font-black text-white hover:from-emerald-500 hover:to-teal-500 shadow-md">PHÊ DUYỆT (KTT/GĐ)</button>
                    <button onClick={() => setShowRejectInput(true)} className="h-[36px] px-5 rounded bg-rose-600 text-[12px] font-black text-white hover:bg-rose-500">TỪ CHỐI</button>
                  </>
                )}

                {selectedDoc.status === 'APPROVED' && (
                  <>
                    <button onClick={() => handleLifecycleAction('post')} className="h-[36px] px-5 rounded bg-gradient-to-r from-indigo-600 to-blue-600 text-[12px] font-black text-white hover:from-indigo-500 hover:to-blue-500 shadow-md">✓ GHI SỔ CÁI (POST)</button>
                    <button onClick={() => setShowCancelInput(true)} className="h-[36px] px-5 rounded border border-[#2d2d3c] bg-gray-700 text-[12px] font-bold text-white hover:bg-gray-600">HỦY PHIẾU</button>
                  </>
                )}

                {selectedDoc.status === 'POSTED' && (
                  <button onClick={() => setShowReverseInput(true)} className="h-[36px] px-5 rounded bg-rose-600 text-[12px] font-black text-white hover:bg-rose-500 shadow-md">⟲ HỦY GHI SỔ / BÚT TOÁN ĐẢO</button>
                )}

                <button onClick={() => handlePrint(selectedDoc.id, selectedDoc.documentType)} className="h-[36px] px-5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-500 text-[12px] font-black hover:bg-purple-500/20">IN CHỨNG TỪ A4</button>
                
                <button onClick={() => { setShowDetailModal(false); setShowRejectInput(false); setShowReverseInput(false); setShowCancelInput(false); }} className="h-[36px] px-5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--muted)]">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

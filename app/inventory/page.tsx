'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { EnterpriseTabs } from '@/app/components/ui-enterprise';
import { EnterpriseSection, EnterpriseCard } from '@/app/components/ui-enterprise';
import { InventoryDashboardCards } from '@/app/components/inventory/InventoryDashboardCards';
import { MaterialTable } from '@/app/components/inventory/MaterialTable';
import { WarehouseTable } from '@/app/components/inventory/WarehouseTable';
import { InventoryDocumentTable } from '@/app/components/inventory/InventoryDocumentTable';
import { InventoryDocumentForm } from '@/app/components/inventory/InventoryDocumentForm';
import { StockCardTable } from '@/app/components/inventory/StockCardTable';
import { InOutBalanceTable } from '@/app/components/inventory/InOutBalanceTable';
import { InventoryReportFilterBar } from '@/app/components/inventory/InventoryReportFilterBar';

export default function InventoryPage() {
  const { currentProjectId, sidebarCollapsed } = useERPStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'materials' | 'warehouses' | 'documents' | 'reports'>('dashboard');

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showDocForm, setShowDocForm] = useState(false);

  const [reportType, setReportType] = useState<'stock-card' | 'in-out-balance'>('in-out-balance');
  const [reportFilters, setReportFilters] = useState<any>(null);

  const tabs = [
    { id: 'dashboard', label: 'Tổng quan kho' },
    { id: 'documents', label: 'Chứng từ kho' },
    { id: 'materials', label: 'Danh mục vật tư' },
    { id: 'warehouses', label: 'Danh mục kho bãi' },
    { id: 'reports', label: 'Báo cáo kho' }
  ];

  const handleViewDocDetail = (id: string) => {
    setSelectedDocId(id);
    setShowDocForm(true);
  };

  const handleCreateNewDoc = () => {
    setSelectedDocId(null);
    setShowDocForm(true);
  };

  const handleBackToDocsList = () => {
    setShowDocForm(false);
    setSelectedDocId(null);
  };

  const handleDrillDownFromReport = (docNo: string) => {
    fetch(`/api/inventory/documents`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const matched = json.data.find((d: any) => d.documentNo === docNo);
          if (matched) {
            setSelectedDocId(matched.id);
            setActiveTab('documents');
            setShowDocForm(true);
          }
        }
      });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="inventory" />

      <main className={`erp-page-main flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'pl-[var(--erp-sidebar-collapsed)]' : 'pl-[var(--erp-sidebar-width)]'}`}>
        <Header data={{ project: { name: "Quản trị Kho & Vật tư Công trình" } } as any} />

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          <EnterpriseSection
            title="HỆ THỐNG KẾ TOÁN KHO & VẬT TƯ (INVENTORY COMMAND)"
            subtitle="Theo dõi xuất nhập tồn, giá bình quân gia quyền di động, đối chiếu sổ cái TK 152"
          >
            <EnterpriseTabs 
              tabs={tabs} 
              activeTab={activeTab} 
              onTabChange={(id) => {
                setActiveTab(id as any);
                if (id === 'documents') setShowDocForm(false);
              }} 
            />
          </EnterpriseSection>

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <InventoryDashboardCards
                currentProjectId={currentProjectId}
                onNavigateTab={(tab) => {
                  setActiveTab(tab as any);
                  if (tab === 'documents') setShowDocForm(false);
                }}
              />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <EnterpriseCard
                  title="CẢNH BÁO AN TOÀN KHO & KẾ TOÁN"
                  subtitle="Tự động đối chiếu số liệu kho hàng với Sổ cái phát sinh"
                >
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] text-[12px] space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Trạng thái chốt chặn xuất âm kho:</span>
                      <span className="font-bold text-emerald-500">ĐANG BẬT (ACTIVE)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Phương pháp tính giá xuất kho:</span>
                      <span className="font-bold text-blue-500">GIÁ BÌNH QUÂN DI ĐỘNG (AVCO)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cơ chế hạch toán sổ cái:</span>
                      <span className="font-bold text-indigo-500">BÚT TOÁN KÉP TỰ ĐỘNG (TK 152/153)</span>
                    </div>
                  </div>
                </EnterpriseCard>
                <EnterpriseCard
                  title="TÁC VỤ KHO CHỜ XỬ LÝ"
                  subtitle="Xem danh sách tài liệu cần được CFO/Kế toán trưởng phê duyệt hoặc ghi sổ"
                >
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-[12px] text-[var(--text-tertiary)] italic text-center py-8">
                    Không có chứng từ kho nào bị treo hoặc cảnh báo quá hạn.
                  </div>
                </EnterpriseCard>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="animate-fade-in">
              <EnterpriseCard title="DANH MỤC VẬT TƯ CÔNG TRÌNH" subtitle="Khai báo vật tư xây dựng, đơn vị tính, tài khoản kho mặc định">
                <MaterialTable />
              </EnterpriseCard>
            </div>
          )}

          {activeTab === 'warehouses' && (
            <div className="animate-fade-in">
              <EnterpriseCard title="DANH SÁCH KHO HÀNG & BÃI VẬT TƯ" subtitle="Quản lý địa điểm kho hàng, phân quyền theo công trình dự án">
                <WarehouseTable />
              </EnterpriseCard>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="animate-fade-in">
              {showDocForm ? (
                <InventoryDocumentForm docId={selectedDocId} onBack={handleBackToDocsList} />
              ) : (
                <EnterpriseCard title="CHỨNG TỪ XUẤT NHẬP KHO" subtitle="Quản lý phiếu nhập kho mua vật tư, phiếu xuất kho thi công, chuyển kho nội bộ">
                  <InventoryDocumentTable
                    currentProjectId={currentProjectId}
                    onViewDetails={handleViewDocDetail}
                    onCreateNew={handleCreateNewDoc}
                  />
                </EnterpriseCard>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center gap-3 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
                <span className="text-[12px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">CHỌN LOẠI BÁO CÁO:</span>
                <button
                  onClick={() => { setReportType('in-out-balance'); setReportFilters(null); }}
                  className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${reportType === 'in-out-balance' ? 'bg-blue-600 text-white' : 'bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  Báo cáo Nhập Xuất Tồn
                </button>
                <button
                  onClick={() => { setReportType('stock-card'); setReportFilters(null); }}
                  className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${reportType === 'stock-card' ? 'bg-blue-600 text-white' : 'bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  Thẻ kho chi tiết
                </button>
              </div>
              <InventoryReportFilterBar
                onFilterChange={setReportFilters}
                showMaterialSelect={reportType === 'stock-card'}
              />
              {reportType === 'in-out-balance' ? (
                <InOutBalanceTable filters={reportFilters} />
              ) : (
                <StockCardTable filters={reportFilters} onDrillDown={handleDrillDownFromReport} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

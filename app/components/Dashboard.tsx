'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useERPStore } from '@/store/erpStore';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Header from './Header';
import { EnterpriseSection, EnterpriseCard } from "./ui-enterprise";

import { ExecutiveSummaryCards } from "./reports/ExecutiveSummaryCards";
import { ProjectProfitabilityTable } from "./reports/ProjectProfitabilityTable";
import { DebtAgingPanel } from "./reports/DebtAgingPanel";
import { RiskAlertsPanel } from "./reports/RiskAlertsPanel";
import FinancialTracePanel from "./accounting/FinancialTracePanel";

export default function Dashboard() {
  const [traceType, setTraceType] = useState<'contract' | 'invoice' | 'payment' | 'advance' | 'cost'>('invoice');
  const [traceId, setTraceId] = useState<string | null>(null);
  
  const { currentProjectId, sidebarCollapsed } = useERPStore();
  const router = useRouter();

  // Queries cho Management Reports
  const { data: execSummary, isLoading: loadingExec } = useQuery({
    queryKey: ['exec-summary', currentProjectId],
    queryFn: async () => {
      const res = await fetch(`/api/reports/management/executive-summary?projectId=${currentProjectId || ""}`);
      const json = await res.json();
      return json.success ? json.data : null;
    }
  });

  const { data: projectProfit, isLoading: loadingProfit } = useQuery({
    queryKey: ['project-profitability'],
    queryFn: async () => {
      const res = await fetch(`/api/reports/management/project-profitability`);
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  const { data: debtMgmt, isLoading: loadingDebt } = useQuery({
    queryKey: ['debt-management'],
    queryFn: async () => {
      const res = await fetch(`/api/reports/management/debt`);
      const json = await res.json();
      return json.success ? json.data : null;
    }
  });

  const { data: riskAlerts, isLoading: loadingRisk } = useQuery({
    queryKey: ['risk-alerts'],
    queryFn: async () => {
      const res = await fetch(`/api/reports/management/risk-alerts`);
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="dashboard" />

      <main className={`erp-page-main flex-1 flex flex-col h-screen overflow-hidden ${sidebarCollapsed ? 'pl-[var(--erp-sidebar-collapsed)]' : 'pl-[var(--erp-sidebar-width)]'}`}>
        <Header data={{ project: { name: "Trung tâm Chỉ huy Kế toán (Financial Command Center)" } } as any} />

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-zinc-50/30">
          
          {/* 1. EXECUTIVE SUMMARY */}
          <EnterpriseSection title="TỔNG QUAN TÀI CHÍNH (EXECUTIVE SUMMARY)" subtitle="Chỉ tiêu tài chính thời gian thực từ Hệ thống Sổ cái & Phân bổ gốc">
            <ExecutiveSummaryCards 
              data={execSummary} 
              isLoading={loadingExec} 
              onDrillDown={(type) => {
                setTraceType(type);
                setTraceId(""); // Trigger Financial Trace Panel
              }}
              onNavigateApprovals={() => router.push('/approvals')}
            />
          </EnterpriseSection>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* 2. CÔNG NỢ & DÒNG TIỀN (DEBT & CASHFLOW) */}
            <div className="xl:col-span-2 space-y-6">
              <EnterpriseCard title="PHÂN TÍCH TUỔI NỢ & QUẢN TRỊ DÒNG TIỀN (DEBT AGING)" subtitle="Theo dõi hóa đơn đến hạn và quá hạn để tối ưu vốn lưu động">
                <DebtAgingPanel data={debtMgmt} isLoading={loadingDebt} />
              </EnterpriseCard>

              {/* 3. HIỆU QUẢ DỰ ÁN (PROJECT PROFITABILITY) */}
              <EnterpriseCard title="BÁO CÁO HIỆU QUẢ CÔNG TRÌNH (PROJECT PROFITABILITY)" subtitle="Đánh giá doanh thu, chi phí, và tỷ suất lợi nhuận từng dự án (P&L)">
                <ProjectProfitabilityTable data={projectProfit} isLoading={loadingProfit} />
              </EnterpriseCard>
            </div>

            {/* 4. CẢNH BÁO RỦI RO (EXCEPTION / RISK ALERTS) */}
            <div className="space-y-6">
              <EnterpriseCard title="CẢNH BÁO RỦI RO (EXCEPTION ALERTS)" subtitle="Các ngoại lệ, chứng từ quá hạn, và cảnh báo kiểm soát nội bộ">
                <RiskAlertsPanel data={riskAlerts} isLoading={loadingRisk} />
              </EnterpriseCard>
            </div>
            
          </div>
        </div>
      </main>
      
      <FinancialTracePanel
        type={traceType}
        id={traceId || ""}
        isOpen={traceId !== null}
        onClose={() => setTraceId(null)}
      />
    </div>
  );
}

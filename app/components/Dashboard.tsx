'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useERPStore } from '@/store/erpStore';
import { useQuery } from '@tanstack/react-query';
import EnterpriseAppShell from './layout/EnterpriseAppShell';
import EnterpriseHeader from './layout/EnterpriseHeader';
import EnterprisePageContainer from './layout/EnterprisePageContainer';
import { EnterpriseSection, EnterpriseCard } from "./ui-enterprise";

import { ExecutiveSummaryCards } from "./reports/ExecutiveSummaryCards";
import { ProjectProfitabilityTable } from "./reports/ProjectProfitabilityTable";
import { DebtAgingPanel } from "./reports/DebtAgingPanel";
import { RiskAlertsPanel } from "./reports/RiskAlertsPanel";
import FinancialDrilldownDrawer, { FinancialMetricKey } from "./accounting/FinancialDrilldownDrawer";

type DrilldownRequest = {
  metric: FinancialMetricKey;
  title: string;
  amount: number;
  projectId?: string | null;
  projectName?: string | null;
};

export default function Dashboard() {
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  
  const { currentProjectId } = useERPStore();
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
      return json.success ? (Array.isArray(json.data?.data) ? json.data.data : []) : [];
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
      return json.success ? (Array.isArray(json.data?.data) ? json.data.data : []) : [];
    }
  });

  return (
    <EnterpriseAppShell activeItem="dashboard">
      <EnterpriseHeader 
        title="Bàn làm việc" 
        subtitle="Trung tâm Chỉ huy Kế toán (Financial Command Center)" 
      />
      <EnterprisePageContainer>
        {/* 1. EXECUTIVE SUMMARY */}
        <EnterpriseSection title="Tổng hợp Chỉ tiêu Tài chính (Executive Summary)" subtitle="Chỉ tiêu tài chính thời gian thực từ Hệ thống Sổ cái & Phân bổ gốc">
          <ExecutiveSummaryCards 
            data={execSummary} 
            isLoading={loadingExec} 
            onDrillDown={(metric, title, amount) => {
              setDrilldown({
                metric,
                title,
                amount,
                projectId: currentProjectId || null
              });
            }}
            onNavigateApprovals={() => router.push('/approvals')}
          />
        </EnterpriseSection>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 2. CÔNG NỢ & DÒNG TIỀN (DEBT & CASHFLOW) */}
          <div className="xl:col-span-2 space-y-6">
            <EnterpriseCard title="Phân tích Tuổi nợ & Quản trị Dòng tiền (Debt Aging)" subtitle="Theo dõi hóa đơn đến hạn và quá hạn để tối ưu vốn lưu động">
              <DebtAgingPanel data={debtMgmt} isLoading={loadingDebt} />
            </EnterpriseCard>

            {/* 3. HIỆU QUẢ DỰ ÁN (PROJECT PROFITABILITY) */}
            <EnterpriseCard title="Hiệu quả Công trình & Dự án (P&L)" subtitle="Đánh giá doanh thu, chi phí, và tỷ suất lợi nhuận từng dự án (P&L)">
              <ProjectProfitabilityTable
                data={projectProfit}
                isLoading={loadingProfit}
                onDrillDown={(project, metric, title, amount) =>
                  setDrilldown({
                    metric,
                    title,
                    amount,
                    projectId: project.projectId,
                    projectName: project.projectName
                  })
                }
              />
            </EnterpriseCard>
          </div>

          {/* 4. CẢNH BÁO RỦI RO (EXCEPTION / RISK ALERTS) */}
          <div className="space-y-6">
            <EnterpriseCard title="Cảnh báo Rủi ro Kiểm soát (Exception Alerts)" subtitle="Các ngoại lệ, chứng từ quá hạn, và cảnh báo kiểm soát nội bộ">
              <RiskAlertsPanel data={riskAlerts} isLoading={loadingRisk} />
            </EnterpriseCard>
          </div>
          
        </div>
      </EnterprisePageContainer>
      
      <FinancialDrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </EnterpriseAppShell>
  );
}

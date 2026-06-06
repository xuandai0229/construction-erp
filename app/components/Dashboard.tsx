"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useERPStore } from "@/store/erpStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EnterpriseAppShell from "./layout/EnterpriseAppShell";
import EnterpriseHeader from "./layout/EnterpriseHeader";
import EnterprisePageContainer from "./layout/EnterprisePageContainer";
import { EnterpriseCard, EnterpriseSection } from "./ui-enterprise";
import { ExecutiveSummaryCards } from "./reports/ExecutiveSummaryCards";
import { ProjectProfitabilityTable } from "./reports/ProjectProfitabilityTable";
import { DebtAgingPanel } from "./reports/DebtAgingPanel";
import { RiskAlertsPanel } from "./reports/RiskAlertsPanel";
import { formatVnd } from "./dashboard-data";
import FinancialDrilldownDrawer, { FinancialMetricKey } from "./accounting/FinancialDrilldownDrawer";

type DrilldownRequest = {
  metric: FinancialMetricKey;
  title: string;
  amount: number;
  projectId?: string | null;
  projectName?: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
};

type RiskAlert = {
  severity: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function getProjectCode(projectId?: string | null) {
  if (!projectId) return "Toàn công ty";
  return `PRJ-${projectId.slice(0, 4).toUpperCase()}`;
}

function MiniStat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "blue" | "emerald" | "amber" | "rose" }) {
  const tones = {
    neutral: "bg-[var(--secondary)] text-[var(--text-primary)]",
    blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };
  return (
    <div className={`rounded-lg border border-[var(--border)] p-3 ${tones[tone]}`}>
      <div className="text-[10px] font-black uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 font-mono text-base font-black tabular-nums">{value}</div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-left text-xs font-bold text-[var(--text-primary)] transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60">
      {label}
    </button>
  );
}

export default function Dashboard() {
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const [period, setPeriod] = useState("current-month");
  const [dataScope, setDataScope] = useState("approved");

  const { currentProjectId, setCurrentProject } = useERPStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: projects = [] } = useQuery<ProjectOption[]>({
    queryKey: ["dashboard-project-options"],
    queryFn: async () => {
      const res = await fetch("/api/projects?limit=100&orderBy=name&orderDir=asc");
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
  });

  const selectedProject = useMemo(() => projects.find((project) => project.id === currentProjectId), [projects, currentProjectId]);
  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === "current-quarter") {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return { dateFrom: new Date(now.getFullYear(), quarterStartMonth, 1), dateTo: now, label: "Quý hiện tại" };
    }
    if (period === "current-year") {
      return { dateFrom: new Date(now.getFullYear(), 0, 1), dateTo: now, label: "Năm hiện tại" };
    }
    return { dateFrom: new Date(now.getFullYear(), now.getMonth(), 1), dateTo: now, label: "Tháng hiện tại" };
  }, [period]);

  const summaryParams = new URLSearchParams();
  if (currentProjectId) summaryParams.set("projectId", currentProjectId);
  summaryParams.set("dateFrom", dateRange.dateFrom.toISOString());
  summaryParams.set("dateTo", dateRange.dateTo.toISOString());

  const { data: execSummary, dataUpdatedAt } = useQuery({
    queryKey: ["exec-summary", currentProjectId, period],
    queryFn: async () => {
      const res = await fetch(`/api/reports/management/executive-summary?${summaryParams.toString()}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
  });

  const { data: projectProfit = [] } = useQuery({
    queryKey: ["project-profitability", currentProjectId],
    queryFn: async () => {
      const params = currentProjectId ? `?projectId=${currentProjectId}` : "";
      const res = await fetch(`/api/reports/management/project-profitability${params}`);
      const json = await res.json();
      return json.success ? (Array.isArray(json.data?.data) ? json.data.data : []) : [];
    },
  });

  const { data: debtMgmt } = useQuery({
    queryKey: ["debt-management", currentProjectId],
    queryFn: async () => {
      const params = currentProjectId ? `?projectId=${currentProjectId}` : "";
      const res = await fetch(`/api/reports/management/debt${params}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
  });

  const { data: riskAlerts = [] } = useQuery({
    queryKey: ["risk-alerts", currentProjectId],
    queryFn: async () => {
      const params = currentProjectId ? `?projectId=${currentProjectId}` : "";
      const res = await fetch(`/api/reports/management/risk-alerts${params}`);
      const json = await res.json();
      return json.success ? (Array.isArray(json.data?.data) ? json.data.data : []) : [];
    },
  });

  const todayTasks = useMemo(() => {
    const pending = execSummary?.pendingApprovals || 0;
    const overdueDebt = debtMgmt?.overdueInvoices?.length || 0;
    const highRisk = (riskAlerts as RiskAlert[]).filter((item) => item.severity === "HIGH").length;
    return [
      { label: "Duyệt chứng từ đang chờ", value: pending.toLocaleString("vi-VN"), action: () => router.push("/approvals"), tone: pending > 0 ? "blue" : "emerald" },
      { label: "Đôn đốc hóa đơn quá hạn", value: overdueDebt.toLocaleString("vi-VN"), action: () => router.push("/debt"), tone: overdueDebt > 0 ? "rose" : "emerald" },
      { label: "Rà soát cảnh báo rủi ro cao", value: highRisk.toLocaleString("vi-VN"), action: () => router.push("/reports"), tone: highRisk > 0 ? "amber" : "emerald" },
    ] as const;
  }, [debtMgmt?.overdueInvoices?.length, execSummary?.pendingApprovals, riskAlerts, router]);

  const refreshDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ["exec-summary"] });
    queryClient.invalidateQueries({ queryKey: ["project-profitability"] });
    queryClient.invalidateQueries({ queryKey: ["debt-management"] });
    queryClient.invalidateQueries({ queryKey: ["risk-alerts"] });
  };

  const stats = {
    outstandingAdvances: execSummary?.outstandingAdvances || 0,
    paidAmount: execSummary?.cashOut || 0,
    payableAmount: execSummary?.payables || 0,
    settlementAmount: Math.max((execSummary?.cashOut || 0) - (execSummary?.outstandingAdvances || 0), 0),
  };
  const contextLabel = selectedProject ? `${getProjectCode(selectedProject.id)} - ${selectedProject.name}` : "Toàn công ty";

  return (
    <EnterpriseAppShell activeItem="dashboard">
      <EnterpriseHeader
        title="Tổng quan"
        subtitle="Tổng hợp tình hình tài chính, công nợ, dòng tiền và công việc cần xử lý."
        actions={
          <>
            <button type="button" onClick={refreshDashboard} className="h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60">
              Làm mới
            </button>
            <button type="button" onClick={() => router.push("/reports")} className="h-9 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 text-xs font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60">
              Xem báo cáo
            </button>
            <button type="button" onClick={() => router.push("/accounting")} className="h-9 rounded-md bg-[var(--primary)] px-3 text-xs font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60">
              Tạo chứng từ
            </button>
          </>
        }
      />
      <EnterprisePageContainer>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)] xl:items-end">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Ngữ cảnh dữ liệu</div>
              <h2 className="mt-1 text-xl font-black text-[var(--text-primary)]">{contextLabel}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {dateRange.label}. Cập nhật lần cuối: {formatDateTime(dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : execSummary?.metadata?.generatedAt)}
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
              <label className="grid min-w-0 gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                Công trình
                <select value={currentProjectId || ""} onChange={(event) => setCurrentProject(event.target.value)} className="h-10 w-full max-w-full min-w-0 truncate rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]">
                  <option value="">Toàn công ty</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{getProjectCode(project.id)} - {project.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid min-w-0 gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                Thời gian
                <select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-10 w-full max-w-full min-w-0 truncate rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]">
                  <option value="current-month">Tháng hiện tại</option>
                  <option value="current-quarter">Quý hiện tại</option>
                  <option value="current-year">Năm hiện tại</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                Phạm vi dữ liệu
                <select value={dataScope} onChange={(event) => setDataScope(event.target.value)} className="h-10 w-full max-w-full min-w-0 truncate rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]">
                  <option value="approved">Chứng từ đã phê duyệt</option>
                  <option value="all-visible" disabled>Tất cả dữ liệu được phép xem</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <EnterpriseSection title="TÌNH HÌNH TÀI CHÍNH TRONG KỲ" subtitle="Bốn chỉ tiêu trọng yếu và các chỉ tiêu vận hành trong phạm vi đang xem.">
          <ExecutiveSummaryCards
            data={execSummary}
            isLoading={false}
            onDrillDown={(metric, title, amount) => setDrilldown({ metric, title, amount, projectId: currentProjectId || null })}
            onNavigateApprovals={() => router.push("/approvals")}
          />
        </EnterpriseSection>

        {/* Row 4: Phân tích chính */}
        <div className="mb-6 grid gap-6 xl:grid-cols-12 items-start">
          <div className="xl:col-span-8">
            <EnterpriseCard title="Phân tích tuổi nợ và quản trị dòng tiền" subtitle="Theo dõi công nợ phải thu theo ngày đến hạn để ưu tiên thu tiền và kiểm soát vốn lưu động.">
              <DebtAgingPanel data={debtMgmt} isLoading={false} />
            </EnterpriseCard>
          </div>
          <div className="xl:col-span-4">
            <EnterpriseCard title="Cảnh báo rủi ro và kiểm soát" subtitle="Các điểm cần ưu tiên rà soát trong kỳ.">
              <RiskAlertsPanel data={riskAlerts} isLoading={false} />
            </EnterpriseCard>
          </div>
        </div>

        {/* Row 5: Điều hành công việc */}
        <div className="mb-6 grid gap-6 xl:grid-cols-12 items-start">
          <div className="xl:col-span-8">
            <EnterpriseCard title="Hiệu quả công trình và dự án" subtitle="Đánh giá doanh thu, chi phí, lãi/lỗ và tỷ suất lợi nhuận từng công trình.">
              <ProjectProfitabilityTable
                data={projectProfit}
                isLoading={false}
                onDrillDown={(project, metric, title, amount) => setDrilldown({ metric, title, amount, projectId: project.projectId, projectName: project.projectName })}
              />
            </EnterpriseCard>
          </div>
          <div className="xl:col-span-4">
            <EnterpriseCard title="Việc cần xử lý hôm nay" subtitle="Các đầu việc ưu tiên trong ngày." bodyClassName="p-0">
              <div className="divide-y divide-[var(--border)]">
                {todayTasks.map((task) => (
                  <button key={task.label} type="button" onClick={task.action} className="flex min-h-[76px] w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-[var(--table-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/60">
                    <div className="text-xs font-bold uppercase text-[var(--text-tertiary)]">{task.label}</div>
                    <div className={`font-mono text-xl font-black tabular-nums ${task.tone === "rose" ? "text-rose-600" : task.tone === "amber" ? "text-amber-600" : task.tone === "blue" ? "text-blue-600" : "text-emerald-600"}`}>{task.value}</div>
                  </button>
                ))}
              </div>
            </EnterpriseCard>
          </div>
        </div>

        {/* Row 6: Tạm ứng & thanh toán */}
        <div className="grid gap-6 xl:grid-cols-12 items-start">
          <div className="xl:col-span-8">
            <EnterpriseCard title="Tổng hợp tạm ứng & thanh toán" subtitle="Tóm tắt nhanh các khoản tạm ứng, thanh toán và hoàn ứng.">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MiniStat label="Tổng tạm ứng" value={formatVnd(stats.outstandingAdvances)} tone="amber" />
                <MiniStat label="Đã thanh toán" value={formatVnd(stats.paidAmount)} tone="blue" />
                <MiniStat label="Còn phải thanh toán" value={formatVnd(stats.payableAmount)} tone="rose" />
                <MiniStat label="Còn phải hoàn ứng" value={formatVnd(stats.outstandingAdvances)} tone="emerald" />
              </div>
              <button type="button" onClick={() => router.push("/accounting")} className="mt-5 h-10 w-full rounded-md bg-[var(--primary)] px-4 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60">
                Xem tổng hợp
              </button>
            </EnterpriseCard>
          </div>
          <div className="xl:col-span-4">
            <EnterpriseCard title="Thao tác & Báo cáo nhanh" subtitle="Lối tắt đến các nghiệp vụ thường dùng.">
              <div className="grid gap-3">
                <QuickAction label="Tạo chứng từ tạm ứng" onClick={() => router.push("/accounting")} />
                <QuickAction label="Mở hộp việc phê duyệt" onClick={() => router.push("/approvals")} />
                <QuickAction label="Xem báo cáo công nợ" onClick={() => router.push("/debt")} />
                <QuickAction label="Báo cáo tổng hợp" onClick={() => router.push("/reports")} />
              </div>
            </EnterpriseCard>
          </div>
        </div>
      </EnterprisePageContainer>

      <FinancialDrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </EnterpriseAppShell>
  );
}

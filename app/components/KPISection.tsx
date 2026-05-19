'use client';

import { DashboardData, formatVnd } from './dashboard-data';

const icons = {
  contract: 'M4 7h16v12H4zM8 7V5h8v2M8 12h8',
  budget: 'M7 3h10v18H7zM10 7h4M10 11h4M10 15h2',
  cost: 'M6 19V5h12v14M9 9h6M9 13h6',
  revenue: 'M12 3v18M7 8h7a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h7',
  profit: 'M4 17l6-6 4 4 6-8M20 7v6h-6',
};

export default function KPISection({ data }: { data: DashboardData }) {
  if (!data) return null;

  const project = data.project || { totalValue: 0, contractValue: 0 };
  const totalValue = Number(project.totalValue ?? project.contractValue ?? 0);
  const totalBudget = Number(data.totalBudget ?? 0);
  const totalCost = Number(data.totalCost ?? 0);
  const revenue = Number(data.revenue ?? 0);

  const profit = revenue - totalCost;
  const budgetDelta = totalBudget > 0 ? ((totalBudget - totalCost) / totalBudget) * 100 : 0;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const budgetVsContract = totalValue > 0 ? (totalBudget / totalValue) * 100 : 0;
  const revenueVsContract = totalValue > 0 ? (revenue / totalValue) * 100 : 0;

  const cards = [
    { title: 'Tổng giá trị hợp đồng', value: totalValue, change: 'Giá trị gốc dự án', tone: 'blue', icon: icons.contract },
    { title: 'Tổng dự toán (BOQ)', value: totalBudget, change: `${budgetVsContract.toFixed(1)}% so với HĐ`, tone: 'blue', icon: icons.budget },
    { title: 'Chi phí thực tế', value: totalCost, change: `${budgetDelta >= 0 ? '-' : '+'} ${Math.abs(budgetDelta).toFixed(1)}% dự toán`, tone: budgetDelta >= 0 ? 'green' : 'red', icon: icons.cost },
    { title: 'Doanh thu nghiệm thu', value: revenue, change: `${revenueVsContract.toFixed(1)}% tiến độ`, tone: 'blue', icon: icons.revenue },
    { title: 'Lợi nhuận dự kiến', value: profit, change: `${margin.toFixed(1)}% biên lợi nhuận`, tone: profit >= 0 ? 'green' : 'red', icon: icons.profit },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
      {cards.map((card) => (
        <article key={card.title} className="erp-kpi-card group">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl border-2 transition-executive shadow-sm icon-hover-scale ${iconTone(card.tone)}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 transition-executive" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={card.icon} />
                </svg>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm transition-executive ${card.tone === 'red' ? 'border-rose-500/20 bg-rose-500/10 text-rose-500' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'}`}>
                {card.tone === 'red' ? 'Cảnh báo' : 'Ổn định'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-1.5">{card.title}</div>
              <div className="text-[20px] font-black tracking-tight text-[var(--text-primary)] tabular-nums truncate leading-none mb-3 transition-executive">
                {formatVnd(card.value ?? 0)}
              </div>
              <div className={`text-[10.5px] font-bold tracking-tight ${card.tone === 'red' ? 'text-rose-500' : 'text-emerald-500'} flex items-center gap-1 transition-executive`}>
                <span className="opacity-70">{card.change}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function iconTone(tone: string) {
  if (tone === 'red') return 'border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-rose-500/5';
  if (tone === 'green') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5';
  return 'border-blue-500/30 bg-blue-500/10 text-blue-500 shadow-blue-500/5';
}


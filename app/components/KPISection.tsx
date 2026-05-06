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
  const totalBudget = data.budget.reduce((sum, row) => sum + row.estimatedAmount, 0);
  const totalCost = data.costs.reduce((sum, row) => sum + row.amount, 0);
  const profit = data.revenue - totalCost;
  const budgetDelta = totalBudget > 0 ? ((totalBudget - totalCost) / totalBudget) * 100 : 0;
  const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
  const budgetVsContract = data.project.totalValue > 0 ? (totalBudget / data.project.totalValue) * 100 : 0;
  const revenueVsContract = data.project.totalValue > 0 ? (data.revenue / data.project.totalValue) * 100 : 0;

  const cards = [
    { title: 'Tổng giá trị hợp đồng', value: data.project.totalValue, change: 'Giá trị gốc dự án', tone: 'blue', icon: icons.contract },
    { title: 'Tổng dự toán', value: totalBudget, change: `${budgetVsContract.toFixed(1)}% so với hợp đồng`, tone: 'green', icon: icons.budget },
    { title: 'Tổng chi phí thực tế', value: totalCost, change: `${budgetDelta >= 0 ? '-' : '+'} ${Math.abs(budgetDelta).toFixed(1)}% so với dự toán`, tone: budgetDelta >= 0 ? 'green' : 'red', icon: icons.cost },
    { title: 'Tổng doanh thu', value: data.revenue, change: `${revenueVsContract.toFixed(1)}% tiến độ nghiệm thu`, tone: 'green', icon: icons.revenue },
    { title: 'Lãi / Lỗ dự án', value: profit, change: `${margin.toFixed(1)}% biên lợi nhuận`, tone: profit >= 0 ? 'green' : 'red', icon: icons.profit },
  ];

  return (
    <section className="grid grid-cols-5 gap-4">
      {cards.map((card) => (
        <article key={card.title} className="rounded-lg border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
          <div className="flex items-start gap-4">
            <div className={`grid h-11 w-11 place-items-center rounded-md border ${iconTone(card.tone)}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={card.icon} />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-slate-100">{card.title}</div>
              <div className="mt-4 whitespace-nowrap text-[22px] font-extrabold tracking-tight text-white">{formatVnd(card.value ?? 0)}</div>
              <div className={`mt-3 text-xs font-bold ${card.tone === 'red' ? 'text-red-400' : 'text-green-400'}`}>{card.change}</div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function iconTone(tone: string) {
  if (tone === 'red') return 'border-red-500/50 bg-red-500/10 text-red-400';
  if (tone === 'green') return 'border-green-500/50 bg-green-500/10 text-green-400';
  return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
}


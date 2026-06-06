const fs = require('fs');
let content = fs.readFileSync('app/approvals/page.tsx', 'utf8');

content = content.replace(
  '  return list;\n  }, [summary.pendingForMe, slaSummary.highValue, slaSummary.needsFix, slaSummary.overdue]);',
  '  return list;\n  }, [summary.pendingForMe, slaSummary.highValue, slaSummary.needsFix, slaSummary.overdue]);\n\n  const allKpisZero = summary.pendingForMe === 0 && slaSummary.dueSoon === 0 && slaSummary.overdue === 0 && slaSummary.highValue === 0 && slaSummary.needsFix === 0;'
);

const kpiRegex = /(<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">[\s\S]*?<\/div>)/;
const match = content.match(kpiRegex);
if (match) {
  content = content.replace(
    kpiRegex,
    `{!allKpisZero && (\n            ${match[1]}\n          )}\n\n          {allKpisZero && (\n            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">\n              <p className="text-sm font-semibold text-[var(--text-secondary)]">Không có công việc nào đang chờ bạn xử lý lúc này.</p>\n            </div>\n          )}`
  );
}

content = content.replace('minWidth="1730px"', 'minWidth="1100px"');

const oldMsgRegex = /<div className="rounded-md border border-amber-500\/30 bg-amber-500\/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">[\s\S]*?<\/div>/;
const newMsg = `<div className="flex items-center gap-2 rounded-md border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs leading-5 text-blue-700 dark:text-blue-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-bold">i</span>
                <span>Dữ liệu được lọc theo vai trò kế toán hiện tại. Dùng phím <kbd className="mx-1 rounded bg-blue-500/20 px-1 font-mono font-bold">/</kbd> để tìm kiếm nhanh chứng từ.</span>
              </div>`;

content = content.replace(oldMsgRegex, newMsg);

fs.writeFileSync('app/approvals/page.tsx', content, 'utf8');
console.log("Fixed page.tsx properly");

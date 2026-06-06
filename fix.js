const fs = require('fs');
let content = fs.readFileSync('app/approvals/page.tsx', 'utf8');

content = content.replace(
  '  return list;\n  }, [summary.pendingForMe, slaSummary.highValue, slaSummary.needsFix, slaSummary.overdue]);',
  '  return list;\n  }, [summary.pendingForMe, slaSummary.highValue, slaSummary.needsFix, slaSummary.overdue]);\n\n  const allKpisZero = summary.pendingForMe === 0 && slaSummary.dueSoon === 0 && slaSummary.overdue === 0 && slaSummary.highValue === 0 && slaSummary.needsFix === 0;'
);

content = content.replace(
  '<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">',
  '{!allKpisZero && (\n            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">'
);

content = content.replace(
  'tone="slate" />\n          </div>',
  'tone="slate" />\n            </div>\n          )}\n          {allKpisZero && (\n            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">\n              <p className="text-sm font-semibold text-[var(--text-secondary)]">Không có công việc nào đang chờ bạn xử lý lúc này.</p>\n            </div>\n          )}'
);

content = content.replace('minWidth="1730px"', 'minWidth="1100px"');

const oldMsg1 = '<div className="rounded-md border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs leading-5 text-blue-700 dark:text-blue-300">\n                Dữ liệu đang hiển thị theo phạm vi công trình, loại chứng từ và vai trò phê duyệt hiện tại. Số liệu tổng quan được tính trực tiếp từ danh sách chứng từ đang tải.\n              </div>';
const oldMsg2 = '<div className="rounded-md border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs leading-5 text-blue-700 dark:text-blue-300">\n                D\\u1eef li\\u1ec7u \\u0111ang hi\\u1ec3n th\\u1ecb theo ph\\u1ea1m vi c\\u00f4ng tr\\u00ecnh, lo\\u1ea1i ch\\u1ee9ng t\\u1eeb v\\u00e0 vai tr\\u00f2 ph\\u00ea duy\\u1ec7t hi\\u1ec7n t\\u1ea1i. S\\u1ed1 li\\u1ec7u t\\u1ed5ng quan \\u0111\\u01b0\\u1ee3c t\\u00ednh tr\\u1ef1c ti\\u1ebfp t\\u1eeb danh s\\u00e1ch ch\\u1ee9ng t\\u1eeb \\u0111ang t\\u1ea3i.\n              </div>';

const newMsg = '<div className="flex items-center gap-2 rounded-md border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs leading-5 text-blue-700 dark:text-blue-300">\n                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-bold">i</span>\n                <span>Dữ liệu được lọc theo vai trò kế toán hiện tại. Dùng phím <kbd className="mx-1 rounded bg-blue-500/20 px-1 font-mono font-bold">/</kbd> để tìm kiếm nhanh chứng từ.</span>\n              </div>';

content = content.replace(oldMsg1, newMsg);
content = content.replace(oldMsg2, newMsg);

fs.writeFileSync('app/approvals/page.tsx', content, 'utf8');
console.log("Replaced");

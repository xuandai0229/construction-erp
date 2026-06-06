const fs = require('fs');
let content = fs.readFileSync('app/approvals/page.tsx', 'utf8');

const formatRoleLabelStr = `
function formatRoleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    "Quản trị hệ thống": "Quản trị hệ thống",
    ADMIN: "Quản trị doanh nghiệp",
    CFO: "Giám đốc tài chính",
    GROUP_DIRECTOR: "Ban giám đốc",
    ACCOUNTANT: "Kế toán",
    MANAGER: "Quản lý công trình",
    AUDITOR: "Kiểm soát nội bộ",
    VIEWER: "Người xem",
  };
  return role ? labels[role] || "Người xử lý" : "Đang tải";
}
`;

content += '\n' + formatRoleLabelStr;

fs.writeFileSync('app/approvals/page.tsx', content, 'utf8');
console.log('Added formatRoleLabel to approvals/page.tsx');

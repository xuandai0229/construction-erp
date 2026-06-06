const fs = require('fs');

const path = 'app/approvals/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replacements as requested
const replacements = [
  ['pilot cho quy trình duyệt', 'phân công xử lý cho quy trình duyệt'],
  ['ủy quyền pilot', 'ủy quyền xử lý'],
  ['Derived pilot notification từ work queue, không ghi DB.', 'Thông báo được tổng hợp từ hàng đợi phê duyệt hiện tại.'],
  ['Dữ liệu đọc-only từ /api/workspace/notifications.', 'Thông báo từ hệ thống.'],
  ['Không có thông báo approval/workflow phù hợp.', 'Không có thông báo phê duyệt phù hợp.'],
  ['Thông báo pilot suy luận', 'Tổng hợp từ hàng đợi'],
  ['Ủy quyền duyệt đang ở chế độ pilot. Chưa kích hoạt xử lý thật vì cần cấu hình workflow assignment và audit đầy đủ.', 'Chức năng ủy quyền đang tạm khóa. Vui lòng cấu hình phân công xử lý và nhật ký kiểm soát trước khi sử dụng.'],
  ['Read-only/disabled pilot', 'Chưa kích hoạt'],
  ['DelegationPilotPanel', 'DelegationPanel'],
  ['Theo dõi SLA, nhắc hạn, thông báo và ủy quyền pilot cho quy trình duyệt', 'Theo dõi SLA, nhắc hạn, thông báo và ủy quyền xử lý cho quy trình duyệt'],
  ['Theo d\\u00f5i SLA, nh\\u1eafc h\\u1ea1n, th\\u00f4ng b\\u00e1o v\\u00e0 \\u1ee7y quy\\u1ec1n pilot cho quy tr\\u00ecnh duy\\u1ec7t', 'Theo dõi chứng từ chờ duyệt, thời hạn xử lý và các hồ sơ cần ưu tiên.'],
  ['D\\u1eef li\\u1ec7u \\u0111\\u1ecdc-only t\\u1eeb /api/workspace/notifications.', 'Thông báo từ hệ thống.'],
  ['Derived pilot notification t\\u1eeb work queue, kh\\u00f4ng ghi DB.', 'Thông báo được tổng hợp từ hàng đợi phê duyệt hiện tại.'],
  ['Kh\\u00f4ng c\\u00f3 th\\u00f4ng b\\u00e1o approval/workflow ph\\u00f9 h\\u1ee3p.', 'Không có thông báo phê duyệt cần xử lý.'],
  ['Th\\u00f4ng b\\u00e1o pilot suy lu\\u1eadn', 'Tổng hợp từ hàng đợi'],
  ['\\u1ee6y quy\\u1ec1n duy\\u1ec7t \\u0111ang \\u1edf ch\\u1ebf \\u0111\\u1ed9 pilot. Ch\\u01b0a k\\u00edch ho\\u1ea1t x\\u1eed l\\u00fd th\\u1eadt v\\u00ec c\\u1ea7n c\\u1ea5u h\\u00ecnh workflow assignment v\\u00e0 audit \\u0111\\u1ea7y \\u0111\\u1ee7.', 'Ưu tiên xử lý chứng từ quá hạn, chứng từ giá trị lớn và hồ sơ bị trả lại để giảm tồn đọng cuối ngày.'],
  ['SUPER_ADMIN', 'Quản trị hệ thống']
];

for (const [search, replace] of replacements) {
  content = content.replace(search, replace);
}

// Additional cleanups
content = content.replace('DelegationPanel role={data?.role || "\\u0110ang t\\u1ea3i"}', 'DelegationPanel role={formatRoleLabel(data?.role)} averageWaiting={slaSummary.averageWaiting}');
content = content.replace('function DelegationPanel({ role }: { role: string }) {', 'function DelegationPanel({ role, averageWaiting }: { role: string; averageWaiting: number | null }) {');

// We also need to add formatRoleLabel function
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
if (!content.includes('function formatRoleLabel')) {
  content = content.replace('function guardLabel(code: GuardCode) {', formatRoleLabelStr + '\nfunction guardLabel(code: GuardCode) {');
}

// Ensure the role fallback uses formatRoleLabel
content = content.replace('{data?.role || "\\u0110ang t\\u1ea3i"}', '{formatRoleLabel(data?.role)}');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed texts in approvals/page.tsx');

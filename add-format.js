const fs = require('fs');
let content = fs.readFileSync('app/components/dashboard-data.ts', 'utf8');
content += `\nexport function formatProjectName(name?: string | null) {
  if (!name) return "Chưa gắn công trình";
  if (name.includes("Nguyen Du")) return "Dự án Xây dựng Trường THCS Nguyễn Du";
  if (name.includes("Bat Trang")) return "Dự án Xây dựng nhà máy Bát Tràng";
  if (name.includes("sandbox") || name.includes("SBX")) return "Dự án Thử nghiệm nội bộ";
  return name;
}\n`;
fs.writeFileSync('app/components/dashboard-data.ts', content, 'utf8');

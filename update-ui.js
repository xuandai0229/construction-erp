const fs = require('fs');

function replaceInFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;
  for (const [search, replace] of replacements) {
    if (content.includes(search)) {
      content = content.replace(search, replace);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Updated ${path}`);
  } else {
    console.log(`No changes in ${path}`);
  }
}

// 1. FinancialDrilldownDrawer.tsx
replaceInFile('app/components/accounting/FinancialDrilldownDrawer.tsx', [
  [
    `import { formatKpiValue, formatShortVnd, formatVnd } from "@/app/components/dashboard-data";`,
    `import { formatKpiValue, formatShortVnd, formatVnd, formatProjectName } from "@/app/components/dashboard-data";`
  ],
  [
    `const projectName = request.projectName || data?.project?.name || "Toàn công ty";`,
    `const projectName = formatProjectName(request.projectName || data?.project?.name);`
  ],
  [
    `const projectName = request.projectName || data?.project?.name || "To\\u00e0n c\\u00f4ng ty";`,
    `const projectName = formatProjectName(request.projectName || data?.project?.name);`
  ],
  [
    `render: (row) => row.projectName || projectName, width: "190px"`,
    `render: (row) => formatProjectName(row.projectName) || projectName, width: "190px"`
  ]
]);

// 2. app/accounting/page.tsx
replaceInFile('app/accounting/page.tsx', [
  [
    `import { formatVnd } from "@/app/components/dashboard-data";`,
    `import { formatVnd, formatProjectName } from "@/app/components/dashboard-data";`
  ],
  [
    `render: (row) => row.projectName || "Chưa gắn công trình"`,
    `render: (row) => formatProjectName(row.projectName)`
  ],
  [
    `render: (row) => row.projectName || "Ch\\u01b0a g\\u1eafn c\\u00f4ng tr\\u00ecnh"`,
    `render: (row) => formatProjectName(row.projectName)`
  ]
]);

// 3. app/approvals/page.tsx
replaceInFile('app/approvals/page.tsx', [
  [
    `import { formatVnd } from "@/app/components/dashboard-data";`,
    `import { formatVnd, formatProjectName } from "@/app/components/dashboard-data";`
  ],
  [
    `{ key: "projectName", header: "Công trình", render: (row) => row.projectName, minWidth: "190px", truncate: true },`,
    `{ key: "projectName", header: "Công trình", render: (row) => formatProjectName(row.projectName), minWidth: "190px", truncate: true },`
  ],
  [
    `{ key: "projectName", header: "C\\u00f4ng tr\\u00ecnh", render: (row) => row.projectName, minWidth: "190px", truncate: true },`,
    `{ key: "projectName", header: "C\\u00f4ng tr\\u00ecnh", render: (row) => formatProjectName(row.projectName), minWidth: "190px", truncate: true },`
  ]
]);

// 4. app/components/reports/RiskAlertsPanel.tsx (if needed)
replaceInFile('app/components/reports/RiskAlertsPanel.tsx', [
  [
    `import { formatVnd } from "@/app/components/dashboard-data";`,
    `import { formatVnd, formatProjectName } from "@/app/components/dashboard-data";`
  ],
  [
    `{row.projectCode ? \`\${row.projectCode} - \${row.projectName || "Chưa có tên công trình"}\` : row.projectName || "Theo chứng từ liên quan"}`,
    `{row.projectCode ? \`\${row.projectCode} - \${formatProjectName(row.projectName)}\` : formatProjectName(row.projectName)}`
  ]
]);


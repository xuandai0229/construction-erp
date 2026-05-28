const fs = require("fs");
const path = require("path");

const routeFiles = [
  "app/api/contracts/[id]/financial-trace/route.ts",
  "app/api/invoices/[id]/financial-trace/route.ts",
  "app/api/payments/[id]/financial-trace/route.ts",
];

for (const f of routeFiles) {
  const fp = path.join(process.cwd(), f);
  if (!fs.existsSync(fp)) { console.log("SKIP: " + f); continue; }
  let c = fs.readFileSync(fp, "utf8");

  c = c.replace(/import { getServerSession } from "next-auth";\n/, '');
  c = c.replace(/import { authOptions } from "@\/app\/api\/auth\/\[\.\.\.nextauth\]\/route";\n/, '');
  
  if (!c.includes('assertAuthenticated')) {
    c = c.replace(
      'import { NextRequest, NextResponse } from "next/server";',
      'import { NextRequest, NextResponse } from "next/server";\nimport { assertAuthenticated } from "@/lib/auth-guard";'
    );
  }

  c = c.replace(/const session = await getServerSession\(authOptions\);\n\s*if \(!session\?\.user\) return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);/g,
    'const user = await assertAuthenticated();');
  
  c = c.replace(/session\.user\.id/g, 'user.id');
  c = c.replace(/session\.user\.companyId/g, 'user.companyId');

  c = c.replace(
    /\{ params \}: \{ params: \{ id: string \} \}/g,
    '{ params }: { params: Promise<{ id: string }> }'
  );
  c = c.replace(/const \{ id \} = params;/g, 'const { id } = await params;');
  c = c.replace(/params\.id/g, '(await params).id');

  fs.writeFileSync(fp, c);
  console.log("FIXED: " + f);
}

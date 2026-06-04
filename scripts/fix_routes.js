const fs = require("fs");
const path = require("path");

const routeFiles = [
  "app/api/advances/route.ts",
  "app/api/advances/[id]/approve/route.ts",
  "app/api/advances/[id]/post/route.ts",
  "app/api/advances/[id]/reverse/route.ts",
  "app/api/advances/[id]/settlements/route.ts",
  "app/api/advances/[id]/submit/route.ts",
  "app/api/settlements/[id]/approve/route.ts",
  "app/api/settlements/[id]/post/route.ts",
  "app/api/settlements/[id]/reverse/route.ts",
  "app/api/settlements/[id]/submit/route.ts",
  "app/api/reports/outstanding-advances/route.ts",
];

for (const f of routeFiles) {
  const fp = path.join(process.cwd(), f);
  if (!fs.existsSync(fp)) { console.log("SKIP (missing): " + f); continue; }
  let c = fs.readFileSync(fp, "utf8");

  // Replace next-auth imports with assertAuthenticated
  c = c.replace(/import { getServerSession } from "next-auth";\n/, '');
  c = c.replace(/import { authOptions } from "@\/app\/api\/auth\/\[\.\.\.nextauth\]\/route";\n/, '');
  
  // Add assertAuthenticated import if not present
  if (!c.includes('assertAuthenticated')) {
    c = c.replace(
      'import { NextRequest, NextResponse } from "next/server";',
      'import { NextRequest, NextResponse } from "next/server";\nimport { assertAuthenticated } from "@/lib/auth-guard";'
    );
  }

  // Replace session checks
  c = c.replace(/const session = await getServerSession\(authOptions\);\n\s*if \(!session\?\.user\) return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);/g,
    'const user = await assertAuthenticated();');
  
  // Replace session.user.id with user.id
  c = c.replace(/session\.user\.id/g, 'user.id');
  c = c.replace(/session\.user\.companyId/g, 'user.companyId');

  // Fix Next.js params pattern: { params }: { params: { id: string } } -> { params }: { params: Promise<{ id: string }> }
  c = c.replace(
    /\{ params \}: \{ params: \{ id: string \} \}/g,
    '{ params }: { params: Promise<{ id: string }> }'
  );
  // Add await params
  c = c.replace(/const \{ id \} = params;/g, 'const { id } = await params;');
  // If params.id is used directly
  c = c.replace(/params\.id/g, '(await params).id');
  // Fix double-await
  c = c.replace(/\(await \(await params\)\.id\)/g, '(await params).id');
  c = c.replace(/await await/g, 'await');

  fs.writeFileSync(fp, c);
  console.log("FIXED: " + f);
}

const fs = require('fs');
const path = require('path');

const generateRoute = (dirPath, methods) => {
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'route.ts'), methods);
};

const apiDir = path.join(__dirname, 'app', 'api');

const defaultAuthTemplate = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ success: true, message: "Action completed" });
}
`;

generateRoute(path.join(apiDir, 'advances'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceService } from "@/services/advance.service";

export async function GET(request: NextRequest) {
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json();
  try {
    const advance = await AdvanceService.createAdvance(data, session.user.id, session.user.companyId);
    return NextResponse.json(advance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'advances', '[id]', 'submit'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceService } from "@/services/advance.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const advance = await AdvanceService.submitAdvance(params.id, session.user.id);
    return NextResponse.json(advance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'advances', '[id]', 'approve'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceService } from "@/services/advance.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const advance = await AdvanceService.approveAdvance(params.id, session.user.id);
    return NextResponse.json(advance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'advances', '[id]', 'post'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceService } from "@/services/advance.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const advance = await AdvanceService.postAdvancePayment(params.id, session.user.id);
    return NextResponse.json(advance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'advances', '[id]', 'reverse'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceService } from "@/services/advance.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const advance = await AdvanceService.reverseAdvance(params.id, session.user.id);
    return NextResponse.json(advance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'advances', '[id]', 'settlements'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceSettlementService } from "@/services/advance-settlement.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json();
  data.advanceRequestId = params.id;
  try {
    const doc = await AdvanceSettlementService.createSettlement(data, session.user.id, session.user.companyId);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'settlements', '[id]', 'submit'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceSettlementService } from "@/services/advance-settlement.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const doc = await AdvanceSettlementService.submitSettlement(params.id, session.user.id);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'settlements', '[id]', 'approve'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceSettlementService } from "@/services/advance-settlement.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const doc = await AdvanceSettlementService.approveSettlement(params.id, session.user.id);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'settlements', '[id]', 'post'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceSettlementService } from "@/services/advance-settlement.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const doc = await AdvanceSettlementService.postSettlement(params.id, session.user.id);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'settlements', '[id]', 'reverse'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdvanceSettlementService } from "@/services/advance-settlement.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const doc = await AdvanceSettlementService.reverseSettlement(params.id, session.user.id);
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`);

generateRoute(path.join(apiDir, 'reports', 'outstanding-advances'), `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const advances = await prisma.advanceRequest.findMany({
      where: {
        companyId: session.user.companyId,
        remainingAmount: { gt: 0 },
        status: { in: ["PAID", "PARTIALLY_SETTLED", "OVERDUE"] }
      },
      include: {
        project: true,
        contract: true,
        supplier: true,
        employee: true
      }
    });

    const report = {
      totalAdvances: advances.length,
      totalRemaining: advances.reduce((sum: number, a: any) => sum + Number(a.remainingAmount), 0),
      items: advances
    };

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
`);

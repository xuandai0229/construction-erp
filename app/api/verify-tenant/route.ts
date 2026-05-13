import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headerCompanyId = (await headers()).get('x-company-id');
    
    // Attempt to fetch all projects
    // Prisma extension should automatically inject companyId if it exists in headers
    const projects = await prisma.project.findMany();
    
    // Check if any project belongs to a different company (if companyId is set)
    const violations = projects.filter(p => headerCompanyId && (p as any).companyId !== headerCompanyId);

    return NextResponse.json({
      activeCompanyId: headerCompanyId,
      projectsCount: projects.length,
      violationsCount: violations.length,
      sampleProject: projects[0] ? { id: projects[0].id, companyId: (projects[0] as any).companyId } : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

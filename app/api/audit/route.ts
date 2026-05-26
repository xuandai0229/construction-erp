import { NextResponse } from 'next/server';
import { AuditService } from '@/services/audit.service';
import { requirePermission } from '@/lib/route-security';
import { handleApiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    await requirePermission("AUDIT", "READ");
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const entityId = searchParams.get('entityId');

    if (!entity || !entityId) {
      return NextResponse.json({ success: false, error: 'Missing entity or entityId' }, { status: 400 });
    }

    const logs = await AuditService.getHistory(entity, entityId);
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return handleApiError(error);
  }
}

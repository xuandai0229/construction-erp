import { NextResponse } from 'next/server';
import { AuditService } from '@/services/audit.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get('entity');
  const entityId = searchParams.get('entityId');

  if (!entity || !entityId) {
    return NextResponse.json({ success: false, error: 'Missing entity or entityId' }, { status: 400 });
  }

  try {
    const logs = await AuditService.getHistory(entity, entityId);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

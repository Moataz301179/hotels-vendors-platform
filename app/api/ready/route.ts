import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMissingRequiredTables, REQUIRED_V2_TABLES, type TablePresence } from '@/lib/v2-readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const checks = await prisma.$queryRaw<TablePresence[]>`
      SELECT required.table_name,
        to_regclass(format('%I.%I', current_schema(), required.table_name)) IS NOT NULL AS present
      FROM (VALUES
        ('Tenant'), ('User'), ('Product'), ('Supplier'), ('Order'),
        ('Opportunity'), ('SavingsLedger'), ('EvidenceRecord'), ('AuditLog')
      ) AS required(table_name)
    `;
    const missingTables = getMissingRequiredTables(checks);
    if (missingTables.length) {
      return NextResponse.json({
        ok: false,
        ready: false,
        service: 'hotelsvendors',
        missingTables,
        requiredTableCount: REQUIRED_V2_TABLES.length,
        checkedAt: new Date().toISOString(),
      }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({
      ok: true,
      ready: true,
      service: 'hotelsvendors',
      checkedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({
      ok: false,
      ready: false,
      service: 'hotelsvendors',
      reason: 'database_or_schema_check_failed',
      checkedAt: new Date().toISOString(),
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

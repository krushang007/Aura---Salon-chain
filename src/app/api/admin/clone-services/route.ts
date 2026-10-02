import { NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'TENANT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized salon admin access' }, { status: 403 });
    }

    const tenantId = admin.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const body = await request.json();
    const { sourceStoreId, targetStoreId } = body;

    if (!sourceStoreId || !targetStoreId) {
      return NextResponse.json({ error: 'sourceStoreId and targetStoreId are required' }, { status: 400 });
    }

    if (sourceStoreId === targetStoreId) {
      return NextResponse.json({ error: 'Source and target branches cannot be the same' }, { status: 400 });
    }

    // 1. Fetch source active services
    const sourceServices = await db.query.services.findMany({
      where: and(eq(services.storeId, sourceStoreId), eq(services.isActive, true)),
    });

    if (sourceServices.length === 0) {
      return NextResponse.json({ error: 'No active services found in source branch' }, { status: 400 });
    }

    // 2. Clone into target store
    const clonedEntries = sourceServices.map((s) => ({
      tenantId,
      storeId: targetStoreId,
      category: s.category,
      title: s.title,
      description: s.description,
      durationMinutes: s.durationMinutes,
      bufferMinutes: s.bufferMinutes,
      price: s.price,
      isActive: true,
    }));

    const inserted = await db.insert(services).values(clonedEntries).returning();

    return NextResponse.json({
      success: true,
      clonedCount: inserted.length,
      message: `Successfully cloned ${inserted.length} services to target branch.`,
    });
  } catch (error) {
    console.error('Service cloning error:', error);
    return NextResponse.json({ error: 'Failed to clone services' }, { status: 500 });
  }
}

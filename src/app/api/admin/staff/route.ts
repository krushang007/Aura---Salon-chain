export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { staffProfiles, stores, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TENANT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized salon admin access' }, { status: 403 });
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const staffList = await db.query.staffProfiles.findMany({
      where: eq(staffProfiles.tenantId, tenantId),
      with: {
        user: true,
        store: true,
      },
    });

    const formatted = staffList.map((st) => ({
      id: st.id,
      userId: st.userId,
      fullName: st.user.fullName,
      email: st.user.email,
      storeId: st.currentStoreId,
      branchName: st.store.name,
      title: st.title,
      assignedChair: st.assignedChair,
      chairStationName: st.chairStationName,
      ratingAverage: Number(st.ratingAverage),
      totalReviews: st.totalReviews,
      isActive: st.isActive,
    }));

    const storeList = await db.query.stores.findMany({
      where: eq(stores.tenantId, tenantId),
    });

    return NextResponse.json({
      staff: formatted,
      stores: storeList.map((s) => ({ id: s.id, name: s.name })),
    });
  } catch (error) {
    console.error('Error fetching admin staff list:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

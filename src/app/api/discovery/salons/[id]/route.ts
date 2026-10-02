export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { stores, services, staffProfiles, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const storeId = params.id;

    if (!storeId || !UUID_REGEX.test(storeId)) {
      return NextResponse.json({ error: 'Invalid store identifier' }, { status: 400 });
    }

    // 1. Fetch Store
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.isActive, true)),
      with: {
        tenant: true,
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found or inactive' }, { status: 404 });
    }

    // 2. Fetch Active Services for this store
    const storeServices = await db.query.services.findMany({
      where: and(eq(services.storeId, storeId), eq(services.isActive, true)),
    });

    // 3. Fetch Active Staff Profiles for this store
    const staffList = await db.query.staffProfiles.findMany({
      where: and(eq(staffProfiles.currentStoreId, storeId), eq(staffProfiles.isActive, true)),
      with: {
        user: true,
      },
    });

    const stylists = staffList.map((st) => ({
      id: st.id, // Real UUID of staff profile
      userId: st.userId,
      fullName: st.user.fullName,
      email: st.user.email,
      title: st.title,
      assignedChair: st.assignedChair,
      chairStationName: st.chairStationName || `Chair 0${st.assignedChair}`,
      ratingAverage: 4.9,
      totalReviews: 128,
      isAvailableToday: true,
    }));

    return NextResponse.json({
      store: {
        id: store.id,
        tenantId: store.tenantId,
        tenantName: store.tenant.name,
        branchName: store.name,
        slug: store.slug,
        locality: store.locality,
        address: store.address,
        phone: store.phone,
        openingTime: store.openingTime,
        closingTime: store.closingTime,
        totalStylingChairs: store.totalStylingChairs,
        isPublished: store.isPublished,
      },
      services: storeServices.map((srv) => ({
        id: srv.id, // Real UUID of service
        title: srv.title,
        category: srv.category || 'Styling',
        description: srv.description || '',
        durationMinutes: srv.durationMinutes,
        bufferMinutes: srv.bufferMinutes,
        price: Number(srv.price),
      })),
      stylists,
    });
  } catch (error) {
    console.error('Error fetching store details:', error);
    return NextResponse.json({ error: 'Failed to fetch store details' }, { status: 500 });
  }
}

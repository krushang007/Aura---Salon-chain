export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { stores, services, staffProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locality = searchParams.get('locality');

    // Only return stores that are active and published
    const allStores = await db.query.stores.findMany({
      where: and(eq(stores.isActive, true), eq(stores.isPublished, true)),
      with: {
        tenant: true,
        services: {
          where: eq(services.isActive, true),
        },
        staff: {
          where: eq(staffProfiles.isActive, true),
        },
      },
    });

    const filtered = allStores
      .filter((s) => !locality || s.locality.toLowerCase() === locality.toLowerCase())
      .map((s) => ({
        id: s.id,
        tenantName: s.tenant.name,
        branchName: s.name,
        city: s.city,
        locality: s.locality,
        address: s.address,
        phone: s.phone,
        openingTime: s.openingTime,
        closingTime: s.closingTime,
        totalStylingChairs: s.totalStylingChairs,
        ratingAverage: 4.9,
        totalReviews: 124,
        totalServices: s.services.length,
        totalStylists: s.staff.length,
        featuredService: s.services[0]
          ? {
              id: s.services[0].id,
              title: s.services[0].title,
              durationMinutes: s.services[0].durationMinutes,
              price: Number(s.services[0].price),
            }
          : undefined,
      }));

    return NextResponse.json({ stores: filtered });
  } catch (error) {
    console.error('Error fetching salons:', error);
    return NextResponse.json({ error: 'Failed to fetch salons' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { stores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'TENANT_ADMIN' || !admin.tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const tenantStores = await db.query.stores.findMany({
      where: eq(stores.tenantId, admin.tenantId),
      orderBy: (stores, { desc }) => [desc(stores.createdAt)],
    });

    return NextResponse.json({ stores: tenantStores });
  } catch (error) {
    console.error('Error fetching admin outlets:', error);
    return NextResponse.json({ error: 'Failed to retrieve outlets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'TENANT_ADMIN' || !admin.tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { branchName, locality, address, phone, totalStylingChairs, openingTime, closingTime } = body;

    if (!branchName || !locality || !address || !phone) {
      return NextResponse.json(
        { error: 'Branch name, locality, address, and phone number are required.' },
        { status: 400 }
      );
    }

    const baseSlug = branchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newStore] = await db.insert(stores).values({
      tenantId: admin.tenantId,
      name: branchName.trim(),
      slug: uniqueSlug,
      city: 'Surat',
      locality: locality.trim(),
      address: address.trim(),
      phone: phone.trim(),
      openingTime: openingTime || '09:00:00',
      closingTime: closingTime || '21:00:00',
      totalStylingChairs: Number(totalStylingChairs) || 5,
      isActive: true,
      isPublished: true,
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'New salon outlet created and published successfully.',
      store: newStore,
    });
  } catch (error) {
    console.error('Error creating outlet:', error);
    return NextResponse.json({ error: 'Failed to create salon outlet' }, { status: 500 });
  }
}

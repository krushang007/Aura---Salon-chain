import { NextResponse } from 'next/server';
import { db } from '@/db';
import { stores, services, staffProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'TENANT_ADMIN' || !admin.tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const tenantStores = await db.query.stores.findMany({
      where: eq(stores.tenantId, admin.tenantId),
      with: {
        services: {
          where: eq(services.isActive, true),
        },
        staff: {
          where: eq(staffProfiles.isActive, true),
        },
      },
      orderBy: (stores, { desc }) => [desc(stores.createdAt)],
    });

    const formatted = tenantStores.map((st) => ({
      id: st.id,
      name: st.name,
      slug: st.slug,
      city: st.city,
      locality: st.locality,
      address: st.address,
      phone: st.phone,
      openingTime: st.openingTime,
      closingTime: st.closingTime,
      totalStylingChairs: st.totalStylingChairs,
      isActive: st.isActive,
      isPublished: st.isPublished,
      servicesCount: st.services.length,
      staffCount: st.staff.length,
    }));

    return NextResponse.json({ stores: formatted });
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
    const { branchName, locality, address, phone, totalStylingChairs, openingTime, closingTime, autoSeedCatalog = true } = body;

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

    // Auto-seed standard service catalog so store is immediately active & bookable
    if (autoSeedCatalog) {
      const standardServices = [
        { title: 'Signature Precision Haircut & Styling', category: 'HAIRCUT', durationMinutes: 45, bufferMinutes: 15, price: '850.00', description: 'Tailored consultation, precision shear architecture, wash and styling finish.' },
        { title: 'Classic Hot Towel Shave & Beard Sculpt', category: 'SHAVE', durationMinutes: 30, bufferMinutes: 10, price: '450.00', description: 'Pre-shave essential oils, multi-pass straight razor finish, cold towel toner.' },
        { title: 'Balayage & Hair Gloss Treatment', category: 'COLOR', durationMinutes: 90, bufferMinutes: 15, price: '2800.00', description: 'Sun-kissed hand-painted dimension, ammonia-free gloss and fiber seal.' },
        { title: 'Botanical Scalp & Hair Spa', category: 'SPA', durationMinutes: 60, bufferMinutes: 15, price: '1500.00', description: 'Aromatherapy scalp massage, deep hydration masque, thermal steam infuse.' },
      ];

      await db.insert(services).values(
        standardServices.map((s) => ({
          tenantId: admin.tenantId!,
          storeId: newStore.id,
          title: s.title,
          category: s.category as any,
          durationMinutes: s.durationMinutes,
          bufferMinutes: s.bufferMinutes,
          price: s.price,
          description: s.description,
          isActive: true,
        }))
      );

      // Auto-assign admin as styling master chair 01
      await db.insert(staffProfiles).values({
        tenantId: admin.tenantId!,
        userId: admin.id,
        currentStoreId: newStore.id,
        title: 'Master Stylist',
        assignedChair: 1,
        chairStationName: 'Chair 01',
        bio: 'Salon Lead Stylist & Precision Architecture Expert',
        isActive: true,
      }).onConflictDoNothing();
    }

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

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'TENANT_ADMIN' || !admin.tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, branchName, locality, address, phone, totalStylingChairs, openingTime, closingTime, isActive, isPublished } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const existing = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.tenantId, admin.tenantId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Store not found or unauthorized' }, { status: 404 });
    }

    const [updated] = await db.update(stores).set({
      name: branchName !== undefined ? String(branchName).trim() : existing.name,
      locality: locality !== undefined ? String(locality).trim() : existing.locality,
      address: address !== undefined ? String(address).trim() : existing.address,
      phone: phone !== undefined ? String(phone).trim() : existing.phone,
      totalStylingChairs: totalStylingChairs !== undefined ? Number(totalStylingChairs) : existing.totalStylingChairs,
      openingTime: openingTime !== undefined ? openingTime : existing.openingTime,
      closingTime: closingTime !== undefined ? closingTime : existing.closingTime,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : existing.isPublished,
      updatedAt: new Date(),
    }).where(eq(stores.id, storeId)).returning();

    return NextResponse.json({
      success: true,
      store: updated,
      message: 'Salon outlet details updated successfully.',
    });
  } catch (error) {
    console.error('Error updating outlet:', error);
    return NextResponse.json({ error: 'Failed to update salon outlet' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { stores, services, staffProfiles } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import {
  validateRequestBody,
  adminOutletCreateSchema,
  adminOutletUpdateSchema,
} from '@/lib/validations';

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'TENANT_ADMIN' || !admin.tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const allStores = await db.query.stores.findMany({
      where: eq(stores.tenantId, admin.tenantId),
      orderBy: [desc(stores.createdAt)],
      with: {
        services: true,
        staff: true,
      },
    });

    const formatted = allStores.map((st) => ({
      id: st.id,
      name: st.name,
      slug: st.slug,
      locality: st.locality,
      address: st.address,
      phone: st.phone,
      totalStylingChairs: st.totalStylingChairs,
      openingTime: st.openingTime,
      closingTime: st.closingTime,
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

    const validation = await validateRequestBody(request, adminOutletCreateSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const {
      branchName,
      locality,
      address,
      phone,
      totalStylingChairs,
      openingTime,
      closingTime,
      autoSeedCatalog,
    } = validation.data;

    const baseSlug = branchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    const [newStore] = await db.insert(stores).values({
      tenantId: admin.tenantId,
      name: branchName,
      slug: uniqueSlug,
      city: 'Surat',
      locality,
      address,
      phone,
      openingTime,
      closingTime,
      totalStylingChairs,
      isActive: true,
      isPublished: true,
    }).returning();

    type ServiceCategory = typeof services.$inferSelect['category'];

    // Auto-seed standard service catalog so store is immediately active & bookable
    if (autoSeedCatalog) {
      const standardServices: {
        title: string;
        category: ServiceCategory;
        durationMinutes: number;
        bufferMinutes: number;
        price: string;
        description: string;
      }[] = [
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
          category: s.category,
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

    const validation = await validateRequestBody(request, adminOutletUpdateSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const {
      storeId,
      branchName,
      locality,
      address,
      phone,
      totalStylingChairs,
      openingTime,
      closingTime,
      isActive,
      isPublished,
    } = validation.data;

    const existing = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.tenantId, admin.tenantId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Store not found or unauthorized' }, { status: 404 });
    }

    const [updated] = await db.update(stores).set({
      name: branchName !== undefined ? branchName : existing.name,
      locality: locality !== undefined ? locality : existing.locality,
      address: address !== undefined ? address : existing.address,
      phone: phone !== undefined ? phone : existing.phone,
      totalStylingChairs: totalStylingChairs !== undefined ? totalStylingChairs : existing.totalStylingChairs,
      openingTime: openingTime !== undefined ? openingTime : existing.openingTime,
      closingTime: closingTime !== undefined ? closingTime : existing.closingTime,
      isActive: isActive !== undefined ? isActive : existing.isActive,
      isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
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

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { validateRequestBody, cloneServicesSchema } from '@/lib/validations';

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

    const validation = await validateRequestBody(request, cloneServicesSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { sourceStoreId, targetStoreId } = validation.data;

    if (sourceStoreId === targetStoreId) {
      return NextResponse.json({ error: 'Source and target branches cannot be the same' }, { status: 400 });
    }

    type ServiceCategory = typeof services.$inferSelect['category'];

    let servicesToClone: {
      category: ServiceCategory;
      title: string;
      description: string | null;
      durationMinutes: number;
      bufferMinutes: number;
      price: string;
    }[] = [];

    if (sourceStoreId === 'master-catalog') {
      servicesToClone = [
        { title: 'Signature Precision Haircut & Styling', category: 'HAIRCUT', durationMinutes: 45, bufferMinutes: 15, price: '850.00', description: 'Tailored consultation, precision shear architecture, wash and styling finish.' },
        { title: 'Classic Hot Towel Shave & Beard Sculpt', category: 'SHAVE', durationMinutes: 30, bufferMinutes: 10, price: '450.00', description: 'Pre-shave essential oils, multi-pass straight razor finish, cold towel toner.' },
        { title: 'Balayage & Hair Gloss Treatment', category: 'COLOR', durationMinutes: 90, bufferMinutes: 15, price: '2800.00', description: 'Sun-kissed hand-painted dimension, ammonia-free gloss and fiber seal.' },
        { title: 'Botanical Scalp & Hair Spa', category: 'SPA', durationMinutes: 60, bufferMinutes: 15, price: '1500.00', description: 'Aromatherapy scalp massage, deep hydration masque, thermal steam infuse.' },
      ];
    } else {
      const sourceServices = await db.query.services.findMany({
        where: and(eq(services.storeId, sourceStoreId), eq(services.isActive, true)),
      });

      if (sourceServices.length === 0) {
        return NextResponse.json({ error: 'No active services found in source branch' }, { status: 400 });
      }

      servicesToClone = sourceServices.map((s) => ({
        category: s.category,
        title: s.title,
        description: s.description,
        durationMinutes: s.durationMinutes,
        bufferMinutes: s.bufferMinutes,
        price: s.price,
      }));
    }

    const clonedEntries = servicesToClone.map((s) => ({
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

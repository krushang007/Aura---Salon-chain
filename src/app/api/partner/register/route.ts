export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { tenants, stores, users, services, staffProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signSession, getSessionCookieName } from '@/lib/auth';
import { validateRequestBody, partnerRegisterSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const validation = await validateRequestBody(request, partnerRegisterSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { salonName, ownerName, email, password, locality, address, phone, totalStylingChairs } = validation.data;

    // 1. Check existing user
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 400 }
      );
    }

    // 2. Generate slug with collision-resistant UUID
    const baseSlug = salonName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

    const defaultPasswordHash = hashPassword(password);

    type ServiceCategory = typeof services.$inferSelect['category'];

    // 3. Create Tenant, Store & Admin User in Transaction
    const result = await db.transaction(async (tx) => {
      const [tenant] = await tx.insert(tenants).values({
        name: salonName,
        slug: uniqueSlug,
        supportEmail: email,
        supportPhone: phone || '+91 98250 12345',
        isActive: true,
      }).returning();

      const [adminUser] = await tx.insert(users).values({
        tenantId: tenant.id,
        email,
        fullName: ownerName,
        passwordHash: defaultPasswordHash,
        role: 'TENANT_ADMIN',
        phone: phone || null,
        isActive: true,
      }).returning();

      const [store] = await tx.insert(stores).values({
        tenantId: tenant.id,
        name: `${salonName} — ${locality}`,
        slug: `${uniqueSlug}-main`,
        locality,
        address: address || `${locality}, Surat, Gujarat`,
        phone: phone || '+91 98250 12345',
        totalStylingChairs: totalStylingChairs || 5,
        openingTime: '09:00:00',
        closingTime: '21:00:00',
        isActive: true,
        isPublished: true,
      }).returning();

      const standardServices: {
        title: string;
        category: ServiceCategory;
        durationMinutes: number;
        bufferMinutes: number;
        price: string;
        description: string;
      }[] = [
        { title: 'Signature Haircut & Styling', category: 'HAIRCUT', durationMinutes: 45, bufferMinutes: 15, price: '650.00', description: 'Consultation, wash, signature cut and blowdry finishing.' },
        { title: 'Beard Trim & Hot Towel Finish', category: 'SHAVE', durationMinutes: 30, bufferMinutes: 10, price: '350.00', description: 'Beard sculpting, razor outline and soothing hot towel wrap.' },
        { title: 'Botanical Scalp & Hair Spa', category: 'SPA', durationMinutes: 60, bufferMinutes: 15, price: '1500.00', description: 'Aromatherapy scalp massage, deep hydration masque, thermal steam infuse.' },
      ];

      await tx.insert(services).values(
        standardServices.map((s) => ({
          tenantId: tenant.id,
          storeId: store.id,
          title: s.title,
          category: s.category,
          durationMinutes: s.durationMinutes,
          bufferMinutes: s.bufferMinutes,
          price: s.price,
          description: s.description,
          isActive: true,
        }))
      );

      // Auto-provision initial master stylist chair
      await tx.insert(staffProfiles).values({
        tenantId: tenant.id,
        userId: adminUser.id,
        currentStoreId: store.id,
        title: 'Master Stylist',
        assignedChair: 1,
        chairStationName: 'Chair 01',
        bio: 'Salon Lead Stylist & Precision Cut Expert',
        isActive: true,
      });

      return { tenant, adminUser, store };
    });

    // 4. Create Session
    const sessionToken = signSession({
      id: result.adminUser.id,
      email: result.adminUser.email,
      fullName: result.adminUser.fullName,
      role: result.adminUser.role,
      tenantId: result.tenant.id,
      storeId: result.store.id,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Salon partner onboarding complete!',
      redirectUrl: '/admin',
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Partner registration error:', error);
    return NextResponse.json({ error: 'Failed to onboard salon partner' }, { status: 500 });
  }
}

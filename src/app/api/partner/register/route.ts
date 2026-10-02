export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, stores, users, services, staffProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signSession, getSessionCookieName } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { salonName, ownerName, email, password, locality, address, phone, totalStylingChairs } = body;

    if (!salonName || !ownerName || !email || !password || !locality) {
      return NextResponse.json(
        { error: 'Salon name, owner name, email, password, and locality are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check existing user
    const existing = await db.query.users.findFirst({
      where: eq(users.email, trimmedEmail),
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 400 }
      );
    }

    // 2. Generate slug
    const baseSlug = salonName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const defaultPasswordHash = hashPassword(password);

    // 3. Create Tenant, Store & Admin User in Transaction
    const result = await db.transaction(async (tx) => {
      const [tenant] = await tx.insert(tenants).values({
        name: salonName.trim(),
        slug: uniqueSlug,
        supportEmail: trimmedEmail,
        supportPhone: phone || '+91 261 489 0000',
        isActive: true,
      }).returning();

      const [adminUser] = await tx.insert(users).values({
        tenantId: tenant.id,
        email: trimmedEmail,
        fullName: ownerName.trim(),
        phone: phone || null,
        passwordHash: defaultPasswordHash,
        role: 'TENANT_ADMIN',
        isActive: true,
      }).returning();

      const [store] = await tx.insert(stores).values({
        tenantId: tenant.id,
        name: `${salonName.trim()} — ${locality} Branch`,
        slug: `${baseSlug}-${locality.toLowerCase()}`,
        city: 'Surat',
        locality: locality.trim(),
        address: address?.trim() || `Prime Location, ${locality}, Surat`,
        phone: phone?.trim() || '+91 261 489 0000',
        openingTime: '09:00:00',
        closingTime: '21:00:00',
        totalStylingChairs: Number(totalStylingChairs) || 5,
        isActive: true,
        isPublished: true, // Auto-published upon onboarding
      }).returning();

      // Auto-provision initial standard luxury services
      const standardServices = [
        { title: 'Signature Precision Haircut & Styling', category: 'HAIRCUT', durationMinutes: 45, bufferMinutes: 15, price: '850.00', description: 'Tailored consultation, precision shear architecture, wash and styling finish.' },
        { title: 'Classic Hot Towel Shave & Beard Sculpt', category: 'SHAVE', durationMinutes: 30, bufferMinutes: 10, price: '450.00', description: 'Pre-shave essential oils, multi-pass straight razor finish, cold towel toner.' },
        { title: 'Balayage & Hair Gloss Treatment', category: 'COLOR', durationMinutes: 90, bufferMinutes: 15, price: '2800.00', description: 'Sun-kissed hand-painted dimension, ammonia-free gloss and fiber seal.' },
        { title: 'Botanical Scalp & Hair Spa', category: 'SPA', durationMinutes: 60, bufferMinutes: 15, price: '1500.00', description: 'Aromatherapy scalp massage, deep hydration masque, thermal steam infuse.' },
      ];

      await tx.insert(services).values(
        standardServices.map((s) => ({
          tenantId: tenant.id,
          storeId: store.id,
          title: s.title,
          category: s.category as any,
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

    cookies().set(getSessionCookieName(), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      message: 'Salon partner onboarding complete!',
      redirectUrl: '/admin',
    });
  } catch (error) {
    console.error('Partner registration error:', error);
    return NextResponse.json({ error: 'Failed to onboard salon partner' }, { status: 500 });
  }
}

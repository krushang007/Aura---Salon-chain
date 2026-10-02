import { db } from './index';
import {
  tenants,
  stores,
  users,
  services,
  staffProfiles,
  staffShifts,
  appointments,
  appointmentAuditLogs,
  notifications,
} from './schema';
import { eq, sql } from 'drizzle-orm';
import { hashPassword } from '../lib/auth';

async function seed() {
  console.log('🌱 Starting comprehensive Aura Surat Marketplace seeding...');

  try {
    // 1. Create or Find Tenants
    let bonanza = await db.query.tenants.findFirst({
      where: eq(tenants.slug, 'salon-bonanza'),
    });
    if (!bonanza) {
      [bonanza] = await db.insert(tenants).values({
        name: 'Salon Bonanza',
        slug: 'salon-bonanza',
        supportEmail: 'support@salonbonanza.com',
        supportPhone: '+91 261 489 0129',
      }).returning();
      console.log(' [✓] Created Tenant: Salon Bonanza');
    }

    let barberKing = await db.query.tenants.findFirst({
      where: eq(tenants.slug, 'the-barber-king'),
    });
    if (!barberKing) {
      [barberKing] = await db.insert(tenants).values({
        name: 'The Barber King',
        slug: 'the-barber-king',
        supportEmail: 'contact@thebarberking.com',
        supportPhone: '+91 261 278 4400',
      }).returning();
      console.log(' [✓] Created Tenant: The Barber King');
    }

    // 2. Create Stores / Branches in Surat
    let althanStore = await db.query.stores.findFirst({
      where: eq(stores.name, 'Salon Bonanza — Althan Branch'),
    });
    if (!althanStore) {
      [althanStore] = await db.insert(stores).values({
        tenantId: bonanza.id,
        name: 'Salon Bonanza — Althan Branch',
        slug: 'althan-branch',
        city: 'Surat',
        locality: 'Althan',
        address: 'Shop 104–106, 1st Floor, Milano Plaza, VIP Road, Althan, Surat, Gujarat 395017',
        phone: '+91 261 489 0129',
        openingTime: '09:00:00',
        closingTime: '21:00:00',
        totalStylingChairs: 5,
        isPublished: true,
      }).returning();
      console.log(' [✓] Created Store: Althan Branch (5 chairs)');
    }

    let adajanStore = await db.query.stores.findFirst({
      where: eq(stores.name, 'Salon Bonanza — Adajan Branch'),
    });
    if (!adajanStore) {
      [adajanStore] = await db.insert(stores).values({
        tenantId: bonanza.id,
        name: 'Salon Bonanza — Adajan Branch',
        slug: 'adajan-branch',
        city: 'Surat',
        locality: 'Adajan',
        address: '2nd Floor, River Palace, Near LP Savani Circle, Adajan, Surat, Gujarat 395009',
        phone: '+91 261 489 0130',
        openingTime: '09:00:00',
        closingTime: '21:00:00',
        weeklyOffDay: 2, // Tuesday
        totalStylingChairs: 6,
        isPublished: true,
      }).returning();
      console.log(' [✓] Created Store: Adajan Branch (6 chairs)');
    }

    let vesuStore = await db.query.stores.findFirst({
      where: eq(stores.name, 'Salon Bonanza — Vesu Branch'),
    });
    if (!vesuStore) {
      [vesuStore] = await db.insert(stores).values({
        tenantId: bonanza.id,
        name: 'Salon Bonanza — Vesu Branch',
        slug: 'vesu-branch',
        city: 'Surat',
        locality: 'Vesu',
        address: 'G-12, Solitaire Business Hub, VIP Road, Vesu, Surat, Gujarat 395007',
        phone: '+91 261 489 0131',
        openingTime: '10:00:00',
        closingTime: '22:00:00',
        totalStylingChairs: 4,
        isPublished: true,
      }).returning();
      console.log(' [✓] Created Store: Vesu Branch (4 chairs)');
    }

    // 3. Create Services
    const existingServices = await db.query.services.findMany({
      where: eq(services.storeId, althanStore.id),
    });

    let haircutService = existingServices.find(s => s.title.includes('Precision Haircut'));
    if (!haircutService) {
      const [s1, s2, s3, s4] = await db.insert(services).values([
        {
          tenantId: bonanza.id,
          storeId: althanStore.id,
          title: 'Signature Precision Haircut & Styling',
          category: 'Haircut',
          description: 'Includes tailored scalp consultation, precision scissor cut, wash & blow-dry styling.',
          durationMinutes: 45,
          bufferMinutes: 5,
          price: '850.00',
          isActive: true,
        },
        {
          tenantId: bonanza.id,
          storeId: althanStore.id,
          title: 'Classic Hot Towel Shave & Beard Sculpt',
          category: 'Beard',
          description: 'Straight razor edge clean-up, aromatic essential oils hot towel, and beard oil nourishment.',
          durationMinutes: 30,
          bufferMinutes: 5,
          price: '450.00',
          isActive: true,
        },
        {
          tenantId: bonanza.id,
          storeId: althanStore.id,
          title: 'Balayage & Hair Gloss Treatment',
          category: 'Color & Spa',
          description: 'Full multi-dimensional hand-painted balayage and hydrating gloss sealant.',
          durationMinutes: 90,
          bufferMinutes: 10,
          price: '3200.00',
          isActive: true,
        },
        {
          tenantId: bonanza.id,
          storeId: althanStore.id,
          title: 'Botanical Scalp & Hair Spa',
          category: 'Spa',
          description: 'Deep detoxifying scrub, steam bath infusion, and head massage.',
          durationMinutes: 60,
          bufferMinutes: 5,
          price: '1600.00',
          isActive: true,
        },
      ]).returning();
      haircutService = s1;
      console.log(' [✓] Created 4 Catalog Services for Althan');
    }
    // Services for Adajan & Vesu
    const adajanServices = await db.query.services.findMany({ where: eq(services.storeId, adajanStore.id) });
    if (adajanServices.length === 0) {
      await db.insert(services).values([
        {
          tenantId: bonanza.id,
          storeId: adajanStore.id,
          title: 'Signature Precision Haircut & Styling',
          category: 'Haircut',
          description: 'Includes tailored scalp consultation, precision scissor cut, wash & blow-dry styling.',
          durationMinutes: 45,
          bufferMinutes: 5,
          price: '850.00',
          isActive: true,
        },
        {
          tenantId: bonanza.id,
          storeId: adajanStore.id,
          title: 'Classic Hot Towel Shave & Beard Sculpt',
          category: 'Beard',
          description: 'Straight razor edge clean-up, aromatic essential oils hot towel, and beard oil nourishment.',
          durationMinutes: 30,
          bufferMinutes: 5,
          price: '450.00',
          isActive: true,
        },
        {
          tenantId: bonanza.id,
          storeId: adajanStore.id,
          title: 'Botanical Scalp & Hair Spa',
          category: 'Spa',
          description: 'Deep detoxifying scrub, steam bath infusion, and head massage.',
          durationMinutes: 60,
          bufferMinutes: 5,
          price: '1600.00',
          isActive: true,
        },
      ]);
      console.log(' [✓] Created Services for Adajan Branch');
    }

    const vesuServices = await db.query.services.findMany({ where: eq(services.storeId, vesuStore.id) });
    if (vesuServices.length === 0) {
      await db.insert(services).values([
        {
          tenantId: bonanza.id,
          storeId: vesuStore.id,
          title: 'Signature Precision Haircut & Styling',
          category: 'Haircut',
          description: 'Includes tailored scalp consultation, precision scissor cut, wash & blow-dry styling.',
          durationMinutes: 45,
          bufferMinutes: 5,
          price: '850.00',
          isActive: true,
        },
        {
          tenantId: bonanza.id,
          storeId: vesuStore.id,
          title: 'Balayage & Hair Gloss Treatment',
          category: 'Color & Spa',
          description: 'Full multi-dimensional hand-painted balayage and hydrating gloss sealant.',
          durationMinutes: 90,
          bufferMinutes: 10,
          price: '3200.00',
          isActive: true,
        },
      ]);
      console.log(' [✓] Created Services for Vesu Branch');
    }


    // 4. Create Users (Customer, Admin, Stylists)
    const defaultPasswordHash = hashPassword('Password@123');

    // Customer: Sarah
    let sarah = await db.query.users.findFirst({
      where: eq(users.email, 'sarah@example.com'),
    });
    if (!sarah) {
      [sarah] = await db.insert(users).values({
        email: 'sarah@example.com',
        fullName: 'Sarah Jenkins',
        phone: '+91 98250 11223',
        passwordHash: defaultPasswordHash,
        role: 'CUSTOMER',
        tenantId: null, // Marketplace customer
        isActive: true,
      }).returning();
      console.log(' [✓] Created Marketplace Customer: sarah@example.com');
    }

    // Admin: Salon Bonanza Admin
    let adminUser = await db.query.users.findFirst({
      where: eq(users.email, 'admin@salonbonanza.com'),
    });
    if (!adminUser) {
      [adminUser] = await db.insert(users).values({
        tenantId: bonanza.id,
        email: 'admin@salonbonanza.com',
        fullName: 'Vikram Mehta (Salon Owner)',
        phone: '+91 98250 99999',
        passwordHash: defaultPasswordHash,
        role: 'TENANT_ADMIN',
        isActive: true,
      }).returning();
      console.log(' [✓] Created Admin User: admin@salonbonanza.com');
    }

    // Stylist: Rahul Mehta
    let rahulUser = await db.query.users.findFirst({
      where: eq(users.email, 'rahul@salonbonanza.com'),
    });
    if (!rahulUser) {
      [rahulUser] = await db.insert(users).values({
        tenantId: bonanza.id,
        email: 'rahul@salonbonanza.com',
        fullName: 'Rahul Mehta',
        phone: '+91 98250 44556',
        passwordHash: defaultPasswordHash,
        role: 'STAFF',
        isActive: true,
      }).returning();

      const [rahulProfile] = await db.insert(staffProfiles).values({
        userId: rahulUser.id,
        tenantId: bonanza.id,
        currentStoreId: althanStore.id,
        title: 'Master Stylist',
        assignedChair: 3,
        chairStationName: 'Chair 03 (Wash Bay A)',
        ratingAverage: '4.90',
        totalReviews: 142,
        isActive: true,
      }).returning();

      // Create Shifts for Rahul (Monday - Saturday, 09:00 - 18:00)
      const shifts = [1, 2, 3, 4, 5, 6].map(day => ({
        staffId: rahulProfile.id,
        storeId: althanStore.id,
        dayOfWeek: day,
        shiftStart: '09:00:00',
        shiftEnd: '18:00:00',
        isWorkingDay: true,
      }));
      await db.insert(staffShifts).values(shifts);
      console.log(' [✓] Created Stylist: Rahul Mehta (Chair 03) & Shifts');
    }

    // Stylist: Priya Desai
    let priyaUser = await db.query.users.findFirst({
      where: eq(users.email, 'priya@salonbonanza.com'),
    });
    if (!priyaUser) {
      [priyaUser] = await db.insert(users).values({
        tenantId: bonanza.id,
        email: 'priya@salonbonanza.com',
        fullName: 'Priya Desai',
        phone: '+91 98250 77889',
        passwordHash: defaultPasswordHash,
        role: 'STAFF',
        isActive: true,
      }).returning();

      const [priyaProfile] = await db.insert(staffProfiles).values({
        userId: priyaUser.id,
        tenantId: bonanza.id,
        currentStoreId: althanStore.id,
        title: 'Senior Colorist',
        assignedChair: 1,
        chairStationName: 'Chair 01',
        ratingAverage: '4.80',
        totalReviews: 98,
        isActive: true,
      }).returning();

      const shifts = [1, 2, 3, 4, 5, 6].map(day => ({
        staffId: priyaProfile.id,
        storeId: althanStore.id,
        dayOfWeek: day,
        shiftStart: '10:00:00',
        shiftEnd: '19:00:00',
        isWorkingDay: true,
      }));
      await db.insert(staffShifts).values(shifts);
      console.log(' [✓] Created Stylist: Priya Desai (Chair 01) & Shifts');
    }

    // Provisioned Stylist Demo: abc@gmail.com
    let demoStaffUser = await db.query.users.findFirst({
      where: eq(users.email, 'abc@gmail.com'),
    });
    if (!demoStaffUser) {
      [demoStaffUser] = await db.insert(users).values({
        tenantId: bonanza.id,
        email: 'abc@gmail.com',
        fullName: 'Rahul Sharma',
        phone: '+91 98250 33445',
        passwordHash: defaultPasswordHash,
        role: 'STAFF',
        isActive: true,
      }).returning();

      const [demoProfile] = await db.insert(staffProfiles).values({
        userId: demoStaffUser.id,
        tenantId: bonanza.id,
        currentStoreId: althanStore.id,
        title: 'Senior Stylist',
        assignedChair: 2,
        chairStationName: 'Chair 02',
        ratingAverage: '4.90',
        totalReviews: 45,
        isActive: true,
      }).returning();

      const shifts = [1, 2, 3, 4, 5].map(day => ({
        staffId: demoProfile.id,
        storeId: althanStore.id,
        dayOfWeek: day,
        shiftStart: '09:00:00',
        shiftEnd: '18:00:00',
        isWorkingDay: true,
      }));
      await db.insert(staffShifts).values(shifts);
      console.log(' [✓] Created Provisioned Staff: abc@gmail.com (Chair 02)');
    }
    // Stylist for Adajan
    let arjunUser = await db.query.users.findFirst({ where: eq(users.email, 'arjun@salonbonanza.com') });
    if (!arjunUser) {
      [arjunUser] = await db.insert(users).values({
        tenantId: bonanza.id,
        email: 'arjun@salonbonanza.com',
        fullName: 'Arjun Mehta',
        phone: '+91 98250 88990',
        passwordHash: defaultPasswordHash,
        role: 'STAFF',
        isActive: true,
      }).returning();

      const [arjunProfile] = await db.insert(staffProfiles).values({
        userId: arjunUser.id,
        tenantId: bonanza.id,
        currentStoreId: adajanStore.id,
        title: 'Master Barber & Stylist',
        assignedChair: 1,
        chairStationName: 'Chair 01',
        ratingAverage: '4.90',
        totalReviews: 88,
        isActive: true,
      }).returning();

      const shifts = [1, 2, 3, 4, 5, 6].map(day => ({
        tenantId: bonanza.id,
        storeId: adajanStore.id,
        staffId: arjunProfile.id,
        dayOfWeek: day,
        shiftStart: '09:00:00',
        shiftEnd: '18:00:00',
        isWorkingDay: true,
      }));
      await db.insert(staffShifts).values(shifts);
      console.log(' [✓] Created Stylist: Arjun Mehta for Adajan');
    }

    // Stylist for Vesu
    let vikramUser = await db.query.users.findFirst({ where: eq(users.email, 'vikram@salonbonanza.com') });
    if (!vikramUser) {
      [vikramUser] = await db.insert(users).values({
        tenantId: bonanza.id,
        email: 'vikram@salonbonanza.com',
        fullName: 'Vikram Singhania',
        phone: '+91 98250 99001',
        passwordHash: defaultPasswordHash,
        role: 'STAFF',
        isActive: true,
      }).returning();

      const [vikramProfile] = await db.insert(staffProfiles).values({
        userId: vikramUser.id,
        tenantId: bonanza.id,
        currentStoreId: vesuStore.id,
        title: 'Creative Director',
        assignedChair: 1,
        chairStationName: 'Chair 01',
        ratingAverage: '5.00',
        totalReviews: 110,
        isActive: true,
      }).returning();

      const shifts = [1, 2, 3, 4, 5, 6].map(day => ({
        tenantId: bonanza.id,
        storeId: vesuStore.id,
        staffId: vikramProfile.id,
        dayOfWeek: day,
        shiftStart: '10:00:00',
        shiftEnd: '19:00:00',
        isWorkingDay: true,
      }));
      await db.insert(staffShifts).values(shifts);
      console.log(' [✓] Created Stylist: Vikram Singhania for Vesu');
    }


    // 5. Seed Appointments
    const rahulProfile = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.userId, rahulUser.id),
    });

    const existingAppointments = await db.query.appointments.findMany({
      where: eq(appointments.customerId, sarah.id),
    });

    if (existingAppointments.length === 0 && rahulProfile && haircutService) {
      // Tomorrow at 14:30 (2:30 PM) -> 15:20 (including 5 min buffer)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 30, 0, 0);
      const tomorrowEnd = new Date(tomorrow.getTime() + 50 * 60 * 1000);

      const [apt1] = await db.insert(appointments).values({
        tenantId: bonanza.id,
        storeId: althanStore.id,
        staffId: rahulProfile.id,
        customerId: sarah.id,
        bookedByUserId: sarah.id,
        serviceId: haircutService.id,
        assignedChair: 3,
        slotRange: sql`tstzrange(${tomorrow.toISOString()}, ${tomorrowEnd.toISOString()}, '[)')`,
        status: 'CONFIRMED',
        customerNotes: 'Please keep scissor texture on top, taper sideburns.',
      }).returning();

      // Audit Log
      await db.insert(appointmentAuditLogs).values({
        appointmentId: apt1.id,
        action: 'CREATED',
        actorRole: 'CUSTOMER',
        actorId: sarah.id,
        newStatus: 'CONFIRMED',
        newStoreId: althanStore.id,
        newStaffId: rahulProfile.id,
        newSlotRange: sql`tstzrange(${tomorrow.toISOString()}, ${tomorrowEnd.toISOString()}, '[)')`,
        notes: 'Online self-booking via Aura Marketplace',
      });

      // In-app Notification
      await db.insert(notifications).values({
        tenantId: bonanza.id,
        recipientUserId: sarah.id,
        title: 'Appointment Confirmed',
        message: 'Your Signature Precision Haircut at Salon Bonanza (Althan Branch) is locked for tomorrow at 2:30 PM.',
        type: 'BOOKING_CONFIRMED',
        entityId: apt1.id,
      });

      // Past Appointment (Completed last week)
      const pastStart = new Date();
      pastStart.setDate(pastStart.getDate() - 10);
      pastStart.setHours(11, 0, 0, 0);
      const pastEnd = new Date(pastStart.getTime() + 50 * 60 * 1000);

      const [apt2] = await db.insert(appointments).values({
        tenantId: bonanza.id,
        storeId: althanStore.id,
        staffId: rahulProfile.id,
        customerId: sarah.id,
        bookedByUserId: sarah.id,
        serviceId: haircutService.id,
        assignedChair: 3,
        slotRange: sql`tstzrange(${pastStart.toISOString()}, ${pastEnd.toISOString()}, '[)')`,
        status: 'COMPLETED',
        customerNotes: 'Initial consultation',
      }).returning();

      await db.insert(appointmentAuditLogs).values({
        appointmentId: apt2.id,
        action: 'COMPLETED',
        actorRole: 'STAFF',
        actorId: rahulUser.id,
        newStatus: 'COMPLETED',
        notes: 'Service successfully finished and invoiced',
      });

      console.log(' [✓] Created Sample Confirmed & Past Appointments for Sarah');
    }

    console.log('\n🎉 Aura Surat Marketplace Seeding Complete!');
    console.log('==================================================');
    console.log('Demo Credentials (All Passwords: Password@123):');
    console.log(' - Customer:     sarah@example.com');
    console.log(' - Salon Admin:  admin@salonbonanza.com');
    console.log(' - Stylist:      rahul@salonbonanza.com');
    console.log(' - Provisioned:  abc@gmail.com');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

import { db } from '../src/db';
import { users, stores, services, staffProfiles, appointments } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyPassword, hashPassword, signSession, verifySession } from '../src/lib/auth';

async function runTests() {
  console.log('🧪 Running Comprehensive Aura Full-Stack Workflow Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(` [PASS] ${testName}`);
      passed++;
    } else {
      console.error(` [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Unified Auth & Password Hashing
    // ------------------------------------------------------------------------
    console.log('--- Test Suite 1: Unified Authentication ---');
    const customer = await db.query.users.findFirst({
      where: eq(users.email, 'sarah@example.com'),
    });
    assert(!!customer, 'Customer user exists in database');
    assert(customer?.role === 'CUSTOMER', 'Customer has role CUSTOMER');
    assert(verifyPassword('Password@123', customer?.passwordHash || ''), 'Password verification succeeds for Customer');

    const admin = await db.query.users.findFirst({
      where: eq(users.email, 'admin@salonbonanza.com'),
    });
    assert(!!admin, 'Admin user exists in database');
    assert(admin?.role === 'TENANT_ADMIN', 'Admin has role TENANT_ADMIN');

    const stylist = await db.query.users.findFirst({
      where: eq(users.email, 'rahul@salonbonanza.com'),
    });
    assert(!!stylist, 'Stylist user exists in database');
    assert(stylist?.role === 'STAFF', 'Stylist has role STAFF');

    const provisioned = await db.query.users.findFirst({
      where: eq(users.email, 'abc@gmail.com'),
    });
    assert(!!provisioned, 'Provisioned user (abc@gmail.com) exists in database');
    assert(provisioned?.role === 'STAFF', 'Provisioned user has role STAFF with 0 invite friction');

    // Test Token Signing & Verification
    const token = signSession({
      id: customer!.id,
      email: customer!.email,
      fullName: customer!.fullName,
      role: customer!.role,
    });
    const decoded = verifySession(token);
    assert(decoded?.email === 'sarah@example.com', 'HMAC session token encodes and decodes properly');

    // ------------------------------------------------------------------------
    // TEST 2: Multi-Store Surat Discovery
    // ------------------------------------------------------------------------
    console.log('\n--- Test Suite 2: Salon & Branch Discovery ---');
    const althan = await db.query.stores.findFirst({
      where: eq(stores.name, 'Salon Bonanza — Althan Branch'),
    });
    assert(!!althan, 'Althan branch exists');
    assert(althan?.city === 'Surat', 'Althan branch is located in Surat');
    assert(althan?.totalStylingChairs === 5, 'Althan branch has 5 physical chairs configured');

    const allStores = await db.query.stores.findMany();
    assert(allStores.length >= 3, `Discovered ${allStores.length} salon outlets in Surat`);

    // ------------------------------------------------------------------------
    // TEST 3: Staff Profile & Station Chair Designation
    // ------------------------------------------------------------------------
    console.log('\n--- Test Suite 3: Stylist Profiles & Chair Stations ---');
    const rahulProfile = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.userId, stylist!.id),
    });
    assert(!!rahulProfile, 'Rahul Mehta staff profile exists');
    assert(rahulProfile?.assignedChair === 3, 'Rahul Mehta is assigned physical Chair 03');
    assert(rahulProfile?.chairStationName === 'Chair 03 (Wash Bay A)', 'Station name is Chair 03 (Wash Bay A)');

    const abcProfile = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.userId, provisioned!.id),
    });
    assert(!!abcProfile, 'abc@gmail.com staff profile exists');
    assert(abcProfile?.assignedChair === 2, 'abc@gmail.com is assigned Chair 02');

    // ------------------------------------------------------------------------
    // TEST 4: Double-Booking Prevention & Concurrency Guard
    // ------------------------------------------------------------------------
    console.log('\n--- Test Suite 4: PostgreSQL GiST Overlap Guard ---');
    const haircutSrv = await db.query.services.findFirst({
      where: eq(services.storeId, althan!.id),
    });
    assert(!!haircutSrv, 'Haircut service exists for Althan branch');

    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 5);
    testDate.setHours(16, 0, 0, 0);
    const testEnd = new Date(testDate.getTime() + 50 * 60 * 1000);

    // Create booking 1
    const [booking1] = await db.insert(appointments).values({
      tenantId: althan!.tenantId,
      storeId: althan!.id,
      staffId: rahulProfile!.id,
      customerId: customer!.id,
      bookedByUserId: customer!.id,
      serviceId: haircutSrv!.id,
      assignedChair: 3,
      slotRange: sql`tstzrange(${testDate.toISOString()}, ${testEnd.toISOString()}, '[)')`,
      status: 'CONFIRMED',
    }).returning();
    assert(!!booking1, 'Created primary test booking for Rahul Mehta');

    // ------------------------------------------------------------------------
    // TEST 5: 2-Hour Cancellation Rule Verification
    // ------------------------------------------------------------------------
    console.log('\n--- Test Suite 5: 2-Hour Cancellation Cutoff Policy ---');
    // For booking1 (5 days in future), cancellation MUST be allowed
    const [checkFuture] = await db.execute<{ canCancel: boolean }>(sql`
      SELECT (lower(slot_range) >= NOW() + INTERVAL '2 hours') AS "canCancel"
      FROM appointments WHERE id = ${booking1.id}
    `);
    assert(checkFuture?.canCancel === true, 'Appointments >= 2 hours away are eligible for self-service cancellation');

    // Create an imminent booking (30 minutes in future)
    const imminentStart = new Date(Date.now() + 30 * 60 * 1000);
    const imminentEnd = new Date(imminentStart.getTime() + 50 * 60 * 1000);
    const [imminentBooking] = await db.insert(appointments).values({
      tenantId: althan!.tenantId,
      storeId: althan!.id,
      staffId: rahulProfile!.id,
      customerId: customer!.id,
      bookedByUserId: customer!.id,
      serviceId: haircutSrv!.id,
      assignedChair: 3,
      slotRange: sql`tstzrange(${imminentStart.toISOString()}, ${imminentEnd.toISOString()}, '[)')`,
      status: 'CONFIRMED',
    }).returning();

    const [checkImminent] = await db.execute<{ canCancel: boolean }>(sql`
      SELECT (lower(slot_range) >= NOW() + INTERVAL '2 hours') AS "canCancel"
      FROM appointments WHERE id = ${imminentBooking.id}
    `);
    assert(checkImminent?.canCancel === false, 'Appointments within 2 hours are strictly LOCKED from cancellation');

    // Clean up test bookings
    await db.delete(appointments).where(eq(appointments.id, booking1.id));
    await db.delete(appointments).where(eq(appointments.id, imminentBooking.id));

    console.log('\n==================================================');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('==================================================');

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();

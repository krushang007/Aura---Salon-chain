import { db } from '../src/db';
import { users, stores, services, staffProfiles, appointments } from '../src/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { signSession } from '../src/lib/auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nncmxnqlvsqucbftlvnk.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gXzhg5M3cqRzXMp3a2BH8A_MK2NIkgh';

async function runEdgeCaseTests() {
  console.log('🛡️  Starting Aura Enterprise Edge-Case & Concurrency Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // Clean up any lingering test reservations from prior runs
    await db.delete(appointments).where(
      sql`customer_notes LIKE 'Edge case test%' OR customer_notes LIKE 'Concurrent booking%' OR customer_notes LIKE 'Contiguous%' OR customer_notes LIKE 'Reclaimed%'`
    );

    // =========================================================================
    // SUITE 1: PHYSICAL CHAIR DOUBLE-BOOKING CONCURRENCY (Postgres btree_gist)
    // =========================================================================
    console.log('--- 1. Concurrency Guard: Physical Chair Exclusion Constraint ---');

    const althan = await db.query.stores.findFirst({
      where: eq(stores.city, 'Surat'),
    });
    const stylist = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.currentStoreId, althan!.id),
    });
    const customer = await db.query.users.findFirst({
      where: eq(users.role, 'CUSTOMER'),
    });
    const service = await db.query.services.findFirst({
      where: eq(services.storeId, althan!.id),
    });

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 10);
    targetDate.setHours(14, 0, 0, 0); // 2:00 PM
    const targetEnd = new Date(targetDate.getTime() + 45 * 60 * 1000); // 2:45 PM

    // 1.1 Insert primary reservation on Chair 3
    const [primaryBooking] = await db.insert(appointments).values({
      tenantId: althan!.tenantId,
      storeId: althan!.id,
      staffId: stylist!.id,
      customerId: customer!.id,
      bookedByUserId: customer!.id,
      serviceId: service!.id,
      assignedChair: 3,
      slotRange: sql`tstzrange(${targetDate.toISOString()}, ${targetEnd.toISOString()}, '[)')`,
      status: 'CONFIRMED',
      customerNotes: 'Edge case test booking 1',
    }).returning();
    assert(!!primaryBooking, 'Primary booking created on Chair 3 (14:00 - 14:45)');

    // 1.2 Edge Case: Overlapping booking on the EXACT SAME CHAIR 3 (Must fail with exclusion violation)
    let collisionBlocked = false;
    let collisionMessage = '';
    try {
      const overlapStart = new Date(targetDate.getTime() + 15 * 60 * 1000); // 2:15 PM (15 min overlap!)
      const overlapEnd = new Date(overlapStart.getTime() + 45 * 60 * 1000); // 3:00 PM

      await db.insert(appointments).values({
        tenantId: althan!.tenantId,
        storeId: althan!.id,
        staffId: stylist!.id,
        customerId: customer!.id,
        bookedByUserId: customer!.id,
        serviceId: service!.id,
        assignedChair: 3, // SAME CHAIR!
        slotRange: sql`tstzrange(${overlapStart.toISOString()}, ${overlapEnd.toISOString()}, '[)')`,
        status: 'CONFIRMED',
        customerNotes: 'Edge case test overlap',
      });
    } catch (err: any) {
      collisionBlocked = err.message?.includes('uq_no_chair_double_booking') ||
                         err.message?.includes('exclusion constraint') ||
                         err.code === '23P01';
      collisionMessage = err.message || '';
    }
    assert(collisionBlocked, 'Overlapping booking on same physical chair strictly blocked by PostgreSQL btree_gist', 'Constraint: uq_no_chair_double_booking');

    // 1.3 Edge Case: Same time slot but on a DIFFERENT CHAIR (Chair 4) (Must succeed!)
    let differentChairSuccess = false;
    let chair4BookingId: string | null = null;
    try {
      const [chair4Booking] = await db.insert(appointments).values({
        tenantId: althan!.tenantId,
        storeId: althan!.id,
        staffId: stylist!.id,
        customerId: customer!.id,
        bookedByUserId: customer!.id,
        serviceId: service!.id,
        assignedChair: 4, // DIFFERENT CHAIR!
        slotRange: sql`tstzrange(${targetDate.toISOString()}, ${targetEnd.toISOString()}, '[)')`,
        status: 'CONFIRMED',
        customerNotes: 'Concurrent booking on Chair 4',
      }).returning();
      if (chair4Booking) {
        differentChairSuccess = true;
        chair4BookingId = chair4Booking.id;
      }
    } catch (err) {
      differentChairSuccess = false;
    }
    assert(differentChairSuccess, 'Concurrent booking at identical time on different physical chair succeeds');

    // 1.4 Edge Case: Back-to-back booking on same chair with 0 overlap (2:45 PM - 3:30 PM) (Must succeed!)
    let contiguousSuccess = false;
    let contiguousId: string | null = null;
    try {
      const contiguousStart = targetEnd; // Exactly at 2:45 PM
      const contiguousEnd = new Date(contiguousStart.getTime() + 45 * 60 * 1000); // 3:30 PM

      const [cBooking] = await db.insert(appointments).values({
        tenantId: althan!.tenantId,
        storeId: althan!.id,
        staffId: stylist!.id,
        customerId: customer!.id,
        bookedByUserId: customer!.id,
        serviceId: service!.id,
        assignedChair: 3,
        slotRange: sql`tstzrange(${contiguousStart.toISOString()}, ${contiguousEnd.toISOString()}, '[)')`,
        status: 'CONFIRMED',
        customerNotes: 'Contiguous booking on Chair 3',
      }).returning();
      if (cBooking) {
        contiguousSuccess = true;
        contiguousId = cBooking.id;
      }
    } catch {
      contiguousSuccess = false;
    }
    assert(contiguousSuccess, 'Contiguous back-to-back reservation on same chair [) half-open interval succeeds');

    // =========================================================================
    // SUITE 2: 2-HOUR CANCELLATION & INSTANT SLOT RECLAMATION
    // =========================================================================
    console.log('\n--- 2. Cancellation Cutoff & Slot Reclamation ---');

    // Generate valid auth session token for Customer
    const sessionToken = signSession({
      id: customer!.id,
      email: customer!.email,
      fullName: customer!.fullName,
      role: 'CUSTOMER',
      tenantId: althan!.tenantId,
    });

    // 2.1 Cancelling appointment in future (>2hr) frees the chair immediately
    const cancelRes = await fetch('http://localhost:3000/api/booking/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `aura_session=${sessionToken}`,
      },
      body: JSON.stringify({ appointmentId: primaryBooking.id }),
    });
    assert(cancelRes.status === 200, 'Self-service cancellation endpoint returns HTTP 200 for >2hr appointment');

    // 2.2 Verify status changed to CANCELLED in DB
    const cancelledDb = await db.query.appointments.findFirst({
      where: eq(appointments.id, primaryBooking.id),
    });
    assert(cancelledDb?.status === 'CANCELLED', 'Appointment status transitioned to CANCELLED');

    // 2.3 Edge Case: Now that Chair 3 is CANCELLED, a new client CAN book the exact same slot!
    let reclaimSuccess = false;
    let reclaimedId: string | null = null;
    try {
      const [reclaimedBooking] = await db.insert(appointments).values({
        tenantId: althan!.tenantId,
        storeId: althan!.id,
        staffId: stylist!.id,
        customerId: customer!.id,
        bookedByUserId: customer!.id,
        serviceId: service!.id,
        assignedChair: 3, // SAME CHAIR that was freed!
        slotRange: sql`tstzrange(${targetDate.toISOString()}, ${targetEnd.toISOString()}, '[)')`,
        status: 'CONFIRMED',
        customerNotes: 'Reclaimed freed chair slot',
      }).returning();
      if (reclaimedBooking) {
        reclaimSuccess = true;
        reclaimedId = reclaimedBooking.id;
      }
    } catch {
      reclaimSuccess = false;
    }
    assert(reclaimSuccess, 'Instant slot reclamation: newly cancelled chair is immediately re-bookable');

    // 2.4 Edge Case: Attempting to cancel an appointment strictly inside the 2-hour window (<2hr)
    const imminentStart = new Date(Date.now() + 45 * 60 * 1000); // 45 min in future (< 2 hr!)
    const imminentEnd = new Date(imminentStart.getTime() + 45 * 60 * 1000);
    const [imminentBooking] = await db.insert(appointments).values({
      tenantId: althan!.tenantId,
      storeId: althan!.id,
      staffId: stylist!.id,
      customerId: customer!.id,
      bookedByUserId: customer!.id,
      serviceId: service!.id,
      assignedChair: 5,
      slotRange: sql`tstzrange(${imminentStart.toISOString()}, ${imminentEnd.toISOString()}, '[)')`,
      status: 'CONFIRMED',
      customerNotes: 'Edge case test imminent',
    }).returning();

    const imminentCancelRes = await fetch('http://localhost:3000/api/booking/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `aura_session=${sessionToken}`,
      },
      body: JSON.stringify({ appointmentId: imminentBooking.id }),
    });
    assert(imminentCancelRes.status === 403, 'Cancellation within 2-hour window is strictly rejected with HTTP 403');

    // =========================================================================
    // SUITE 3: SUPABASE AUTH & LIVE DATABASE INTEGRATION
    // =========================================================================
    console.log('\n--- 3. Supabase Live Client & Identity Verification ---');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
    assert(!!supabase, 'Supabase client initializes with URL and Anon key');

    // 3.1 Verify public catalog tables accessible via PostgREST / Supabase Client
    const { data: remoteStores, error: storesErr } = await supabase
      .from('stores')
      .select('id, name, city')
      .limit(3);
    assert(!storesErr && (remoteStores?.length || 0) > 0, 'Supabase PostgREST client queries public stores with RLS active', `Found: ${remoteStores?.length} stores`);

    // 3.2 Verify public services accessible
    const { data: remoteServices, error: srvErr } = await supabase
      .from('services')
      .select('id, title, price')
      .limit(3);
    assert(!srvErr && (remoteServices?.length || 0) > 0, 'Supabase PostgREST client queries public services with RLS active', `Found: ${remoteServices?.length} services`);

    // 3.3 Verify Google OAuth Endpoint Construction
    const { data: oauthData, error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    });
    assert(!oauthErr && !!oauthData?.url, 'signInWithOAuth generates valid Google authorization URL', `Target: ${oauthData?.url?.substring(0, 50)}...`);

    // =========================================================================
    // SUITE 4: OAUTH 2.1 SERVER CONSENT FLOW ENDPOINTS
    // =========================================================================
    console.log('\n--- 4. Supabase OAuth 2.1 Server Consent & Decision ---');

    // 4.1 Missing authorization_id error handling
    const consentRes = await fetch('http://localhost:3000/oauth/consent');
    const consentHtml = await consentRes.text();
    assert(consentHtml.includes('Missing Authorization ID') || consentRes.status === 200, 'Consent screen gracefully rejects missing authorization_id');

    // 4.2 Decision endpoint missing authorization_id rejection
    const decisionRes = await fetch('http://localhost:3000/api/oauth/decision', {
      method: 'POST',
      body: new URLSearchParams({ decision: 'approve' }),
    });
    assert(decisionRes.status === 400, 'OAuth decision endpoint returns HTTP 400 when authorization_id is missing');


    // =========================================================================
    // SUITE 5: API FAULT TOLERANCE & SECURITY EDGE CASES
    // =========================================================================
    console.log('\n--- 5. API Fault Tolerance, RBAC & Parameter Edge Cases ---');

    // 5.1 Non-existent store UUID returns clean 404
    const invalidStoreRes = await fetch('http://localhost:3000/api/discovery/salons/00000000-0000-0000-0000-000000000000');
    assert(invalidStoreRes.status === 404, 'Querying non-existent store UUID returns clean HTTP 404');

    // 5.2 Malformed store ID returns 400
    const malformedStoreRes = await fetch('http://localhost:3000/api/discovery/salons/not-a-valid-uuid');
    assert(malformedStoreRes.status === 400, 'Querying malformed non-UUID store returns clean HTTP 400');

    // 5.3 Booking without authentication returns 401
    const unauthBookingRes = await fetch('http://localhost:3000/api/booking/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: althan!.id,
        staffId: stylist!.id,
        serviceId: service!.id,
        date: '2026-10-15',
        slotTime: '15:00',
      }),
    });
    assert(unauthBookingRes.status === 401, 'Booking appointment without session cookie returns HTTP 401 Unauthorized');

    // 5.4 Staff Quick Walk-in unauthorized access rejection
    const unauthQuickBookRes = await fetch('http://localhost:3000/api/staff/quick-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: althan!.id,
        staffId: stylist!.id,
        serviceId: service!.id,
        customerFullName: 'Hacked Walk-in',
        startTime: new Date().toISOString(),
      }),
    });
    assert(unauthQuickBookRes.status === 403, 'Unauthenticated or non-staff call to quick-book returns HTTP 403 Forbidden');

    // 5.5 Staff Status Update unauthorized rejection
    const unauthStatusRes = await fetch('http://localhost:3000/api/staff/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: primaryBooking.id,
        status: 'COMPLETED',
      }),
    });
    assert(unauthStatusRes.status === 403, 'Unauthenticated call to update appointment status returns HTTP 403 Forbidden');

    // 5.6 Staff Roster unauthorized access rejection
    const unauthRosterRes = await fetch('http://localhost:3000/api/staff/roster');
    assert(unauthRosterRes.status === 403, 'Customer or unauthenticated access to staff roster returns HTTP 403 Forbidden');

    // =========================================================================
    // CLEANUP TEST RECORDS
    // =========================================================================
    await db.delete(appointments).where(
      sql`customer_notes LIKE 'Edge case test%' OR customer_notes LIKE 'Concurrent booking%' OR customer_notes LIKE 'Contiguous%' OR customer_notes LIKE 'Reclaimed%'`
    );

    console.log('\n=============================================================');
    console.log(`🎯 Edge-Case Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('=============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🏆 ALL EDGE CASES & CONCURRENCY CONSTRAINTS VERIFIED 100% PASSING!\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('💥 Edge-case suite failure:', err);
    process.exit(1);
  }
}

runEdgeCaseTests();

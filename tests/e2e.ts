import { db } from '../src/db';
import { stores, services, staffProfiles, users, appointments, tenants } from '../src/db/schema';
import { sql, eq } from 'drizzle-orm';

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('🚀 Starting Salon Booking System End-to-End Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Direct PostgreSQL Database Connection & Identity
    // -------------------------------------------------------------
    console.log('1️⃣ Testing PostgreSQL Connection & Credentials...');
    const dbInfo = await db.execute(sql`SELECT current_database() as db_name, current_user as user_name, version()`);
    const currentDb = (dbInfo[0] as { db_name: string; user_name: string }).db_name;
    const currentUser = (dbInfo[0] as { db_name: string; user_name: string }).user_name;

    assert(currentDb === 'kaibil', 'Database name matches required Kaibil', `Found: ${currentDb}`);
    assert(currentUser === 'salon_admin', 'Database user matches salon_admin', `Found: ${currentUser}`);

    // -------------------------------------------------------------
    // Test 2: Drizzle ORM Data Retrieval
    // -------------------------------------------------------------
    console.log('\n2️⃣ Testing Drizzle ORM Entity Retrieval...');
    const tenantList = await db.query.tenants.findMany();
    assert(tenantList.length > 0, 'Tenants table has records', `Count: ${tenantList.length}`);

    const storeList = await db.query.stores.findMany({
      with: {
        services: true,
        staff: {
          with: { user: true },
        },
      },
    });
    assert(storeList.length > 0, 'Stores retrieved with relations', `Stores: ${storeList.length}`);
    const activeStore = storeList[0];
    assert(activeStore.services.length > 0, 'Store has associated services', `Services count: ${activeStore.services.length}`);
    assert(activeStore.staff.length > 0, 'Store has assigned staff members', `Staff count: ${activeStore.staff.length}`);

    // -------------------------------------------------------------
    // Test 3: Local Next.js API Endpoints (/api/health)
    // -------------------------------------------------------------
    console.log('\n3️⃣ Testing Next.js Health Check Route (/api/health)...');
    const healthRes = await fetch('http://localhost:3000/api/health');
    assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200', `Status: ${healthRes.status}`);

    const healthJson = await healthRes.json();
    assert(healthJson.status === 'ok', 'Health status is "ok"', `Status: ${healthJson.status}`);
    assert(healthJson.database.status === 'connected', 'Database connection status is "connected"', `DB: ${healthJson.database.status}`);

    // -------------------------------------------------------------
    // Test 4: GraphQL API Layer (/api/graphql Query)
    // -------------------------------------------------------------
    console.log('\n4️⃣ Testing GraphQL Yoga Endpoint (/api/graphql Query)...');
    const gqlQuery = `
      query GetSystemOverview {
        systemHealth {
          status
          database
          version
        }
        stores {
          id
          name
          city
          services {
            id
            title
            price
          }
        }
      }
    `;

    const gqlRes = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': 'bonanza',
      },
      body: JSON.stringify({ query: gqlQuery }),
    });

    assert(gqlRes.status === 200, 'GraphQL responds with HTTP 200', `Status: ${gqlRes.status}`);
    const gqlData = await gqlRes.json();
    assert(!gqlData.errors, 'GraphQL query executed with no schema errors');
    assert(gqlData.data?.systemHealth?.database === 'healthy', 'GraphQL systemHealth reports database is healthy');
    assert(gqlData.data?.stores?.length > 0, 'GraphQL stores query returns stores', `Stores returned: ${gqlData.data?.stores?.length}`);

    // -------------------------------------------------------------
    // Test 5: End-to-End Appointment Booking Flow (GraphQL Mutation -> DB)
    // -------------------------------------------------------------
    console.log('\n5️⃣ Testing GraphQL Mutation -> DB End-to-End Booking Creation...');
    const testStoreId = activeStore.id;
    const testStaffId = activeStore.staff[0].id;
    const testServiceId = activeStore.services[0].id;

    // Create a customer user if not exists
    let customer = await db.query.users.findFirst({
      where: eq(users.email, 'customer.test@example.com'),
    });

    if (!customer) {
      const [newCust] = await db.insert(users).values({
        tenantId: activeStore.tenantId,
        email: 'customer.test@example.com',
        fullName: 'Test Customer Krushang',
        passwordHash: 'argon2id_placeholder',
        role: 'CUSTOMER',
        phone: '+919999988888',
      }).returning();
      customer = newCust;
    }

    const testCustomerId = customer.id;
    const startTimeIso = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

    const bookingMutation = `
      mutation CreateTestBooking($storeId: ID!, $staffId: ID!, $serviceId: ID!, $customerId: ID!, $startTime: String!) {
        createAppointment(
          storeId: $storeId
          staffId: $staffId
          serviceId: $serviceId
          customerId: $customerId
          startTime: $startTime
          customerNotes: "E2E automated integration test booking"
        ) {
          id
          status
          customerNotes
        }
      }
    `;

    const mutationRes = await fetch('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': 'bonanza',
      },
      body: JSON.stringify({
        query: bookingMutation,
        variables: {
          storeId: testStoreId,
          staffId: testStaffId,
          serviceId: testServiceId,
          customerId: testCustomerId,
          startTime: startTimeIso,
        },
      }),
    });

    const mutationJson = await mutationRes.json();
    assert(!mutationJson.errors, 'Booking mutation has no errors', mutationJson.errors ? JSON.stringify(mutationJson.errors) : undefined);
    assert(mutationJson.data?.createAppointment?.status === 'CONFIRMED', 'Booking created with status CONFIRMED');
    const createdAppointmentId = mutationJson.data?.createAppointment?.id;

    // Verify persisted directly in PostgreSQL via Drizzle
    const dbRecord = await db.query.appointments.findFirst({
      where: eq(appointments.id, createdAppointmentId),
    });
    assert(!!dbRecord, 'Appointment successfully verified in PostgreSQL database table');

    // -------------------------------------------------------------
    // Test 6: Frontend Route (Next.js SSR / HTML)
    // -------------------------------------------------------------
    console.log('\n6️⃣ Testing Next.js Frontend Page (/)...');
    const pageRes = await fetch('http://localhost:3000/');
    assert(pageRes.status === 200, 'Frontend page responds with HTTP 200');
    const pageHtml = await pageRes.text();
    assert(pageHtml.includes('Salon Appointment Booking'), 'Frontend page HTML contains system title');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Unhandled error in test suite:', error);
    process.exit(1);
  }
}

runEndToEndTests();

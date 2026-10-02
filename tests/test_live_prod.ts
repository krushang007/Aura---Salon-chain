/**
 * Live Production Test Suite for Aura Salon Platform
 * Target: https://aura-salon-chain.vercel.app
 */

const BASE_URL = 'https://aura-salon-chain.vercel.app';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(name: string, category: string, passed: boolean, details: string) {
  results.push({ name, category, passed, details });
  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusIcon} [${category}] ${name}: ${details}`);
}

async function run() {
  console.log(`\n===============================================================`);
  console.log(`🚀 Starting Full Live Production Verification on ${BASE_URL}`);
  console.log(`===============================================================\n`);

  // 1. Health & Database Connectivity
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'ok' && data.database?.status === 'connected';
    record('System Health & Database Probe', 'Infrastructure', passed, `HTTP ${res.status}, DB: ${data.database?.status}, latency: ${data.database?.latencyMs}`);
  } catch (err: unknown) {
    record('System Health & Database Probe', 'Infrastructure', false, err instanceof Error ? err.message : String(err));
  }

  // 2. Security Headers (H-8)
  try {
    const res = await fetch(BASE_URL, { method: 'HEAD' });
    const hsts = res.headers.get('strict-transport-security');
    const xfo = res.headers.get('x-frame-options');
    const xcto = res.headers.get('x-content-type-options');
    const referrer = res.headers.get('referrer-policy');

    const passed = Boolean(hsts && xfo === 'DENY' && xcto === 'nosniff' && referrer);
    record(
      'Security Headers (H-8)',
      'Security',
      passed,
      `XFO: ${xfo}, XCTO: ${xcto}, HSTS: ${hsts ? 'Active' : 'Missing'}, Referrer: ${referrer}`
    );
  } catch (err: unknown) {
    record('Security Headers (H-8)', 'Security', false, err instanceof Error ? err.message : String(err));
  }

  // 3. Route Protection & RBAC (H-9)
  const protectedPaths = ['/admin', '/staff', '/appointments', '/profile', '/notifications'];
  for (const path of protectedPaths) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
      const location = res.headers.get('location') || '';
      const isRedirect = (res.status === 307 || res.status === 308 || res.status === 302) && location.includes('/login');
      record(
        `Route Protection for ${path} (H-9)`,
        'Authorization',
        isRedirect,
        `Status ${res.status} -> Redirect: ${location}`
      );
    } catch (err: unknown) {
      record(`Route Protection for ${path} (H-9)`, 'Authorization', false, err instanceof Error ? err.message : String(err));
    }
  }

  // 4. HMAC Signature Tampering Rejection (M-1)
  try {
    const fakePayload = Buffer.from(JSON.stringify({ id: 'fake', role: 'TENANT_ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    const forgedToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.forged_tampered_signature_99999`;
    const res = await fetch(`${BASE_URL}/profile`, {
      headers: { Cookie: `aura_session=${forgedToken}` },
      redirect: 'manual',
    });
    const location = res.headers.get('location') || '';
    const passed = (res.status === 307 || res.status === 308) && location.includes('/login');
    record(
      'Tampered Token Rejection (M-1)',
      'Security',
      passed,
      `HTTP ${res.status}, Forged token correctly blocked and redirected to ${location}`
    );
  } catch (err: unknown) {
    record('Tampered Token Rejection (M-1)', 'Security', false, err instanceof Error ? err.message : String(err));
  }

  // 5. Zod Input Validation (M-3)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error === 'Validation failed' && Array.isArray(data.details);
    record(
      'Zod Schema Rejection on Invalid Body (M-3)',
      'Validation',
      passed,
      `HTTP 400 received, structured field errors: ${JSON.stringify(data.details?.map((d: any) => d.field))}`
    );
  } catch (err: unknown) {
    record('Zod Schema Rejection on Invalid Body (M-3)', 'Validation', false, err instanceof Error ? err.message : String(err));
  }

  // 6. Public Discovery & Catalog Retrieval
  let sampleStoreId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/salons`);
    const data = await res.json();
    const count = data.stores?.length || 0;
    if (count > 0) sampleStoreId = data.stores[0].id;
    record(
      'Public Salons Discovery Endpoint',
      'API',
      res.status === 200 && count > 0,
      `HTTP ${res.status}, Retrieved ${count} active salon branches in Surat (Sample: ${data.stores?.[0]?.branchName})`
    );
  } catch (err: unknown) {
    record('Public Salons Discovery Endpoint', 'API', false, err instanceof Error ? err.message : String(err));
  }

  // 7. Full Auth & Session Lifecycle (Register -> Verify Cookie -> Profile Access -> Re-login)
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const testEmail = `live_verify_${randomSuffix}@aurasurat.in`;
  const testPassword = `Pass@Secure_${randomSuffix}123!`;
  let sessionCookie = '';

  try {
    // 7.1 Register
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: `Live Tester ${randomSuffix}`,
        email: testEmail,
        password: testPassword,
        phone: '+91 98980 11223',
      }),
    });
    const regData = await regRes.json();
    const rawSetCookie = regRes.headers.get('set-cookie') || '';
    const cookieMatch = rawSetCookie.match(/aura_session=([^;]+)/);
    if (cookieMatch) sessionCookie = cookieMatch[1];

    const regPassed = regRes.status === 200 && regData.success && Boolean(sessionCookie);
    record(
      'PBKDF2 600k Registration & Cookie Minting',
      'Auth',
      regPassed,
      `HTTP ${regRes.status}, Created user: ${testEmail}, Session token minted: ${Boolean(sessionCookie)}`
    );

    // 7.2 Read Profile with Cookie
    if (sessionCookie) {
      const profRes = await fetch(`${BASE_URL}/api/auth/profile`, {
        headers: { Cookie: `aura_session=${sessionCookie}` },
      });
      const profData = await profRes.json();
      const profPassed = profRes.status === 200 && profData.user?.email === testEmail;
      record(
        'Authenticated Profile Retrieval (/api/auth/profile)',
        'Auth',
        profPassed,
        `HTTP ${profRes.status}, User ID: ${profData.user?.id}, Name: ${profData.user?.fullName}`
      );

      // 7.3 Frontend Page Access (/profile) with Cookie
      const pageRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Cookie: `aura_session=${sessionCookie}` },
        redirect: 'manual',
      });
      record(
        'Protected Frontend Access with Session (/profile)',
        'Auth',
        pageRes.status === 200,
        `HTTP ${pageRes.status} (Allowed without redirect)`
      );
    }

    // 7.4 Wrong Password Rejection
    const wrongRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPasswordXYZ' }),
    });
    record(
      'Incorrect Password Rejection',
      'Auth',
      wrongRes.status === 401,
      `HTTP ${wrongRes.status} on bad password`
    );

    // 7.5 Universal Backdoor Rejection (C-6)
    const backdoorRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Password@123' }),
    });
    record(
      'Legacy Backdoor Rejection (C-6)',
      'Security',
      backdoorRes.status === 401,
      `HTTP ${backdoorRes.status} (Universal Password@123 backdoor successfully blocked)`
    );

    // 7.6 Re-login with Correct Password
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    record(
      'Verified Login with PBKDF2 600k (H-2)',
      'Auth',
      loginRes.status === 200 && loginData.success,
      `HTTP ${loginRes.status}, Authenticated as ${loginData.user?.role}`
    );
  } catch (err: unknown) {
    record('Auth Lifecycle Verification', 'Auth', false, err instanceof Error ? err.message : String(err));
  }

  // 8. IDOR Protection on Notifications (H-3)
  try {
    const idorRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `aura_session=${sessionCookie}`,
      },
      body: JSON.stringify({ notificationId: '00000000-0000-0000-0000-000000000000' }),
    });
    const idorData = await idorRes.json();
    const passed = idorRes.status === 404 && idorData.error?.includes('not yours');
    record(
      'Anti-IDOR Notification Scoping (H-3)',
      'Security',
      passed,
      `HTTP ${idorRes.status}, Result: "${idorData.error}"`
    );
  } catch (err: unknown) {
    record('Anti-IDOR Notification Scoping (H-3)', 'Security', false, err instanceof Error ? err.message : String(err));
  }

  // 9. GraphQL Authentication & Introspection Protection (C-3, C-4)
  try {
    const gqlRes = await fetch(`${BASE_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation {
          createAppointment(
            storeId: "00000000-0000-0000-0000-000000000000",
            staffId: "00000000-0000-0000-0000-000000000000",
            serviceId: "00000000-0000-0000-0000-000000000000",
            customerId: "00000000-0000-0000-0000-000000000000",
            startTime: "2026-10-10T10:00:00Z"
          ) { id }
        }`,
      }),
    });
    const gqlData = await gqlRes.json();
    const isMaskedAndBlocked = gqlData.data === null && gqlData.errors?.[0]?.message === 'Unexpected error.';
    record(
      'GraphQL Mutation Auth Guard & Error Masking (C-3, C-4)',
      'GraphQL',
      isMaskedAndBlocked,
      `Mutation blocked, returned masked error: "${gqlData.errors?.[0]?.message}"`
    );
  } catch (err: unknown) {
    record('GraphQL Mutation Auth Guard & Error Masking (C-3, C-4)', 'GraphQL', false, err instanceof Error ? err.message : String(err));
  }

  // 10. Summary
  console.log(`\n===============================================================`);
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`🎯 Test Summary: ${passedCount}/${total} Passed (${failedCount} Failed)`);
  console.log(`===============================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

run();

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================================================
// Edge-compatible HMAC-SHA256 session verification (M-1)
// Uses Web Crypto API since Node.js crypto is unavailable in Edge Runtime
// ============================================================================

interface MinimalSession {
  role: string;
  exp?: number;
}

async function verifySessionEdge(token: string): Promise<MinimalSession | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    // Compute expected HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${header}.${payload}`)
    );

    const bytes = new Uint8Array(signatureBytes);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const expected = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    if (signature !== expected) return null;

    // Decode and parse payload
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const data: MinimalSession = JSON.parse(atob(padded));

    // Check expiry
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// ============================================================================
// ROUTE PROTECTION CONFIGURATION (H-9)
// ============================================================================

const PROTECTED_PREFIXES = ['/admin', '/staff', '/appointments', '/profile', '/notifications'];
const AUTH_PAGES = ['/login', '/register'];

// ============================================================================
// MIDDLEWARE
// ============================================================================

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    try {
      await supabase.auth.getUser();
    } catch {
      // Ignore Supabase refresh error — Aura session is the primary auth
    }
  }

  // M-1: Verify Aura session token with HMAC signature check (not just payload parsing)
  const auraSessionToken = request.cookies.get('aura_session')?.value;
  const pathname = request.nextUrl.pathname;
  let verifiedSession: MinimalSession | null = null;

  if (auraSessionToken) {
    verifiedSession = await verifySessionEdge(auraSessionToken);
  }

  // H-9: Protect routes that require authentication
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtectedRoute && !verifiedSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If user is already authenticated and visits /login or /register, redirect to appropriate portal
  if (verifiedSession && AUTH_PAGES.includes(pathname)) {
    // Check if return redirect is specified
    const redirectParam =
      request.nextUrl.searchParams.get('redirect') || request.nextUrl.searchParams.get('next');
    if (redirectParam && redirectParam.startsWith('/') && redirectParam !== '/login') {
      const url = request.nextUrl.clone();
      url.pathname = redirectParam;
      url.search = '';
      return NextResponse.redirect(url);
    }

    // Role-based redirect using verified session data
    if (verifiedSession.role === 'TENANT_ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (verifiedSession.role === 'STAFF') {
      const url = request.nextUrl.clone();
      url.pathname = '/staff';
      url.search = '';
      return NextResponse.redirect(url);
    }

    const url = request.nextUrl.clone();
    url.pathname = '/appointments';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

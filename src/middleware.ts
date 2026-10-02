import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    }
  );

  let user = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data?.user;
  } catch {
    // Ignore refresh error
  }

  // Check Aura session token
  const auraSessionToken = request.cookies.get('aura_session')?.value;
  const pathname = request.nextUrl.pathname;

  // If user is already authenticated and visits /login or /register, redirect to appropriate portal
  if ((user || auraSessionToken) && (pathname === '/login' || pathname === '/register')) {
    // Check if return redirect is specified
    const redirectParam = request.nextUrl.searchParams.get('redirect') || request.nextUrl.searchParams.get('next');
    if (redirectParam && redirectParam.startsWith('/') && redirectParam !== '/login') {
      return NextResponse.redirect(new URL(redirectParam, request.url));
    }

    // Decode aura session payload if available to determine role
    if (auraSessionToken) {
      try {
        const parts = auraSessionToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
          if (payload.role === 'TENANT_ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url));
          }
          if (payload.role === 'STAFF') {
            return NextResponse.redirect(new URL('/staff', request.url));
          }
        }
      } catch {}
    }

    return NextResponse.redirect(new URL('/appointments', request.url));
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

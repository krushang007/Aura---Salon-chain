import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OAuthConsentPage({
  searchParams,
}: {
  searchParams: { authorization_id?: string };
}) {
  const authorizationId = searchParams.authorization_id;

  if (!authorizationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="font-display text-lg font-bold text-neutral-900">Missing Authorization ID</h1>
          <p className="mt-2 text-xs text-neutral-500">
            This authorization URL is invalid or has expired. Please initiate the connection from your third-party application again.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-neutral-900 px-4 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            Return to Aura Home
          </Link>
        </div>
      </div>
    );
  }

  const supabase = createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/oauth/consent?authorization_id=${authorizationId}`);
  }

  interface OAuthAuthorizationDetails {
    authorization_id?: string;
    redirect_url?: string;
    redirect_uri?: string;
    client?: { name?: string };
    scope?: string;
  }

  // Retrieve OAuth authorization details
  let authDetails: OAuthAuthorizationDetails | null = null;
  let authError: string | null = null;

  try {
    const authClient = supabase.auth as unknown as {
      oauth?: {
        getAuthorizationDetails: (id: string) => Promise<{ data?: OAuthAuthorizationDetails; error?: { message?: string } }>;
      };
    };
    const res = await authClient.oauth?.getAuthorizationDetails(authorizationId);
    authDetails = res?.data || null;
    authError = res?.error?.message || null;
  } catch (err: unknown) {
    authError = err instanceof Error ? err.message : 'Failed to retrieve authorization details';
  }

  if (authError || !authDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="font-display text-lg font-bold text-neutral-900">Authorization Request Error</h1>
          <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
            {authError || 'Could not verify client authorization request.'}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-neutral-900 px-4 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            Back to Safety
          </Link>
        </div>
      </div>
    );
  }

  // If user already consented, redirect immediately
  if (!('authorization_id' in authDetails) && authDetails.redirect_url) {
    redirect(authDetails.redirect_url);
  }

  const clientName = authDetails?.client?.name || 'Third-Party Integration';
  const scopes = (authDetails?.scope || 'openid email profile').trim().split(/\s+/);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50/60 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 shadow-xs">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white font-bold text-sm tracking-tight">
              A
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">Aura Identity Server</p>
              <p className="text-[11px] text-neutral-400">OAuth 2.1 Authorization</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3 w-3" /> Secure SSO
          </span>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-4">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-neutral-900">
              Authorize <span className="underline decoration-neutral-300">{clientName}</span>
            </h1>
            <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
              This application is requesting permission to access your Aura account as{' '}
              <strong className="text-neutral-800">{user.email}</strong>.
            </p>
          </div>

          {/* Requested Permissions Card */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Requested Permissions
            </p>
            <div className="space-y-2">
              {scopes.map((scopeItem: string) => (
                <div key={scopeItem} className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-mono font-semibold text-neutral-800 text-[11px]">{scopeItem}</span>
                    <p className="text-[11px] text-neutral-500">
                      {scopeItem === 'openid' && 'Verify your authenticated user identity.'}
                      {scopeItem === 'email' && 'Access your primary contact email address.'}
                      {scopeItem === 'profile' && 'Read your name, preferences, and assigned salon branch.'}
                      {!['openid', 'email', 'profile'].includes(scopeItem) && 'Read-write access for application integration.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Redirect URI disclosure */}
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 border-t border-neutral-100 pt-3">
            <Lock className="h-3.5 w-3.5 text-neutral-400" />
            <span className="truncate">Redirect: {authDetails.redirect_uri}</span>
          </div>

          {/* Approve / Deny Action Form */}
          <form action="/api/oauth/decision" method="POST" className="pt-3 flex items-center gap-3">
            <input type="hidden" name="authorization_id" value={authorizationId} />
            <button
              type="submit"
              name="decision"
              value="deny"
              className="flex-1 rounded-lg border border-neutral-200 bg-white py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              Deny
            </button>
            <button
              type="submit"
              name="decision"
              value="approve"
              className="flex-1 rounded-lg bg-neutral-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 transition-all"
            >
              Approve Access
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

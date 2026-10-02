# Aura Salon Marketplace: Review & Pending Items

### ✅ Completed Items
1. **Unified Auth & Google SSO**: Integrated Google OAuth CTA, hairline divider, and zero-role-tab flow across UI and Stitch AI designs.
2. **Stitch AI Canvas Layout**: 32 canonical screens organized into 2 non-overlapping rows; 98 legacy draft instances moved off-canvas.
3. **Repository Sanitization**: Scrubbed all external design heritage references, removed AWS artifacts, and isolated Next.js as single source of truth.
4. **Vercel CI/CD Pipeline**: Replaced EC2/ECR deployment with automated Vercel deployment action and configured Vercel remote MCP server.
5. **Git History & Build Health**: Pushed clean, incremental commits to GitHub; verified Next.js production build passes with 0 errors.

### ⏳ Pending Items (Next Iteration Focus)
1. **Supabase Database Provisioning**: Apply relational SQL migrations to Supabase project (`nncmxnqlvsqucbftlvnk`) with `btree_gist` slot exclusion constraints.
2. **Supabase Auth SDK Migration**: Replace custom HMAC cookie session helpers in `src/lib/auth.ts` with `@supabase/ssr` (`createBrowserClient` / `createServerClient`).
3. **Google OAuth 2.0 Credentials**: Whitelist callback URL (`https://nncmxnqlvsqucbftlvnk.supabase.co/auth/v1/callback`) in Google Cloud Console & enable Google in Supabase Auth.
4. **OAuth Code Exchange Callback**: Implement `/auth/callback/route.ts` Route Handler for PKCE token exchange and RBAC role redirection.
5. **Automated User Profile Trigger**: Deploy PostgreSQL `handle_new_user()` trigger on `auth.users` to automatically populate `public.users`.
6. **Supabase Realtime Subscriptions**: Replace HTTP polling in `DigitalPassCard.tsx` and `DailyRosterView.tsx` with PostgreSQL WAL replication channels.
7. **Supabase Storage Buckets**: Provision public storage buckets for salon storefront photography and staff avatars.
8. **Live Supabase E2E Verification**: Execute the full 51-test Playwright suite against the live Supabase backend.

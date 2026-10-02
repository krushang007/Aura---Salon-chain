# Aura Salon Marketplace: Review & Completed Milestones

### ✅ Completed Items
1. **Unified Auth & Google SSO**:
   - Integrated Google OAuth CTA button ("Continue with Google") with Google SVG branding and hairline divider in `SignInCard.tsx`.
   - Maintained clean zero-role-tab minimalist aesthetic.
2. **Supabase Auth SDK Migration (`@supabase/ssr`)**:
   - Installed `@supabase/ssr` and `@supabase/supabase-js`.
   - Implemented browser client (`src/lib/supabase/client.ts`) and server client (`src/lib/supabase/server.ts`).
   - Implemented admin client (`src/lib/supabase/admin.ts`) using service role key.
   - Configured Next.js App Router `middleware.ts` for automatic session token refreshing.
3. **OAuth Code Exchange Callback**:
   - Implemented `src/app/auth/callback/route.ts` supporting PKCE token exchange.
   - Built automatic role-based redirection: `TENANT_ADMIN` $\to$ `/admin`, `STAFF` $\to$ `/staff`, `CUSTOMER` $\to$ `/appointments`.
4. **Automated User Profile Trigger**:
   - Deployed `public.handle_new_user()` PostgreSQL function on Supabase.
   - Active `on_auth_user_created` trigger on `auth.users` synchronizing new signups directly into `public.users`.
5. **Supabase Database Provisioning & Concurrency Guard**:
   - Live Supabase project connected (`nncmxnqlvsqucbftlvnk`, `https://nncmxnqlvsqucbftlvnk.supabase.co`).
   - Enabled PostgreSQL `btree_gist` extension.
   - Created all 13 core relational tables and foreign keys with physical chair exclusion constraint (`uq_no_chair_double_booking`).
   - Seeded pilot Surat dataset: 1 chain tenant (Salon Bonanza), 3 branches (Althan, Adajan, Vesu), 7 users, 5 staff profiles, 8 services, 35 weekly shift records, and 1 demo appointment.
6. **Row Level Security (RLS) Policies**:
   - Enabled RLS across all 13 tables in the database.
   - Applied public read policies for catalog discovery (`stores`, `services`, `staff_profiles`, `staff_shifts`, `tenants`, breaks, closures).
   - Applied authenticated and row-owner policies for user profiles, appointments, audit logs, and notifications.
7. **Supabase Realtime Subscriptions (`postgres_changes`)**:
   - Added `appointments` and `notifications` to `supabase_realtime` WAL replication.
   - Integrated live WebSocket listener on `/appointments/[id]` (instant delivery-style pass status update).
   - Integrated live WebSocket listener on `/staff` (instant roster update on status change or walk-in).
8. **Supabase Public Storage Buckets**:
   - Provisioned `salon-assets` (50MB limit) for storefront photography.
   - Provisioned `avatars` (10MB limit) for stylist and customer photos with public read policies.
9. **Stitch AI Canvas Layout**:
   - 32 canonical screens organized into 2 non-overlapping rows; 98 legacy draft instances moved off-canvas.
10. **Repository Sanitization & Devops**:
    - Replaced EC2/ECR deployment with automated Vercel CI/CD pipeline.
    - Verified Next.js production build passes with 0 errors (all 26 routes dynamic/static rendered).

---

### 🔑 External Credentials Setup (Dashboard Steps)
1. **Google OAuth 2.0 Client in Supabase**:
   - In [Supabase Dashboard](https://supabase.com/dashboard/project/nncmxnqlvsqucbftlvnk/auth/providers) > **Authentication** > **Providers** > **Google**:
     - Toggle **Enable Google provider**.
     - Paste your Google OAuth `Client ID` and `Client Secret` (from Google Cloud Console).
     - Ensure the Authorized Redirect URI in Google Cloud Console is:
       `https://nncmxnqlvsqucbftlvnk.supabase.co/auth/v1/callback`

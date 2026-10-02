# Supabase Backend & Authentication Setup Guide

This guide walks you through setting up a complete Supabase backend instance for the **Aura Salon Booking Platform**, including PostgreSQL with the `btree_gist` extension, Google OAuth 2.1 authentication, Row Level Security (RLS), and database migrations.

---

## 1. Create a Supabase Project

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New Project**.
3. Choose your Organization, enter a project name (e.g. `aura-salon-booking`), set a strong database password, and choose your preferred region (e.g. `South Asia (Mumbai)`).
4. Click **Create new project** and wait ~2 minutes for provisioning to complete.

---

## 2. Retrieve Project API Credentials

From your Supabase Project Dashboard, go to **Project Settings** > **API**:

- **Project URL**: Found under `Project URL` (e.g. `https://your-project-ref.supabase.co`).
- **Anon Public Key**: Found under `Project API keys` > `anon` `public`.
- **Service Role Key**: Found under `Project API keys` > `service_role` `secret` (keep strictly confidential, server-side only).

---

## 3. Retrieve Direct Database Connection URL

1. Go to **Project Settings** > **Database**.
2. Under **Connection string**, select **URI**.
3. Copy the URI string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the password you selected when creating the project.

---

## 4. Enable PostgreSQL `btree_gist` Extension

The Aura scheduling engine uses PostgreSQL `tstzrange` with GiST exclusion constraints to mathematically guarantee zero double-bookings on physical chair stations.

1. Go to **SQL Editor** in the Supabase Dashboard.
2. Run the following command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ```

---

## 5. Configure Google OAuth Authentication (Optional for SSO)

To enable 1-click Google Sign-in:

1. In the Supabase Dashboard, navigate to **Authentication** > **Providers** > **Google**.
2. Toggle Google to **Enabled**.
3. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create an **OAuth 2.0 Client ID** (Web Application).
   - Add your Supabase Callback URL to **Authorized redirect URIs**:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
4. Copy the **Client ID** and **Client Secret** into the Supabase Google Provider configuration and save.

---

## 6. Configure Authentication URLs

In Supabase Dashboard under **Authentication** > **URL Configuration**:
- **Site URL**: `http://localhost:3000` (or your production deployment domain).
- **Redirect URLs**: Add `http://localhost:3000/auth/callback` and `http://localhost:3000/**`.

---

## 7. Apply Database Migrations & Seed Data

In your local terminal within the project directory:

1. Create your local environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the variables in `.env.local`:
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   AUTH_SECRET=generate_a_random_32_character_string
   ```
3. Push schema migrations:
   ```bash
   npm run db:migrate
   ```
4. Seed demo salon outlets, stylists, services, and chairs:
   ```bash
   npm run db:seed
   ```

---

## 8. Verification

Run the verification test suite to ensure your instance is connected and functioning properly:
```bash
npm test
```

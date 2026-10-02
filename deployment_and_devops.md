# Deployment, Vercel & DevOps Architecture (Vercel Platform & GitHub Actions)

## 1. Overview & Infrastructure Strategy
The Aura Salon Marketplace is built with **Next.js 14 (App Router)** and deployed natively on the **Vercel Cloud Platform**, leveraging global edge caching, serverless route handlers, and automated Git-driven deployments.

* **Target Hosting:** [Vercel](https://vercel.com) (Serverless & Edge Global Network).
* **Framework Optimization:** Native Next.js 14 App Router, Incremental Static Regeneration (ISR), and streaming SSR.
* **Database & Auth Backend:** Managed PostgreSQL on **Supabase** (v15+) with connection pooling (Supavisor) and `@supabase/ssr` authentication.
* **CI/CD Automation:**
  - **Vercel Native Git Integration**: Automatic zero-config deployments on push to `main` (Production) and pull requests (Preview).
  - **GitHub Actions (`.github/workflows/deploy-vercel.yml`)**: Automated linting, build verification, and deployment dispatch.
* **AI & DevOps Tooling:** Vercel Remote Model Context Protocol (MCP) (`https://mcp.vercel.com`) for programmatic deployment management, log diagnostics, and environment configuration.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      GitHub Repository & Actions                        │
│  ┌───────────────────────────────┐     ┌─────────────────────────────┐  │
│  │ .github/workflows/ci.yml      │     │ .github/workflows/deploy.yml│  │
│  │ - Triggered on pull_request   │     │ - Triggered on push to main │  │
│  │ - Code Quality & next build   │     │ - Validates build & triggers│  │
│  └───────────────┬───────────────┘     └──────────────┬──────────────┘  │
└──────────────────┼────────────────────────────────────┼─────────────────┘
                   │                                    │
                   ▼                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │                   Vercel Cloud Platform                │
       │  ┌───────────────────────┐   ┌──────────────────────┐  │
       │  │ Preview Deployment    │   │ Production Deploy    │  │
       │  │ (Branch / PR Domains) │   │ (aura-salon.vercel)  │  │
       │  └───────────────────────┘   └──────────────────────┘  │
       └───────────────────────────┬────────────────────────────┘
                                   │ Pooled Connection (Supavisor)
                                   ▼
                      ┌────────────────────────┐
                      │    Supabase Postgres   │
                      │  - Auth & GoTrue       │
                      │  - btree_gist Engine   │
                      │  - Realtime WAL        │
                      └────────────────────────┘
```

---

## 2. CI/CD Workflows

### 2.1 Continuous Integration (`.github/workflows/ci.yml`)
Runs on all pull requests and pushes to validate code quality before deployment:
```yaml
name: Continuous Integration (CI)

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test_and_lint:
    name: Code Quality & Build Check
    runs-on: ubuntu-24.04

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Validate Production Build
        run: npm run build
```

### 2.2 Vercel Automated Deployment (`.github/workflows/deploy-vercel.yml`)
Deploys the application directly to Vercel with preview comments on pull requests and production deployment on push to `main`:
```yaml
name: Deploy - Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Validate Production Build
        run: npm run build

      - name: Deploy to Vercel (Production)
        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          if [ -n "$VERCEL_TOKEN" ]; then
            npx --yes vercel deploy --prod --token=$VERCEL_TOKEN --yes
          else
            echo "VERCEL_TOKEN not provided in GitHub secrets. Relying on Vercel Native GitHub Integration."
          fi

      - name: Deploy to Vercel (Preview)
        if: github.event_name == 'pull_request'
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          if [ -n "$VERCEL_TOKEN" ]; then
            npx --yes vercel deploy --token=$VERCEL_TOKEN --yes
          else
            echo "VERCEL_TOKEN not provided in GitHub secrets. Relying on Vercel Native GitHub Integration."
          fi
```

---

## 3. Environment Variables Configuration

| Variable | Target Environment | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production & Preview | Supabase / Postgres connection string with connection pool mode (port 6543 / 5432). |
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | Supabase project API gateway endpoint (`https://<project-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Production & Preview | Supabase anon public key for client-side queries and auth listeners. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Only | Supabase privileged service role key for administrative tasks (never exposed to client). |
| `NEXT_PUBLIC_APP_URL` | Production & Preview | Base URL for OAuth redirects (`https://aura-salon.vercel.app` or `http://localhost:3000`). |

---

## 4. Vercel Model Context Protocol (MCP) Integration

The project integrates with the official **Vercel MCP Server** (`https://mcp.vercel.com`) enabling AI-driven deployment monitoring and automation:
- **Project Inspection**: Query project status, linked git repositories, and domain aliases.
- **Deployment Diagnostics**: Stream build and runtime logs to diagnose errors or performance bottlenecks.
- **Web Analytics**: Inspect real-time traffic, Core Web Vitals (LCP, INP, CLS), and user engagement.

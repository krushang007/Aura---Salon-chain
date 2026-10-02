# Deployment, Docker & DevOps Architecture (AWS EC2 & GitHub Actions)

## 1. Overview & Infrastructure Strategy
The Salon Appointment Booking System is designed for containerized deployment on an **AWS EC2** instance, utilizing a production-grade CI/CD pipeline modeled directly after the **Enterprise-Search** infrastructure.

* **Target Compute:** AWS EC2 Linux Instance (Ubuntu 24.04 LTS).
* **Container Orchestration:** Docker & Docker Compose.
* **Image Registry:** Amazon Elastic Container Registry (ECR).
* **CI/CD Automation:** GitHub Actions (`build-ui.yml` / `deploy-ec2.yml`) utilizing `appleboy/ssh-action` and `appleboy/scp-action`.
* **Local Development Workflow:** Next.js running locally (`npm run dev`) against a containerized PostgreSQL database (`docker-compose.dev.yml`), with optional full-container local testing.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      GitHub Repository & Actions                        │
│  ┌───────────────────────────────┐     ┌─────────────────────────────┐  │
│  │ .github/workflows/build.yml   │     │ .github/workflows/deploy.yml│  │
│  │ - Triggered on merge / tag    │     │ - Triggered on workflow_disp│  │
│  │ - Builds Multi-Stage Docker   │     │ - Connects via SSH to EC2   │  │
│  │ - Pushes to Amazon ECR        │     │ - SCPs compose & .env files │  │
│  └───────────────┬───────────────┘     └──────────────┬──────────────┘  │
└──────────────────┼────────────────────────────────────┼─────────────────┘
                   │ Push Image                         │ SSH & Compose Up
                   ▼                                    ▼
       ┌───────────────────────┐             ┌─────────────────────┐
       │   Amazon ECR          │             │   AWS EC2 Host      │
       │   Repository          │────────────►│  ┌───────────────┐  │
       │   - salon-booking-app │  Docker     │  │ Docker Compose│  │
       │   - :<git-sha>        │  Pull       │  │ Next.js + DB  │  │
       └───────────────────────┘             │  └───────────────┘  │
                                             └─────────────────────┘
```

---

## 2. Docker Architecture

### 2.1 Multi-Stage Production Dockerfile (`Dockerfile`)
Optimized for Next.js App Router standalone output, achieving a minimal production image footprint ($< 150\text{ MB}$):

```dockerfile
# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry disable & production build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ============================================================================
# Stage 3: Runner (Slim Production Image)
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: Non-root user execution
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

---

### 2.2 Local Development Compose (`docker-compose.dev.yml`)
For local developers who run Next.js on host (`npm run dev`) and need local PostgreSQL with the `btree_gist` extension:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: salon-postgres-dev
    restart: always
    environment:
      POSTGRES_DB: salon_booking_dev
      POSTGRES_USER: salon_admin
      POSTGRES_PASSWORD: salon_password
    ports:
      - "5432:5432"
    volumes:
      - salon_pgdata_dev:/var/lib/postgresql/data
    networks:
      - salon-network

networks:
  salon-network:
    driver: bridge

volumes:
  salon_pgdata_dev:
```

---

### 2.3 Production EC2 Compose (`docker-compose.prod.yml`)
Deploys the production Next.js app container pulled from Amazon ECR alongside PostgreSQL on the EC2 host:

```yaml
version: '3.8'

services:
  app:
    image: ${ECR_REGISTRY}/salon-booking-app:${APP_IMAGE_TAG}
    container_name: salon-booking-app
    restart: always
    env_file: .env.production
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    networks:
      - salon-prod-network

  postgres:
    image: postgres:17-alpine
    container_name: salon-postgres-prod
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-salon_booking}
      POSTGRES_USER: ${POSTGRES_USER:-salon_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - salon_pgdata_prod:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-salon_admin} -d ${POSTGRES_DB:-salon_booking}"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s
    networks:
      - salon-prod-network

networks:
  salon-prod-network:
    driver: bridge

volumes:
  salon_pgdata_prod:
```

---

## 3. GitHub Actions CI/CD Workflows

### 3.1 Build & Push to Amazon ECR (`.github/workflows/build-app.yml`)
Modeled after `Enterprise-Search/.github/workflows/build-ui.yml`:

```yaml
name: Build & Push - App

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build_and_push_to_ecr:
    runs-on: ubuntu-24.04

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and Push Docker Image to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: salon-booking-app
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest \
            .

          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
```

---

### 3.2 Deploy to AWS EC2 (`.github/workflows/deploy-ec2.yml`)
Modeled after `Enterprise-Search/.github/workflows/deploy-web.yml`:

```yaml
name: Deploy - AWS EC2

on:
  workflow_dispatch:
    inputs:
      imageTag:
        description: 'Image tag to deploy (Git commit SHA)'
        required: true
        default: 'latest'

jobs:
  deploy_to_ec2:
    runs-on: ubuntu-24.04

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup ECR Authentication on EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USERNAME }}
          key: ${{ secrets.VM_SSH_KEY }}
          port: ${{ secrets.VM_SSH_PORT }}
          script: |
            mkdir -p ~/salon-booking
            aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}

      - name: Copy Compose & Env to EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USERNAME }}
          key: ${{ secrets.VM_SSH_KEY }}
          port: ${{ secrets.VM_SSH_PORT }}
          source: "docker-compose.prod.yml,.env.production"
          target: "~/salon-booking/"

      - name: Restart Services with Zero Downtime
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USERNAME }}
          key: ${{ secrets.VM_SSH_KEY }}
          port: ${{ secrets.VM_SSH_PORT }}
          script: |
            cd ~/salon-booking

            # Update APP_IMAGE_TAG in .env
            if [ ! -f .env ]; then
              echo "APP_IMAGE_TAG=${{ github.event.inputs.imageTag }}" > .env
              echo "ECR_REGISTRY=${{ secrets.ECR_REGISTRY }}" >> .env
            else
              sed -i "s|^APP_IMAGE_TAG=.*|APP_IMAGE_TAG=${{ github.event.inputs.imageTag }}|" .env
            fi

            # Pull new image and restart container
            docker compose -f docker-compose.prod.yml pull app
            docker compose -f docker-compose.prod.yml up -d --no-deps app
            docker system prune -f

            echo "Deployment completed successfully!"
```

---

## 4. Environment Variables Specification (`.env.production`)

```env
# Application
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=https://booking.bonanzasalon.com
NEXTAUTH_SECRET=generate_with_openssl_rand_hex_32

# Database (PostgreSQL via Drizzle ORM)
DATABASE_URL=postgresql://salon_admin:secure_password@postgres:5432/salon_booking

# GraphQL
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql

# Multi-Tenancy & Brand Defaults
DEFAULT_TENANT_SLUG=bonanza
DEFAULT_TIMEZONE=Asia/Kolkata
```

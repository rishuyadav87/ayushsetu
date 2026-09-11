# AYUSH-SETU 🏛️ — Comprehensive Deployment Guide

This guide provides step-by-step instructions for deploying the entire AYUSH-SETU ecosystem, which consists of:
1. **Frontend**: React 18 + Vite + TailwindCSS (PWA)
2. **Backend**: Node.js + Express + Prisma ORM
3. **AI Engine**: Python FastAPI + PyTorch + Sentence-Transformers (`all-MiniLM-L6-v2`)
4. **Database**: PostgreSQL 16 with `pgvector` extension enabled
5. **Cache/Queue**: Redis 7

---

## Architecture Topology

```
                  ┌───────────────────────────────┐
                  │    Frontend (Vercel / Nginx)  │
                  │       React 18 + Vite PWA     │
                  └──────────────┬────────────────┘
                                 │ HTTPS / API
                                 ▼
                  ┌───────────────────────────────┐
                  │      Backend API (Render)     │
                  │   Node.js + Express + Prisma  │
                  └───────┬───────────────┬───────┘
                          │               │ HTTP
             SQL (Prisma) │               ▼
                          │   ┌───────────────────────────────┐
                          │   │       AI Engine (Render)      │
                          │   │  FastAPI + all-MiniLM-L6-v2   │
                          │   └───────────────┬───────────────┘
                          │                   │ SQL (pgvector <=> )
                          ▼                   ▼
                  ┌───────────────────────────────────────────┐
                  │          PostgreSQL 16 + pgvector         │
                  │  (Neon.tech / Supabase / Render Postgres) │
                  └───────────────────────────────────────────┘
```

---

## Option 1: Cloud Deployment (Recommended for Hackathons & Pitches)

Free-tier friendly, fully managed, zero DevOps maintenance.

### Phase 1: Deploy PostgreSQL with pgvector (Database)

Choose either **Neon.tech** or **Supabase** (both provide free managed Postgres with `pgvector` pre-installed):

#### Using Neon.tech (Fastest):
1. Sign up at [neon.tech](https://neon.tech).
2. Create a new project: `ayush-setu-db` (Postgres 16).
3. In the Neon Console SQL Editor, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy the connection string (Connection Details -> Connection string -> `postgresql://...`).

---

### Phase 2: Deploy the AI Engine (FastAPI)

Deploy on **Render.com** (or Railway):

1. Log in to [render.com](https://render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `ayush-setu-ai`
   - **Root Directory**: `ai-engine`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free or Starter (512MB - 1GB RAM)
4. Under **Environment Variables**, add:
   - `DATABASE_URL`: *Your Neon/PostgreSQL connection string*
   - `ALLOWED_ORIGINS`: `*` (or your frontend Vercel domain)
   - `PYTHONUNBUFFERED`: `1`
5. Click **Create Web Service**. Wait for the build to finish and copy your public URL:
   `https://ayush-setu-ai.onrender.com`

---

### Phase 3: Deploy the Backend API (Node.js + Express)

1. On [render.com](https://render.com), click **New +** -> **Web Service**.
2. Connect the same GitHub repository.
3. Configure the service:
   - **Name**: `ayush-setu-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && node prisma/seed.js`
   - **Start Command**: `node src/app.js`
   - **Instance Type**: Free or Starter
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: *Your Neon/PostgreSQL connection string*
   - `JWT_SECRET`: *Generate a strong 32-byte secret (e.g. `openssl rand -base64 32`)*
   - `JWT_EXPIRES_IN`: `7d`
   - `AI_ENGINE_URL`: `https://ayush-setu-ai.onrender.com` (from Phase 2)
5. Click **Create Web Service**.
6. Once deployed, run the raw SQL migration in your database to ensure pgvector columns exist:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS embedding vector(384);
   ALTER TABLE "PostedOpportunity" ADD COLUMN IF NOT EXISTS embedding vector(384);
   ```
7. Copy your backend public URL: `https://ayush-setu-api.onrender.com`

---

### Phase 4: Deploy Frontend (Vercel)

1. Log in to [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://ayush-setu-api.onrender.com`
   - `VITE_AI_URL`: `https://ayush-setu-ai.onrender.com`
5. Click **Deploy**.
6. Your live web application will be accessible at:
   `https://ayush-setu.vercel.app`

---

## Option 2: Full Stack Self-Hosted (Docker Compose on VPS / Cloud VM)

For deployment on any Linux VM (AWS EC2, DigitalOcean Droplet, GCP Compute Engine, Hetzner, etc.):

### 1. Provision Virtual Machine
- Recommended Specs: 2 vCPU, 4GB RAM, 25GB SSD (Ubuntu 22.04 LTS or 24.04 LTS).

### 2. Install Docker & Docker Compose
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone Repository & Setup Environment
```bash
git clone https://github.com/your-username/ayush-setu.git
cd ayush-setu

# Generate secure random secret for JWT
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" > .env
```

### 4. Build and Start All Containers
```bash
docker compose up -d --build
```

### 5. Run Database Migrations and Seed
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec -T postgres psql -U ayush -d ayush_setu -c "CREATE EXTENSION IF NOT EXISTS vector; ALTER TABLE \"StudentProfile\" ADD COLUMN IF NOT EXISTS embedding vector(384); ALTER TABLE \"PostedOpportunity\" ADD COLUMN IF NOT EXISTS embedding vector(384);"
docker compose exec backend node prisma/seed.js
```

### 6. Verify Services Status
```bash
docker compose ps
```
Your services will be running on:
- Frontend: `http://<SERVER_IP>:5173`
- Backend API: `http://<SERVER_IP>:5000`
- AI Engine: `http://<SERVER_IP>:8000`
- PostgreSQL: `localhost:5432`

---

## Environment Variables Reference

| Service | Variable Name | Example Value | Description |
| :--- | :--- | :--- | :--- |
| **Backend** | `PORT` | `5000` or `5001` | Express server listen port |
| **Backend** | `NODE_ENV` | `production` | Node environment |
| **Backend** | `DATABASE_URL` | `postgresql://ayush:secret@host:5432/ayush_setu` | Postgres connection string |
| **Backend** | `JWT_SECRET` | *(random 32 bytes base64)* | Required token signing secret |
| **Backend** | `JWT_EXPIRES_IN` | `7d` | Token lifespan |
| **Backend** | `AI_ENGINE_URL` | `https://ayush-setu-ai.onrender.com` | Internal or public AI Engine endpoint |
| **AI Engine**| `DATABASE_URL` | `postgresql://ayush:secret@host:5432/ayush_setu` | Same Postgres database connection |
| **AI Engine**| `ALLOWED_ORIGINS`| `https://ayush-setu.vercel.app,http://localhost:5173` | Allowed CORS origins list |
| **Frontend** | `VITE_API_URL` | `https://ayush-setu-api.onrender.com` | Base URL for Node.js REST API |
| **Frontend** | `VITE_AI_URL` | `https://ayush-setu-ai.onrender.com` | Direct AI Engine URL (if needed) |

---

## Verification & Health Checks

After deployment, perform these checks:

1. **AI Engine Health**:
   ```bash
   curl https://<YOUR_AI_URL>/health
   # Response: {"status":"healthy","service":"AYUSH-SETU AI Engine"}
   ```
2. **Backend Assessments Endpoint**:
   ```bash
   curl https://<YOUR_BACKEND_URL>/api/assessments
   # Response: List of NSQF assessments linked to SkillTaxonomy
   ```
3. **Frontend UI**:
   - Open frontend URL in browser.
   - Log in as demo student: `student@ayush.edu` / `password123`.
   - Browse Opportunities and check AI match recommendations with semantic badges.

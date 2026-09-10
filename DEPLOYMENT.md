# AYUSH-SETU Deployment Guide

## Option 1: Vercel + Render (Recommended for Hackathon)

### Frontend → Vercel
1. Push code to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Select `client/` as root directory
4. Add environment variable: `VITE_API_URL` = your Render backend URL
5. Deploy

### Backend → Render
1. Go to render.com → New Web Service
2. Connect GitHub repo
3. Root directory: `server/`
4. Build command: `npm install && npx prisma generate && npx prisma db push && node prisma/seed.js`
5. Start command: `node src/app.js`
6. Add env vars: JWT_SECRET (generate random), DATABASE_URL=file:./prisma/prod.db

### AI Engine → Render
1. New Web Service → root: `ai-engine/`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

## Option 2: Docker Compose (Self-hosted)
```bash
docker-compose up --build
```
Access at http://localhost

## Option 3: Local Development
See README.md

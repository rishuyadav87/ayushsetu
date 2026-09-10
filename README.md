# AYUSH-SETU 🏛️

**ONE PLATFORM, ONE ECOSYSTEM**

> A unified web platform connecting AYUSH students, academicians, institutions, and industry across the complete skill-development, internship, and placement lifecycle.

**PS ID 26044 | Team Tenet | Smart India Hackathon 2026**

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (React)                    │
│              Port 5173 · Vite + TailwindCSS            │
├──────────────────────────────────────────────────────┤
│          Backend (Node.js + Express)                   │
│       Port 5000 · JWT Auth · RBAC · Prisma             │
├──────────────────────────────────────────────────────┤
│           AI Engine (FastAPI)                           │
│    Port 8000 · Skill Gap · Matching · Analytics        │
├──────────────────────────────────────────────────────┤
│              Database (SQLite / PostgreSQL)             │
│           Prisma ORM · pgvector-ready                  │
└──────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm or yarn

### 1. Backend Setup
```bash
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### 2. AI Engine Setup
```bash
cd ai-engine
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:5173`

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Student | student@ayush.edu | password123 |
| Industry | industry@ayush.com | password123 |
| Academician | academician@ayush.edu | password123 |
| Institution | institution@ayush.edu | password123 |
| Admin | admin@ayush.gov.in | admin123 |

---

## 📋 Features

### 🧠 Skill Intelligence Layer
- Aptitude tests aligned to HSSC's NSQF Qualification Packs
- Technical + soft-skill profiling with radar charts
- AI-powered skill gap analysis
- Personalized course & career recommendations

### 🤝 Opportunity & Collaboration Hub
- Industry posts internships, live projects & jobs
- Academicians access FDPs and research tie-ups
- AI-matched opportunity recommendations
- One-click application with status tracking

### 📁 Digital Portfolio & Tracking
- Verified skills, certificates, and projects
- Mentor feedback & endorsements
- Application tracking dashboard
- PDF resume generation

### 📊 Analytics & Insights
- Skill demand vs supply heatmaps
- Institution readiness dashboards
- Placement outcome tracking
- Data-driven curriculum alignment

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express.js + Prisma |
| AI Engine | Python + FastAPI + scikit-learn |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT + bcrypt + RBAC |

---

## 📂 NSQF Qualification Packs

The platform's skill taxonomy is built on HSSC's NSQF-aligned AYUSH Qualification Packs:

1. **Ayurveda Dietician** (Level 4)
2. **Yoga Wellness Trainer** (Level 4)
3. **Cupping Therapy Assistant** (Level 3)
4. **Panchakarma Technician** (Level 4)
5. **Homeopathy Health Worker** (Level 3)
6. **Naturopathy Wellness Counselor** (Level 4)
7. **AYUSH Nursing Assistant** (Level 3)
8. **Siddha Therapy Assistant** (Level 3)

---

## 🗺️ Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **MVP** | Skill assessment + profiles | ✅ Built |
| **Pilot** | Matching + applications | ✅ Built |
| **Expand** | Academician & collaboration | 🔄 Planned |
| **Scale** | Analytics + integrations | 🔄 Planned |

---

*Built with ❤️ by Team Tenet for Smart India Hackathon 2026*

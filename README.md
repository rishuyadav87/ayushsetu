# AYUSH-SETU 🌿
### AI-Powered Competency & Career Progression Platform for the AYUSH Sector
**The Premier AYUSH Career Ecosystem**

AYUSH-SETU is a unified platform designed to bridge the gap between AYUSH graduates (Ayurveda, Yoga, Unani, Siddha, Homeopathy, Naturopathy) and industry requirements. By leveraging Generative AI, semantic vector search, and a robust NSQF-aligned competency framework, AYUSH-SETU ensures candidates are rigorously evaluated and perfectly matched to career opportunities.

---

## 🌟 Key Innovations

1. **On-Device AI Proctoring:** Client-side TensorFlow/MediaPipe implementation for continuous facial monitoring, multiple-face detection, and screen-share integrity checks, ensuring zero cheating during assessments without compromising privacy or burning server bandwidth.
2. **Generative AI Assessment Engine:** Uses Gemini API to dynamically generate context-aware, NSQF-aligned MCQs, eliminating static question banks and preventing memorization.
3. **Semantic Skill Matching:** Utilizes PostgreSQL `pgvector` and Gemini Text Embeddings to semantically match students to industry job postings based on their actual competency and skill graphs, rather than simple keyword matching.
4. **Comprehensive Hubs:** Dedicated portals for Students (assessments & portfolios), Industry (candidate search & hiring), Academicians (mentoring & research proposals), and Institutions (readiness analytics).

---

## 🏗️ System Architecture

- **Frontend:** React.js, Vite, TailwindCSS, Recharts. Responsive, fast, and mobile-friendly.
- **Backend:** Node.js, Express.js. Implements Role-Based Access Control (RBAC) and JWT authentication.
- **Database:** PostgreSQL with `pgvector` for vector embeddings, managed via Prisma ORM.
- **AI Services:** Gemini 1.5 Flash (Assessments, Chatbot, Gap Analysis) and Gemini Text Embeddings.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rishuyadav87/ayushsetu.git
   cd ayushsetu
   ```

2. **Setup the Backend:**
   ```bash
   cd server
   npm install
   # Create a .env file with DATABASE_URL, JWT_SECRET, and GEMINI_API_KEY
   npx prisma db push
   npx prisma db seed
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../client
   npm install
   # Create a .env file with VITE_API_URL=http://localhost:5000/api
   npm run dev
   ```

---

## 🛡️ Security & Integrity

- **Proctoring Engine:** Fully client-side via `client/src/proctoring/`. Uses MediaPipe face detection to continuously poll for face presence, multi-face violations, and off-screen gaze. Captures DOM events (visibilitychange, blur) to detect tab switching.
- **Role Isolation:** Prisma schema heavily isolates data. API endpoints are guarded by JWT middleware and strict `roleCheck` validations.

---

## 👥 Roles & Demo Credentials

When running locally after seeding the database (`npx prisma db seed`), you can log in with the following demo accounts (Password for all except admin is `password123`):
- **Student:** `student@ayush.edu`
- **Industry:** `industry@ayush.com`
- **Academician:** `academician@ayush.edu`
- **Institution:** `institution@ayush.edu`
- **Admin:** `admin@ayush.gov.in` (Password: `admin123`)

---
*Built with ❤️ for the AYUSH Community.*

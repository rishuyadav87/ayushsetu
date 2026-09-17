import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import assessmentRoutes from './routes/assessments.js';
import opportunityRoutes from './routes/opportunities.js';
import applicationRoutes from './routes/applications.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import skillProfileRoutes from './routes/skillProfile.js';
import badgesRoutes from './routes/badges.js';
import adminRoutes from './routes/admin.js';
import chatbotRoutes from './routes/chatbot.js';
import attemptRoutes from './routes/attempts.js';

dotenv.config();

// --- Startup validation ---
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
  process.exit(1);
}

const app = express();

app.use(cors());
// 2mb allows proctoring evidence snapshots to be submitted with a test
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/skill-profile', skillProfileRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/attempts', attemptRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'AYUSH-SETU API' }));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

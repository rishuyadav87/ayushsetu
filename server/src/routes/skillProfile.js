import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can access skill profile' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        assessmentResults: {
          where: { assessment: { isPractice: false } },
          include: {
            assessment: {
              include: {
                taxonomy: true
              }
            }
          }
        }
      }
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const taxonomyStats = {};
    let totalScore = 0;
    let totalMaxScore = 0;
    let lastUpdated = null;

    for (const result of studentProfile.assessmentResults) {
      const roleName = result.assessment.category || result.assessment.taxonomy?.roleName || result.assessment.title;
      if (!taxonomyStats[roleName]) {
        taxonomyStats[roleName] = { score: 0, maxScore: 0 };
      }
      taxonomyStats[roleName].score += result.score;
      taxonomyStats[roleName].maxScore += result.maxScore;

      totalScore += result.score;
      totalMaxScore += result.maxScore;

      if (!lastUpdated || new Date(result.completedAt) > new Date(lastUpdated)) {
        lastUpdated = result.completedAt;
      }
    }

    const categories = Object.keys(taxonomyStats).map(name => {
      const stats = taxonomyStats[name];
      return {
        name,
        score: stats.score,
        maxScore: stats.maxScore,
        percentage: stats.maxScore > 0 ? Math.round((stats.score / stats.maxScore) * 100) : 0
      };
    });

    const overallScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

    res.json({ categories, overallScore, lastUpdated });
  } catch (error) {
    next(error);
  }
});

router.get('/gap-analysis', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can access gap analysis' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        assessmentResults: {
          where: { assessment: { isPractice: false } },
          include: {
            assessment: {
              include: {
                taxonomy: true
              }
            }
          }
        }
      }
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const taxonomyStats = {};
    let totalScore = 0;
    let totalMaxScore = 0;

    for (const result of studentProfile.assessmentResults) {
      const roleName = result.assessment.category || result.assessment.taxonomy?.roleName || result.assessment.title;
      if (!taxonomyStats[roleName]) {
        taxonomyStats[roleName] = { score: 0, maxScore: 0 };
      }
      taxonomyStats[roleName].score += result.score;
      taxonomyStats[roleName].maxScore += result.maxScore;

      totalScore += result.score;
      totalMaxScore += result.maxScore;
    }

    const benchmark = 70;
    const gaps = [];

    for (const [roleName, stats] of Object.entries(taxonomyStats)) {
      const studentScore = stats.maxScore > 0 ? Math.round((stats.score / stats.maxScore) * 100) : 0;
      if (studentScore < benchmark) {
        const gap = benchmark - studentScore;
        let severity = 'low';
        let recommendation = `Consider taking beginner courses in ${roleName}.`;
        if (gap > 30) {
          severity = 'high';
          recommendation = `Urgent need for foundational training in ${roleName}.`;
        } else if (gap > 15) {
          severity = 'medium';
          recommendation = `Targeted practice needed in ${roleName}.`;
        }
        
        gaps.push({
          category: roleName,
          studentScore,
          benchmark,
          gap,
          severity,
          recommendation
        });
      }
    }

    const readinessScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

    res.json({ gaps, readinessScore });
  } catch (error) {
    next(error);
  }
});

export default router;

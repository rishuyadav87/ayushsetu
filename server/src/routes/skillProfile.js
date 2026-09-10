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
          include: {
            assessment: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const categoryStats = {};
    let totalScore = 0;
    let totalMaxScore = 0;
    let lastUpdated = null;

    for (const result of studentProfile.assessmentResults) {
      const categoryName = result.assessment.category.name;
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { score: 0, maxScore: 0 };
      }
      categoryStats[categoryName].score += result.score;
      categoryStats[categoryName].maxScore += result.maxScore;

      totalScore += result.score;
      totalMaxScore += result.maxScore;

      if (!lastUpdated || new Date(result.completedAt) > new Date(lastUpdated)) {
        lastUpdated = result.completedAt;
      }
    }

    const categories = Object.keys(categoryStats).map(name => {
      const stats = categoryStats[name];
      return {
        name,
        score: stats.score,
        maxScore: stats.maxScore,
        percentage: stats.maxScore > 0 ? (stats.score / stats.maxScore) * 100 : 0
      };
    });

    const overallScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

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
          include: {
            assessment: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const categoryStats = {};
    let totalScore = 0;
    let totalMaxScore = 0;

    for (const result of studentProfile.assessmentResults) {
      const categoryName = result.assessment.category.name;
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { score: 0, maxScore: 0 };
      }
      categoryStats[categoryName].score += result.score;
      categoryStats[categoryName].maxScore += result.maxScore;

      totalScore += result.score;
      totalMaxScore += result.maxScore;
    }

    const benchmark = 70;
    const gaps = [];

    for (const [category, stats] of Object.entries(categoryStats)) {
      const studentScore = stats.maxScore > 0 ? (stats.score / stats.maxScore) * 100 : 0;
      if (studentScore < benchmark) {
        const gap = benchmark - studentScore;
        let severity = 'low';
        let recommendation = `Consider taking beginner courses in ${category}.`;
        if (gap > 30) {
          severity = 'high';
          recommendation = `Urgent need for foundational training in ${category}.`;
        } else if (gap > 15) {
          severity = 'medium';
          recommendation = `Targeted practice needed in ${category}.`;
        }
        
        gaps.push({
          category,
          studentScore,
          benchmark,
          gap,
          severity,
          recommendation
        });
      }
    }

    const readinessScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    res.json({ gaps, readinessScore });
  } catch (error) {
    next(error);
  }
});

export default router;

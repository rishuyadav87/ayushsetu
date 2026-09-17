import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students have badges' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId }
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const badges = await prisma.badge.findMany({
      where: { studentId: studentProfile.id }
    });

    res.json(badges);
  } catch (error) {
    next(error);
  }
});

router.post('/check-and-award', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can be awarded badges' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        assessmentResults: {
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

    const existingBadges = await prisma.badge.findMany({
      where: { studentId: studentProfile.id }
    });
    const existingBadgeNames = new Set(existingBadges.map(b => b.name));

    const newBadgesToAward = [];
    const results = studentProfile.assessmentResults;

    // "First Steps"
    if (results.length >= 1 && !existingBadgeNames.has('First Steps')) {
      newBadgesToAward.push({
        studentId: studentProfile.id,
        name: 'First Steps',
        description: 'Completed your first assessment',
        icon: 'footprints'
      });
    }

    // "Assessment Champion"
    if (results.length >= 3 && !existingBadgeNames.has('Assessment Champion')) {
      newBadgesToAward.push({
        studentId: studentProfile.id,
        name: 'Assessment Champion',
        description: 'Completed 3 or more assessments',
        icon: 'trophy'
      });
    }

    // "Ayurveda Scholar" & "Yoga Master" & "Perfect Score"
    let perfectScoreAchieved = false;
    let ayurvedaScholarAchieved = false;
    let yogaMasterAchieved = false;

    for (const result of results) {
      const percentage = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
      if (percentage === 100) perfectScoreAchieved = true;

      const a = result.assessment;
      const categoryName = `${a.category || ''} ${a.taxonomy?.roleName || ''} ${a.title || ''}`.toLowerCase();
      if (categoryName.includes('ayurved') && percentage > 80) ayurvedaScholarAchieved = true;
      if (categoryName.includes('yoga') && percentage > 80) yogaMasterAchieved = true;
    }

    if (perfectScoreAchieved && !existingBadgeNames.has('Perfect Score')) {
      newBadgesToAward.push({
        studentId: studentProfile.id,
        name: 'Perfect Score',
        description: 'Scored 100% on any assessment',
        icon: 'star'
      });
    }

    if (ayurvedaScholarAchieved && !existingBadgeNames.has('Ayurveda Scholar')) {
      newBadgesToAward.push({
        studentId: studentProfile.id,
        name: 'Ayurveda Scholar',
        description: 'Scored >80% in an Ayurveda assessment',
        icon: 'leaf'
      });
    }

    if (yogaMasterAchieved && !existingBadgeNames.has('Yoga Master')) {
      newBadgesToAward.push({
        studentId: studentProfile.id,
        name: 'Yoga Master',
        description: 'Scored >80% in a Yoga assessment',
        icon: 'yin-yang'
      });
    }

    if (newBadgesToAward.length > 0) {
      await prisma.badge.createMany({
        data: newBadgesToAward
      });
    }

    const allBadges = await prisma.badge.findMany({
      where: { studentId: studentProfile.id }
    });

    res.json({
      message: newBadgesToAward.length > 0 ? `Awarded ${newBadgesToAward.length} new badges` : 'No new badges awarded',
      newBadges: newBadgesToAward,
      allBadges
    });
  } catch (error) {
    next(error);
  }
});

export default router;

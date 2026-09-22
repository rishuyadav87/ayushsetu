import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

const VALID_STATUSES = ['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'SELECTED', 'REJECTED'];

// ── Apply to opportunity ──────────────────────────────────────────────────────
router.post('/', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const { opportunityId, coverLetter } = req.body;

    if (!opportunityId) {
      return res.status(400).json({ message: 'opportunityId is required.' });
    }

    // Verify opportunity exists
    const opportunity = await prisma.postedOpportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found.' });
    }

    const existing = await prisma.application.findFirst({
      where: { studentId: req.user.userId, opportunityId }
    });

    if (existing) {
      return res.status(409).json({ message: 'Already applied' });
    }

    const application = await prisma.application.create({
      data: { studentId: req.user.userId, opportunityId, coverLetter }
    });

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

// ── List applications ─────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    if (role === 'STUDENT') {
      const applications = await prisma.application.findMany({
        where: { studentId: userId },
        include: { opportunity: true },
        orderBy: { appliedAt: 'desc' }
      });
      return res.json(applications);
    } else {
      const applications = await prisma.application.findMany({
        where: { opportunity: { postedById: userId } },
        include: {
          student: { select: { name: true, email: true } },
          opportunity: { select: { title: true } }
        },
        orderBy: { appliedAt: 'desc' }
      });
      return res.json(applications);
    }
  } catch (error) {
    next(error);
  }
});


router.put('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { opportunity: true }
    });

    if (!application) return res.status(404).json({ message: 'Not found' });
    if (application.opportunity.postedById !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;

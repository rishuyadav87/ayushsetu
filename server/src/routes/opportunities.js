import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

// List opportunities with filters
router.get('/', async (req, res, next) => {
  try {
    const { type, location, query } = req.query;
    
    const where = { status: 'OPEN' };
    if (type) where.type = type;
    if (location) where.location = { contains: location };
    if (query) where.title = { contains: query };

    const opportunities = await prisma.postedOpportunity.findMany({
      where,
      include: { postedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

// AI recommended opportunities (mocked)
router.get('/recommended', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
    // In a real scenario, use ML or vector search. For now, return top 3.
    const opportunities = await prisma.postedOpportunity.findMany({
      where: { status: 'OPEN' },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

// Create opportunity
router.post('/', authMiddleware, roleCheck(['INDUSTRY', 'ACADEMICIAN', 'INSTITUTION']), async (req, res, next) => {
  try {
    const data = req.body;
    if (data.skillsRequired) data.skillsRequired = JSON.stringify(data.skillsRequired);

    const opportunity = await prisma.postedOpportunity.create({
      data: {
        ...data,
        postedById: req.user.userId
      }
    });
    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
});

// Update opportunity
router.put('/:id', authMiddleware, roleCheck(['INDUSTRY', 'ACADEMICIAN', 'INSTITUTION']), async (req, res, next) => {
  try {
    const opportunity = await prisma.postedOpportunity.findUnique({ where: { id: req.params.id } });
    if (!opportunity || opportunity.postedById !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const data = req.body;
    if (data.skillsRequired) data.skillsRequired = JSON.stringify(data.skillsRequired);

    const updated = await prisma.postedOpportunity.update({
      where: { id: req.params.id },
      data
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get specific opportunity
router.get('/:id', async (req, res, next) => {
  try {
    const opportunity = await prisma.postedOpportunity.findUnique({
      where: { id: req.params.id },
      include: { postedBy: { select: { name: true, role: true } } }
    });
    if (!opportunity) return res.status(404).json({ message: 'Not found' });
    res.json(opportunity);
  } catch (error) {
    next(error);
  }
});

export default router;

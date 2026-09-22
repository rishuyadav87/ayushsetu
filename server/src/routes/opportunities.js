import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

const VALID_TYPES = ['INTERNSHIP', 'JOB', 'PROJECT', 'FDP', 'RESEARCH'];
const OPP_FIELDS = ['title', 'description', 'type', 'location', 'isRemote', 'requiredQpCodes', 'stipend', 'deadline', 'status'];

const pick = (obj, keys) => {
  const result = {};
  keys.forEach(k => { if (obj[k] !== undefined) result[k] = obj[k]; });
  return result;
};


router.get('/', async (req, res, next) => {
  try {
    const { type, location, query } = req.query;

    const where = { status: 'OPEN' };
    if (type) {
      if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: `type must be one of ${VALID_TYPES.join(', ')}` });
      where.type = type;
    }
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (query) where.title = { contains: query, mode: 'insensitive' };

    const opportunities = await prisma.postedOpportunity.findMany({
      where,
      include: { postedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

// ── AI Recommended ────────────────────────────────────────────────────────────
router.get('/recommended', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    try {
      const aiResponse = await fetch(`${aiEngineUrl}/api/ai/match-opportunities/${req.user.userId}`);
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        if (aiData.matches && aiData.matches.length > 0) {
          const oppIds = aiData.matches.map(m => m.opportunity_id);
          const opps = await prisma.postedOpportunity.findMany({
            where: { id: { in: oppIds }, status: 'OPEN' },
            include: { postedBy: { select: { name: true } } }
          });
          const oppMap = new Map(opps.map(o => [o.id, o]));
          const ranked = aiData.matches
            .map(m => {
              const opp = oppMap.get(m.opportunity_id);
              if (!opp) return null;
              return { ...opp, matchScore: m.match_score, matchReasons: m.match_reasons };
            })
            .filter(Boolean);
          return res.json(ranked);
        }
      }
    } catch (aiErr) {
      // AI engine unavailable — use DB fallback
    }

    const fallbackOpps = await prisma.postedOpportunity.findMany({
      where: { status: 'OPEN' },
      take: 4,
      include: { postedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(fallbackOpps);
  } catch (error) {
    next(error);
  }
});


router.post('/', authMiddleware, roleCheck(['INDUSTRY', 'ACADEMICIAN', 'INSTITUTION']), async (req, res, next) => {
  try {
    const safeData = pick(req.body, OPP_FIELDS);

    if (!safeData.title || !safeData.description || !safeData.type) {
      return res.status(400).json({ message: 'title, description, and type are required.' });
    }
    if (!VALID_TYPES.includes(safeData.type)) {
      return res.status(400).json({ message: `type must be one of ${VALID_TYPES.join(', ')}` });
    }
    if (safeData.requiredQpCodes) safeData.requiredQpCodes = JSON.stringify(safeData.requiredQpCodes);

    const opportunity = await prisma.postedOpportunity.create({
      data: { ...safeData, postedById: req.user.userId }
    });
    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
});


router.put('/:id', authMiddleware, roleCheck(['INDUSTRY', 'ACADEMICIAN', 'INSTITUTION']), async (req, res, next) => {
  try {
    const opportunity = await prisma.postedOpportunity.findUnique({ where: { id: req.params.id } });
    if (!opportunity || opportunity.postedById !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const safeData = pick(req.body, OPP_FIELDS);
    // Don't allow status change to invalid values
    if (safeData.status && !['OPEN', 'CLOSED'].includes(safeData.status)) {
      return res.status(400).json({ message: 'status must be OPEN or CLOSED.' });
    }
    if (safeData.requiredQpCodes) safeData.requiredQpCodes = JSON.stringify(safeData.requiredQpCodes);

    const updated = await prisma.postedOpportunity.update({ where: { id: req.params.id }, data: safeData });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ── Delete opportunity ────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, roleCheck(['INDUSTRY', 'ACADEMICIAN', 'INSTITUTION', 'ADMIN']), async (req, res, next) => {
  try {
    const opportunity = await prisma.postedOpportunity.findUnique({ where: { id: req.params.id } });
    if (!opportunity) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'ADMIN' && opportunity.postedById !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.postedOpportunity.delete({ where: { id: req.params.id } });
    res.json({ message: 'Opportunity deleted' });
  } catch (error) {
    next(error);
  }
});

// ── Get specific opportunity ──────────────────────────────────────────────────
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

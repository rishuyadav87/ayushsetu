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

// AI recommended opportunities (Real Semantic Matching via pgvector + Sentence-Transformers)
router.get('/recommended', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    try {
      const aiResponse = await fetch(`${aiEngineUrl}/api/ai/match-opportunities/${req.user.userId}`);
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        if (aiData.matches && aiData.matches.length > 0) {
          // Fetch full opportunity details including postedBy
          const oppIds = aiData.matches.map(m => m.opportunity_id);
          const opps = await prisma.postedOpportunity.findMany({
            where: { id: { in: oppIds }, status: 'OPEN' },
            include: { postedBy: { select: { name: true, email: true } } }
          });
          const oppMap = new Map(opps.map(o => [o.id, o]));
          // Merge AI match scores and explainable reasons in ranked order
          const ranked = aiData.matches
            .map(m => {
              const opp = oppMap.get(m.opportunity_id);
              if (!opp) return null;
              return {
                ...opp,
                matchScore: m.match_score,
                semanticSimilarity: m.semantic_similarity,
                eligibilityScore: m.eligibility_score,
                isEligible: m.is_eligible,
                matchReasons: m.match_reasons
              };
            })
            .filter(Boolean);
          return res.json(ranked);
        }
      }
    } catch (aiErr) {
      console.warn('AI Engine matching service unavailable, using database fallback:', aiErr.message);
    }

    // Database fallback if AI service is starting
    const fallbackOpps = await prisma.postedOpportunity.findMany({
      where: { status: 'OPEN' },
      take: 4,
      include: { postedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(fallbackOpps);
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

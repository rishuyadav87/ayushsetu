import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

const VALID_ROLES = ['STUDENT', 'INDUSTRY', 'ACADEMICIAN', 'INSTITUTION', 'ADMIN'];
const MAX_LIMIT = 100;

// ── GET /users (BUG-008: use roleCheck; BUG-019: cap limit; BUG-042: safe parseInt) ──
router.get('/users', authMiddleware, roleCheck(['ADMIN']), async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role && VALID_ROLES.includes(role)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ users, total, page: pageNum, limit: limitNum });
  } catch (error) {
    next(error);
  }
});

// ── PUT /users/:id/status (BUG-008: use roleCheck) ────────────────────────────
router.put('/users/:id/status', authMiddleware, roleCheck(['ADMIN']), async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// ── PUT /users/:id/role (BUG-008: roleCheck; BUG-033: prevent self-change) ────
router.put('/users/:id/role', authMiddleware, roleCheck(['ADMIN']), async (req, res, next) => {
  try {
    // BUG-033: Prevent admin from self-role-changing (could lock them out)
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Admins cannot change their own role.' });
    }

    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

export default router;

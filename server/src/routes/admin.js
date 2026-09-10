import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', authMiddleware, async (req, res, next) => {
  try {
    const { role: userRole } = req.user;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin only' });
    }

    const { search, role, page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ users, total, page: pageNum });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { role: userRole } = req.user;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin only' });
    }

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

router.put('/users/:id/role', authMiddleware, async (req, res, next) => {
  try {
    const { role: userRole } = req.user;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin only' });
    }

    const { role } = req.body;
    
    if (!['STUDENT', 'INDUSTRY', 'ACADEMICIAN', 'INSTITUTION', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
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

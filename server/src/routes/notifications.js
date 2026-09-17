import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', authMiddleware, async (req, res, next) => {
  try {
    const { count } = await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read', count });
  } catch (error) {
    next(error);
  }
});

// Post a notice to every active user of the selected roles (admin / institution)
router.post('/broadcast', authMiddleware, roleCheck(['ADMIN', 'INSTITUTION']), async (req, res, next) => {
  try {
    const { title, message, roles } = req.body || {};
    const allowedRoles = ['STUDENT', 'INDUSTRY', 'ACADEMICIAN', 'INSTITUTION', 'ADMIN'];
    const targetRoles = Array.isArray(roles) && roles.length ? roles.filter(r => allowedRoles.includes(r)) : allowedRoles;

    if (!title || String(title).trim().length < 3) return res.status(400).json({ message: 'Title must be at least 3 characters' });
    if (!message || String(message).trim().length < 3) return res.status(400).json({ message: 'Message is required' });
    if (!targetRoles.length) return res.status(400).json({ message: 'Select at least one audience' });

    const users = await prisma.user.findMany({ where: { role: { in: targetRoles }, isActive: true }, select: { id: true } });
    const { count } = await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        title: String(title).trim().slice(0, 150),
        message: String(message).trim().slice(0, 2000),
        type: 'NOTICE',
      })),
    });
    res.status(201).json({ message: `Notice sent to ${count} user(s)`, count });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data: { isRead: true }
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;

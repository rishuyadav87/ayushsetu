import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const ALLOWED_ROLES = ['STUDENT', 'INDUSTRY', 'ACADEMICIAN', 'INSTITUTION'];

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('FATAL: JWT_SECRET is not set.');
  return secret;
};

const generateToken = (userId, role) =>
  jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: '7d' });

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role, name, phone } = req.body;


    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: 'email, password, role, and name are required.' });
    }


    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }


    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role, name, phone },
    });

    if (role === 'STUDENT') {
      await prisma.studentProfile.create({ data: { userId: user.id } });
    } else if (role === 'INDUSTRY') {
      await prisma.industryProfile.create({ data: { userId: user.id, companyName: name } });
    } else if (role === 'ACADEMICIAN') {
      await prisma.academicianProfile.create({ data: { userId: user.id } });
    } else if (role === 'INSTITUTION') {
      await prisma.institutionProfile.create({ data: { userId: user.id, institutionName: name } });
    }

    const token = generateToken(user.id, user.role);
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    next(error);
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }


    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    next(error);
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, name: true, phone: true, avatar: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// ── Change Password ───────────────────────────────────────────────────────────
router.put('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required.' });
    }


    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }


    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.userId }, data: { password: hashedPassword } });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

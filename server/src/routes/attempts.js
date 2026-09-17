import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { safeParseJSON } from '../utils/helpers.js';
import {
  getStudentProfile, finalizeAttempt, finalizeStaleAttempts, sanitiseAnswers, sanitiseEvents,
  isDataImage, ATTEMPT_GRACE_MS,
} from '../services/assessmentService.js';

const router = express.Router();
const LIVE_ROLES = ['ADMIN', 'INSTITUTION', 'INDUSTRY', 'ACADEMICIAN'];
const ONLINE_WINDOW_MS = 45 * 1000;

const loadOwnAttempt = async (req, res) => {
  const profile = await getStudentProfile(req.user.userId);
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: req.params.attemptId },
    include: { assessment: { select: { id: true, questions: true, proctored: true, title: true } } },
  });
  if (!attempt || !profile || attempt.studentId !== profile.id) {
    res.status(404).json({ message: 'Attempt not found' });
    return null;
  }
  return attempt;
};

// Heartbeat: autosave answers, stream proctoring events + a small live thumbnail, sync the timer
router.post('/:attemptId/heartbeat', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const attempt = await loadOwnAttempt(req, res);
    if (!attempt) return;

    if (attempt.status !== 'IN_PROGRESS') {
      const terminated = safeParseJSON(attempt.events, []).some(e => e.type === 'TERMINATED_BY_PROCTOR');
      return res.json({ status: attempt.status, resultId: attempt.resultId, terminated });
    }

    const questions = safeParseJSON(attempt.assessment.questions, []);
    const { answers, events: newEvents, violationCount, snapshot, faceCount } = req.body || {};
    const merged = { ...safeParseJSON(attempt.answers, {}), ...sanitiseAnswers(answers, questions) };
    const events = [...safeParseJSON(attempt.events, []), ...sanitiseEvents(newEvents).slice(0, 50)].slice(-300);

    const now = Date.now();
    const expiresAt = new Date(attempt.expiresAt).getTime();

    await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        answers: JSON.stringify(merged),
        events: JSON.stringify(events),
        violationCount: Math.max(attempt.violationCount, parseInt(violationCount, 10) || 0),
        lastHeartbeatAt: new Date(),
        ...(isDataImage(snapshot, 40000) ? { lastSnapshot: snapshot } : {}),
        ...(Number.isInteger(faceCount) ? { faceCount } : {}),
      },
    });

    if (now > expiresAt + ATTEMPT_GRACE_MS) {
      const { summary } = await finalizeAttempt(attempt.id, { reason: 'TIME_UP' });
      return res.json({ status: 'SUBMITTED', result: summary });
    }

    res.json({ status: 'IN_PROGRESS', serverNow: new Date(now).toISOString(), remainingSec: Math.max(0, Math.round((expiresAt - now) / 1000)) });
  } catch (error) {
    next(error);
  }
});

// Submit (idempotent — safe for keepalive-on-close + normal submit)
router.post('/:attemptId/submit', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const attempt = await loadOwnAttempt(req, res);
    if (!attempt) return;
    const { answers, proctoring = {}, submitReason = 'MANUAL', timeTakenSec } = req.body || {};
    const { summary, alreadyClosed } = await finalizeAttempt(attempt.id, { reason: submitReason, answers, proctoring, timeTakenSec });
    res.json({ ...summary, alreadyClosed });
  } catch (error) {
    next(error);
  }
});

// Live monitoring dashboard: tests in progress right now
router.get('/live', authMiddleware, roleCheck(LIVE_ROLES), async (req, res, next) => {
  try {
    await finalizeStaleAttempts();
    const where = { status: 'IN_PROGRESS' };
    // Industry / academicians only see attempts on the tests they created
    if (!['ADMIN', 'INSTITUTION'].includes(req.user.role)) where.assessment = { createdById: req.user.userId };

    const attempts = await prisma.assessmentAttempt.findMany({
      where,
      include: {
        assessment: { select: { id: true, title: true, nsqfLevel: true, duration: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: [{ violationCount: 'desc' }, { startedAt: 'desc' }],
      take: 100,
    });
    const now = Date.now();
    res.json(attempts.map(a => {
      const events = safeParseJSON(a.events, []);
      return {
        id: a.id,
        studentName: a.student?.user?.name,
        studentEmail: a.student?.user?.email,
        assessment: a.assessment,
        startedAt: a.startedAt,
        expiresAt: a.expiresAt,
        remainingSec: Math.max(0, Math.round((new Date(a.expiresAt).getTime() - now) / 1000)),
        online: now - new Date(a.lastHeartbeatAt).getTime() < ONLINE_WINDOW_MS,
        lastHeartbeatAt: a.lastHeartbeatAt,
        violationCount: a.violationCount,
        faceCount: a.faceCount,
        resumeCount: a.resumeCount,
        answeredCount: Object.keys(safeParseJSON(a.answers, {})).length,
        snapshot: isDataImage(a.lastSnapshot, 40000) ? a.lastSnapshot : null,
        recentEvents: events.slice(-6).reverse(),
      };
    }));
  } catch (error) {
    next(error);
  }
});

// Proctor ends a live attempt (e.g. confirmed malpractice)
router.post('/:attemptId/terminate', authMiddleware, roleCheck(LIVE_ROLES), async (req, res, next) => {
  try {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: req.params.attemptId },
      include: { assessment: { select: { createdById: true } } },
    });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (!['ADMIN', 'INSTITUTION'].includes(req.user.role) && attempt.assessment.createdById !== req.user.userId) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ message: 'This attempt has already ended' });

    const reasonText = String(req.body?.reason || 'Terminated by proctor').slice(0, 200);
    const events = safeParseJSON(attempt.events, []);
    events.push({ type: 'TERMINATED_BY_PROCTOR', severity: 'high', message: reasonText, at: new Date().toISOString(), elapsedSec: Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000) });
    await prisma.assessmentAttempt.update({ where: { id: attempt.id }, data: { events: JSON.stringify(events) } });

    const { summary } = await finalizeAttempt(attempt.id, { reason: 'TERMINATED' });
    res.json({ message: 'Attempt terminated', result: summary });
  } catch (error) {
    next(error);
  }
});

export default router;

import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { safeParseJSON } from '../utils/helpers.js';
import { NSQF_LEVELS, getLevelInfo, isValidLevel } from '../utils/nsqf.js';
import { generateText, llmProvider, parseJSONResponse } from '../utils/llm.js';
import { BANK_TOPICS, generateFromBank, toShuffledQuestions } from '../utils/questionBank.js';
import {
  categoryOf, getStudentProfile, getStudentLevelProgress, normaliseQuestion,
  buildAttemptOrder, attemptQuestionsForClient, finalizeStaleAttempts, isDataImage,
} from '../services/assessmentService.js';

const router = express.Router();

const REVIEWER_ROLES = ['ADMIN', 'INSTITUTION'];
const MAX_QUESTIONS = 200;

const canManage = (user, assessment) =>
  user.role === 'ADMIN' || (assessment.createdById && assessment.createdById === user.userId);

// simple in-memory limiter for AI generation
const genHits = new Map();
const genLimited = (userId, max = 12, windowMs = 60 * 60 * 1000) => {
  const now = Date.now();
  const recent = (genHits.get(userId) || []).filter(t => now - t < windowMs);
  recent.push(now);
  genHits.set(userId, recent);
  return recent.length > max;
};

// ---------- catalogue ----------

// List assessments. Students also get their own practice sets, lock state and best score.
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { level, search } = req.query;
    const user = req.user;

    const visibility = [{ isPractice: false }];
    if (user) visibility.push({ isPractice: true, createdById: user.userId });

    const where = { OR: visibility };
    if (level) where.nsqfLevel = parseInt(level, 10);
    if (search) where.title = { contains: String(search), mode: 'insensitive' };

    const assessments = await prisma.assessment.findMany({
      where,
      include: { taxonomy: true },
      orderBy: [{ nsqfLevel: 'asc' }, { createdAt: 'asc' }],
    });

    let progress = null;
    const best = {};
    if (user?.role === 'STUDENT') {
      const profile = await getStudentProfile(user.userId);
      progress = await getStudentLevelProgress(profile?.id);
      const allResults = profile
        ? await prisma.assessmentResult.findMany({ where: { studentId: profile.id }, select: { assessmentId: true, percentage: true } })
        : [];
      for (const r of allResults) {
        const prev = best[r.assessmentId];
        best[r.assessmentId] = { attempts: (prev?.attempts || 0) + 1, bestPercentage: Math.max(prev?.bestPercentage ?? 0, r.percentage) };
      }
    }

    res.json(assessments.map(({ questions, ...rest }) => ({
      ...rest,
      category: categoryOf(rest),
      questionCount: safeParseJSON(questions, []).length,
      levelTitle: getLevelInfo(rest.nsqfLevel)?.title,
      locked: progress && !rest.isPractice ? rest.nsqfLevel > progress.unlockedUpTo : false,
      attempts: best[rest.id]?.attempts || 0,
      bestPercentage: best[rest.id]?.bestPercentage ?? null,
    })));
  } catch (error) {
    next(error);
  }
});

// NSQF level catalogue + the current student's progression
router.get('/levels', authMiddleware, async (req, res, next) => {
  try {
    const counts = await prisma.assessment.groupBy({ by: ['nsqfLevel'], where: { isPractice: false }, _count: true });
    const countMap = Object.fromEntries(counts.map(c => [c.nsqfLevel, c._count]));

    let progress = null;
    if (req.user.role === 'STUDENT') {
      const profile = await getStudentProfile(req.user.userId);
      const p = await getStudentLevelProgress(profile?.id);
      progress = { passedLevels: p.passedLevels, unlockedUpTo: p.unlockedUpTo };
    }

    res.json({
      levels: NSQF_LEVELS.map(l => ({
        ...l,
        assessmentCount: countMap[l.level] || 0,
        unlocked: progress ? l.level <= progress.unlockedUpTo : true,
        passed: progress ? progress.passedLevels.includes(l.level) : false,
      })),
      progress,
      aiTopics: BANK_TOPICS,
    });
  } catch (error) {
    next(error);
  }
});

// Qualification packs for the create form
router.get('/taxonomy', authMiddleware, async (req, res, next) => {
  try {
    const taxonomy = await prisma.skillTaxonomy.findMany({
      select: { qpCode: true, roleName: true, nsqfLevel: true },
      orderBy: { nsqfLevel: 'asc' },
    });
    res.json({ taxonomy, topics: BANK_TOPICS, aiProvider: llmProvider() || 'question-bank' });
  } catch (error) {
    next(error);
  }
});

// Question sets created by the current user (admins see all)
router.get('/mine', authMiddleware, async (req, res, next) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { createdById: req.user.userId };
    const sets = await prisma.assessment.findMany({
      where,
      include: { taxonomy: true, results: { select: { flagged: true, percentage: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sets.map(({ questions, results, ...rest }) => ({
      ...rest,
      category: categoryOf(rest),
      questionCount: safeParseJSON(questions, []).length,
      attemptCount: results.length,
      flaggedCount: results.filter(r => r.flagged).length,
      averagePercentage: results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : null,
    })));
  } catch (error) {
    next(error);
  }
});

// Flagged / proctored attempts (admin & institution)
router.get('/proctoring/reports', authMiddleware, roleCheck(REVIEWER_ROLES), async (req, res, next) => {
  try {
    await finalizeStaleAttempts();
    const flaggedOnly = req.query.flagged !== 'false';
    const results = await prisma.assessmentResult.findMany({
      where: flaggedOnly ? { OR: [{ flagged: true }, { violationCount: { gt: 0 } }] } : {},
      include: {
        assessment: { select: { id: true, title: true, nsqfLevel: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { completedAt: 'desc' },
      take: 200,
    });
    res.json(results.map(formatReportRow));
  } catch (error) {
    next(error);
  }
});

// Student's past results
router.get('/student/results', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const studentProfile = await getStudentProfile(req.user.userId);
    if (!studentProfile) return res.json([]);
    const results = await prisma.assessmentResult.findMany({
      where: { studentId: studentProfile.id },
      include: { assessment: { select: { id: true, title: true, nsqfLevel: true, category: true, isPractice: true } } },
      orderBy: { completedAt: 'desc' },
    });
    res.json(results.map(({ proctoringLog, answers, ...r }) => r));
  } catch (error) {
    next(error);
  }
});

// ---------- AI-generated level-wise tests ----------

const generationPrompt = ({ level, levelInfo, topic, taxonomy, count, difficulty, language }) => `You are an expert AYUSH educator and NSQF assessment designer for India.
Create ${count} multiple-choice questions for an NSQF Level ${level} assessment.
NSQF Level ${level} descriptor: ${levelInfo?.descriptor || ''}
Topic / skill area: ${topic || taxonomy?.roleName || 'AYUSH healthcare'}
${taxonomy ? `Qualification Pack: ${taxonomy.qpCode} — ${taxonomy.roleName}. Cover these competency units (NOS):\n${(Array.isArray(taxonomy.competencyUnits) ? taxonomy.competencyUnits : []).map(u => `- ${u.code}: ${u.name}`).join('\n')}` : ''}
Difficulty within the level: ${difficulty}.
Language: ${language === 'hi' ? 'Hindi (Devanagari script), keep standard technical terms recognisable' : 'English'}.

Rules:
- Every question must be factually correct according to standard AYUSH / Indian healthcare references; avoid controversial or unverifiable claims.
- Exactly 4 options, exactly one correct answer, no "all of the above" / "none of the above".
- Match the cognitive level to the NSQF level (lower levels: recall and routine practice; higher levels: application, judgement, supervision, research).
- Include a one-sentence explanation for the correct answer.
- Do not repeat questions.

Return ONLY JSON in this shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}`;

router.post('/generate', authMiddleware, async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'STUDENT';
    const { topic = '', qpCode = '', difficulty = 'medium', language = 'en' } = req.body || {};
    const count = Math.min(30, Math.max(3, parseInt(req.body?.count, 10) || 10));
    let level = parseInt(req.body?.nsqfLevel, 10);

    if (genLimited(req.user.userId)) return res.status(429).json({ message: 'AI generation limit reached. Please try again later.' });

    let taxonomy = null;
    if (qpCode) {
      taxonomy = await prisma.skillTaxonomy.findUnique({ where: { qpCode } });
      if (!taxonomy) return res.status(400).json({ message: `Unknown qualification pack ${qpCode}` });
      if (!level) level = taxonomy.nsqfLevel;
    }
    if (!isValidLevel(level)) return res.status(400).json({ message: 'NSQF level must be between 1 and 8' });

    if (isStudent) {
      const profile = await getStudentProfile(req.user.userId);
      const progress = await getStudentLevelProgress(profile?.id);
      if (level > progress.unlockedUpTo) {
        return res.status(403).json({ message: `Level ${level} is locked. You can generate practice tests up to Level ${progress.unlockedUpTo}.` });
      }
    }

    const safeTopic = String(topic).slice(0, 120);
    const levelInfo = getLevelInfo(level);
    let questions = [];
    let source = 'question-bank';
    let note = '';

    if (llmProvider()) {
      try {
        const { text, provider } = await generateText({
          system: 'You generate high-quality, factually accurate assessment questions and reply with strict JSON only.',
          message: generationPrompt({ level, levelInfo, topic: safeTopic, taxonomy, count, difficulty, language }),
          json: true,
          maxTokens: 6000,
          temperature: 0.5,
          timeoutMs: 60000,
        });
        const parsed = parseJSONResponse(text);
        const list = Array.isArray(parsed) ? parsed : parsed?.questions;
        const seen = new Set();
        questions = (Array.isArray(list) ? list : []).flatMap((q, i) => {
          try {
            const n = normaliseQuestion(q, i);
            const key = n.q.toLowerCase();
            if (seen.has(key)) return [];
            seen.add(key);
            return [n];
          } catch (_) {
            return [];
          }
        }).slice(0, count);
        source = provider;
      } catch (err) {
        console.warn('AI generation failed, using question bank:', err.message);
        note = 'The AI service was unavailable, so questions were drawn from the reviewed AYUSH question bank.';
      }
    }

    if (questions.length < Math.ceil(count / 2)) {
      const { items, widened } = generateFromBank({ nsqfLevel: level, topic: safeTopic || taxonomy?.roleName, count });
      const bankQuestions = toShuffledQuestions(items);
      questions = [...questions, ...bankQuestions.filter(b => !questions.some(q => q.q === b.q))].slice(0, count);
      if (source !== 'question-bank') note = 'Some questions were added from the reviewed AYUSH question bank.';
      else if (!note) note = llmProvider() ? note : 'Generated from the built-in reviewed AYUSH question bank (add GEMINI_API_KEY for fully AI-written tests).';
      if (widened) note += ` Only ${items.length} matching questions were available, so related topics/levels were included.`;
    }

    if (!questions.length) return res.status(422).json({ message: 'Could not generate questions for this level/topic. Try another topic.' });

    // Students: create a private practice test immediately (answers are never shown before the attempt)
    if (isStudent) {
      const assessment = await prisma.assessment.create({
        data: {
          title: `AI Practice · ${safeTopic || taxonomy?.roleName || 'Mixed topics'} (Level ${level})`,
          description: `AI-generated NSQF Level ${level} practice test (${difficulty}).`,
          qpCode: taxonomy?.qpCode || null,
          nsqfLevel: level,
          category: safeTopic || taxonomy?.roleName || 'AI Practice',
          questions: JSON.stringify(questions),
          duration: Math.max(5, questions.length),
          totalMarks: questions.length,
          passingPercent: 60,
          proctored: true,
          isPractice: true,
          source: 'AI',
          createdById: req.user.userId,
        },
      });
      return res.status(201).json({ assessmentId: assessment.id, questionCount: questions.length, source, note });
    }

    res.json({
      questions: questions.map(q => ({ question: q.q, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation || '' })),
      source,
      note,
      nsqfLevel: level,
    });
  } catch (error) {
    next(error);
  }
});

// ---------- create / delete ----------

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      title, description, qpCode, nsqfLevel, category, duration, totalMarks,
      passingPercent, proctored = true, questions, source = 'MANUAL',
    } = req.body || {};

    if (!title || String(title).trim().length < 3) return res.status(400).json({ message: 'Title must be at least 3 characters' });
    if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ message: 'Add at least one question' });
    if (questions.length > MAX_QUESTIONS) return res.status(400).json({ message: `A question set can have at most ${MAX_QUESTIONS} questions` });

    let normalised;
    try {
      normalised = questions.map(normaliseQuestion);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    let level = parseInt(nsqfLevel, 10);
    let taxonomy = null;
    if (qpCode) {
      taxonomy = await prisma.skillTaxonomy.findUnique({ where: { qpCode } });
      if (!taxonomy) return res.status(400).json({ message: `Unknown qualification pack ${qpCode}` });
      if (!level) level = taxonomy.nsqfLevel;
    }
    if (!isValidLevel(level)) return res.status(400).json({ message: 'NSQF level must be between 1 and 8' });

    const mins = parseInt(duration, 10) || Math.max(5, normalised.length);
    if (mins < 1 || mins > 300) return res.status(400).json({ message: 'Duration must be between 1 and 300 minutes' });

    const assessment = await prisma.assessment.create({
      data: {
        title: String(title).trim().slice(0, 200),
        description: description ? String(description).trim().slice(0, 1000) : null,
        qpCode: taxonomy?.qpCode || null,
        nsqfLevel: level,
        category: (category && String(category).trim().slice(0, 80)) || taxonomy?.roleName || null,
        questions: JSON.stringify(normalised),
        duration: mins,
        totalMarks: parseInt(totalMarks, 10) || normalised.length,
        passingPercent: Math.min(100, Math.max(1, parseInt(passingPercent, 10) || 60)),
        proctored: Boolean(proctored),
        isPractice: req.user.role === 'STUDENT',
        source: ['MANUAL', 'UPLOAD', 'AI'].includes(source) ? source : 'MANUAL',
        createdById: req.user.userId,
      },
    });

    if (!assessment.isPractice) {
      const students = await prisma.user.findMany({ where: { role: 'STUDENT', isActive: true }, select: { id: true } });
      if (students.length) {
        await prisma.notification.createMany({
          data: students.map(s => ({
            userId: s.id,
            title: 'New assessment available',
            message: `"${assessment.title}" (NSQF Level ${assessment.nsqfLevel}) has been published.`,
            type: 'ASSESSMENT',
          })),
        });
      }
    }

    const { questions: _q, ...rest } = assessment;
    res.status(201).json({ ...rest, questionCount: normalised.length });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    if (!canManage(req.user, assessment)) return res.status(403).json({ message: 'You can only delete question sets you created' });

    await prisma.assessmentAttempt.deleteMany({ where: { assessmentId: assessment.id } });
    await prisma.assessmentResult.deleteMany({ where: { assessmentId: assessment.id } });
    await prisma.assessment.delete({ where: { id: assessment.id } });
    res.json({ message: 'Question set deleted' });
  } catch (error) {
    next(error);
  }
});

// Attempts + proctoring reports for one assessment
router.get('/:id/reports', authMiddleware, async (req, res, next) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    if (!canManage(req.user, assessment) && !REVIEWER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not allowed to view reports for this assessment' });
    }
    await finalizeStaleAttempts({ assessmentId: assessment.id });
    const results = await prisma.assessmentResult.findMany({
      where: { assessmentId: assessment.id },
      include: {
        assessment: { select: { id: true, title: true, nsqfLevel: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { completedAt: 'desc' },
    });
    res.json({
      assessment: { id: assessment.id, title: assessment.title, nsqfLevel: assessment.nsqfLevel, questionCount: safeParseJSON(assessment.questions, []).length },
      results: results.map(formatReportRow),
    });
  } catch (error) {
    next(error);
  }
});

function formatReportRow(r) {
  const log = safeParseJSON(r.proctoringLog, {});
  return {
    id: r.id,
    assessment: r.assessment,
    studentName: r.student?.user?.name,
    studentEmail: r.student?.user?.email,
    score: r.score,
    maxScore: r.maxScore,
    percentage: r.percentage,
    violationCount: r.violationCount,
    flagged: r.flagged,
    autoSubmitted: r.autoSubmitted,
    submitReason: r.submitReason,
    timeTakenSec: r.timeTakenSec,
    completedAt: r.completedAt,
    events: Array.isArray(log.events) ? log.events : [],
    snapshots: Array.isArray(log.snapshots) ? log.snapshots.filter(s => isDataImage(s?.image)) : [],
    roomScan: Array.isArray(log.roomScan) ? log.roomScan.filter(s => isDataImage(s?.image)) : [],
    environment: log.environment || null,
    resumeCount: log.resumeCount || 0,
  };
}

// ---------- take ----------

// Assessment details for the instructions screen (no questions)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { taxonomy: true } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    if (assessment.isPractice && assessment.createdById !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'This practice set is private' });
    }

    let activeAttempt = null;
    if (req.user.role === 'STUDENT') {
      const profile = await getStudentProfile(req.user.userId);
      if (!assessment.isPractice) {
        const progress = await getStudentLevelProgress(profile?.id);
        if (assessment.nsqfLevel > progress.unlockedUpTo) {
          return res.status(403).json({
            locked: true,
            unlockedUpTo: progress.unlockedUpTo,
            message: `NSQF Level ${assessment.nsqfLevel} is locked. Pass a Level ${assessment.nsqfLevel - 1} assessment to unlock it.`,
          });
        }
      }
      if (profile) {
        activeAttempt = await prisma.assessmentAttempt.findFirst({
          where: { studentId: profile.id, assessmentId: assessment.id, status: 'IN_PROGRESS', expiresAt: { gt: new Date() } },
          select: { id: true, expiresAt: true },
        });
      }
    }

    const { questions, ...rest } = assessment;
    res.json({
      ...rest,
      category: categoryOf(assessment),
      levelTitle: getLevelInfo(assessment.nsqfLevel)?.title,
      questionCount: safeParseJSON(questions, []).length,
      activeAttempt,
    });
  } catch (error) {
    next(error);
  }
});

// Start (or resume) a proctored attempt
router.post('/:id/start', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { taxonomy: true } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    if (assessment.isPractice && assessment.createdById !== req.user.userId) return res.status(403).json({ message: 'This practice set is private' });

    const profile = await getStudentProfile(req.user.userId);
    if (!profile) return res.status(404).json({ message: 'Student profile not found' });

    if (!assessment.isPractice) {
      const progress = await getStudentLevelProgress(profile.id);
      if (assessment.nsqfLevel > progress.unlockedUpTo) return res.status(403).json({ locked: true, message: `NSQF Level ${assessment.nsqfLevel} is locked.` });
    }

    await finalizeStaleAttempts({ studentId: profile.id });

    const questions = safeParseJSON(assessment.questions, []);
    const environment = req.body?.environment && typeof req.body.environment === 'object'
      ? JSON.stringify(req.body.environment).slice(0, 4000) : null;

    // Only one live test at a time per student (stops parallel sittings on two devices)
    const other = await prisma.assessmentAttempt.findFirst({
      where: { studentId: profile.id, status: 'IN_PROGRESS', assessmentId: { not: assessment.id }, expiresAt: { gt: new Date() } },
      include: { assessment: { select: { title: true } } },
    });
    if (other) return res.status(409).json({ message: `Finish your ongoing test "${other.assessment.title}" first.` });

    let attempt = await prisma.assessmentAttempt.findFirst({
      where: { studentId: profile.id, assessmentId: assessment.id, status: 'IN_PROGRESS', expiresAt: { gt: new Date() } },
    });
    let resumed = false;

    if (attempt) {
      resumed = true;
      const events = safeParseJSON(attempt.events, []);
      events.push({ type: 'RESUMED', severity: assessment.proctored ? 'high' : 'low', message: 'Test window was closed or reloaded and the attempt was resumed', at: new Date().toISOString(), elapsedSec: Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000) });
      attempt = await prisma.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          resumeCount: { increment: 1 },
          violationCount: { increment: assessment.proctored ? 1 : 0 },
          events: JSON.stringify(events.slice(-300)),
          lastHeartbeatAt: new Date(),
        },
      });
    } else {
      const { questionOrder, optionOrder } = buildAttemptOrder(questions, assessment.proctored);
      attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: assessment.id,
          studentId: profile.id,
          expiresAt: new Date(Date.now() + assessment.duration * 60 * 1000),
          questionOrder: JSON.stringify(questionOrder),
          optionOrder: JSON.stringify(optionOrder),
          environment,
        },
      });
    }

    res.status(resumed ? 200 : 201).json({
      attemptId: attempt.id,
      resumed,
      serverNow: new Date().toISOString(),
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      answers: safeParseJSON(attempt.answers, {}),
      violationCount: attempt.violationCount,
      questions: attemptQuestionsForClient(questions, safeParseJSON(attempt.questionOrder, []), safeParseJSON(attempt.optionOrder, {})),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

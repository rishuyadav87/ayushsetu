import prisma from '../config/database.js';
import { safeParseJSON } from '../utils/helpers.js';
import { computeUnlockedLevel } from '../utils/nsqf.js';

export const FLAG_VIOLATION_THRESHOLD = 2;   // results with >= this many serious violations are flagged
export const ATTEMPT_GRACE_MS = 60 * 1000;   // network grace after the timer ends
export const ABANDON_AFTER_MS = 2 * 60 * 1000; // no heartbeat for this long after expiry => finalise
export const SUBMIT_REASONS = ['MANUAL', 'TIME_UP', 'MAX_VIOLATIONS', 'PAGE_CLOSED', 'ABANDONED', 'TERMINATED'];

export const categoryOf = (a) => a?.category || a?.taxonomy?.roleName || 'General';

export const getStudentProfile = (userId) => prisma.studentProfile.findUnique({ where: { userId } });

// Normalise one question into { q, options, correctIndex, explanation }
export const normaliseQuestion = (raw, idx) => {
  const text = String(raw?.q ?? raw?.question ?? raw?.text ?? '').trim();
  const options = Array.isArray(raw?.options)
    ? raw.options.map(o => String(o ?? '').trim()).filter(Boolean)
    : [];
  if (!text) throw new Error(`Question ${idx + 1}: question text is missing`);
  if (options.length < 2 || options.length > 6) throw new Error(`Question ${idx + 1}: needs between 2 and 6 options`);
  if (new Set(options.map(o => o.toLowerCase())).size !== options.length) throw new Error(`Question ${idx + 1}: options must be different`);

  let correctIndex = raw?.correctIndex ?? raw?.answer ?? raw?.correct;
  if (typeof correctIndex === 'string') {
    const val = correctIndex.trim();
    if (/^[A-Fa-f]$/.test(val)) correctIndex = val.toUpperCase().charCodeAt(0) - 65;
    else if (/^\d+$/.test(val) && !options.includes(val)) correctIndex = parseInt(val, 10) - 1; // 1-based in files
    else correctIndex = options.findIndex(o => o.toLowerCase() === val.toLowerCase());
  }
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    throw new Error(`Question ${idx + 1}: correct answer is missing or does not match an option`);
  }
  const explanation = raw?.explanation ? String(raw.explanation).trim().slice(0, 500) : undefined;
  return { q: text.slice(0, 1000), options: options.map(o => o.slice(0, 300)), correctIndex, ...(explanation ? { explanation } : {}) };
};

// Levels a student has passed (non-practice assessments only)
export const getStudentLevelProgress = async (studentProfileId) => {
  const [levelRows, results] = await Promise.all([
    prisma.assessment.findMany({ where: { isPractice: false }, select: { nsqfLevel: true }, distinct: ['nsqfLevel'] }),
    studentProfileId
      ? prisma.assessmentResult.findMany({
          where: { studentId: studentProfileId, assessment: { isPractice: false } },
          include: { assessment: { select: { nsqfLevel: true, passingPercent: true } } },
        })
      : [],
  ]);
  const availableLevels = levelRows.map(r => r.nsqfLevel);
  const passedLevels = results
    .filter(r => r.maxScore > 0 && (r.score / r.maxScore) * 100 >= r.assessment.passingPercent)
    .map(r => r.assessment.nsqfLevel);
  return {
    availableLevels,
    passedLevels: [...new Set(passedLevels)].sort((a, b) => a - b),
    unlockedUpTo: computeUnlockedLevel(availableLevels, passedLevels),
  };
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Per-attempt question and option order (shuffled for proctored tests so neighbours can't share "answer C")
export const buildAttemptOrder = (questions, randomise) => {
  const idx = questions.map((_, i) => i);
  const questionOrder = randomise ? shuffle(idx) : idx;
  const optionOrder = {};
  questions.forEach((q, i) => {
    const opts = q.options.map((_, k) => k);
    optionOrder[i] = randomise ? shuffle(opts) : opts;
  });
  return { questionOrder, optionOrder };
};

export const attemptQuestionsForClient = (questions, questionOrder, optionOrder) =>
  questionOrder.map(qi => ({
    id: qi,
    text: questions[qi].q ?? questions[qi].text,
    options: (optionOrder[qi] || questions[qi].options.map((_, k) => k)).map(oi => ({ id: oi, text: questions[qi].options[oi] })),
  }));

export const sanitiseAnswers = (answers, questions) => {
  const out = {};
  if (!answers || typeof answers !== 'object') return out;
  for (const [k, v] of Object.entries(answers)) {
    const qi = Number(k);
    const oi = Number(v);
    if (Number.isInteger(qi) && questions[qi] && Number.isInteger(oi) && oi >= 0 && oi < questions[qi].options.length) out[qi] = oi;
  }
  return out;
};

export const sanitiseEvents = (events) => (Array.isArray(events) ? events : [])
  .filter(e => e && typeof e.type === 'string')
  .slice(0, 500)
  .map(e => ({
    type: e.type.slice(0, 40),
    severity: e.severity === 'high' ? 'high' : 'low',
    message: String(e.message || e.type).slice(0, 160),
    ...(e.detail ? { detail: String(e.detail).slice(0, 160) } : {}),
    at: typeof e.at === 'string' ? e.at.slice(0, 40) : new Date().toISOString(),
    elapsedSec: Number.isFinite(Number(e.elapsedSec)) ? Math.round(Number(e.elapsedSec)) : 0,
  }));

export const isDataImage = (s, max = 60000) =>
  typeof s === 'string' && s.length < max && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);

/**
 * Close an attempt and create the result. Idempotent: returns the existing result if already closed.
 */
export const finalizeAttempt = async (attemptId, { reason = 'MANUAL', answers, proctoring = {}, timeTakenSec } = {}) => {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: { include: { taxonomy: true } }, student: true },
  });
  if (!attempt) throw Object.assign(new Error('Attempt not found'), { statusCode: 404 });

  if (attempt.status !== 'IN_PROGRESS' && attempt.resultId) {
    const existing = await prisma.assessmentResult.findUnique({ where: { id: attempt.resultId } });
    return { alreadyClosed: true, attempt, result: existing, summary: summariseResult(existing, attempt.assessment, null) };
  }

  const { assessment } = attempt;
  const questions = safeParseJSON(assessment.questions, []);
  const saved = sanitiseAnswers(safeParseJSON(attempt.answers, {}), questions);
  const finalAnswers = { ...saved, ...sanitiseAnswers(answers, questions) };

  const total = questions.length;
  let correct = 0;
  const review = questions.map((q, idx) => {
    const selected = finalAnswers[idx] ?? -1;
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) correct++;
    return { id: idx, selected, correctIndex: q.correctIndex, isCorrect };
  });
  const percentage = total ? Math.round((correct / total) * 100) : 0;
  const score = total ? Math.round((correct / total) * assessment.totalMarks) : 0;
  const passed = percentage >= assessment.passingPercent;

  // Merge server-side events (heartbeats) with the client's final log
  const serverEvents = safeParseJSON(attempt.events, []);
  const clientEvents = sanitiseEvents(proctoring.events);
  const seen = new Set();
  let events = [...serverEvents, ...clientEvents].filter(e => {
    const key = `${e.type}|${e.at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let finalReason = SUBMIT_REASONS.includes(reason) ? reason : 'MANUAL';
  const lateBy = Date.now() - new Date(attempt.expiresAt).getTime();
  if (finalReason === 'MANUAL' && lateBy > ATTEMPT_GRACE_MS) {
    finalReason = 'TIME_UP';
    events.push({ type: 'LATE_SUBMISSION', severity: 'high', message: `Submitted ${Math.round(lateBy / 1000)}s after the timer ended`, at: new Date().toISOString(), elapsedSec: 0 });
  }
  events = events.slice(-500);

  const seriousEvents = events.filter(e => e.severity === 'high').length;
  const violationCount = Math.max(seriousEvents, attempt.violationCount, parseInt(proctoring.violationCount, 10) || 0);
  const flagged = assessment.proctored && (
    violationCount >= FLAG_VIOLATION_THRESHOLD || ['MAX_VIOLATIONS', 'PAGE_CLOSED', 'ABANDONED', 'TERMINATED'].includes(finalReason)
  );
  const snapshots = (Array.isArray(proctoring.snapshots) ? proctoring.snapshots : [])
    .filter(s => isDataImage(s?.image)).slice(0, 8)
    .map(s => ({ type: String(s.type || 'SNAPSHOT').slice(0, 40), at: String(s.at || ''), image: s.image }));
  const roomScan = (Array.isArray(proctoring.roomScan) ? proctoring.roomScan : [])
    .filter(s => isDataImage(s?.image)).slice(0, 6)
    .map(s => ({ at: String(s.at || ''), image: s.image, objects: Array.isArray(s.objects) ? s.objects.slice(0, 10).map(String) : [] }));
  const summary = events.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {});
  const category = categoryOf(assessment);
  const before = assessment.isPractice ? null : await getStudentLevelProgress(attempt.studentId);

  const elapsed = timeTakenSec ?? Math.round((Math.min(Date.now(), new Date(attempt.expiresAt).getTime()) - new Date(attempt.startedAt).getTime()) / 1000);

  const result = await prisma.assessmentResult.create({
    data: {
      studentId: attempt.studentId,
      assessmentId: assessment.id,
      score,
      maxScore: assessment.totalMarks,
      percentage,
      answers: JSON.stringify(review.map(r => r.selected)),
      skillScores: JSON.stringify({ [category]: percentage }),
      violationCount,
      flagged,
      autoSubmitted: finalReason !== 'MANUAL',
      submitReason: finalReason,
      proctoringLog: JSON.stringify({
        events, snapshots, roomScan, summary,
        environment: safeParseJSON(attempt.environment, null),
        faceModel: proctoring.faceModel || null,
        resumeCount: attempt.resumeCount,
        attemptId: attempt.id,
      }),
      timeTakenSec: Number.isFinite(Number(elapsed)) ? Math.max(0, Math.round(Number(elapsed))) : null,
    },
  });

  await prisma.assessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      status: finalReason === 'ABANDONED' ? 'ABANDONED' : 'SUBMITTED',
      resultId: result.id,
      answers: JSON.stringify(finalAnswers),
      violationCount,
      events: JSON.stringify(events.slice(-200)),
      lastSnapshot: null,
    },
  });

  let levelUnlocked = null;
  if (before) {
    const after = await getStudentLevelProgress(attempt.studentId);
    if (after.unlockedUpTo > before.unlockedUpTo && after.availableLevels.includes(after.unlockedUpTo)) levelUnlocked = after.unlockedUpTo;
  }

  const notes = [{
    userId: attempt.student.userId,
    title: `Result: ${assessment.title}`,
    message: `You scored ${percentage}% (${passed ? 'Passed' : 'Not passed'})${flagged ? ' — this attempt was flagged by AI proctoring for review.' : '.'}`,
    type: 'ASSESSMENT_RESULT',
  }];
  if (levelUnlocked) notes.push({ userId: attempt.student.userId, title: `NSQF Level ${levelUnlocked} unlocked`, message: `Great work! Level ${levelUnlocked} assessments are now open for you.`, type: 'LEVEL_UNLOCK' });
  if (flagged && assessment.createdById && assessment.createdById !== attempt.student.userId) {
    notes.push({ userId: assessment.createdById, title: 'Proctoring alert', message: `An attempt on "${assessment.title}" was flagged with ${violationCount} violation(s).`, type: 'PROCTORING' });
  }
  await prisma.notification.createMany({ data: notes });

  return {
    alreadyClosed: false,
    attempt,
    result,
    summary: {
      ...summariseResult(result, assessment, levelUnlocked),
      correct,
      total,
      review: assessment.isPractice ? review : review.map(({ correctIndex, ...r }) => r),
    },
  };
};

export const summariseResult = (result, assessment, levelUnlocked) => (result ? {
  resultId: result.id,
  score: result.score,
  maxScore: result.maxScore,
  percentage: result.percentage,
  passed: result.percentage >= (assessment?.passingPercent ?? 60),
  passingPercent: assessment?.passingPercent ?? 60,
  flagged: result.flagged,
  violationCount: result.violationCount,
  submitReason: result.submitReason,
  levelUnlocked,
  correct: Math.round((result.percentage / 100) * safeParseJSON(assessment?.questions, []).length),
  total: safeParseJSON(assessment?.questions, []).length,
} : null);

// Finalise attempts whose timer ended and that stopped sending heartbeats
export const finalizeStaleAttempts = async (where = {}) => {
  const cutoff = new Date(Date.now() - ABANDON_AFTER_MS);
  const stale = await prisma.assessmentAttempt.findMany({
    where: { ...where, status: 'IN_PROGRESS', expiresAt: { lt: cutoff } },
    select: { id: true, lastHeartbeatAt: true },
  });
  for (const a of stale) {
    try {
      await finalizeAttempt(a.id, { reason: 'ABANDONED' });
    } catch (err) {
      console.warn('Could not finalise stale attempt', a.id, err.message);
    }
  }
  return stale.length;
};

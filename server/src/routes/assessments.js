import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { safeParseJSON } from '../utils/helpers.js';

const router = express.Router();

// List all assessments
router.get('/', async (req, res, next) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: { taxonomy: true }
    });
    // Don't send answers in list
    const safeAssessments = assessments.map(a => {
      const { questions, ...rest } = a;
      return rest;
    });
    res.json(safeAssessments);
  } catch (error) {
    next(error);
  }
});

// Get specific assessment
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { taxonomy: true }
    });
    
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    // Remove correctIndex before sending to client
    const parsedQuestions = safeParseJSON(assessment.questions);
    const safeQuestions = parsedQuestions.map(q => {
      const { correctIndex, ...rest } = q;
      return rest;
    });

    res.json({ ...assessment, questions: safeQuestions });
  } catch (error) {
    next(error);
  }
});

// Submit assessment
router.post('/:id/submit', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const { answers } = req.body; // Array of selected indices
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const questions = safeParseJSON(assessment.questions);
    let score = 0;

    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        score += (assessment.totalMarks / questions.length);
      }
    });

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });

    const result = await prisma.assessmentResult.create({
      data: {
        studentId: studentProfile.id,
        assessmentId: assessment.id,
        score: Math.round(score),
        maxScore: assessment.totalMarks,
        answers: JSON.stringify(answers),
      }
    });

    res.json({ result, score: Math.round(score) });
  } catch (error) {
    next(error);
  }
});

// Get student's past results
router.get('/student/results', authMiddleware, roleCheck(['STUDENT']), async (req, res, next) => {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
    const results = await prisma.assessmentResult.findMany({
      where: { studentId: studentProfile.id },
      include: { assessment: true }
    });
    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;

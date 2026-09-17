import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { safeParseJSON } from '../utils/helpers.js';

const router = express.Router();

// ── Whitelisted update fields per role (BUG-004: mass-assignment protection) ──
const STUDENT_UPDATABLE = ['specialization', 'institution', 'enrollmentYear', 'bio', 'resumeUrl', 'skills'];
const INDUSTRY_UPDATABLE = ['companyName', 'industry', 'website', 'description', 'location', 'logo'];
const ACADEMICIAN_UPDATABLE = ['institution', 'department', 'designation', 'expertise', 'bio'];
const INSTITUTION_UPDATABLE = ['institutionName', 'type', 'accreditation', 'location', 'website', 'description'];

const pick = (obj, keys) => {
  const result = {};
  keys.forEach(k => { if (obj[k] !== undefined) result[k] = obj[k]; });
  return result;
};

// ── Helper: parse JSON string fields back to their native types ──
const parseProfileFields = (profile) => {
  if (!profile) return profile;
  if (profile.skills) profile.skills = safeParseJSON(profile.skills) ?? profile.skills;
  if (profile.expertise) profile.expertise = safeParseJSON(profile.expertise) ?? profile.expertise;
  if (profile.technologies) profile.technologies = safeParseJSON(profile.technologies) ?? profile.technologies;
  return profile;
};

// ── GET /my-profile ───────────────────────────────────────────────────────────
router.get('/my-profile', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    let profile = null;

    if (role === 'STUDENT') {
      profile = await prisma.studentProfile.findUnique({ where: { userId }, include: { certificates: true, projects: true } });
    } else if (role === 'INDUSTRY') {
      profile = await prisma.industryProfile.findUnique({ where: { userId } });
    } else if (role === 'ACADEMICIAN') {
      profile = await prisma.academicianProfile.findUnique({ where: { userId } });
    } else if (role === 'INSTITUTION') {
      profile = await prisma.institutionProfile.findUnique({ where: { userId } });
    } else if (role === 'ADMIN') {
      return res.json({ message: 'Admins do not have extended profiles.' });
    }

    res.json(parseProfileFields(profile));
  } catch (error) {
    next(error);
  }
});

// ── PUT /my-profile ───────────────────────────────────────────────────────────
router.put('/my-profile', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    let updatedProfile = null;

    if (role === 'STUDENT') {
      // BUG-004: whitelist fields
      const updateData = pick(req.body, STUDENT_UPDATABLE);
      if (updateData.skills && Array.isArray(updateData.skills)) {
        updateData.skills = JSON.stringify(updateData.skills);
      }
      updatedProfile = await prisma.studentProfile.update({ where: { userId }, data: updateData });
    } else if (role === 'INDUSTRY') {
      const updateData = pick(req.body, INDUSTRY_UPDATABLE);
      updatedProfile = await prisma.industryProfile.update({ where: { userId }, data: updateData });
    } else if (role === 'ACADEMICIAN') {
      const updateData = pick(req.body, ACADEMICIAN_UPDATABLE);
      if (updateData.expertise && Array.isArray(updateData.expertise)) {
        updateData.expertise = JSON.stringify(updateData.expertise);
      }
      updatedProfile = await prisma.academicianProfile.update({ where: { userId }, data: updateData });
    } else if (role === 'INSTITUTION') {
      const updateData = pick(req.body, INSTITUTION_UPDATABLE);
      updatedProfile = await prisma.institutionProfile.update({ where: { userId }, data: updateData });
    }

    res.json(parseProfileFields(updatedProfile));
  } catch (error) {
    next(error);
  }
});

// ── GET /student/me ───────────────────────────────────────────────────────────
router.get('/student/me', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') return res.status(403).json({ message: 'Only students can access this route' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        certificates: true,
        projects: true,
        assessmentResults: {
          include: { assessment: { select: { title: true, category: true, nsqfLevel: true } } }
        }
      }
    });

    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const badges = await prisma.badge.findMany({ where: { studentId: profile.id } });

    res.json({ ...parseProfileFields(profile), badges });
  } catch (error) {
    next(error);
  }
});

// ── GET /student/resume-data ──────────────────────────────────────────────────
router.get('/student/resume-data', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') return res.status(403).json({ message: 'Only students can access this route' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            certificates: true,
            projects: true,
            assessmentResults: {
              where: { assessment: { isPractice: false } },
              include: { assessment: { include: { taxonomy: true } } }
            }
          }
        },
        applications: {
          // BUG-040: Only include non-rejected applications in resume
          where: { status: { not: 'REJECTED' } },
          include: { opportunity: { select: { title: true, type: true, location: true } } }
        }
      }
    });

    if (!user || !user.studentProfile) return res.status(404).json({ message: 'Profile not found' });

    const categoryStats = {};
    for (const result of user.studentProfile.assessmentResults) {
      const categoryName = result.assessment.category || result.assessment.taxonomy?.roleName || result.assessment.title;
      if (!categoryStats[categoryName]) categoryStats[categoryName] = { score: 0, maxScore: 0 };
      categoryStats[categoryName].score += result.score;
      categoryStats[categoryName].maxScore += result.maxScore;
    }

    const skills = Object.keys(categoryStats).map(category => ({
      category,
      percentage: categoryStats[category].maxScore > 0
        ? Math.round((categoryStats[category].score / categoryStats[category].maxScore) * 100) : 0
    }));

    res.json({
      user: { name: user.name, email: user.email, phone: user.phone },
      profile: {
        specialization: user.studentProfile.specialization,
        institution: user.studentProfile.institution,
        bio: user.studentProfile.bio
      },
      skills,
      certificates: user.studentProfile.certificates,
      projects: user.studentProfile.projects,
      applications: user.applications.map(app => ({
        opportunity: app.opportunity,
        status: app.status,
        appliedAt: app.appliedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /student/:id (BUG-010: add auth) ─────────────────────────────────────
router.get('/student/:id', authMiddleware, async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, avatar: true } }, // BUG-010: removed email from public view
        certificates: true,
        projects: true,
        assessmentResults: {
          include: { assessment: { select: { title: true, category: true, nsqfLevel: true } } }
        }
      }
    });

    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(parseProfileFields(profile));
  } catch (error) {
    next(error);
  }
});

// ── GET /search (BUG-011: add auth, BUG-024: case-insensitive) ───────────────
router.get('/search', authMiddleware, async (req, res, next) => {
  try {
    const { role, query } = req.query;
    let results = [];

    if (role === 'STUDENT') {
      results = await prisma.studentProfile.findMany({
        where: { user: { name: { contains: query || '', mode: 'insensitive' } } },
        include: { user: { select: { name: true } } }
      });
    } else if (role === 'INDUSTRY') {
      results = await prisma.industryProfile.findMany({
        where: { companyName: { contains: query || '', mode: 'insensitive' } }
      });
    }

    res.json(results.map(parseProfileFields));
  } catch (error) {
    next(error);
  }
});

// ── POST /certificates (BUG-021, BUG-022: validate required fields) ───────────
router.post('/certificates', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') return res.status(403).json({ message: 'Only students can add certificates' });

    const { title, issuer, issueDate, verificationUrl, description } = req.body;

    if (!title || !issuer || !issueDate) {
      return res.status(400).json({ message: 'title, issuer, and issueDate are required.' });
    }

    const parsedDate = new Date(issueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'issueDate is not a valid date.' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const certificate = await prisma.certificate.create({
      data: { studentId: studentProfile.id, title, issuer, issueDate: parsedDate, verificationUrl, description }
    });

    res.status(201).json(certificate);
  } catch (error) {
    next(error);
  }
});

// ── DELETE /certificates/:id ──────────────────────────────────────────────────
router.delete('/certificates/:id', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') return res.status(403).json({ message: 'Only students can delete certificates' });

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const certificate = await prisma.certificate.findUnique({ where: { id: req.params.id } });
    if (!certificate || certificate.studentId !== studentProfile.id) {
      return res.status(404).json({ message: 'Certificate not found or unauthorized' });
    }

    await prisma.certificate.delete({ where: { id: req.params.id } });
    res.json({ message: 'Certificate deleted' });
  } catch (error) {
    next(error);
  }
});

// ── POST /projects (BUG-023: validate required fields) ────────────────────────
router.post('/projects', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') return res.status(403).json({ message: 'Only students can add projects' });

    const { title, description, technologies, projectUrl, startDate, endDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required.' });
    }

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const project = await prisma.project.create({
      data: {
        studentId: studentProfile.id,
        title,
        description,
        technologies: technologies ? JSON.stringify(Array.isArray(technologies) ? technologies : technologies.split(',').map(t => t.trim())) : null,
        projectUrl,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// ── DELETE /projects/:id ──────────────────────────────────────────────────────
router.delete('/projects/:id', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') return res.status(403).json({ message: 'Only students can delete projects' });

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project || project.studentId !== studentProfile.id) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

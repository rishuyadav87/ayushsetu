import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { safeParseJSON } from '../utils/helpers.js';

const router = express.Router();

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

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/my-profile', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    const updateData = req.body;
    let updatedProfile = null;

    if (role === 'STUDENT') {
      if (updateData.skills && Array.isArray(updateData.skills)) {
        updateData.skills = JSON.stringify(updateData.skills);
      }
      updatedProfile = await prisma.studentProfile.update({ where: { userId }, data: updateData });
    } else if (role === 'INDUSTRY') {
      updatedProfile = await prisma.industryProfile.update({ where: { userId }, data: updateData });
    } else if (role === 'ACADEMICIAN') {
      if (updateData.expertise && Array.isArray(updateData.expertise)) {
        updateData.expertise = JSON.stringify(updateData.expertise);
      }
      updatedProfile = await prisma.academicianProfile.update({ where: { userId }, data: updateData });
    } else if (role === 'INSTITUTION') {
      updatedProfile = await prisma.institutionProfile.update({ where: { userId }, data: updateData });
    }

    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
});

// GET /api/profiles/student/me
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
    
    res.json({ ...profile, badges });
  } catch (error) {
    next(error);
  }
});

// GET /api/profiles/student/resume-data
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
          include: {
            opportunity: {
              select: { title: true, type: true, location: true }
            }
          }
        }
      }
    });

    if (!user || !user.studentProfile) return res.status(404).json({ message: 'Profile not found' });

    const categoryStats = {};
    for (const result of user.studentProfile.assessmentResults) {
      const categoryName = result.assessment.category || result.assessment.taxonomy?.roleName || result.assessment.title;
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { score: 0, maxScore: 0 };
      }
      categoryStats[categoryName].score += result.score;
      categoryStats[categoryName].maxScore += result.maxScore;
    }

    const skills = Object.keys(categoryStats).map(category => ({
      category,
      percentage: categoryStats[category].maxScore > 0 ? Math.round((categoryStats[category].score / categoryStats[category].maxScore) * 100) : 0
    }));

    const resumeData = {
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
    };

    res.json(resumeData);
  } catch (error) {
    next(error);
  }
});

// GET /api/profiles/student/:id (Existing)
router.get('/student/:id', async (req, res, next) => {
  try {
    if (req.params.id === 'me' || req.params.id === 'resume-data') return next();
    
    const profile = await prisma.studentProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        certificates: true,
        projects: true,
        assessmentResults: { include: { assessment: true } }
      }
    });

    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const { role, query } = req.query;
    let results = [];

    if (role === 'STUDENT') {
      results = await prisma.studentProfile.findMany({
        where: { user: { name: { contains: query || '' } } },
        include: { user: { select: { name: true } } }
      });
    } else if (role === 'INDUSTRY') {
      results = await prisma.industryProfile.findMany({
        where: { companyName: { contains: query || '' } }
      });
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Certificates CRUD
router.post('/certificates', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') return res.status(403).json({ message: 'Only students can add certificates' });

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const { title, issuer, issueDate, verificationUrl, description } = req.body;
    
    const certificate = await prisma.certificate.create({
      data: {
        studentId: studentProfile.id,
        title,
        issuer,
        issueDate: new Date(issueDate),
        verificationUrl,
        description
      }
    });

    res.status(201).json(certificate);
  } catch (error) {
    next(error);
  }
});

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

// Projects CRUD
router.post('/projects', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'STUDENT') return res.status(403).json({ message: 'Only students can add projects' });

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const { title, description, technologies, projectUrl, startDate, endDate } = req.body;
    
    const project = await prisma.project.create({
      data: {
        studentId: studentProfile.id,
        title,
        description,
        technologies: technologies ? JSON.stringify(technologies) : null,
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

import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { PLATFORM_OVERVIEW, searchKnowledge, matchPages } from '../utils/chatKnowledge.js';
import { generateText, llmProvider } from '../utils/llm.js';

const router = express.Router();

// ---- simple per-user rate limit (in memory) ----
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map();
const rateLimited = (userId) => {
  const now = Date.now();
  const recent = (hits.get(userId) || []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(userId, recent);
  return recent.length > MAX_PER_WINDOW;
};

const ROLE_LABEL = {
  STUDENT: 'student', INDUSTRY: 'industry partner', ACADEMICIAN: 'academician', INSTITUTION: 'institution', ADMIN: 'administrator',
};

const NAV_TOKEN = /\[\[NAV:(\/[^\]|\s]+)(?:\|([^\]]+))?\]\]/g;

// Small, safe snapshot of the user's own data so answers can be personal ("what is my score?")
const buildUserContext = async (user) => {
  const lines = [];
  try {
    const unread = await prisma.notification.count({ where: { userId: user.userId, isRead: false } });
    lines.push(`Unread notices: ${unread}`);
    if (user.role === 'STUDENT') {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: user.userId } });
      if (profile) {
        const results = await prisma.assessmentResult.findMany({
          where: { studentId: profile.id },
          include: { assessment: { select: { title: true, nsqfLevel: true, passingPercent: true } } },
          orderBy: { completedAt: 'desc' },
          take: 5,
        });
        if (results.length) {
          lines.push('Recent assessment results: ' + results.map(r =>
            `${r.assessment.title} (Level ${r.assessment.nsqfLevel}): ${r.percentage}%${r.percentage >= r.assessment.passingPercent ? ' passed' : ' not passed'}${r.flagged ? ', flagged by proctoring' : ''}`
          ).join('; '));
        } else {
          lines.push('The student has not taken any assessment yet.');
        }
        const apps = await prisma.application.count({ where: { studentId: user.userId } });
        lines.push(`Applications submitted: ${apps}`);
      }
    } else {
      const sets = await prisma.assessment.count({ where: { createdById: user.userId } });
      lines.push(`Question sets uploaded by this user: ${sets}`);
    }
  } catch (_) {
    // context is optional
  }
  return lines.join('\n');
};

const systemPrompt = ({ name, role, language, pages, currentPath, userContext }) => `You are "Setu Sahayak", the friendly in-app assistant of AYUSH-SETU.
You are talking to ${name || 'a user'}, who is logged in as a ${ROLE_LABEL[role] || 'user'}. They are currently on ${currentPath || 'an unknown page'}.

Your two jobs:
1. NAVIGATION — guide the user to where a feature lives. Only use pages from this list (they are the only pages this user can open):
${pages.map(p => `- ${p.label}: ${p.path} — ${p.description || ''}`).join('\n')}
Whenever you point to a page, add a token exactly like [[NAV:/path|Label]] (for example [[NAV:${pages[0]?.path || '/'}|${pages[0]?.label || 'Dashboard'}]]). Never invent paths.
2. DOUBTS — answer questions about the platform, AYUSH systems (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Sowa-Rigpa, Homoeopathy), NSQF, study topics, careers, internships and interviews.

About the platform:
${PLATFORM_OVERVIEW}

User data (private to this user):
${userContext || 'n/a'}

Rules:
- Be concise: at most 6 short sentences or a short bullet list. Use simple words.
- Reply in ${language === 'hi' ? 'Hindi (Devanagari), keeping technical terms in English where clearer' : 'the same language the user writes in (default English)'}.
- Academic integrity: never give answers to a live or upcoming assessment question, and never explain how to bypass proctoring. Offer to explain the underlying concept instead.
- For medical questions give general educational information only and advise consulting a qualified AYUSH practitioner or doctor for personal treatment.
- If you are unsure, say so honestly.`;

// ---- offline fallback ----
const offlineReply = (message, pages, language) => {
  const kb = searchKnowledge(message);
  const suggested = matchPages(message, pages);
  const hi = language === 'hi';

  if (/^\s*(hi|hello|hey|namaste|namaskar|नमस्ते)\b/i.test(message)) {
    return {
      reply: hi
        ? 'नमस्ते! मैं सेतु सहायक हूँ। मैं आपको पेज तक पहुँचा सकता हूँ (जैसे टेस्ट, नोटिस) और आपके सवालों के जवाब दे सकता हूँ।'
        : 'Namaste! I\'m Setu Sahayak. I can take you to any feature (tests, notices, opportunities…) and answer your doubts about AYUSH, NSQF and this platform.',
      pages: [],
    };
  }
  if (kb) return { reply: kb.answer, pages: suggested };
  if (suggested.length) {
    return {
      reply: hi ? `आप यह ${suggested[0].label} पेज पर कर सकते हैं।` : `You can find that under ${suggested.map(p => p.label).join(' or ')}.`,
      pages: suggested,
    };
  }
  return {
    reply: hi
      ? 'माफ़ कीजिए, मुझे इसका पक्का जवाब नहीं पता। आप "टेस्ट कहाँ हैं?", "नोटिस खोलो" या "NSQF क्या है?" पूछ सकते हैं।'
      : 'Sorry, I don\'t have a confident answer to that yet. Try asking things like "Where are the tests?", "Open notices", "How do I upload a question set?" or "What is NSQF?".',
    pages: [],
  };
};

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { message, history = [], language = 'en', currentPath = '', pages: rawPages = [] } = req.body || {};
    const text = String(message || '').trim();
    if (!text) return res.status(400).json({ message: 'Message is required' });
    if (text.length > 1000) return res.status(400).json({ message: 'Message is too long (max 1000 characters)' });
    if (rateLimited(req.user.userId)) return res.status(429).json({ message: 'Too many messages. Please wait a minute.' });

    // Only accept pages inside the user's own role area
    const rolePrefix = `/${String(req.user.role).toLowerCase()}`;
    const pages = (Array.isArray(rawPages) ? rawPages : [])
      .filter(p => typeof p?.path === 'string' && (p.path === rolePrefix || p.path.startsWith(`${rolePrefix}/`)))
      .slice(0, 30)
      .map(p => ({
        label: String(p.label || '').slice(0, 60),
        path: p.path.slice(0, 120),
        description: String(p.description || '').slice(0, 160),
        keywords: Array.isArray(p.keywords) ? p.keywords.slice(0, 30).map(k => String(k).slice(0, 40)) : [],
      }));
    const validPaths = new Set(pages.map(p => p.path));

    const cleanHistory = (Array.isArray(history) ? history : [])
      .filter(h => ['user', 'assistant'].includes(h?.role) && typeof h?.content === 'string')
      .slice(-10)
      .map(h => ({ role: h.role, content: h.content.slice(0, 1500) }));

    // Academic integrity: the assistant is switched off while the student has a live test
    if (req.user.role === 'STUDENT') {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId }, select: { id: true } });
      const live = profile && await prisma.assessmentAttempt.findFirst({
        where: { studentId: profile.id, status: 'IN_PROGRESS', expiresAt: { gt: new Date() } },
      });
      if (live) {
        let events = [];
        try { events = JSON.parse(live.events || '[]'); } catch (_) { events = []; }
        events.push({ type: 'AI_ASSISTANT_DURING_TEST', severity: 'high', message: 'Tried to use the AI assistant during a live test (possibly from another tab or device)', at: new Date().toISOString(), elapsedSec: Math.round((Date.now() - new Date(live.startedAt).getTime()) / 1000) });
        await prisma.assessmentAttempt.update({ where: { id: live.id }, data: { events: JSON.stringify(events.slice(-300)), violationCount: { increment: 1 } } });
        return res.json({ reply: 'The assistant is disabled while your test is in progress. This attempt has been recorded by the proctoring system.', actions: [], source: 'integrity' });
      }
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { name: true } });

    let reply = '';
    let source = 'offline';
    let actions = [];

    const provider = llmProvider();
    if (provider) {
      try {
        const system = systemPrompt({
          name: user?.name, role: req.user.role, language, pages, currentPath,
          userContext: await buildUserContext(req.user),
        });
        const { text: raw } = await generateText({ system, history: cleanHistory, message: text, maxTokens: 700 });
        if (raw) {
          const seen = new Set();
          reply = raw.replace(NAV_TOKEN, (_, path, label) => {
            if (validPaths.has(path) && !seen.has(path)) {
              seen.add(path);
              actions.push({ label: (label || pages.find(p => p.path === path)?.label || 'Open').trim(), path });
            }
            return label ? `**${label.trim()}**` : '';
          }).trim();
          source = provider;
        }
      } catch (err) {
        console.warn('Chatbot LLM call failed, using offline answers:', err.message);
      }
    }

    if (!reply) {
      const off = offlineReply(text, pages, language);
      reply = off.reply;
      actions = off.pages.map(p => ({ label: p.label, path: p.path }));
    }

    res.json({ reply, actions: actions.slice(0, 3), source });
  } catch (error) {
    next(error);
  }
});

export default router;

// Offline knowledge base for the AYUSH-SETU assistant.
// Used when no LLM API key is configured (or the LLM call fails), so the chatbot
// always works during demos without internet access.

export const PLATFORM_OVERVIEW = `AYUSH-SETU is a unified portal for academia–industry collaboration in the AYUSH sector: skill mapping, NSQF-aligned assessments, internships and placements for students, academicians, institutions, industry and administrators.
Key features:
- NSQF level-wise tests (Levels 1–8 as notified by NCVET in 2023). A student starts at the lowest available level; passing a Level N test unlocks Level N+1. The "Level-wise Tests" page shows the roadmap.
- Two ways to create tests: upload/create questions yourself (CSV, JSON or manual) or generate an AI level-wise test and review it before publishing. Students can generate AI practice tests for unlocked levels.
- AI proctoring: camera + microphone, face detection and recognition, extra-person and mobile-phone detection, gaze tracking, voice/background-speech detection, entire-screen sharing with screen-sync verification, full-screen lock, tab/app switch and focus tracking, remote-desktop / virtual-machine / automation checks, copy-paste and shortcut blocking, room scan, watermarking and live monitoring by proctors. After 5 serious violations the test is auto-submitted and flagged.
- Skill Profile bar chart with gap analysis and PDF report; AI-matched internships and jobs; portfolio with DigiLocker KYC; notices and announcements.
CSV format for question sets: question, option1..option6, correct (A-F, 1-6 or the option text), explanation (optional).`;

// Each entry: keywords to match (lower-case) + a concise answer.
export const KNOWLEDGE = [
  {
    keywords: ['nsqf', 'national skills qualification', 'qualification framework'],
    answer: 'NSQF (National Skills Qualifications Framework), revised and notified by NCVET in June 2023, organises qualifications into eight levels described by knowledge, skills, employability, learning outcomes and responsibility — from routine supervised tasks at Level 1 to expert, strategic work at Level 8. On AYUSH-SETU every assessment is tagged with an NSQF level, and passing a Level N test unlocks Level N+1.',
  },
  {
    keywords: ['unlock', 'locked', 'next level', 'level lock', 'progression'],
    answer: 'Levels unlock progressively: the lowest available level is always open, and passing (scoring at or above the pass mark in) any assessment at Level N unlocks Level N+1. Open Level-wise Tests to see the roadmap. AI practice tests and practice sets you create do not count towards progression.',
  },
  {
    keywords: ['proctor', 'proctoring', 'cheat', 'cheating', 'violation', 'camera', 'webcam', 'full screen', 'fullscreen', 'tab switch', 'face'],
    answer: 'Assessments are AI-proctored: camera and microphone stay on, you share your entire screen, and the test runs in full screen until you submit. The AI checks that only you are present, watches for mobile phones and background voices, and records tab/app switches, remote-desktop tools and loss of focus. After 5 serious violations the test is auto-submitted and flagged. Tips: sit alone in a quiet, well-lit room, keep your phone away, close other apps and use a single monitor.',
  },
  {
    keywords: ['ai test', 'ai generated', 'generate test', 'ai practice', 'practice test'],
    answer: 'Open Upload Question Set and choose "Generate with AI": pick the NSQF level, topic or qualification pack, number of questions and difficulty, then review and edit the questions before publishing. Students can generate an AI practice test for any unlocked level from the Level-wise Tests page.',
  },
  {
    keywords: ['upload', 'question set', 'question paper', 'csv', 'json', 'create test', 'add questions'],
    answer: 'Open Upload Question Set, fill in the title, NSQF level, duration and pass mark, then either drop a CSV/JSON file or add questions manually. CSV columns: question, option1…option6, correct (A–F, 1–6 or the option text) and an optional explanation. You can download a ready template from the upload page. Students can create private practice sets the same way.',
  },
  {
    keywords: ['dosha', 'doshas', 'tridosha', 'vata', 'pitta', 'kapha', 'kaphā'],
    answer: 'Ayurveda describes three Doshas: Vata (movement, associated with air and space), Pitta (transformation — digestion and metabolism, associated with fire) and Kapha (structure and stability, associated with earth and water). Health is understood as their balance for the individual\'s constitution (Prakriti).',
  },
  {
    keywords: ['rasa', 'rasas', 'taste', 'tastes', 'shad rasa'],
    answer: 'Ayurveda describes six Rasas (tastes): Madhura (sweet), Amla (sour), Lavana (salty), Katu (pungent), Tikta (bitter) and Kashaya (astringent). Diet plans balance them according to the person\'s constitution and digestive capacity (Agni).',
  },
  {
    keywords: ['agni', 'digestive fire', 'mandagni', 'jatharagni'],
    answer: 'Agni is the digestive and metabolic fire. Jatharagni is the main digestive fire; Mandagni means weak digestion and Tikshnagni means excessively strong digestion. Assessing Agni is central to building an individual Ayurvedic diet plan.',
  },
  {
    keywords: ['panchakarma', 'abhyanga', 'swedana', 'shirodhara', 'pichu'],
    answer: 'Common Panchakarma (therapy) procedures include Abhyanga (therapeutic oil massage), Swedana (therapeutic sudation/steam), Shirodhara (a continuous stream of medicated liquid over the forehead) and Pichu (a cotton pad soaked in medicated oil placed over a body part). Technicians verify the prescription and consent before therapy and follow infection-control and biomedical waste rules.',
  },
  {
    keywords: ['pathya', 'apathya', 'viruddha', 'incompatible food'],
    answer: 'Pathya is the wholesome diet and regimen suited to a patient; Apathya is what should be avoided. Viruddha Ahara means incompatible food combinations that Ayurveda advises against.',
  },
  {
    keywords: ['biomedical waste', 'waste', 'yellow bin', 'sharps', 'infection control'],
    answer: 'In Indian biomedical waste practice, soiled infectious waste (used cotton, dressings) goes in the yellow bin and sharps such as needles go into a puncture-proof sharps container. Always wear gloves, segregate at source and wash hands between clients.',
  },
  {
    keywords: ['ayush', 'systems of medicine', 'unani', 'siddha', 'homeopathy', 'naturopathy', 'sowa rigpa'],
    answer: 'AYUSH covers Ayurveda, Yoga & Naturopathy, Unani, Siddha, Sowa-Rigpa and Homoeopathy — India\'s traditional and complementary systems of medicine.',
  },
  {
    keywords: ['internship', 'job', 'apply', 'placement', 'opportunity', 'opportunities'],
    answer: 'Go to Opportunities to see internships and jobs matched to your verified skills, then apply with a cover letter. Track progress (Applied → Shortlisted → Selected) under Applications. Higher assessment scores improve your matches.',
  },
  {
    keywords: ['resume', 'portfolio', 'certificate', 'digilocker', 'project'],
    answer: 'Your Portfolio holds certificates, projects and DigiLocker KYC status, and you can download an AYUSH-format resume from it. Verified assessment scores are added to your profile automatically.',
  },
  {
    keywords: ['badge', 'badges'],
    answer: 'Badges are awarded automatically — e.g. First Steps for your first assessment, Assessment Champion for three assessments, and Perfect Score for 100%.',
  },
  {
    keywords: ['notice', 'notices', 'notification', 'announcement'],
    answer: 'Notices shows your results, level unlocks, proctoring alerts and announcements. Admins and institutions can post notices to selected user groups from the same page.',
  },
  {
    keywords: ['skill gap', 'gap analysis', 'skill profile', 'readiness', 'bar chart', 'score'],
    answer: 'Your Skill Profile shows a bar chart of your score in each skill area against the 70% industry benchmark, with gap analysis and recommendations. You can download it as a PDF report.',
  },
  {
    keywords: ['password', 'login', 'sign in', 'account'],
    answer: 'If you cannot sign in, check your email and password and make sure your account is active. An administrator can reactivate accounts from User Management.',
  },
];

const tokenize = (s) => ` ${String(s).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ')} `;

export const searchKnowledge = (text) => {
  const t = tokenize(text);
  let best = null;
  for (const entry of KNOWLEDGE) {
    const score = entry.keywords.reduce((s, k) => (t.includes(` ${k} `) ? s + k.split(' ').length : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  return best?.entry || null;
};

export const matchPages = (text, pages = []) => {
  const t = tokenize(text);
  return pages
    .map(p => ({
      page: p,
      score: [p.label, ...(p.keywords || [])].reduce((s, k) => {
        const kk = tokenize(k).trim();
        return kk && t.includes(` ${kk} `) ? s + kk.split(' ').length + 1 : s;
      }, 0),
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(x => x.page);
};

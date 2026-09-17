// Single source of truth for each role's pages.
// Used by the sidebar and by the chatbot to guide users to features.
// `sidebar: false` pages are reachable via links / chatbot but not listed in the sidebar.

const common = (role) => [
  {
    key: 'notices', label: 'Notices', path: `/${role}/notifications`, icon: 'bell',
    description: 'Notices, announcements, results and alerts',
    keywords: ['notice', 'notices', 'notification', 'notifications', 'announcement', 'alert', 'circular', 'update', 'inbox', 'सूचना', 'नोटिस', 'suchna'],
  },
];

const questionSetPages = (role) => [
  {
    key: 'question-sets', label: role === 'student' ? 'My Question Sets' : 'Question Sets', path: `/${role}/question-sets`, icon: 'layers',
    description: role === 'student' ? 'Practice sets you created' : 'Assessments you uploaded, attempts and proctoring reports',
    keywords: ['question set', 'question sets', 'my tests', 'uploaded', 'manage test', 'reports', 'attempts', 'results of students'],
  },
  {
    key: 'upload-question-set', label: 'Create Question Set', path: `/${role}/question-sets/upload`, icon: 'upload', sidebar: false,
    description: 'Upload/write questions yourself or generate an AI level-wise test',
    keywords: ['upload', 'create test', 'create assessment', 'add questions', 'question paper', 'csv', 'json', 'make test', 'new test', 'practice set', 'ai test', 'generate test', 'ai generated', 'generate questions'],
  },
  ...(role !== 'student' ? [{
    key: 'live', label: 'Live Proctoring', path: `/${role}/live-proctoring`, icon: 'radio',
    description: 'Watch tests in progress, violations and webcam frames; terminate attempts',
    keywords: ['live', 'live proctoring', 'monitor', 'monitoring', 'ongoing test', 'in progress', 'invigilate', 'invigilation'],
  }] : []),
];

export const NAV_CATALOG = {
  student: [
    { key: 'dashboard', label: 'Dashboard', path: '/student', icon: 'home', description: 'Overview of readiness, skill scores and matched opportunities', keywords: ['dashboard', 'home', 'overview', 'main page'] },
    { key: 'skills', label: 'Skill Profile', path: '/student/skills', icon: 'award', description: 'Skill score bar chart, gap analysis and PDF report', keywords: ['skill', 'skills', 'skill profile', 'gap', 'gap analysis', 'score', 'scores', 'chart', 'graph', 'report', 'readiness'] },
    { key: 'level-tests', label: 'Level-wise Tests', path: '/student/level-tests', icon: 'trending', description: 'NSQF Level 1–8 roadmap with tests and AI practice tests per level', keywords: ['level wise', 'level-wise', 'levels', 'nsqf level', 'roadmap', 'next level', 'unlock', 'ai practice', 'practice test'] },
    { key: 'assessments', label: 'Assessments', path: '/student/assessments', icon: 'file', description: 'NSQF level-wise AI-proctored tests', keywords: ['test', 'tests', 'exam', 'exams', 'assessment', 'assessments', 'quiz', 'nsqf', 'take test', 'परीक्षा', 'pariksha', 'mock test'] },
    ...questionSetPages('student'),
    { key: 'opportunities', label: 'Opportunities', path: '/student/opportunities', icon: 'briefcase', description: 'Internships and jobs matched to your skills', keywords: ['job', 'jobs', 'internship', 'internships', 'opportunity', 'opportunities', 'placement', 'vacancy', 'नौकरी', 'naukri'] },
    { key: 'portfolio', label: 'Portfolio', path: '/student/portfolio', icon: 'book', description: 'Certificates, projects, DigiLocker KYC and resume', keywords: ['portfolio', 'resume', 'cv', 'certificate', 'certificates', 'project', 'projects', 'digilocker', 'kyc', 'profile'] },
    { key: 'applications', label: 'Applications', path: '/student/applications', icon: 'activity', description: 'Status of internships and jobs you applied to', keywords: ['application', 'applications', 'applied', 'status', 'shortlisted', 'selected'] },
    ...common('student'),
  ],
  industry: [
    { key: 'dashboard', label: 'Dashboard', path: '/industry', icon: 'home', description: 'Hiring overview and application funnel', keywords: ['dashboard', 'home', 'overview'] },
    { key: 'post', label: 'Post Opportunity', path: '/industry/post-opportunity', icon: 'file', description: 'Post a new job or internship', keywords: ['post', 'post job', 'new job', 'internship', 'hire', 'hiring', 'create opportunity', 'vacancy'] },
    { key: 'manage', label: 'Manage Opportunities', path: '/industry/manage-opportunities', icon: 'briefcase', description: 'Your posted opportunities and their applicants', keywords: ['manage', 'my jobs', 'my opportunities', 'applicants', 'applications', 'posted'] },
    { key: 'candidates', label: 'Candidate Search', path: '/industry/candidate-search', icon: 'users', description: 'Search verified AYUSH candidates by skills', keywords: ['candidate', 'candidates', 'talent', 'search students', 'find students', 'shortlist'] },
    ...questionSetPages('industry'),
    ...common('industry'),
  ],
  academician: [
    { key: 'dashboard', label: 'Dashboard', path: '/academician', icon: 'home', description: 'Overview of mentoring and research', keywords: ['dashboard', 'home', 'overview'] },
    { key: 'mentoring', label: 'Mentoring', path: '/academician/mentoring', icon: 'users', description: 'Mentor students and give feedback', keywords: ['mentor', 'mentoring', 'mentees', 'feedback', 'guide students'] },
    { key: 'research', label: 'Research Hub', path: '/academician/research-hub', icon: 'search', description: 'Research projects and collaborations', keywords: ['research', 'paper', 'publication', 'collaboration', 'project'] },
    { key: 'fdp', label: 'FDP Access', path: '/academician/fdp-access', icon: 'graduation', description: 'Faculty development programmes', keywords: ['fdp', 'faculty development', 'training', 'course', 'workshop'] },
    ...questionSetPages('academician'),
    ...common('academician'),
  ],
  institution: [
    { key: 'dashboard', label: 'Dashboard', path: '/institution', icon: 'home', description: 'Institution overview and AI curriculum insights', keywords: ['dashboard', 'home', 'overview', 'curriculum'] },
    { key: 'readiness', label: 'Readiness', path: '/institution/readiness', icon: 'chart', description: 'Student industry-readiness analytics', keywords: ['readiness', 'analytics', 'skill gap', 'benchmark'] },
    { key: 'outcomes', label: 'Outcomes', path: '/institution/outcomes', icon: 'activity', description: 'Placement and outcome tracking', keywords: ['outcome', 'outcomes', 'placement', 'placements', 'tracking'] },
    { key: 'students', label: 'Students', path: '/institution/students', icon: 'users', description: 'Manage enrolled students', keywords: ['students', 'student list', 'manage students', 'enrolled'] },
    ...questionSetPages('institution'),
    { key: 'flagged', label: 'Proctoring Reports', path: '/institution/proctoring-reports', icon: 'shield', description: 'Attempts flagged by the AI proctor', keywords: ['proctoring', 'flagged', 'cheating', 'violations', 'malpractice'] },
    ...common('institution'),
  ],
  admin: [
    { key: 'dashboard', label: 'Dashboard', path: '/admin', icon: 'home', description: 'Platform statistics', keywords: ['dashboard', 'home', 'overview', 'stats'] },
    { key: 'users', label: 'User Management', path: '/admin/users', icon: 'users', description: 'Activate, deactivate and change roles of users', keywords: ['user', 'users', 'user management', 'roles', 'block', 'activate', 'deactivate'] },
    { key: 'taxonomy', label: 'Skill Taxonomy', path: '/admin/taxonomy', icon: 'book', description: 'NSQF qualification packs and competency units', keywords: ['taxonomy', 'skill taxonomy', 'qualification pack', 'qp', 'nos', 'competency'] },
    ...questionSetPages('admin'),
    { key: 'flagged', label: 'Proctoring Reports', path: '/admin/proctoring-reports', icon: 'shield', description: 'Attempts flagged by the AI proctor', keywords: ['proctoring', 'flagged', 'cheating', 'violations', 'malpractice'] },
    ...common('admin'),
  ],
};

export const getPagesForRole = (role) => NAV_CATALOG[role] || [];

const NAV_VERBS = ['go to', 'goto', 'open', 'take me', 'navigate', 'show me', 'show', 'where', 'find', 'how do i get', 'link', 'khol', 'kholo', 'kaha', 'kahan', 'le chalo', 'dikhao', 'jana', 'दिखाओ', 'खोलो', 'कहाँ', 'कहां'];
const AUTO_NAV_VERBS = ['go to', 'goto', 'open', 'take me', 'navigate', 'khol', 'kholo', 'le chalo', 'खोलो'];

const normalise = (s) => ` ${String(s).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ')} `;

/**
 * Match free text to a page for the role.
 * @returns {{ page, score, isNavRequest, autoNavigate } | null}
 */
export const matchNavigation = (text, role) => {
  const t = normalise(text);
  let best = null;
  for (const page of getPagesForRole(role)) {
    let score = 0;
    for (const kw of [page.label, ...page.keywords]) {
      const k = normalise(kw).trim();
      if (k && t.includes(` ${k} `)) score += k.split(' ').length + 1; // multi-word keywords weigh more
    }
    if (score > 0 && (!best || score > best.score)) best = { page, score };
  }
  if (!best) return null;
  const isNavRequest = NAV_VERBS.some(v => t.includes(` ${v} `) || t.startsWith(` ${v}`));
  const autoNavigate = AUTO_NAV_VERBS.some(v => t.includes(` ${v} `));
  return { ...best, isNavRequest, autoNavigate };
};

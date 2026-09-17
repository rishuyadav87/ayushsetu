// National Skills Qualifications Framework (NSQF) — revised framework notified by NCVET on 6 June 2023.
// Eight levels (1 = lowest complexity, 8 = highest). Descriptors below are short summaries of the
// official domains: knowledge, skills, employment readiness, learning outcomes and responsibility.
export const NSQF_MIN_LEVEL = 1;
export const NSQF_MAX_LEVEL = 8;

export const NSQF_LEVELS = [
  { level: 1, title: 'Level 1 — Foundation', descriptor: 'Routine, repetitive tasks in a familiar setting, performed under close supervision.' },
  { level: 2, title: 'Level 2 — Basic', descriptor: 'Limited range of routine activities using basic facts and simple tools, with limited responsibility.' },
  { level: 3, title: 'Level 3 — Assistant', descriptor: 'Well-defined routine tasks using basic practical knowledge; works under supervision.' },
  { level: 4, title: 'Level 4 — Technician', descriptor: 'Familiar, predictable work using factual knowledge of the field; responsible for own work and learning.' },
  { level: 5, title: 'Level 5 — Skilled Practitioner', descriptor: 'Well-developed practical skills and choice of procedures; some responsibility for the work of others.' },
  { level: 6, title: 'Level 6 — Specialist', descriptor: 'Wide range of specialised technical skills in varied situations; responsible for work and learning of others.' },
  { level: 7, title: 'Level 7 — Advanced Specialist', descriptor: 'Specialised theoretical and practical skills in non-routine contexts; accountable for group output and development.' },
  { level: 8, title: 'Level 8 — Expert / Leader', descriptor: 'Comprehensive, critical knowledge of the field; research-led decisions and strategic responsibility.' },
];

export const isValidLevel = (level) => Number.isInteger(level) && level >= NSQF_MIN_LEVEL && level <= NSQF_MAX_LEVEL;

export const getLevelInfo = (level) => NSQF_LEVELS.find(l => l.level === level) || null;

/**
 * Level progression rule:
 * - The lowest level that has assessments is always open.
 * - Passing any assessment at level N unlocks every level up to N + 1.
 */
export const computeUnlockedLevel = (availableLevels, passedLevels) => {
  const minLevel = availableLevels.length ? Math.min(...availableLevels) : NSQF_MIN_LEVEL;
  const highestPassed = passedLevels.length ? Math.max(...passedLevels) : 0;
  return Math.min(NSQF_MAX_LEVEL, Math.max(minLevel, highestPassed + 1));
};

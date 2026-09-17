// Curated, reviewed question bank used to
//  1) seed the level-wise NSQF assessments, and
//  2) generate AI-style level-wise tests offline when no LLM API key is configured.
// Each question is authored with the CORRECT ANSWER FIRST; `toAssessmentQuestions` rotates
// options so the correct answer appears in different positions.

const Q = (nsqfLevel, topic, q, options, explanation) => ({ nsqfLevel, topic, q, options, explanation });

export const QUESTION_BANK = [
  // ---------------- Level 3 ----------------
  Q(3, 'Ayurveda Ahar & Poshan', 'How many Rasas (tastes) are described in Ayurveda?', ['Six', 'Three', 'Five', 'Eight'], 'Madhura, Amla, Lavana, Katu, Tikta and Kashaya.'),
  Q(3, 'Ayurveda Ahar & Poshan', 'Madhura Rasa refers to which taste?', ['Sweet', 'Sour', 'Salty', 'Bitter']),
  Q(3, 'Ayurveda Ahar & Poshan', 'Takra, commonly recommended in Ayurvedic diets, is:', ['Buttermilk', 'Clarified butter', 'Honey', 'Rice flakes']),
  Q(3, 'Ayurveda Ahar & Poshan', 'Ghrita refers to:', ['Ghee (clarified butter)', 'Curd', 'Jaggery', 'Sesame oil']),
  Q(3, 'Ayurveda Ahar & Poshan', 'Peya, given during graduated diet reintroduction, is a:', ['Thin rice gruel', 'Fried snack', 'Fermented drink', 'Sweet dessert']),
  Q(3, 'Ayurveda Ahar & Poshan', 'According to Ayurveda, honey should NOT be:', ['Heated or cooked', 'Stored in glass', 'Taken in small amounts', 'Mixed with lukewarm water after cooling']),
  Q(3, 'Ayurveda Ahar & Poshan', 'What is the first hygiene step before handling food?', ['Wash hands thoroughly with soap and water', 'Wear perfume', 'Taste the food', 'Switch on the exhaust fan']),
  Q(3, 'Ayurveda Ahar & Poshan', 'Cooked food is stored in covered containers mainly to:', ['Prevent contamination by dust, insects and microbes', 'Make it cook faster', 'Improve its colour', 'Increase its weight']),
  Q(3, 'Ayurveda Ahar & Poshan', 'In common household waste segregation in India, wet kitchen waste goes into which bin?', ['Green', 'Blue', 'Red', 'Black']),
  Q(3, 'Ayurveda Ahar & Poshan', 'If a colleague disagrees with you about a kitchen task, you should:', ['Listen, discuss respectfully and involve the supervisor if needed', 'Ignore them', 'Argue in front of clients', 'Leave the task unfinished']),
  Q(3, 'Healthcare Safety & Hygiene', 'WHO guidance says a complete handwash with soap and water should take about:', ['40–60 seconds', '5 seconds', '10 minutes', 'It does not matter']),
  Q(3, 'Healthcare Safety & Hygiene', 'Personal Protective Equipment (PPE) includes:', ['Gloves, mask and apron', 'A wristwatch', 'A mobile phone', 'Perfume']),
  Q(3, 'Healthcare Safety & Hygiene', 'A spill of body fluid on the floor should first be:', ['Cordoned off and cleaned as per the spill-management protocol', 'Ignored until the end of the day', 'Covered with a mat', 'Wiped with a dry cloth only']),
  Q(3, 'Healthcare Safety & Hygiene', 'Fire extinguishers in a health facility should be:', ['Easily accessible and regularly inspected', 'Locked in a store room', 'Kept only in the office', 'Used as door stoppers']),
  Q(3, 'Healthcare Safety & Hygiene', 'The main purpose of biomedical waste segregation is to:', ['Reduce infection risk and ensure safe disposal', 'Increase the amount of waste', 'Save space only', 'Make bins look colourful']),
  Q(3, 'Yoga & Wellness', 'Which asana is commonly called the corpse pose?', ['Shavasana', 'Tadasana', 'Bhujangasana', 'Vrikshasana']),
  Q(3, 'Yoga & Wellness', 'Pranayama primarily involves regulation of:', ['Breath', 'Diet', 'Sleep', 'Posture']),
  Q(3, 'Yoga & Wellness', 'Tadasana is also known as the:', ['Mountain pose', 'Cobra pose', 'Tree pose', 'Child pose']),
  Q(3, 'Yoga & Wellness', 'Vrikshasana is the:', ['Tree pose', 'Bow pose', 'Plough pose', 'Fish pose']),

  // ---------------- Level 4 ----------------
  Q(4, 'Panchakarma Therapy', 'What is the preparatory phase before the main (Pradhana) procedure called?', ['Purvakarma', 'Paschatkarma', 'Samsarjana Krama', 'Langhana']),
  Q(4, 'Panchakarma Therapy', 'Abhyanga refers to:', ['Therapeutic oil massage of the body', 'Fasting', 'Herbal fumigation', 'Eye wash']),
  Q(4, 'Panchakarma Therapy', 'Swedana is best described as:', ['Therapeutic sudation (induced sweating)', 'Cold compress', 'Oil pulling', 'Nasal drops']),
  Q(4, 'Panchakarma Therapy', 'Shirodhara involves:', ['Pouring a continuous stream of medicated liquid over the forehead', 'Massaging the feet', 'Applying paste to the abdomen', 'Steam inhalation']),
  Q(4, 'Panchakarma Therapy', 'Pichu is:', ['A cotton pad soaked in medicated oil placed over a body part', 'A herbal powder', 'A type of steam chamber', 'A decoction']),
  Q(4, 'Panchakarma Therapy', 'Before starting a therapy session, the technician should first:', ['Verify the prescription and take the client\'s consent', 'Start the massage immediately', 'Heat the oil to maximum', 'Ask the client to sign out']),
  Q(4, 'Panchakarma Therapy', 'Which colour-coded bin is used for soiled infectious biomedical waste (e.g. used cotton, dressings)?', ['Yellow', 'Green', 'Blue', 'Black']),
  Q(4, 'Panchakarma Therapy', 'Used needles and other sharps should be discarded into:', ['A puncture-proof sharps container', 'A plastic carry bag', 'The general dustbin', 'The drain']),
  Q(4, 'Panchakarma Therapy', 'Immediately after Swedana, the client should be:', ['Allowed to rest and protected from cold air and drafts', 'Sent outdoors right away', 'Given an ice-cold bath', 'Asked to exercise']),
  Q(4, 'Panchakarma Therapy', 'Hand hygiene between two clients is:', ['Mandatory', 'Optional', 'Needed only once a day', 'Needed only if hands look dirty']),
  Q(4, 'Yoga & Wellness', 'The common classical sequence of Surya Namaskar has how many steps?', ['12', '8', '10', '16']),
  Q(4, 'Yoga & Wellness', 'Bhujangasana is the:', ['Cobra pose', 'Camel pose', 'Lotus pose', 'Corpse pose']),
  Q(4, 'Yoga & Wellness', 'How many limbs (Ashtanga) of Yoga are described in Patanjali\'s Yoga Sutras?', ['Eight', 'Six', 'Four', 'Ten']),
  Q(4, 'Yoga & Wellness', 'Which limb of Ashtanga Yoga refers to withdrawal of the senses?', ['Pratyahara', 'Dharana', 'Niyama', 'Asana']),
  Q(4, 'Yoga & Wellness', 'Anulom Vilom is a form of:', ['Alternate nostril breathing', 'Forward bend', 'Chanting', 'Balancing posture']),
  Q(4, 'Yoga & Wellness', 'Before teaching asanas to a new participant, an instructor should first:', ['Screen for health conditions and contraindications', 'Start with advanced poses', 'Skip the warm-up', 'Ask them to hold their breath throughout']),
  Q(4, 'Communication & Ethics', 'Maintaining client confidentiality means:', ['Not sharing client information without authorisation', 'Posting case details on social media', 'Discussing clients with friends', 'Leaving files open at the desk']),
  Q(4, 'Communication & Ethics', 'Informed consent means the client:', ['Understands the procedure and its risks and agrees voluntarily', 'Signs a form without explanation', 'Is informed after the procedure', 'Is persuaded by staff']),
  Q(4, 'Communication & Ethics', 'When a client complains, the best first step is to:', ['Listen calmly and acknowledge the concern', 'Argue with the client', 'Ignore the complaint', 'Blame a colleague']),
  Q(4, 'Communication & Ethics', 'Active listening involves:', ['Paying full attention and confirming understanding', 'Interrupting often', 'Checking your phone', 'Planning your reply while they speak']),

  // ---------------- Level 5 ----------------
  Q(5, 'Ayurveda Dietetics', 'What is Ahara Vijnana?', ['Dietetics & nutrition science', 'Surgical technique', 'Bone setting', 'Yoga postures']),
  Q(5, 'Ayurveda Dietetics', 'Which factor is most critical when designing an individualised Ayurvedic diet plan?', ['Client Prakriti & Agni status', 'Caloric deficit only', 'Time of sunrise', 'Blood type']),
  Q(5, 'Ayurveda Dietetics', 'Which of the following is considered the primary seat of Agni in Ahara metabolism?', ['Grahani', 'Hridaya', 'Kantha', 'Shiras']),
  Q(5, 'Ayurveda Dietetics', 'Pathya refers to:', ['Wholesome diet and regimen suited to the patient', 'Prohibited food', 'Fasting only', 'A cooking vessel']),
  Q(5, 'Ayurveda Dietetics', 'Viruddha Ahara means:', ['Incompatible food combinations', 'Seasonal fruits', 'Fermented food', 'Raw vegetables']),
  Q(5, 'Ayurveda Dietetics', 'Ashta Ahara Vidhi Visheshayatana describes:', ['Eight factors governing food intake', 'Eight types of fasting', 'Eight daily meals', 'Eight cooking oils']),
  Q(5, 'Ayurveda Dietetics', 'Which Dosha is primarily associated with digestion and metabolism?', ['Pitta', 'Kapha', 'Vata', 'None of these']),
  Q(5, 'Ayurveda Dietetics', 'Samsarjana Krama is:', ['Graduated reintroduction of diet after fasting or purification', 'A detox massage', 'A yoga sequence', 'A pulse examination']),
  Q(5, 'Ayurveda Dietetics', 'Mandagni indicates:', ['Weak digestive fire', 'Excess digestive fire', 'Balanced digestion', 'Fever']),
  Q(5, 'Ayurveda Dietetics', 'A dietetic follow-up record should include:', ['Client details, plan given, progress and changes at each visit', 'Only the client\'s name', 'Only the fee paid', 'Nothing — records are optional']),
  Q(5, 'Ayurveda Fundamentals', 'How many Doshas are described in Ayurveda?', ['Three', 'Two', 'Five', 'Seven']),
  Q(5, 'Ayurveda Fundamentals', 'Which Dosha is associated with movement and the air element?', ['Vata', 'Pitta', 'Kapha', 'None of these']),
  Q(5, 'Ayurveda Fundamentals', 'Kapha Dosha is mainly associated with:', ['Structure and stability', 'Transformation', 'Movement', 'Heat']),
  Q(5, 'Ayurveda Fundamentals', 'Pancha Mahabhuta refers to the:', ['Five great elements', 'Five tastes', 'Five daily meals', 'Five therapies']),
  Q(5, 'Ayurveda Fundamentals', 'Katu Rasa refers to which taste?', ['Pungent', 'Sweet', 'Salty', 'Sour']),
  Q(5, 'Ayurveda Fundamentals', 'Ashtavidha Pariksha refers to:', ['The eightfold clinical examination', 'Eight medicinal herbs', 'Eight diet plans', 'Eight yoga postures']),
  Q(5, 'Homoeopathy Basics', 'Homoeopathy was founded by:', ['Samuel Hahnemann', 'Hippocrates', 'Galen', 'Ibn Sina']),
  Q(5, 'Homoeopathy Basics', 'The core principle of Homoeopathy is:', ['Similia similibus curentur (like cures like)', 'Contraria contrariis curentur', 'Surgery first', 'Fasting cures all']),
  Q(5, 'Homoeopathy Basics', 'The foundational text of Homoeopathy written by Hahnemann is:', ['Organon of Medicine', 'Canon of Medicine', 'Charaka Samhita', 'Tirumandiram']),
  Q(5, 'Homoeopathy Basics', 'In Homoeopathy, potentisation refers to:', ['Serial dilution with succussion', 'Heating the medicine', 'Mixing with honey', 'Sun-drying herbs']),

  // ---------------- Level 6 ----------------
  Q(6, 'Unani & Siddha', 'The four humours (Akhlat) in Unani medicine are Dam, Balgham, Safra and:', ['Sauda', 'Mizaj', 'Nabz', 'Tabiyat']),
  Q(6, 'Unani & Siddha', 'Mizaj in Unani medicine refers to:', ['Temperament', 'Pulse', 'Diet', 'A herb']),
  Q(6, 'Unani & Siddha', 'Al-Qanun fi al-Tibb (The Canon of Medicine) was written by:', ['Ibn Sina (Avicenna)', 'Hakim Ajmal Khan', 'Galen', 'Hippocrates']),
  Q(6, 'Unani & Siddha', 'Siddha medicine is traditionally practised mainly in:', ['Tamil Nadu', 'Punjab', 'Kashmir', 'Assam']),
  Q(6, 'Unani & Siddha', 'Classical Siddha literature is predominantly written in:', ['Tamil', 'Sanskrit', 'Persian', 'Pali']),
  Q(6, 'Research & Pharmacovigilance', 'Pharmacovigilance is concerned with:', ['Detection, assessment and prevention of adverse drug effects', 'Drug advertising', 'Drug pricing', 'Herb cultivation']),
  Q(6, 'Research & Pharmacovigilance', 'In clinical research, informed consent must be obtained:', ['Before enrolling the participant', 'After the trial ends', 'Only if the participant asks', 'After the first dose']),
  Q(6, 'Research & Pharmacovigilance', 'Participants in a randomised controlled trial are randomised mainly to:', ['Minimise selection bias', 'Increase the cost', 'Reveal allocation to participants', 'Avoid ethics review']),
  Q(6, 'Research & Pharmacovigilance', 'Clinical trials conducted in India must be registered with:', ['CTRI (Clinical Trials Registry – India)', 'DigiLocker', 'NSQF', 'The Census office']),
  Q(6, 'Research & Pharmacovigilance', 'An Institutional Ethics Committee reviews research primarily to:', ['Protect the rights, safety and well-being of participants', 'Approve budgets only', 'Publish results', 'Hire staff']),
  Q(6, 'Research & Pharmacovigilance', '"Double-blind" in a clinical trial means:', ['Neither participants nor investigators know the group allocation', 'Only participants are unaware', 'Two groups of visually impaired participants', 'The trial is hidden from regulators']),
  Q(6, 'Research & Pharmacovigilance', 'The Ayurvedic Pharmacopoeia of India (API) primarily provides:', ['Quality standards for Ayurvedic drugs', 'Yoga protocols', 'Hospital building codes', 'Diet charts']),
];

export const BANK_TOPICS = [...new Set(QUESTION_BANK.map(q => q.topic))];
export const BANK_LEVELS = [...new Set(QUESTION_BANK.map(q => q.nsqfLevel))].sort((a, b) => a - b);

// Convert bank items into stored assessment questions with rotated options.
export const toAssessmentQuestions = (items) => items.map((item, i) => {
  const n = item.options.length;
  const shift = i % n;
  const options = item.options.map((_, k) => item.options[(k + shift) % n]);
  return {
    q: item.q,
    options,
    correctIndex: (n - shift) % n,
    ...(item.explanation ? { explanation: item.explanation } : {}),
  };
});

// Random option order (used for generated tests)
export const toShuffledQuestions = (items) => items.map(item => {
  const order = shuffle(item.options.map((_, i) => i));
  return {
    q: item.q,
    options: order.map(i => item.options[i]),
    correctIndex: order.indexOf(0),
    ...(item.explanation ? { explanation: item.explanation } : {}),
  };
});

export const bankByTopic = (topic) => QUESTION_BANK.filter(q => q.topic === topic);

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const matchesTopic = (q, topic) => {
  if (!topic) return true;
  const t = topic.toLowerCase();
  return q.topic.toLowerCase().includes(t) || t.includes(q.topic.toLowerCase()) ||
    t.split(/\s+/).some(word => word.length > 3 && q.topic.toLowerCase().includes(word));
};

/**
 * Offline level-wise generation: pick questions at the requested level (and topic if given),
 * widening to neighbouring levels / other topics only when there are not enough questions.
 */
export const generateFromBank = ({ nsqfLevel, topic, count }) => {
  const picked = [];
  const used = new Set();
  const take = (pool) => {
    for (const q of shuffle(pool)) {
      if (picked.length >= count) break;
      if (!used.has(q)) { used.add(q); picked.push(q); }
    }
  };
  take(QUESTION_BANK.filter(q => q.nsqfLevel === nsqfLevel && matchesTopic(q, topic)));
  let widened = false;
  if (picked.length < count) { widened = true; take(QUESTION_BANK.filter(q => q.nsqfLevel === nsqfLevel)); }
  if (picked.length < count) take(QUESTION_BANK.filter(q => Math.abs(q.nsqfLevel - nsqfLevel) === 1 && matchesTopic(q, topic)));
  if (picked.length < count) take(QUESTION_BANK.filter(q => Math.abs(q.nsqfLevel - nsqfLevel) <= 1));
  // levels without bank questions (e.g. 1–2, 7–8): use the nearest levels available
  for (let d = 2; picked.length < count && d <= 7; d++) take(QUESTION_BANK.filter(q => Math.abs(q.nsqfLevel - nsqfLevel) === d));
  return { items: picked, widened };
};

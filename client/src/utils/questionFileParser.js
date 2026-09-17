// Parse uploaded question-set files (CSV or JSON) into
// [{ question, options: [...], answer }] where answer is a 0-based option index.

const parseCSVRows = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some(v => v.trim() !== '')) rows.push(row);
  return rows;
};

// Accepts A-F, 1-6 (1-based), or the exact option text
export const resolveAnswer = (value, options) => {
  if (typeof value === 'number' && Number.isInteger(value)) return value; // JSON numbers are 0-based
  const v = String(value ?? '').trim();
  if (!v) return -1;
  const byText = options.findIndex(o => o.trim().toLowerCase() === v.toLowerCase());
  if (/^[A-Fa-f]$/.test(v) && byText === -1) return v.toUpperCase().charCodeAt(0) - 65;
  if (/^(option\s*)?[1-6]$/i.test(v) && byText === -1) return parseInt(v.replace(/\D/g, ''), 10) - 1;
  return byText;
};

const validate = (questions) => {
  const errors = [];
  questions.forEach((q, i) => {
    if (!q.question) errors.push(`Row ${i + 1}: question text is empty`);
    if (q.options.length < 2) errors.push(`Row ${i + 1}: at least 2 options are required`);
    if (q.options.length > 6) errors.push(`Row ${i + 1}: at most 6 options are allowed`);
    if (!(q.answer >= 0 && q.answer < q.options.length)) errors.push(`Row ${i + 1}: correct answer is missing or invalid`);
  });
  return errors;
};

export const parseCSVQuestions = (text) => {
  const rows = parseCSVRows(text);
  if (rows.length < 2) return { questions: [], errors: ['The CSV needs a header row and at least one question row'] };

  const header = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const qCol = header.findIndex(h => ['question', 'questiontext', 'q', 'text'].includes(h));
  const answerCol = header.findIndex(h => ['correct', 'answer', 'correctanswer', 'correctoption', 'key'].includes(h));
  const explCol = header.findIndex(h => ['explanation', 'solution', 'rationale'].includes(h));
  const optionCols = header
    .map((h, idx) => ({ h, idx }))
    .filter(({ h }) => /^(option|opt)?[a-f1-6]$/.test(h) && !['q'].includes(h))
    .map(({ idx }) => idx);

  if (qCol === -1) return { questions: [], errors: ['Missing a "question" column'] };
  if (answerCol === -1) return { questions: [], errors: ['Missing a "correct" (answer) column'] };
  if (optionCols.length < 2) return { questions: [], errors: ['Add option columns: option1, option2, option3, option4 (up to option6)'] };

  const questions = rows.slice(1).map(r => {
    const options = optionCols.map(i => (r[i] || '').trim()).filter(Boolean);
    return {
      question: (r[qCol] || '').trim(),
      options,
      answer: resolveAnswer(r[answerCol], options),
      explanation: explCol >= 0 ? (r[explCol] || '').trim() : '',
    };
  });
  return { questions, errors: validate(questions) };
};

export const parseJSONQuestions = (text) => {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { questions: [], errors: ['Invalid JSON file'], meta: null };
  }
  const list = Array.isArray(data) ? data : data?.questions;
  if (!Array.isArray(list)) return { questions: [], errors: ['JSON must be an array of questions or { "questions": [...] }'], meta: null };

  const questions = list.map(item => {
    const options = Array.isArray(item.options) ? item.options.map(o => String(o).trim()).filter(Boolean) : [];
    const rawAnswer = item.correctIndex ?? item.answer ?? item.correct;
    return {
      question: String(item.question ?? item.q ?? item.text ?? '').trim(),
      options,
      answer: resolveAnswer(rawAnswer, options),
      explanation: item.explanation ? String(item.explanation) : '',
    };
  });
  const meta = Array.isArray(data) ? null : { title: data.title, description: data.description, duration: data.duration, nsqfLevel: data.nsqfLevel };
  return { questions, errors: validate(questions), meta };
};

export const parseQuestionFile = async (file) => {
  const text = await file.text();
  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) return parseJSONQuestions(text);
  if (name.endsWith('.csv') || name.endsWith('.txt')) return parseCSVQuestions(text);
  return { questions: [], errors: ['Unsupported file type. Upload a .csv or .json file (Excel: File → Save As → CSV).'] };
};

export const SAMPLE_CSV = [
  'question,option1,option2,option3,option4,correct,explanation',
  '"How many Rasas (tastes) are described in Ayurveda?",Three,Five,Six,Eight,C,"Madhura, Amla, Lavana, Katu, Tikta and Kashaya"',
  '"Takra refers to:",Buttermilk,Ghee,Honey,Jaggery,A,',
  '"Which colour bin is used for soiled infectious biomedical waste?",Green,Yellow,Blue,Black,B,',
].join('\n');

export const downloadSampleCSV = () => {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ayush-setu-question-set-template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

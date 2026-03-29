const fs = require('fs');
const path = require('path');
const { SUBJECT_DEFINITIONS } = require('./subjectDefinitions');

/** Root `dataset/` folder (same source as normalize_datasets.js). */
function getDatasetDir() {
  return path.join(__dirname, '..', '..', 'dataset');
}

/** Same as normalize_datasets.js for commented-out JSON in .js files. */
function stripJsComments(content) {
  const lines = content.split('\n');
  return lines.map((line) => (line.trim().startsWith('//') ? line.trim().substring(2).trim() : line)).join('\n');
}

function resolveDatasetPath(dir, fileName) {
  const base = fileName.replace(/\.(json|js)$/i, '');
  const candidates = [...new Set([
    path.join(dir, fileName),
    path.join(dir, `${base}.json`),
    path.join(dir, `${base}.js`),
  ])];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    if (raw && raw.trim()) return p;
  }
  return null;
}

/** Mirrors normalize_datasets.js so API output matches the former bundled JSON. */
function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => {
    const row = { ...q };

    let type = (row.type || 'mcq').toLowerCase().replace(/\s+/g, '');
    if (type === 'mcq') type = 'mcq';
    else if (type.includes('short')) type = 'short';
    else if (type.includes('concept')) type = 'conceptual';
    else if (type.includes('numeric')) type = 'numerical';
    else if (type.includes('theory')) type = 'conceptual';
    else if (type.includes('diagram')) type = 'conceptual';
    else if (type.includes('true') || type.includes('false')) {
      type = 'mcq';
      if (!row.options) row.options = ['True', 'False'];
    }

    let difficulty = (row.difficulty || 'medium').toLowerCase();

    if (type === 'mcq' && !row.options) {
      row.options = ['Option A', 'Option B', 'Option C', 'Option D'];
    }

    const concept = row.concept || row.unit || 'General';
    const explanation = row.explanation != null ? String(row.explanation) : '';
    const answer = row.answer != null ? String(row.answer) : '';

    return {
      ...row,
      type,
      difficulty,
      concept,
      explanation,
      answer,
    };
  });
}

function readQuestionsForFile(fileName) {
  const dir = getDatasetDir();
  const filePath = resolveDatasetPath(dir, fileName);
  if (!filePath) {
    console.warn(`[quiz] Missing dataset file for ${fileName} under ${dir}`);
    return [];
  }
  let raw = fs.readFileSync(filePath, 'utf8');
  if (!raw || !raw.trim()) return [];

  if (filePath.endsWith('.js')) {
    raw = stripJsComments(raw);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.warn(`[quiz] Invalid JSON in ${filePath}:`, e.message);
    return [];
  }

  if (!data || !Array.isArray(data.questions)) return [];
  return normalizeQuestions(data.questions);
}

function buildSubjects() {
  return SUBJECT_DEFINITIONS.map((def) => {
    const questions = readQuestionsForFile(def.file);
    const { file, ...meta } = def;
    return { ...meta, questions };
  });
}

function getSubjectById(subjectId) {
  const def = SUBJECT_DEFINITIONS.find((d) => d.id === subjectId);
  if (!def) return null;
  const questions = readQuestionsForFile(def.file);
  const { file, ...meta } = def;
  return { ...meta, questions };
}

/** Public alias for use in other routes */
function readQuestionsForSubject(fileName) {
  return readQuestionsForFile(fileName);
}

module.exports = {
  getDatasetDir,
  buildSubjects,
  getSubjectById,
  readQuestionsForSubject,
  SUBJECT_DEFINITIONS,
};

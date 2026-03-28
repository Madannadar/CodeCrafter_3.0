const fs = require('fs');
const path = require('path');

const parsed = fs.readFileSync(path.join(__dirname, 'parsed-output.ts'), 'utf-8');
const extraQPath = path.join(__dirname, 'web-frontend/src/data/extraQuestions.ts');
let extraQ = fs.readFileSync(extraQPath, 'utf-8');

// append the parsed output to the end of the file
extraQ += '\n' + parsed;

// Now inject inside loadAllQuestions
const injectStr = `
  const m2 = subjects.find(s => s.id === 'm2');
  if (m2 && m2.questions.length === 0) m2.questions = m2Questions;
  const phy2 = subjects.find(s => s.id === 'phy2');
  if (phy2 && phy2.questions.length === 0) phy2.questions = phy2Questions;
  const chem2 = subjects.find(s => s.id === 'chem2');
  if (chem2 && chem2.questions.length === 0) chem2.questions = chem2Questions;
  const eg = subjects.find(s => s.id === 'eg');
  if (eg && eg.questions.length === 0) eg.questions = enggraphicsQuestions;
  const cp = subjects.find(s => s.id === 'cp');
  if (cp && cp.questions.length === 0) cp.questions = cpQuestions;
`;

// Find the end of loadAllQuestions
extraQ = extraQ.replace(/(export function loadAllQuestions\(\) \{[\s\S]*?)(^\})/m, `$1${injectStr}$2`);

fs.writeFileSync(extraQPath, extraQ);
console.log('Appended and updated extraQuestions.ts');

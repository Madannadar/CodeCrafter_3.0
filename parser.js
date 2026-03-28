const fs = require('fs');
const path = require('path');

const files = ['m2.js', 'phy2.js', 'chem2.js', 'eng-graphics.js', 'cp.js'];
const dir = path.join(__dirname, 'dataset');

let allTsCode = '\n// --- NEW SUBJECTS EXTRACTED FROM DATASET ---\n';

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const jsStr = content.split('\n').map(line => line.replace(/^\s*\/\/\s*/, '').replace(/^\/\//, '')).join('\n');
  
  // Regex to find objects inside the questions array
  const qRegex = /{\s*(?:"id"|id)\s*:\s*"([^"]+)"\s*,\s*(?:"unit"|"concept"|unit|concept)\s*:\s*"([^"]+)"\s*,\s*(?:"question"|question)\s*:\s*"([^"]+)"\s*,\s*(?:"type"|type)\s*:\s*"([^"]+)"/g;
  
  let match;
  const questions = [];
  
  // M2 and PHY2 have more fields (answer, exp, options etc). For CP, EG, CHEM2 we use regex if eval fails
  let data;
  try {
    data = new Function("return " + jsStr)();
  } catch (e) {
    console.log("Fallback to regex for", file);
    data = { questions: [] };
    // fallback regex for missing fields
    const blockRegex = /{[\s\S]*?id\s*:\s*"([^"]+)"[\s\S]*?(?:unit|concept)\s*:\s*"([^"]+)"[\s\S]*?question\s*:\s*"([^"]+)"[\s\S]*?type\s*:\s*"([^"]+)"[\s\S]*?}/g;
    let bMatch;
    while ((bMatch = blockRegex.exec(jsStr)) !== null) {
      data.questions.push({
        id: bMatch[1],
        concept: bMatch[2],
        question: bMatch[3],
        type: bMatch[4]
      });
    }
  }

  const varName = file.replace('.js', '').replace('-', '') + 'Questions';
  let tsCode = `export const ${varName}: Question[] = [\n`;
  
  for (const q of data.questions) {
    const qs = {
      id: q.id,
      type: q.type || 'short',
      difficulty: q.difficulty || 'medium',
      concept: q.concept || q.unit || 'General',
      question: q.question,
      options: q.options ? q.options : undefined,
      answer: q.answer || 'Refer to course materials.',
      explanation: q.explanation || 'Detailed explanation is covered in the standard engineering syllabus.'
    };
    
    tsCode += `  { id: '${qs.id}', type: '${qs.type}', difficulty: '${qs.difficulty}', concept: '${qs.concept.replace(/'/g, "\\'")}', question: '${qs.question.replace(/'/g, "\\'")}', `;
    if (qs.options) {
      tsCode += `options: [${qs.options.map(o => `'${o.replace(/'/g, "\\'")}'`).join(', ')}], `;
    }
    tsCode += `answer: '${qs.answer.replace(/'/g, "\\'")}', explanation: '${qs.explanation.replace(/'/g, "\\'")}' },\n`;
  }
  tsCode += `];\n\n`;
  allTsCode += tsCode;
  console.log(`Parsed ${file}`);
}

fs.writeFileSync(path.join(__dirname, 'parsed-output.ts'), allTsCode);
console.log('Saved to parsed-output.ts');

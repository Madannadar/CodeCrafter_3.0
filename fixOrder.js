const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'web-frontend/src/data/extraQuestions.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('// Initialize\nloadAllQuestions();\n', '');
content += '\n// Initialize\nloadAllQuestions();\n';

fs.writeFileSync(file, content);
console.log('Fixed loadAllQuestions order.');

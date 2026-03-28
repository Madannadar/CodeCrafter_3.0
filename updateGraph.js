const fs = require('fs');

let content = fs.readFileSync('web-frontend/src/data/graphData.ts', 'utf8');

const newNodes = `
  // New Engineering Subjects
  { id: 'm2', label: 'Engg. Mathematics II', category: 'subject', mastery: 65 },
  { id: 'phy2', label: 'Engg. Physics II', category: 'subject', mastery: 58 },
  { id: 'chem2', label: 'Engg. Chemistry II', category: 'subject', mastery: 72 },
  { id: 'eg', label: 'Engg. Graphics', category: 'subject', mastery: 60 },
  { id: 'cp', label: 'Computer Programming', category: 'subject', mastery: 75 },

  // New Topics
  { id: 'diff_eq', label: 'Differential Eq.', category: 'concept', subject: 'm2', mastery: 60 },
  { id: 'num_methods', label: 'Numerical Methods', category: 'concept', subject: 'm2', mastery: 55 },
  { id: 'spectroscopy', label: 'Spectroscopy', category: 'concept', subject: 'chem2', mastery: 70 },
  { id: 'c_prog', label: 'C Programming', category: 'concept', subject: 'cp', mastery: 80 },
  { id: 'algorithms', label: 'Algorithms', category: 'concept', subject: 'cp', mastery: 70 },
  { id: 'ortho_proj', label: 'Orthographic Proj.', category: 'concept', subject: 'eg', mastery: 60 },
`;

const newEdges = `
  // New Prerequisites
  { source: 'math1', target: 'm2', label: 'prerequisite' },
  { source: 'phy1', target: 'phy2', label: 'prerequisite' },
  { source: 'chem1', target: 'chem2', label: 'prerequisite' },

  // New Subject -> Topics
  { source: 'm2', target: 'diff_eq' },
  { source: 'm2', target: 'num_methods' },
  { source: 'chem2', target: 'spectroscopy' },
  { source: 'cp', target: 'c_prog' },
  { source: 'cp', target: 'algorithms' },
  { source: 'eg', target: 'ortho_proj' },
`;

content = content.replace(/(export const graphNodes: GraphNode\[\] = \[.*?)(];)/s, \`$1\${newNodes}$2\`);
content = content.replace(/(export const graphEdges: GraphEdge\[\] = \[.*?)(];)/s, \`$1\${newEdges}$2\`);

fs.writeFileSync('web-frontend/src/data/graphData.ts', content);
console.log('Graph data updated');

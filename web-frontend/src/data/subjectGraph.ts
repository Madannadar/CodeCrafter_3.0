/**
 * Subject Knowledge Graph — nodes and edges for the SVG visualization.
 * Only subjects that exist in the dataset/ folder are included.
 */

export interface GraphNode {
  id: string;
  label: string;
  shortLabel: string;
  semId: 'foundation' | 'sem1' | 'sem2' | 'sem3' | 'sem4';
  domain: string;
  color: string;
  icon: string;
  // Pre-computed positions (in a 900 x 560 SVG viewport)
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string; // Tooltip text explaining the relationship
  type: 'prerequisite' | 'domain' | 'uses';
}

/** Semantic domain colors */
const DC = {
  math:    '#8b5cf6',
  physics: '#3b82f6',
  chem:    '#10b981',
  elec:    '#f59e0b',
  mech:    '#f97316',
  cs:      '#ec4899',
  lang:    '#6b7280',
  graphics:'#14b8a6',
};

export const GRAPH_NODES: GraphNode[] = [
  // ── Semester 1 ──────────────────────────────────────────────────────────
  { id: 'math1',  label: 'Engg. Mathematics I',         shortLabel: 'Math I',   semId: 'sem1', domain: 'math',    color: DC.math,    icon: '∑', x: 210, y: 70  },
  { id: 'phy1',   label: 'Engg. Physics I',             shortLabel: 'Phy I',    semId: 'sem1', domain: 'physics', color: DC.physics, icon: '⚛', x: 210, y: 165 },
  { id: 'chem1',  label: 'Engg. Chemistry I',           shortLabel: 'Chem I',   semId: 'sem1', domain: 'chem',    color: DC.chem,    icon: '⚗', x: 210, y: 265 },
  { id: 'bee',    label: 'Basic Electrical Engg.',       shortLabel: 'BEE',      semId: 'sem1', domain: 'elec',    color: DC.elec,    icon: '⚡', x: 210, y: 360 },
  { id: 'eg',     label: 'Engineering Graphics',         shortLabel: 'Eng Gfx',  semId: 'sem1', domain: 'graphics',color: DC.graphics,icon: '✏', x: 210, y: 440 },
  { id: 'pce1',   label: 'Prof. Communication English I',shortLabel: 'PCE-1',    semId: 'sem1', domain: 'lang',    color: DC.lang,    icon: 'A', x: 210, y: 510 },

  // ── Semester 2 ──────────────────────────────────────────────────────────
  { id: 'm2',     label: 'Engg. Mathematics II',        shortLabel: 'Math II',  semId: 'sem2', domain: 'math',    color: DC.math,    icon: '∫', x: 400, y: 70  },
  { id: 'phy2',   label: 'Engg. Physics II',            shortLabel: 'Phy II',   semId: 'sem2', domain: 'physics', color: DC.physics, icon: '🔬', x: 400, y: 165 },
  { id: 'chem2',  label: 'Engg. Chemistry II',          shortLabel: 'Chem II',  semId: 'sem2', domain: 'chem',    color: DC.chem,    icon: '🧪', x: 400, y: 265 },
  { id: 'mech',   label: 'Engineering Mechanics',       shortLabel: 'Mech',     semId: 'sem2', domain: 'mech',    color: DC.mech,    icon: '⚙', x: 400, y: 360 },
  { id: 'cp',     label: 'C Programming',               shortLabel: 'C Prog',   semId: 'sem2', domain: 'cs',      color: DC.cs,      icon: '</>', x: 400, y: 455 },

  // ── Semester 3 ──────────────────────────────────────────────────────────
  { id: 'm3',     label: 'Engg. Mathematics III',       shortLabel: 'Math III', semId: 'sem3', domain: 'math',    color: DC.math,    icon: 'λ', x: 590, y: 70  },
  { id: 'ds',     label: 'Data Structures',             shortLabel: 'DS',       semId: 'sem3', domain: 'cs',      color: DC.cs,      icon: '↺', x: 590, y: 185 },
  { id: 'dlcoa',  label: 'DL & Computer Organisation',  shortLabel: 'DLCOA',    semId: 'sem3', domain: 'cs',      color: '#d946ef',  icon: '◻', x: 590, y: 280 },
  { id: 'dsgt',   label: 'Disc. Structures & Graph Th.',shortLabel: 'DSGT',     semId: 'sem3', domain: 'cs',      color: '#0ea5e9',  icon: '⬡', x: 590, y: 375 },
  { id: 'mp',     label: 'Microprocessors',             shortLabel: 'µProc',    semId: 'sem3', domain: 'elec',    color: DC.elec,    icon: '▣', x: 590, y: 465 },

  // ── Semester 4 ──────────────────────────────────────────────────────────
  { id: 'm4',     label: 'Engg. Mathematics IV',        shortLabel: 'Math IV',  semId: 'sem4', domain: 'math',    color: DC.math,    icon: 'Σ', x: 780, y: 70  },
  { id: 'dbms',   label: 'Database Management Systems', shortLabel: 'DBMS',     semId: 'sem4', domain: 'cs',      color: DC.cs,      icon: '🗄', x: 780, y: 185 },
  { id: 'os',     label: 'Operating Systems',           shortLabel: 'OS',       semId: 'sem4', domain: 'cs',      color: '#a855f7',  icon: '🖥', x: 780, y: 290 },
  { id: 'aoa',    label: 'Analysis of Algorithms',      shortLabel: 'AOA',      semId: 'sem4', domain: 'cs',      color: '#ef4444',  icon: '⏱', x: 780, y: 385 },
  { id: 'cg',     label: 'Computer Graphics',           shortLabel: 'CG',       semId: 'sem4', domain: 'graphics',color: DC.graphics,icon: '🎨', x: 780, y: 480 },
];

export const GRAPH_EDGES: GraphEdge[] = [
  // Math chain
  { from: 'math1', to: 'm2',    relation: 'Math II builds on Math I integrals & ODEs', type: 'prerequisite' },
  { from: 'm2',    to: 'm3',    relation: 'Math III extends Fourier & Laplace from M2', type: 'prerequisite' },
  { from: 'm3',    to: 'm4',    relation: 'Math IV uses transforms covered in M3', type: 'prerequisite' },

  // Physics chain
  { from: 'phy1',  to: 'phy2',  relation: 'Phy II (semiconductors) builds on Phy I quantum concepts', type: 'prerequisite' },

  // Chem chain
  { from: 'chem1', to: 'chem2', relation: 'Chem II uses polymers & materials from Chem I', type: 'prerequisite' },

  // BEE → MP (digital circuits)
  { from: 'bee',   to: 'mp',    relation: 'Microprocessors needs circuit & digital fundamentals from BEE', type: 'prerequisite' },

  // DLCOA → MP (direct prerequisite)
  { from: 'dlcoa', to: 'mp',    relation: 'DLCOA (digital logic, COA) is the direct base for Microprocessors', type: 'prerequisite' },

  // CP → DS (C programming needed for DS)
  { from: 'cp',    to: 'ds',    relation: 'Data Structures uses C pointers, memory, recursion', type: 'prerequisite' },

  // DS → DBMS, OS, AOA (all need DS)
  { from: 'ds',    to: 'dbms',  relation: 'DBMS indexing uses B-trees & hashing from DS', type: 'uses' },
  { from: 'ds',    to: 'os',    relation: 'OS scheduling queues & file trees from DS', type: 'uses' },
  { from: 'ds',    to: 'aoa',   relation: 'AOA analyses algorithms over DS structures (graphs, heaps)', type: 'prerequisite' },

  // DSGT → AOA (graph theory needed for graph algorithms)
  { from: 'dsgt',  to: 'aoa',   relation: 'AOA graph algorithms require discrete graph theory (DSGT)', type: 'prerequisite' },

  // Math → Physics (supporting)
  { from: 'math1', to: 'phy1',  relation: 'Physics I uses calculus & complex numbers from Math I', type: 'uses' },
  { from: 'm2',    to: 'phy2',  relation: 'Physics II wave equations use Fourier from Math II', type: 'uses' },

  // Math → applications in CS
  { from: 'm3',    to: 'aoa',   relation: 'Recurrence relations in AOA use transforms from Math III', type: 'uses' },

  // CG uses Math (matrices, transforms)
  { from: 'math1', to: 'cg',    relation: 'CG transformations need matrix algebra from Math I', type: 'uses' },
  { from: 'cp',    to: 'cg',    relation: 'CG algorithms are implemented in C/C++', type: 'uses' },

  // CP → OS (system calls in C)
  { from: 'cp',    to: 'os',    relation: 'OS concepts (system calls, processes) require C programming', type: 'uses' },
];

// Sem color palette for legend
export const SEM_COLORS: Record<string, string> = {
  sem1: '#8b5cf6',
  sem2: '#f59e0b',
  sem3: '#10b981',
  sem4: '#ef4444',
};

export const SEM_LABELS: Record<string, string> = {
  sem1: 'Semester 1',
  sem2: 'Semester 2',
  sem3: 'Semester 3',
  sem4: 'Semester 4',
};

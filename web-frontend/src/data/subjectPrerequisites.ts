/**
 * Prerequisite topics for each subject, up to 12th standard.
 * Used to display what a student should already know before attempting a subject.
 */

export interface PrereqItem {
  topic: string;
  standardLevel: string; // e.g., '10th', '11th', '12th', 'Sem 1'
  description: string;
}

export interface SubjectPrerequisiteInfo {
  hasPrerequisites: boolean;
  note?: string; // For subjects with no prereqs
  items: PrereqItem[];
}

export const SUBJECT_PREREQUISITES: Record<string, SubjectPrerequisiteInfo> = {

  // ─── Mathematics ──────────────────────────────────────────────────────────
  '12th_math': {
    hasPrerequisites: true,
    items: [
      { topic: 'Algebra & Quadratic Equations', standardLevel: '10th', description: 'Basic algebraic manipulation, roots of equations' },
      { topic: 'Trigonometry', standardLevel: '11th', description: 'Sine, cosine, tangent functions and identities' },
      { topic: 'Differentiation Basics', standardLevel: '11th', description: 'Limits, derivatives of basic functions' },
      { topic: 'Coordinate Geometry', standardLevel: '11th', description: 'Lines, circles, conics' },
    ],
  },

  math1: {
    hasPrerequisites: true,
    items: [
      { topic: 'Complex Numbers', standardLevel: '12th', description: 'Argand plane, modulus, argument, polar form' },
      { topic: 'Matrices & Determinants', standardLevel: '12th', description: 'Matrix operations, inverse, Cramer\'s rule' },
      { topic: 'Calculus — Differentiation', standardLevel: '12th', description: 'Chain rule, implicit differentiation, higher-order derivatives' },
      { topic: 'Integration Basics', standardLevel: '12th', description: 'Anti-derivatives, integration by substitution' },
    ],
  },

  m2: {
    hasPrerequisites: true,
    items: [
      { topic: 'Integration Methods', standardLevel: 'Sem 1', description: 'Integration by parts, partial fractions, reduction formulae' },
      { topic: 'Differential Equations (Intro)', standardLevel: 'Sem 1', description: 'First-order ODEs, separation of variables' },
      { topic: 'Partial Derivatives', standardLevel: 'Sem 1', description: 'Chain rule, Euler\'s theorem for homogeneous functions' },
      { topic: 'Laplace prerequisite — Partial Fractions', standardLevel: '12th', description: 'Decomposing rational expressions' },
    ],
  },

  m3: {
    hasPrerequisites: true,
    items: [
      { topic: 'Ordinary Differential Equations', standardLevel: 'Sem 2', description: 'Linear ODEs, 2nd order with constant coefficients' },
      { topic: 'Fourier Introduction', standardLevel: 'Sem 2', description: 'Periodic functions, Fourier series basics' },
      { topic: 'Integration — Improper Integrals', standardLevel: 'Sem 2', description: 'Beta & Gamma functions' },
      { topic: 'Complex Numbers — Advanced', standardLevel: 'Sem 1', description: 'Complex exponentials, roots of unity' },
    ],
  },

  m4: {
    hasPrerequisites: true,
    items: [
      { topic: 'Laplace & Fourier Transforms', standardLevel: 'Sem 3', description: 'Transform pairs, inverse transforms, convolution' },
      { topic: 'Complex Analysis Basics', standardLevel: 'Sem 3', description: 'Analytic functions, Cauchy-Riemann equations' },
      { topic: 'Probability Basics', standardLevel: '12th', description: 'Basic probability, conditional probability, Bayes theorem' },
      { topic: 'Numerical Methods Intro', standardLevel: 'Sem 1', description: 'Newton-Raphson, Gauss elimination' },
    ],
  },

  // ─── Physics ──────────────────────────────────────────────────────────────
  '12th_phy': {
    hasPrerequisites: true,
    items: [
      { topic: 'Basic Mechanics', standardLevel: '11th', description: 'Newton\'s Laws, Work-Energy theorem, Rotational motion' },
      { topic: 'Wave Motion', standardLevel: '11th', description: 'Wave characteristics, superposition, standing waves' },
      { topic: 'Electrostatics', standardLevel: '12th', description: 'Coulomb\'s law, Electric field, potential, capacitors' },
      { topic: 'Current Electricity', standardLevel: '12th', description: 'Ohm\'s law, Kirchhoff\'s laws, Series/Parallel circuits' },
    ],
  },

  phy1: {
    hasPrerequisites: true,
    items: [
      { topic: 'Dual Nature of Radiation', standardLevel: '12th', description: 'Photoelectric effect, de Broglie wavelength' },
      { topic: 'Optics — Wave & Geometric', standardLevel: '12th', description: 'Reflection, refraction, lenses, diffraction' },
      { topic: 'Magnetic Effects of Current', standardLevel: '12th', description: 'Biot-Savart, Ampere\'s law, Lorentz force' },
      { topic: 'Electromagnetic Induction', standardLevel: '12th', description: 'Faraday\'s law, Lenz\'s law, Self & mutual inductance' },
    ],
  },

  phy2: {
    hasPrerequisites: true,
    items: [
      { topic: 'Semiconductor Basics', standardLevel: '12th', description: 'p-n junction, diodes, basic transistor operation' },
      { topic: 'Electromagnetic Waves', standardLevel: '12th', description: 'Maxwell\'s equations (conceptual), EM spectrum' },
      { topic: 'Quantum Mechanics Intro', standardLevel: 'Sem 1', description: 'Schrödinger equation basics, wave functions' },
      { topic: 'Laser & Optics', standardLevel: 'Sem 1', description: 'Coherence, stimulated emission, fiber optics' },
    ],
  },

  // ─── Chemistry ────────────────────────────────────────────────────────────
  chem1: {
    hasPrerequisites: true,
    items: [
      { topic: 'Periodic Table & Atomic Structure', standardLevel: '11th', description: 'Electronic configuration, periodic trends' },
      { topic: 'Chemical Bonding', standardLevel: '11th', description: 'Ionic, covalent, hydrogen bonding' },
      { topic: 'Thermodynamics Basics', standardLevel: '11th', description: 'First & Second Law, enthalpy, entropy' },
      { topic: 'Electrochemistry Basics', standardLevel: '12th', description: 'Electrolysis, Faraday\'s laws, cell potential' },
    ],
  },

  chem2: {
    hasPrerequisites: true,
    items: [
      { topic: 'Polymers & Composites Intro', standardLevel: 'Sem 1', description: 'Types of polymers, polymerisation reactions' },
      { topic: 'Water Chemistry', standardLevel: 'Sem 1', description: 'Hardness, treatment, softening methods' },
      { topic: 'Surface Chemistry', standardLevel: '12th', description: 'Adsorption, catalysis, colloids' },
      { topic: 'Organic Chemistry Basics', standardLevel: '11th', description: 'Functional groups, IUPAC naming, isomerism' },
    ],
  },

  // ─── Electrical ───────────────────────────────────────────────────────────
  pre_bee: {
    hasPrerequisites: true,
    items: [
      { topic: 'Current Electricity', standardLevel: '12th', description: 'Ohm\'s law, resistance, power, energy' },
      { topic: 'Kirchhoff\'s Laws (KVL & KCL)', standardLevel: '12th', description: 'Mesh & nodal analysis in basic circuits' },
      { topic: 'Capacitors & Inductors', standardLevel: '12th', description: 'Energy storage, RC and RL circuit basics' },
    ],
  },

  bee: {
    hasPrerequisites: true,
    items: [
      { topic: 'DC Circuit Analysis', standardLevel: 'Sem 1 (Pre-BEE)', description: 'Thevenin/Norton, superposition theorem' },
      { topic: 'AC Fundamentals', standardLevel: '12th', description: 'Sinusoidal quantities, phasors, RMS values' },
      { topic: 'Magnetic Circuits', standardLevel: '12th', description: 'Flux, MMF, reluctance, B-H curves' },
    ],
  },

  // ─── Mechanics ────────────────────────────────────────────────────────────
  pre_mech: {
    hasPrerequisites: true,
    items: [
      { topic: 'Newton\'s Laws of Motion', standardLevel: '11th', description: 'Inertia, force-acceleration, action-reaction' },
      { topic: 'Work, Energy & Power', standardLevel: '11th', description: 'Conservation of energy, power calculations' },
      { topic: 'Vectors', standardLevel: '11th', description: 'Vector addition, dot & cross product' },
      { topic: 'System of Particles', standardLevel: '11th', description: 'Centre of mass, angular momentum' },
    ],
  },

  mech: {
    hasPrerequisites: true,
    items: [
      { topic: 'Free Body Diagrams', standardLevel: 'Sem 1 (Pre-Mech)', description: 'Isolating bodies and identifying all forces' },
      { topic: 'Vector Mechanics', standardLevel: '11th–12th', description: 'Moment of force, equivalent force systems' },
      { topic: 'Friction & Normal Force', standardLevel: '12th', description: 'Coefficient of friction, inclined planes' },
    ],
  },

  // ─── Engineering Graphics ─────────────────────────────────────────────────
  eg: {
    hasPrerequisites: false,
    note: 'Engineering Graphics has no strict academic prerequisites. Basic familiarity with 2D geometry (10th level) is sufficient.',
    items: [
      { topic: 'Basic Plane Geometry', standardLevel: '10th', description: 'Lines, angles, triangles, circles — helpful but not required' },
    ],
  },

  // ─── Computer Programming ─────────────────────────────────────────────────
  cp: {
    hasPrerequisites: false,
    note: 'C Programming does not require prior programming knowledge. Basic 10th-level mathematics is sufficient.',
    items: [
      { topic: 'Basic Arithmetic & Logic', standardLevel: '10th', description: 'Operators, number systems — helpful for understanding code' },
    ],
  },

  // ─── Data Structures ──────────────────────────────────────────────────────
  ds: {
    hasPrerequisites: true,
    items: [
      { topic: 'C Programming — Arrays & Pointers', standardLevel: 'Sem 2', description: 'Dynamic memory allocation, pointer arithmetic' },
      { topic: 'C Programming — Functions & Recursion', standardLevel: 'Sem 2', description: 'Recursive functions, call stack understanding' },
      { topic: 'Basic Algorithm Concepts', standardLevel: 'Sem 2', description: 'Loops, conditionals, time complexity intuition' },
    ],
  },

  // ─── DLCOA ────────────────────────────────────────────────────────────────
  dlcoa: {
    hasPrerequisites: true,
    items: [
      { topic: 'Number Systems (Binary, Hex, Octal)', standardLevel: '10th–11th', description: 'Conversions, binary arithmetic, 2\'s complement' },
      { topic: 'Boolean Algebra', standardLevel: '11th', description: 'Logic gates AND, OR, NOT, XOR — truth tables' },
      { topic: 'Basic Digital Electronics', standardLevel: '12th', description: 'Logic families, TTL basics' },
    ],
  },

  // ─── DSGT ─────────────────────────────────────────────────────────────────
  dsgt: {
    hasPrerequisites: true,
    items: [
      { topic: 'Set Theory & Functions', standardLevel: '11th', description: 'Sets, subsets, Cartesian product, relations' },
      { topic: 'Mathematical Induction', standardLevel: '11th', description: 'Proof by induction, recurrence relations' },
      { topic: 'Combinatorics Basics', standardLevel: '12th', description: 'Permutations, Combinations, Binomial theorem' },
    ],
  },

  // ─── Microprocessors ──────────────────────────────────────────────────────
  mp: {
    hasPrerequisites: true,
    items: [
      { topic: 'Digital Logic & Number Systems', standardLevel: 'Sem 3 (DLCOA)', description: 'Binary, hex, Boolean operations, logic circuits' },
      { topic: 'Computer Organization Basics', standardLevel: 'Sem 3 (DLCOA)', description: 'ALU, memory, registers, data path' },
      { topic: 'Assembly Language Concepts', standardLevel: 'Sem 3', description: 'Instruction set, addressing modes basics' },
    ],
  },

  // ─── DBMS ─────────────────────────────────────────────────────────────────
  dbms: {
    hasPrerequisites: true,
    items: [
      { topic: 'C Programming Basics', standardLevel: 'Sem 2', description: 'File handling, structured data concepts' },
      { topic: 'Data Structures', standardLevel: 'Sem 3', description: 'Trees (B-trees used in indexing), Hashing' },
      { topic: 'Logical Reasoning', standardLevel: '12th', description: 'Set operations, relational concepts' },
    ],
  },

  // ─── OS ───────────────────────────────────────────────────────────────────
  os: {
    hasPrerequisites: true,
    items: [
      { topic: 'C Programming', standardLevel: 'Sem 2', description: 'System calls, processes, memory management in C' },
      { topic: 'Computer Organization Basics', standardLevel: 'Sem 3', description: 'CPU architecture, memory hierarchy, I/O' },
      { topic: 'Data Structures', standardLevel: 'Sem 3', description: 'Queues for scheduling, Trees for directory structure' },
    ],
  },

  // ─── AOA ──────────────────────────────────────────────────────────────────
  aoa: {
    hasPrerequisites: true,
    items: [
      { topic: 'Data Structures', standardLevel: 'Sem 3', description: 'Trees, Graphs, Heaps — required for algorithm analysis' },
      { topic: 'Mathematical Induction & Recurrences', standardLevel: '11th', description: 'Needed for proving algorithm correctness' },
      { topic: 'Basic Probability', standardLevel: '12th', description: 'For randomised algorithms and expected complexity' },
    ],
  },

  // ─── CG ───────────────────────────────────────────────────────────────────
  cg: {
    hasPrerequisites: true,
    items: [
      { topic: 'Linear Algebra — Matrices & Transformations', standardLevel: 'Sem 1', description: 'Matrix multiplication for 2D/3D transforms' },
      { topic: 'Coordinate Geometry', standardLevel: '11th', description: 'Equations of lines, circles, parametric forms' },
      { topic: 'Trigonometry', standardLevel: '11th', description: 'Rotation transformations use sin/cos' },
      { topic: 'Basic C Programming', standardLevel: 'Sem 2', description: 'Implementing graphic algorithms in code' },
    ],
  },

  // ─── PCE1 ─────────────────────────────────────────────────────────────────
  pce1: {
    hasPrerequisites: false,
    note: 'PCE-1 (Professional Communication English) has no technical prerequisites. It is a standalone language & communication skills course.',
    items: [],
  },
};

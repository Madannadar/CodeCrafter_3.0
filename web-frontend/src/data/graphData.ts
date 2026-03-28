export interface GraphNode {
  id: string;
  label: string;
  category: 'subject' | 'topic' | 'concept';
  subject?: string;
  mastery: number; // 0-100
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

export const graphNodes: GraphNode[] = [
  // 12th Standard Prerequisites
  { id: '12_algebra', label: 'Algebra (12th)', category: 'topic', mastery: 85 },
  { id: '12_calculus', label: 'Calculus (12th)', category: 'topic', mastery: 72 },
  { id: '12_trigonometry', label: 'Trigonometry (12th)', category: 'topic', mastery: 68 },
  { id: '12_vectors', label: 'Vectors (12th)', category: 'topic', mastery: 60 },
  { id: '12_matrices', label: 'Matrices (12th)', category: 'topic', mastery: 55 },
  { id: '12_physics_em', label: 'Electromagnetism (12th)', category: 'topic', mastery: 50 },
  { id: '12_physics_optics', label: 'Optics (12th)', category: 'topic', mastery: 65 },
  { id: '12_physics_mechanics', label: 'Mechanics (12th)', category: 'topic', mastery: 70 },
  { id: '12_chemistry_basics', label: 'Chemistry Basics (12th)', category: 'topic', mastery: 62 },

  // Engineering Subjects
  { id: 'math1', label: 'Engg. Mathematics I', category: 'subject', mastery: 65 },
  { id: 'phy1', label: 'Engg. Physics', category: 'subject', mastery: 58 },
  { id: 'chem1', label: 'Engg. Chemistry', category: 'subject', mastery: 70 },
  { id: 'bee', label: 'Basic Electrical Engg.', category: 'subject', mastery: 45 },
  { id: 'mech', label: 'Engg. Mechanics', category: 'subject', mastery: 52 },

  // Math I Topics
  { id: 'complex_numbers', label: 'Complex Numbers', category: 'concept', subject: 'math1', mastery: 75 },
  { id: 'de_moivre', label: "De Moivre's Theorem", category: 'concept', subject: 'math1', mastery: 60 },
  { id: 'hyperbolic_fn', label: 'Hyperbolic Functions', category: 'concept', subject: 'math1', mastery: 45 },
  { id: 'partial_derivatives', label: 'Partial Derivatives', category: 'concept', subject: 'math1', mastery: 50 },
  { id: 'euler_theorem', label: "Euler's Theorem", category: 'concept', subject: 'math1', mastery: 35 },
  { id: 'matrices_rank', label: 'Matrix Rank', category: 'concept', subject: 'math1', mastery: 55 },
  { id: 'taylor_series', label: 'Taylor Series', category: 'concept', subject: 'math1', mastery: 40 },
  { id: 'newton_raphson', label: 'Newton-Raphson', category: 'concept', subject: 'math1', mastery: 30 },

  // Physics Topics
  { id: 'interference', label: 'Interference', category: 'concept', subject: 'phy1', mastery: 65 },
  { id: 'diffraction', label: 'Diffraction', category: 'concept', subject: 'phy1', mastery: 55 },
  { id: 'laser', label: 'LASER', category: 'concept', subject: 'phy1', mastery: 50 },
  { id: 'fiber_optics', label: 'Fiber Optics', category: 'concept', subject: 'phy1', mastery: 60 },
  { id: 'quantum_mech', label: 'Quantum Mechanics', category: 'concept', subject: 'phy1', mastery: 35 },

  // BEE Topics
  { id: 'dc_circuits', label: 'DC Circuits', category: 'concept', subject: 'bee', mastery: 55 },
  { id: 'ohms_law', label: "Ohm's Law", category: 'concept', subject: 'bee', mastery: 80 },
  { id: 'magnetic_circuits', label: 'Magnetic Circuits', category: 'concept', subject: 'bee', mastery: 30 },
  { id: 'rl_rc_circuits', label: 'RL/RC Circuits', category: 'concept', subject: 'bee', mastery: 25 },

  // Mechanics Topics
  { id: 'force_systems', label: 'Force Systems', category: 'concept', subject: 'mech', mastery: 60 },
  { id: 'equilibrium', label: 'Equilibrium', category: 'concept', subject: 'mech', mastery: 45 },
  { id: 'friction', label: 'Friction', category: 'concept', subject: 'mech', mastery: 55 },
  { id: 'centroid_moi', label: 'Centroid & MOI', category: 'concept', subject: 'mech', mastery: 40 },
];

export const graphEdges: GraphEdge[] = [
  // 12th → Engineering Math
  { source: '12_algebra', target: 'math1', label: 'prerequisite' },
  { source: '12_calculus', target: 'math1', label: 'prerequisite' },
  { source: '12_trigonometry', target: 'math1', label: 'prerequisite' },
  { source: '12_matrices', target: 'math1', label: 'prerequisite' },

  // 12th → Engineering Physics
  { source: '12_physics_optics', target: 'phy1', label: 'prerequisite' },
  { source: '12_physics_em', target: 'phy1', label: 'prerequisite' },
  { source: '12_physics_mechanics', target: 'phy1', label: 'prerequisite' },

  // 12th → Engineering Chemistry
  { source: '12_chemistry_basics', target: 'chem1', label: 'prerequisite' },

  // 12th → BEE
  { source: '12_physics_em', target: 'bee', label: 'prerequisite' },
  { source: '12_algebra', target: 'bee', label: 'prerequisite' },

  // 12th → Mechanics
  { source: '12_physics_mechanics', target: 'mech', label: 'prerequisite' },
  { source: '12_vectors', target: 'mech', label: 'prerequisite' },
  { source: '12_trigonometry', target: 'mech', label: 'prerequisite' },

  // Subject → Topics
  { source: 'math1', target: 'complex_numbers' },
  { source: 'complex_numbers', target: 'de_moivre' },
  { source: '12_trigonometry', target: 'de_moivre' },
  { source: 'complex_numbers', target: 'hyperbolic_fn' },
  { source: 'math1', target: 'partial_derivatives' },
  { source: '12_calculus', target: 'partial_derivatives' },
  { source: 'partial_derivatives', target: 'euler_theorem' },
  { source: '12_matrices', target: 'matrices_rank' },
  { source: 'math1', target: 'matrices_rank' },
  { source: '12_calculus', target: 'taylor_series' },
  { source: 'math1', target: 'taylor_series' },
  { source: 'taylor_series', target: 'newton_raphson' },

  // Physics topics
  { source: 'phy1', target: 'interference' },
  { source: 'interference', target: 'diffraction' },
  { source: '12_physics_optics', target: 'interference' },
  { source: 'diffraction', target: 'laser' },
  { source: 'laser', target: 'fiber_optics' },
  { source: 'phy1', target: 'quantum_mech' },

  // BEE topics
  { source: 'bee', target: 'dc_circuits' },
  { source: 'dc_circuits', target: 'ohms_law' },
  { source: 'ohms_law', target: 'rl_rc_circuits' },
  { source: 'bee', target: 'magnetic_circuits' },
  { source: '12_physics_em', target: 'magnetic_circuits' },

  // Mechanics topics
  { source: 'mech', target: 'force_systems' },
  { source: 'force_systems', target: 'equilibrium' },
  { source: 'equilibrium', target: 'friction' },
  { source: 'mech', target: 'centroid_moi' },
  { source: '12_calculus', target: 'centroid_moi' },

  // Cross-subject dependencies
  { source: 'complex_numbers', target: 'quantum_mech' },
  { source: 'partial_derivatives', target: 'quantum_mech' },
  { source: 'ohms_law', target: 'magnetic_circuits' },
];

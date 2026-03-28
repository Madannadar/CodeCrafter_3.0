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
  // Engineering Subjects
  { id: 'math1', label: 'Engg. Mathematics I', category: 'subject', mastery: 65 },
  { id: 'phy1', label: 'Engg. Physics I', category: 'subject', mastery: 58 },
  { id: 'chem1', label: 'Engg. Chemistry I', category: 'subject', mastery: 70 },
  { id: 'bee', label: 'Basic Electrical Engg.', category: 'subject', mastery: 45 },
  { id: 'mech', label: 'Engg. Mechanics', category: 'subject', mastery: 52 },
  { id: 'm2', label: 'Engg. Mathematics II', category: 'subject', mastery: 65 },
  { id: 'phy2', label: 'Engg. Physics II', category: 'subject', mastery: 58 },
  { id: 'chem2', label: 'Engg. Chemistry II', category: 'subject', mastery: 72 },
  { id: 'eg', label: 'Engg. Graphics', category: 'subject', mastery: 60 },
  { id: 'cp', label: 'Computer Programming', category: 'subject', mastery: 75 },

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

  // New Topics
  { id: 'diff_eq', label: 'Differential Eq.', category: 'concept', subject: 'm2', mastery: 60 },
  { id: 'num_methods', label: 'Numerical Methods', category: 'concept', subject: 'm2', mastery: 55 },
  { id: 'spectroscopy', label: 'Spectroscopy', category: 'concept', subject: 'chem2', mastery: 70 },
  { id: 'c_prog', label: 'C Programming', category: 'concept', subject: 'cp', mastery: 80 },
  { id: 'algorithms', label: 'Algorithms', category: 'concept', subject: 'cp', mastery: 70 },
  { id: 'ortho_proj', label: 'Orthographic Proj.', category: 'concept', subject: 'eg', mastery: 60 },
];

export const graphEdges: GraphEdge[] = [
  // Subject -> Topics
  { source: 'math1', target: 'complex_numbers' },
  { source: 'complex_numbers', target: 'de_moivre' },
  { source: 'complex_numbers', target: 'hyperbolic_fn' },
  { source: 'math1', target: 'partial_derivatives' },
  { source: 'partial_derivatives', target: 'euler_theorem' },
  { source: 'math1', target: 'matrices_rank' },
  { source: 'math1', target: 'taylor_series' },
  { source: 'taylor_series', target: 'newton_raphson' },

  // Physics topics
  { source: 'phy1', target: 'interference' },
  { source: 'interference', target: 'diffraction' },
  { source: 'diffraction', target: 'laser' },
  { source: 'laser', target: 'fiber_optics' },
  { source: 'phy1', target: 'quantum_mech' },

  // BEE topics
  { source: 'bee', target: 'dc_circuits' },
  { source: 'dc_circuits', target: 'ohms_law' },
  { source: 'ohms_law', target: 'rl_rc_circuits' },
  { source: 'bee', target: 'magnetic_circuits' },

  // Mechanics topics
  { source: 'mech', target: 'force_systems' },
  { source: 'force_systems', target: 'equilibrium' },
  { source: 'equilibrium', target: 'friction' },
  { source: 'mech', target: 'centroid_moi' },

  // New Subject -> Topics
  { source: 'm2', target: 'diff_eq' },
  { source: 'm2', target: 'num_methods' },
  { source: 'chem2', target: 'spectroscopy' },
  { source: 'cp', target: 'c_prog' },
  { source: 'cp', target: 'algorithms' },
  { source: 'eg', target: 'ortho_proj' },

  // Subject Prerequisites
  { source: 'math1', target: 'm2', label: 'prerequisite' },
  { source: 'phy1', target: 'phy2', label: 'prerequisite' },
  { source: 'chem1', target: 'chem2', label: 'prerequisite' },

  // Cross-subject dependencies
  { source: 'complex_numbers', target: 'quantum_mech' },
  { source: 'partial_derivatives', target: 'quantum_mech' },
  { source: 'ohms_law', target: 'magnetic_circuits' },
];

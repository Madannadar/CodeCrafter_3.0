/**
 * Subject roadmaps — what to study next after passing a quiz.
 * Each subject maps to an ordered list of roadmap steps.
 */

export interface RoadmapStep {
  title: string;
  description: string;
  icon: string;
  type: 'completed' | 'next' | 'future';
}

export type SubjectRoadmap = RoadmapStep[];

export const SUBJECT_ROADMAPS: Record<string, SubjectRoadmap> = {

  // ─── Mathematics Domain ──────────────────────────────────────────────────
  '12th_math': [
    { title: '12th Mathematics', description: 'Complex Numbers, Matrices, Differentiation & Integration', icon: '✅', type: 'completed' },
    { title: 'Engineering Mathematics 1', description: 'De Moivre\'s Theorem, Partial Derivatives, Euler\'s Theorem, Numerical Methods', icon: '→', type: 'next' },
    { title: 'Engineering Mathematics 2', description: 'Integration Tech., Differential Equations, Fourier Series', icon: '○', type: 'future' },
    { title: 'Engineering Mathematics 3', description: 'Laplace Transforms, PDEs, Complex Functions', icon: '○', type: 'future' },
    { title: 'Engineering Mathematics 4', description: 'Z-Transforms, Probability, Numerical Analysis', icon: '○', type: 'future' },
  ],

  math1: [
    { title: '12th Mathematics ✓', description: 'Foundation — Completed', icon: '✅', type: 'completed' },
    { title: 'Engineering Mathematics 1 ✓', description: 'Complex Numbers, Matrices, Partial Derivatives', icon: '✅', type: 'completed' },
    { title: 'Engineering Mathematics 2', description: 'Integration Techniques, Beta-Gamma, ODE, Fourier Series', icon: '→', type: 'next' },
    { title: 'Engineering Mathematics 3', description: 'Laplace & Fourier Transforms, PDEs, Complex Functions', icon: '○', type: 'future' },
    { title: 'Engineering Mathematics 4', description: 'Z-Transforms, Probability & Statistics, Numerical Analysis', icon: '○', type: 'future' },
    { title: 'Advanced Topics', description: 'Linear Algebra, Tensor Calculus, Optimization', icon: '○', type: 'future' },
  ],

  m2: [
    { title: 'Math I & II ✓', description: 'Foundation completed', icon: '✅', type: 'completed' },
    { title: 'Engineering Mathematics 3', description: 'Laplace Transforms, Fourier Series, PDEs, Complex Functions', icon: '→', type: 'next' },
    { title: 'Engineering Mathematics 4', description: 'Z-Transforms, Probability, Statistics, Numerical Methods', icon: '○', type: 'future' },
    { title: 'Apply in Core Subjects', description: 'Use Fourier/Laplace in Signal Processing & Control Systems', icon: '○', type: 'future' },
  ],

  m3: [
    { title: 'Math I, II & III ✓', description: 'Foundation completed', icon: '✅', type: 'completed' },
    { title: 'Engineering Mathematics 4', description: 'Z-Transforms, Probability & Statistics, Numerical Analysis', icon: '→', type: 'next' },
    { title: 'Signal Processing', description: 'Apply Fourier & Laplace in DSP', icon: '○', type: 'future' },
    { title: 'Control Systems', description: 'Transfer functions, Stability using Laplace', icon: '○', type: 'future' },
  ],

  m4: [
    { title: 'Full Math Domain ✓', description: 'All 4 semesters of Engineering Mathematics completed', icon: '✅', type: 'completed' },
    { title: 'Advanced Mathematics', description: 'Real Analysis, Abstract Algebra, Topology', icon: '→', type: 'next' },
    { title: 'Machine Learning Math', description: 'Linear Algebra (Eigenvalues), Probability, Optimization', icon: '○', type: 'future' },
    { title: 'Numerical Methods Deep Dive', description: 'FEM, FDM for engineering simulations', icon: '○', type: 'future' },
  ],

  // ─── Physics Domain ──────────────────────────────────────────────────────
  '12th_phy': [
    { title: '12th Physics ✓', description: 'Dual Nature, Optics, Electrostatics — Completed', icon: '✅', type: 'completed' },
    { title: 'Engineering Physics 1', description: 'Quantum Mechanics, Fiber Optics, Acoustics, Laser', icon: '→', type: 'next' },
    { title: 'Engineering Physics 2', description: 'Semiconductors, Magnetic Materials, Superconductivity', icon: '○', type: 'future' },
    { title: 'Specialized Applications', description: 'Photonics, Nanotechnology, Materials Science', icon: '○', type: 'future' },
  ],

  phy1: [
    { title: '12th Physics & Phy I ✓', description: 'Foundation completed', icon: '✅', type: 'completed' },
    { title: 'Engineering Physics 2', description: 'Semiconductors, p-n Junction, Magnetic Materials, Superconductors, Dielectrics', icon: '→', type: 'next' },
    { title: 'Electronics', description: 'Transistors, Op-Amps, Digital Circuits', icon: '○', type: 'future' },
    { title: 'Photonics & Nanotechnology', description: 'Laser applications, Nano-materials, Photovoltaics', icon: '○', type: 'future' },
  ],

  phy2: [
    { title: 'Engineering Physics Domain ✓', description: 'Both semesters completed', icon: '✅', type: 'completed' },
    { title: 'Electronics Engineering', description: 'Transistors, Op-Amps, Oscillators, Filters', icon: '→', type: 'next' },
    { title: 'Photonics', description: 'Fiber optic communications, Photovoltaics, LiDAR', icon: '○', type: 'future' },
    { title: 'Nanotechnology', description: 'Nano-materials, MEMS, Quantum Dots', icon: '○', type: 'future' },
  ],

  // ─── Chemistry Domain ────────────────────────────────────────────────────
  chem1: [
    { title: 'Engineering Chemistry 1 ✓', description: 'Electrochemistry, Polymers, Water Treatment — Completed', icon: '✅', type: 'completed' },
    { title: 'Engineering Chemistry 2', description: 'Fuels, Lubricants, Cement, Corrosion, Advanced Materials', icon: '→', type: 'next' },
    { title: 'Materials Science', description: 'Composites, Smart Materials, Nanomaterials', icon: '○', type: 'future' },
    { title: 'Industrial Chemistry', description: 'Manufacturing processes, Chemical industries', icon: '○', type: 'future' },
  ],

  chem2: [
    { title: 'Engineering Chemistry Domain ✓', description: 'Both semesters completed', icon: '✅', type: 'completed' },
    { title: 'Materials Science & Engineering', description: 'Composites, Nanomaterials, Smart Coatings', icon: '→', type: 'next' },
    { title: 'Environmental Engineering', description: 'Green chemistry, Waste management, Pollution control', icon: '○', type: 'future' },
    { title: 'Biochemistry / Biomedical', description: 'Biomaterials, Drug delivery systems', icon: '○', type: 'future' },
  ],

  // ─── Electrical Domain ───────────────────────────────────────────────────
  pre_bee: [
    { title: 'BEE Prerequisites ✓', description: 'Current Electricity, Basic Circuits — Completed', icon: '✅', type: 'completed' },
    { title: 'Basic Electrical Engineering', description: 'AC/DC Networks, Transformers, Machines, Measurement', icon: '→', type: 'next' },
    { title: 'Power Electronics', description: 'Rectifiers, Inverters, DC-DC converters', icon: '○', type: 'future' },
    { title: 'Electrical Machines', description: 'DC motors, Induction motors, Synchronous machines', icon: '○', type: 'future' },
  ],

  bee: [
    { title: 'Pre-BEE & BEE ✓', description: 'Foundation completed', icon: '✅', type: 'completed' },
    { title: 'Electrical Circuit Analysis', description: 'Advanced network theorems, Transient analysis, Resonance', icon: '→', type: 'next' },
    { title: 'Power Electronics', description: 'Rectifiers, Inverters, Choppers, SMPS', icon: '○', type: 'future' },
    { title: 'Electrical Machines', description: 'Motors, Generators, Transformers — Advanced', icon: '○', type: 'future' },
    { title: 'Power Systems', description: 'Generation, Transmission, Distribution, Smart Grids', icon: '○', type: 'future' },
  ],

  // ─── Mechanics Domain ────────────────────────────────────────────────────
  pre_mech: [
    { title: 'Mechanics Prerequisites ✓', description: 'Newton\'s Laws, Vectors, Free Body Diagrams — Completed', icon: '✅', type: 'completed' },
    { title: 'Engineering Mechanics', description: 'Statics, Dynamics, Friction, Kinematics, Virtual Work', icon: '→', type: 'next' },
    { title: 'Strength of Materials', description: 'Stress, Strain, Beams, Columns, Deflections', icon: '○', type: 'future' },
    { title: 'Machine Design', description: 'Shafts, Gears, Bearings, Fasteners, Welding', icon: '○', type: 'future' },
  ],

  mech: [
    { title: 'Pre-Mech & Eng. Mechanics ✓', description: 'Foundation completed', icon: '✅', type: 'completed' },
    { title: 'Strength of Materials', description: 'Stress, Strain, Shear Force, Bending Moment, Deflection', icon: '→', type: 'next' },
    { title: 'Fluid Mechanics', description: 'Fluid statics, Bernoulli, Viscous flow, Turbomachinery', icon: '○', type: 'future' },
    { title: 'Theory of Machines', description: 'Kinematics of mechanisms, Cams, Gears, Flywheels', icon: '○', type: 'future' },
    { title: 'Machine Design', description: 'Failure theories, Fatigue, Shaft & Gear design', icon: '○', type: 'future' },
  ],

  // ─── Engineering Graphics ────────────────────────────────────────────────
  eg: [
    { title: 'Engineering Graphics ✓', description: 'Orthographic & Isometric projections, Sections — Completed', icon: '✅', type: 'completed' },
    { title: 'Computer Aided Design (CAD)', description: 'AutoCAD 2D, Solid modelling, Assembly design', icon: '→', type: 'next' },
    { title: 'CAD Modelling (3D)', description: 'SolidWorks / CATIA — parametric modelling', icon: '○', type: 'future' },
    { title: 'Product Design & Manufacturing', description: 'Design for manufacture, GD&T, Tolerancing', icon: '○', type: 'future' },
  ],

  // ─── Computer Programming ────────────────────────────────────────────────
  cp: [
    { title: 'C Programming ✓', description: 'Variables, loops, functions, arrays, pointers — Completed', icon: '✅', type: 'completed' },
    { title: 'Data Structures', description: 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs', icon: '→', type: 'next' },
    { title: 'OOP (C++ / Java)', description: 'Classes, Inheritance, Polymorphism, Templates', icon: '○', type: 'future' },
    { title: 'Analysis of Algorithms', description: 'Time & Space complexity, Sorting, Dynamic Programming', icon: '○', type: 'future' },
    { title: 'Systems / Advanced', description: 'OS, DBMS, Compilers, Distributed Systems', icon: '○', type: 'future' },
  ],

  // ─── Data Structures ─────────────────────────────────────────────────────
  ds: [
    { title: 'C Programming & DS ✓', description: 'Foundation completed', icon: '✅', type: 'completed' },
    { title: 'Analysis of Algorithms', description: 'Recursion, Divide & Conquer, Greedy, DP, Graph Algorithms', icon: '→', type: 'next' },
    { title: 'DBMS', description: 'Relational model, SQL, Normalization, Transactions', icon: '○', type: 'future' },
    { title: 'Operating Systems', description: 'Processes, Scheduling, Memory management, File systems', icon: '○', type: 'future' },
    { title: 'System Design', description: 'Scalable architectures, Caching, Load balancing', icon: '○', type: 'future' },
  ],

  // ─── DLCOA ───────────────────────────────────────────────────────────────
  dlcoa: [
    { title: 'DLCOA ✓', description: 'Boolean Algebra, Combinational & Sequential Circuits, Computer Organisation — Completed', icon: '✅', type: 'completed' },
    { title: 'Microprocessors', description: '8085/8086 Architecture, Assembly Programming, I/O interfacing', icon: '→', type: 'next' },
    { title: 'Computer Architecture', description: 'Pipelining, Cache Memory, RISC vs CISC, Multicore', icon: '○', type: 'future' },
    { title: 'Embedded Systems', description: 'ARM, Microcontrollers, RTOS, IoT', icon: '○', type: 'future' },
  ],

  // ─── DSGT ────────────────────────────────────────────────────────────────
  dsgt: [
    { title: 'DSGT ✓', description: 'Set Theory, Relations, Graph Theory, Trees — Completed', icon: '✅', type: 'completed' },
    { title: 'Analysis of Algorithms', description: 'Graph algorithms — BFS, DFS, Shortest Path, MST', icon: '→', type: 'next' },
    { title: 'Theory of Computation', description: 'Automata, Formal Languages, Turing Machines', icon: '○', type: 'future' },
    { title: 'Cryptography', description: 'Number theory applied to encryption, RSA, ECC', icon: '○', type: 'future' },
  ],

  // ─── Microprocessors ─────────────────────────────────────────────────────
  mp: [
    { title: 'Microprocessors ✓', description: '8085/8086 Architecture & Programming — Completed', icon: '✅', type: 'completed' },
    { title: 'Microcontrollers (8051 / ARM)', description: 'Timers, Interrupts, Serial Communication, PWM', icon: '→', type: 'next' },
    { title: 'Embedded Systems', description: 'Real-Time OS, Sensor interfacing, GPIO, I2C, SPI', icon: '○', type: 'future' },
    { title: 'IoT & Edge Computing', description: 'MQTT, Edge AI, Smart devices, FPGA basics', icon: '○', type: 'future' },
  ],

  // ─── DBMS ────────────────────────────────────────────────────────────────
  dbms: [
    { title: 'DBMS ✓', description: 'ER Model, SQL, Normalization, Transactions, Indexing — Completed', icon: '✅', type: 'completed' },
    { title: 'Advanced SQL & NoSQL', description: 'Window functions, CTEs, MongoDB, Cassandra', icon: '→', type: 'next' },
    { title: 'Distributed Databases', description: 'CAP theorem, Sharding, Replication, ACID vs BASE', icon: '○', type: 'future' },
    { title: 'Data Warehousing & Mining', description: 'OLAP, Star schema, ETL pipelines, ML on data', icon: '○', type: 'future' },
  ],

  // ─── OS ──────────────────────────────────────────────────────────────────
  os: [
    { title: 'Operating Systems ✓', description: 'Processes, Threads, Scheduling, Memory, File Systems — Completed', icon: '✅', type: 'completed' },
    { title: 'Linux & Shell Scripting', description: 'System calls, Bash scripting, Process management', icon: '→', type: 'next' },
    { title: 'Distributed Systems', description: 'IPC, Synchronization, Consensus algorithms, Fault tolerance', icon: '○', type: 'future' },
    { title: 'Virtualization & Cloud', description: 'Containers (Docker), Kubernetes, Cloud OS concepts', icon: '○', type: 'future' },
  ],

  // ─── AOA ─────────────────────────────────────────────────────────────────
  aoa: [
    { title: 'Analysis of Algorithms ✓', description: 'Complexity, Sorting, Greedy, DP, Graph Algorithms — Completed', icon: '✅', type: 'completed' },
    { title: 'Advanced Algorithms', description: 'Network Flow, String Matching, Approximation, Randomised', icon: '→', type: 'next' },
    { title: 'Competitive Programming', description: 'LeetCode, Codeforces — apply algorithms in contests', icon: '○', type: 'future' },
    { title: 'Machine Learning Algorithms', description: 'Gradient Descent, SVMs, Decision Trees — algorithmic side', icon: '○', type: 'future' },
  ],

  // ─── CG ──────────────────────────────────────────────────────────────────
  cg: [
    { title: 'Computer Graphics ✓', description: '2D/3D Transformations, Rendering, Clipping — Completed', icon: '✅', type: 'completed' },
    { title: 'OpenGL / Vulkan Programming', description: 'Shaders, Lighting models, Texturing, Framebuffers', icon: '→', type: 'next' },
    { title: 'Game Development', description: 'Unity / Unreal Engine, Physics engines, Game loops', icon: '○', type: 'future' },
    { title: 'Computer Vision', description: 'Image processing, Feature detection, Deep learning for vision', icon: '○', type: 'future' },
  ],

  // ─── PCE1 ────────────────────────────────────────────────────────────────
  pce1: [
    { title: 'PCE-1 ✓', description: 'Professional Communication English 1 — Completed', icon: '✅', type: 'completed' },
    { title: 'Technical Report Writing', description: 'Formal reports, Project documentation, IEEE format', icon: '→', type: 'next' },
    { title: 'Presentation Skills', description: 'Seminars, Technical talks, Conference papers', icon: '○', type: 'future' },
    { title: 'Professional Development', description: 'Resume writing, Interview skills, Group Discussions', icon: '○', type: 'future' },
  ],
};

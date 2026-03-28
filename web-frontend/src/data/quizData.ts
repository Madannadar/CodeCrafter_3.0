export interface Question {
  id: string;
  type: string;
  difficulty: string;
  concept: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  prerequisiteId?: string;
  questions: Question[];
}

// --- ENGINEERING MATH 1 (from m1.js) ---
const math1Questions: Question[] = [
  { id:'m1_q1', type:'mcq', difficulty:'easy', concept:'Imaginary Unit', question:'What is the value of i²?', options:['1','-1','i','-i'], answer:'-1', explanation:'By definition, i² = -1.' },
  { id:'m1_q2', type:'mcq', difficulty:'easy', concept:'Imaginary Unit', question:'What is i³?', options:['i','-i','1','-1'], answer:'-i', explanation:'i³ = i² × i = -1 × i = -i.' },
  { id:'m1_q3', type:'short', difficulty:'easy', concept:'Algebra of Complex Numbers', question:'Add (3 + 2i) + (4 − i)', answer:'7 + i', explanation:'Add real and imaginary parts separately.' },
  { id:'m1_q4', type:'short', difficulty:'easy', concept:'Algebra of Complex Numbers', question:'Multiply (1 + i)(1 − i)', answer:'2', explanation:'Use (a+b)(a−b)=a²−b².' },
  { id:'m1_q5', type:'mcq', difficulty:'easy', concept:'Cartesian Form', question:'Standard form of a complex number is', options:['a+b','a+bi','ab+i','ai+b'], answer:'a+bi', explanation:'Complex numbers are expressed as a + bi.' },
  { id:'m1_q6', type:'mcq', difficulty:'easy', concept:'Conjugate', question:'Conjugate of 3 + 4i is', options:['3−4i','−3+4i','4−3i','3+4i'], answer:'3−4i', explanation:'Conjugate changes sign of imaginary part.' },
  { id:'m1_q7', type:'short', difficulty:'medium', concept:'Modulus', question:'Find modulus of 3 + 4i', answer:'5', explanation:'√(a²+b²) = √(9+16) = 5.' },
  { id:'m1_q8', type:'mcq', difficulty:'medium', concept:'Modulus', question:'|1+i| = ?', options:['1','√2','2','0'], answer:'√2', explanation:'√(1²+1²)=√2.' },
  { id:'m1_q9', type:'mcq', difficulty:'medium', concept:'Argument', question:'Argument of i', options:['0','π/2','π','3π/2'], answer:'π/2', explanation:'Point lies on positive imaginary axis.' },
  { id:'m1_q10', type:'short', difficulty:'medium', concept:'Polar Form', question:'Convert 1+i to polar form', answer:'√2(cosπ/4 + i sinπ/4)', explanation:'r=√2, θ=π/4.' },
  { id:'m1_q11', type:'short', difficulty:'medium', concept:'Exponential Form', question:'Euler form of complex number', answer:'re^{iθ}', explanation:'From Euler formula.' },
  { id:'m1_q12', type:'mcq', difficulty:'easy', concept:'Argand Plane', question:'Complex numbers are represented geometrically on', options:['Cartesian plane','Argand plane','Number line','Polar graph'], answer:'Argand plane', explanation:'Argand diagram represents complex numbers.' },
  { id:'m1_q13', type:'mcq', difficulty:'medium', concept:'Geometric Interpretation', question:'Argument represents', options:['Slope','Angle with x-axis','Distance','Imaginary part'], answer:'Angle with x-axis', explanation:'Angle from positive real axis.' },
  { id:'m1_q14', type:'mcq', difficulty:'medium', concept:'Algebra of Complex Numbers', question:'(i)^4 = ?', options:['1','-1','i','-i'], answer:'1', explanation:'i^4=1.' },
  { id:'m1_q15', type:'short', difficulty:'medium', concept:'Conjugate', question:'Conjugate of 7 − 5i', answer:'7 + 5i', explanation:'Change sign of imaginary part.' },
  { id:'m1_q16', type:'short', difficulty:'medium', concept:'Modulus', question:'|5i|', answer:'5', explanation:'Distance from origin.' },
  { id:'m1_q17', type:'short', difficulty:'hard', concept:'Polar Form', question:'Write -1 in polar form', answer:'1(cosπ + i sinπ)', explanation:'Angle π.' },
  { id:'m1_q18', type:'short', difficulty:'hard', concept:'Exponential Form', question:'Exponential form of -1', answer:'e^{iπ}', explanation:'Euler formula.' },
  { id:'m1_q19', type:'mcq', difficulty:'medium', concept:'Argand Plane', question:'Point for -3 + 2i lies in', options:['Quadrant I','Quadrant II','Quadrant III','Quadrant IV'], answer:'Quadrant II', explanation:'x negative y positive.' },
  { id:'m1_q20', type:'short', difficulty:'hard', concept:'Algebra of Complex Numbers', question:'(2+i)^2', answer:'3+4i', explanation:'Expand square.' },
  { id:'m1_q21', type:'conceptual', difficulty:'easy', concept:'De Moivre Theorem', question:"State De Moivre's Theorem.", answer:'(cosθ + i sinθ)^n = cos(nθ) + i sin(nθ)', explanation:"De Moivre's theorem connects powers of complex numbers with trigonometric multiples." },
  { id:'m1_q22', type:'conceptual', difficulty:'easy', concept:'Hyperbolic Functions', question:'Define cosh(x).', answer:'(e^x + e^-x)/2', explanation:'Cosh is the even hyperbolic function.' },
  { id:'m1_q23', type:'mcq', difficulty:'easy', concept:'Hyperbolic Functions', question:'The definition of sinh(x) is:', options:['(e^x − e^-x)/2','(e^x + e^-x)/2','sin(x)','cos(x)'], answer:'(e^x − e^-x)/2', explanation:'Sinh is defined using exponential functions.' },
  { id:'m1_q24', type:'conceptual', difficulty:'medium', concept:'Partial Derivatives', question:'Define partial derivative.', answer:'Derivative of a function with respect to one variable while keeping others constant.', explanation:'Used for multivariable functions.' },
  { id:'m1_q25', type:'numerical', difficulty:'medium', concept:'Partial Derivatives', question:'Find ∂(x²y)/∂x.', answer:'2xy', explanation:'Treat y as constant.' },
  { id:'m1_q26', type:'conceptual', difficulty:'medium', concept:'Euler Theorem', question:"State Euler's theorem for homogeneous functions.", answer:'x(∂z/∂x) + y(∂z/∂y) = nz', explanation:'Valid when z is homogeneous of degree n.' },
  { id:'m1_q27', type:'mcq', difficulty:'easy', concept:'Matrix Types', question:'A matrix equal to its transpose is:', options:['Symmetric matrix','Orthogonal matrix','Unitary matrix','Diagonal matrix'], answer:'Symmetric matrix', explanation:'A = Aᵀ.' },
  { id:'m1_q28', type:'conceptual', difficulty:'medium', concept:'Newton Raphson Method', question:'What is Newton Raphson method used for?', answer:'Finding numerical roots of equations.', explanation:'Uses iterative formula.' },
  { id:'m1_q29', type:'conceptual', difficulty:'easy', concept:'Taylor Series', question:'What does Taylor series represent?', answer:'Expansion of function around a point.', explanation:'Infinite power series representation.' },
  { id:'m1_q30', type:'conceptual', difficulty:'easy', concept:'Maclaurin Series', question:'Maclaurin series is Taylor series expanded around:', answer:'x = 0', explanation:'Special case of Taylor series.' },
];

// --- 12TH MATH (from 12th-math.js) - prerequisite for Math1 ---
const math12Questions: Question[] = [
  { id:'MATH_Q01', type:'mcq', difficulty:'easy', concept:'Imaginary Unit', question:'What is the value of i²?', options:['1','-1','i','-i'], answer:'-1', explanation:'By definition of imaginary unit, i² = -1.' },
  { id:'MATH_Q02', type:'mcq', difficulty:'easy', concept:'Imaginary Unit', question:'What is i³?', options:['i','-i','1','-1'], answer:'-i', explanation:'i³ = i² × i = -1 × i = -i.' },
  { id:'MATH_Q03', type:'short', difficulty:'easy', concept:'Algebra of Complex Numbers', question:'Add (3 + 2i) + (4 − i)', answer:'7 + i', explanation:'Add real and imaginary parts separately.' },
  { id:'MATH_Q04', type:'short', difficulty:'easy', concept:'Algebra of Complex Numbers', question:'Multiply (1 + i)(1 − i)', answer:'2', explanation:'Use (a+b)(a−b)=a²−b².' },
  { id:'MATH_Q05', type:'mcq', difficulty:'easy', concept:'Cartesian Form', question:'Standard form of a complex number is', options:['a+b','a+bi','ab+i','ai+b'], answer:'a+bi', explanation:'Complex numbers are expressed as a + bi.' },
  { id:'MATH_Q06', type:'short', difficulty:'easy', concept:'Cartesian Form', question:'Identify real and imaginary parts of 5 + 7i', answer:'Real = 5, Imaginary = 7', explanation:'In a+bi, a is real part and b is imaginary part.' },
  { id:'MATH_Q07', type:'mcq', difficulty:'easy', concept:'Conjugate', question:'Conjugate of 3 + 4i is', options:['3−4i','−3+4i','4−3i','3+4i'], answer:'3−4i', explanation:'Conjugate changes sign of imaginary part.' },
  { id:'MATH_Q08', type:'short', difficulty:'medium', concept:'Conjugate', question:'Find (3 + 2i)(3 − 2i)', answer:'13', explanation:'a² + b² property.' },
  { id:'MATH_Q09', type:'short', difficulty:'medium', concept:'Modulus', question:'Find modulus of 3 + 4i', answer:'5', explanation:'√(a²+b²).' },
  { id:'MATH_Q10', type:'mcq', difficulty:'medium', concept:'Modulus', question:'|1+i| = ?', options:['1','√2','2','0'], answer:'√2', explanation:'√(1²+1²)=√2.' },
  { id:'MATH_Q11', type:'short', difficulty:'medium', concept:'Argument', question:'Argument of 1 + 0i is', answer:'0', explanation:'Point lies on positive real axis.' },
  { id:'MATH_Q12', type:'mcq', difficulty:'medium', concept:'Argument', question:'Argument of i', options:['0','π/2','π','3π/2'], answer:'π/2', explanation:'Point lies on positive imaginary axis.' },
  { id:'MATH_Q13', type:'short', difficulty:'medium', concept:'Polar Form', question:'Convert 1+i to polar form', answer:'√2(cosπ/4 + i sinπ/4)', explanation:'r=√2, θ=π/4.' },
  { id:'MATH_Q14', type:'short', difficulty:'medium', concept:'Polar Form', question:'General polar form of z', answer:'r(cosθ + i sinθ)', explanation:'Standard polar representation.' },
  { id:'MATH_Q15', type:'short', difficulty:'medium', concept:'Exponential Form', question:'Euler form of complex number', answer:'re^{iθ}', explanation:'From Euler formula.' },
  { id:'MATH_Q16', type:'mcq', difficulty:'easy', concept:'Argand Plane', question:'Complex numbers are represented geometrically on', options:['Cartesian plane','Argand plane','Number line','Polar graph'], answer:'Argand plane', explanation:'Argand diagram represents complex numbers.' },
  { id:'MATH_Q17', type:'short', difficulty:'medium', concept:'Argand Plane', question:'Point for 2 + 3i', answer:'(2,3)', explanation:'Real part x-axis, imaginary y-axis.' },
  { id:'MATH_Q18', type:'short', difficulty:'medium', concept:'Geometric Interpretation', question:'Modulus represents', answer:'Distance from origin', explanation:'Magnitude of vector.' },
  { id:'MATH_Q19', type:'mcq', difficulty:'medium', concept:'Geometric Interpretation', question:'Argument represents', options:['Slope','Angle with x-axis','Distance','Imaginary part'], answer:'Angle with x-axis', explanation:'Angle from positive real axis.' },
  { id:'MATH_Q20', type:'short', difficulty:'medium', concept:'Algebra of Complex Numbers', question:'Subtract (5+3i) − (2+i)', answer:'3+2i', explanation:'Subtract real and imaginary parts.' },
  { id:'MATH_Q21', type:'mcq', difficulty:'medium', concept:'Algebra of Complex Numbers', question:'(i)^4 = ?', options:['1','-1','i','-i'], answer:'1', explanation:'i^4=1.' },
  { id:'MATH_Q22', type:'short', difficulty:'medium', concept:'Conjugate', question:'Conjugate of 7 − 5i', answer:'7 + 5i', explanation:'Change sign.' },
  { id:'MATH_Q23', type:'short', difficulty:'medium', concept:'Modulus', question:'|5i|', answer:'5', explanation:'Distance from origin.' },
  { id:'MATH_Q24', type:'short', difficulty:'hard', concept:'Polar Form', question:'Write -1 in polar form', answer:'1(cosπ + i sinπ)', explanation:'Angle π.' },
  { id:'MATH_Q25', type:'short', difficulty:'hard', concept:'Exponential Form', question:'Exponential form of -1', answer:'e^{iπ}', explanation:'Euler formula.' },
  { id:'MATH_Q26', type:'mcq', difficulty:'medium', concept:'Argand Plane', question:'Point for -3 + 2i lies in', options:['Quadrant I','Quadrant II','Quadrant III','Quadrant IV'], answer:'Quadrant II', explanation:'x negative y positive.' },
  { id:'MATH_Q27', type:'short', difficulty:'medium', concept:'Argand Plane', question:'Purely imaginary number has', answer:'Real part = 0', explanation:'a=0.' },
  { id:'MATH_Q28', type:'short', difficulty:'medium', concept:'Geometric Interpretation', question:'Distance of 3+4i from origin', answer:'5', explanation:'Same as modulus.' },
  { id:'MATH_Q29', type:'short', difficulty:'hard', concept:'Algebra of Complex Numbers', question:'(2+i)^2', answer:'3+4i', explanation:'Expand square.' },
  { id:'MATH_Q30', type:'short', difficulty:'hard', concept:'Polar Form', question:'Relation between modulus and polar radius', answer:'r = |z|', explanation:'Radius equals modulus.' },
];

export const subjects: Subject[] = [
  { id:'math1', name:'Engineering Mathematics 1', shortName:'Math I', color:'#8b5cf6', icon:'∑', questions: math1Questions, prerequisiteId:'12th_math' },
  { id:'12th_math', name:'12th Mathematics (Complex Numbers)', shortName:'12th Math', color:'#a78bfa', icon:'📐', questions: math12Questions },
  { id:'phy1', name:'Engineering Physics 1', shortName:'Physics', color:'#f59e0b', icon:'⚛', questions: [], prerequisiteId:'12th_phy' },
  { id:'12th_phy', name:'12th Physics (Dual Nature)', shortName:'12th Physics', color:'#fbbf24', icon:'🔬', questions: [] },
  { id:'chem1', name:'Engineering Chemistry 1', shortName:'Chemistry', color:'#10b981', icon:'⚗', questions: [] },
  { id:'bee', name:'Basic Electrical Engineering', shortName:'Electrical', color:'#ef4444', icon:'⚡', questions: [], prerequisiteId:'pre_bee' },
  { id:'pre_bee', name:'BEE Prerequisites', shortName:'Pre-BEE', color:'#f87171', icon:'🔌', questions: [] },
  { id:'mech', name:'Engineering Mechanics', shortName:'Mechanics', color:'#06b6d4', icon:'⚙', questions: [], prerequisiteId:'pre_mech' },
  { id:'pre_mech', name:'Mechanics Prerequisites', shortName:'Pre-Mech', color:'#22d3ee', icon:'📏', questions: [] },
  { id:'m2', name:'Engineering Mathematics 2', shortName:'Math II', color:'#ec4899', icon:'∫', questions: [], prerequisiteId:'math1' },
  { id:'phy2', name:'Engineering Physics 2', shortName:'Physics II', color:'#f97316', icon:'🧲', questions: [], prerequisiteId:'phy1' },
  { id:'chem2', name:'Engineering Chemistry 2', shortName:'Chemistry II', color:'#14b8a6', icon:'🧪', questions: [], prerequisiteId:'chem1' },
  { id:'eg', name:'Engineering Graphics', shortName:'Graphics', color:'#3b82f6', icon:'📐', questions: [] },
  { id:'cp', name:'Computer Programming', shortName:'Programming', color:'#eab308', icon:'💻', questions: [] },
];

// Only show main engineering subjects (not prerequisite subjects) on quiz selection
export const mainSubjects = subjects.filter(s => !s.id.startsWith('12th_') && !s.id.startsWith('pre_'));
export const getSubject = (id: string) => subjects.find(s => s.id === id);
export const getPrerequisite = (id: string) => {
  const subj = getSubject(id);
  return subj?.prerequisiteId ? getSubject(subj.prerequisiteId) : null;
};

export interface QuizAttempt {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  score: number;
  totalQuestions: number;
  timeTaken: string;
  weakConcepts: string[];
  correctAnswers: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
}

export const mockUser: UserProfile = {
  name: 'Madan Nadar',
  email: 'madan@example.com',
  avatar: '',
  joinedDate: '2026-01-15',
};

export const quizHistory: QuizAttempt[] = [
  { id: 'qa1', subjectId: 'math1', subjectName: 'Engineering Mathematics I', date: '2026-03-27', score: 80, totalQuestions: 10, timeTaken: '12:30', weakConcepts: ['Euler Theorem', 'Newton Raphson'], correctAnswers: 8 },
  { id: 'qa2', subjectId: 'phy1', subjectName: 'Engineering Physics', date: '2026-03-26', score: 60, totalQuestions: 10, timeTaken: '15:45', weakConcepts: ['Quantum Mechanics', 'Diffraction'], correctAnswers: 6 },
  { id: 'qa3', subjectId: 'bee', subjectName: 'Basic Electrical Engineering', date: '2026-03-25', score: 45, totalQuestions: 10, timeTaken: '18:20', weakConcepts: ['RL Circuit', 'Magnetic Circuits', 'Reluctance'], correctAnswers: 4 },
  { id: 'qa4', subjectId: 'chem1', subjectName: 'Engineering Chemistry', date: '2026-03-24', score: 75, totalQuestions: 8, timeTaken: '10:15', weakConcepts: ['Nernst Equation', 'Corrosion'], correctAnswers: 6 },
  { id: 'qa5', subjectId: 'mech', subjectName: 'Engineering Mechanics', date: '2026-03-23', score: 50, totalQuestions: 8, timeTaken: '14:00', weakConcepts: ['Moment of Inertia', 'Equilibrium'], correctAnswers: 4 },
  { id: 'qa6', subjectId: 'math1', subjectName: 'Engineering Mathematics I', date: '2026-03-20', score: 70, totalQuestions: 10, timeTaken: '13:50', weakConcepts: ['Hyperbolic Functions', 'Partial Derivatives', 'Taylor Series'], correctAnswers: 7 },
  { id: 'qa7', subjectId: 'phy1', subjectName: 'Engineering Physics', date: '2026-03-18', score: 50, totalQuestions: 10, timeTaken: '16:30', weakConcepts: ['Quantum Mechanics', 'Laser', 'Fiber Optics'], correctAnswers: 5 },
  { id: 'qa8', subjectId: 'bee', subjectName: 'Basic Electrical Engineering', date: '2026-03-15', score: 30, totalQuestions: 10, timeTaken: '20:00', weakConcepts: ['RL Circuit', 'RC Circuit', 'Magnetic Circuits', 'Reluctance'], correctAnswers: 3 },
];

export const dashboardStats = {
  totalQuizzes: 8,
  averageScore: 57.5,
  studyStreak: 5,
  weakTopicsCount: 12,
  strongTopicsCount: 8,
  totalConcepts: 35,
  masteredConcepts: 12,
};

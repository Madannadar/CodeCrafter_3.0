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

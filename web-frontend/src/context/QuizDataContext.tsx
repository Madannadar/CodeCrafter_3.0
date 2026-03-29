import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api from '../services/api';
import type { Subject } from '../data/quizData';
import { applyExtraQuestions } from '../data/extraQuestions';

interface QuizDataContextValue {
  subjects: Subject[];
  mainSubjects: Subject[];
  loading: boolean;
  error: string | null;
  getSubject: (id: string) => Subject | undefined;
  getPrerequisite: (id: string) => Subject | null;
}

const QuizDataContext = createContext<QuizDataContextValue | null>(null);

export function QuizDataProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ subjects: Subject[] }>('/quiz/subjects');
        if (cancelled) return;
        const list = res.data.subjects || [];
        applyExtraQuestions(list);
        setSubjects(list);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load quiz data');
          setSubjects([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mainSubjects = useMemo(
    () => subjects.filter((s) => !s.id.startsWith('12th_') && !s.id.startsWith('pre_')),
    [subjects]
  );

  const value = useMemo<QuizDataContextValue>(
    () => ({
      subjects,
      mainSubjects,
      loading,
      error,
      getSubject: (id: string) => subjects.find((s) => s.id === id),
      getPrerequisite: (id: string) => {
        const subj = subjects.find((s) => s.id === id);
        return subj?.prerequisiteId ? subjects.find((s) => s.id === subj.prerequisiteId) ?? null : null;
      },
    }),
    [subjects, mainSubjects, loading, error]
  );

  return <QuizDataContext.Provider value={value}>{children}</QuizDataContext.Provider>;
}

export function useQuizData() {
  const ctx = useContext(QuizDataContext);
  if (!ctx) throw new Error('useQuizData must be used within QuizDataProvider');
  return ctx;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useQuizData } from '../context/QuizDataContext';

interface QuizEntry {
  _id: string;
  subjectId: string;
  subjectName?: string | null;
  score: number;
  totalQuestions: number;
  timestamp: string;
  difficulty?: string | null;
  attemptChain?: {
    subjectId: string;
    subjectName: string;
    difficulty: string;
    score: number;
    total: number;
    weakConcepts: string[];
  }[];
}

interface SemSubjectResult {
  subjectId: string;
  subjectName: string;
  shortName: string;
  score: number;
  totalQuestions: number;
  rating: string;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean }[];
}

interface SemEntry {
  _id: string;
  semId: string;
  timestamp: string;
  totalSubjects: number;
  weakSubjectIds: string[];
  subjectResults: SemSubjectResult[];
}

type Tab = 'quiz' | 'sem';

interface QuizGroup {
  id: string;
  label: string;
  items: QuizEntry[];
}

const SEM_LABEL: Record<string, string> = {
  sem1: 'Semester 1',
  sem2: 'Semester 2',
  sem3: 'Semester 3',
  sem4: 'Semester 4',
};

const SEM_COLOR: Record<string, string> = {
  sem1: '#8b5cf6',
  sem2: '#f59e0b',
  sem3: '#10b981',
  sem4: '#ef4444',
};

const RATING_CFG: Record<string, { color: string; bg: string; ring: string }> = {
  Perfect: { color: '#16a34a', bg: '#dcfce7', ring: '#22c55e' },
  Good: { color: '#1d4ed8', bg: '#dbeafe', ring: '#3b82f6' },
  'Needs Work': { color: '#d97706', bg: '#fef9c3', ring: '#f59e0b' },
  'Focus More': { color: '#ea580c', bg: '#ffedd5', ring: '#f97316' },
  'Weak Subject': { color: '#dc2626', bg: '#fee2e2', ring: '#ef4444' },
  'No Data': { color: '#9ca3af', bg: '#f3f4f6', ring: '#e5e7eb' },
};

const DIFF_COLOR: Record<string, string> = {
  easy: '#16a34a',
  medium: '#d97706',
  intermediate: '#d97706',
  hard: '#dc2626',
};

const DIFF_BG: Record<string, string> = {
  easy: '#dcfce7',
  medium: '#fef3c7',
  intermediate: '#fef3c7',
  hard: '#fee2e2',
};

function cardStyle(borderColor = '#ede9fe') {
  return {
    background: 'linear-gradient(180deg, #ffffff, #fcfbff)',
    borderRadius: 20,
    border: `1px solid ${borderColor}`,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
  } as const;
}

function inferQuizGroupLabel(
  quiz: QuizEntry,
  subjectMeta?: { name?: string; shortName?: string; semId?: string }
) {
  const subjectName = (subjectMeta?.name || quiz.subjectName || quiz.subjectId || 'General').trim();
  const normalized = subjectName.toLowerCase();

  if (normalized.includes('machine learning') || normalized === 'ml' || normalized.includes('artificial intelligence') || normalized === 'ai') {
    return 'AI And Machine Learning';
  }
  if (normalized.includes('data') || normalized.includes('algorithm') || normalized.includes('program') || normalized.includes('computer') || normalized.includes('python')) {
    return 'Programming And Data';
  }
  if (normalized.includes('math') || normalized.includes('algebra') || normalized.includes('calculus') || normalized.includes('statistics')) {
    return 'Mathematics';
  }
  if (normalized.includes('physics') || normalized.includes('chemistry') || normalized.includes('mechanics')) {
    return 'Core Sciences';
  }
  if (subjectMeta?.semId) {
    return SEM_LABEL[subjectMeta.semId] || 'Semester Cluster';
  }
  return subjectName;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { subjects } = useQuizData();
  const pageRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<Tab>('quiz');
  const [quizHistory, setQuizHistory] = useState<QuizEntry[]>([]);
  const [semHistory, setSemHistory] = useState<SemEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [expandedQuizGroupId, setExpandedQuizGroupId] = useState<string | null>(null);
  const [expandedSemId, setExpandedSemId] = useState<string | null>(null);
  const [filterSem, setFilterSem] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      api.get<QuizEntry[]>(`/history/user/${user.id}`),
      api.get<SemEntry[]>(`/sem-diagnostic/user/${user.id}`),
    ])
      .then(([quizRes, semRes]) => {
        setQuizHistory(quizRes.data || []);
        setSemHistory(semRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filteredQuiz = useMemo(
    () =>
      quizHistory
        .filter((q) => filterSubject === 'all' || q.subjectId === filterSubject)
        .filter((q) => filterDiff === 'all' || q.difficulty === filterDiff),
    [filterDiff, filterSubject, quizHistory]
  );

  const filteredSem = useMemo(
    () => semHistory.filter((s) => filterSem === 'all' || s.semId === filterSem),
    [filterSem, semHistory]
  );

  const groupedQuizHistory = useMemo<QuizGroup[]>(() => {
    const groups = new Map<string, QuizEntry[]>();

    for (const quiz of filteredQuiz) {
      const subjectMeta = subjects.find((item) => item.id === quiz.subjectId);
      const label = inferQuizGroupLabel(quiz, subjectMeta);
      const existing = groups.get(label) || [];
      existing.push(quiz);
      groups.set(label, existing);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label,
      items,
    }));
  }, [filteredQuiz, subjects]);

  const stats = useMemo(() => {
    const avg =
      quizHistory.length > 0
        ? Math.round(
            quizHistory.reduce((sum, q) => sum + (q.score / q.totalQuestions) * 100, 0) /
              quizHistory.length
          )
        : 0;
    const best =
      quizHistory.length > 0
        ? Math.max(...quizHistory.map((q) => Math.round((q.score / q.totalQuestions) * 100)))
        : 0;
    const chainRuns = quizHistory.filter((q) => (q.attemptChain?.length || 0) > 1).length;
    const weakFlags = semHistory.reduce((sum, item) => sum + item.weakSubjectIds.length, 0);
    return { avg, best, chainRuns, weakFlags };
  }, [quizHistory, semHistory]);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.history-hero, .history-tabs, .history-filter, .history-trend, .history-group, .history-sem-card',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [loading, tab, groupedQuizHistory.length, filteredSem.length, filterDiff, filterSubject, filterSem]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 420,
          gap: 16,
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            border: '3px solid #e9d5ff',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: '#9ca3af' }}>Loading history...</p>
      </div>
    );
  }

  return (
    <div ref={pageRef} style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 40 }}>
      <div
        className="history-hero"
        style={{
          ...cardStyle('#e9d5ff'),
          padding: '30px 32px',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #ffffff, #faf5ff 55%, #eef2ff)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#8b5cf6',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Learning Archive
            </div>
            <h1
              style={{
                fontSize: '2.15rem',
                fontWeight: 900,
                color: '#0f0a1e',
                letterSpacing: '-0.8px',
                marginBottom: 8,
              }}
            >
              Quiz And Diagnostic History
            </h1>
            <p
              style={{
                color: '#6b7280',
                fontSize: '0.98rem',
                lineHeight: 1.7,
                maxWidth: 620,
              }}
            >
              Review your adaptive quiz trails, prerequisite backtracking, semester diagnostics,
              and the weak areas your recent sessions exposed.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Quiz Sessions', value: quizHistory.length, color: '#8b5cf6', bg: '#f3e8ff' },
              { label: 'Average Score', value: `${stats.avg}%`, color: '#2563eb', bg: '#dbeafe' },
              { label: 'Best Score', value: `${stats.best}%`, color: '#16a34a', bg: '#dcfce7' },
              { label: 'Backtrack Runs', value: stats.chainRuns, color: '#d97706', bg: '#fef3c7' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  minWidth: 122,
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: stat.bg,
                  border: '1px solid rgba(255,255,255,0.8)',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280' }}>
                  {stat.label}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="history-tabs"
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 24,
          background: '#f5f3ff',
          borderRadius: 16,
          padding: 5,
          width: 'fit-content',
          border: '1px solid #e9d5ff',
          boxShadow: '0 8px 24px rgba(139,92,246,0.06)',
        }}
      >
        {([
          ['quiz', 'Quiz History', quizHistory.length],
          ['sem', 'Sem Diagnostics', semHistory.length],
        ] as [Tab, string, number][]).map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              background:
                tab === value ? 'linear-gradient(135deg, #ffffff, #faf5ff)' : 'transparent',
              color: tab === value ? '#7c3aed' : '#6b7280',
              boxShadow: tab === value ? '0 8px 18px rgba(139,92,246,0.12)' : 'none',
            }}
          >
            {label}
            <span
              style={{
                marginLeft: 6,
                background: tab === value ? '#ede9fe' : '#e5e7eb',
                color: tab === value ? '#7c3aed' : '#9ca3af',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'quiz' && (
        <div>
          <div
            className="history-filter"
            style={{
              ...cardStyle(),
              padding: 18,
              marginBottom: 18,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                fontSize: '0.86rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Subjects</option>
              {subjects
                .filter((s) => quizHistory.some((q) => q.subjectId === s.id))
                .map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.shortName}
                  </option>
                ))}
            </select>

            <select
              value={filterDiff}
              onChange={(e) => setFilterDiff(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                fontSize: '0.86rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="intermediate">Intermediate</option>
              <option value="hard">Hard</option>
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: '#f5f3ff',
                  color: '#7c3aed',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                }}
              >
                {filteredQuiz.length} visible result{filteredQuiz.length !== 1 ? 's' : ''}
              </span>
              <span
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: '#fef3c7',
                  color: '#b45309',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                }}
              >
                {stats.chainRuns} adaptive chains
              </span>
            </div>
          </div>

          {quizHistory.length > 0 && (
            <div className="history-trend" style={{ ...cardStyle(), padding: 22, marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 14,
                  flexWrap: 'wrap',
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#8b5cf6',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Performance Trend
                  </div>
                  <div style={{ marginTop: 6, color: '#374151', fontWeight: 700 }}>
                    Recent quiz performance across all recorded attempts
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: '#eef2ff',
                      color: '#4f46e5',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                    }}
                  >
                    Avg {stats.avg}%
                  </span>
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: '#dcfce7',
                      color: '#15803d',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                    }}
                  >
                    Best {stats.best}%
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 68 }}>
                {quizHistory
                  .slice(0, 24)
                  .reverse()
                  .map((quiz, index) => {
                    const subject = subjects.find((item) => item.id === quiz.subjectId);
                    const pct = Math.round((quiz.score / quiz.totalQuestions) * 100);
                    return (
                      <div
                        key={`${quiz._id}-${index}`}
                        title={`${subject?.shortName || quiz.subjectName || quiz.subjectId}: ${pct}%`}
                        style={{
                          flex: 1,
                          minWidth: 8,
                          height: `${Math.max(10, pct)}%`,
                          borderRadius: '6px 6px 0 0',
                          background: `linear-gradient(180deg, ${subject?.color || '#8b5cf6'}, ${
                            subject?.color || '#8b5cf6'
                          }66)`,
                        }}
                      />
                    );
                  })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredQuiz.length === 0 ? (
              <div style={{ ...cardStyle(), padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>History</div>
                <p style={{ color: '#6b7280', marginBottom: 18 }}>
                  No quiz attempts match these filters yet.
                </p>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    borderRadius: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  Start A Quiz
                </Link>
              </div>
            ) : (
              groupedQuizHistory.map((group, groupIndex) => {
                const isGroupExpanded =
                  expandedQuizGroupId === group.id ||
                  (!expandedQuizGroupId && groupIndex === 0);
                const latestQuiz = group.items[0];
                const groupAverage = Math.round(
                  group.items.reduce((sum, item) => sum + (item.score / item.totalQuestions) * 100, 0) /
                    group.items.length
                );

                return (
                  <div key={group.id} className="history-group" style={{ ...cardStyle(), padding: 18 }}>
                    <button
                      onClick={() =>
                        setExpandedQuizGroupId(isGroupExpanded ? null : group.id)
                      }
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '1rem',
                              fontWeight: 900,
                              color: '#111827',
                            }}
                          >
                            {group.label}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              display: 'flex',
                              gap: 8,
                              flexWrap: 'wrap',
                              color: '#6b7280',
                              fontSize: '0.78rem',
                            }}
                          >
                            <span>{group.items.length} attempts</span>
                            <span>Average {groupAverage}%</span>
                            <span>
                              Latest {new Date(latestQuiz.timestamp).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span
                            style={{
                              padding: '6px 10px',
                              borderRadius: 999,
                              background: '#eef2ff',
                              color: '#4f46e5',
                              fontWeight: 800,
                              fontSize: '0.74rem',
                            }}
                          >
                            {group.items.filter((item) => (item.attemptChain?.length || 0) > 1).length} adaptive
                          </span>
                          <span
                            style={{
                              fontSize: '1.05rem',
                              color: '#a78bfa',
                              fontWeight: 900,
                            }}
                          >
                            {isGroupExpanded ? '−' : '+'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {isGroupExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
                        {group.items.map((quiz) => {
                          const subject = subjects.find((item) => item.id === quiz.subjectId);
                          const pct = Math.round((quiz.score / quiz.totalQuestions) * 100);
                          const scoreColor = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                          const scoreBg = pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef3c7' : '#fee2e2';
                          const isExpanded = expandedQuizId === quiz._id;

                          if (quiz.attemptChain && quiz.attemptChain.length > 1) {
                            return (
                              <div key={quiz._id} style={{ ...cardStyle(), padding: 22 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          marginBottom: 18,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1rem',
                          }}
                        >
                          A
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#111827' }}>
                            Adaptive Learning Path
                          </div>
                          <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#6b7280' }}>
                            {new Date(quiz.timestamp).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '7px 12px',
                            borderRadius: 999,
                            background: '#f3e8ff',
                            color: '#7c3aed',
                            fontWeight: 800,
                            fontSize: '0.76rem',
                          }}
                        >
                          {quiz.attemptChain.length} steps
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 8 }}>
                        {quiz.attemptChain.map((attempt, index) => {
                          const passed = attempt.total > 0 && attempt.score / attempt.total >= 0.7;
                          return (
                            <div key={`${attempt.subjectId}-${index}`} style={{ display: 'flex', flexDirection: 'column' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 14,
                                  background: passed ? '#f0fdf4' : '#fef2f2',
                                  border: `1px solid ${passed ? '#bbf7d0' : '#fecaca'}`,
                                  padding: '14px 16px',
                                  borderRadius: 14,
                                }}
                              >
                                <div style={{ fontSize: '1.2rem', color: passed ? '#16a34a' : '#ef4444' }}>
                                  {passed ? '●' : '●'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.96rem' }}>
                                      {attempt.subjectName}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        background: DIFF_BG[attempt.difficulty] || '#f3f4f6',
                                        color: DIFF_COLOR[attempt.difficulty] || '#6b7280',
                                        padding: '2px 8px',
                                        borderRadius: 999,
                                        fontWeight: 800,
                                        textTransform: 'capitalize',
                                      }}
                                    >
                                      {attempt.difficulty}
                                    </span>
                                  </div>
                                  <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#6b7280' }}>
                                    Score <strong>{attempt.score}/{attempt.total}</strong>
                                  </div>
                                  {!passed && attempt.weakConcepts?.length > 0 && (
                                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      {attempt.weakConcepts.map((concept) => (
                                        <span
                                          key={concept}
                                          style={{
                                            padding: '4px 8px',
                                            borderRadius: 999,
                                            background: '#fee2e2',
                                            color: '#b91c1c',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                          }}
                                        >
                                          {concept}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {index < (quiz.attemptChain?.length || 0) - 1 && (
                                <div style={{ width: 2, height: 18, background: '#d1d5db', margin: '0 20px' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                            );
                          }

                          return (
                            <div
                              key={quiz._id}
                              style={{
                                ...cardStyle(isExpanded ? `${subject?.color || '#8b5cf6'}44` : '#ede9fe'),
                                overflow: 'hidden',
                              }}
                            >
                              <button
                                onClick={() => setExpandedQuizId(isExpanded ? null : quiz._id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 16,
                                  padding: '18px 20px',
                                  width: '100%',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <div
                                  style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 15,
                                    background: `${subject?.color || '#8b5cf6'}12`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.3rem',
                                    border: `1px solid ${subject?.color || '#8b5cf6'}30`,
                                    flexShrink: 0,
                                  }}
                                >
                                  {subject?.icon || 'Q'}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.96rem' }}>
                                      {subject?.name || quiz.subjectName || quiz.subjectId}
                                    </span>
                                    {quiz.difficulty && (
                                      <span
                                        style={{
                                          fontSize: '0.7rem',
                                          background: DIFF_BG[quiz.difficulty] || '#f3f4f6',
                                          color: DIFF_COLOR[quiz.difficulty] || '#6b7280',
                                          padding: '2px 8px',
                                          borderRadius: 999,
                                          fontWeight: 800,
                                          textTransform: 'capitalize',
                                        }}
                                      >
                                        {quiz.difficulty}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
                                    {new Date(quiz.timestamp).toLocaleDateString('en-IN', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                    {' · '}
                                    {quiz.score}/{quiz.totalQuestions} correct
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 56,
                                      height: 56,
                                      borderRadius: '50%',
                                      background: scoreBg,
                                      border: `2px solid ${scoreColor}40`,
                                    }}
                                  >
                                    <span style={{ fontWeight: 900, fontSize: '1rem', color: scoreColor }}>
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                              </button>

                              {isExpanded && (
                                <div style={{ padding: '0 20px 20px' }}>
                                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 18 }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                                      {Array.from({ length: quiz.totalQuestions }).map((_, index) => (
                                        <div
                                          key={index}
                                          style={{
                                            flex: 1,
                                            height: 8,
                                            borderRadius: 999,
                                            background: index < quiz.score ? subject?.color || '#8b5cf6' : '#ede9fe',
                                          }}
                                        />
                                      ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.8rem', color: '#6b7280' }}>
                                      <span>Correct {quiz.score}</span>
                                      <span>Incorrect {quiz.totalQuestions - quiz.score}</span>
                                      <span style={{ marginLeft: 'auto' }}>Final score {pct}%</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === 'sem' && (
        <div>
          <div
            className="history-filter"
            style={{
              ...cardStyle(),
              padding: 18,
              marginBottom: 18,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <select
              value={filterSem}
              onChange={(e) => setFilterSem(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                fontSize: '0.86rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Semesters</option>
              {['sem1', 'sem2', 'sem3', 'sem4'].map((sem) => (
                <option key={sem} value={sem}>
                  {SEM_LABEL[sem]}
                </option>
              ))}
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: '#f5f3ff',
                  color: '#7c3aed',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                }}
              >
                {filteredSem.length} visible diagnostic{filteredSem.length !== 1 ? 's' : ''}
              </span>
              <span
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                }}
              >
                {stats.weakFlags} weak flags
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredSem.length === 0 ? (
              <div style={{ ...cardStyle(), padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>Semester</div>
                <p style={{ color: '#6b7280', marginBottom: 18 }}>
                  No semester diagnostics have been saved yet.
                </p>
                <Link
                  to="/sem-check"
                  style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    borderRadius: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  Run A Sem Check
                </Link>
              </div>
            ) : (
              filteredSem.map((entry) => {
                const semColor = SEM_COLOR[entry.semId] || '#8b5cf6';
                const isExpanded = expandedSemId === entry._id;
                const goodCount = entry.subjectResults.filter(
                  (result) => result.score / result.totalQuestions >= 0.75
                ).length;
                const weakCount = entry.weakSubjectIds.length;

                return (
                  <div
                    className="history-sem-card"
                    key={entry._id}
                    style={{
                      ...cardStyle(isExpanded ? `${semColor}40` : '#ede9fe'),
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => setExpandedSemId(isExpanded ? null : entry._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '18px 22px',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          background: `linear-gradient(135deg, ${semColor}, ${semColor}cc)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 900,
                          fontSize: '0.92rem',
                          flexShrink: 0,
                        }}
                      >
                        {entry.semId.replace('sem', 'S')}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 900, color: '#111827', fontSize: '1rem' }}>
                            {SEM_LABEL[entry.semId] || entry.semId}
                          </span>
                          {weakCount > 0 && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                background: '#fee2e2',
                                color: '#dc2626',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontWeight: 800,
                              }}
                            >
                              {weakCount} weak
                            </span>
                          )}
                          {goodCount === entry.subjectResults.length && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                background: '#dcfce7',
                                color: '#16a34a',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontWeight: 800,
                              }}
                            >
                              All good
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
                          {new Date(entry.timestamp).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' · '}
                          {entry.totalSubjects} subjects tested
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 190 }}>
                        {entry.subjectResults.slice(0, 5).map((result) => {
                          const cfg = RATING_CFG[result.rating] || RATING_CFG['No Data'];
                          return (
                            <span
                              key={result.subjectId}
                              style={{
                                fontSize: '0.7rem',
                                background: cfg.bg,
                                color: cfg.color,
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontWeight: 800,
                                border: `1px solid ${cfg.ring}30`,
                              }}
                            >
                              {result.shortName}
                            </span>
                          );
                        })}
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '0 22px 22px' }}>
                        <div style={{ borderTop: '1px solid #f0f0f5', paddingTop: 18 }}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                              gap: 12,
                            }}
                          >
                            {entry.subjectResults.map((result) => {
                              const cfg = RATING_CFG[result.rating] || RATING_CFG['No Data'];
                              const pct =
                                result.totalQuestions > 0
                                  ? (result.score / result.totalQuestions) * 100
                                  : 0;

                              return (
                                <div
                                  key={result.subjectId}
                                  style={{
                                    background: cfg.bg,
                                    borderRadius: 16,
                                    padding: '15px 16px',
                                    border: `1.5px solid ${cfg.ring}30`,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginBottom: 10,
                                      gap: 8,
                                    }}
                                  >
                                    <span style={{ fontWeight: 800, color: '#1f2937', fontSize: '0.88rem' }}>
                                      {result.shortName}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        background: 'white',
                                        color: cfg.color,
                                        padding: '2px 8px',
                                        borderRadius: 8,
                                        fontWeight: 800,
                                      }}
                                    >
                                      {result.score}/{result.totalQuestions}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      height: 7,
                                      background: 'rgba(255,255,255,0.7)',
                                      borderRadius: 999,
                                      overflow: 'hidden',
                                      marginBottom: 8,
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: '100%',
                                        width: `${pct}%`,
                                        background: cfg.ring,
                                        borderRadius: 999,
                                      }}
                                    />
                                  </div>

                                  <div style={{ fontSize: '0.76rem', color: cfg.color, fontWeight: 800 }}>
                                    {result.rating}
                                  </div>

                                  {result.answers.length > 0 && (
                                    <div style={{ display: 'flex', gap: 3, marginTop: 10, flexWrap: 'wrap' }}>
                                      {result.answers.map((answer, index) => (
                                        <div
                                          key={index}
                                          style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 4,
                                            background: answer.isCorrect ? '#22c55e' : '#ef4444',
                                          }}
                                          title={answer.isCorrect ? 'Correct' : 'Incorrect'}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

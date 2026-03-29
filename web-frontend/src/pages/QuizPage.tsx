import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useQuizData } from '../context/QuizDataContext';
import type { Subject, Question } from '../data/quizData';
import { SUBJECT_ROADMAPS } from '../data/subjectRoadmaps';
import { SUBJECT_PREREQUISITES } from '../data/subjectPrerequisites';
import gsap from 'gsap';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'select' | 'difficulty' | 'quiz' | 'suggestion' | 'report';
type DifficultyChoice = 'easy' | 'intermediate' | 'hard';

const DIFFICULTY_TO_TAG: Record<DifficultyChoice, string> = {
  easy: 'easy',
  intermediate: 'medium',
  hard: 'hard',
};

const DIFFICULTY_LABELS: Record<DifficultyChoice, { label: string; color: string; bg: string; desc: string; icon: string }> = {
  easy: { label: 'Easy', color: '#16a34a', bg: '#dcfce7', desc: "Foundational concepts — best if you're just starting", icon: '🟢' },
  intermediate: { label: 'Intermediate', color: '#d97706', bg: '#fef9c3', desc: 'Core exam-level questions with conceptual depth', icon: '🟡' },
  hard: { label: 'Hard', color: '#dc2626', bg: '#fee2e2', desc: 'Advanced problems — for mastery & competitive prep', icon: '🔴' },
};

interface QuizAttempt {
  subjectId: string;
  subjectName: string;
  difficulty: DifficultyChoice;
  questions: Question[];
  answers: (string | null)[];
  correct: boolean[];
  score: number;
  total: number;
  weakConcepts: string[];
  usedFallback: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function filterAndPick(questions: Question[], difficulty: DifficultyChoice, count = 10): { picked: Question[]; usedFallback: boolean } {
  const tag = DIFFICULTY_TO_TAG[difficulty];
  const filtered = questions.filter((q) => q.difficulty === tag);
  if (filtered.length >= 5) {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return { picked: shuffled.slice(0, count), usedFallback: false };
  }
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return { picked: shuffled.slice(0, count), usedFallback: true };
}

function countByDifficulty(questions: Question[], difficulty: DifficultyChoice): number {
  return questions.filter((q) => q.difficulty === DIFFICULTY_TO_TAG[difficulty]).length;
}

function buildPrerequisiteGroups(subjects: Subject[]) {
  const byId = new Map(subjects.map((subject) => [subject.id, subject]));
  const children = new Map<string, Subject[]>();

  for (const subject of subjects) {
    if (!subject.prerequisiteId || !byId.has(subject.prerequisiteId)) continue;
    const existing = children.get(subject.prerequisiteId) || [];
    existing.push(subject);
    children.set(subject.prerequisiteId, existing);
  }

  const roots = subjects.filter(
    (subject) => !subject.prerequisiteId || !byId.has(subject.prerequisiteId)
  );

  return roots.map((root) => {
    const seen = new Set<string>();
    const chain: Subject[] = [];
    const stack = [root];

    while (stack.length > 0) {
      const current = stack.shift()!;
      if (seen.has(current.id)) continue;
      seen.add(current.id);
      chain.push(current);
      const dependents = (children.get(current.id) || []).sort((a, b) =>
        a.shortName.localeCompare(b.shortName)
      );
      stack.push(...dependents);
    }

    return { id: root.id, title: root.name, chain };
  });
}

// ─── Inline responsive styles ─────────────────────────────────────────────────
const css = `
  @media (max-width: 600px) {
    .quiz-difficulty-grid { grid-template-columns: 1fr !important; }
    .quiz-diff-card { flex-direction: row !important; text-align: left !important; gap: 14px !important; padding: 14px 16px !important; }
    .quiz-diff-icon { font-size: 22px !important; margin-bottom: 0 !important; flex-shrink: 0; }
    .quiz-diff-body { flex: 1; }
    .quiz-diff-title { font-size: 1rem !important; margin-bottom: 4px !important; }
    .quiz-diff-desc { font-size: 0.78rem !important; margin-bottom: 6px !important; }
    .quiz-subject-grid { grid-template-columns: 1fr !important; }
    .quiz-subject-tile-inner { flex-direction: row !important; align-items: flex-start !important; gap: 12px !important; }
    .quiz-subject-icon { width: 44px !important; height: 44px !important; font-size: 20px !important; flex-shrink: 0; margin-bottom: 0 !important; }
    .quiz-subject-name { font-size: 0.95rem !important; }
    .quiz-subject-desc { font-size: 0.78rem !important; }
    .quiz-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
    .quiz-score-circle { width: 60px !important; height: 60px !important; font-size: 1.1rem !important; }
    .quiz-report-score-row { flex-direction: column !important; gap: 12px !important; }
    .quiz-suggestion-center { padding: 20px 16px !important; }
    .quiz-group-header { flex-direction: column !important; align-items: flex-start !important; }
    .quiz-q-tags { gap: 5px !important; }
    .quiz-q-tag { font-size: 0.68rem !important; padding: 2px 8px !important; }
    .quiz-actions-row { flex-direction: column !important; }
    .quiz-actions-row button { width: 100% !important; }
    .quiz-prereq-item { flex-direction: column !important; gap: 8px !important; }
    .quiz-roadmap-item { gap: 10px !important; }
    .quiz-roadmap-dot { width: 30px !important; height: 30px !important; font-size: 0.8rem !important; }
    .quiz-review-item { flex-direction: row !important; gap: 8px !important; }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { user, updateUser } = useAuth();
  const { mainSubjects, getPrerequisite, loading: quizLoading, error: quizError } = useQuizData();
  const location = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>('select');
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyChoice | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo(pageRef.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }
    );
  }, []);

  const groupedSubjects = useMemo(() => buildPrerequisiteGroups(mainSubjects), [mainSubjects]);

  useEffect(() => {
    if (!pageRef.current || phase !== 'select') return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.quiz-select-header, .quiz-group-card',
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' }
      );
      gsap.fromTo(
        '.quiz-subject-tile',
        { y: 14, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.04, delay: 0.12, ease: 'power2.out', clearProps: 'transform,opacity' }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [phase, groupedSubjects.length]);

  useEffect(() => {
    if (!quizLoading && location.state?.subjectId) {
      const subj = mainSubjects.find(s => s.id === location.state.subjectId);
      if (subj && subj.questions.length > 0) {
        const diff: DifficultyChoice = location.state.difficulty || 'intermediate';
        setCurrentSubject(subj);
        setSelectedDifficulty(diff);
        setPhase('difficulty');
      }
    }
  }, [quizLoading, mainSubjects, location.state]);

  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timer, setTimer] = useState(30);
  const [attemptChain, setAttemptChain] = useState<QuizAttempt[]>([]);
  const [finalReport, setFinalReport] = useState<QuizAttempt | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (phase !== 'quiz' || showFeedback) return;
    if (timer <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, phase, showFeedback]);

  const startQuiz = useCallback((subject: Subject, difficulty: DifficultyChoice) => {
    const { picked, usedFallback: fb } = filterAndPick(subject.questions, difficulty);
    setCurrentSubject(subject);
    setSelectedDifficulty(difficulty);
    setQuizQuestions(picked);
    setUsedFallback(fb);
    setCurrentQ(0);
    setUserAnswer('');
    setAnswers([]);
    setShowFeedback(false);
    setTimer(30);
    setPhase('quiz');
  }, []);

  const handleSubmit = useCallback(() => {
    setAnswers((prev) => [...prev, userAnswer.trim() || '(no answer)']);
    setShowFeedback(true);
  }, [userAnswer]);

  const nextQuestion = useCallback(() => {
    if (currentQ + 1 < quizQuestions.length) {
      setCurrentQ((p) => p + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setTimer(30);
    } else {
      finishQuiz();
    }
  }, [currentQ, quizQuestions]);

  const finishQuiz = useCallback(() => {
    const allAnswers = [...answers];
    const correct = quizQuestions.map((q, i) => {
      const a = allAnswers[i] || '(no answer)';
      return a.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');
    });
    const score = correct.filter(Boolean).length;
    const weakConcepts = [...new Set(quizQuestions.filter((_, i) => !correct[i]).map((q) => q.concept))];

    const attempt: QuizAttempt = {
      subjectId: currentSubject!.id,
      subjectName: currentSubject!.name,
      difficulty: selectedDifficulty!,
      questions: quizQuestions,
      answers: allAnswers,
      correct,
      score,
      total: quizQuestions.length,
      weakConcepts,
      usedFallback,
    };

    const updatedChain = [...attemptChain, attempt];
    setAttemptChain(updatedChain);
    const passed = score >= 7;

    if (selectedDifficulty === 'intermediate') {
      setFinalReport(attempt);
      setPhase(passed ? 'report' : 'suggestion');
    } else if (selectedDifficulty === 'easy') {
      setFinalReport(attempt);
      setPhase('suggestion');
    } else if (selectedDifficulty === 'hard') {
      setFinalReport(attempt);
      setPhase(passed ? 'report' : 'suggestion');
    }
  }, [answers, quizQuestions, currentSubject, selectedDifficulty, attemptChain, usedFallback]);

  const handleExitToDashboard = async () => {
    if (!attemptChain.length && !finalReport) { navigate('/dashboard'); return; }
    const mainAttempt = attemptChain[0] || finalReport;
    try {
      if (user && mainAttempt) {
        const mappedChain = attemptChain.map(att => ({
          subjectId: att.subjectId, subjectName: att.subjectName,
          difficulty: att.difficulty, score: att.score, total: att.total,
          weakConcepts: att.weakConcepts || []
        }));
        const formatAnswers = mainAttempt.questions.map((q, i) => ({
          questionId: q.id,
          selectedAnswer: mainAttempt.answers[i] || 'Skipped',
          isCorrect: mainAttempt.correct[i],
        }));
        await api.post('/history', {
          userId: user.id, subjectId: mainAttempt.subjectId,
          score: mainAttempt.score, totalQuestions: mainAttempt.total,
          answers: formatAnswers, difficulty: mainAttempt.difficulty, attemptChain: mappedChain
        });
        const ratio = mainAttempt.score / mainAttempt.total;
        if (ratio < 0.7 && !user.weak_subjects.includes(mainAttempt.subjectId)) {
          updateUser({ ...user, weak_subjects: [...user.weak_subjects, mainAttempt.subjectId] });
        }
      }
    } catch (err) { console.error('Failed to save quiz history:', err); }
    navigate('/dashboard', { state: { attemptChain, quizReport: finalReport } });
  };

  if (quizLoading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading quiz data…</div>;
  if (quizError) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--error)' }}>Could not load quiz data. Is the API running? ({quizError})</div>;

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: SELECT SUBJECT
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div ref={pageRef}>
        <style>{css}{`
          .quiz-group-toggle:hover { background: #f5f0ff !important; }
          .quiz-subject-tile:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(139,92,246,0.13) !important; }
          .quiz-subjects-panel {
            overflow: hidden;
            transition: max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease, padding 0.28s ease;
          }
          .quiz-subjects-panel.open { opacity: 1; }
          .quiz-subjects-panel.closed { max-height: 0 !important; opacity: 0; padding-top: 0 !important; padding-bottom: 0 !important; }
          .quiz-chevron { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
          .quiz-chevron.open { transform: rotate(180deg); }
        `}</style>

        {/* Header */}
        <div className="quiz-select-header" style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 700, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
            📝 Start a Quiz
          </h1>
          <p style={{ color: '#6b7280', fontSize: 'clamp(0.82rem, 2.5vw, 0.93rem)' }}>
            Tap a cluster to expand its subjects. Grouped by prerequisite relationship.
          </p>
        </div>

        {/* Collapsible group cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupedSubjects.map((group) => {
            const isOpen = expandedGroups.has(group.id);
            // Gather summary info for the collapsed preview
            const totalQs = group.chain.reduce((sum, s) => sum + s.questions.length, 0);
            const icons = group.chain.slice(0, 4).map(s => s.icon);
            const hasAny = group.chain.some(s => s.questions.length > 0);

            return (
              <div
                key={group.id}
                className="quiz-group-card"
                style={{
                  background: 'linear-gradient(180deg, #ffffff, #fcfbff)',
                  border: `1.5px solid ${isOpen ? '#c4b5fd' : '#ede9fe'}`,
                  borderRadius: 18,
                  boxShadow: isOpen ? '0 8px 28px rgba(139,92,246,0.10)' : '0 2px 8px rgba(15,23,42,0.04)',
                  overflow: 'hidden',
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                }}
              >
                {/* ── Toggle header ── */}
                <button
                  className="quiz-group-toggle"
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    padding: '14px 18px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 14, textAlign: 'left',
                    transition: 'background 0.18s',
                  }}
                >
                  {/* Subject icon previews */}
                  <div style={{ display: 'flex', gap: -6, flexShrink: 0 }}>
                    {icons.map((icon, i) => (
                      <div key={i} style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: '#f3e8ff', border: '2px solid white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, marginLeft: i > 0 ? -10 : 0,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        zIndex: icons.length - i,
                        position: 'relative',
                      }}>
                        {icon}
                      </div>
                    ))}
                    {group.chain.length > 4 && (
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: '#ede9fe', border: '2px solid white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 800, color: '#7c3aed',
                        marginLeft: -10, position: 'relative',
                        zIndex: 0,
                      }}>
                        +{group.chain.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Group name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 'clamp(0.92rem, 3vw, 1.05rem)', fontWeight: 800, color: '#1f2937', margin: 0, lineHeight: 1.3 }}>
                        {group.title}
                      </h2>
                      {!hasAny && (
                        <span style={{ fontSize: '0.65rem', background: '#f3f4f6', color: '#9ca3af', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 700 }}>
                        {group.chain.length} subject{group.chain.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>·</span>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        {totalQs} question{totalQs !== 1 ? 's' : ''}
                      </span>
                      {/* Subject name chips — hidden when open */}
                      {!isOpen && group.chain.slice(0, 3).map(s => (
                        <span key={s.id} style={{ fontSize: '0.65rem', background: '#f9fafb', color: '#6b7280', padding: '1px 7px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                          {s.shortName}
                        </span>
                      ))}
                      {!isOpen && group.chain.length > 3 && (
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>…</span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`quiz-chevron${isOpen ? ' open' : ''}`}
                    width="18" height="18" viewBox="0 0 20 20" fill="none"
                    style={{ flexShrink: 0, color: '#8b5cf6' }}
                  >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* ── Expandable subject tiles ── */}
                <div
                  className={`quiz-subjects-panel${isOpen ? ' open' : ' closed'}`}
                  style={{
                    maxHeight: isOpen ? `${group.chain.length * 160}px` : '0px',
                    paddingTop: isOpen ? 0 : 0,
                    paddingBottom: isOpen ? 14 : 0,
                    paddingLeft: 14,
                    paddingRight: 14,
                  }}
                >
                  <div
                    className="quiz-subject-grid"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, paddingTop: 4 }}
                  >
                    {group.chain.map((subj, index) => {
                      const prereq = getPrerequisite(subj.id);
                      const prereqData = SUBJECT_PREREQUISITES[subj.id];
                      const hasData = subj.questions.length > 0;
                      return (
                        <button
                          key={subj.id}
                          className="quiz-subject-tile"
                          onClick={() => hasData ? (setCurrentSubject(subj), setPhase('difficulty')) : null}
                          disabled={!hasData}
                          style={{
                            background: 'white', border: '1px solid #e5e7eb', borderRadius: 14,
                            padding: '13px 14px', textAlign: 'left',
                            cursor: hasData ? 'pointer' : 'not-allowed',
                            opacity: hasData ? 1 : 0.5,
                            transition: 'all 0.22s', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex', alignItems: 'flex-start', gap: 11,
                          }}
                          onMouseEnter={(e) => { if (hasData) { const el = e.currentTarget as HTMLElement; el.style.borderColor = subj.color; } }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e5e7eb'; }}
                        >
                          {/* Icon */}
                          <div style={{
                            width: 40, height: 40, borderRadius: 11,
                            background: `${subj.color}15`, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 20,
                            border: `2px solid ${subj.color}25`, flexShrink: 0,
                          }}>
                            {subj.icon}
                          </div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{subj.shortName}</h3>
                              {index > 0 && (
                                <span style={{ fontSize: '0.6rem', color: '#8b5cf6', fontWeight: 700, background: '#f3e8ff', padding: '1px 5px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                                  prereq
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.74rem', color: '#6b7280', marginBottom: 7, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {subj.name}
                            </p>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.64rem', background: `${subj.color}15`, color: subj.color, padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
                                {hasData ? `${subj.questions.length} Qs` : 'Soon'}
                              </span>
                              {prereqData && !prereqData.hasPrerequisites && (
                                <span style={{ fontSize: '0.64rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 7px', borderRadius: 20 }}>
                                  Foundation
                                </span>
                              )}
                              {prereq && (
                                <span style={{ fontSize: '0.64rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 20 }}>
                                  ← {prereq.shortName}
                                </span>
                              )}
                            </div>
                          </div>

                          {hasData && (
                            <span style={{ position: 'absolute', bottom: 9, right: 11, fontSize: '0.62rem', color: '#c4b5fd', fontWeight: 700 }}>
                              →
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: DIFFICULTY SELECTION
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'difficulty' && currentSubject) {
    const prereqInfo = SUBJECT_PREREQUISITES[currentSubject.id];
    const prereq = getPrerequisite(currentSubject.id);

    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <style>{css}</style>
        <button onClick={() => setPhase('select')} style={{ background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 600, cursor: 'pointer', marginBottom: 18, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          ← Back to subjects
        </button>

        {/* Subject header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: `${currentSubject.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: `2px solid ${currentSubject.color}30`, flexShrink: 0 }}>
            {currentSubject.icon}
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.55rem)', fontWeight: 700, color: '#1f2937', margin: 0, lineHeight: 1.3 }}>{currentSubject.name}</h1>
            <p style={{ color: '#6b7280', marginTop: 3, fontSize: '0.85rem' }}>Choose your difficulty level to begin</p>
          </div>
        </div>

        {/* Difficulty cards — stack on mobile */}
        <div className="quiz-difficulty-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {(['easy', 'intermediate', 'hard'] as DifficultyChoice[]).map((diff) => {
            const meta = DIFFICULTY_LABELS[diff];
            const count = countByDifficulty(currentSubject.questions, diff);
            const hasFew = count < 5;
            return (
              <button
                key={diff}
                onClick={() => startQuiz(currentSubject, diff)}
                className="quiz-diff-card"
                style={{
                  background: meta.bg,
                  border: `2px solid ${meta.color}40`,
                  borderRadius: 14,
                  padding: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.borderColor = meta.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 22px ${meta.color}28`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = `${meta.color}40`; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <div className="quiz-diff-icon" style={{ fontSize: 30, marginBottom: 8 }}>{meta.icon}</div>
                <div className="quiz-diff-body">
                  <h3 className="quiz-diff-title" style={{ fontWeight: 700, color: meta.color, fontSize: '1rem', marginBottom: 6 }}>{meta.label}</h3>
                  <p className="quiz-diff-desc" style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5, marginBottom: 10 }}>{meta.desc}</p>
                  <span style={{ fontSize: '0.68rem', background: 'white', color: meta.color, padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-block' }}>
                    {hasFew ? `~${count} tagged` : `${count}+ questions`}
                  </span>
                  {hasFew && diff === 'hard' && (
                    <p style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 5 }}>Mixed fallback</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Prerequisites */}
        <div style={{ background: 'white', borderRadius: 16, padding: 'clamp(16px, 4vw, 26px)', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 'clamp(0.95rem, 3vw, 1.05rem)', fontWeight: 700, color: '#1f2937', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎓 Prerequisites for {currentSubject.shortName}
          </h2>

          {prereqInfo ? (
            prereqInfo.hasPrerequisites ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prereqInfo.items.map((item: any, i: number) => (
                    <div key={i} className="quiz-prereq-item" style={{ display: 'flex', gap: 12, padding: 12, background: '#f8f9fc', borderRadius: 12, border: '1px solid #f0f0f5' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${currentSubject.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: currentSubject.color, flexShrink: 0 }}>
                        {item.standardLevel.replace('Sem ', 'S').substring(0, 4)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.88rem', marginBottom: 2 }}>{item.topic}</p>
                        <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 4 }}>{item.description}</p>
                        <span style={{ fontSize: '0.68rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 7, fontWeight: 600 }}>
                          {item.standardLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {prereq && (
                  <div style={{ marginTop: 14, padding: 12, background: '#faf5ff', borderRadius: 12, border: '1px solid #e9d5ff' }}>
                    <p style={{ fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600 }}>
                      💡 Linked prerequisite quiz: <strong>{prereq.name}</strong>
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 3 }}>
                      Score below 7/10 → guided to take that quiz first.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <p style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                  ✅ No formal prerequisites required
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.82rem', marginTop: 5 }}>{prereqInfo.note}</p>
              </div>
            )
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No prerequisite information available.</p>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: QUIZ QUESTIONS
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'quiz' && currentSubject && quizQuestions.length > 0) {
    const q = quizQuestions[currentQ];
    const isAnswered = showFeedback;
    const currentAnswer = answers[currentQ] || userAnswer.trim() || '(no answer)';
    const isCorrectAnswer = isAnswered && currentAnswer.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');
    const isMCQ = q.type === 'mcq' && q.options && q.options.length > 0;
    const diffMeta = DIFFICULTY_LABELS[selectedDifficulty!];

    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <style>{css}</style>

        {/* Header row */}
        <div className="quiz-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 22 }}>{currentSubject.icon}</span>
              <span>{currentSubject.shortName}</span>
              <span style={{ fontSize: '0.7rem', background: diffMeta.bg, color: diffMeta.color, padding: '3px 9px', borderRadius: 20, fontWeight: 700 }}>
                {diffMeta.icon} {diffMeta.label}
              </span>
              {usedFallback && (
                <span style={{ fontSize: '0.68rem', background: '#fef9c3', color: '#b45309', padding: '2px 8px', borderRadius: 20 }}>Mixed</span>
              )}
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: 2 }}>Question {currentQ + 1} of {quizQuestions.length}</p>
          </div>
          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: timer <= 10 ? '#ef4444' : '#8b5cf6',
            fontWeight: 800, fontSize: 'clamp(0.95rem, 3vw, 1.1rem)',
            background: timer <= 10 ? '#fee2e2' : '#f3e8ff',
            padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            ⏱ {timer}s
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / quizQuestions.length) * 100}%`, background: `linear-gradient(90deg, ${currentSubject.color}, ${currentSubject.color}99)`, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>

        {/* Tags */}
        <div className="quiz-q-tags" style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <span className="quiz-q-tag" style={{ fontSize: '0.72rem', background: q.difficulty === 'easy' ? '#dcfce7' : q.difficulty === 'medium' ? '#fef9c3' : '#fee2e2', color: q.difficulty === 'easy' ? '#16a34a' : q.difficulty === 'medium' ? '#ca8a04' : '#dc2626', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{q.difficulty}</span>
          <span className="quiz-q-tag" style={{ fontSize: '0.72rem', background: '#f3e8ff', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{q.concept}</span>
          <span className="quiz-q-tag" style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#6b7280', padding: '3px 10px', borderRadius: 20 }}>{q.type.toUpperCase()}</span>
        </div>

        {/* Question Card */}
        <div style={{ background: 'white', borderRadius: 14, padding: 'clamp(16px, 4vw, 28px)', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', fontWeight: 700, color: '#1f2937', marginBottom: 20, lineHeight: 1.65 }}>{q.question}</h3>

          {isMCQ ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {q.options!.map((opt, i) => {
                const isSelected = userAnswer === opt;
                const isRight = isAnswered && opt.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');
                const isWrong = isAnswered && isSelected && !isRight;
                let bg = 'white', border = '#e5e7eb', color = '#1f2937';
                if (!isAnswered && isSelected) { bg = '#f3e8ff'; border = '#8b5cf6'; color = '#7c3aed'; }
                if (isAnswered && isRight) { bg = '#dcfce7'; border = '#22c55e'; color = '#16a34a'; }
                if (isWrong) { bg = '#fee2e2'; border = '#ef4444'; color = '#dc2626'; }
                return (
                  <button key={i} disabled={isAnswered} onClick={() => setUserAnswer(opt)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'clamp(10px, 3vw, 14px) clamp(12px, 3vw, 16px)', borderRadius: 11, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, cursor: isAnswered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s', fontSize: 'clamp(0.82rem, 2.5vw, 0.95rem)' }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, background: isSelected || isRight ? border : 'transparent', color: isSelected || isRight ? 'white' : color }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} disabled={isAnswered}
              placeholder="Type your answer here..."
              style={{ width: '100%', minHeight: 72, padding: 14, borderRadius: 11, border: '2px solid #e5e7eb', fontSize: 'clamp(0.88rem, 2.5vw, 1rem)', resize: 'vertical', outline: 'none', fontFamily: 'inherit', background: isAnswered ? '#f9fafb' : 'white', boxSizing: 'border-box' }}
              onFocus={(e) => !isAnswered && (e.currentTarget.style.borderColor = '#8b5cf6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          )}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div style={{ background: isCorrectAnswer ? '#f0fdf4' : '#fef2f2', borderRadius: 12, padding: 'clamp(14px, 3vw, 20px)', marginBottom: 16, border: `1px solid ${isCorrectAnswer ? '#bbf7d0' : '#fecaca'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{isCorrectAnswer ? '✅' : '❌'}</span>
              <strong style={{ color: isCorrectAnswer ? '#16a34a' : '#dc2626', fontSize: '0.95rem' }}>
                {isCorrectAnswer ? 'Correct!' : 'Incorrect'}
              </strong>
            </div>
            {!isCorrectAnswer && (
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 4 }}>
                Correct answer: <strong style={{ color: '#1f2937' }}>{q.answer}</strong>
              </p>
            )}
            <p style={{ color: '#6b7280', fontSize: '0.82rem', lineHeight: 1.6 }}>{q.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="quiz-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {!isAnswered ? (
            <button onClick={handleSubmit} disabled={!userAnswer.trim()}
              style={{ background: userAnswer.trim() ? `linear-gradient(135deg, ${currentSubject.color}, ${currentSubject.color}cc)` : '#e5e7eb', color: userAnswer.trim() ? 'white' : '#9ca3af', border: 'none', padding: '11px 24px', borderRadius: 11, fontWeight: 700, cursor: userAnswer.trim() ? 'pointer' : 'not-allowed', fontSize: '0.93rem', transition: 'transform 0.2s' }}>
              Submit Answer
            </button>
          ) : (
            <button onClick={nextQuestion}
              style={{ background: `linear-gradient(135deg, ${currentSubject.color}, ${currentSubject.color}cc)`, color: 'white', border: 'none', padding: '11px 24px', borderRadius: 11, fontWeight: 700, cursor: 'pointer', fontSize: '0.93rem' }}>
              {currentQ + 1 < quizQuestions.length ? 'Next Question →' : 'View Results →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: SUGGESTION
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'suggestion' && finalReport && currentSubject) {
    const { difficulty, score, total, weakConcepts } = finalReport;
    const passed = score >= 7;
    const prereq = getPrerequisite(currentSubject.id);
    const diffMeta = DIFFICULTY_LABELS[difficulty];

    let suggestion: 'try_intermediate' | 'try_easy' | 'try_prereq' | 'congrats';
    if (difficulty === 'intermediate' && !passed) suggestion = 'try_easy';
    else if (difficulty === 'easy' && passed) suggestion = 'try_intermediate';
    else if (difficulty === 'easy' && !passed) suggestion = 'try_prereq';
    else if (difficulty === 'hard' && !passed) suggestion = 'try_intermediate';
    else suggestion = 'congrats';

    const suggestionConfig = {
      try_intermediate: { icon: '⬆️', color: '#d97706', bg: '#fef9c3', title: 'Move up to Intermediate!', body: `You scored ${score}/${total} on Easy. You're ready to challenge yourself with Intermediate questions.` },
      try_easy: { icon: '⬇️', color: '#2563eb', bg: '#dbeafe', title: 'Try the Easy Quiz first', body: `You scored ${score}/${total} on Intermediate. Let's build a stronger foundation with Easy questions.` },
      try_prereq: { icon: '🔗', color: '#7c3aed', bg: '#f3e8ff', title: prereq ? `Try the ${prereq.shortName} prerequisite quiz` : 'Review foundational concepts', body: prereq ? `You scored ${score}/${total} on Easy. This suggests gaps in the prerequisite subject (${prereq.name}).` : `You scored ${score}/${total}. Review the prerequisite concepts before retrying.` },
      congrats: { icon: '🎉', color: '#16a34a', bg: '#dcfce7', title: 'Congratulations!', body: `You scored ${score}/${total}. Check the full report below.` },
    };
    const cfg = suggestionConfig[suggestion];

    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <style>{css}</style>
        <div className="quiz-suggestion-center" style={{ background: 'white', borderRadius: 20, padding: 'clamp(18px, 5vw, 32px)', border: '1px solid #e5e7eb', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>

          {/* Score + icon */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 14 }}>
              {cfg.icon}
            </div>
            <span style={{ fontSize: '0.72rem', background: diffMeta.bg, color: diffMeta.color, padding: '3px 12px', borderRadius: 20, fontWeight: 700, marginBottom: 8 }}>{diffMeta.label}</span>
            <h2 style={{ fontSize: 'clamp(1.5rem, 6vw, 1.8rem)', fontWeight: 800, color: '#1f2937', marginBottom: 2 }}>
              {score}<span style={{ color: '#9ca3af', fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>/{total}</span>
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>{currentSubject.shortName}</p>
          </div>

          {/* Suggestion card */}
          <div style={{ background: cfg.bg, borderRadius: 13, padding: 'clamp(14px, 4vw, 20px)', marginBottom: 18, border: `1px solid ${cfg.color}30` }}>
            <h3 style={{ fontWeight: 700, color: cfg.color, marginBottom: 6, fontSize: 'clamp(0.95rem, 3vw, 1.05rem)' }}>{cfg.title}</h3>
            <p style={{ color: '#6b7280', lineHeight: 1.65, fontSize: '0.88rem' }}>{cfg.body}</p>
          </div>

          {/* Weak concepts */}
          {weakConcepts.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: '0.83rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>🔴 Weak concepts:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {weakConcepts.map((c, i) => (
                  <span key={i} style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 11px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, border: '1px solid #fecaca' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestion === 'try_easy' && (
              <button onClick={() => startQuiz(currentSubject, 'easy')}
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', padding: '13px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                Take Easy Quiz →
              </button>
            )}
            {suggestion === 'try_intermediate' && (
              <button onClick={() => startQuiz(currentSubject, 'intermediate')}
                style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white', border: 'none', padding: '13px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                Take Intermediate Quiz →
              </button>
            )}
            {suggestion === 'try_prereq' && prereq && prereq.questions.length > 0 && (
              <button onClick={() => startQuiz(prereq, 'easy')}
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', padding: '13px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                Take {prereq.shortName} Quiz →
              </button>
            )}
            <button onClick={handleExitToDashboard}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', padding: '11px 22px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem' }}>
              ⬡ Dashboard & AI Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: REPORT
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'report' && finalReport && currentSubject) {
    const { difficulty, score, total, weakConcepts, questions, answers: ans, correct } = finalReport;
    const diffMeta = DIFFICULTY_LABELS[difficulty];
    const roadmap = SUBJECT_ROADMAPS[currentSubject.id] || [];

    return (
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <style>{css}</style>
        <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          📊 Quiz Report
        </h1>

        {/* Score card */}
        <div style={{ background: 'white', borderRadius: 18, padding: 'clamp(16px, 4vw, 28px)', border: '1px solid #e5e7eb', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="quiz-report-score-row" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className="quiz-score-circle" style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 'clamp(1rem, 3vw, 1.4rem)', fontWeight: 800, flexShrink: 0 }}>
              {score}/{total}
            </div>
            <div>
              <h2 style={{ fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', fontWeight: 700, color: '#1f2937' }}>{currentSubject.name}</h2>
              <div style={{ display: 'flex', gap: 7, marginTop: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', background: diffMeta.bg, color: diffMeta.color, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>{diffMeta.icon} {diffMeta.label}</span>
                <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#16a34a', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>✅ Passed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hard mode nudge */}
        {difficulty === 'intermediate' && (
          <div style={{ background: 'linear-gradient(135deg, #fee2e2, #fef2f2)', borderRadius: 18, padding: 'clamp(16px, 4vw, 26px)', border: '1px solid #fecaca', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6, fontSize: 'clamp(0.95rem, 3vw, 1.05rem)', display: 'flex', alignItems: 'center', gap: 7 }}>
              🏆 Ready for Hard Mode?
            </h3>
            <p style={{ color: '#6b7280', marginBottom: 14, lineHeight: 1.6, fontSize: '0.86rem' }}>
              You've mastered the Intermediate level! Put your skills to the ultimate test with Hard questions.
            </p>
            <button onClick={() => startQuiz(currentSubject, 'hard')}
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', border: 'none', padding: '11px 24px', borderRadius: 11, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              Try Hard Quiz 🔴 →
            </button>
          </div>
        )}

        {/* Weak concepts */}
        {weakConcepts.length > 0 && (
          <div style={{ background: 'white', borderRadius: 18, padding: 'clamp(16px, 4vw, 26px)', border: '1px solid #e5e7eb', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 10, fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>🔴 Concepts to Review</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {weakConcepts.map((c, i) => (
                <span key={i} style={{ background: '#fef2f2', color: '#dc2626', padding: '5px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, border: '1px solid #fecaca' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Roadmap */}
        {roadmap.length > 0 && (
          <div style={{ background: 'white', borderRadius: 18, padding: 'clamp(16px, 4vw, 26px)', border: '1px solid #e5e7eb', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 18, fontSize: 'clamp(0.9rem, 3vw, 1rem)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🗺️ Learning Roadmap — {currentSubject.shortName}
            </h3>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: `${currentSubject.color}25` }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {roadmap.map((step: any, i: number) => (
                  <div key={i} className="quiz-roadmap-item" style={{ display: 'flex', gap: 13, alignItems: 'flex-start', position: 'relative' }}>
                    <div className="quiz-roadmap-dot" style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, zIndex: 1,
                      background: step.type === 'completed' ? '#dcfce7' : step.type === 'next' ? currentSubject.color : '#f3f4f6',
                      color: step.type === 'completed' ? '#16a34a' : step.type === 'next' ? 'white' : '#9ca3af',
                      border: step.type === 'next' ? `3px solid ${currentSubject.color}` : 'none',
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ flex: 1, padding: '7px 13px', borderRadius: 11, background: step.type === 'next' ? `${currentSubject.color}08` : '#f9fafb', border: step.type === 'next' ? `1px solid ${currentSubject.color}25` : '1px solid #f3f4f6', minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: step.type === 'completed' ? '#6b7280' : step.type === 'next' ? '#1f2937' : '#9ca3af', marginBottom: 2, textDecoration: step.type === 'completed' ? 'line-through' : 'none', fontSize: 'clamp(0.82rem, 2.5vw, 0.9rem)' }}>
                        {step.type === 'next' && <span style={{ color: currentSubject.color, marginRight: 5 }}>→</span>}
                        {step.title}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{step.description}</p>
                      {step.type === 'next' && (
                        <span style={{ display: 'inline-block', marginTop: 5, fontSize: '0.68rem', background: currentSubject.color, color: 'white', padding: '2px 9px', borderRadius: 11, fontWeight: 700 }}>
                          Next Step
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Question review */}
        <div style={{ background: 'white', borderRadius: 18, padding: 'clamp(16px, 4vw, 26px)', border: '1px solid #e5e7eb', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 14, fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>📝 Question Review</h3>
          {questions.map((q, i) => (
            <div key={q.id} className="quiz-review-item" style={{ padding: '10px 0', borderBottom: i < questions.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{correct[i] ? '✅' : '❌'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: '#1f2937', fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)', marginBottom: 2, lineHeight: 1.5 }}>{q.question}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.76rem', wordBreak: 'break-word' }}>
                  Your: <span style={{ color: correct[i] ? '#16a34a' : '#dc2626' }}>{ans[i]}</span>
                  {!correct[i] && <> &nbsp;·&nbsp; Correct: <strong style={{ color: '#374151' }}>{q.answer}</strong></>}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleExitToDashboard}
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', padding: '13px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          ⬡ Return to Dashboard for AI Summary
        </button>
      </div>
    );
  }

  return null;
}
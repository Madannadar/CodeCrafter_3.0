import { useState, useEffect, useCallback, useRef } from 'react';
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

// Map user-facing difficulty choice → actual question difficulty tag
const DIFFICULTY_TO_TAG: Record<DifficultyChoice, string> = {
  easy: 'easy',
  intermediate: 'medium',
  hard: 'hard',
};

const DIFFICULTY_LABELS: Record<DifficultyChoice, { label: string; color: string; bg: string; desc: string; icon: string }> = {
  easy: { label: 'Easy', color: '#16a34a', bg: '#dcfce7', desc: 'Foundational concepts — best if you\'re just starting', icon: '🟢' },
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
  usedFallback: boolean; // true if fallback difficulty was used
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function filterAndPick(questions: Question[], difficulty: DifficultyChoice, count = 10): { picked: Question[]; usedFallback: boolean } {
  const tag = DIFFICULTY_TO_TAG[difficulty];
  const filtered = questions.filter((q) => q.difficulty === tag);
  if (filtered.length >= 5) {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return { picked: shuffled.slice(0, count), usedFallback: false };
  }
  // Fallback: use all questions
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return { picked: shuffled.slice(0, count), usedFallback: true };
}

function countByDifficulty(questions: Question[], difficulty: DifficultyChoice): number {
  return questions.filter((q) => q.difficulty === DIFFICULTY_TO_TAG[difficulty]).length;
}

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

  // GSAP page entrance
  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo(pageRef.current, 
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }
    );
  }, []);

  // Auto-start from Dashboard navigation state
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

  // Attempt chain: grows as user goes through difficulty fallbacks
  const [attemptChain, setAttemptChain] = useState<QuizAttempt[]>([]);
  const [finalReport, setFinalReport] = useState<QuizAttempt | null>(null); // last attempt used for report

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'quiz' || showFeedback) return;
    if (timer <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, phase, showFeedback]);

  // ── Start quiz ─────────────────────────────────────────────────────────────
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

  // ── Submit answer ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    setAnswers((prev) => [...prev, userAnswer.trim() || '(no answer)']);
    setShowFeedback(true);
  }, [userAnswer]);

  // ── Next question ──────────────────────────────────────────────────────────
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

  // ── Finish quiz & decide next step ────────────────────────────────────────
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
      if (passed) {
        setFinalReport(attempt);
        setPhase('report');
      } else {
        setFinalReport(attempt);
        setPhase('suggestion'); // suggest Easy
      }
    } else if (selectedDifficulty === 'easy') {
      if (passed) {
        setFinalReport(attempt);
        setPhase('suggestion'); // suggest Intermediate
      } else {
        setFinalReport(attempt);
        setPhase('suggestion'); // suggest prereq quiz
      }
    } else if (selectedDifficulty === 'hard') {
      if (passed) {
        setFinalReport(attempt);
        setPhase('report');
      } else {
        setFinalReport(attempt);
        setPhase('suggestion'); // suggest Intermediate
      }
    }
  }, [answers, quizQuestions, currentSubject, selectedDifficulty, attemptChain, usedFallback]);

  // ── Save to history ────────────────────────────────────────────────────────
  const saveToHistory = useCallback(async (attempt: QuizAttempt) => {
    if (!user) return;
    try {
      const formatAnswers = attempt.questions.map((q, i) => ({
        questionId: q.id,
        selectedAnswer: attempt.answers[i] || 'Skipped',
        isCorrect: attempt.correct[i],
      }));
      await api.post('/history', {
        userId: user.id,
        subjectId: attempt.subjectId,
        score: attempt.score,
        totalQuestions: attempt.total,
        answers: formatAnswers,
        difficulty: attempt.difficulty,
      });
      const ratio = attempt.score / attempt.total;
      if (ratio < 0.7 && !user.weak_subjects.includes(attempt.subjectId)) {
        updateUser({ ...user, weak_subjects: [...user.weak_subjects, attempt.subjectId] });
      }
    } catch (err) {
      console.error('Failed to save quiz history:', err);
    }
  }, [user, updateUser]);

  useEffect(() => {
    if ((phase === 'report' || phase === 'suggestion') && finalReport) {
      saveToHistory(finalReport);
    }
  }, [phase, finalReport]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  // Removed unused resetAll function

  // ─── Loading / Error ───────────────────────────────────────────
  if (quizLoading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading quiz data…</div>;
  if (quizError) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--error)' }}>Could not load quiz data. Is the API running? ({quizError})</div>;

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: SELECT SUBJECT
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div ref={pageRef}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          📝 Start a Quiz
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>Select a subject to test your understanding and identify learning gaps</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {mainSubjects.map((subj) => {
            const prereq = getPrerequisite(subj.id);
            const prereqData = SUBJECT_PREREQUISITES[subj.id];
            const hasData = subj.questions.length > 0;
            return (
              <button key={subj.id}
                onClick={() => hasData ? (setCurrentSubject(subj), setPhase('difficulty')) : null}
                disabled={!hasData}
                style={{
                  background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24,
                  textAlign: 'left', cursor: hasData ? 'pointer' : 'not-allowed',
                  opacity: hasData ? 1 : 0.5, transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={(e) => { if (hasData) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(139,92,246,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = subj.color; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${subj.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14, border: `2px solid ${subj.color}30` }}>
                  {subj.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>{subj.shortName}</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 12 }}>{subj.name}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', background: `${subj.color}15`, color: subj.color, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                    {hasData ? `${subj.questions.length} Qs` : 'Coming Soon'}
                  </span>
                  {prereq && (
                    <span style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 10px', borderRadius: 20 }}>
                      Has prerequisite
                    </span>
                  )}
                  {prereqData && !prereqData.hasPrerequisites && (
                    <span style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 10px', borderRadius: 20 }}>
                      No prereqs
                    </span>
                  )}
                </div>
                <span style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>
                  Select →
                </span>
              </button>
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
        {/* Header */}
        <button onClick={() => setPhase('select')} style={{ background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 600, cursor: 'pointer', marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to subjects
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: `${currentSubject.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: `2px solid ${currentSubject.color}30` }}>
            {currentSubject.icon}
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{currentSubject.name}</h1>
            <p style={{ color: '#6b7280', marginTop: 4 }}>Choose your difficulty level to begin</p>
          </div>
        </div>

        {/* Difficulty Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {(['easy', 'intermediate', 'hard'] as DifficultyChoice[]).map((diff) => {
            const meta = DIFFICULTY_LABELS[diff];
            const count = countByDifficulty(currentSubject.questions, diff);
            const hasFew = count < 5;
            return (
              <button key={diff}
                onClick={() => startQuiz(currentSubject, diff)}
                style={{
                  background: meta.bg, border: `2px solid ${meta.color}40`, borderRadius: 16, padding: 24,
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = meta.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${meta.color}30`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = `${meta.color}40`; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{meta.icon}</div>
                <h3 style={{ fontWeight: 700, color: meta.color, fontSize: '1.1rem', marginBottom: 8 }}>{meta.label}</h3>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>{meta.desc}</p>
                <span style={{ fontSize: '0.72rem', background: 'white', color: meta.color, padding: '4px 12px', borderRadius: 20, fontWeight: 600, display: 'inline-block' }}>
                  {hasFew ? `~${count} tagged (mix used)` : `${count}+ questions`}
                </span>
                {hasFew && diff === 'hard' && (
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 6 }}>Mixed difficulty fallback</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Prerequisites Section */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎓 Prerequisites for {currentSubject.shortName}
          </h2>

          {prereqInfo ? (
            prereqInfo.hasPrerequisites ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {prereqInfo.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: 14, background: '#f8f9fc', borderRadius: 12, border: '1px solid #f0f0f5' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${currentSubject.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: currentSubject.color, flexShrink: 0 }}>
                        {item.standardLevel.replace('Sem ', 'S').substring(0, 4)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.92rem', marginBottom: 2 }}>{item.topic}</p>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.description}</p>
                        <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                          {item.standardLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {prereq && (
                  <div style={{ marginTop: 16, padding: 14, background: '#faf5ff', borderRadius: 12, border: '1px solid #e9d5ff' }}>
                    <p style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 600 }}>
                      💡 This subject also has a linked prerequisite quiz: <strong>{prereq.name}</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 4 }}>
                      If you score below 7/10, you'll be guided to take that quiz first.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <p style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✅ No formal prerequisites required
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 6 }}>{prereqInfo.note}</p>
              </div>
            )
          ) : (
            <p style={{ color: '#9ca3af' }}>No prerequisite information available.</p>
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>{currentSubject.icon}</span>
              {currentSubject.shortName}
              <span style={{ fontSize: '0.72rem', background: diffMeta.bg, color: diffMeta.color, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                {diffMeta.icon} {diffMeta.label}
              </span>
              {usedFallback && (
                <span style={{ fontSize: '0.7rem', background: '#fef9c3', color: '#b45309', padding: '3px 10px', borderRadius: 20 }}>
                  Mixed difficulty
                </span>
              )}
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Question {currentQ + 1} of {quizQuestions.length}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: timer <= 10 ? '#ef4444' : '#8b5cf6', fontWeight: 700, fontSize: '1.1rem' }}>
            ⏱ {timer}s
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / quizQuestions.length) * 100}%`, background: `linear-gradient(90deg, ${currentSubject.color}, ${currentSubject.color}99)`, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', background: q.difficulty === 'easy' ? '#dcfce7' : q.difficulty === 'medium' ? '#fef9c3' : '#fee2e2', color: q.difficulty === 'easy' ? '#16a34a' : q.difficulty === 'medium' ? '#ca8a04' : '#dc2626', padding: '3px 12px', borderRadius: 20, fontWeight: 600 }}>{q.difficulty}</span>
          <span style={{ fontSize: '0.75rem', background: '#f3e8ff', color: '#7c3aed', padding: '3px 12px', borderRadius: 20, fontWeight: 600 }}>{q.concept}</span>
          <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#6b7280', padding: '3px 12px', borderRadius: 20 }}>{q.type.toUpperCase()}</span>
        </div>

        {/* Question Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: 24, lineHeight: 1.6 }}>{q.question}</h3>
          {isMCQ ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, cursor: isAnswered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, background: isSelected || isRight ? border : 'transparent', color: isSelected || isRight ? 'white' : color }}>
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
              style={{ width: '100%', minHeight: 80, padding: 16, borderRadius: 12, border: '2px solid #e5e7eb', fontSize: '1rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', background: isAnswered ? '#f9fafb' : 'white' }}
              onFocus={(e) => !isAnswered && (e.currentTarget.style.borderColor = '#8b5cf6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          )}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div style={{ background: isCorrectAnswer ? '#f0fdf4' : '#fef2f2', borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${isCorrectAnswer ? '#bbf7d0' : '#fecaca'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{isCorrectAnswer ? '✅' : '❌'}</span>
              <strong style={{ color: isCorrectAnswer ? '#16a34a' : '#dc2626' }}>{isCorrectAnswer ? 'Correct!' : 'Incorrect'}</strong>
            </div>
            {!isCorrectAnswer && <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 4 }}>Correct answer: <strong style={{ color: '#1f2937' }}>{q.answer}</strong></p>}
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>{q.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {!isAnswered ? (
            <button onClick={handleSubmit} disabled={!userAnswer.trim()}
              style={{ background: userAnswer.trim() ? `linear-gradient(135deg, ${currentSubject.color}, ${currentSubject.color}cc)` : '#e5e7eb', color: userAnswer.trim() ? 'white' : '#9ca3af', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, cursor: userAnswer.trim() ? 'pointer' : 'not-allowed', fontSize: '0.95rem', transition: 'transform 0.2s' }}>
              Submit Answer
            </button>
          ) : (
            <button onClick={nextQuestion}
              style={{ background: `linear-gradient(135deg, ${currentSubject.color}, ${currentSubject.color}cc)`, color: 'white', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              {currentQ + 1 < quizQuestions.length ? 'Next Question →' : 'View Results →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: SUGGESTION (adaptive next step)
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'suggestion' && finalReport && currentSubject) {
    const { difficulty, score, total, weakConcepts } = finalReport;
    const passed = score >= 7;
    const prereq = getPrerequisite(currentSubject.id);
    const diffMeta = DIFFICULTY_LABELS[difficulty];

    // Determine the suggestion based on difficulty & score
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
        {/* Score Banner */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>
            {cfg.icon}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', background: diffMeta.bg, color: diffMeta.color, padding: '3px 12px', borderRadius: 20, fontWeight: 700 }}>{diffMeta.label}</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1f2937', marginBottom: 6 }}>{score}<span style={{ color: '#9ca3af', fontSize: '1.2rem' }}>/{total}</span></h2>
          <p style={{ color: '#6b7280', marginBottom: 20 }}>{currentSubject.shortName}</p>

          <div style={{ background: cfg.bg, borderRadius: 14, padding: 20, marginBottom: 24, border: `1px solid ${cfg.color}30` }}>
            <h3 style={{ fontWeight: 700, color: cfg.color, marginBottom: 8 }}>{cfg.title}</h3>
            <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{cfg.body}</p>
          </div>

          {weakConcepts.length > 0 && (
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>🔴 Weak concepts:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {weakConcepts.map((c, i) => (
                  <span key={i} style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, border: '1px solid #fecaca' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suggestion === 'try_easy' && (
              <button onClick={() => startQuiz(currentSubject, 'easy')}
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                Take Easy Quiz →
              </button>
            )}
            {suggestion === 'try_intermediate' && (
              <button onClick={() => startQuiz(currentSubject, 'intermediate')}
                style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                Take Intermediate Quiz →
              </button>
            )}
            {suggestion === 'try_prereq' && prereq && prereq.questions.length > 0 && (
              <button onClick={() => startQuiz(prereq, 'easy')}
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                Take {prereq.shortName} Quiz →
              </button>
            )}
            <button onClick={() => navigate('/dashboard', { state: { quizReport: finalReport } })}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⬡ Dashboard & AI Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: REPORT (passed Intermediate or Hard)
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'report' && finalReport && currentSubject) {
    const { difficulty, score, total, weakConcepts, questions, answers: ans, correct } = finalReport;
    const diffMeta = DIFFICULTY_LABELS[difficulty];
    const roadmap = SUBJECT_ROADMAPS[currentSubject.id] || [];

    return (
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          📊 Quiz Report
        </h1>

        {/* Score Card */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>
              {score}/{total}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1f2937' }}>{currentSubject.name}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: '0.75rem', background: diffMeta.bg, color: diffMeta.color, padding: '2px 12px', borderRadius: 20, fontWeight: 700 }}>{diffMeta.icon} {diffMeta.label}</span>
                <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#16a34a', padding: '2px 12px', borderRadius: 20, fontWeight: 600 }}>✅ Passed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suggest Hard if Intermediate passed */}
        {difficulty === 'intermediate' && (
          <div style={{ background: 'linear-gradient(135deg, #fee2e2, #fef2f2)', borderRadius: 20, padding: 28, border: '1px solid #fecaca', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏆 Ready for Hard Mode?
            </h3>
            <p style={{ color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
              You've mastered the Intermediate level! Put your skills to the ultimate test with Hard questions.
            </p>
            <button onClick={() => startQuiz(currentSubject, 'hard')}
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              Try Hard Quiz 🔴 →
            </button>
          </div>
        )}

        {/* Weak Concepts */}
        {weakConcepts.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 12 }}>🔴 Concepts to Review</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {weakConcepts.map((c, i) => (
                <span key={i} style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, border: '1px solid #fecaca' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Domain Roadmap */}
        {roadmap.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              🗺️ Your Learning Roadmap — {currentSubject.shortName} Domain
            </h3>
            <div style={{ position: 'relative' }}>
              {/* vertical line */}
              <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 2, background: `${currentSubject.color}25` }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {roadmap.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, zIndex: 1,
                      background: step.type === 'completed' ? '#dcfce7' : step.type === 'next' ? currentSubject.color : '#f3f4f6',
                      color: step.type === 'completed' ? '#16a34a' : step.type === 'next' ? 'white' : '#9ca3af',
                      border: step.type === 'next' ? `3px solid ${currentSubject.color}` : 'none',
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ flex: 1, padding: '8px 16px', borderRadius: 12, background: step.type === 'next' ? `${currentSubject.color}08` : '#f9fafb', border: step.type === 'next' ? `1px solid ${currentSubject.color}25` : '1px solid #f3f4f6' }}>
                      <p style={{ fontWeight: 700, color: step.type === 'completed' ? '#6b7280' : step.type === 'next' ? '#1f2937' : '#9ca3af', marginBottom: 2, textDecoration: step.type === 'completed' ? 'line-through' : 'none' }}>
                        {step.type === 'next' && <span style={{ color: currentSubject.color, marginRight: 6 }}>→</span>}
                        {step.title}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{step.description}</p>
                      {step.type === 'next' && (
                        <span style={{ display: 'inline-block', marginTop: 6, fontSize: '0.72rem', background: currentSubject.color, color: 'white', padding: '2px 10px', borderRadius: 12, fontWeight: 700 }}>
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

        {/* Question Review */}
        <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>📝 Question Review</h3>
          {questions.map((q, i) => (
            <div key={q.id} style={{ padding: '12px 0', borderBottom: i < questions.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 18 }}>{correct[i] ? '✅' : '❌'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>{q.question}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Your answer: {ans[i]} | Correct: {q.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/dashboard', { state: { quizReport: finalReport } })}
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          ⬡ Return to Dashboard for AI Summary
        </button>
      </div>
    );
  }

  return null;
}

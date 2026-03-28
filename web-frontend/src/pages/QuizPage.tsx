import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { subjects, mainSubjects, getSubject, getPrerequisite, type Subject, type Question } from '../data/quizData';
import '../data/extraQuestions';

type Phase = 'select' | 'quiz' | 'feedback' | 'report';

interface QuizAttempt {
  subjectId: string;
  subjectName: string;
  questions: Question[];
  answers: (string | null)[];
  correct: boolean[];
  score: number;
  total: number;
  weakConcepts: string[];
}

interface QuizSession {
  mainAttempt: QuizAttempt;
  prereqAttempt?: QuizAttempt;
  passed: boolean; // ≥7/10
}

function shuffleAndPick(questions: Question[], count: number): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function QuizPage() {
  const { user, updateUser } = useAuth();
  const [phase, setPhase] = useState<Phase>('select');
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timer, setTimer] = useState(30);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [isPrereqPhase, setIsPrereqPhase] = useState(false);
  const [mainAttempt, setMainAttempt] = useState<QuizAttempt | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== 'quiz' || showFeedback) return;
    if (timer <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, phase, showFeedback]);

  const startQuiz = useCallback((subject: Subject, isPrereq = false) => {
    const qs = shuffleAndPick(subject.questions, Math.min(10, subject.questions.length));
    setCurrentSubject(subject);
    setQuizQuestions(qs);
    setCurrentQ(0);
    setUserAnswer('');
    setAnswers([]);
    setShowFeedback(false);
    setTimer(30);
    setIsPrereqPhase(isPrereq);
    setPhase('quiz');
  }, []);

  const handleSubmit = useCallback(() => {
    const q = quizQuestions[currentQ];
    const ans = userAnswer.trim() || '(no answer)';
    const isCorrect = ans.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');
    setAnswers(prev => [...prev, ans]);
    setShowFeedback(true);
  }, [currentQ, quizQuestions, userAnswer]);

  const nextQuestion = useCallback(() => {
    if (currentQ + 1 < quizQuestions.length) {
      setCurrentQ(prev => prev + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setTimer(30);
    } else {
      finishQuiz();
    }
  }, [currentQ, quizQuestions]);

  const finishQuiz = useCallback(() => {
    const allAnswers = [...answers];
    if (showFeedback && allAnswers.length < quizQuestions.length) {
      // current answer already added
    }
    const correct = quizQuestions.map((q, i) => {
      const a = allAnswers[i] || '(no answer)';
      return a.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');
    });
    const score = correct.filter(Boolean).length;
    const weakConcepts = [...new Set(quizQuestions.filter((_, i) => !correct[i]).map(q => q.concept))];

    const attempt: QuizAttempt = {
      subjectId: currentSubject!.id,
      subjectName: currentSubject!.name,
      questions: quizQuestions,
      answers: allAnswers,
      correct,
      score,
      total: quizQuestions.length,
      weakConcepts,
    };

    if (!isPrereqPhase) {
      // Main quiz just finished
      if (score >= 7) {
        // Passed - show report with roadmap
        setSession({ mainAttempt: attempt, passed: true });
        setMainAttempt(null);
        setPhase('report');
      } else {
        // Failed (<7) - check if prerequisite exists
        const prereq = getPrerequisite(currentSubject!.id);
        if (prereq && prereq.questions.length > 0) {
          setMainAttempt(attempt);
          setPhase('feedback');
        } else {
          setSession({ mainAttempt: attempt, passed: false });
          setPhase('report');
        }
      }
    } else {
      // Prerequisite quiz finished
      setSession({ mainAttempt: mainAttempt!, prereqAttempt: attempt, passed: false });
      setPhase('report');
    }
  }, [answers, quizQuestions, currentSubject, isPrereqPhase, mainAttempt, showFeedback]);

  const saveToHistory = useCallback(async (s: QuizSession) => {
    if (!user) return;
    try {
      const ma = s.mainAttempt;
      const formatAnswers = ma.questions.map((q, i) => ({
        questionId: q.id,
        selectedAnswer: ma.answers[i] || 'Skipped',
        isCorrect: ma.correct[i]
      }));

      await api.post('/history', {
        userId: user.id,
        subjectId: ma.subjectId,
        score: ma.score,
        totalQuestions: ma.total,
        answers: formatAnswers
      });

      // Update weak_subjects locally if below threshold
      const ratio = ma.score / ma.total;
      if (ratio < 0.7 && !user.weak_subjects.includes(ma.subjectId)) {
        updateUser({ ...user, weak_subjects: [...user.weak_subjects, ma.subjectId] });
      }

      // If there's a prerequisite attempt, save it too
      if (s.prereqAttempt) {
        const pa = s.prereqAttempt;
        const paAnswers = pa.questions.map((q, i) => ({
          questionId: q.id,
          selectedAnswer: pa.answers[i] || 'Skipped',
          isCorrect: pa.correct[i]
        }));
        await api.post('/history', {
          userId: user.id,
          subjectId: pa.subjectId,
          score: pa.score,
          totalQuestions: pa.total,
          answers: paAnswers
        });
        if ((pa.score / pa.total) < 0.7 && !user.weak_subjects.includes(pa.subjectId)) {
          updateUser({ ...user, weak_subjects: [...user.weak_subjects, pa.subjectId] });
        }
      }
    } catch (err) {
      console.error('Failed to save to backend:', err);
    }
  }, [user, updateUser]);

  useEffect(() => {
    if (phase === 'report' && session) {
      saveToHistory(session);
    }
  }, [phase, session, saveToHistory]);

  // ─── SUBJECT SELECTION ────
  if (phase === 'select') {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          📝 Start a Quiz
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>Select a subject to test your understanding and identify learning gaps</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {mainSubjects.map(subj => {
            const prereq = getPrerequisite(subj.id);
            return (
              <button key={subj.id} onClick={() => subj.questions.length > 0 ? startQuiz(subj) : null}
                disabled={subj.questions.length === 0}
                style={{
                  background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, textAlign: 'left',
                  cursor: subj.questions.length > 0 ? 'pointer' : 'not-allowed', opacity: subj.questions.length > 0 ? 1 : 0.5,
                  transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => { if (subj.questions.length > 0) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(139,92,246,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = subj.color; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${subj.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14, border: `2px solid ${subj.color}30` }}>
                  {subj.icon}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>{subj.shortName}</h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 12 }}>{subj.name}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', background: `${subj.color}15`, color: subj.color, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                    {subj.questions.length} Qs
                  </span>
                  {prereq && (
                    <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 10px', borderRadius: 20 }}>
                      Has prerequisite
                    </span>
                  )}
                </div>
                <span style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>
                  10 Qs quiz
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── FEEDBACK: FAILED MAIN QUIZ → GO TO PREREQUISITE ────
  if (phase === 'feedback' && mainAttempt) {
    const prereq = getPrerequisite(mainAttempt.subjectId)!;
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 40, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
            You scored {mainAttempt.score}/{mainAttempt.total}
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
            You scored below 7 on <strong>{mainAttempt.subjectName}</strong>. This suggests some prerequisite concepts may need strengthening.
          </p>
          <div style={{ background: '#faf5ff', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left', border: '1px solid #e9d5ff' }}>
            <h3 style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 8, fontSize: '0.95rem' }}>🔍 Root Cause Analysis</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 12 }}>
              Let's diagnose the root cause by testing your {prereq.name} knowledge.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
              Weak concepts: {mainAttempt.weakConcepts.join(', ')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => startQuiz(prereq, true)}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              Take {prereq.shortName} Quiz →
            </button>
            <button onClick={() => { setSession({ mainAttempt, passed: false }); setPhase('report'); }}
              style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', padding: '14px 24px', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>
              Skip & View Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ QUESTIONS ────
  if (phase === 'quiz' && currentSubject) {
    const q = quizQuestions[currentQ];
    const isAnswered = showFeedback;
    const currentAnswer = answers[currentQ] || userAnswer.trim() || '(no answer)';
    const isCorrectAnswer = isAnswered && currentAnswer.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');
    const isMCQ = q.type === 'mcq' && q.options && q.options.length > 0;

    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>{currentSubject.icon}</span> {currentSubject.shortName}
              {isPrereqPhase && <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>PREREQUISITE</span>}
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Question {currentQ + 1} of {quizQuestions.length}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: timer <= 10 ? '#ef4444' : '#8b5cf6', fontWeight: 700, fontSize: '1.1rem' }}>
            ⏱ {timer}s
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / quizQuestions.length) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', background: q.difficulty === 'easy' ? '#dcfce7' : q.difficulty === 'medium' ? '#fef9c3' : '#fee2e2', color: q.difficulty === 'easy' ? '#16a34a' : q.difficulty === 'medium' ? '#ca8a04' : '#dc2626', padding: '3px 12px', borderRadius: 20, fontWeight: 600 }}>{q.difficulty}</span>
          <span style={{ fontSize: '0.75rem', background: '#f3e8ff', color: '#7c3aed', padding: '3px 12px', borderRadius: 20, fontWeight: 600 }}>{q.concept}</span>
          <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#6b7280', padding: '3px 12px', borderRadius: 20 }}>{q.type.toUpperCase()}</span>
        </div>

        {/* Question Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937', marginBottom: 24, lineHeight: 1.5 }}>{q.question}</h3>

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
                  <button key={i} disabled={isAnswered}
                    onClick={() => setUserAnswer(opt)}
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
            <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)} disabled={isAnswered} placeholder="Type your answer here..."
              style={{ width: '100%', minHeight: 80, padding: 16, borderRadius: 12, border: '2px solid #e5e7eb', fontSize: '1rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', background: isAnswered ? '#f9fafb' : 'white' }}
              onFocus={e => !isAnswered && (e.currentTarget.style.borderColor = '#8b5cf6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
              style={{ background: userAnswer.trim() ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#e5e7eb', color: userAnswer.trim() ? 'white' : '#9ca3af', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, cursor: userAnswer.trim() ? 'pointer' : 'not-allowed', fontSize: '0.95rem', transition: 'transform 0.2s' }}
              onMouseEnter={e => userAnswer.trim() && (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}>
              Submit Answer
            </button>
          ) : (
            <button onClick={nextQuestion}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              {currentQ + 1 < quizQuestions.length ? 'Next Question →' : 'View Results →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── REPORT ────
  if (phase === 'report' && session) {
    const { mainAttempt: ma, prereqAttempt: pa, passed } = session;
    const subj = getSubject(ma.subjectId);
    const prereq = getPrerequisite(ma.subjectId);
    const allWeakConcepts = [...ma.weakConcepts, ...(pa?.weakConcepts || [])];

    return (
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          📊 Quiz Report
        </h1>

        {/* Main Score */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: passed ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>
              {ma.score}/{ma.total}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1f2937' }}>{ma.subjectName}</h2>
              <p style={{ color: passed ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                {passed ? '✅ Passed — Great understanding!' : `⚠️ Below threshold (${ma.score}/10) — Prerequisites may need work`}
              </p>
            </div>
          </div>
        </div>

        {/* Prerequisite Score (if taken) */}
        {pa && (
          <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔗 Prerequisite: {pa.subjectName}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: pa.score >= 7 ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: pa.score >= 7 ? '#16a34a' : '#b45309' }}>
                {pa.score}/{pa.total}
              </div>
              <p style={{ color: '#6b7280' }}>
                {pa.score >= 7
                  ? 'Your prerequisites are solid. Focus on bridging to engineering-level concepts.'
                  : 'Root cause found: prerequisite concepts need strengthening before tackling engineering topics.'}
              </p>
            </div>
          </div>
        )}

        {/* Weak Concepts */}
        {allWeakConcepts.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>🔴 Concepts to Improve</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allWeakConcepts.map((c, i) => (
                <span key={i} style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, border: '1px solid #fecaca' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Roadmap */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>🗺️ Recommended Learning Path</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!passed && prereq && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#faf5ff', borderRadius: 12, border: '1px solid #e9d5ff' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>1</div>
                <div>
                  <strong style={{ color: '#7c3aed' }}>Master Prerequisites: {prereq.shortName}</strong>
                  <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Strengthen foundational concepts first</p>
                </div>
              </div>
            )}
            {allWeakConcepts.slice(0, 4).map((c, i) => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{(!passed && prereq ? 2 : 1) + i}</div>
                <div>
                  <strong style={{ color: '#1f2937' }}>Study: {c}</strong>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Review this concept and practice problems</p>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>✓</div>
              <div>
                <strong style={{ color: '#16a34a' }}>Retake {subj?.shortName} Quiz</strong>
                <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Verify your improvement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-question review */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>📝 Question Review — {ma.subjectName}</h3>
          {ma.questions.map((q, i) => (
            <div key={q.id} style={{ padding: '12px 0', borderBottom: i < ma.questions.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 18 }}>{ma.correct[i] ? '✅' : '❌'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>{q.question}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Your answer: {ma.answers[i]} | Correct: {q.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => { setPhase('select'); setSession(null); setMainAttempt(null); }}
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', width: '100%' }}>
          Take Another Quiz
        </button>
      </div>
    );
  }

  return null;
}

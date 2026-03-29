import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type SemId = 'sem1' | 'sem2' | 'sem3' | 'sem4';
type CheckPhase = 'idle' | 'loading' | 'quiz' | 'results' | 'saving' | 'saved';

interface DiagQuestion {
  id: string;
  type: string;
  difficulty: string;
  concept: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

interface DiagSubject {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  semesterId: string;
  prerequisiteId?: string;
  available: boolean;
  questions: DiagQuestion[];
}

interface DiagData {
  semId: string;
  subjects: DiagSubject[];
}

interface SubjectResult {
  subjectId: string;
  subjectName: string;
  shortName: string;
  color: string;
  icon: string;
  score: number;
  total: number;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean }[];
  available: boolean;
}

// ─── Rating config ────────────────────────────────────────────────────────────
function getRating(score: number, total: number) {
  if (total === 0) return { label: 'No Data', emoji: '⬜', color: '#9ca3af', bg: '#f3f4f6', ring: '#e5e7eb' };
  const pct = score / total;
  if (pct === 1)    return { label: 'Perfect', emoji: '🟢', color: '#16a34a', bg: '#dcfce7', ring: '#22c55e' };
  if (pct >= 0.75)  return { label: 'Good', emoji: '🔵', color: '#1d4ed8', bg: '#dbeafe', ring: '#3b82f6' };
  if (pct >= 0.5)   return { label: 'Needs Work', emoji: '🟡', color: '#d97706', bg: '#fef9c3', ring: '#f59e0b' };
  if (pct > 0)      return { label: 'Focus More', emoji: '🟠', color: '#ea580c', bg: '#ffedd5', ring: '#f97316' };
  return { label: 'Weak Subject', emoji: '🔴', color: '#dc2626', bg: '#fee2e2', ring: '#ef4444' };
}

const SEM_INFO: Record<SemId, { label: string; subjects: string; color: string; gradient: string }> = {
  sem1: { label: 'Semester 1', subjects: 'Math I · Physics I · Chemistry I · BEE · Eng. Graphics · PCE-1', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  sem2: { label: 'Semester 2', subjects: 'Math II · Physics II · Chemistry II · Eng. Mech · C Programming', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  sem3: { label: 'Semester 3', subjects: 'Math III · DS · DLCOA · DSGT · Microprocessors', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  sem4: { label: 'Semester 4', subjects: 'Math IV · DBMS · OS · AOA · Computer Graphics', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SemCheckPage() {
  const { user } = useAuth();

  const [phase, setPhase] = useState<CheckPhase>('idle');
  const [selectedSem, setSelectedSem] = useState<SemId | null>(null);
  const [diagData, setDiagData] = useState<DiagData | null>(null);

  // Quiz tracking
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  // Collected answers per subject
  const [currentSubjectAnswers, setCurrentSubjectAnswers] = useState<{ questionId: string; selectedAnswer: string; isCorrect: boolean }[]>([]);
  const [results, setResults] = useState<SubjectResult[]>([]);

  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Fetch diagnostic data ──────────────────────────────────────────────────
  const startDiagnostic = useCallback(async (semId: SemId) => {
    setSelectedSem(semId);
    setPhase('loading');
    setResults([]);
    setCurrentSubjectIdx(0);
    setCurrentQIdx(0);
    setCurrentSubjectAnswers([]);
    setUserAnswer('');
    setShowFeedback(false);
    try {
      const res = await api.get<DiagData>(`/quiz/sem/${semId}/diagnostic`);
      setDiagData(res.data);
      // Find the first available subject
      const firstAvail = res.data.subjects.findIndex((s) => s.available && s.questions.length > 0);
      if (firstAvail === -1) {
        // No subjects available — jump straight to empty results
        setResults(
          res.data.subjects.map((s) => ({
            subjectId: s.id, subjectName: s.name, shortName: s.shortName,
            color: s.color, icon: s.icon, score: 0, total: 0,
            answers: [], available: false,
          }))
        );
        setPhase('results');
      } else {
        setCurrentSubjectIdx(firstAvail);
        setPhase('quiz');
      }
    } catch (err: any) {
      setPhase('idle');
      alert('Failed to load diagnostic data. Please ensure the backend is running.');
    }
  }, []);

  // ── Submit answer ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!diagData) return;
    const subject = diagData.subjects[currentSubjectIdx];
    const q = subject.questions[currentQIdx];
    const ans = userAnswer.trim() || '(no answer)';
    const isCorrect = ans.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');
    setCurrentSubjectAnswers((prev) => [
      ...prev,
      { questionId: q.id, selectedAnswer: ans, isCorrect },
    ]);
    setShowFeedback(true);
  }, [userAnswer, diagData, currentSubjectIdx, currentQIdx]);

  // ── Next question / subject ────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!diagData) return;
    const subject = diagData.subjects[currentSubjectIdx];

    if (currentQIdx + 1 < subject.questions.length) {
      // More questions in this subject
      setCurrentQIdx((p) => p + 1);
      setUserAnswer('');
      setShowFeedback(false);
    } else {
      // Subject finished — compute score
      const subjectAnswers = [
        ...currentSubjectAnswers,
      ];
      const score = subjectAnswers.filter((a) => a.isCorrect).length;

      const newResult: SubjectResult = {
        subjectId: subject.id,
        subjectName: subject.name,
        shortName: subject.shortName,
        color: subject.color,
        icon: subject.icon,
        score,
        total: subject.questions.length,
        answers: subjectAnswers,
        available: true,
      };

      const updatedResults = [...results, newResult];
      setResults(updatedResults);
      setCurrentSubjectAnswers([]);

      // Find next available subject
      let nextIdx = currentSubjectIdx + 1;
      while (nextIdx < diagData.subjects.length && (!diagData.subjects[nextIdx].available || diagData.subjects[nextIdx].questions.length === 0)) {
        // Skip unavailable subjects — add placeholder result
        const skipped = diagData.subjects[nextIdx];
        updatedResults.push({
          subjectId: skipped.id, subjectName: skipped.name, shortName: skipped.shortName,
          color: skipped.color, icon: skipped.icon, score: 0, total: 0,
          answers: [], available: false,
        });
        nextIdx++;
      }

      if (nextIdx < diagData.subjects.length) {
        setCurrentSubjectIdx(nextIdx);
        setCurrentQIdx(0);
        setUserAnswer('');
        setShowFeedback(false);
        setResults(updatedResults);
      } else {
        // All subjects done
        setResults(updatedResults);
        setPhase('results');
      }
    }
  }, [diagData, currentSubjectIdx, currentQIdx, currentSubjectAnswers, results]);

  // ── Save results to DB ────────────────────────────────────────────────────
  const saveResults = useCallback(async () => {
    if (!user || !selectedSem) return;
    setPhase('saving');
    setSaveError(null);
    try {
      const payload = {
        userId: user.id,
        semId: selectedSem,
        results: results
          .filter((r) => r.available)
          .map((r) => ({
            subjectId: r.subjectId,
            subjectName: r.subjectName,
            shortName: r.shortName,
            score: r.score,
            totalQuestions: r.total,
            answers: r.answers,
          })),
      };
      await api.post('/sem-diagnostic', payload);
      setPhase('saved');
    } catch (err: any) {
      setSaveError(err?.response?.data?.msg || 'Failed to save. Please try again.');
      setPhase('results');
    }
  }, [user, selectedSem, results]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: IDLE — Semester Selection
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'idle' || !selectedSem) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          🎯 Semester Subject Check
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 12 }}>
          Find your weak subjects in a semester. We'll ask you <strong>4 quick questions</strong> from each subject and rate your performance.
        </p>

        {/* Rating legend */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            { emoji: '🟢', label: 'Perfect', desc: '4/4' },
            { emoji: '🔵', label: 'Good', desc: '3/4' },
            { emoji: '🟡', label: 'Needs Work', desc: '2/4' },
            { emoji: '🟠', label: 'Focus More', desc: '1/4' },
            { emoji: '🔴', label: 'Weak Subject', desc: '0/4' },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', fontSize: '0.82rem' }}>
              <span>{r.emoji}</span>
              <strong style={{ color: '#374151' }}>{r.label}</strong>
              <span style={{ color: '#9ca3af' }}>{r.desc}</span>
            </div>
          ))}
        </div>

        {/* Sem Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {(Object.keys(SEM_INFO) as SemId[]).map((semId) => {
            const info = SEM_INFO[semId];
            return (
              <button key={semId} onClick={() => startDiagnostic(semId)}
                style={{
                  background: 'white', border: '2px solid #e5e7eb', borderRadius: 20, padding: 28,
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.borderColor = info.color;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${info.color}25`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: info.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', marginBottom: 16 }}>
                  {semId.replace('sem', 'S')}
                </div>
                <h3 style={{ fontWeight: 800, color: '#1f2937', fontSize: '1.2rem', marginBottom: 8 }}>{info.label}</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>{info.subjects}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${info.color}15`, color: info.color, padding: '6px 16px', borderRadius: 20, fontWeight: 700, fontSize: '0.82rem' }}>
                  Start Diagnostic →
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: LOADING
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    const info = SEM_INFO[selectedSem];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: info.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.4rem', animation: 'spin 1s linear infinite' }}>
          ⏳
        </div>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading {info.label} questions…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: QUIZ
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'quiz' && diagData) {
    const semInfo = SEM_INFO[selectedSem];
    const subject = diagData.subjects[currentSubjectIdx];
    const q = subject.questions[currentQIdx];
    const isMCQ = q.type === 'mcq' && q.options && q.options.length > 0;
    const currentAnswer = userAnswer.trim() || '(no answer)';
    const isCorrect = showFeedback && currentAnswer.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');

    // Overall progress
    const doneSubjects = results.filter((r) => r.available).length;
    const totalAvail = diagData.subjects.filter((s) => s.available && s.questions.length > 0).length;
    const overallProgress = (doneSubjects / totalAvail) * 100;

    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Sem header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 20px', background: `${semInfo.color}10`, borderRadius: 14, border: `1px solid ${semInfo.color}25` }}>
          <span style={{ fontWeight: 800, color: semInfo.color, fontSize: '1rem' }}>🎯 {semInfo.label} Diagnostic</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#6b7280' }}>
            Subject {doneSubjects + 1} of {totalAvail}
          </span>
        </div>

        {/* Overall progress bar */}
        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${overallProgress}%`, background: semInfo.gradient, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>

        {/* Subject banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${subject.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `2px solid ${subject.color}30` }}>
            {subject.icon}
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{subject.name}</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: 2 }}>Question {currentQIdx + 1} of {subject.questions.length}</p>
          </div>
        </div>

        {/* Question progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {subject.questions.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < currentQIdx ? subject.color : i === currentQIdx ? `${subject.color}55` : '#f3f4f6', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.73rem', background: q.difficulty === 'easy' ? '#dcfce7' : q.difficulty === 'medium' ? '#fef9c3' : '#fee2e2', color: q.difficulty === 'easy' ? '#16a34a' : q.difficulty === 'medium' ? '#ca8a04' : '#dc2626', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{q.difficulty}</span>
          <span style={{ fontSize: '0.73rem', background: '#f3e8ff', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{q.concept}</span>
        </div>

        {/* Question Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: 20, lineHeight: 1.6 }}>{q.question}</h3>
          {isMCQ ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options!.map((opt, i) => {
                const isSelected = userAnswer === opt;
                const isRight = showFeedback && opt.toLowerCase().replace(/\s+/g, '') === q.answer.toLowerCase().replace(/\s+/g, '');
                const isWrong = showFeedback && isSelected && !isRight;
                let bg = 'white', border = '#e5e7eb', color = '#1f2937';
                if (!showFeedback && isSelected) { bg = '#f3e8ff'; border = '#8b5cf6'; color = '#7c3aed'; }
                if (showFeedback && isRight) { bg = '#dcfce7'; border = '#22c55e'; color = '#16a34a'; }
                if (isWrong) { bg = '#fee2e2'; border = '#ef4444'; color = '#dc2626'; }
                return (
                  <button key={i} disabled={showFeedback} onClick={() => setUserAnswer(opt)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, cursor: showFeedback ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, background: isSelected || isRight ? border : 'transparent', color: isSelected || isRight ? 'white' : color }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} disabled={showFeedback}
              placeholder="Type your answer here..."
              style={{ width: '100%', minHeight: 70, padding: 14, borderRadius: 12, border: '2px solid #e5e7eb', fontSize: '0.95rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', background: showFeedback ? '#f9fafb' : 'white' }}
              onFocus={(e) => !showFeedback && (e.currentTarget.style.borderColor = subject.color)}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          )}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div style={{ background: isCorrect ? '#f0fdf4' : '#fef2f2', borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{isCorrect ? '✅' : '❌'}</span>
              <strong style={{ color: isCorrect ? '#16a34a' : '#dc2626' }}>{isCorrect ? 'Correct!' : 'Incorrect'}</strong>
            </div>
            {!isCorrect && <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 4 }}>Answer: <strong style={{ color: '#1f2937' }}>{q.answer}</strong></p>}
            <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>{q.explanation}</p>
          </div>
        )}

        {/* Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {!showFeedback ? (
            <button onClick={handleSubmit} disabled={!userAnswer.trim()}
              style={{ background: userAnswer.trim() ? `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)` : '#e5e7eb', color: userAnswer.trim() ? 'white' : '#9ca3af', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, cursor: userAnswer.trim() ? 'pointer' : 'not-allowed', fontSize: '0.95rem' }}>
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext}
              style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)`, color: 'white', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              {currentQIdx + 1 < subject.questions.length ? 'Next Question →' : doneSubjects + 1 < totalAvail ? `Next: ${diagData.subjects.find((s, idx) => idx > currentSubjectIdx && s.available)?.shortName || 'Next Subject'} →` : 'View Results →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: RESULTS
  // ─────────────────────────────────────────────────────────────────────────
  if ((phase === 'results' || phase === 'saving' || phase === 'saved') && selectedSem) {
    const semInfo = SEM_INFO[selectedSem];
    const availableResults = results.filter((r) => r.available);
    const weakCount = availableResults.filter((r) => r.score / r.total < 0.5).length;
    const goodCount = availableResults.filter((r) => r.score / r.total >= 0.75).length;

    return (
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            📊 {semInfo.label} — Diagnostic Results
          </h1>
          <p style={{ color: '#6b7280' }}>
            {goodCount > 0 && <span>✅ {goodCount} subject{goodCount > 1 ? 's' : ''} looking good. </span>}
            {weakCount > 0 && <span>⚠️ {weakCount} subject{weakCount > 1 ? 's' : ''} need{weakCount === 1 ? 's' : ''} attention.</span>}
          </p>
        </div>

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {results.map((r) => {
            const rating = getRating(r.score, r.total);
            return (
              <div key={r.subjectId} style={{
                background: 'white', borderRadius: 16, padding: 20, border: `2px solid ${r.available ? rating.ring : '#e5e7eb'}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', textAlign: 'center', transition: 'transform 0.2s',
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px', border: `2px solid ${r.color}30` }}>
                  {r.icon}
                </div>
                <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.95rem', marginBottom: 4 }}>{r.shortName}</h3>
                {r.available ? (
                  <>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: rating.color, marginBottom: 4 }}>
                      {r.score}<span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>/{r.total}</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: rating.bg, color: rating.color, padding: '4px 12px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 700 }}>
                      {rating.emoji} {rating.label}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 8, padding: '6px 12px', background: '#f9fafb', borderRadius: 12 }}>
                    Coming Soon
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detailed breakdown for available subjects */}
        {availableResults.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #e5e7eb', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: 20 }}>📋 Detailed Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {availableResults.map((r) => {
                const rating = getRating(r.score, r.total);
                const pct = (r.score / r.total) * 100;
                return (
                  <div key={r.subjectId}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span style={{ fontWeight: 700, color: '#1f2937', flex: 1 }}>{r.subjectName}</span>
                      <span style={{ fontSize: '0.82rem', background: rating.bg, color: rating.color, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                        {rating.emoji} {r.score}/{r.total} — {rating.label}
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: rating.ring, borderRadius: 4, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save & Actions */}
        {saveError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 14, marginBottom: 16, color: '#dc2626', fontSize: '0.9rem' }}>
            ⚠️ {saveError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          {phase === 'results' && (
            <button onClick={saveResults} disabled={availableResults.length === 0}
              style={{ flex: 1, background: availableResults.length > 0 ? semInfo.gradient : '#e5e7eb', color: availableResults.length > 0 ? 'white' : '#9ca3af', border: 'none', padding: '14px 28px', borderRadius: 12, fontWeight: 700, cursor: availableResults.length > 0 ? 'pointer' : 'not-allowed', fontSize: '1rem', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => availableResults.length > 0 && ((e.currentTarget as HTMLElement).style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = '')}>
              💾 Save Results to Profile
            </button>
          )}
          {phase === 'saving' && (
            <div style={{ flex: 1, padding: '14px 28px', borderRadius: 12, background: '#f3f4f6', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>
              Saving…
            </div>
          )}
          {phase === 'saved' && (
            <div style={{ flex: 1, padding: '14px 28px', borderRadius: 12, background: '#dcfce7', textAlign: 'center', color: '#16a34a', fontWeight: 700, border: '1px solid #bbf7d0' }}>
              ✅ Results saved to your profile!
            </div>
          )}
          <button onClick={() => { setPhase('idle'); setSelectedSem(null); setDiagData(null); setResults([]); }}
            style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', padding: '14px 24px', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}>
            Try Another Sem
          </button>
        </div>
      </div>
    );
  }

  return null;
}

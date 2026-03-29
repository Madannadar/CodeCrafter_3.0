import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useQuizData } from '../context/QuizDataContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizEntry {
  _id: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  difficulty?: string | null;
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

const SEM_LABEL: Record<string, string> = { sem1: 'Semester 1', sem2: 'Semester 2', sem3: 'Semester 3', sem4: 'Semester 4' };
const SEM_COLOR: Record<string, string> = { sem1: '#8b5cf6', sem2: '#f59e0b', sem3: '#10b981', sem4: '#ef4444' };

const RATING_CFG: Record<string, { color: string; bg: string; ring: string; emoji: string }> = {
  'Perfect':      { color: '#16a34a', bg: '#dcfce7', ring: '#22c55e', emoji: '🟢' },
  'Good':         { color: '#1d4ed8', bg: '#dbeafe', ring: '#3b82f6', emoji: '🔵' },
  'Needs Work':   { color: '#d97706', bg: '#fef9c3', ring: '#f59e0b', emoji: '🟡' },
  'Focus More':   { color: '#ea580c', bg: '#ffedd5', ring: '#f97316', emoji: '🟠' },
  'Weak Subject': { color: '#dc2626', bg: '#fee2e2', ring: '#ef4444', emoji: '🔴' },
  'No Data':      { color: '#9ca3af', bg: '#f3f4f6', ring: '#e5e7eb', emoji: '⬜' },
};

const DIFF_COLOR: Record<string, string> = { easy: '#16a34a', medium: '#d97706', hard: '#dc2626' };
const DIFF_BG: Record<string, string> = { easy: '#dcfce7', medium: '#fef9c3', hard: '#fee2e2' };

export default function HistoryPage() {
  const { user } = useAuth();
  const { subjects } = useQuizData();

  const [tab, setTab] = useState<Tab>('quiz');
  const [quizHistory, setQuizHistory] = useState<QuizEntry[]>([]);
  const [semHistory, setSemHistory] = useState<SemEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Regular quiz state
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

  // Sem state
  const [expandedSemId, setExpandedSemId] = useState<string | null>(null);
  const [filterSem, setFilterSem] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      api.get<QuizEntry[]>(`/history/user/${user.id}`),
      api.get<SemEntry[]>(`/sem-diagnostic/user/${user.id}`),
    ]).then(([qRes, sRes]) => {
      setQuizHistory(qRes.data || []);
      setSemHistory(sRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  // ── Filtered quiz history ─────────────────────────────────────────────────
  const filteredQuiz = quizHistory
    .filter(q => filterSubject === 'all' || q.subjectId === filterSubject)
    .filter(q => filterDiff === 'all' || q.difficulty === filterDiff);

  // ── Filtered sem history ──────────────────────────────────────────────────
  const filteredSem = semHistory.filter(s => filterSem === 'all' || s.semId === filterSem);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, flexDirection: 'column' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e9d5ff', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#9ca3af' }}>Loading history…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f0a1e', letterSpacing: '-0.5px', marginBottom: 6 }}>
          📋 History
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>All your quiz attempts and semester diagnostics in one place</p>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#f3f4f6', borderRadius: 14, padding: 4, width: 'fit-content' }}>
        {([['quiz', '📝 Quiz History', quizHistory.length], ['sem', '🎯 Sem Diagnostics', semHistory.length]] as [Tab, string, number][]).map(([t, label, count]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s', background: tab === t ? 'white' : 'transparent', color: tab === t ? '#7c3aed' : '#6b7280', boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
            {label} <span style={{ marginLeft: 6, background: tab === t ? '#f3e8ff' : '#e5e7eb', color: tab === t ? '#7c3aed' : '#9ca3af', padding: '1px 7px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700 }}>{count}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: QUIZ HISTORY
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'quiz' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Subjects</option>
              {subjects.filter(s => quizHistory.some(q => q.subjectId === s.id)).map(s => (
                <option key={s.id} value={s.id}>{s.shortName}</option>
              ))}
            </select>
            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Intermediate</option>
              <option value="hard">Hard</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: '0.82rem', color: '#9ca3af' }}>
              {filteredQuiz.length} result{filteredQuiz.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Score trend mini-chart */}
          {quizHistory.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #f0f0f5', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Score trend — all quizzes</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                {quizHistory.slice(0, 20).reverse().map((q, i) => {
                  const subj = subjects.find(s => s.id === q.subjectId);
                  const pct = Math.round((q.score / q.totalQuestions) * 100);
                  return (
                    <div key={i} style={{ flex: 1, height: `${Math.max(6, pct)}%`, borderRadius: '4px 4px 0 0', background: `linear-gradient(180deg, ${subj?.color || '#8b5cf6'}, ${subj?.color || '#8b5cf6'}55)`, minWidth: 6, cursor: 'default', transition: 'opacity 0.2s' }}
                      title={`${subj?.shortName || q.subjectId}: ${pct}%`} />
                  );
                })}
              </div>
            </div>
          )}

          {/* Quiz list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredQuiz.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #f0f0f5' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
                <p style={{ color: '#6b7280', marginBottom: 16 }}>No quizzes found with these filters</p>
                <Link to="/quiz" style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                  Take a Quiz →
                </Link>
              </div>
            ) : filteredQuiz.map(quiz => {
              const subj = subjects.find(s => s.id === quiz.subjectId);
              const pct = Math.round((quiz.score / quiz.totalQuestions) * 100);
              const scoreColor = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
              const scoreBg = pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fee2e2';
              const isExpanded = expandedQuizId === quiz._id;

              return (
                <div key={quiz._id} style={{ background: 'white', borderRadius: 16, border: `1px solid ${isExpanded ? (subj?.color || '#8b5cf6') + '40' : '#f0f0f5'}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>
                  <button onClick={() => setExpandedQuizId(isExpanded ? null : quiz._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    {/* Subject icon */}
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: `${subj?.color || '#8b5cf6'}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0, border: `1.5px solid ${subj?.color || '#8b5cf6'}25` }}>
                      {subj?.icon || '📝'}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.92rem' }}>{subj?.name || quiz.subjectId}</span>
                        {quiz.difficulty && (
                          <span style={{ fontSize: '0.7rem', background: DIFF_BG[quiz.difficulty] || '#f3f4f6', color: DIFF_COLOR[quiz.difficulty] || '#6b7280', padding: '2px 8px', borderRadius: 10, fontWeight: 700, textTransform: 'capitalize' }}>
                            {quiz.difficulty === 'medium' ? 'Intermediate' : quiz.difficulty}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {new Date(quiz.timestamp).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {quiz.score}/{quiz.totalQuestions} correct
                      </p>
                    </div>
                    {/* Score badge */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: scoreBg, border: `2px solid ${scoreColor}40` }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: scoreColor }}>{pct}%</span>
                      </div>
                    </div>
                    <span style={{ color: '#d1d5db', fontSize: '1rem', marginLeft: 4 }}>{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* Expanded — progress bar */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px' }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                        {Array.from({ length: quiz.totalQuestions }).map((_, i) => (
                          <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < quiz.score ? (subj?.color || '#8b5cf6') : '#f3f4f6' }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: '#6b7280' }}>
                        <span>✅ {quiz.score} correct</span>
                        <span>❌ {quiz.totalQuestions - quiz.score} incorrect</span>
                        <span style={{ marginLeft: 'auto' }}>Score: {pct}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: SEM DIAGNOSTICS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'sem' && (
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Semesters</option>
              {['sem1', 'sem2', 'sem3', 'sem4'].map(s => (
                <option key={s} value={s}>{SEM_LABEL[s]}</option>
              ))}
            </select>
            <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#9ca3af' }}>
              {filteredSem.length} session{filteredSem.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Sem list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredSem.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #f0f0f5' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
                <p style={{ color: '#6b7280', marginBottom: 16 }}>No semester diagnostics yet</p>
                <Link to="/sem-check" style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                  Run a Sem Check →
                </Link>
              </div>
            ) : filteredSem.map(entry => {
              const semColor = SEM_COLOR[entry.semId] || '#8b5cf6';
              const isExpanded = expandedSemId === entry._id;
              const goodCount = entry.subjectResults.filter(r => r.score / r.totalQuestions >= 0.75).length;
              const weakCount = entry.weakSubjectIds.length;

              return (
                <div key={entry._id} style={{ background: 'white', borderRadius: 18, border: `1px solid ${isExpanded ? semColor + '40' : '#f0f0f5'}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>

                  {/* Header row */}
                  <button onClick={() => setExpandedSemId(isExpanded ? null : entry._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg, ${semColor}, ${semColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                      {entry.semId.replace('sem', 'S')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, color: '#1f2937', fontSize: '1rem' }}>{SEM_LABEL[entry.semId] || entry.semId}</span>
                        {weakCount > 0 && (
                          <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                            {weakCount} weak
                          </span>
                        )}
                        {goodCount === entry.subjectResults.length && (
                          <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                            All good!
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {new Date(entry.timestamp).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{entry.totalSubjects} subjects tested
                      </p>
                    </div>

                    {/* Mini rating pills */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                      {entry.subjectResults.slice(0, 5).map(r => {
                        const cfg = RATING_CFG[r.rating] || RATING_CFG['No Data'];
                        return (
                          <span key={r.subjectId} style={{ fontSize: '0.7rem', background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 10, fontWeight: 700, border: `1px solid ${cfg.ring}30` }}>
                            {cfg.emoji} {r.shortName}
                          </span>
                        );
                      })}
                    </div>
                    <span style={{ color: '#d1d5db', fontSize: '1rem', marginLeft: 8, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* Expanded subject breakdown */}
                  {isExpanded && (
                    <div style={{ padding: '0 22px 22px' }}>
                      <div style={{ borderTop: '1px solid #f0f0f5', paddingTop: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                          {entry.subjectResults.map(r => {
                            const cfg = RATING_CFG[r.rating] || RATING_CFG['No Data'];
                            const pct = r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : 0;
                            return (
                              <div key={r.subjectId} style={{ background: cfg.bg, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${cfg.ring}30` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                  <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.88rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.shortName}</span>
                                  <span style={{ fontSize: '0.75rem', background: 'white', color: cfg.color, padding: '2px 8px', borderRadius: 8, fontWeight: 700, flexShrink: 0, marginLeft: 6 }}>
                                    {r.score}/{r.totalQuestions}
                                  </span>
                                </div>
                                {/* Progress */}
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.7)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: cfg.ring, borderRadius: 3, transition: 'width 0.6s' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: '0.75rem', color: cfg.color, fontWeight: 700 }}>{cfg.emoji} {r.rating}</span>
                                </div>
                                {/* Answer breakdown */}
                                {r.answers.length > 0 && (
                                  <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                                    {r.answers.map((a, i) => (
                                      <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: a.isCorrect ? '#22c55e' : '#ef4444', flexShrink: 0 }} title={a.isCorrect ? 'Correct' : 'Incorrect'} />
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
            })}
          </div>
        </div>
      )}
    </div>
  );
}

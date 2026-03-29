import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useQuizData } from '../context/QuizDataContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizEntry { _id: string; subjectId: string; score: number; totalQuestions: number; timestamp: string; difficulty?: string; }
interface SemEntry { _id: string; semId: string; timestamp: string; totalSubjects: number; weakSubjectIds: string[]; subjectResults: { subjectId: string; shortName: string; score: number; totalQuestions: number; rating: string }[]; }

const SEM_LABEL: Record<string, string> = { sem1: 'Semester 1', sem2: 'Semester 2', sem3: 'Semester 3', sem4: 'Semester 4' };
const SEM_COLOR: Record<string, string> = { sem1: '#8b5cf6', sem2: '#f59e0b', sem3: '#10b981', sem4: '#ef4444' };

const RATING_COLOR: Record<string, { color: string; bg: string; emoji: string }> = {
  'Perfect':      { color: '#16a34a', bg: '#dcfce7', emoji: '🟢' },
  'Good':         { color: '#1d4ed8', bg: '#dbeafe', emoji: '🔵' },
  'Needs Work':   { color: '#d97706', bg: '#fef9c3', emoji: '🟡' },
  'Focus More':   { color: '#ea580c', bg: '#ffedd5', emoji: '🟠' },
  'Weak Subject': { color: '#dc2626', bg: '#fee2e2', emoji: '🔴' },
  'No Data':      { color: '#9ca3af', bg: '#f3f4f6', emoji: '⬜' },
};

// ─── Tiny animated counter ────────────────────────────────────────────────────
function AnimCount({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (to === 0) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(to / 30));
    ref.current = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); if (ref.current) clearInterval(ref.current); }
      else setVal(start);
    }, 30);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [to]);
  return <>{val}{suffix}</>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { subjects } = useQuizData();
  const [quizHistory, setQuizHistory] = useState<QuizEntry[]>([]);
  const [semHistory, setSemHistory] = useState<SemEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  // ── Computed stats ─────────────────────────────────────────────────────────
  const totalQuizzes = quizHistory.length;
  const avgScore = totalQuizzes
    ? Math.round(quizHistory.reduce((a, q) => a + (q.score / q.totalQuestions) * 100, 0) / totalQuizzes)
    : 0;
  const weakSubjects = (user?.weak_subjects || []).map(id => subjects.find(s => s.id === id)).filter(Boolean);
  const recentQuizzes = quizHistory.slice(0, 5);
  const latestSem = semHistory[0] || null;

  // ── Score trend (last 10 quizzes, oldest→newest) ───────────────────────────
  const trendData = quizHistory
    .slice(0, 10)
    .reverse()
    .map(q => ({ pct: Math.round((q.score / q.totalQuestions) * 100), subj: subjects.find(s => s.id === q.subjectId) }));

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e9d5ff', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>Loading your workspace…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f3e8ff', padding: '4px 14px', borderRadius: 20, marginBottom: 12, border: '1px solid #e9d5ff' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Learning Workspace</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f0a1e', letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: 8 }}>
            Welcome back,{' '}
            <span style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.name?.split(' ')[0] || 'Student'}
            </span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.5 }}>
            Your personalized study hub — tracking gaps, progress & next steps.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/sem-check"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'white', border: '1px solid #e5e7eb', color: '#374151', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#8b5cf6')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
            🎯 Sem Check
          </Link>
          <Link to="/quiz"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', boxShadow: '0 4px 16px rgba(139,92,246,0.4)', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(139,92,246,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(139,92,246,0.4)'; }}>
            ✦ Start Quiz
          </Link>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          {
            label: 'Quizzes Taken', value: totalQuizzes, suffix: '', icon: '📝',
            color: '#8b5cf6', bg: 'linear-gradient(135deg, #f3e8ff, #faf5ff)',
            border: '#e9d5ff',
          },
          {
            label: 'Average Score', value: avgScore, suffix: '%', icon: '📊',
            color: avgScore >= 70 ? '#16a34a' : avgScore >= 50 ? '#d97706' : '#dc2626',
            bg: avgScore >= 70 ? 'linear-gradient(135deg, #dcfce7, #f0fdf4)' : avgScore >= 50 ? 'linear-gradient(135deg, #fef9c3, #fffbeb)' : 'linear-gradient(135deg, #fee2e2, #fef2f2)',
            border: avgScore >= 70 ? '#bbf7d0' : avgScore >= 50 ? '#fde68a' : '#fecaca',
          },
          {
            label: 'Weak Subjects', value: weakSubjects.length, suffix: '', icon: '⚠️',
            color: '#ef4444', bg: 'linear-gradient(135deg, #fee2e2, #fef2f2)',
            border: '#fecaca',
          },
          {
            label: 'Sem Checks', value: semHistory.length, suffix: '', icon: '🎯',
            color: '#0ea5e9', bg: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)',
            border: '#bae6fd',
          },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 18, padding: '20px 24px', border: `1px solid ${stat.border}`, transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{stat.icon}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: 6 }}>
              <AnimCount to={stat.value} suffix={stat.suffix} />
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', letterSpacing: '0.02em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main content grid ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 20 }}>

        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score Trend Chart */}
          <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #f0f0f5', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: 2 }}>📈 Score Trend</h2>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Last {trendData.length} quiz attempts</p>
              </div>
              <Link to="/history" style={{ fontSize: '0.78rem', color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
            </div>
            {trendData.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                {trendData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '0.65rem', color: '#9ca3af', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                      {d.pct}%
                    </span>
                    <div style={{ width: '100%', borderRadius: '6px 6px 0 0', transition: 'all 0.4s', cursor: 'default', position: 'relative', height: `${Math.max(4, d.pct)}%`, background: `linear-gradient(180deg, ${d.subj?.color || '#8b5cf6'}, ${d.subj?.color || '#8b5cf6'}55)`, boxShadow: `0 -2px 8px ${d.subj?.color || '#8b5cf6'}30` }} />
                    <span style={{ fontSize: '0.6rem', color: '#d1d5db' }}>{d.subj?.shortName?.substring(0, 4) || '?'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, background: '#fafafa', borderRadius: 12, border: '1px dashed #e5e7eb' }}>
                <span style={{ fontSize: '2rem' }}>📊</span>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Take some quizzes to see your trend</p>
              </div>
            )}
          </div>

          {/* Recent Quizzes */}
          <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #f0f0f5', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>🕐 Recent Quizzes</h2>
              <Link to="/history" style={{ fontSize: '0.78rem', color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentQuizzes.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: '0.88rem' }}>
                  No quizzes yet. <Link to="/quiz" style={{ color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>Start one →</Link>
                </div>
              ) : recentQuizzes.map(quiz => {
                const subj = subjects.find(s => s.id === quiz.subjectId);
                const pct = Math.round((quiz.score / quiz.totalQuestions) * 100);
                const scoreColor = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                return (
                  <div key={quiz._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: '#fafafa', border: '1px solid #f0f0f5', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f3e8ff10'; (e.currentTarget as HTMLElement).style.borderColor = `${subj?.color || '#e9d5ff'}40`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f5'; }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${subj?.color || '#8b5cf6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                      {subj?.icon || '📝'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subj?.name || quiz.subjectId}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                        {quiz.difficulty && <span style={{ marginRight: 6, textTransform: 'capitalize' }}>{quiz.difficulty} ·</span>}
                        {new Date(quiz.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: scoreColor }}>{pct}%</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{quiz.score}/{quiz.totalQuestions}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Weak Subjects */}
          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #f0f0f5', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>⚠️ Knowledge Gaps</h2>
              <Link to="/graph" style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>Graph →</Link>
            </div>
            {weakSubjects.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
                <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.88rem' }}>No gaps identified yet!</p>
                <p style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: 4 }}>Keep taking quizzes to find weak spots</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {weakSubjects.map((subj) => (
                  <div key={subj!.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${subj!.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>{subj!.icon}</div>
                    <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#374151', flex: 1 }}>{subj!.shortName}</span>
                    <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Weak</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Sem Check */}
          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #f0f0f5', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>🎯 Latest Sem Check</h2>
              <Link to="/history" style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>History →</Link>
            </div>
            {!latestSem ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</div>
                <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>No semester checks yet</p>
                <Link to="/sem-check" style={{ display: 'inline-block', marginTop: 10, padding: '8px 18px', background: '#f3e8ff', color: '#7c3aed', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                  Run Sem Check →
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: `${SEM_COLOR[latestSem.semId]}10`, border: `1px solid ${SEM_COLOR[latestSem.semId]}25`, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: SEM_COLOR[latestSem.semId], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                    {latestSem.semId.replace('sem', 'S')}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9rem' }}>{SEM_LABEL[latestSem.semId]}</p>
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      {new Date(latestSem.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {latestSem.weakSubjectIds.length > 0 && <span style={{ marginLeft: 6, color: '#dc2626' }}>· {latestSem.weakSubjectIds.length} weak</span>}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {latestSem.subjectResults.map(r => {
                    const rCfg = RATING_COLOR[r.rating] || RATING_COLOR['No Data'];
                    return (
                      <div key={r.subjectId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', width: 72, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.shortName}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(r.score / r.totalQuestions) * 100}%`, background: rCfg.color, borderRadius: 3, transition: 'width 0.6s' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: rCfg.color, fontWeight: 700, width: 20, textAlign: 'right' }}>{r.score}/{r.totalQuestions}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #f0f0f5', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937', marginBottom: 14 }}>⚡ Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { to: '/quiz', icon: '📝', label: 'Take a Quiz', desc: 'Test knowledge & find gaps', color: '#8b5cf6' },
                { to: '/sem-check', icon: '🎯', label: 'Sem Diagnostic', desc: 'Find weak subjects quickly', color: '#f59e0b' },
                { to: '/graph', icon: '🔗', label: 'Concept Graph', desc: 'See topic dependencies', color: '#10b981' },
                { to: '/history', icon: '📋', label: 'Full History', desc: 'Review all attempts', color: '#0ea5e9' },
              ].map(action => (
                <Link key={action.to} to={action.to} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, textDecoration: 'none', background: '#fafafa', border: '1px solid #f0f0f5', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${action.color}08`; (e.currentTarget as HTMLElement).style.borderColor = `${action.color}30`; (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f5'; (e.currentTarget as HTMLElement).style.transform = ''; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{action.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>{action.label}</p>
                    <p style={{ fontSize: '0.73rem', color: '#9ca3af' }}>{action.desc}</p>
                  </div>
                  <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

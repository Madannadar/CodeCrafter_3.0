import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { subjects } from '../data/quizData';

export default function DashboardPage() {
  const { user } = useAuth();
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      api.get(`/history/user/${user.id}`).then(res => {
        setQuizHistory(res.data);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  const recentQuizzes = quizHistory.slice(0, 4);
  const totalQuizzes = quizHistory.length;
  const averageScore = totalQuizzes ? Math.round(quizHistory.reduce((a, q) => a + ((q.score/q.totalQuestions)*100), 0) / totalQuizzes) : 0;
  
  const weakSubjects = user?.weak_subjects?.map(id => subjects.find(s => s.id === id)).filter(Boolean) || [];

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light">{user?.name?.split(' ')[0] || 'Student'}</span>
          </h1>
          <p className="text-text-secondary mt-1">Here's your learning progress overview</p>
        </div>
        <Link to="/quiz" className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium text-sm hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 transition-all duration-300">
          Start New Quiz →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-5 stagger-children">
        {[
          { label: 'Total Quizzes', value: totalQuizzes, icon: '📝', color: 'from-primary/20 to-primary/5', accent: 'text-primary-light' },
          { label: 'Average Score', value: `${averageScore}%`, icon: '📊', color: 'from-accent/20 to-accent/5', accent: 'text-accent-light' },
          { label: 'Weak Subjects', value: weakSubjects.length, icon: '⚠️', color: 'from-error/20 to-error/5', accent: 'text-error' },
          { label: 'Strong Subjects', value: subjects.length - weakSubjects.length, icon: '💪', color: 'from-success/20 to-success/5', accent: 'text-success' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-5 hover:border-primary/25 transition-all duration-300 group hover:-translate-y-1">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
              {stat.icon}
            </div>
            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
            <p className="text-sm text-text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">🔍 Knowledge Gaps (Weak Subjects)</h2>
            <Link to="/graph" className="text-xs text-primary-light hover:text-primary transition-colors">View Graph →</Link>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
            {weakSubjects.length === 0 ? (
              <p className="text-sm text-text-muted">No weak subjects identified yet! Keep up the good work.</p>
            ) : (
              weakSubjects.map((subj, i) => (
                <div key={subj!.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-lighter/50 border border-border-light hover:border-error/20 hover:bg-error/5 transition-all" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${subj!.color}22` }}>{subj!.icon}</div>
                  <span className="text-sm text-text-secondary">{subj!.name}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-error/15 text-error font-medium">Needs Work</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">📋 Recent Activity</h2>
            <Link to="/history" className="text-xs text-primary-light hover:text-primary transition-colors">View All →</Link>
          </div>
          <div className="space-y-3">
            {recentQuizzes.length === 0 ? (
              <p className="text-sm text-text-muted">You haven't taken any quizzes yet.</p>
            ) : (
              recentQuizzes.map((quiz) => {
                const subj = subjects.find((s) => s.id === quiz.subjectId);
                const pct = Math.round((quiz.score / quiz.totalQuestions) * 100);
                return (
                  <div key={quiz._id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-lighter/50 border border-border-light hover:border-primary/15 transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${subj?.color || '#8b5cf6'}22, transparent)`, color: subj?.color || '#8b5cf6' }}>
                      {pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{subj?.name || quiz.subjectId}</p>
                      <p className="text-xs text-text-muted">{new Date(quiz.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 stagger-children">
        {[
          { to: '/quiz', icon: '📝', title: 'Take a Quiz', desc: 'Test your knowledge and identify gaps', gradient: 'from-primary/20 to-accent/10' },
          { to: '/graph', icon: '🔗', title: 'Explore Graph', desc: 'Visualize concept dependencies', gradient: 'from-accent/20 to-success/10' },
          { to: '/history', icon: '📈', title: 'View Progress', desc: 'Track your learning journey', gradient: 'from-warning/20 to-error/10' },
        ].map((action) => (
          <Link key={action.to} to={action.to} className={`glass rounded-2xl p-6 bg-gradient-to-br ${action.gradient} border border-border-light hover:border-primary/25 hover:-translate-y-1 transition-all group`}>
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">{action.icon}</span>
            <h3 className="text-base font-semibold text-text-primary mb-1">{action.title}</h3>
            <p className="text-sm text-text-secondary">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

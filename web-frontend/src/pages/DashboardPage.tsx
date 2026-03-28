import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardStats, quizHistory } from '../data/mockUser';
import { subjects } from '../data/quizData';

export default function DashboardPage() {
  const { user } = useAuth();
  const recentQuizzes = quizHistory.slice(0, 4);

  // Gather all weak concepts across recent quizzes
  const allWeakConcepts = [...new Set(quizHistory.flatMap((q) => q.weakConcepts))];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light">{user?.name?.split(' ')[0] || 'Student'}</span>
          </h1>
          <p className="text-text-secondary mt-1">Here's your learning progress overview</p>
        </div>
        <Link
          to="/quiz"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium text-sm
                     hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Start New Quiz →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-5 stagger-children">
        {[
          { label: 'Total Quizzes', value: dashboardStats.totalQuizzes, icon: '📝', color: 'from-primary/20 to-primary/5', accent: 'text-primary-light' },
          { label: 'Average Score', value: `${dashboardStats.averageScore}%`, icon: '📊', color: 'from-accent/20 to-accent/5', accent: 'text-accent-light' },
          { label: 'Study Streak', value: `${dashboardStats.studyStreak} days`, icon: '🔥', color: 'from-warning/20 to-warning/5', accent: 'text-warning' },
          { label: 'Weak Topics', value: dashboardStats.weakTopicsCount, icon: '⚠️', color: 'from-error/20 to-error/5', accent: 'text-error' },
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

      {/* Learning Progress */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-5">Overall Mastery</h2>
        <div className="space-y-4">
          {subjects.map((subj) => {
            const subjQuizzes = quizHistory.filter((q) => q.subjectId === subj.id);
            const avgScore = subjQuizzes.length
              ? Math.round(subjQuizzes.reduce((a, q) => a + q.score, 0) / subjQuizzes.length)
              : 0;
            return (
              <div key={subj.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{subj.icon}</span>
                    <span className="text-sm font-medium text-text-primary">{subj.shortName}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: subj.color }}>{avgScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-lighter overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${avgScore}%`,
                      background: `linear-gradient(90deg, ${subj.color}, ${subj.color}88)`,
                      boxShadow: `0 0 10px ${subj.color}40`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Weak Topics / Knowledge Gaps */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">🔍 Knowledge Gaps</h2>
            <Link to="/graph" className="text-xs text-primary-light hover:text-primary transition-colors">
              View Graph →
            </Link>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
            {allWeakConcepts.map((concept, i) => (
              <div
                key={concept}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-lighter/50 border border-border-light
                           hover:border-error/20 hover:bg-error/5 transition-all duration-300"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-2 h-2 rounded-full bg-error shrink-0" />
                <span className="text-sm text-text-secondary">{concept}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-error/15 text-error font-medium">Weak</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">📋 Recent Activity</h2>
            <Link to="/history" className="text-xs text-primary-light hover:text-primary transition-colors">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-surface-lighter/50 border border-border-light
                           hover:border-primary/15 transition-all duration-300"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${subjects.find((s) => s.id === quiz.subjectId)?.color || '#8b5cf6'}22, transparent)`,
                    color: subjects.find((s) => s.id === quiz.subjectId)?.color || '#8b5cf6',
                  }}
                >
                  {quiz.score}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{quiz.subjectName}</p>
                  <p className="text-xs text-text-muted">{quiz.date} · {quiz.timeTaken}</p>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  quiz.score >= 70
                    ? 'bg-success/15 text-success'
                    : quiz.score >= 50
                      ? 'bg-warning/15 text-warning'
                      : 'bg-error/15 text-error'
                }`}>
                  {quiz.correctAnswers}/{quiz.totalQuestions}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-5 stagger-children">
        {[
          { to: '/quiz', icon: '📝', title: 'Take a Quiz', desc: 'Test your knowledge and identify gaps', gradient: 'from-primary/20 to-accent/10' },
          { to: '/graph', icon: '🔗', title: 'Explore Graph', desc: 'Visualize concept dependencies', gradient: 'from-accent/20 to-success/10' },
          { to: '/history', icon: '📈', title: 'View Progress', desc: 'Track your learning journey', gradient: 'from-warning/20 to-error/10' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`glass rounded-2xl p-6 bg-gradient-to-br ${action.gradient} border border-border-light
                        hover:border-primary/25 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group`}
          >
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform duration-300">{action.icon}</span>
            <h3 className="text-base font-semibold text-text-primary mb-1">{action.title}</h3>
            <p className="text-sm text-text-secondary">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { quizHistory } from '../data/mockUser';
import { subjects } from '../data/quizData';

type SortField = 'date' | 'score' | 'subject';
type SortDir = 'asc' | 'desc';

export default function HistoryPage() {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...quizHistory];
    if (filterSubject !== 'all') {
      items = items.filter((q) => q.subjectId === filterSubject);
    }
    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortField === 'score') cmp = a.score - b.score;
      else cmp = a.subjectName.localeCompare(b.subjectName);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return items;
  }, [sortField, sortDir, filterSubject]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  // Score trend data
  const scores = quizHistory
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((q) => q.score);
  const maxScore = Math.max(...scores, 100);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">📜 Quiz History</h1>
        <p className="text-text-secondary mt-1">Review past attempts and track your improvement over time</p>
      </div>

      {/* Score Trend Chart */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">📈 Score Trend</h2>
        <div className="flex items-end gap-3 h-36">
          {quizHistory
            .slice()
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((q) => {
              const height = (q.score / maxScore) * 100;
              const subj = subjects.find((s) => s.id === q.subjectId);
              return (
                <div key={q.id} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">{q.score}%</span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80 min-h-[4px]"
                    style={{
                      height: `${height}%`,
                      background: `linear-gradient(to top, ${subj?.color || '#8b5cf6'}, ${subj?.color || '#8b5cf6'}88)`,
                      boxShadow: `0 0 10px ${subj?.color || '#8b5cf6'}25`,
                    }}
                  />
                  <span className="text-[10px] text-text-muted">{q.date.slice(5)}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2 rounded-xl bg-surface-lighter border border-border-light text-text-primary text-sm
                     focus:outline-none focus:border-primary/40"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.shortName}</option>
          ))}
        </select>

        <div className="flex gap-1 ml-auto">
          {(['date', 'score', 'subject'] as SortField[]).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer capitalize ${
                sortField === field
                  ? 'bg-primary/15 text-primary-light border border-primary/25'
                  : 'bg-surface-lighter text-text-muted hover:text-text-primary'
              }`}
            >
              {field} {sortField === field && (sortDir === 'desc' ? '↓' : '↑')}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3 stagger-children">
        {filtered.map((quiz) => {
          const subj = subjects.find((s) => s.id === quiz.subjectId);
          const isExpanded = expandedId === quiz.id;

          return (
            <div key={quiz.id} className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/15">
              <button
                onClick={() => setExpandedId(isExpanded ? null : quiz.id)}
                className="w-full flex items-center gap-5 p-5 text-left cursor-pointer"
              >
                {/* Score badge */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${subj?.color || '#8b5cf6'}22, transparent)`,
                  }}
                >
                  <span className="text-xl font-bold" style={{ color: subj?.color }}>{quiz.score}%</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary">{quiz.subjectName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      quiz.score >= 70 ? 'bg-success/15 text-success' :
                      quiz.score >= 50 ? 'bg-warning/15 text-warning' :
                      'bg-error/15 text-error'
                    }`}>
                      {quiz.score >= 70 ? 'Good' : quiz.score >= 50 ? 'Average' : 'Needs Work'}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {quiz.date} · {quiz.correctAnswers}/{quiz.totalQuestions} correct · ⏱ {quiz.timeTaken}
                  </p>
                </div>

                {/* Expand indicator */}
                <span className={`text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-border-light animate-slide-up">
                  <div className="pt-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Weak Concepts Identified</h4>
                    <div className="flex flex-wrap gap-2">
                      {quiz.weakConcepts.map((concept) => (
                        <span
                          key={concept}
                          className="text-xs px-3 py-1.5 rounded-full bg-error/10 text-error border border-error/15"
                        >
                          ⚠️ {concept}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-surface-lighter/50">
                      <p className="text-xs text-text-secondary leading-relaxed">
                        <span className="text-warning font-medium">Root Cause:</span> Gaps in{' '}
                        {quiz.weakConcepts.slice(0, 2).join(' and ')}
                        {' '}suggest missing prerequisite knowledge. Check the{' '}
                        <span className="text-primary-light">Concept Graph</span> to trace dependency chains.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-text-secondary">No quiz history found for this filter.</p>
        </div>
      )}
    </div>
  );
}

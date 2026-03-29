import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuizData } from '../context/QuizDataContext';
import api from '../services/api';
import gsap from 'gsap';
import { GRAPH_NODES, GRAPH_EDGES, SEM_COLORS, SEM_LABELS } from '../data/subjectGraph';

// ─── Types ────────────────────────────────────────────────────────────────────
type FlowStep = 'greeting' | 'choosing_action' | 'choosing_subject' | 'choosing_difficulty' | 'ready' | 'sem_intro';
type DifficultyChoice = 'easy' | 'intermediate' | 'hard';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  type: 'text' | 'chips' | 'subject_grid' | 'diff_buttons' | 'launch';
  chips?: { label: string; icon: string; value: string }[];
  subjects?: any[];
  selectedSubject?: any;
  difficulty?: DifficultyChoice;
}

// ─── Sem column colors ────────────────────────────────────────────────────────
const EDGE_COLORS: Record<string, string> = {
  prerequisite: '#8b5cf6',
  domain: '#6b7280',
  uses: '#0ea5e9',
};

// ─── Subject Knowledge Graph SVG ────────────────────────────────────────────
function SubjectGraph({ onNodeClick, highlightId }: { onNodeClick: (id: string) => void; highlightId?: string | null }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string; subtext: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    gsap.fromTo(svgRef.current.querySelectorAll('.graph-node'), 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'back.out(1.7)', transformOrigin: '50% 50%' }
    );
    gsap.fromTo(svgRef.current.querySelectorAll('.graph-edge'), 
      { opacity: 0 },
      { opacity: 0.6, duration: 0.8, stagger: 0.03, delay: 0.5, ease: 'power2.out' }
    );
  }, []);

  const W = 900, H = 560;

  // Compute arrow endpoint (shortened to not overlap node)
  const arrowEndpoint = (fx: number, fy: number, tx: number, ty: number, r = 18) => {
    const dx = tx - fx, dy = ty - fy;
    const len = Math.sqrt(dx * dx + dy * dy);
    return { x: tx - (dx / len) * r, y: ty - (dy / len) * r };
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute', pointerEvents: 'none', zIndex: 20,
          left: (tooltip.x / W) * 100 + '%', top: (tooltip.y / H) * 100 + '%',
          transform: 'translate(-50%, -130%)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)',
          borderRadius: 10, padding: '8px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          maxWidth: 200, textAlign: 'center',
          animation: 'message-in 0.15s ease both',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{tooltip.text}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2, lineHeight: 1.4 }}>{tooltip.subtext}</div>
        </div>
      )}

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
        <defs>
          {/* Arrow marker */}
          <marker id="arrow-prereq" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={EDGE_COLORS.prerequisite} opacity="0.6" />
          </marker>
          <marker id="arrow-uses" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={EDGE_COLORS.uses} opacity="0.5" />
          </marker>
          {/* Glow filter */}
          <filter id="node-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Sem background columns */}
          {[
            { x: 160, label: 'Sem 1', color: SEM_COLORS.sem1 },
            { x: 350, label: 'Sem 2', color: SEM_COLORS.sem2 },
            { x: 540, label: 'Sem 3', color: SEM_COLORS.sem3 },
            { x: 730, label: 'Sem 4', color: SEM_COLORS.sem4 },
          ].map(col => (
            <rect key={col.label} x={col.x} y={10} width={115} height={H - 20}
              rx={12} fill={col.color} opacity="0.025" />
          ))}
        </defs>

        {/* Sem column labels */}
        {[
          { x: 210, label: 'Sem 1', color: SEM_COLORS.sem1 },
          { x: 400, label: 'Sem 2', color: SEM_COLORS.sem2 },
          { x: 590, label: 'Sem 3', color: SEM_COLORS.sem3 },
          { x: 780, label: 'Sem 4', color: SEM_COLORS.sem4 },
        ].map(col => (
          <text key={col.label} x={col.x} y={26} textAnchor="middle"
            fontSize={9} fontWeight={700} fill={col.color} opacity={0.6} letterSpacing="0.08em">
            {col.label.toUpperCase()}
          </text>
        ))}

        {/* Edges */}
        {GRAPH_EDGES.map((edge, i) => {
          const from = GRAPH_NODES.find(n => n.id === edge.from);
          const to = GRAPH_NODES.find(n => n.id === edge.to);
          if (!from || !to) return null;
          const end = arrowEndpoint(from.x, from.y, to.x, to.y, 16);
          const active = hovered === from.id || hovered === to.id || highlightId === from.id || highlightId === to.id;
          const color = EDGE_COLORS[edge.type];

          return (
            <line key={i} className="graph-edge"
              x1={from.x} y1={from.y} x2={end.x} y2={end.y}
              stroke={color} strokeWidth={active ? 1.5 : 0.8}
              strokeDasharray={edge.type === 'uses' ? '4 3' : 'none'}
              opacity={active ? 0.75 : 0.25}
              markerEnd={`url(#arrow-${edge.type === 'uses' ? 'uses' : 'prereq'})`}
              style={{ transition: 'opacity 0.3s, stroke-width 0.3s' }}
            />
          );
        })}

        {/* Nodes */}
        {GRAPH_NODES.map(node => {
          const isHovered = hovered === node.id;
          const isHighlighted = highlightId === node.id;
          const r = isHovered || isHighlighted ? 20 : 16;

          return (
            <g key={node.id} className="graph-node"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => {
                setHovered(node.id);
                setTooltip({ x: node.x, y: node.y, text: node.label, subtext: `${SEM_LABELS[node.semId]} — click to quiz` });
              }}
              onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              onClick={() => onNodeClick(node.id)}>

              {/* Glow ring on hover */}
              {(isHovered || isHighlighted) && (
                <circle cx={node.x} cy={node.y} r={r + 8} fill={node.color} opacity={0.15} />
              )}

              {/* Node circle */}
              <circle cx={node.x} cy={node.y} r={r}
                fill={`${node.color}22`}
                stroke={node.color}
                strokeWidth={isHovered || isHighlighted ? 2 : 1}
                filter={isHovered ? 'url(#node-glow)' : undefined}
                style={{ transition: 'all 0.2s' }}
              />

              {/* Icon */}
              <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={isHovered ? 11 : 9} fill={node.color} fontWeight={700}
                style={{ userSelect: 'none', transition: 'font-size 0.2s' }}>
                {node.icon}
              </text>

              {/* Label below */}
              <text x={node.x} y={node.y + r + 9} textAnchor="middle"
                fontSize={7.5} fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                fontWeight={isHovered ? 700 : 400}
                style={{ transition: 'fill 0.2s', userSelect: 'none' }}>
                {node.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 12 }}>
        {[
          { color: EDGE_COLORS.prerequisite, label: 'Prerequisite', dash: false },
          { color: EDGE_COLORS.uses, label: 'Uses', dash: true },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={24} height={8}>
              <line x1={0} y1={4} x2={24} y2={4} stroke={l.color} strokeWidth={1.5}
                strokeDasharray={l.dash ? '4 3' : 'none'} opacity={0.7} />
            </svg>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, onChipClick }: { msg: ChatMessage; onChipClick?: (value: string) => void }) {
  const isAI = msg.role === 'ai';
  return (
    <div className="animate-message-in" style={{
      display: 'flex', gap: 10, flexDirection: isAI ? 'row' : 'row-reverse',
      maxWidth: '100%',
    }}>
      {isAI && (
        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', marginTop: 2 }}>
          CC
        </div>
      )}
      <div style={{ maxWidth: '80%' }}>
        {msg.type === 'text' && (
          <div style={{
            padding: '10px 14px', borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
            background: isAI ? 'var(--bg-card)' : 'var(--purple)',
            border: isAI ? '1px solid var(--border)' : 'none',
            color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6,
            boxShadow: isAI ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
          }}>
            {msg.content}
          </div>
        )}
        {msg.type === 'chips' && (
          <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{msg.content}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {msg.chips?.map(chip => (
                <button key={chip.value} onClick={() => onChipClick?.(chip.value)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border-hover)', background: 'var(--purple-deep)', color: 'var(--purple-light)', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--purple-dim)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px var(--purple-glow)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--purple-deep)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                  {chip.icon} {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {msg.type === 'subject_grid' && (
          <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', maxWidth: 480 }}>
            <p style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{msg.content}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {msg.subjects?.map(subj => (
                <button key={subj.id} onClick={() => onChipClick?.(subj.id)}
                  style={{ padding: '10px 8px', borderRadius: 12, border: `1px solid ${subj.color}25`, background: `${subj.color}10`, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${subj.color}60`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${subj.color}25`; (e.currentTarget as HTMLElement).style.transform = ''; }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{subj.icon}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: subj.color }}>{subj.shortName}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {msg.type === 'diff_buttons' && (
          <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{msg.content}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'easy', icon: '🟢', label: 'Easy', color: '#16a34a', bg: 'rgba(34,197,94,0.1)' },
                { v: 'intermediate', icon: '🟡', label: 'Mid', color: '#d97706', bg: 'rgba(245,158,11,0.1)' },
                { v: 'hard', icon: '🔴', label: 'Hard', color: '#dc2626', bg: 'rgba(239,68,68,0.1)' },
              ].map(d => (
                <button key={d.v} onClick={() => onChipClick?.(d.v)}
                  style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: `1px solid ${d.color}30`, background: d.bg, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${d.color}70`; (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${d.color}30`; (e.currentTarget as HTMLElement).style.transform = ''; }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{d.icon}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: d.color }}>{d.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {msg.type === 'launch' && (
          <div style={{ padding: '14px 18px', borderRadius: '4px 14px 14px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <p style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{msg.content}</p>
            <button onClick={() => onChipClick?.('launch')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(139,92,246,0.4)', transition: 'transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}>
              ▶ Start Quiz →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mainSubjects } = useQuizData();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<FlowStep>('greeting');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedDiff, setSelectedDiff] = useState<DifficultyChoice | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [graphHighlight, setGraphHighlight] = useState<string | null>(null);
  const [quizStats, setQuizStats] = useState({ total: 0, avgScore: 0, weak: 0 });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);
  const nextId = () => `msg-${++msgIdRef.current}`;

  // ── Load stats ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    api.get(`/history/user/${user.id}`).then(r => {
      const data = r.data || [];
      const total = data.length;
      const avgScore = total ? Math.round(data.reduce((a: number, q: any) => a + (q.score / q.totalQuestions) * 100, 0) / total) : 0;
      setQuizStats({ total, avgScore, weak: user.weak_subjects?.length || 0 });
    }).catch(() => {});
  }, [user]);

  // ── GSAP panel animations ─────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.6, ease: 'power3.out' });
      gsap.from(graphRef.current, { x: 30, opacity: 0, duration: 0.7, delay: 0.3, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  // ── Initialize greeting / AI Summary ──────────────────────────────────────
  useEffect(() => {
    const report = location.state?.quizReport;
    const firstName = user?.name?.split(' ')[0] || 'there';

    setTimeout(() => {
      // If we just returned from a quiz
      if (report) {
        const { subjectName, difficulty, score, total, weakConcepts } = report;
        const pct = score / total;
        let summary = `Welcome back, ${firstName}! I've been reviewing your test results for **${subjectName}** (${difficulty} mode).\n\n`;
        
        if (pct === 1) summary += `🏆 Flawless! Perfect score (${score}/${total}). You've clearly mastered this tier. `;
        else if (pct >= 0.7) summary += `🔥 Great job! You scored ${score}/${total}. Your understanding is solid. `;
        else if (pct >= 0.5) summary += `📈 You scored ${score}/${total}. You're getting there, but a bit more review would help. `;
        else summary += `💪 You scored ${score}/${total}. Don't worry, struggling is part of the learning process! `;
        
        if (weakConcepts && weakConcepts.length > 0) {
          summary += `\n\n📌 **AI Recommendation:** Based on your incorrect answers, I highly recommend reviewing these concepts: *${weakConcepts.join(', ')}*.`;
        }

        addAiMessage({
          content: summary,
          type: 'chips',
          chips: [
            { label: 'Take another Quiz', icon: '📝', value: 'quiz' },
            { label: 'Sem Diagnostic', icon: '🎯', value: 'sem' },
            { label: 'My Progress', icon: '📊', value: 'progress' },
          ],
        });
        
        // Clear state so refresh doesn't duplicate the summary
        window.history.replaceState({}, document.title);
        setStep('choosing_action');
      } else {
        // Standard greeting
        addAiMessage({
          content: `Hey ${firstName}! 👋 I'm your CodeCrafters study companion. What would you like to do today?`,
          type: 'chips',
          chips: [
            { label: 'Quiz me', icon: '📝', value: 'quiz' },
            { label: 'Sem Diagnostic', icon: '🎯', value: 'sem' },
            { label: 'My Progress', icon: '📊', value: 'progress' },
          ],
        });
        setStep('choosing_action');
      }
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Message helpers ───────────────────────────────────────────────────────
  const addAiMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'role'>) => {
    setMessages(prev => [...prev, { ...msg, id: nextId(), role: 'ai' }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, { id: nextId(), role: 'user', type: 'text', content }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chat flow handler ─────────────────────────────────────────────────────
  const handleChip = useCallback((value: string) => {
    if (value === 'launch' && selectedSubject && selectedDiff) {
      navigate('/quiz', { state: { subjectId: selectedSubject.id, difficulty: selectedDiff } });
      return;
    }

    if (step === 'choosing_action') {
      if (value === 'quiz') {
        addUserMessage('📝 Quiz me');
        setStep('choosing_subject');
        const available = mainSubjects.filter(s => s.questions.length > 0);
        setTimeout(() => addAiMessage({
          content: 'Great! Which subject would you like to be quizzed on? (Only subjects with available questions are shown)',
          type: 'subject_grid',
          subjects: available.slice(0, 12),
        }), 350);
      } else if (value === 'sem') {
        addUserMessage('🎯 Sem Diagnostic');
        setTimeout(() => {
          addAiMessage({ content: "Taking you to the Semester Diagnostic — I'll test you on 4 questions per subject so you can find your weak spots!", type: 'text' });
          setTimeout(() => navigate('/sem-check'), 800);
        }, 350);
      } else if (value === 'progress') {
        addUserMessage('📊 My Progress');
        setStep('greeting');
        setTimeout(() => {
          addAiMessage({ content: `Here's your snapshot:\n\n📝 ${quizStats.total} quizzes taken\n📊 ${quizStats.avgScore}% average score\n⚠️ ${quizStats.weak} weak subject${quizStats.weak !== 1 ? 's' : ''} identified.\n\nWant to work on a weak subject or take a fresh quiz?`, type: 'chips', chips: [{ label: 'Quiz me', icon: '📝', value: 'quiz' }, { label: 'View History', icon: '📋', value: 'history' }] });
          setStep('choosing_action');
        }, 350);
      } else if (value === 'history') {
        navigate('/history');
      }
      return;
    }

    if (step === 'choosing_subject') {
      const subj = mainSubjects.find(s => s.id === value);
      if (!subj) return;
      setSelectedSubject(subj);
      setGraphHighlight(value);
      addUserMessage(`${subj.icon} ${subj.shortName}`);
      setStep('choosing_difficulty');
      setTimeout(() => addAiMessage({
        content: `${subj.name} — nice choice! Which difficulty level would you like?`,
        type: 'diff_buttons',
      }), 350);
      return;
    }

    if (step === 'choosing_difficulty') {
      const diffMap: Record<string, DifficultyChoice> = { easy: 'easy', intermediate: 'intermediate', hard: 'hard' };
      const diff = diffMap[value];
      if (!diff) return;
      setSelectedDiff(diff);
      const dfLabels: Record<string, string> = { easy: '🟢 Easy', intermediate: '🟡 Intermediate', hard: '🔴 Hard' };
      addUserMessage(dfLabels[value]);
      setStep('ready');
      setTimeout(() => addAiMessage({
        content: `Perfect! I've prepared your ${selectedSubject?.shortName} quiz at ${dfLabels[value]} level. Ready when you are!`,
        type: 'launch',
      }), 350);
      return;
    }
  }, [step, mainSubjects, selectedSubject, selectedDiff, quizStats, navigate, addAiMessage, addUserMessage]);

  // ── Free-text handler ─────────────────────────────────────────────────────
  const handleSend = () => {
    const txt = inputVal.trim();
    if (!txt) return;
    setInputVal('');
    addUserMessage(txt);

    const lower = txt.toLowerCase();
    setTimeout(() => {
      if (lower.includes('quiz') || lower.includes('test') || lower.includes('question')) {
        setStep('choosing_subject');
        addAiMessage({
          content: 'Sure! Pick a subject to start your quiz:',
          type: 'subject_grid',
          subjects: mainSubjects.filter(s => s.questions.length > 0).slice(0, 12),
        });
      } else if (lower.includes('weak') || lower.includes('progress') || lower.includes('score')) {
        addAiMessage({ content: `You've taken ${quizStats.total} quizzes with an average of ${quizStats.avgScore}%. You have ${quizStats.weak} weak subjects. Want to drill on one?`, type: 'chips', chips: [{ label: 'Quiz me', icon: '📝', value: 'quiz' }, { label: 'View History', icon: '📋', value: 'history' }] });
        setStep('choosing_action');
      } else if (lower.includes('sem') || lower.includes('semester') || lower.includes('diagnostic')) {
        addAiMessage({ content: "I'll take you to the Semester Diagnostic now!", type: 'text' });
        setTimeout(() => navigate('/sem-check'), 700);
      } else if (lower.includes('history')) {
        navigate('/history');
      } else {
        addAiMessage({ content: `I'm best at guiding you through quizzes and diagnostics! Try asking me to "quiz me on Data Structures" or "show my progress" 😊`, type: 'chips', chips: [{ label: 'Quiz me', icon: '📝', value: 'quiz' }, { label: 'Sem Diagnostic', icon: '🎯', value: 'sem' }, { label: 'My Progress', icon: '📊', value: 'progress' }] });
        setStep('choosing_action');
      }
    }, 400);
  };

  // ── Graph node click → start quiz via chat ────────────────────────────────
  const handleGraphClick = useCallback((nodeId: string) => {
    const subj = mainSubjects.find(s => s.id === nodeId);
    if (!subj) return;
    if (subj.questions.length === 0) {
      addAiMessage({ content: `${subj.name} doesn't have questions yet — it's coming soon! 🚧`, type: 'text' });
      return;
    }
    setSelectedSubject(subj);
    setGraphHighlight(nodeId);
    addUserMessage(`${subj.icon} ${subj.shortName} (from graph)`);
    setStep('choosing_difficulty');
    setTimeout(() => addAiMessage({
      content: `${subj.name} — great pick from the graph! Choose a difficulty level:`,
      type: 'diff_buttons',
    }), 350);
  }, [mainSubjects, addAiMessage, addUserMessage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div ref={headerRef} style={{
        height: 56, borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', background: 'var(--bg-surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Study<span style={{ color: 'var(--purple-light)' }}> Workspace</span>
          </span>
          <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: `${quizStats.total} Quizzes`, color: 'var(--purple-light)' },
              { label: `${quizStats.avgScore}% Avg`, color: quizStats.avgScore >= 70 ? '#22c55e' : quizStats.avgScore >= 50 ? '#f59e0b' : '#ef4444' },
              { label: `${quizStats.weak} Gaps`, color: quizStats.weak > 0 ? '#ef4444' : '#22c55e' },
            ].map(stat => (
              <span key={stat.label} style={{ fontSize: '0.8rem', fontWeight: 700, color: stat.color }}>
                {stat.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ to: '/sem-check', label: '🎯 Sem Check' }, { to: '/history', label: '📋 History' }].map(btn => (
            <button key={btn.to} onClick={() => navigate(btn.to)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--purple)'; (e.currentTarget as HTMLElement).style.color = 'var(--purple-light)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Center: LLM Chat ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', minWidth: 0, overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Study Companion · Active</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map(msg => (
              <Bubble key={msg.id} msg={msg} onChipClick={handleChip} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0, background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <input value={inputVal} onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything — quiz on a topic, check progress…"
                style={{ flex: 1, padding: '11px 16px', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              <button onClick={handleSend}
                style={{ width: 42, height: 42, borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 4px 16px rgba(139,92,246,0.4)', transition: 'transform 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                ↑
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 8, textAlign: 'center' }}>
              Click nodes in the graph → to instantly start a quiz · Use chips above for guided flow
            </p>
          </div>
        </div>

        {/* ── Right: Subject Knowledge Graph ───────────────────────────────── */}
        <div ref={graphRef} style={{ width: 480, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden', flexShrink: 0 }}>
          {/* Graph header */}
          <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                🔗 Subject Knowledge Network
              </span>
              {graphHighlight && (
                <button onClick={() => setGraphHighlight(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
                  Clear ×
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(SEM_COLORS).map(([sem, color]) => (
                <span key={sem} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10, border: `1px solid ${color}30`, color, background: `${color}08`, fontWeight: 700 }}>
                  {SEM_LABELS[sem]}
                </span>
              ))}
            </div>
          </div>

          {/* Graph SVG */}
          <div style={{ flex: 1, padding: '8px 4px 8px 4px', overflow: 'hidden' }}>
            <SubjectGraph onNodeClick={handleGraphClick} highlightId={graphHighlight} />
          </div>

          {/* Graph tip */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textAlign: 'center' }}>
              👆 Click any node to start a quiz on that subject
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

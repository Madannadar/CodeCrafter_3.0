import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import api, { pythonApi } from '../services/api';

type MessageRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
}

interface PrerequisiteItem {
  order: number;
  subject: string;
  why: string;
}

interface PrerequisiteData {
  subject: string;
  prerequisites: PrerequisiteItem[];
}

interface QuizQuestion {
  id: string;
  topic: string;
  concept: string;
  difficulty: string;
  type: string;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
}

interface QuizData {
  subject: string;
  level: string;
  prerequisites: PrerequisiteItem[];
  questions: QuizQuestion[];
}

interface QuizResultItem {
  id: string;
  topic: string;
  concept: string;
  type: string;
  difficulty: string;
  question: string;
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
}

interface FailedQuestion {
  id: string;
  topic: string;
  concept: string;
  type: string;
  difficulty: string;
  question: string;
  user_answer: string | null;
  correct_answer: string;
  level: string;
}

interface QuizEvaluationResponse {
  subject: string;
  target_subject: string;
  level: string;
  score: number;
  total: number;
  results: QuizResultItem[];
  passed: boolean;
  next_level: string | null;
  next_subject: string | null;
  next_prereq_index: number | null;
  next_remediation_mode: boolean;
  transition_message: string;
  failed_questions: FailedQuestion[];
  quiz_ended: boolean;
  feedback?: string | null;
}

interface AttemptHistoryItem {
  subjectId: string;
  subjectName: string;
  difficulty: string;
  score: number;
  total: number;
  weakConcepts: string[];
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean }[];
}

interface BackendChatState {
  subject: string | null;
  target_subject: string | null;
  intent: string | null;
  level: string | null;
  step: string;
  prerequisite_data: PrerequisiteData | null;
  quiz_data: QuizData | null;
  failed_questions: FailedQuestion[];
  current_prereq_index: number | null;
  remediation_mode: boolean;
}

const CHAT_MESSAGES_KEY = 'dashboard_python_chat_messages';
const CHAT_STATE_KEY = 'dashboard_python_chat_state';
const QUIZ_RESULT_KEY = 'dashboard_python_quiz_result';
const ATTEMPT_HISTORY_KEY = 'dashboard_python_attempt_history';

const INITIAL_CHAT_STATE: BackendChatState = {
  subject: null,
  target_subject: null,
  intent: null,
  level: null,
  step: 'start',
  prerequisite_data: null,
  quiz_data: null,
  failed_questions: [],
  current_prereq_index: null,
  remediation_mode: false,
};

function readSessionJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function stripMarkdown(text: string) {
  return text.replace(/\*\*/g, '').trim();
}

function getBoldSegments(text: string) {
  return Array.from(text.matchAll(/\*\*(.*?)\*\*/g))
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function summarizeFeedback(feedback: string) {
  const cleaned = stripMarkdown(feedback);
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const boldSegments = getBoldSegments(feedback);
  const uniqueHighlights = Array.from(new Set(boldSegments));
  const mistakeMatch = cleaned.match(/(\d+)\s+out of your\s+(\d+)\s+mistakes/i);
  const difficultyMatch = cleaned.match(
    /(easy and medium|medium and hard|easy and hard|easy|medium|hard)\s+difficulty/i
  );
  const primaryWeakness =
    uniqueHighlights[0] ||
    cleaned.match(/primary weakness in\s+([A-Za-z0-9\s-]+)/i)?.[1]?.trim() ||
    'Needs review';
  const recurringPattern =
    sentences.find((sentence) => /recurring pattern/i.test(sentence)) ||
    sentences.find((sentence) => /suggests gaps/i.test(sentence)) ||
    '';
  const reviseFirst =
    sentences.find((sentence) => /should first revise/i.test(sentence)) ||
    sentences.find((sentence) => /improve most effectively/i.test(sentence)) ||
    '';

  return {
    cleaned,
    primaryWeakness,
    mistakeCount: mistakeMatch ? `${mistakeMatch[1]} / ${mistakeMatch[2]}` : null,
    difficultyPattern: difficultyMatch ? difficultyMatch[1] : null,
    highlights: uniqueHighlights,
    recurringPattern,
    reviseFirst,
  };
}

function Bubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isAssistant ? 'flex-start' : 'flex-end',
      }}
    >
      <div
        style={{
          maxWidth: '82%',
          padding: '12px 14px',
          borderRadius: isAssistant ? '8px 16px 16px 16px' : '16px 8px 16px 16px',
          background: isAssistant ? 'var(--bg-card)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          border: isAssistant ? '1px solid var(--border)' : 'none',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          fontSize: '0.92rem',
          whiteSpace: 'pre-wrap',
          boxShadow: isAssistant ? 'none' : '0 10px 24px rgba(139,92,246,0.25)',
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone = 'default',
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'accent' | 'danger';
}) {
  const tones = {
    default: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
    },
    accent: {
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      border: 'none',
      color: '#fff',
    },
    danger: {
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.35)',
      color: '#fca5a5',
    },
  } as const;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '11px 14px',
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        fontSize: '0.86rem',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxShadow: tone === 'accent' ? '0 10px 24px rgba(139,92,246,0.25)' : 'none',
        ...tones[tone],
      }}
    >
      {label}
    </button>
  );
}

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readSessionJson<ChatMessage[]>(CHAT_MESSAGES_KEY, [])
  );
  const [chatState, setChatState] = useState<BackendChatState>(() =>
    readSessionJson<BackendChatState>(CHAT_STATE_KEY, INITIAL_CHAT_STATE)
  );
  const [quizResult, setQuizResult] = useState<QuizEvaluationResponse | null>(() =>
    readSessionJson<QuizEvaluationResponse | null>(QUIZ_RESULT_KEY, null)
  );
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistoryItem[]>(() =>
    readSessionJson<AttemptHistoryItem[]>(ATTEMPT_HISTORY_KEY, [])
  );
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | undefined>>({});
  const [inputValue, setInputValue] = useState('');
  const [quizStats, setQuizStats] = useState({ total: 0, avgScore: 0, weak: 0 });
  const [isSending, setIsSending] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  const appendMessage = useCallback((role: MessageRole, content: string) => {
    if (!content) return;
    setMessages((prev) => [...prev, { id: makeMessageId(), role, content }]);
  }, []);

  const syncFromResponse = useCallback((data: Partial<BackendChatState> & { response?: string | null }) => {
    setChatState((prev) => ({
      subject: data.subject ?? prev.subject,
      target_subject: data.target_subject ?? prev.target_subject,
      intent: data.intent ?? prev.intent,
      level: data.level ?? prev.level,
      step: data.step ?? prev.step,
      prerequisite_data: data.prerequisite_data ?? prev.prerequisite_data,
      quiz_data: data.quiz_data ?? prev.quiz_data,
      failed_questions: data.failed_questions ?? prev.failed_questions,
      current_prereq_index: data.current_prereq_index ?? prev.current_prereq_index,
      remediation_mode: data.remediation_mode ?? prev.remediation_mode,
    }));

    if (data.quiz_data) {
      setQuizAnswers({});
      setQuizResult(null);
    }
  }, []);

  const sendChatPayload = useCallback(
    async (
      payload: Record<string, unknown>,
      options?: { userLabel?: string; preserveResult?: boolean }
    ) => {
      const userLabel = options?.userLabel;
      if (userLabel) appendMessage('user', userLabel);
      if (!options?.preserveResult) setQuizResult(null);

      setIsSending(true);
      try {
        const { data } = await pythonApi.post('/chat', payload);
        if (data?.response) appendMessage('assistant', data.response);
        syncFromResponse(data);
        if (data?.quiz_data) {
          setHistorySaved(false);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to contact the chatbot backend.';
        appendMessage('assistant', `Backend error: ${message}`);
      } finally {
        setIsSending(false);
      }
    },
    [appendMessage, syncFromResponse]
  );

  const initializeConversation = useCallback(async () => {
    await sendChatPayload(
      {
        message: null,
        subject: null,
        target_subject: null,
        step: 'start',
        intent: null,
        level: null,
        prerequisite_data: null,
        quiz_data: null,
        failed_questions: [],
        current_prereq_index: null,
        remediation_mode: false,
      },
      { preserveResult: true }
    );
  }, [sendChatPayload]);

  useEffect(() => {
    if (!user?.id) return;
    api
      .get(`/history/user/${user.id}`)
      .then((response) => {
        const rows = response.data || [];
        const total = rows.length;
        const avgScore = total
          ? Math.round(
              rows.reduce(
                (sum: number, row: { score: number; totalQuestions: number }) =>
                  sum + (row.score / row.totalQuestions) * 100,
                0
              ) / total
            )
          : 0;
        setQuizStats({ total, avgScore, weak: user.weak_subjects?.length || 0 });
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -18,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      });
      gsap.from(panelRef.current, {
        x: 26,
        opacity: 0,
        duration: 0.7,
        delay: 0.15,
        ease: 'power3.out',
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_STATE_KEY, JSON.stringify(chatState));
  }, [chatState]);

  useEffect(() => {
    sessionStorage.setItem(QUIZ_RESULT_KEY, JSON.stringify(quizResult));
  }, [quizResult]);

  useEffect(() => {
    sessionStorage.setItem(ATTEMPT_HISTORY_KEY, JSON.stringify(attemptHistory));
  }, [attemptHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (messages.length === 0 && chatState.step === 'start' && !isSending) {
      hasInitializedRef.current = true;
      void initializeConversation();
    }
  }, [messages.length, chatState.step, isSending, initializeConversation]);

  const resetConversation = useCallback(() => {
    hasInitializedRef.current = false;
    sessionStorage.removeItem(CHAT_MESSAGES_KEY);
    sessionStorage.removeItem(CHAT_STATE_KEY);
    sessionStorage.removeItem(QUIZ_RESULT_KEY);
    sessionStorage.removeItem(ATTEMPT_HISTORY_KEY);
    setMessages([]);
    setChatState(INITIAL_CHAT_STATE);
    setQuizResult(null);
    setAttemptHistory([]);
    setQuizAnswers({});
    setInputValue('');
    setHistorySaved(false);
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;

    setInputValue('');
    await sendChatPayload(
      {
        message: text,
        subject: chatState.subject,
        target_subject: chatState.target_subject,
        step: chatState.step,
        intent: chatState.intent,
        level: chatState.level,
        prerequisite_data: chatState.prerequisite_data,
        quiz_data: chatState.quiz_data,
        failed_questions: chatState.failed_questions,
        current_prereq_index: chatState.current_prereq_index,
        remediation_mode: chatState.remediation_mode,
      },
      { userLabel: text }
    );
  }, [chatState, inputValue, isSending, sendChatPayload]);

  const handleIntentClick = useCallback(
    async (intentLabel: 'prerequisite' | 'test') => {
      if (isSending) return;
      if (intentLabel === 'test') {
        setAttemptHistory([]);
        setHistorySaved(false);
      }
      await sendChatPayload(
        {
          message: intentLabel,
          subject: chatState.subject,
          target_subject: chatState.target_subject,
          step: chatState.step,
          intent: chatState.intent,
          level: chatState.level,
          prerequisite_data: chatState.prerequisite_data,
          quiz_data: null,
          failed_questions: chatState.failed_questions,
          current_prereq_index: chatState.current_prereq_index,
          remediation_mode: chatState.remediation_mode,
        },
        { userLabel: intentLabel }
      );
    },
    [chatState, isSending, sendChatPayload]
  );

  const handleLevelClick = useCallback(
    async (level: 'easy' | 'medium' | 'hard') => {
      if (isSending) return;
      await sendChatPayload(
        {
          message: level,
          subject: chatState.subject,
          target_subject: chatState.target_subject,
          step: chatState.step,
          intent: chatState.intent,
          level: chatState.level,
          prerequisite_data: chatState.prerequisite_data,
          quiz_data: null,
          failed_questions: chatState.failed_questions,
          current_prereq_index: chatState.current_prereq_index,
          remediation_mode: chatState.remediation_mode,
        },
        { userLabel: level[0].toUpperCase() + level.slice(1) }
      );
    },
    [chatState, isSending, sendChatPayload]
  );

  const startTestForSubject = useCallback(
    async (clickedSubject: string) => {
      if (isSending) return;

      setQuizAnswers({});
      setQuizResult(null);
      setAttemptHistory([]);
      setHistorySaved(false);

      await sendChatPayload(
        {
          message: 'test',
          subject: clickedSubject,
          target_subject: clickedSubject,
          step: 'awaiting_intent',
          intent: null,
          level: null,
          prerequisite_data: null,
          quiz_data: null,
          failed_questions: [],
          current_prereq_index: null,
          remediation_mode: false,
        },
        { userLabel: `Selected from flowchart: ${clickedSubject}` }
      );
    },
    [isSending, sendChatPayload]
  );

  const handleAnswerSelect = useCallback((questionId: string, value: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const evaluateQuiz = useCallback(async () => {
    if (!chatState.quiz_data || isEvaluating) return;

    const answers = Object.fromEntries(
      chatState.quiz_data.questions.map((question) => [question.id, quizAnswers[question.id] ?? null])
    );

    setIsEvaluating(true);
    try {
      const { data } = await pythonApi.post<QuizEvaluationResponse>('/evaluate-quiz', {
        quiz_data: chatState.quiz_data,
        answers,
        failed_questions: chatState.failed_questions,
        prerequisite_data: chatState.prerequisite_data,
        target_subject: chatState.target_subject,
        current_prereq_index: chatState.current_prereq_index,
        remediation_mode: chatState.remediation_mode,
      });

      setQuizResult(data);
      setAttemptHistory((prev) => {
        const currentAttempt: AttemptHistoryItem = {
          subjectId: chatState.quiz_data?.subject || chatState.subject || 'unknown-subject',
          subjectName: chatState.quiz_data?.subject || chatState.subject || 'Unknown Subject',
          difficulty: String(chatState.quiz_data?.level || chatState.level || 'easy').toLowerCase(),
          score: data.score,
          total: data.total,
          weakConcepts: data.results
            .filter((item) => !item.is_correct)
            .map((item) => item.concept)
            .filter((concept, index, array) => !!concept && array.indexOf(concept) === index),
          answers: data.results.map((item) => ({
            questionId: item.id,
            selectedAnswer: item.user_answer || '',
            isCorrect: item.is_correct,
          })),
        };

        const duplicate = prev.some(
          (item) =>
            item.subjectName === currentAttempt.subjectName &&
            item.difficulty === currentAttempt.difficulty &&
            item.score === currentAttempt.score &&
            item.total === currentAttempt.total
        );

        return duplicate ? prev : [...prev, currentAttempt];
      });
      setChatState((prev) => ({
        ...prev,
        failed_questions: data.failed_questions || prev.failed_questions,
      }));

      if (data.transition_message) {
        appendMessage('assistant', data.transition_message);
      }
      if (data.quiz_ended && data.feedback) {
        appendMessage('assistant', 'Feedback is ready in the assessment panel.');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Quiz evaluation failed on the backend.';
      appendMessage('assistant', `Evaluation error: ${message}`);
    } finally {
      setIsEvaluating(false);
    }
  }, [appendMessage, chatState, isEvaluating, quizAnswers]);

  const continueAdaptiveFlow = useCallback(async () => {
    if (!quizResult?.next_level || isSending) return;

    await sendChatPayload(
      {
        message: null,
        subject: quizResult.next_subject ?? chatState.subject,
        target_subject: chatState.target_subject,
        step: 'level_selected',
        intent: 'test',
        level: quizResult.next_level,
        prerequisite_data: chatState.prerequisite_data,
        quiz_data: null,
        failed_questions: quizResult.failed_questions ?? chatState.failed_questions,
        current_prereq_index:
          quizResult.next_prereq_index ?? chatState.current_prereq_index,
        remediation_mode:
          quizResult.next_remediation_mode ?? chatState.remediation_mode,
      },
      { preserveResult: false }
    );
  }, [chatState, isSending, quizResult, sendChatPayload]);

  useEffect(() => {
    if (!quizResult?.quiz_ended || !user?.id || historySaved || attemptHistory.length === 0) {
      return;
    }

    const mainAttempt = attemptHistory[0];
    const mappedChain = attemptHistory.map((attempt) => ({
      subjectId: attempt.subjectId,
      subjectName: attempt.subjectName,
      difficulty: attempt.difficulty,
      score: attempt.score,
      total: attempt.total,
      weakConcepts: attempt.weakConcepts,
    }));

    void api
      .post('/history', {
        userId: user.id,
        subjectId: mainAttempt.subjectId,
        subjectName: mainAttempt.subjectName,
        score: mainAttempt.score,
        totalQuestions: mainAttempt.total,
        answers: mainAttempt.answers,
        difficulty: mainAttempt.difficulty,
        attemptChain: mappedChain,
      })
      .then(() => {
        setHistorySaved(true);
        setQuizStats((prev) => {
          const nextTotal = prev.total + 1;
          const latestPct = mainAttempt.total ? (mainAttempt.score / mainAttempt.total) * 100 : 0;
          const avgScore =
            prev.total === 0
              ? Math.round(latestPct)
              : Math.round((prev.avgScore * prev.total + latestPct) / nextTotal);
          return { ...prev, total: nextTotal, avgScore };
        });

        const passed = mainAttempt.total > 0 && mainAttempt.score / mainAttempt.total >= 0.7;
        const currentWeak = user.weak_subjects || [];
        const nextWeak = passed
          ? currentWeak.filter((subjectId) => subjectId !== mainAttempt.subjectId)
          : Array.from(new Set([...currentWeak, mainAttempt.subjectId]));
        updateUser({ ...user, weak_subjects: nextWeak });
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unable to save quiz history.';
        appendMessage('assistant', `History save error: ${message}`);
      });
  }, [appendMessage, attemptHistory, historySaved, quizResult, updateUser, user]);

  const prerequisiteChain = useMemo(() => {
    const chain: string[] = [];
    const prerequisites = chatState.prerequisite_data?.prerequisites || [];

    for (const item of prerequisites) {
      if (item.subject) chain.push(item.subject);
    }

    if (chatState.prerequisite_data?.subject) {
      chain.push(chatState.prerequisite_data.subject);
    }

    return chain;
  }, [chatState.prerequisite_data]);

  const showIntentActions =
    !!chatState.subject &&
    chatState.step === 'awaiting_intent' &&
    !chatState.quiz_data;

  const showDifficultyActions =
    chatState.intent === 'test' &&
    chatState.step === 'choose_level' &&
    !chatState.quiz_data;

  const showFlowchart =
    chatState.intent === 'flowchart' &&
    !chatState.quiz_data &&
    prerequisiteChain.length > 0;

  const quizData = chatState.quiz_data;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      <div
        ref={headerRef}
        style={{
          height: 56,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: '1rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            Study<span style={{ color: 'var(--purple-light)' }}> Workspace</span>
          </span>
          <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: `${quizStats.total} Quizzes`, color: 'var(--purple-light)' },
              {
                label: `${quizStats.avgScore}% Avg`,
                color:
                  quizStats.avgScore >= 70
                    ? '#22c55e'
                    : quizStats.avgScore >= 50
                    ? '#f59e0b'
                    : '#ef4444',
              },
              {
                label: `${quizStats.weak} Gaps`,
                color: quizStats.weak > 0 ? '#ef4444' : '#22c55e',
              },
            ].map((stat) => (
              <span
                key={stat.label}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: stat.color }}
              >
                {stat.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <ActionButton label="History" onClick={() => navigate('/history')} />
          <ActionButton label="Sem Check" onClick={() => navigate('/sem-check')} />
          <ActionButton label="Clear Chat" onClick={resetConversation} tone="danger" />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-subtle)',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 24px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                }}
              />
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                Study Companion · Python backend connected
              </span>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {messages.map((message) => (
              <Bubble key={message.id} message={message} />
            ))}
            {isSending && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Assistant is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              flexShrink: 0,
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Type a subject, or reply with prerequisite / test / easy / medium / hard"
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: 12,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => void handleSend()}
                disabled={isSending}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
                  opacity: isSending ? 0.7 : 1,
                }}
              >
                ↑
              </button>
            </div>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-faint)',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              The right panel mirrors the Streamlit prerequisite flow, difficulty selector, quiz,
              and backend scorecard.
            </p>
          </div>
        </div>

        <div
          ref={panelRef}
          style={{
            width: 520,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-base)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '14px 20px 10px',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                Dynamic Learning Panel
              </span>
              {chatState.subject && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Current subject: {chatState.subject}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                chatState.target_subject ? `Target: ${chatState.target_subject}` : null,
                chatState.level ? `Level: ${chatState.level}` : null,
                chatState.remediation_mode ? 'Remediation mode' : null,
                quizResult ? `Score: ${quizResult.score}/${quizResult.total}` : null,
              ]
                .filter(Boolean)
                .map((chip) => (
                  <span
                    key={chip}
                    style={{
                      fontSize: '0.67rem',
                      padding: '3px 9px',
                      borderRadius: 999,
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    {chip}
                  </span>
                ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {!chatState.subject && !quizData && (
              <div
                style={{
                  borderRadius: 18,
                  border: '1px solid var(--border)',
                  background:
                    'radial-gradient(circle at top left, rgba(139,92,246,0.16), transparent 45%), var(--bg-card)',
                  padding: 24,
                }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Learn any subject with structured prerequisites or tests
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 10 }}>
                  Start by typing a subject in chat. The backend will normalize spelling, generate a
                  subject-level prerequisite chain, and drive the full adaptive quiz flow from here.
                </p>
              </div>
            )}

            {showIntentActions && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {chatState.subject}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
                    Choose whether you want to inspect the prerequisite chain first or jump directly
                    into the adaptive test flow.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <ActionButton
                    label="Show Prerequisites"
                    onClick={() => void handleIntentClick('prerequisite')}
                    disabled={isSending}
                  />
                  <ActionButton
                    label="Start Test"
                    onClick={() => void handleIntentClick('test')}
                    disabled={isSending}
                    tone="accent"
                  />
                </div>
              </div>
            )}

            {showDifficultyActions && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Difficulty selection
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
                    Pick the level for {chatState.subject}. The backend will generate the quiz and
                    handle all later promotion, fallback, remediation, and feedback logic.
                  </p>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <ActionButton label="Easy" onClick={() => void handleLevelClick('easy')} disabled={isSending} />
                  <ActionButton label="Medium" onClick={() => void handleLevelClick('medium')} disabled={isSending} />
                  <ActionButton label="Hard" onClick={() => void handleLevelClick('hard')} disabled={isSending} />
                </div>
              </div>
            )}

            {showFlowchart && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Prerequisite Flow
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
                    Click any subject in the chain to start the test path for that subject. The rest
                    of the adaptive process will continue from there.
                  </p>
                </div>

                {prerequisiteChain.map((subjectName, index) => {
                  const why =
                    chatState.prerequisite_data?.prerequisites.find(
                      (item) => item.subject === subjectName
                    )?.why ?? 'Target subject in the current prerequisite path';

                  return (
                    <div key={`${subjectName}-${index}`} style={{ display: 'grid', gap: 10 }}>
                      <div
                        style={{
                          borderRadius: 16,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-card)',
                          padding: 18,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                              }}
                            >
                              Step {index + 1}
                            </div>
                            <div
                              style={{
                                fontSize: '1rem',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                marginTop: 4,
                              }}
                            >
                              {subjectName}
                            </div>
                          </div>
                          <ActionButton
                            label={`Test ${subjectName}`}
                            onClick={() => void startTestForSubject(subjectName)}
                            disabled={isSending}
                            tone="accent"
                          />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 10 }}>
                          {why}
                        </p>
                      </div>
                      {index < prerequisiteChain.length - 1 && (
                        <div
                          style={{
                            textAlign: 'center',
                            color: 'var(--text-faint)',
                            fontSize: '1.35rem',
                          }}
                        >
                          ↓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {quizData && (
              <div style={{ display: 'grid', gap: 16 }}>
                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    MCQ Panel
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
                    Subject: {quizData.subject}
                    <br />
                    Level: {quizData.level}
                  </p>
                </div>

                {quizData.questions.map((question, index) => (
                  <div
                    key={question.id}
                    style={{
                      borderRadius: 18,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      padding: 18,
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>
                      Q{index + 1} · {question.topic} · {question.type}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        lineHeight: 1.55,
                      }}
                    >
                      {question.question}
                    </div>

                    <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                      {Object.entries(question.options).map(([key, value]) => {
                        const checked = quizAnswers[question.id] === key;
                        return (
                          <label
                            key={key}
                            style={{
                              display: 'flex',
                              gap: 10,
                              alignItems: 'flex-start',
                              borderRadius: 12,
                              border: checked
                                ? '1px solid rgba(139,92,246,0.55)'
                                : '1px solid var(--border)',
                              background: checked
                                ? 'rgba(139,92,246,0.09)'
                                : 'rgba(255,255,255,0.01)',
                              padding: '10px 12px',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={key}
                              checked={checked}
                              onChange={() => handleAnswerSelect(question.id, key)}
                              style={{ marginTop: 3 }}
                            />
                            <span style={{ color: 'var(--text-primary)', lineHeight: 1.55 }}>
                              <strong>{key}.</strong> {value}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <ActionButton
                  label={isEvaluating ? 'Evaluating...' : 'Submit Quiz'}
                  onClick={() => void evaluateQuiz()}
                  disabled={isEvaluating}
                  tone="accent"
                />
              </div>
            )}

            {quizResult && (
              <div style={{ display: 'grid', gap: 16, marginTop: quizData ? 20 : 0 }}>
                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: quizResult.passed
                      ? 'rgba(34,197,94,0.08)'
                      : 'rgba(239,68,68,0.08)',
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Scorecard
                  </div>
                  <div style={{ marginTop: 10, fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {quizResult.score} / {quizResult.total}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
                    {quizResult.transition_message}
                  </p>
                </div>

                {quizResult.results.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 16,
                      border: item.is_correct
                        ? '1px solid rgba(34,197,94,0.32)'
                        : '1px solid rgba(239,68,68,0.32)',
                      background: item.is_correct
                        ? 'rgba(34,197,94,0.05)'
                        : 'rgba(239,68,68,0.05)',
                      padding: 16,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.id}</div>
                    <div style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {item.question}
                    </div>
                    <div style={{ marginTop: 10, color: item.is_correct ? '#4ade80' : '#f87171' }}>
                      Your answer: {item.user_answer ?? 'Not answered'}
                    </div>
                    {!item.is_correct && (
                      <div style={{ marginTop: 6, color: '#fca5a5' }}>
                        Correct answer: {item.correct_answer}
                      </div>
                    )}
                  </div>
                ))}

                {quizResult.quiz_ended && quizResult.feedback && (() => {
                  const feedbackSummary = summarizeFeedback(quizResult.feedback);

                  return (
                    <div
                      style={{
                        borderRadius: 18,
                        border: '1px solid rgba(245,158,11,0.35)',
                        background: 'rgba(245,158,11,0.08)',
                        padding: 20,
                        display: 'grid',
                        gap: 16,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Weak Areas Feedback
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 8 }}>
                          Visual summary of the Gemini feedback, built from the full incorrect-answer history.
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.04)', padding: 14 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Primary Weakness
                          </div>
                          <div style={{ marginTop: 6, color: 'var(--text-primary)', fontWeight: 800 }}>
                            {feedbackSummary.primaryWeakness}
                          </div>
                        </div>
                        <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.04)', padding: 14 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Mistake Load
                          </div>
                          <div style={{ marginTop: 6, color: 'var(--text-primary)', fontWeight: 800 }}>
                            {feedbackSummary.mistakeCount || 'Not specified'}
                          </div>
                        </div>
                        <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.04)', padding: 14 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Pattern Level
                          </div>
                          <div style={{ marginTop: 6, color: 'var(--text-primary)', fontWeight: 800 }}>
                            {feedbackSummary.difficultyPattern || 'Mixed'}
                          </div>
                        </div>
                      </div>

                      {feedbackSummary.highlights.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Focus Concepts
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                            {feedbackSummary.highlights.map((highlight) => (
                              <span
                                key={highlight}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 999,
                                  background: 'rgba(139,92,246,0.14)',
                                  border: '1px solid rgba(139,92,246,0.28)',
                                  color: '#ddd6fe',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                }}
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gap: 12 }}>
                        {feedbackSummary.recurringPattern && (
                          <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.04)', padding: 14 }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Recurring Pattern
                            </div>
                            <div style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                              {feedbackSummary.recurringPattern}
                            </div>
                          </div>
                        )}

                        {feedbackSummary.reviseFirst && (
                          <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.04)', padding: 14 }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Revise First
                            </div>
                            <div style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                              {feedbackSummary.reviseFirst}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ borderRadius: 14, background: 'rgba(0,0,0,0.14)', padding: 14 }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Full Feedback
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 8 }}>
                          {feedbackSummary.cleaned}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {!quizResult.quiz_ended && quizResult.next_level && (
                  <ActionButton
                    label={`Continue To ${quizResult.next_level[0].toUpperCase()}${quizResult.next_level.slice(1)}`}
                    onClick={() => void continueAdaptiveFlow()}
                    disabled={isSending}
                    tone="accent"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

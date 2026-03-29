import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import gsap from 'gsap';

// ─── Floating particle ────────────────────────────────────────────────────────
function Particle({ style, className }: { style: React.CSSProperties; className?: string }) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(109,94,252,0.28), transparent 72%)',
      filter: 'blur(1px)', pointerEvents: 'none', ...style,
    }} className={className} />
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Refs for GSAP targets
  const leftRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement | HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // ── GSAP entrance ───────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Left panel elements stagger in
      tl.from(leftRef.current, { x: -40, opacity: 0, duration: 0.8 }, 0)
        .from('.login-brand', { y: 20, opacity: 0, duration: 0.6, stagger: 0.12 }, 0.3)
        .from('.login-feature', { x: -20, opacity: 0, duration: 0.5, stagger: 0.1 }, 0.6);

      // Card slides in from right
      tl.from(cardRef.current, { x: 40, opacity: 0, duration: 0.7 }, 0.1);

      // Form fields animate in
      tl.from('.form-field', { y: 10, opacity: 0, duration: 0.4, stagger: 0.08 }, 0.5);

      // Particles float
      if (particlesRef.current) {
        const particles = particlesRef.current.querySelectorAll('.particle');
        gsap.to(particles, {
          y: -30, x: 'random(-20, 20)', duration: 'random(3, 6)',
          repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.4, from: 'random' },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // ── Re-animate form on view swap ─────────────────────────────────────────
  useEffect(() => {
    gsap.fromTo('.form-field', 
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, stagger: 0.07, ease: 'power2.out' }
    );
  }, [isLoginView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLoginView) {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.user, res.data.token);
      } else {
        const res = await api.post('/auth/register', { name, email, password });
        login(res.data.user, res.data.token);
      }
      // Slide out animation before navigate
      gsap.to(cardRef.current, { x: 40, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => { navigate('/dashboard'); } });
    } catch (err: any) {
      gsap.from(cardRef.current, { x: -4, duration: 0.15, repeat: 3, yoyo: true, ease: 'power1.inOut' });
      setError(err.response?.data?.msg || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true); setError('');
      const res = await api.post('/auth/google', { token: credentialResponse.credential });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Google Authentication failed');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(109,94,252,0.16)',
    borderRadius: 14, color: 'var(--text-primary)',
    fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 10px 24px rgba(148,163,184,0.08)',
  };

  const labelStyle = {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6, display: 'block',
  };

  const features = [
    { icon: '🧠', text: 'Identify your exact knowledge gaps' },
    { icon: '🗺️', text: 'Get a personalized learning roadmap' },
    { icon: '⚡', text: 'Adaptive quizzes that follow your level' },
    { icon: '📊', text: 'Visualize subject relationships' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'transparent',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* ── Background aurora ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,94,252,0.14) 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', top: '50%', left: '35%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite 2s' }} />
      </div>

      {/* ── Floating particles ────────────────────────────────────────────── */}
      <div ref={particlesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(15)].map((_, i) => (
          <Particle key={i} className="particle" style={{
            width: Math.random() * 6 + 2, height: Math.random() * 6 + 2,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
          }} />
        ))}
      </div>

      {/* ── Left Panel — Branding ─────────────────────────────────────────── */}
      <div ref={leftRef} style={{
        width: '45%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', background: 'linear-gradient(180deg, rgba(255,255,255,0.7), rgba(238,243,255,0.58))',
        borderRight: '1px solid var(--border-subtle)',
        position: 'relative',
      }}>
        {/* Logo mark */}
        <div className="login-brand" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--purple), #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 20,
            boxShadow: '0 20px 36px rgba(109,94,252,0.24)',
          }}><div style={{ fontSize: '1.2rem',  fontWeight: 700 }}>{'<>'}</div></div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Code<span style={{ color: 'var(--purple-light)' }}>Crafters</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Learning Gap Analyzer</div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="login-brand" style={{
          fontSize: '2.6rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1.2px',
          color: 'var(--text-primary)', marginBottom: 16,
        }}>
          Find exactly what<br />
          <span style={{
            background: 'linear-gradient(135deg, #8f84ff 0%, #6d5efc 60%, #4f46e5 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>you don't know.</span>
        </h1>

        <p className="login-brand" style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 44, maxWidth: 360 }}>
          Your AI-powered study companion that maps your knowledge gaps and builds a personalized path to mastery.
        </p>

        {/* Features list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {features.map((f, i) => (
            <div key={i} className="login-feature" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid var(--border)',
                boxShadow: '0 12px 24px rgba(148,163,184,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              }}>{f.icon}</div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <div style={{ marginTop: 56, padding: '16px 20px', borderRadius: 18, background: 'rgba(255,255,255,0.76)', border: '1px solid var(--border)', boxShadow: '0 18px 36px rgba(148,163,184,0.12)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', lineHeight: 1.6 }}>
            "The first step to mastery is knowing where you're lost."
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px',
      }}>
        <div ref={cardRef} style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.84)',
          border: '1px solid var(--border)',
          borderRadius: 28, padding: '40px 36px',
          boxShadow: '0 32px 70px rgba(148,163,184,0.22), 0 0 0 1px rgba(109,94,252,0.06)',
          backdropFilter: 'blur(22px)',
        }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(109,94,252,0.08)', color: 'var(--purple-dark)', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 14 }}>
              {isLoginView ? 'SIGN IN' : 'REGISTER'}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.4px' }}>
              {isLoginView ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {isLoginView ? 'Sign in to continue your learning journey.' : 'Start identifying your knowledge gaps today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLoginView && (
              <div className="form-field">
                <label style={labelStyle}>Full Name</label>
                <input type="text" required style={inputStyle} placeholder="John Doe"
                  value={name} onChange={e => setName(e.target.value)}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-glow)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(109,94,252,0.16)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(148,163,184,0.08)'; }} />
              </div>
            )}

            <div className="form-field">
              <label style={labelStyle}>Email Address</label>
              <input type="email" required style={inputStyle} placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-glow)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(109,94,252,0.16)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(148,163,184,0.08)'; }} />
            </div>

            <div className="form-field">
              <label style={labelStyle}>Password</label>
              <input type="password" required style={inputStyle} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-glow)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(109,94,252,0.16)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(148,163,184,0.08)'; }} />
            </div>

            {error && (
              <div className="form-field" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 14, padding: '10px 14px', color: '#b91c1c', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="form-field"
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: loading ? '#5948ef' : 'linear-gradient(135deg, var(--purple), #4f46e5)',
                color: 'white', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', marginTop: 4,
                boxShadow: loading ? 'none' : '0 18px 34px rgba(109,94,252,0.28)',
              }}
              onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.boxShadow = '0 22px 38px rgba(109,94,252,0.34)')}
              onMouseLeave={e => !loading && ((e.currentTarget as HTMLElement).style.boxShadow = '0 18px 34px rgba(109,94,252,0.28)')}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Processing…
                </span>
              ) : isLoginView ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 20 }}>
            {isLoginView ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--purple-light)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
              {isLoginView ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ color: 'var(--text-faint)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={(credentialResponse) => { void handleGoogleSuccess(credentialResponse); }} onError={() => setError('Google Login Failed')} theme="outline" shape="pill" />
          </div>
        </div>
      </div>
    </div>
  );
}

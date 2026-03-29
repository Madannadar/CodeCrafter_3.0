import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import gsap from 'gsap';

// ─── Floating particle ────────────────────────────────────────────────────────
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(139,92,246,0.6), transparent)',
      filter: 'blur(1px)', pointerEvents: 'none', ...style,
    }} />
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
      gsap.to(cardRef.current, { x: 40, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => navigate('/dashboard') });
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
    background: 'rgba(8,8,20,0.7)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: 12, color: 'var(--text-primary)',
    fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
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
      background: 'var(--bg-base)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* ── Background aurora ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.1) 0%, transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', top: '50%', left: '35%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite 2s' }} />
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
        padding: '60px 56px', background: 'rgba(10,10,24,0.5)',
        borderRight: '1px solid var(--border)',
        position: 'relative',
      }}>
        {/* Logo mark */}
        <div className="login-brand" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #8b5cf6, #4c1d95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 20,
            boxShadow: '0 0 32px rgba(139,92,246,0.5)',
          }}>CC</div>
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
            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 60%, #7c3aed 100%)',
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
                background: 'var(--purple-dim)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              }}>{f.icon}</div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <div style={{ marginTop: 56, padding: '16px 20px', borderRadius: 14, background: 'var(--purple-deep)', border: '1px solid var(--border)' }}>
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
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.08)',
        }}>

          <div style={{ marginBottom: 32 }}>
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
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.boxShadow = 'none'; }} />
              </div>
            )}

            <div className="form-field">
              <label style={labelStyle}>Email Address</label>
              <input type="email" required style={inputStyle} placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-glow)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>

            <div className="form-field">
              <label style={labelStyle}>Password</label>
              <input type="password" required style={inputStyle} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--purple-glow)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>

            {error && (
              <div className="form-field" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="form-field"
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: loading ? '#3d2585' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', marginTop: 4,
                boxShadow: loading ? 'none' : '0 4px 24px rgba(139,92,246,0.4)',
              }}
              onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(139,92,246,0.6)')}
              onMouseLeave={e => !loading && ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(139,92,246,0.4)')}>
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
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Login Failed')} theme="filled_black" shape="pill" />
          </div>
        </div>
      </div>
    </div>
  );
}

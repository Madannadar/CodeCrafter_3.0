import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginView) {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      } else {
        const res = await api.post('/auth/register', { name, email, password });
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/google', { token: credentialResponse.credential });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Google Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-surface to-accent/8 animate-gradient" />
      <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-[15%] right-[10%] w-96 h-96 bg-accent/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />

      <div className="relative z-10 animate-slide-up">
        <div className="glass-strong rounded-3xl p-10 w-[440px] max-w-[90vw] shadow-2xl shadow-primary/10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center text-2xl font-bold animate-pulse-glow">
              C
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">
              Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light">Crafters</span>
            </h1>
            <p className="text-text-secondary text-sm">
              {isLoginView ? 'Welcome back! Sign in to continue.' : 'Create an account to uncover your learning gaps.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-border-light text-text-primary focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted/50"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-border-light text-text-primary focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted/50"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-border-light text-text-primary focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-error text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLoginView ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLoginView(!isLoginView); setError(''); }} 
              className="text-primary-light hover:underline font-medium cursor-pointer"
            >
              {isLoginView ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-light"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-glass text-text-muted">Or continue with</span>
              </div>
            </div>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="filled_black"
              shape="pill"
            />
          </div>

        </div>
      </div>
    </div>
  );
}

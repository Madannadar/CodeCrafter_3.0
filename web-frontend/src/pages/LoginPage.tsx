import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    login();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-surface to-accent/8 animate-gradient" />

      {/* Floating orbs */}
      <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-[15%] right-[10%] w-96 h-96 bg-accent/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-[50%] left-[60%] w-48 h-48 bg-primary-light/6 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-1.5s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Login Card */}
      <div className="relative z-10 animate-slide-up">
        <div className="glass-strong rounded-3xl p-10 w-[440px] max-w-[90vw] shadow-2xl shadow-primary/10">
          {/* Logo & Branding */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center text-3xl font-bold animate-pulse-glow">
              C
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent-light">Crafters</span>
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed max-w-[300px] mx-auto">
              Uncover your learning gaps with intelligent prerequisite analysis and targeted interventions
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-xs text-text-muted uppercase tracking-widest">Continue with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Google Sign-In Button */}
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-text-primary font-medium
                       hover:bg-white/[0.08] hover:border-primary/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]
                       active:scale-[0.98] transition-all duration-300 group cursor-pointer"
          >
            {/* Google icon */}
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Features list */}
          <div className="mt-10 space-y-3">
            {[
              { icon: '🔍', text: 'Diagnose root learning gaps' },
              { icon: '🗺️', text: 'Visualize concept prerequisites' },
              { icon: '📈', text: 'Track your progress over time' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-text-secondary opacity-0 animate-slide-up" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
                <span className="text-base">{feature.icon}</span>
                {feature.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-text-muted mt-6 opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
          Built with ❤️ by CodeCrafters Team
        </p>
      </div>
    </div>
  );
}

import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const navItems = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard', emoji: '⬡' },
  { to: '/quiz', icon: '◈', label: 'Quiz' },
  { to: '/sem-check', icon: '◎', label: 'Sem Check' },
  { to: '/history', icon: '◷', label: 'History' },
];

const S = {
  sidebar: {
    width: 220,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(238,243,255,0.96))',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    padding: '20px 12px',
    position: 'fixed' as const,
    top: 0, left: 0, bottom: 0,
    zIndex: 50,
    boxShadow: '18px 0 40px rgba(148, 163, 184, 0.12)',
    backdropFilter: 'blur(16px)',
  },
  main: {
    marginLeft: 220,
    minHeight: '100vh',
    background: 'transparent',
    flex: 1,
  },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Sidebar entrance
  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.fromTo(sidebarRef.current, 
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );
  }, []);

  // Page transition on route change
  useEffect(() => {
    if (!mainRef.current) return;
    gsap.fromTo(mainRef.current, 
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }, [location.pathname]);

  const isDashboard = location.pathname === '/dashboard';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside ref={sidebarRef} style={S.sidebar}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--purple), #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 16, flexShrink: 0,
            boxShadow: '0 14px 26px rgba(109,94,252,0.28)',
          }}><div style={{ fontSize: '1.2rem',  fontWeight: 700 }}>{'<>'}</div></div>
          
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Code<span style={{ color: 'var(--purple)' }}>Crafters</span>
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: 1 }}>Learning Gap Analyzer</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s',
                background: isActive ? 'rgba(109, 94, 252, 0.12)' : 'transparent',
                color: isActive ? 'var(--purple-dark)' : 'var(--text-secondary)',
                borderLeft: isActive ? '2px solid var(--purple)' : '2px solid transparent',
                boxShadow: isActive ? '0 12px 24px rgba(109,94,252,0.08)' : 'none',
              })}>
              <span style={{ fontSize: '0.82rem', letterSpacing: '0.05em', opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 0' }} />

        {/* User section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.88)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 24px rgba(148, 163, 184, 0.12)' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--purple), #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
              boxShadow: '0 0 12px var(--purple-glow)',
            }}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Student'}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem', borderRadius: 8, width: '100%', marginTop: 4, transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            ↩ Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main ref={mainRef} style={{ ...S.main, padding: isDashboard ? 0 : '32px 40px' }}>
        <Outlet />
      </main>
    </div>
  );
}

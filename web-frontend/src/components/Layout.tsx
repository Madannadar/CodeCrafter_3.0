import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/quiz', icon: '📝', label: 'Quiz' },
  { to: '/graph', icon: '🔗', label: 'Concept Graph' },
  { to: '/history', icon: '📋', label: 'History' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fc' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, background: 'white', borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column', padding: '24px 16px',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
        boxShadow: '2px 0 12px rgba(0,0,0,0.03)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px', marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 18,
          }}>C</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1f2937' }}>
              Code<span style={{ color: '#8b5cf6' }}>Crafters</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Learning Gap Analyzer</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12, textDecoration: 'none',
                fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s',
                background: isActive ? '#f3e8ff' : 'transparent',
                color: isActive ? '#7c3aed' : '#6b7280',
                border: isActive ? '1px solid #e9d5ff' : '1px solid transparent',
              })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.85rem',
            }}>{user?.name?.charAt(0) || 'U'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', borderRadius: 8, width: '100%', marginTop: 4 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 260, padding: '32px 40px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}

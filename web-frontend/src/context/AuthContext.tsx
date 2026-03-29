import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  weak_subjects: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: UserProfile, token: string) => void;
  logout: () => void;
  updateUser: (userData: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
      // Optional: Verify token with backend
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData: UserProfile, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: UserProfile) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, updateUser }}>
      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100vw', background: '#08080f',
          flexDirection: 'column', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, border: '3px solid rgba(139,92,246,0.2)',
            borderTop: '3px solid #8b5cf6', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: 'rgba(139,92,246,0.7)', fontSize: '0.85rem', letterSpacing: 2 }}>LOADING</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

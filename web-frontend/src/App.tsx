import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { QuizDataProvider } from './context/QuizDataContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import QuizPage from './pages/QuizPage'
import GraphPage from './pages/GraphPage'
import HistoryPage from './pages/HistoryPage'
import SemCheckPage from './pages/SemCheckPage'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="graph" element={<GraphPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="sem-check" element={<SemCheckPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QuizDataProvider>
        <AppRoutes />
      </QuizDataProvider>
    </AuthProvider>
  );
}

export default App

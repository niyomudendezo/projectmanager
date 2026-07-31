import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="loading full-page">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

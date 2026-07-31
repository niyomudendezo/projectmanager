import { useEffect } from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import TaskRoadmap from './pages/TaskRoadmap';
import Invitations from './pages/Invitations';
import TeamProjects from './pages/TeamProjects';

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/board/:id" element={<ProtectedRoute><Board /></ProtectedRoute>} />
        <Route path="/task/:id" element={<ProtectedRoute><TaskRoadmap /></ProtectedRoute>} />
        <Route path="/invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
        <Route path="/team-projects" element={<ProtectedRoute><TeamProjects /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

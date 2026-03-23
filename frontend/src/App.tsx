import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UnitDashboard from './pages/UnitDashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useAuth } from './hooks/useAuth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-on-surface">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/:unidadeId" element={<UnitDashboard />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="configuracoes" element={<Settings />} />
          <Route path="suporte" element={<div className="font-bold text-2xl text-zinc-600 p-8">Módulo Suporte e Base de Conhecimento (Em Breve)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

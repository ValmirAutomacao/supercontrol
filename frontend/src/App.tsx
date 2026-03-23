import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataIngestion from './pages/DataIngestion';
import UnitDashboard from './pages/UnitDashboard';
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
          <Route path="relatorios" element={<div className="font-bold text-2xl text-on-surface p-8">Relatórios (Em Breve)</div>} />
          <Route path="lancamento" element={<DataIngestion />} />
          <Route path="configuracoes" element={<div className="font-bold text-2xl text-on-surface p-8">Configurações (Em Breve)</div>} />
          <Route path="suporte" element={<div className="font-bold text-2xl text-on-surface p-8">Suporte (Em Breve)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

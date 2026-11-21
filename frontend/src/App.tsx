import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuctionListPage } from './pages/AuctionListPage';
import { CreateRFQPage } from './pages/CreateRFQPage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { ActivityHistoryPage } from './pages/ActivityHistoryPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { QuickDemoBar } from './components/QuickDemoBar';
import { AuroraBackground } from './components/AuroraBackground';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 text-white">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-950 overflow-hidden font-sans relative transition-colors duration-300">
      <AuroraBackground />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <QuickDemoBar />
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/auctions"
              element={
                <ProtectedLayout>
                  <AuctionListPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/rfqs/new"
              element={
                <ProtectedLayout>
                  <CreateRFQPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/rfqs/:id"
              element={
                <ProtectedLayout>
                  <AuctionDetailPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedLayout>
                  <ActivityHistoryPage />
                </ProtectedLayout>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

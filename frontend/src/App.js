import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Web3Provider } from './config/web3';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import PolicyLibrary from './pages/PolicyLibrary';
import DocumentGenerator from './pages/DocumentGenerator';
import EvidenceManager from './pages/EvidenceManager';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import ClaimTimeline from './pages/ClaimTimeline';

// New Portal Pages
import DAOGovernance from './pages/DAOGovernance';
import MultiAgents from './pages/MultiAgents';
import FoundersPortal from './pages/FoundersPortal';
import BrainInjuryPortal from './pages/BrainInjuryPortal';
import InsurancePortal from './pages/InsurancePortal';
import LegalPortal from './pages/LegalPortal';
import HealthPortal from './pages/HealthPortal';
import FinancePortal from './pages/FinancePortal';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// App Router with session_id detection
function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes - Core */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/policies" element={<ProtectedRoute><PolicyLibrary /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentGenerator /></ProtectedRoute>} />
      <Route path="/evidence" element={<ProtectedRoute><EvidenceManager /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/timeline/:claimId" element={<ProtectedRoute><ClaimTimeline /></ProtectedRoute>} />
      
      {/* New - DAO & Agents */}
      <Route path="/governance" element={<ProtectedRoute><DAOGovernance /></ProtectedRoute>} />
      <Route path="/agents" element={<ProtectedRoute><MultiAgents /></ProtectedRoute>} />
      
      {/* New - Portals */}
      <Route path="/portal/founders" element={<ProtectedRoute><FoundersPortal /></ProtectedRoute>} />
      <Route path="/portal/brain-injury" element={<ProtectedRoute><BrainInjuryPortal /></ProtectedRoute>} />
      <Route path="/portal/insurance" element={<ProtectedRoute><InsurancePortal /></ProtectedRoute>} />
      <Route path="/portal/legal" element={<ProtectedRoute><LegalPortal /></ProtectedRoute>} />
      <Route path="/portal/health" element={<ProtectedRoute><HealthPortal /></ProtectedRoute>} />
      <Route path="/portal/finance" element={<ProtectedRoute><FinancePortal /></ProtectedRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Web3Provider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
            <Toaster 
              position="top-right" 
              richColors 
              toastOptions={{ className: 'rounded-xl' }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </Web3Provider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';

// Importing page components
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { Dashboard } from '../pages/Dashboard';
import { NewResearch } from '../pages/NewResearch';
import { ResearchResults } from '../pages/ResearchResults';
import { Reports } from '../pages/Reports';
import { Compare } from '../pages/Compare';
import { Watchlist } from '../pages/Watchlist';
import { Team } from '../pages/Team';

// Sleek 404 page component
const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
    <div className="text-sm font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-200 px-3.5 py-1 rounded">
      Error 404
    </div>
    <h3 className="text-xl font-black text-slate-900 mt-5 tracking-tight">Resource Not Found</h3>
    <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
      The dashboard segment you are attempting to access does not exist or has been relocated.
    </p>
    <a 
      href="/"
      className="mt-6 inline-flex items-center justify-center font-bold text-xs bg-slate-900 text-white px-4 py-2 hover:bg-slate-850 rounded shadow-xs"
    >
      Return to Dashboard
    </a>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <WebSocketProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
  
            {/* Protected Monorepo App Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/research/new" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <NewResearch />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ResearchResults />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/compare" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Compare />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/watchlist" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Watchlist />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/team" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Team />
                  </Layout>
                </ProtectedRoute>
              } 
            />
  
            {/* Global Fallback Route */}
            <Route 
              path="*" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <NotFound />
                  </Layout>
                </ProtectedRoute>
              } 
            />
  
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

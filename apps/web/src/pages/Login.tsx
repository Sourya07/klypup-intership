import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI';
import { Sparkles, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Destination to redirect to after successful login
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login({ email: 'test@klypup.com', password: 'password123' });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please sign up first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col md:flex-row transition-colors">
      
      {/* LEFT PANEL - GORGEOUS STATS & DECORATION */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-zinc-50 dark:bg-black p-12 text-zinc-500 dark:text-zinc-400 relative overflow-hidden border-r border-zinc-200 dark:border-zinc-800">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-2.5 relative z-10">
          <div className="w-8 h-8 rounded bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-black">
            AG
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight uppercase tracking-wider">ai research AI</span>
        </div>

        <div className="space-y-6 max-w-lg relative z-10 my-auto">
          <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest rounded-full inline-block">
            Institutional Research Portal
          </span>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            AI-Driven Investment Analysis for Modern Equities.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Synthesizing SEC filings, balance sheets, and real-time market sentiment into institutional-grade valuations. Attributed. Auditable. Fast.
          </p>

          {/* Quick stats list */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Analysis Speed</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white block mt-1">~90 Seconds</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Source Confidence</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white block mt-1">Verified 10-K Citations</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-400 dark:text-zinc-600 relative z-10 flex justify-between">
          <span>© 2026 ai research Monorepo Inc.</span>
          <a href="#" className="hover:underline">Security Protocols</a>
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="flex-1 bg-white dark:bg-black flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Access Dashboard</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sign in with your analyst credentials to manage your workspace.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded p-3 text-xs font-semibold text-red-700 dark:text-red-400 flex items-start space-x-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@firm.com"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Password</label>
                <a href="#" className="text-[10px] text-zinc-400 hover:underline font-semibold">Forgot Password?</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
                required
              />
            </div>

            <div className="pt-2 flex flex-col space-y-3">
              <Button type="submit" variant="primary" className="py-2.5 rounded text-sm font-bold" loading={loading}>
                Sign In
              </Button>
              
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold rounded border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Sparkles className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400 shrink-0" /> Fast Track Developer Demo
              </button>
            </div>
          </form>

          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            Don't have an organization?{' '}
            <Link to="/signup" className="text-zinc-900 dark:text-white hover:underline font-semibold">
              Create one now
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

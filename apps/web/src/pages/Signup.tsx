import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI';
import { Shield } from 'lucide-react';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !organizationName) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup({ name, email, password, organizationName });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col md:flex-row transition-colors">
      
      {/* LEFT PANEL - STATS & HIGHLIGHTS */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-zinc-50 dark:bg-black p-12 text-zinc-500 dark:text-zinc-400 relative overflow-hidden border-r border-zinc-200 dark:border-zinc-800">
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-2.5 relative z-10">
          <div className="w-8 h-8 rounded bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-black">
            AG
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight uppercase tracking-wider">ai research AI</span>
        </div>

        <div className="space-y-6 max-w-lg relative z-10 my-auto">
          <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest rounded-full inline-block">
            Workspace Provisioning
          </span>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            Create Your Dedicated Tenant Workspace.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Set up an isolated data container for your investment firm. Invite colleagues, synchronize research lists, and secure audit trails under a dedicated organizational tenancy.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Tenant Security</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white block mt-1">Data Isolation</span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">RBAC Policy</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white block mt-1">Granular Controls</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-400 dark:text-zinc-600 relative z-10">
          <span>© 2026 ai research Monorepo Inc.</span>
        </div>
      </div>

      {/* RIGHT PANEL - SIGNUP FORM */}
      <div className="flex-1 bg-white dark:bg-black flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Create Organization</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Register your analyst account and initialize a new firm workspace.
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
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Your Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marcus Aurelius"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Work Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@aurelius-capital.com"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Secure Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">Organization / Firm Name</label>
              <input 
                type="text" 
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Aurelius Capital Management"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
                required
              />
            </div>

            <div className="pt-3">
              <Button type="submit" variant="primary" className="w-full py-2.5 rounded text-sm font-bold" loading={loading}>
                Provision Workspace
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            Already have a workspace?{' '}
            <Link to="/login" className="text-zinc-900 dark:text-white hover:underline font-semibold">
              Sign in instead
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

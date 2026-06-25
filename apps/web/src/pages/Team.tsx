import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Select, Badge, Skeleton } from '../components/UI';
import { Users, Plus, Mail, Key, UserCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orgService } from '../services/api';
import { Member } from '../types/api';

export const Team: React.FC = () => {
  const { organization, role } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');

  // Invite states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('ANALYST');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orgService.getMembers();
      setMembers(data);
    } catch (err) {
      setError('Failed to retrieve workspace members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteLoading(true);
    try {
      await orgService.inviteMember(inviteEmail, inviteRole);
      setInviteSuccess(true);
      setInviteEmail('');
      // Reload list to show the new mock user locally
      await loadMembers();
      setTimeout(() => {
        setInviteSuccess(false);
        setInviteModalOpen(false);
      }, 1500);
    } catch (err) {
      setError('Failed to dispatch workspace invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  const getRoleBadge = (r?: string) => {
    const upper = r?.toUpperCase() || 'VIEWER';
    if (upper === 'ADMIN') return <Badge variant="danger">Admin</Badge>;
    if (upper === 'ANALYST') return <Badge variant="info">Analyst</Badge>;
    return <Badge variant="default">Viewer</Badge>;
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Team Management</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your corporate workspace, review member profiles, and provision tenant access keys.
          </p>
        </div>

        {/* Invite Trigger guarded by ADMIN role check */}
        {role === 'ADMIN' && (
          <Button 
            variant="primary" 
            onClick={() => setInviteModalOpen(true)}
            className="shadow-sm font-bold text-xs flex items-center px-4 py-2 rounded shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Invite Member
          </Button>
        )}
      </div>

      {/* WORKSPACE PROFILE OVERVIEW CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Tenant Stats */}
        <Card className="shadow-sm md:col-span-1 bg-zinc-950 dark:bg-black text-zinc-400 border-zinc-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-white flex items-center text-sm">
              <Key className="w-4 h-4 mr-2 text-indigo-400 shrink-0" /> Workspace Tenancy
            </CardTitle>
            <CardDescription className="text-zinc-500">Corporate subscription parameters.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div>
              <span className="text-zinc-500 font-bold block uppercase tracking-wider">Tenant Name</span>
              <span className="text-sm font-bold text-white block mt-1">{organization?.name}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold block uppercase tracking-wider">Workspace Slug</span>
              <span className="font-mono text-zinc-300 block mt-1">{organization?.slug || 'ai research-capital'}</span>
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <span className="text-zinc-500 font-bold block uppercase tracking-wider">Tenant ID Reference</span>
              <span className="font-mono text-[10px] text-zinc-500 block truncate mt-1">{organization?.id || ''}</span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Team Members List */}
        <div className="md:col-span-2">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : (
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <CardTitle className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400 shrink-0" /> Registered Workspace Members
                </CardTitle>
                <CardDescription>Accounts authorized to view or edit this tenant's data contracts.</CardDescription>
              </CardHeader>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Member Name</th>
                      <th className="px-5 py-3">Email Address</th>
                      <th className="px-5 py-3">Workspace Role</th>
                      <th className="px-5 py-3">Provisioned Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white text-xs flex items-center">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-extrabold text-zinc-600 dark:text-zinc-400 mr-2.5 shrink-0">
                            {member.user.name?.charAt(0) || 'A'}
                          </div>
                          {member.user.name}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono">
                          {member.user.email}
                        </td>
                        <td className="px-5 py-4">
                          {getRoleBadge(member.role)}
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-400">
                          {new Date(member.user.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* INVITE MEMBER MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 rounded-lg max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-scale-up">
            
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white flex items-center">
                <Mail className="w-4 h-4 mr-2 text-indigo-500 shrink-0" /> Dispatch Workspace Invitation
              </h4>
            </div>

            {inviteSuccess ? (
              <div className="p-10 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <span className="text-sm font-bold text-zinc-900 dark:text-white block">Invitation Dispatched</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Colleague has been successfully enrolled in this tenant environment.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit}>
                <div className="p-6 space-y-4">
                  <Input 
                    label="Colleague Email Address"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@firm.com"
                    required
                  />

                  <Select 
                    label="Assigned Workspace Role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                  >
                    <option value="ANALYST">Analyst (Read & Edit)</option>
                    <option value="ADMIN">Administrator (Full Access)</option>
                    <option value="VIEWER">Viewer (Read-Only)</option>
                  </Select>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800 flex items-start space-x-2.5 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                    <UserCheck className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                    <span>
                      Enrolling members grants immediate read-access to watchlists and synthesized reports compiled inside the <strong className="text-zinc-700 dark:text-zinc-300">{organization?.name}</strong> workspace.
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 flex justify-end space-x-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Button variant="outline" type="button" onClick={() => setInviteModalOpen(false)} disabled={inviteLoading}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" loading={inviteLoading}>
                    Dispatch Invite
                  </Button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

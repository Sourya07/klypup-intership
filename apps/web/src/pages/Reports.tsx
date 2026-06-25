import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, SentimentBadge, EmptyState, Skeleton, ConfirmDialog } from '../components/UI';
import { Search, Plus, Trash2, Eye, Filter, AlertTriangle } from 'lucide-react';
import { researchService } from '../services/api';
import { ResearchReport } from '../types/api';
import { useAuth } from '../context/AuthContext';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('ALL');
  
  // Delete action states
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await researchService.getReports();
      setReports(data);
    } catch (err) {
      setError('Failed to load saved research reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDeleteTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteReportId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteReportId) return;
    setDeleteLoading(true);
    try {
      await researchService.deleteReport(deleteReportId);
      setReports(reports.filter((r) => r.id !== deleteReportId));
      setDeleteReportId(null);
    } catch (e) {
      console.error('Failed to delete report:', e);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter computation
  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      r.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.title.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSentiment = 
      sentimentFilter === 'ALL' || 
      r.sentiment?.toUpperCase() === sentimentFilter.toUpperCase();

    return matchesSearch && matchesSentiment;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Research Reports</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Browse and manage qualitative AI investment reports stored in your tenant workspace.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => navigate('/research/new')}
          className="shadow-sm font-bold text-xs flex items-center px-4 py-2 rounded shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Start New Research
        </Button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Search input */}
        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 w-full md:max-w-xs focus-within:border-zinc-800 dark:focus-within:border-zinc-400 transition-colors">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ticker, company name..." 
            className="bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none w-full placeholder-zinc-400 dark:placeholder-zinc-600"
          />
        </div>

        {/* Right: Sentiment filters */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Sentiment Filter</span>
          </div>
          <div className="inline-flex rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1 text-xs">
            {['ALL', 'BULLISH', 'NEUTRAL', 'BEARISH'].map((opt) => (
              <button
                key={opt}
                onClick={() => setSentimentFilter(opt)}
                className={`px-3 py-1 font-bold rounded transition-colors ${
                  sentimentFilter === opt 
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xs' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {opt.charAt(0) + opt.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* REPORTS LISTING SPACE */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : error ? (
        <Card className="border-red-200 dark:border-red-900 bg-red-50/10 dark:bg-red-950/10 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <span className="font-bold text-zinc-900 dark:text-white">Failed to load reports</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{error}</p>
          <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={loadReports}>
            Retry Loading
          </Button>
        </Card>
      ) : filteredReports.length === 0 ? (
        <EmptyState 
          title="No Matching Reports Found" 
          description={
            searchTerm || sentimentFilter !== 'ALL'
              ? 'Try refining your search parameters or adjusting the sentiment filter settings.'
              : 'Your workspace database is currently empty. Run an AI research report to populate this list.'
          }
          actionText={searchTerm || sentimentFilter !== 'ALL' ? 'Clear Filters' : 'Create First Report'}
          onAction={() => {
            if (searchTerm || sentimentFilter !== 'ALL') {
              setSearchTerm('');
              setSentimentFilter('ALL');
            } else {
              navigate('/research/new');
            }
          }}
        />
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Ticker</th>
                  <th className="px-6 py-3">Company / Report Title</th>
                  <th className="px-6 py-3">Sentiment</th>
                  <th className="px-6 py-3">Created Date</th>
                  <th className="px-6 py-3">Metadata Tags</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">
                {filteredReports.map((report) => (
                  <tr 
                    key={report.id} 
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono font-black text-zinc-900 dark:text-white text-xs">
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
                        {report.ticker}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900 dark:text-white block group-hover:underline">{report.companyName}</span>
                      <span className="text-[10px] text-zinc-400 block truncate max-w-sm mt-0.5">{report.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <SentimentBadge sentiment={report.sentiment || 'NEUTRAL'} />
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {report.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[8px] font-extrabold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                        {report.tags && report.tags.length > 2 && (
                          <span className="text-[8px] font-extrabold text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 uppercase">
                            +{report.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => navigate(`/reports/${report.id}`)}
                          className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white transition-colors"
                          title="Open report details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {role !== 'VIEWER' && (
                          <button 
                            onClick={(e) => handleDeleteTrigger(report.id, e)}
                            className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CONFIRM DELETION DIALOG */}
      <ConfirmDialog 
        isOpen={deleteReportId !== null}
        title="Delete Research Report"
        message="Are you sure you want to delete this AI research report? This will permanently remove the report record and its associated metrics from this workspace."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteReportId(null)}
        confirmText="Confirm Deletion"
        loading={deleteLoading}
      />

    </div>
  );
};

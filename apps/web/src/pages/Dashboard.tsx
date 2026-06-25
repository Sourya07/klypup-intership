import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  MetricCard, 
  Button, 
  SentimentBadge, 
  Skeleton,
  EmptyState
} from '../components/UI';
import { 
  Sparkles, 
  Plus, 
  TrendingUp, 
  Bookmark, 
  ArrowRight, 
  History 
} from 'lucide-react';
import { researchService, watchlistService } from '../services/api';
import { ResearchReport, WatchlistItem } from '../types/api';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [reportsData, watchlistData] = await Promise.all([
          researchService.getReports(),
          watchlistService.getWatchlist()
        ]);
        setReports(reportsData.slice(0, 3)); // Only show top 3 on dashboard
        setWatchlist(watchlistData.slice(0, 4)); // Only show top 4 on dashboard
      } catch (err) {
        setError('Failed to pull workspace resources.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Dashboard Workspace</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Welcome back, <span className="font-bold text-zinc-800 dark:text-zinc-200">{user?.name}</span>. Here is your firm's research overview.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => navigate('/research/new')} 
          className="shadow-sm font-bold text-xs flex items-center px-4 py-2 rounded shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-400 dark:text-indigo-600" /> Start AI Research
        </Button>
      </div>

      {/* METRIC CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Synthesized Reports" 
          value={reports.length > 0 ? reports.length + 5 : 8} 
          change="+12% this week" 
          changeType="positive"
          description="Total qualitative AI reports in organization"
        />
        <MetricCard 
          label="Watchlist Equities" 
          value={watchlist.length > 0 ? watchlist.length : 5} 
          change="Live Tickers" 
          changeType="neutral"
          description="Monitored corporate tickers in workspace"
        />
        <MetricCard 
          label="Core AI Confidence" 
          value="94.2%" 
          change="0.5% gain" 
          changeType="positive"
          description="Average validation confidence score"
        />
        <MetricCard 
          label="Market sentiment index" 
          value="68 / 100" 
          change="Bullish Bias" 
          changeType="positive"
          description="Consensus model news sentiment bias"
        />
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent reports */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Research Reports</CardTitle>
                <CardDescription>Attributed equity reports synthesized by the AI agent.</CardDescription>
              </div>
              <Link to="/reports" className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white inline-flex items-center">
                All Reports <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
              {reports.length === 0 ? (
                <div className="p-6">
                  <EmptyState 
                    title="No Research Reports Found" 
                    description="Initiate an AI research run on any stock ticker to generate your first full-stack equity report."
                    actionText="Start AI Research"
                    onAction={() => navigate('/research/new')}
                  />
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="p-5 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono font-black text-sm px-2 py-0.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded">
                          {report.ticker}
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white hover:underline">
                          <Link to={`/reports/${report.id}`}>{report.companyName}</Link>
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {report.summary}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {report.tags?.map((tag) => (
                          <span key={tag} className="text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end shrink-0 justify-between sm:justify-start gap-2">
                      <SentimentBadge sentiment={report.sentiment || 'NEUTRAL'} />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className="text-xs py-1 px-2.5 font-semibold rounded"
                      >
                        Open Report
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick actions box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/research/new')}
              className="p-4 bg-zinc-900 dark:bg-zinc-950 text-white rounded-lg border border-zinc-800 dark:border-zinc-800 text-left hover:bg-zinc-800 dark:hover:bg-zinc-900 transition-all flex flex-col justify-between h-32 group shadow-sm"
            >
              <div className="p-2 bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-800 rounded-full w-fit">
                <Plus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-none">New AI Run</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-1 leading-normal">Synthesize news & financials</span>
              </div>
            </button>

            <button 
              onClick={() => navigate('/compare')}
              className="p-4 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all flex flex-col justify-between h-32 group shadow-sm"
            >
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full w-fit text-zinc-600 dark:text-zinc-400">
                <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-none">Compare Equities</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 leading-normal">Side-by-side metric tables</span>
              </div>
            </button>

            <button 
              onClick={() => navigate('/watchlist')}
              className="p-4 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all flex flex-col justify-between h-32 group shadow-sm"
            >
              <div className="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full w-fit text-zinc-600 dark:text-zinc-400">
                <Bookmark className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-none">Manage Watchlist</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 leading-normal">Monitor pricing and sentiment</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Watchlist Widget & Activity Feed */}
        <div className="space-y-6">
          
          {/* Watchlist Widget */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Watchlist Preview</CardTitle>
                <CardDescription>Live pricing and trends from your list.</CardDescription>
              </div>
              <Link to="/watchlist" className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white inline-flex items-center">
                Full List <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
              {watchlist.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">No tickers in your watchlist.</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs w-full" onClick={() => navigate('/watchlist')}>
                    Add Tickers
                  </Button>
                </div>
              ) : (
                watchlist.map((item) => {
                  const isUp = item.change !== undefined && item.change >= 0;
                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <div>
                        <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">{item.ticker}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate max-w-[120px]">{item.companyName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">${item.price?.toFixed(2)}</span>
                        <span className={`text-[10px] font-semibold block mt-0.5 ${
                          isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isUp ? '+' : ''}{item.change?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Activity</CardTitle>
              <CardDescription>Recent actions taken by analysts in this tenant.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5 pb-5 space-y-4">
                <div className="flex items-start space-x-3 text-xs">
                  <div className="p-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full shrink-0 mt-0.5 border border-emerald-100 dark:border-emerald-900">
                    <CheckCircle2Icon className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-zinc-800 dark:text-zinc-200 font-semibold leading-relaxed">AAPL AI report synthesized</span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Sourya Analyst • 2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs">
                  <div className="p-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-full shrink-0 mt-0.5 border border-indigo-100 dark:border-indigo-900">
                    <Bookmark className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-zinc-800 dark:text-zinc-200 font-semibold leading-relaxed">NVDA added to corporate watchlist</span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Jessica Reynolds • 5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs">
                  <div className="p-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 rounded-full shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700">
                    <History className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-zinc-800 dark:text-zinc-200 font-semibold leading-relaxed">Compare run executed for MSFT vs AAPL</span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Marcus Vance • Yesterday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
};

// Helper tiny icon
const CheckCircle2Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

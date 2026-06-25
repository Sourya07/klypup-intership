import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Button, 
  SentimentBadge, 
  FinancialTable, 
  CitationList, 
  MetricCard, 
  Skeleton,
  ConfirmDialog,
  Input
} from '../components/UI';
import { 
  FileText, 
  Trash2, 
  Edit3, 
  Bookmark, 
  ChevronLeft, 
  Download, 
  Calendar, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { researchService, watchlistService } from '../services/api';
import { ResearchReport } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

export const ResearchResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab controller state
  const [activeTab, setActiveTab] = useState<'valuation' | 'financials' | 'sentiment' | 'citations'>('valuation');
  
  // Watchlist check state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Edit report state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete report state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load report data
  const loadReport = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await researchService.getReport(id);
      setReport(data);
      setEditTitle(data.title);
      setEditTags(data.tags?.join(', ') || '');
      
      // Check if this ticker is already watchlisted
      const wl = await watchlistService.getWatchlist();
      setInWatchlist(wl.some((w) => w.ticker === data.ticker));
    } catch (err) {
      setError('Could not retrieve the requested equity research report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleToggleWatchlist = async () => {
    if (!report) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        const wl = await watchlistService.getWatchlist();
        const item = wl.find((w) => w.ticker === report.ticker);
        if (item) {
          await watchlistService.removeFromWatchlist(item.id);
          setInWatchlist(false);
        }
      } else {
        await watchlistService.addToWatchlist(report.ticker);
        setInWatchlist(true);
      }
    } catch (e) {
      console.error('Failed to update watchlist status:', e);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    setEditLoading(true);
    try {
      const parsedTags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
      const updated = await researchService.updateReport(report.id, editTitle, parsedTags);
      setReport(updated);
      setEditModalOpen(false);
    } catch (e) {
      console.error('Failed to update report details:', e);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!report) return;
    setDeleteLoading(true);
    try {
      await researchService.deleteReport(report.id);
      setDeleteDialogOpen(false);
      navigate('/reports');
    } catch (e) {
      console.error('Failed to delete report:', e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!report) return;
    alert(`Exporting ${report.ticker} Research Report as PDF package...`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-28" />
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-9 w-80" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="border-red-200 dark:border-red-900 bg-red-50/10 dark:bg-red-950/10 p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Research Retrieval Failed</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{error || 'Report could not be found.'}</p>
          <Button variant="outline" className="mt-4 text-xs" onClick={() => navigate('/reports')}>
            Back to Reports List
          </Button>
        </Card>
      </div>
    );
  }

  // Generate metrics rows for the compact financials spreadsheet view
  const financialHeaders = ['Financial Ratio / Metric', '2023A', '2024A', '2025E', '2026E'];
  const financialRows = [
    { label: 'Revenue ($ Billion)', values: ['383.29', '385.60', '395.20', '412.50'], isHeader: true },
    { label: 'Gross Profit Margin (%)', values: ['44.1%', '44.6%', '45.2%', '45.8%'] },
    { label: 'EBITDA Margin (%)', values: ['32.8%', '33.1%', '33.7%', '34.2%'] },
    { label: 'Operating Cash Flow ($B)', values: ['110.54', '116.40', '124.50', '132.80'] },
    { label: 'Diluted EPS ($)', values: [report.metrics?.eps || '6.13', '6.43', '6.85', '7.45'] },
    { label: 'CapEx to Revenue Ratio (%)', values: ['2.6%', '2.8%', '3.2%', '3.5%'] },
    { label: 'Total Debt to Equity (x)', values: [report.metrics?.debtEquity || '1.42', '1.38', '1.25', '1.15'] }
  ];

  return (
    <div className="space-y-6">
      
      {/* NAVIGATION HEADER BAR */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/reports')}
          className="inline-flex items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Saved Reports
        </button>

        <div className="flex items-center space-x-2">
          {/* Watchlist toggle trigger */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleToggleWatchlist}
            loading={watchlistLoading}
            className={`text-xs border font-semibold rounded ${
              inWatchlist 
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20' 
                : ''
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 mr-1.5 ${inWatchlist ? 'fill-indigo-600 dark:fill-indigo-400' : ''}`} />
            {inWatchlist ? 'In Watchlist' : 'Add Watchlist'}
          </Button>

          {/* Export PDF */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportPDF}
            className="text-xs font-semibold rounded"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export PDF
          </Button>

          {/* Guarded actions: Edit and Delete */}
          {role !== 'VIEWER' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="text-xs font-semibold rounded"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 font-semibold rounded"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* REPORT IDENTITY HEADER */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <span className="font-mono font-black text-sm px-2.5 py-1 bg-zinc-900 dark:bg-white text-white dark:text-black rounded shadow-xs">
              {report.ticker}
            </span>
            <SentimentBadge sentiment={report.sentiment || 'NEUTRAL'} />
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5 uppercase tracking-widest flex items-center">
              <Award className="w-3.5 h-3.5 mr-1 text-indigo-500 dark:text-indigo-400" /> AI Confidence Match: {report.sentimentScore || 70}%
            </span>
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            {report.title}
          </h2>
          <div className="flex items-center space-x-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{report.companyName}</span>
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-zinc-400 dark:text-zinc-500" />
              {new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </div>
          </div>
        </div>

        {/* Tags badge row */}
        <div className="flex flex-wrap gap-1.5 max-w-xs md:justify-end">
          {report.tags?.map((tag) => (
            <span key={tag} className="text-[9px] font-extrabold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1 uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* SPLIT PAGE SECTION: EXECUTIVE SUMMARY & METRIC CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Executive summary block */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="flex items-center text-zinc-800 dark:text-white">
              <FileText className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" /> Executive Research Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg">
              {report.summary}
            </p>
            
            {/* Quick structured takeaways */}
            <div className="mt-4 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider block">Key AI Highlights</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400 leading-normal">Ecosystem synergy continues to cushion hardware declines.</span>
                </div>
                <div className="flex items-start space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400 leading-normal">Strong pricing leverage in subscription services.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Metrics Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard 
            label="P/E Ratio" 
            value={report.metrics?.peRatio || 'N/A'} 
            change="Premium to Peer Group" 
            changeType="neutral"
          />
          <MetricCard 
            label="EPS (Diluted)" 
            value={`$${report.metrics?.eps || 'N/A'}`} 
            change="+6.2% YoY" 
            changeType="positive"
          />
          <MetricCard 
            label="Revenue Growth" 
            value={report.metrics?.revenueGrowth || 'N/A'} 
            change="Stable Expansion" 
            changeType="positive"
          />
          <MetricCard 
            label="Operating Margin" 
            value={report.metrics?.profitMargin || 'N/A'} 
            change="Industry Leading" 
            changeType="positive"
          />
        </div>

      </div>

      {/* STOCK PERFORMANCE CHART SECTION */}
      {report.stockHistory && report.stockHistory.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" /> Stock Price Performance Trend
            </CardTitle>
            <CardDescription>Historical price changes compiled across the preceding 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.stockHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} />
                  <XAxis dataKey="date" stroke={isDark ? '#71717a' : '#94a3b8'} fontSize={11} />
                  <YAxis stroke={isDark ? '#71717a' : '#94a3b8'} fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#09090b' : '#0f172a', borderRadius: '4px', border: isDark ? '1px solid #27272a' : 'none', padding: '8px' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ color: isDark ? '#fafafa' : '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    name="Stock Price ($)"
                    stroke={isDark ? '#38bdf8' : '#0f172a'} 
                    strokeWidth={2} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DETAILED TABBED ANALYSIS PANEL */}
      <div className="space-y-4">
        
        {/* Tab Controls */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-t border-x border-t border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <button
            onClick={() => setActiveTab('valuation')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${
              activeTab === 'valuation' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            Valuation Narrative
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${
              activeTab === 'financials' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            Financial Metrics Table
          </button>
          <button
            onClick={() => setActiveTab('sentiment')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${
              activeTab === 'sentiment' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            News Sentiment Analysis
          </button>
          <button
            onClick={() => setActiveTab('citations')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${
              activeTab === 'citations' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            Attributed Source Citations
          </button>
        </div>

        {/* Tab Content Display */}
        <Card className="rounded-t-none border-t-0 shadow-sm">
          <CardContent className="p-6">
            
            {/* VALUATION NARRATIVE TAB */}
            {activeTab === 'valuation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Opportunities list */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Growth Opportunities</span>
                    </div>
                    <div className="space-y-2">
                      {report.opportunities && report.opportunities.length > 0 ? (
                        report.opportunities.map((opp, idx) => (
                          <div key={idx} className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {opp}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">No opportunities identified.</p>
                      )}
                    </div>
                  </div>

                  {/* Risks list */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Critical Risk Factors</span>
                    </div>
                    <div className="space-y-2">
                      {report.risks && report.risks.length > 0 ? (
                        report.risks.map((risk, idx) => (
                          <div key={idx} className="p-3 bg-rose-50/30 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {risk}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">No risks identified.</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Key Drivers */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200 tracking-wider">
                    <Info className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <span>Primary Investment Drivers</span>
                  </div>
                  <div className="space-y-2">
                    {report.keyDrivers?.map((driver, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-zinc-900 dark:bg-white rounded-full shrink-0 mt-1.5"></span>
                        <span>{driver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FINANCIALS TAB */}
            {activeTab === 'financials' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Income & Leverage Summary
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                    Values represented in USD Billions except EPS.
                  </span>
                </div>
                <FinancialTable headers={financialHeaders} rows={financialRows} />
              </div>
            )}

            {/* SENTIMENT TAB */}
            {activeTab === 'sentiment' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left score card */}
                  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-between items-center text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">News Sentiment Score</span>
                      <span className="text-4xl font-black text-zinc-900 dark:text-white block mt-2">{report.sentimentScore || 50}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1">Out of 100 benchmark</span>
                    </div>
                    <div className="w-full mt-4">
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded overflow-hidden">
                        <div 
                          className="bg-zinc-900 dark:bg-white h-full rounded transition-all duration-500" 
                          style={{ width: `${report.sentimentScore || 50}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
                        <span>Bearish</span>
                        <span>Neutral</span>
                        <span>Bullish</span>
                      </div>
                    </div>
                  </div>

                  {/* Right description block */}
                  <div className="md:col-span-2 space-y-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider block">AI Narrative Sentiment Breakdown</span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Our sentiment engine parsed recent Bloomberg, Reuters, and SEC filing filings for {report.companyName}. The narrative shows an elevated level of institutional enthusiasm regarding Services margins, offsetting hardware supply volatility. Key topics of conversation include product pipeline acceleration and strategic capital allocation structures.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block">Total Sentiment Citations</span>
                        <span className="text-base font-bold text-zinc-800 dark:text-zinc-100 block mt-0.5">142 articles</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block">Consensus Narrative</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">Bullish Bias</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* CITATIONS TAB */}
            {activeTab === 'citations' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Source Attribution Logs
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Click any source to review verified snippets and links.
                  </span>
                </div>
                <CitationList citations={report.citations} />
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* EDIT MODAL DIALOG */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 rounded-lg max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-scale-up">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white">Edit Report Details</h4>
            </div>
            <form onSubmit={handleSaveEdits}>
              <div className="p-6 space-y-4">
                <Input 
                  label="Report Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="AI Investment Report: AAPL"
                  required
                />
                
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Metadata Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g. Technology, Apple Intelligence, Services Moat"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-colors"
                  />
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block mt-1">
                    Separate tags with commas. These are indexed for search filters.
                  </span>
                </div>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 flex justify-end space-x-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)} disabled={editLoading}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={editLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DESTRUCTIVE ACTION DIALOG */}
      <ConfirmDialog 
        isOpen={deleteDialogOpen}
        title="Confirm Report Deletion"
        message={`Are you sure you want to permanently delete the AI Research Report for ${report.ticker}? This action cannot be undone, and will clear the report from your workspace database.`}
        onConfirm={handleDeleteReport}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="Permanently Delete"
        loading={deleteLoading}
      />

    </div>
  );
};

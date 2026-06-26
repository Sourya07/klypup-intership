import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, SentimentBadge, EmptyState, Skeleton, Toast } from '../components/UI';
import { Plus, Trash2, Eye, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { watchlistService } from '../services/api';
import { WatchlistItem } from '../types/api';

export const Watchlist: React.FC = () => {
  const navigate = useNavigate();
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Ticker creation state
  const [newTicker, setNewTicker] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Toast alerts state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const loadWatchlist = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await watchlistService.getWatchlist();
      setWatchlist(data);
    } catch (err) {
      setError('Failed to pull watchlist assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    const handleStockUpdate = (e: Event) => {
      const { detail: update } = e as CustomEvent;
      setWatchlist((prevWatchlist) =>
        prevWatchlist.map((item) =>
          item.ticker === update.symbol
            ? {
                ...item,
                price: update.price,
                change: update.change,
                sentiment: update.sentiment,
                trendScore: update.trendScore,
                history: update.history,
              }
            : item
        )
      );
    };

    window.addEventListener('stock-update', handleStockUpdate);
    return () => window.removeEventListener('stock-update', handleStockUpdate);
  }, []);

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker) return;

    setAddLoading(true);
    setError('');

    const tickerUpper = newTicker.trim().toUpperCase();

    // Check duplicate
    if (watchlist.some((w) => w.ticker === tickerUpper)) {
      setToast({ type: 'info', text: `${tickerUpper} is already present in your watchlist.` });
      setNewTicker('');
      setAddLoading(false);
      return;
    }

    try {
      const newItem = await watchlistService.addToWatchlist(tickerUpper);
      setWatchlist([newItem, ...watchlist]);
      setToast({ type: 'success', text: `Successfully added ${tickerUpper} to watchlist.` });
      setNewTicker('');
    } catch (err) {
      setToast({ type: 'error', text: `Failed to resolve ticker ${tickerUpper}.` });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveTicker = async (id: string, ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await watchlistService.removeFromWatchlist(id);
      setWatchlist(watchlist.filter((w) => w.id !== id));
      setToast({ type: 'success', text: `Removed ${ticker} from your watchlist.` });
    } catch (err) {
      setToast({ type: 'error', text: `Failed to remove ${ticker}.` });
    }
  };

  // Helper to draw a sleek SVG sparkline
  const renderSparkline = (history?: number[], isUp = true) => {
    if (!history || history.length === 0) return null;
    
    const width = 80;
    const height = 24;
    const padding = 2;
    
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;
    
    const points = history
      .map((val, idx) => {
        const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
        const y = padding + (1 - (val - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={isUp ? '#10b981' : '#f43f5e'}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Active Watchlist</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Monitor real-time pricing indicators, daily volatility, and aggregated news sentiment trends.
          </p>
        </div>
      </div>

      {/* TWO COLUMN GRID: ADD FORM & TICKERS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left pane: Add Ticker Form */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Plus className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" /> Monitor New Equity
              </CardTitle>
              <CardDescription>Insert a ticker to begin monitoring pricing and sentiment.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleAddTicker} className="space-y-4">
                <Input 
                  label="Ticker Symbol"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                  placeholder="e.g. NVDA, AMZN"
                  maxLength={5}
                  required
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full font-bold text-xs" 
                  loading={addLoading}
                >
                  Add Ticker
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right pane: Tickers list table */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : error ? (
            <Card className="border-red-200 dark:border-red-900 bg-red-50/10 dark:bg-red-950/10 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <span className="font-bold text-zinc-900 dark:text-white">Watchlist Error</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={loadWatchlist}>
                Retry Loading
              </Button>
            </Card>
          ) : watchlist.length === 0 ? (
            <EmptyState 
              title="Watchlist is Empty" 
              description="Monitor stock tickers side-by-side. Add tickers using the sidebar composer to track daily shifts."
            />
          ) : (
            <Card className="shadow-sm overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Ticker</th>
                      <th className="px-5 py-3">Company Name</th>
                      <th className="px-5 py-3 text-right">Price</th>
                      <th className="px-5 py-3 text-right">24H Change</th>
                      <th className="px-5 py-3 text-center">5D Trend</th>
                      <th className="px-5 py-3 text-center">Sentiment</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {watchlist.map((item) => {
                      const isUp = item.change !== undefined && item.change >= 0;
                      return (
                        <tr 
                          key={item.id} 
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                        >
                          <td className="px-5 py-4 font-mono font-black text-zinc-900 dark:text-white text-xs">
                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
                              {item.ticker}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white text-xs">
                            {item.companyName}
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs font-bold text-zinc-900 dark:text-white tabular-nums">
                            ${item.price?.toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-right tabular-nums">
                            <span className={`inline-flex items-center text-xs font-bold ${
                              isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5 shrink-0" /> : <ArrowDownRight className="w-3 h-3 mr-0.5 shrink-0" />}
                              {isUp ? '+' : ''}{item.change?.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex justify-center">
                              {renderSparkline(item.history, isUp)}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <SentimentBadge sentiment={item.sentiment} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center space-x-2">
                              <button 
                                onClick={() => navigate(`/research/new`)}
                                className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white transition-colors"
                                title="Synthesize new report"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button 
                                onClick={(e) => handleRemoveTicker(item.id, item.ticker, e)}
                                className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                title="Remove ticker"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* TOAST ALERTS NOTIFICATIONS FLOATER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast 
            type={toast.type} 
            text={toast.text} 
            onClose={() => setToast(null)} 
          />
        </div>
      )}

    </div>
  );
};

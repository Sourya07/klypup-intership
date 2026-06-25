import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Skeleton } from '../components/UI';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { compareService } from '../services/api';
import { CompareResponse } from '../types/api';
import { useTheme } from '../context/ThemeContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export const Compare: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tickersInput, setTickersInput] = useState('MSFT, AAPL');
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickersInput) {
      setError('Please input 2 or 3 ticker symbols to compare.');
      return;
    }

    const tickers = tickersInput
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    if (tickers.length < 2) {
      setError('Please provide at least 2 stock tickers for side-by-side comparison.');
      return;
    }
    if (tickers.length > 3) {
      setError('Maximum 3 tickers can be compared simultaneously.');
      return;
    }

    setLoading(true);
    setError('');
    setComparison(null);

    try {
      const data = await compareService.compareCompanies(tickers);
      setComparison(data);
    } catch (err) {
      setError('Failed to calculate side-by-side metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBarColor = (index: number) => {
    const colors = isDark ? ['#e4e4e7', '#38bdf8', '#818cf8'] : ['#0f172a', '#38bdf8', '#818cf8'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Compare Equities</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Perform side-by-side comparisons of structural balance sheet metrics, growth rates, and AI qualitative risks.
        </p>
      </div>

      {/* INPUT FORM PANEL */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <form onSubmit={handleCompareSubmit} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1">
              <Input 
                label="Stock Tickers to Compare (2 or 3, comma separated)"
                value={tickersInput}
                onChange={(e) => setTickersInput(e.target.value)}
                placeholder="e.g. MSFT, AAPL, GOOGL"
                required
              />
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              className="font-bold text-xs h-10 w-full sm:w-36 rounded shadow-xs shrink-0"
              loading={loading}
            >
              Run Comparison
            </Button>
          </form>
          {error && <p className="mt-2.5 text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>}
        </CardContent>
      </Card>

      {/* LOADING SKELETON */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-80" />
        </div>
      )}

      {/* COMPARATIVE DATASHEETS */}
      {comparison && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Comparison summary card */}
          <Card className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-5 flex items-start space-x-3.5">
              <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">AI Analytical Synthesis</span>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mt-1">{comparison.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-side Metrics grid */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <CardTitle>Comparative Key Ratios</CardTitle>
              <CardDescription>Structured datasheet metrics comparing financial strength.</CardDescription>
            </CardHeader>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Metric Indicator</th>
                    {comparison.companies.map((c) => (
                      <th key={c.ticker} className="px-6 py-3 text-right">
                        <span className="font-mono font-black text-xs bg-zinc-900 dark:bg-white text-white dark:text-black px-2 py-0.5 rounded">
                          {c.ticker}
                        </span>
                        <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1 max-w-[140px] truncate ml-auto">
                          {c.companyName}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">P/E Ratio (TTM)</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums text-zinc-900 dark:text-white font-bold">
                        {c.metrics.peRatio}x
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">Earnings Per Share (EPS)</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums">
                        ${c.metrics.eps}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">Market Capitalization</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums">
                        {c.metrics.marketCap}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">TTM Revenue</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums">
                        {c.metrics.revenue}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">Revenue Growth (YoY)</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                        {c.metrics.revenueGrowth}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">Operating Margin (%)</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums">
                        {c.metrics.profitMargin}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">Debt-to-Equity (x)</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums">
                        {c.metrics.debtEquity}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">Price-to-Book Ratio</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums">
                        {c.metrics.pbRatio}x
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">Dividend Yield (%)</td>
                    {comparison.companies.map((c) => (
                      <td key={c.ticker} className="px-6 py-4 text-right font-mono text-xs tabular-nums">
                        {c.metrics.dividendYield}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recharts comparative bar chart */}
          {comparison.comparisonChart && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Metric Comparison Chart</CardTitle>
                <CardDescription>Visual comparisons across key financial ratios.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparison.comparisonChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} />
                      <XAxis dataKey="metric" stroke={isDark ? '#71717a' : '#94a3b8'} fontSize={11} />
                      <YAxis stroke={isDark ? '#71717a' : '#94a3b8'} fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: isDark ? '#09090b' : '#0f172a', borderRadius: '4px', border: isDark ? '1px solid #27272a' : 'none', padding: '8px' }}
                        labelStyle={{ color: '#a1a1aa', fontSize: '10px', fontWeight: 'bold' }}
                        itemStyle={{ color: isDark ? '#fafafa' : '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      {comparison.companies.map((company, idx) => (
                        <Bar 
                          key={company.ticker} 
                          dataKey={company.ticker} 
                          name={`${company.ticker} Metrics`}
                          fill={getBarColor(idx)} 
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Qualitative side-by-side strengths/weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparison.companies.map((company, idx) => (
              <Card key={company.ticker} className="shadow-sm">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-mono text-sm uppercase">{company.ticker} Qualitative Profile</CardTitle>
                    <CardDescription>{company.companyName}</CardDescription>
                  </div>
                  <div 
                    className="w-3.5 h-3.5 rounded-full shrink-0" 
                    style={{ backgroundColor: getBarColor(idx) }}
                  ></div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  
                  {/* Strengths */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">Key AI Strengths</span>
                    <div className="space-y-2">
                      {company.strengths.map((str, i) => (
                        <div key={i} className="flex items-start space-x-2.5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider block">Critical AI Vulnerabilities</span>
                    <div className="space-y-2">
                      {company.weaknesses.map((weak, i) => (
                        <div key={i} className="flex items-start space-x-2.5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                          <span>{weak}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};

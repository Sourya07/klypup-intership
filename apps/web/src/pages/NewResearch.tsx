import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, ProgressStepper, Input } from '../components/UI';
import { Sparkles, HelpCircle, Terminal, RefreshCw, AlertCircle } from 'lucide-react';
import { researchService } from '../services/api';
import { ResearchRun } from '../types/api';

export const NewResearch: React.FC = () => {
  const navigate = useNavigate();
  
  const [ticker, setTicker] = useState('');
  const [prompt, setPrompt] = useState('');
  const [depth, setDepth] = useState<'quick' | 'detailed'>('detailed');
  const [activeRun, setActiveRun] = useState<ResearchRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const samplePrompts = [
    { ticker: 'AAPL', text: `Evaluate Apple's services growth sustainability and its valuation impact relative to capital expenditures on AI hardware.` },
    { ticker: 'TSLA', text: `Assess Tesla's margin compression risk under the current global price adjustments, factoring in energy storage expansion.` },
    { ticker: 'MSFT', text: `Analyze Microsoft's Azure AI commercial uptake rate and project the Discounted Cash Flow valuation under an elevated CapEx scenario.` }
  ];

  const handleApplySample = (sample: typeof samplePrompts[0]) => {
    setTicker(sample.ticker);
    setPrompt(sample.text);
  };

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) {
      setError('Please provide a company stock ticker symbol.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const run = await researchService.createRun(ticker, prompt || `Perform a comprehensive financial and narrative research report for ${ticker}.`);
      setActiveRun(run);
    } catch (err: any) {
      setError('Failed to initiate AI research job. Please verify your connection.');
      setLoading(false);
    }
  };

  // Poll the active research run until completed or failed
  useEffect(() => {
    if (!activeRun) return;

    let timer: NodeJS.Timeout;

    const checkRunStatus = async () => {
      try {
        const run = await researchService.getRun(activeRun.id);
        setActiveRun(run);

        if (run.status === 'COMPLETED') {
          setLoading(false);
          // Redirect to the newly generated report
          if (run.reportId) {
            navigate(`/reports/${run.reportId}`);
          } else {
            navigate('/reports');
          }
        } else if (run.status === 'FAILED') {
          setError(run.error || 'The AI research agent encountered a critical valuation error.');
          setLoading(false);
          setActiveRun(null);
        } else {
          // Poll again in 1.5 seconds
          timer = setTimeout(checkRunStatus, 1500);
        }
      } catch (err) {
        console.error('Error polling research job status:', err);
        // Fallback safety in case API connection fluctuates
        timer = setTimeout(checkRunStatus, 1500);
      }
    };

    timer = setTimeout(checkRunStatus, 1500);

    return () => clearTimeout(timer);
  }, [activeRun, navigate]);

  const steps = [
    'Gathering Filings',
    'Extracting Financials',
    'Sentiment Modeling',
    'DCF Valuation',
    'Report Synthesis'
  ];

  const getStepIndex = (run: ResearchRun) => {
    if (run.progress < 20) return 0;
    if (run.progress < 45) return 1;
    if (run.progress < 65) return 2;
    if (run.progress < 85) return 3;
    if (run.progress < 100) return 4;
    return 5;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">AI Research Composer</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Initiate an automated agentic run to gather SEC filings, compute valuations, and synthesize professional reports.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-4 text-xs font-semibold text-red-700 dark:text-red-400 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="space-y-1">
            <span className="block font-bold">Research Job Interrupted</span>
            <p className="text-zinc-600 dark:text-zinc-400 font-normal leading-normal">{error}</p>
          </div>
        </div>
      )}

      {/* Main Composer Panel */}
      {!activeRun ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Research Parameters</CardTitle>
            <CardDescription>Specify the target equity ticker and optional focus parameters.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleStartResearch} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <Input 
                    label="Stock Ticker Symbol"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL, NVDA"
                    maxLength={5}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Analysis Depth
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDepth('quick')}
                      className={`px-3 py-2 text-xs font-bold border rounded transition-all text-center ${
                        depth === 'quick' 
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-sm' 
                          : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      Quick Summary (~30s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepth('detailed')}
                      className={`px-3 py-2 text-xs font-bold border rounded transition-all text-center ${
                        depth === 'detailed' 
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-sm' 
                          : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      Detailed Valuation (~90s)
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Qualitative Focus Prompts (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Specify focus areas like: Evaluate the competitive threats from Chinese manufacturing, or project DCF valuations under a 15% CapEx increase..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-colors leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full font-bold text-sm py-2.5 rounded"
                  loading={loading}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-400 dark:text-indigo-600 shrink-0 animate-pulse" /> Execute AI Agent Run
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Visual Stepper Panel during Agent Runs */
        <Card className="shadow-sm border-zinc-300 dark:border-zinc-700">
          <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center text-base">
                  <RefreshCw className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400 animate-spin shrink-0" /> 
                  AI Research Agent in Progress
                </CardTitle>
                <CardDescription>Analyzing {activeRun.ticker} against current SEC database models.</CardDescription>
              </div>
              <span className="font-mono text-xs bg-zinc-900 dark:bg-white text-white dark:text-black px-2.5 py-1 rounded font-bold">
                {activeRun.progress}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <ProgressStepper 
              steps={steps}
              currentStepIndex={getStepIndex(activeRun)}
              activeMessage={activeRun.step}
            />

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <span>Agent Execution Log</span>
              </div>
              <div className="font-mono text-xs space-y-2 max-h-36 overflow-y-auto leading-relaxed bg-black p-3.5 rounded text-zinc-300 border border-zinc-800">
                <div className="text-zinc-400">[00:01] Initiated worker thread for {activeRun.ticker}</div>
                {activeRun.progress >= 20 && <div className="text-zinc-400">[00:09] Successfully connected to SEC EDGAR archive feed</div>}
                {activeRun.progress >= 45 && <div className="text-zinc-400">[00:18] Extracted 3 years balance sheet metrics with 0.00% rounding error</div>}
                {activeRun.progress >= 65 && <div className="text-zinc-400">[00:32] Run finished on news sentiment model (Vibe-Scraper API)</div>}
                {activeRun.progress >= 85 && <div className="text-zinc-400">[00:48] Extrapolated cash flows; discount boundary set at 9.2% WACC</div>}
                {activeRun.progress >= 98 && <div className="text-zinc-400">[00:58] Assembled report file structure. Writing markdown sections...</div>}
                <div className="text-indigo-400 animate-pulse-subtle font-bold">&gt; {activeRun.step}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended sample prompts */}
      {!activeRun && (
        <div className="space-y-3.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <span>Recommended Research Prompts</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {samplePrompts.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplySample(sample)}
                className="w-full p-4 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-left transition-all hover:border-zinc-400 dark:hover:border-zinc-600 flex items-start justify-between group shadow-xs"
              >
                <div className="pr-4 space-y-1">
                  <span className="font-mono font-bold text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded inline-block">
                    {sample.ticker}
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1 group-hover:text-zinc-900 dark:group-hover:text-white">
                    "{sample.text}"
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 shrink-0 mt-1">Apply Prompt</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

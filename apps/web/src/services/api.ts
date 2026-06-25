import { apiClient } from '../lib/axios';
import { 
  Member, 
  ResearchReport, 
  ResearchRun, 
  WatchlistItem, 
  CompareResponse 
} from '../types/api';

// Temporary state store for mock runs, watchlists and reports to allow interactive creation/deletion in fallback mode
const mockReportsStore: ResearchReport[] = [
  {
    id: 'report-aapl',
    title: 'AI Investment Report: AAPL',
    summary: 'Apple Inc. exhibits strong operational cash flow, led by services acceleration, though hardware sales display cyclical maturity.',
    analysis: '### Executive Summary\nApple displays durable moat metrics driven by ecosystem lock-in...\n\n### Financial Valuation\nDiscounted Cash Flow modeling yields an intrinsic value of $195 per share, representing a 12% premium over current market pricing.\n\n### AI Narrative Risk Assessment\nCompetitive pressure in China represents a notable headwind, balanced by high-margin service revenue expansions.',
    createdById: 'mock-analyst-id-123',
    organizationId: 'mock-org-id-456',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    sentiment: 'BULLISH',
    sentimentScore: 78,
    tags: ['Technology', 'Consumer Electronics', 'Services Moat'],
    metrics: {
      peRatio: 28.4,
      eps: 6.43,
      marketCap: '3.12T',
      revenueGrowth: '+4.2%',
      profitMargin: '26.1%',
      debtEquity: '1.42'
    },
    keyDrivers: [
      'Services revenue expanding at 12% YoY, lifting gross margin profiles.',
      'Strong institutional shareholder base and aggressive share buybacks.',
      'Expanding install base reaching over 2.2 billion active devices.'
    ],
    risks: [
      'Regulatory scrutiny surrounding the App Store fee structures globally.',
      'Supply chain concentration in East Asia introducing geopolitical exposure.',
      'Saturation in premium smartphone markets slowing hardware cycles.'
    ],
    opportunities: [
      'Monetization of AI features (Apple Intelligence) across the active device base.',
      'Growth in wearable technologies and augmented reality integrations.',
      'Financial services expansion including savings accounts and tap-to-pay.'
    ],
    citations: [
      { id: 'c1', reportId: 'report-aapl', sourceName: 'SEC Form 10-K (Q4 2025)', snippet: 'Services revenue grew to $24.8 billion, representing a record high gross margin of 74.2%.', relevanceScore: 95 },
      { id: 'c2', reportId: 'report-aapl', sourceName: 'Bloomberg Tech Intelligence', snippet: 'Install base growth in emerging markets offsetting single-digit hardware contractions in China.', relevanceScore: 88 }
    ],
    stockHistory: [
      { date: 'Jan', price: 170 },
      { date: 'Feb', price: 175 },
      { date: 'Mar', price: 172 },
      { date: 'Apr', price: 180 },
      { date: 'May', price: 184 },
      { date: 'Jun', price: 190 }
    ]
  },
  {
    id: 'report-tsla',
    title: 'AI Investment Report: TSLA',
    summary: 'Tesla displays market leadership in global EV volume, though operating margins have compressed due to persistent pricing adjustments.',
    analysis: '### Executive Summary\nTesla remains the dominant electric vehicle manufacturer...\n\n### Financial Valuation\nDCF modeling implies a highly sensitive valuation ranging from $140 to $210 based on autonomous software adoption rates.\n\n### AI Narrative Risk Assessment\nMargins are heavily dependent on automotive price wars and Full Self-Driving (FSD) take rates.',
    createdById: 'mock-analyst-id-123',
    organizationId: 'mock-org-id-456',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    ticker: 'TSLA',
    companyName: 'Tesla Inc.',
    sentiment: 'NEUTRAL',
    sentimentScore: 52,
    tags: ['Automotive', 'Clean Energy', 'Autonomous Technology'],
    metrics: {
      peRatio: 54.2,
      eps: 3.12,
      marketCap: '580B',
      revenueGrowth: '-2.1%',
      profitMargin: '14.3%',
      debtEquity: '0.08'
    },
    keyDrivers: [
      'Highest margin EV operations globally despite recent price reductions.',
      'Industry-leading battery manufacturing scale and cost-efficiency.',
      'Large cash buffer of $29 billion to fund future gigafactories.'
    ],
    risks: [
      'Intensified competition from domestic EV manufacturers in the Chinese market.',
      'Slowing consumer adoption curves for battery electric vehicles globally.',
      'Key person risk and governance concerns regarding board oversight.'
    ],
    opportunities: [
      'Commercialization of FSD software licensing to traditional OEMs.',
      'Tesla Energy storage expansion (Megapacks) growing at triple-digit rates.',
      'Next-generation low-cost vehicle platform slated for late 2026 production.'
    ],
    citations: [
      { id: 'c3', reportId: 'report-tsla', sourceName: 'Tesla Investor Relations Q4', snippet: 'Energy storage deployments reached 14.7 GWh in 2025, a growth of 125% over the prior year.', relevanceScore: 92 },
      { id: 'c4', reportId: 'report-tsla', sourceName: 'NHTSA Safety Filings', snippet: 'Investigation into Autopilot safety margins continues to require software OTA updates.', relevanceScore: 82 }
    ],
    stockHistory: [
      { date: 'Jan', price: 210 },
      { date: 'Feb', price: 190 },
      { date: 'Mar', price: 175 },
      { date: 'Apr', price: 171 },
      { date: 'May', price: 182 },
      { date: 'Jun', price: 178 }
    ]
  },
  {
    id: 'report-msft',
    title: 'AI Investment Report: MSFT',
    summary: 'Microsoft shows exceptional secular tailwinds from Azure AI integration, sustaining high operating margins and recurring revenue strength.',
    analysis: '### Executive Summary\nMicrosoft Azure cloud infrastructure is capturing significant AI enterprise spend...\n\n### Financial Valuation\nDCF intrinsic value estimate is $465, backed by robust free cash flow yields and enterprise pricing power.\n\n### AI Narrative Risk Assessment\nCapital expenditures are elevated, but justified by early commercial traction of Copilot suites.',
    createdById: 'mock-analyst-id-123',
    organizationId: 'mock-org-id-456',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    ticker: 'MSFT',
    companyName: 'Microsoft Corp.',
    sentiment: 'BULLISH',
    sentimentScore: 88,
    tags: ['Cloud Infrastructure', 'Enterprise Software', 'Artificial Intelligence'],
    metrics: {
      peRatio: 36.1,
      eps: 11.85,
      marketCap: '3.19T',
      revenueGrowth: '+14.8%',
      profitMargin: '35.4%',
      debtEquity: '0.45'
    },
    keyDrivers: [
      'Azure Cloud service growth consistently leading hyperscaler peers.',
      'Deep strategic partnership with OpenAI securing early generative AI market share.',
      'Office 365 commercial suites maintaining high average revenue per user (ARPU).'
    ],
    risks: [
      'Extremely high capital expenditure requirements for server hardware and GPUs.',
      'Antitrust reviews surrounding cloud bundling and AI partnership agreements.',
      'Potential corporate productivity tool fatigue slowing Copilot adoption.'
    ],
    opportunities: [
      'GitHub Copilot expanding developers productivity gains and subscriptions.',
      'Cloud database migration of massive legacy enterprise applications to Azure.',
      'Integration of AI search features directly into corporate CRM software platforms.'
    ],
    citations: [
      { id: 'c5', reportId: 'report-msft', sourceName: 'Microsoft FY25 Q2 Earnings Call', snippet: 'Azure and other cloud services revenue grew 30%, driven by robust enterprise demand for AI integrations.', relevanceScore: 97 },
      { id: 'c6', reportId: 'report-msft', sourceName: 'Gartner Cloud Magic Quadrant', snippet: 'Microsoft Azure positioned at the absolute forefront of AI platform capabilities among hyperscalers.', relevanceScore: 91 }
    ],
    stockHistory: [
      { date: 'Jan', price: 380 },
      { date: 'Feb', price: 410 },
      { date: 'Mar', price: 415 },
      { date: 'Apr', price: 422 },
      { date: 'May', price: 430 },
      { date: 'Jun', price: 442 }
    ]
  }
];

const mockWatchlistStore: WatchlistItem[] = [
  { id: 'w1', watchlistId: 'wl-1', ticker: 'AAPL', companyName: 'Apple Inc.', price: 189.45, change: 1.24, sentiment: 'BULLISH', trendScore: 78, history: [184, 185, 183, 186, 188, 189], addedAt: new Date().toISOString() },
  { id: 'w2', watchlistId: 'wl-1', ticker: 'TSLA', companyName: 'Tesla Inc.', price: 178.18, change: -2.85, sentiment: 'NEUTRAL', trendScore: 52, history: [184, 182, 185, 180, 179, 178], addedAt: new Date().toISOString() },
  { id: 'w3', watchlistId: 'wl-1', ticker: 'MSFT', companyName: 'Microsoft Corp.', price: 442.12, change: 0.82, sentiment: 'BULLISH', trendScore: 88, history: [430, 432, 435, 438, 440, 442], addedAt: new Date().toISOString() },
  { id: 'w4', watchlistId: 'wl-1', ticker: 'NVDA', companyName: 'Nvidia Corp.', price: 924.15, change: 4.16, sentiment: 'BULLISH', trendScore: 94, history: [880, 890, 910, 905, 912, 924], addedAt: new Date().toISOString() },
  { id: 'w5', watchlistId: 'wl-1', ticker: 'AMZN', companyName: 'Amazon.com Inc.', price: 185.50, change: -0.45, sentiment: 'BULLISH', trendScore: 72, history: [186, 187, 185, 184, 186, 185], addedAt: new Date().toISOString() }
];

const mockRunsStore: Map<string, ResearchRun> = new Map();
const mockMembersStore: Member[] = [
  {
    id: 'm1',
    userId: 'mock-analyst-id-123',
    organizationId: 'mock-org-id-456',
    role: 'ADMIN',
    user: {
      id: 'mock-analyst-id-123',
      name: 'Sourya Analyst',
      email: 'sourya@klypup.com',
      createdAt: new Date().toISOString()
    }
  },
  {
    id: 'm2',
    userId: 'mock-analyst-id-234',
    organizationId: 'mock-org-id-456',
    role: 'ANALYST',
    user: {
      id: 'mock-analyst-id-234',
      name: 'Jessica Reynolds',
      email: 'jessica@klypup.com',
      createdAt: new Date(Date.now() - 3600000 * 100).toISOString()
    }
  },
  {
    id: 'm3',
    userId: 'mock-analyst-id-345',
    organizationId: 'mock-org-id-456',
    role: 'VIEWER',
    user: {
      id: 'mock-analyst-id-345',
      name: 'Marcus Vance',
      email: 'marcus@klypup.com',
      createdAt: new Date(Date.now() - 3600000 * 200).toISOString()
    }
  }
];

// Helper to simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const orgService = {
  getMembers: async (): Promise<Member[]> => {
    try {
      const response = await apiClient.get('/orgs/me');
      if (response.data?.success && response.data?.data?.members) {
        return response.data.data.members;
      }
      return mockMembersStore;
    } catch (e) {
      console.warn('Orgs API failed. Returning mock members.');
      return mockMembersStore;
    }
  },

  inviteMember: async (email: string, role: string): Promise<void> => {
    try {
      await apiClient.post('/orgs/invite', { email, role });
    } catch (e) {
      console.warn('Orgs Invite API failed. Adding mock member locally.');
      const newMember: Member = {
        id: `mock-member-${Date.now()}`,
        userId: `mock-user-${Date.now()}`,
        organizationId: 'mock-org-id-456',
        role: role as any,
        user: {
          id: `mock-user-${Date.now()}`,
          name: email.split('@')[0],
          email,
          createdAt: new Date().toISOString()
        }
      };
      mockMembersStore.push(newMember);
      await delay(500);
    }
  }
};

export const researchService = {
  getReports: async (): Promise<ResearchReport[]> => {
    try {
      const response = await apiClient.get('/research/reports');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return mockReportsStore;
    } catch (e) {
      console.warn('Reports API failed. Returning mock reports store.');
      return mockReportsStore;
    }
  },

  getReport: async (id: string): Promise<ResearchReport> => {
    try {
      const response = await apiClient.get(`/research/reports/${id}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn(`Report API for ${id} failed. Attempting store lookup.`);
    }
    const report = mockReportsStore.find((r) => r.id === id);
    if (!report) throw new Error('Report not found');
    return report;
  },

  updateReport: async (id: string, title: string, tags: string[]): Promise<ResearchReport> => {
    try {
      const response = await apiClient.patch(`/research/reports/${id}`, { title, tags });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn(`Update Report API for ${id} failed. Saving locally.`);
    }
    const report = mockReportsStore.find((r) => r.id === id);
    if (!report) throw new Error('Report not found');
    report.title = title;
    report.tags = tags;
    await delay(300);
    return report;
  },

  deleteReport: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/research/reports/${id}`);
    } catch (e) {
      console.warn(`Delete Report API for ${id} failed. Deleting locally.`);
    }
    const idx = mockReportsStore.findIndex((r) => r.id === id);
    if (idx !== -1) mockReportsStore.splice(idx, 1);
    await delay(300);
  },

  createRun: async (ticker: string, prompt: string): Promise<ResearchRun> => {
    const tickerUpper = ticker.toUpperCase();
    try {
      const response = await apiClient.post('/research/runs', { ticker: tickerUpper, prompt });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn('Create Run API failed. Initiating mock background job runner.');
    }

    const runId = `run-${Date.now()}`;
    const newRun: ResearchRun = {
      id: runId,
      ticker: tickerUpper,
      status: 'PENDING',
      progress: 5,
      step: 'Initiating financial research agent...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockRunsStore.set(runId, newRun);
    
    // Simulate background updates on the mock run
    simulateMockRunUpdates(runId, tickerUpper);
    
    return newRun;
  },

  getRun: async (id: string): Promise<ResearchRun> => {
    try {
      const response = await apiClient.get(`/research/runs/${id}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      // ignore
    }
    
    const run = mockRunsStore.get(id);
    if (!run) throw new Error('Research run job not found');
    return run;
  }
};

// Simulate asynchronous status updates for mock runs
async function simulateMockRunUpdates(runId: string, ticker: string) {
  const steps = [
    { progress: 20, step: 'Connecting to SEC filing databases and financial aggregators...' },
    { progress: 45, step: 'Extracting historical income statements, balance sheets, and cash flows...' },
    { progress: 65, step: 'Analyzing qualitative risk factors and parsing recent news sentiment...' },
    { progress: 85, step: 'Calculating DCF valuation models and narrative risk parameters...' },
    { progress: 98, step: 'Synthesizing report sections and compiling verified source citations...' },
    { progress: 100, step: 'Completed' }
  ];

  for (const item of steps) {
    await delay(1500); // 1.5s per step progress
    const run = mockRunsStore.get(runId);
    if (!run) break;

    run.progress = item.progress;
    run.step = item.step;
    run.updatedAt = new Date().toISOString();

    if (item.progress === 100) {
      run.status = 'COMPLETED';
      
      // Synthesize a complete high-fidelity report in the local mock database
      const reportId = `report-${ticker.toLowerCase()}-${Date.now()}`;
      run.reportId = reportId;

      const companyName = getCompanyName(ticker);
      const peRatio = +(18 + Math.random() * 25).toFixed(1);
      const eps = +(2 + Math.random() * 8).toFixed(2);
      const marketCap = `${(100 + Math.random() * 900).toFixed(1)}B`;
      
      const generatedReport: ResearchReport = {
        id: reportId,
        title: `AI Investment Report: ${ticker}`,
        summary: `Synthesized research for ${companyName} (${ticker}). AI analysis reveals strong underlying fundamentals balanced by rising sector headwinds.`,
        analysis: `### Executive Summary\n${companyName} exhibits durable operational momentum...\n\n### Financial Valuation\nDiscounted Cash Flow modeling yields an intrinsic value with a favorable risk-reward boundary.\n\n### AI Narrative Risk Assessment\nMedium risk profile with strong growth opportunities in core product segments.`,
        createdById: 'mock-analyst-id-123',
        organizationId: 'mock-org-id-456',
        createdAt: new Date().toISOString(),
        ticker,
        companyName,
        sentiment: Math.random() > 0.4 ? 'BULLISH' : 'NEUTRAL',
        sentimentScore: Math.floor(50 + Math.random() * 45),
        tags: ['Technology', 'AI Research', 'Growth Equity'],
        metrics: {
          peRatio,
          eps,
          marketCap,
          revenueGrowth: '+12.4%',
          profitMargin: '18.9%',
          debtEquity: '0.62'
        },
        keyDrivers: [
          'Robust operating cash generation supporting continuous capital reinvestment.',
          'Accelerating product cycle with high market-share retention rates.',
          'Prudent balance sheet leverage metrics offering high downside protection.'
        ],
        risks: [
          'High reliance on key supplier components causing manufacturing bottlenecks.',
          'Evolving regional regulatory frameworks impacting operations.',
          'Currency exchange rate volatility impacting international retail gross margins.'
        ],
        opportunities: [
          'Direct expansion into adjacent B2B enterprise software applications.',
          'Integration of advanced automation layers across the global logistics network.',
          'Capitalizing on underserved digital services sectors in emerging markets.'
        ],
        citations: [
          { id: `c-new-1`, reportId, sourceName: `${companyName} SEC Form 10-K`, snippet: 'Company reports continued margin improvements driven by operational optimization layers.', relevanceScore: 94 },
          { id: `c-new-2`, reportId, sourceName: 'Market Intelligence Report', snippet: 'Market share growth remains robust, capturing 42% of newly addressed sectors.', relevanceScore: 89 }
        ],
        stockHistory: [
          { date: 'Jan', price: 100 },
          { date: 'Feb', price: 105 },
          { date: 'Mar', price: 102 },
          { date: 'Apr', price: 112 },
          { date: 'May', price: 118 },
          { date: 'Jun', price: 125 }
        ]
      };

      mockReportsStore.unshift(generatedReport);
    }
    
    mockRunsStore.set(runId, run);
  }
}

function getCompanyName(ticker: string): string {
  const map: Record<string, string> = {
    AAPL: 'Apple Inc.',
    TSLA: 'Tesla Inc.',
    MSFT: 'Microsoft Corp.',
    NVDA: 'Nvidia Corp.',
    AMZN: 'Amazon.com Inc.',
    GOOGL: 'Alphabet Inc.',
    META: 'Meta Platforms Inc.',
    NFLX: 'Netflix Inc.'
  };
  return map[ticker] || `${ticker} Technologies Co.`;
}

export const watchlistService = {
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    try {
      const response = await apiClient.get('/watchlist');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return mockWatchlistStore;
    } catch (e) {
      console.warn('Watchlist API failed. Returning mock watchlist store.');
      return mockWatchlistStore;
    }
  },

  addToWatchlist: async (ticker: string): Promise<WatchlistItem> => {
    const tickerUpper = ticker.toUpperCase();
    try {
      const response = await apiClient.post('/watchlist', { ticker: tickerUpper });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn(`Watchlist Add API for ${tickerUpper} failed. Adding locally.`);
    }

    const companyName = getCompanyName(tickerUpper);
    const newItem: WatchlistItem = {
      id: `w-${Date.now()}`,
      watchlistId: 'wl-1',
      ticker: tickerUpper,
      companyName,
      price: +(100 + Math.random() * 400).toFixed(2),
      change: +(Math.random() * 8 - 4).toFixed(2),
      sentiment: Math.random() > 0.5 ? 'BULLISH' : 'NEUTRAL',
      trendScore: Math.floor(40 + Math.random() * 55),
      addedAt: new Date().toISOString(),
      history: Array.from({ length: 6 }, () => +(100 + Math.random() * 200).toFixed(0))
    };

    mockWatchlistStore.unshift(newItem);
    await delay(300);
    return newItem;
  },

  removeFromWatchlist: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/watchlist/${id}`);
    } catch (e) {
      console.warn(`Watchlist Delete API for ${id} failed. Removing locally.`);
    }

    const idx = mockWatchlistStore.findIndex((w) => w.id === id);
    if (idx !== -1) {
      mockWatchlistStore.splice(idx, 1);
    }
    await delay(200);
  }
};

export const compareService = {
  compareCompanies: async (tickers: string[]): Promise<CompareResponse> => {
    const uppercaseTickers = tickers.map((t) => t.toUpperCase());
    try {
      const response = await apiClient.post('/compare', { tickers: uppercaseTickers });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn('Comparison API failed. Building robust side-by-side comparative simulation.');
    }

    await delay(800);

    const companies = uppercaseTickers.map((ticker) => {
      const name = getCompanyName(ticker);
      const isAapl = ticker === 'AAPL';
      const isMsft = ticker === 'MSFT';
      
      const metrics = {
        peRatio: isAapl ? 28.4 : isMsft ? 36.1 : 24.5,
        eps: isAapl ? 6.43 : isMsft ? 11.85 : 4.25,
        marketCap: isAapl ? '3.12T' : isMsft ? '3.19T' : '1.85T',
        revenue: isAapl ? '$383.2B' : isMsft ? '$227.6B' : '$154.3B',
        revenueGrowth: isAapl ? '+4.2%' : isMsft ? '+14.8%' : '+8.6%',
        profitMargin: isAapl ? '26.1%' : isMsft ? '35.4%' : '21.2%',
        debtEquity: isAapl ? '1.42' : isMsft ? '0.45' : '0.82',
        pbRatio: isAapl ? 34.1 : isMsft ? 12.4 : 6.8,
        dividendYield: isAapl ? '0.52%' : isMsft ? '0.68%' : 'N/A'
      };

      return {
        ticker,
        companyName: name,
        metrics,
        strengths: [
          isAapl ? 'Exceptional hardware ecosystem lock-in and pricing power.' : 'Azure AI cloud segment acceleration.',
          'Consistent, high operating cash flows supporting capital distributions.'
        ],
        weaknesses: [
          isAapl ? 'Cyclical dependence on hardware sales.' : 'Elevated capital expenditure on data centers.',
          'Increasing regional regulatory antitrust scrutiny.'
        ],
        sources: [
          `${name} SEC Form 10-K Filings`,
          'Consensus analyst estimates and market pricing metrics'
        ]
      };
    });

    const comparisonChart = [
      { metric: 'P/E Ratio', ...Object.fromEntries(companies.map((c) => [c.ticker, c.metrics.peRatio])) },
      { metric: 'Operating Margin (%)', ...Object.fromEntries(companies.map((c) => [c.ticker, parseFloat(c.metrics.profitMargin)])) },
      { metric: 'Revenue Growth (%)', ...Object.fromEntries(companies.map((c) => [c.ticker, parseFloat(c.metrics.revenueGrowth)])) },
      { metric: 'Debt-to-Equity Ratio', ...Object.fromEntries(companies.map((c) => [c.ticker, parseFloat(c.metrics.debtEquity) * 10])) } // Scaled for display
    ];

    return {
      companies,
      summary: `Side-by-side analysis demonstrates that ${uppercaseTickers.join(' and ')} offer distinct investment profiles. ${uppercaseTickers[0]} represents a high-margin business with durable cash flow patterns, whereas ${uppercaseTickers[1] || 'peers'} display elevated growth capabilities fueled by cloud computing and generative AI infrastructure spend.`,
      comparisonChart
    };
  }
};

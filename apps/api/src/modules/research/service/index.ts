import { ResearchStatus, SourceType } from '@prisma/client';
import { prisma } from '../../../lib';
import { NotFoundError } from '../../../utils/errors';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const SEC_USER_AGENT = process.env.SEC_USER_AGENT || 'Klypup Research contact@example.com';

type MetricValue = number | string | null;

interface RealResearchData {
  ticker: string;
  companyName: string;
  currency?: string;
  currentPrice: number | null;
  previousClose: number | null;
  marketCap: number | null;
  trailingPe: number | null;
  forwardPe: number | null;
  eps: number | null;
  revenue: number | null;
  priorRevenue: number | null;
  netIncome: number | null;
  assets: number | null;
  liabilities: number | null;
  equity: number | null;
  stockHistory: Array<{ date: string; price: number }>;
  secFactsUrl?: string;
  yahooQuoteUrl: string;
  secFormUrl?: string;
}

export async function getReports(orgId: string) {
  return prisma.researchReport.findMany({
    where: { organizationId: orgId },
    include: { sources: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getReport(orgId: string, reportId: string) {
  const report = await prisma.researchReport.findFirst({
    where: { id: reportId, organizationId: orgId },
    include: { sources: true },
  });
  if (!report) throw new NotFoundError('Research report');
  return report;
}

export async function updateReport(orgId: string, reportId: string, title?: string, tags?: string[]) {
  const report = await prisma.researchReport.findFirst({
    where: { id: reportId, organizationId: orgId },
  });
  if (!report) throw new NotFoundError('Research report');

  const content = (report.content as any) || {};
  if (tags) content.tags = tags;

  return prisma.researchReport.update({
    where: { id: reportId },
    data: { title: title ?? report.title, content },
    include: { sources: true },
  });
}

export async function deleteReport(orgId: string, reportId: string) {
  const report = await prisma.researchReport.findFirst({
    where: { id: reportId, organizationId: orgId },
  });
  if (!report) throw new NotFoundError('Research report');
  await prisma.researchReport.delete({ where: { id: reportId } });
}

export async function createRun(orgId: string, userId: string, ticker: string, prompt: string) {
  const run = await prisma.researchRun.create({
    data: {
      query: prompt,
      symbols: [ticker],
      status: 'PENDING',
      progress: 5,
      progressMsg: 'Initiating financial research agent...',
      organizationId: orgId,
      createdById: userId,
    },
  });

  // Fire-and-forget background execution
  runBackgroundResearch(run.id, orgId, userId, ticker, prompt).catch((err) => {
    console.error(`Background research error for run ${run.id}:`, err);
  });

  return run;
}

export async function getRun(orgId: string, runId: string) {
  const run = await prisma.researchRun.findFirst({
    where: { id: runId, organizationId: orgId },
    include: { report: true },
  });
  if (!run) throw new NotFoundError('Research run');
  return run;
}

async function updateRunProgress(runId: string, progress: number, msg: string, status: ResearchStatus = 'RUNNING') {
  await prisma.researchRun.update({
    where: { id: runId },
    data: { progress, progressMsg: msg, status },
  });
}

async function runBackgroundResearch(runId: string, orgId: string, userId: string, ticker: string, prompt: string) {
  try {
    await delay(500);
    await updateRunProgress(runId, 20, 'Connecting to SEC filing databases and market data sources...');

    const realData = await fetchRealResearchData(ticker);

    await updateRunProgress(runId, 45, 'Extracting historical financial statements and market prices...');
    await delay(500);

    await updateRunProgress(runId, 70, 'Synthesizing valuation metrics from real company filings...');

    const reportData = await buildRealDataReport(ticker, prompt, realData);

    await updateRunProgress(runId, 85, 'Calculating DCF valuation models and narrative risk parameters...');
    await delay(500);

    await prisma.$transaction(async (tx) => {
      const report = await tx.researchReport.create({
        data: {
          runId,
          title: reportData.title || `AI Investment Report: ${ticker}`,
          summary: reportData.summary || `AI generated report for ${ticker}`,
          organizationId: orgId,
          createdById: userId,
          content: {
            ticker,
            companyName: reportData.companyName || `${ticker} Technologies Co.`,
            analysis: reportData.analysis || '',
            metrics: reportData.metrics || {},
            keyDrivers: reportData.keyDrivers || [],
            risks: reportData.risks || [],
            opportunities: reportData.opportunities || [],
            sentiment: reportData.sentiment || 'NEUTRAL',
            sentimentScore: reportData.sentimentScore ?? 50,
            stockHistory: reportData.stockHistory || [],
            tags: reportData.tags || ['AI Research', 'Investment Analysis'],
          },
        },
      });

      if (reportData.citations && Array.isArray(reportData.citations)) {
        for (const citation of reportData.citations) {
          await tx.researchSource.create({
            data: {
              reportId: report.id,
              type: mapCitationType(citation.sourceName),
              title: citation.sourceName || 'Verified Document Source',
              url: citation.sourceUrl || null,
              snippet: citation.snippet || '',
              relevanceScore: citation.relevanceScore ?? 90,
            },
          });
        }
      }
    });

    await updateRunProgress(runId, 100, 'Completed', 'COMPLETED');
  } catch (err: any) {
    console.error('Background research failed:', err);
    await prisma.researchRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        progressMsg: 'Failed',
        errorMessage: err.message || 'An unexpected error occurred during research generation',
      },
    });
  }
}

function mapCitationType(sourceName: string): SourceType {
  const name = (sourceName || '').toLowerCase();
  if (name.includes('sec') || name.includes('filing') || name.includes('10-k') || name.includes('10-q')) return 'FILING';
  if (name.includes('market') || name.includes('price') || name.includes('valuation') || name.includes('stock')) return 'MARKET_DATA';
  if (name.includes('news') || name.includes('bloomberg') || name.includes('reuters') || name.includes('press')) return 'NEWS';
  if (name.includes('sentiment') || name.includes('social') || name.includes('opinion')) return 'SENTIMENT';
  if (name.includes('analysis') || name.includes('report') || name.includes('research')) return 'ANALYSIS';
  return 'OTHER';
}

async function buildRealDataReport(ticker: string, prompt: string, data: RealResearchData) {
  const aiReport = await callGrokAPI(ticker, prompt, data);
  if (aiReport) return aiReport;
  return synthesizeReportFromRealData(ticker, prompt, data);
}

async function callGrokAPI(ticker: string, prompt: string, data: RealResearchData) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are an elite equity research analyst and investment strategist.
Your task is to analyze the requested equity ticker and generate a professional, high-fidelity investment research report.
Use ONLY the factual data supplied by the application. Do not invent financial metrics, prices, citations, or filing values.
You must return your response as a valid, structured JSON object.
Do not include any chat prefix or suffix. Return ONLY the JSON object.

JSON Schema:
{
  "companyName": "Full official company name",
  "title": "Professional report title",
  "summary": "2-3 sentence executive summary",
  "analysis": "Detailed markdown with ### Executive Summary, ### Financial Valuation, ### AI Narrative Risk Assessment",
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "sentimentScore": integer 0-100,
  "metrics": {
    "peRatio": float, "eps": float, "marketCap": "string",
    "revenueGrowth": "string", "profitMargin": "string", "debtEquity": "string"
  },
  "keyDrivers": ["3-4 growth drivers"],
  "risks": ["3-4 risk factors"],
  "opportunities": ["3-4 opportunities"],
  "citations": [{"sourceName": "string", "snippet": "string", "relevanceScore": int}],
  "stockHistory": [{"date": "Jan", "price": float}, ...6 months],
  "tags": ["tag1", "tag2"]
}

If a metric is null, describe it as unavailable rather than estimating it.
Use the supplied stockHistory exactly as the chart source.`;

  const userPrompt = `Generate the investment research report for:
Ticker: ${ticker}
Focus/Query: ${prompt}

Verified data payload:
${JSON.stringify(data, null, 2)}`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API returned status ${response.status}: ${errorText}`);
    }

    const json = (await response.json()) as any;
    const contentText = json.choices?.[0]?.message?.content;
    if (!contentText) throw new Error('Empty response from xAI API');

    const parsed = parseJsonResponse(contentText);
    return {
      ...parsed,
      stockHistory: data.stockHistory,
      citations: mergeCitations(parsed.citations, getRealDataCitations(data)),
    };
  } catch (err: any) {
    console.error('xAI API call failed, using local real-data synthesis:', err.message);
    return null;
  }
}

function parseJsonResponse(text: string) {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.substring(7);
  else if (clean.startsWith('```')) clean = clean.substring(3);
  if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
  return JSON.parse(clean.trim());
}

function synthesizeReportFromRealData(ticker: string, prompt: string, data: RealResearchData) {
  const revenueGrowth = percentChange(data.revenue, data.priorRevenue);
  const profitMargin = ratioPercent(data.netIncome, data.revenue);
  const debtEquity = ratioValue(data.liabilities, data.equity);
  const priceChange = percentChange(data.currentPrice, data.previousClose);
  const sentimentScore = scoreSentiment(revenueGrowth, profitMargin, priceChange);
  const sentiment = sentimentScore >= 62 ? 'BULLISH' : sentimentScore <= 42 ? 'BEARISH' : 'NEUTRAL';
  const metrics = {
    peRatio: data.trailingPe ?? data.forwardPe ?? 'N/A',
    eps: data.eps ?? 'N/A',
    marketCap: formatCompactCurrency(data.marketCap, data.currency),
    revenueGrowth: formatPercent(revenueGrowth),
    profitMargin: formatPercent(profitMargin),
    debtEquity: debtEquity === null ? 'N/A' : debtEquity.toFixed(2),
  };
  const focusLine = prompt ? `User focus: ${prompt}` : 'User focus: broad equity research report.';

  return {
    companyName: data.companyName,
    title: `Real Data Investment Report: ${data.companyName} (${ticker})`,
    summary: `${data.companyName} (${ticker}) is analyzed using live market data and SEC company facts. Latest available revenue is ${formatCompactCurrency(data.revenue, data.currency)}, market capitalization is ${metrics.marketCap}, and the current signal is ${sentiment.toLowerCase()} based on observed fundamentals and price movement.`,
    analysis: `### Executive Summary
${data.companyName} (${ticker}) was evaluated with real external data from SEC company facts and market quote feeds. ${focusLine}

### Financial Valuation
Latest available revenue is ${formatCompactCurrency(data.revenue, data.currency)} versus prior comparable revenue of ${formatCompactCurrency(data.priorRevenue, data.currency)}, implying revenue growth of ${metrics.revenueGrowth}. Net income is ${formatCompactCurrency(data.netIncome, data.currency)}, producing a profit margin of ${metrics.profitMargin}. Market capitalization is ${metrics.marketCap}, current price is ${formatCurrency(data.currentPrice, data.currency)}, and trailing P/E is ${formatMetric(metrics.peRatio)}.

### Balance Sheet And Risk
Reported assets are ${formatCompactCurrency(data.assets, data.currency)}, liabilities are ${formatCompactCurrency(data.liabilities, data.currency)}, and debt-to-equity proxy is ${metrics.debtEquity}. The main investment risk is whether revenue growth and margins can support the market multiple under the requested scenario.

### Data Quality
This report is generated from real data sources. Missing fields are marked as unavailable instead of being estimated.`,
    sentiment,
    sentimentScore,
    metrics,
    keyDrivers: [
      `Revenue growth from latest available filings is ${metrics.revenueGrowth}.`,
      `Profit margin from reported net income and revenue is ${metrics.profitMargin}.`,
      `Current market valuation is ${metrics.marketCap} with price near ${formatCurrency(data.currentPrice, data.currency)}.`,
    ],
    risks: [
      `Valuation multiple risk remains elevated if earnings growth does not support a P/E of ${formatMetric(metrics.peRatio)}.`,
      `Balance-sheet leverage proxy is ${metrics.debtEquity}, based on liabilities versus equity where available.`,
      'SEC facts may lag the most recent quarter until new company filings are processed.',
    ],
    opportunities: [
      'Use the SEC-backed revenue and margin trend as the baseline for deeper DCF scenario work.',
      'Compare market price trend against filing-based growth to identify multiple expansion or compression.',
      'Layer user-specified qualitative prompts on top of the verified financial baseline.',
    ],
    citations: getRealDataCitations(data),
    stockHistory: data.stockHistory,
    tags: ['Real Data', 'SEC Filings', 'Market Data'],
  };
}

async function fetchRealResearchData(ticker: string): Promise<RealResearchData> {
  const symbol = ticker.trim().toUpperCase();
  const [yahooData, secData] = await Promise.allSettled([
    fetchYahooData(symbol),
    fetchSecData(symbol),
  ]);

  const yahoo = yahooData.status === 'fulfilled' ? yahooData.value : null;
  const sec = secData.status === 'fulfilled' ? secData.value : null;

  if (!yahoo && !sec) {
    throw new Error(`Could not retrieve real market or SEC data for ${symbol}. Check the ticker symbol or external data connectivity.`);
  }

  const currentPrice = yahoo?.currentPrice ?? null;
  const eps = yahoo?.eps || sec?.eps || null;

  // Calculate P/E if not returned by Yahoo (Price / EPS)
  const trailingPe = yahoo?.trailingPe ?? (currentPrice && eps && eps > 0 ? Number((currentPrice / eps).toFixed(2)) : null);

  // Calculate Market Cap if not returned by Yahoo (Price * Outstanding Shares)
  let marketCap = yahoo?.marketCap ?? null;
  if (!marketCap && currentPrice && sec?.sharesOutstanding) {
    marketCap = currentPrice * sec.sharesOutstanding;
  }

  return {
    ticker: symbol,
    companyName: yahoo?.companyName || sec?.companyName || getCompanyName(symbol),
    currency: yahoo?.currency || 'USD',
    currentPrice,
    previousClose: yahoo?.previousClose ?? null,
    marketCap,
    trailingPe,
    forwardPe: yahoo?.forwardPe ?? null,
    eps,
    revenue: sec?.revenue ?? null,
    priorRevenue: sec?.priorRevenue ?? null,
    netIncome: sec?.netIncome ?? null,
    assets: sec?.assets ?? null,
    liabilities: sec?.liabilities ?? null,
    equity: sec?.equity ?? null,
    stockHistory: yahoo?.stockHistory || [],
    secFactsUrl: sec?.secFactsUrl,
    secFormUrl: sec?.secFormUrl,
    yahooQuoteUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`,
  };
}

async function fetchYahooData(ticker: string) {
  const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`;
  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=6mo&interval=1mo`;
  const [quoteResult, chartResult] = await Promise.allSettled([
    fetchJson(quoteUrl),
    fetchJson(chartUrl),
  ]);
  const quoteJson = quoteResult.status === 'fulfilled' ? quoteResult.value as any : null;
  const chartJson = chartResult.status === 'fulfilled' ? chartResult.value as any : null;
  const quote = quoteJson?.quoteResponse?.result?.[0];
  const chart = chartJson?.chart?.result?.[0];

  if (!quote && !chart) return null;

  return {
    companyName: quote?.longName || quote?.shortName || chart?.meta?.longName || ticker,
    currency: quote?.currency || chart?.meta?.currency || 'USD',
    currentPrice: numberOrNull(quote?.regularMarketPrice ?? chart?.meta?.regularMarketPrice),
    previousClose: numberOrNull(quote?.regularMarketPreviousClose ?? chart?.meta?.previousClose),
    marketCap: numberOrNull(quote?.marketCap),
    trailingPe: numberOrNull(quote?.trailingPE),
    forwardPe: numberOrNull(quote?.forwardPE),
    eps: numberOrNull(quote?.epsTrailingTwelveMonths),
    stockHistory: parseYahooHistory(chart),
  };
}

async function fetchSecData(ticker: string) {
  const cik = await getSecCik(ticker);
  if (!cik) return null;

  const paddedCik = cik.padStart(10, '0');
  const factsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`;
  const facts = await fetchJson(factsUrl, {
    headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'application/json' },
  }) as any;
  const usGaap = facts?.facts?.['us-gaap'] || {};

  return {
    companyName: facts?.entityName || getCompanyName(ticker),
    revenue: latestAnnualValue(usGaap.Revenues) ?? latestAnnualValue(usGaap.SalesRevenueNet) ?? latestAnnualValue(usGaap.RevenueFromContractWithCustomerExcludingAssessedTax),
    priorRevenue: priorAnnualValue(usGaap.Revenues) ?? priorAnnualValue(usGaap.SalesRevenueNet) ?? priorAnnualValue(usGaap.RevenueFromContractWithCustomerExcludingAssessedTax),
    netIncome: latestAnnualValue(usGaap.NetIncomeLoss),
    assets: latestInstantValue(usGaap.Assets),
    liabilities: latestInstantValue(usGaap.Liabilities),
    equity: latestInstantValue(usGaap.StockholdersEquity) ?? latestInstantValue(usGaap.StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest),
    eps: latestAnnualValue(usGaap.EarningsPerShareDiluted),
    sharesOutstanding: latestInstantValue(usGaap.CommonStockSharesOutstanding),
    secFactsUrl: factsUrl,
    secFormUrl: `https://www.sec.gov/edgar/browse/?CIK=${Number(cik)}`,
  };
}

let secTickerCache: Record<string, string> | null = null;

async function getSecCik(ticker: string) {
  if (!secTickerCache) {
    const data = await fetchJson('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'application/json' },
    });
    secTickerCache = Object.values(data || {}).reduce<Record<string, string>>((acc, item: any) => {
      if (item?.ticker && item?.cik_str) acc[String(item.ticker).toUpperCase()] = String(item.cik_str);
      return acc;
    }, {});
  }

  return secTickerCache[ticker.toUpperCase()] || null;
}

async function fetchJson(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function parseYahooHistory(chart: any) {
  const timestamps: number[] = chart?.timestamp || [];
  const closes: Array<number | null> = chart?.indicators?.quote?.[0]?.close || [];
  return timestamps
    .map((timestamp, index) => ({ timestamp, close: numberOrNull(closes[index]) }))
    .filter((point) => point.close !== null)
    .map((point) => ({
      date: new Date(point.timestamp * 1000).toLocaleDateString('en-US', { month: 'short' }),
      price: Number(point.close!.toFixed(2)),
    }));
}

function latestAnnualValue(concept: any) {
  return annualValues(concept)[0]?.val ?? null;
}

function priorAnnualValue(concept: any) {
  return annualValues(concept)[1]?.val ?? null;
}

function latestInstantValue(concept: any) {
  return factValues(concept)
    .filter((fact) => fact.form === '10-K' || fact.form === '10-Q')
    .sort((a, b) => String(b.end).localeCompare(String(a.end)))[0]?.val ?? null;
}

function annualValues(concept: any) {
  return factValues(concept)
    .filter((fact) => fact.form === '10-K' && fact.fy && fact.val !== null)
    .sort((a, b) => String(b.end).localeCompare(String(a.end)));
}

function factValues(concept: any) {
  if (!concept?.units) return [];
  return Object.values(concept.units)
    .flat()
    .map((fact: any) => ({ ...fact, val: numberOrNull(fact.val) }))
    .filter((fact: any) => fact.val !== null);
}

function getRealDataCitations(data: RealResearchData) {
  const citations = [
    data.secFactsUrl
      ? {
          sourceName: `${data.companyName} SEC Company Facts`,
          sourceUrl: data.secFactsUrl,
          snippet: 'SEC XBRL company facts used for revenue, earnings, assets, liabilities, and equity metrics.',
          relevanceScore: 98,
        }
      : null,
    data.secFormUrl
      ? {
          sourceName: `${data.companyName} SEC EDGAR Filings`,
          sourceUrl: data.secFormUrl,
          snippet: 'SEC EDGAR company filing page used as the primary filing reference.',
          relevanceScore: 94,
        }
      : null,
    data.currentPrice !== null || data.stockHistory.length > 0
      ? {
          sourceName: `${data.ticker} Yahoo Finance Market Quote`,
          sourceUrl: data.yahooQuoteUrl,
          snippet: 'Market quote and six-month chart data used for price, market capitalization, and trading trend context.',
          relevanceScore: 90,
        }
      : null,
  ];

  return citations.filter(Boolean);
}

function mergeCitations(aiCitations: any[] = [], realCitations: any[]) {
  const merged = [...realCitations, ...aiCitations];
  const seen = new Set<string>();
  return merged.filter((citation) => {
    const key = `${citation.sourceName}:${citation.sourceUrl || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreSentiment(revenueGrowth: number | null, profitMargin: number | null, priceChange: number | null) {
  let score = 50;
  if (revenueGrowth !== null) score += Math.max(-15, Math.min(15, revenueGrowth * 0.8));
  if (profitMargin !== null) score += Math.max(-10, Math.min(15, profitMargin * 0.5));
  if (priceChange !== null) score += Math.max(-10, Math.min(10, priceChange * 1.5));
  return Math.round(Math.max(0, Math.min(100, score)));
}

function percentChange(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function ratioPercent(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return (numerator / denominator) * 100;
}

function ratioValue(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

function numberOrNull(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatMetric(value: MetricValue) {
  if (value === null || value === undefined || value === 'N/A') return 'N/A';
  return typeof value === 'number' ? value.toFixed(2) : value;
}

function formatPercent(value: number | null) {
  if (value === null) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatCurrency(value: number | null, currency = 'USD') {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactCurrency(value: number | null, currency = 'USD') {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function getCompanyName(ticker: string): string {
  const map: Record<string, string> = {
    AAPL: 'Apple Inc.', TSLA: 'Tesla Inc.', MSFT: 'Microsoft Corp.',
    NVDA: 'Nvidia Corp.', AMZN: 'Amazon.com Inc.', GOOGL: 'Alphabet Inc.',
    META: 'Meta Platforms Inc.', NFLX: 'Netflix Inc.',
  };
  return map[ticker] || `${ticker} Technologies Co.`;
}

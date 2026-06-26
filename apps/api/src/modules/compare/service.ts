import { fetchRealResearchData, RealResearchData } from '../research/service';

export interface CompanyComparison {
  ticker: string;
  companyName: string;
  metrics: {
    peRatio: number;
    eps: number;
    marketCap: string;
    revenue: string;
    revenueGrowth: string;
    profitMargin: string;
    debtEquity: string;
    pbRatio: number;
    dividendYield: string;
  };
  strengths: string[];
  weaknesses: string[];
  sources: string[];
}

export interface CompareResponse {
  companies: CompanyComparison[];
  summary: string;
  comparisonChart: Array<{
    metric: string;
    [ticker: string]: number | string;
  }>;
}

export async function compareCompanies(tickers: string[]): Promise<CompareResponse> {
  const symbolList = tickers.map(t => t.trim().toUpperCase());
  
  const results = await Promise.allSettled(
    symbolList.map(ticker => fetchRealResearchData(ticker))
  );
  
  const companies: CompanyComparison[] = [];
  const rawDataList: RealResearchData[] = [];
  
  results.forEach((res, index) => {
    const ticker = symbolList[index];
    if (res.status === 'fulfilled' && res.value) {
      const data = res.value;
      rawDataList.push(data);
      
      const equity = data.equity ?? 0;
      const marketCapRaw = data.marketCap ?? 0;
      
      // Calculate P/B Ratio (Market Cap / Equity)
      const pbRatio = (equity > 0 && marketCapRaw > 0) 
        ? Number((marketCapRaw / (equity)).toFixed(2)) 
        : 0;
        
      // Format helper functions
      const formatCurrency = (val: number | null) => {
        if (val === null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: data.currency || 'USD',
          notation: 'compact',
          maximumFractionDigits: 2,
        }).format(val);
      };
      
      const formatPercent = (val: number | null) => {
        if (val === null) return 'N/A';
        return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
      };
      
      // Calculate raw metrics
      const revenueGrowthRaw = data.priorRevenue && data.priorRevenue > 0
        ? ((data.revenue || 0) - data.priorRevenue) / data.priorRevenue * 100
        : null;
        
      const profitMarginRaw = data.revenue && data.revenue > 0
        ? (data.netIncome || 0) / data.revenue * 100
        : null;
        
      const debtEquityRaw = data.equity && data.equity > 0
        ? (data.liabilities || 0) / data.equity
        : null;

      // Heuristic strengths and weaknesses fallbacks
      const strengths = [
        revenueGrowthRaw && revenueGrowthRaw > 10 ? `Strong revenue growth rate of ${formatPercent(revenueGrowthRaw)}.` : null,
        profitMarginRaw && profitMarginRaw > 20 ? `Excellent profit margin of ${formatPercent(profitMarginRaw)}.` : null,
        debtEquityRaw && debtEquityRaw < 0.5 ? `Low balance sheet leverage (${debtEquityRaw.toFixed(2)}x Debt/Equity).` : null,
        `Robust market capitalization of ${formatCurrency(marketCapRaw)}.`
      ].filter((s): s is string => s !== null);
      
      const weaknesses = [
        revenueGrowthRaw && revenueGrowthRaw < 0 ? `Negative revenue growth of ${formatPercent(revenueGrowthRaw)} YoY.` : null,
        debtEquityRaw && debtEquityRaw > 1.5 ? `Elevated leverage profile with debt-to-equity ratio of ${debtEquityRaw.toFixed(2)}x.` : null,
        profitMarginRaw && profitMarginRaw < 5 ? `Low net profit margin of ${formatPercent(profitMarginRaw)}.` : null,
        data.trailingPe && data.trailingPe > 40 ? `Premium valuation multiple with trailing P/E of ${data.trailingPe.toFixed(1)}x.` : null
      ].filter((w): w is string => w !== null);

      companies.push({
        ticker,
        companyName: data.companyName,
        metrics: {
          peRatio: data.trailingPe ?? 0,
          eps: data.eps ?? 0,
          marketCap: formatCurrency(marketCapRaw),
          revenue: formatCurrency(data.revenue),
          revenueGrowth: formatPercent(revenueGrowthRaw),
          profitMargin: formatPercent(profitMarginRaw),
          debtEquity: debtEquityRaw !== null ? debtEquityRaw.toFixed(2) : 'N/A',
          pbRatio,
          dividendYield: 'N/A'
        },
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.length > 0 ? weaknesses.slice(0, 3) : ['No severe leverage or valuation flags identified.'],
        sources: [
          data.secFactsUrl ? `${data.companyName} SEC facts database` : null,
          `Yahoo Finance ${ticker} price feeds`
        ].filter((s): s is string => s !== null)
      });
    } else {
      console.error(`Failed to fetch real comparison data for ${ticker}:`, res.status === 'rejected' ? res.reason : 'empty');
    }
  });

  if (companies.length === 0) {
    throw new Error('Could not retrieve real market or SEC data for any of the requested ticker symbols.');
  }

  // Generate comparison chart records
  const comparisonChart: CompareResponse['comparisonChart'] = [];
  
  const addChartRow = (label: string, getValue: (data: RealResearchData) => number) => {
    const row: any = { metric: label };
    let hasValue = false;
    rawDataList.forEach(data => {
      const val = getValue(data);
      if (val !== null && !isNaN(val)) {
        row[data.ticker] = val;
        hasValue = true;
      }
    });
    if (hasValue) {
      comparisonChart.push(row);
    }
  };

  addChartRow('P/E Ratio', (d) => d.trailingPe ?? 0);
  addChartRow('EPS ($)', (d) => d.eps ?? 0);
  addChartRow('Revenue Growth (%)', (d) => d.priorRevenue && d.priorRevenue > 0 ? Number(((d.revenue || 0) - d.priorRevenue) / d.priorRevenue * 100) : 0);
  addChartRow('Profit Margin (%)', (d) => d.revenue && d.revenue > 0 ? Number(((d.netIncome || 0) / d.revenue * 100)) : 0);
  addChartRow('Debt to Equity', (d) => d.equity && d.equity > 0 ? Number((d.liabilities || 0) / d.equity) : 0);

  // Call Gemini to write comparison summary
  let summary = `Comparative evaluation of ${symbolList.join(', ')} based on live market data and SEC Edgar company facts.`;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && rawDataList.length > 0) {
    try {
      const systemPrompt = `You are an elite equity research analyst and investment strategist.
Your task is to analyze the comparison data payload and write a professional, high-fidelity 3-4 sentence comparative summary.
Focus on relative valuation, growth trade-offs, and balance sheet leverage. Do not invent numbers or metrics outside of the payload.`;

      const userPrompt = `Generate a comparison summary for: ${symbolList.join(' vs ')}
Data payload:
${JSON.stringify(companies, null, 2)}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      });

      if (response.ok) {
        const json = await response.json() as any;
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          summary = text.trim();
        }
      }
    } catch (err: any) {
      console.error('Failed to generate comparison summary using Gemini, using fallback:', err.message);
    }
  }

  return {
    companies,
    summary,
    comparisonChart
  };
}

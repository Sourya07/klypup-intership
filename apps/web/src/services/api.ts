import { apiClient } from '../lib/axios';
import { 
  Member, 
  ResearchReport, 
  ResearchRun, 
  WatchlistItem, 
  CompareResponse 
} from '../types/api';

export const orgService = {
  getMembers: async (): Promise<Member[]> => {
    const response = await apiClient.get('/orgs/me');
    if (response.data?.success && response.data?.data?.members) {
      return response.data.data.members;
    }
    return [];
  },

  inviteMember: async (email: string, role: string): Promise<void> => {
    await apiClient.post('/orgs/invite', { email, role });
  }
};

export const researchService = {
  getReports: async (): Promise<ResearchReport[]> => {
    const response = await apiClient.get('/research/reports');
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return [];
  },

  getReport: async (id: string): Promise<ResearchReport> => {
    const response = await apiClient.get(`/research/reports/${id}`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error('Report not found');
  },

  updateReport: async (id: string, title: string, tags: string[]): Promise<ResearchReport> => {
    const response = await apiClient.patch(`/research/reports/${id}`, { title, tags });
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error('Failed to update report');
  },

  deleteReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/research/reports/${id}`);
  },

  createRun: async (ticker: string, prompt: string): Promise<ResearchRun> => {
    const tickerUpper = ticker.toUpperCase();
    const response = await apiClient.post('/research/runs', { ticker: tickerUpper, prompt });
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error('Failed to create research run');
  },

  getRun: async (id: string): Promise<ResearchRun> => {
    const response = await apiClient.get(`/research/runs/${id}`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error('Research run not found');
  }
};

export const watchlistService = {
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    try {
      const response = await apiClient.get('/watchlist');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return [];
    } catch (e) {
      // Watchlist module not yet implemented on the backend — return empty
      return [];
    }
  },

  addToWatchlist: async (ticker: string): Promise<WatchlistItem> => {
    const tickerUpper = ticker.toUpperCase();
    const response = await apiClient.post('/watchlist', { ticker: tickerUpper });
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error('Failed to add to watchlist');
  },

  removeFromWatchlist: async (id: string): Promise<void> => {
    await apiClient.delete(`/watchlist/${id}`);
  }
};

export const compareService = {
  compareCompanies: async (tickers: string[]): Promise<CompareResponse> => {
    const uppercaseTickers = tickers.map((t) => t.toUpperCase());
    const response = await apiClient.post('/compare', { tickers: uppercaseTickers });
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error('Failed to compare companies');
  }
};

export const searchService = {
  searchEquities: async (query: string): Promise<any[]> => {
    if (!query) return [];
    const response = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
    return response.data || [];
  }
};

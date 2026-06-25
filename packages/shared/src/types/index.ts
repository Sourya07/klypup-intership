// Shared TypeScript Interfaces

export type UserRole = "ADMIN" | "ANALYST" | "VIEWER";

export interface SharedUser {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
}

export interface SharedOrganization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface SharedMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  user: SharedUser;
}

export interface SharedReport {
  id: string;
  title: string;
  summary?: string | null;
  analysis: string;
  metadata?: any;
  createdById: string;
  organizationId: string;
  createdAt: string;
  citations?: SharedCitation[];
}

export interface SharedCitation {
  id: string;
  reportId: string;
  sourceName: string;
  sourceUrl?: string | null;
  snippet: string;
  relevanceScore?: number | null;
}

export interface SharedWatchlist {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  createdById: string;
  items: SharedWatchlistItem[];
}

export interface SharedWatchlistItem {
  id: string;
  watchlistId: string;
  ticker: string;
  companyName: string;
  addedAt: string;
}

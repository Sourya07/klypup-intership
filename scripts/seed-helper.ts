/**
 * Database Seed Helpers
 * This file provides helper functions to generate mock tenants, analysts,
 * watchlists, and AI-powered research reports during the database seeding process.
 */

export function generateMockUser(name: string, email: string) {
  return {
    name,
    email,
    passwordHash: "$2a$10$U.F5b6yG.l7zP261mZgG4uN03z2t547h12L/7Yw7pW1f4YyY3aO4y" // bcrypt hash for 'password'
  };
}

export function generateMockOrganization(name: string, slug: string) {
  return {
    name,
    slug
  };
}

export function generateMockResearch(orgId: string, createdById: string, ticker: string) {
  return {
    organizationId: orgId,
    createdById,
    title: `AI Investment Report: ${ticker}`,
    summary: `Comprehensive evaluation of ${ticker} focusing on growth, leverage metrics, and market risks.`,
    analysis: `### Executive Summary\n${ticker} displays strong operational performance...\n\n### Financial Valuation\nDiscounted Cash Flow (DCF) implies...\n\n### AI Narrative Risk Assessment\nAI analysis predicts high regulatory compliance headwinds.`,
    metadata: {
      model: "gpt-4-turbo",
      promptTokens: 1024,
      completionTokens: 2048,
      temperature: 0.2
    }
  };
}

export function generateMockWatchlist(orgId: string, createdById: string, name: string) {
  return {
    organizationId: orgId,
    createdById,
    name,
    description: "High volume tech and retail watchlist for analysis."
  };
}

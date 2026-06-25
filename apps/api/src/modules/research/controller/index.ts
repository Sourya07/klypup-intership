import { Request, Response, NextFunction } from 'express';
import * as researchService from '../service';
import { sendSuccess } from '../../../utils';

export async function createRun(req: Request, res: Response, next: NextFunction) {
  try {
    const { ticker, prompt } = req.body;
    const run = await researchService.createRun(req.user!.orgId, req.user!.userId, ticker, prompt);
    sendSuccess(res, formatRun(run), 201);
  } catch (err) {
    next(err);
  }
}

export async function getRun(req: Request, res: Response, next: NextFunction) {
  try {
    const run = await researchService.getRun(req.user!.orgId, req.params.id);
    sendSuccess(res, formatRun(run));
  } catch (err) {
    next(err);
  }
}

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const reports = await researchService.getReports(req.user!.orgId);
    sendSuccess(res, reports.map(formatReport));
  } catch (err) {
    next(err);
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await researchService.getReport(req.user!.orgId, req.params.id);
    sendSuccess(res, formatReport(report));
  } catch (err) {
    next(err);
  }
}

export async function updateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, tags } = req.body;
    const report = await researchService.updateReport(req.user!.orgId, req.params.id, title, tags);
    sendSuccess(res, formatReport(report));
  } catch (err) {
    next(err);
  }
}

export async function deleteReport(req: Request, res: Response, next: NextFunction) {
  try {
    await researchService.deleteReport(req.user!.orgId, req.params.id);
    sendSuccess(res, { message: 'Report deleted successfully' });
  } catch (err) {
    next(err);
  }
}

function formatRun(run: any) {
  return {
    id: run.id,
    ticker: run.symbols?.[0] || '',
    status: run.status,
    progress: run.progress,
    step: run.progressMsg || '',
    error: run.errorMessage || null,
    reportId: run.report?.id || null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}

function formatReport(report: any) {
  const content = (report.content as any) || {};
  return {
    id: report.id,
    title: report.title,
    summary: report.summary || null,
    createdById: report.createdById,
    organizationId: report.organizationId,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    citations: (report.sources || []).map((s: any) => ({
      id: s.id,
      reportId: s.reportId,
      sourceName: s.title,
      sourceUrl: s.url || null,
      snippet: s.snippet,
      relevanceScore: s.relevanceScore || null,
    })),
    ...content,
  };
}

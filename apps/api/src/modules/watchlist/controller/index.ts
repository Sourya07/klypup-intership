import { Request, Response, NextFunction } from 'express';
import * as watchlistService from '../service';
import { sendSuccess } from '../../../utils';

export async function listWatchlist(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await watchlistService.getWatchlist(req.user!.orgId);
    const formatted = await Promise.all(items.map(watchlistService.formatWatchlistItem));
    sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
}

export async function addWatchlistItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await watchlistService.addToWatchlist(
      req.user!.orgId,
      req.user!.userId,
      req.body.ticker
    );
    const formatted = await watchlistService.formatWatchlistItem(item);
    sendSuccess(res, formatted, 201);
  } catch (err) {
    next(err);
  }
}

export async function removeWatchlistItem(req: Request, res: Response, next: NextFunction) {
  try {
    await watchlistService.removeFromWatchlist(req.user!.orgId, req.params.id);
    sendSuccess(res, { message: 'Watchlist item removed successfully' });
  } catch (err) {
    next(err);
  }
}

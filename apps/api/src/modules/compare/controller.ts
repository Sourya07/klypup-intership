import { Request, Response, NextFunction } from 'express';
import * as compareService from './service';
import { sendSuccess } from '../../utils';

export async function compare(req: Request, res: Response, next: NextFunction) {
  try {
    const { tickers } = req.body;
    
    if (!tickers || !Array.isArray(tickers) || tickers.length < 2 || tickers.length > 3) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Please provide an array of 2 or 3 ticker symbols to compare.'
      });
    }

    const cleanTickers = tickers.map(t => String(t).trim().toUpperCase());
    const data = await compareService.compareCompanies(cleanTickers);
    
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { sendError } from '../../../utils';

export async function searchEquities(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(200).json([]);
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return sendError(res, 500, 'Finnhub API key not configured');
    }

    const response = await axios.get(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`);
    
    // Finnhub returns { count, result: [{ description, displaySymbol, symbol, type }] }
    // We only want to return common stocks
    const results = (response.data.result || [])
      .filter((item: any) => item.type === 'Common Stock' || item.type === 'ADR')
      .slice(0, 10); // Limit to top 10

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
}

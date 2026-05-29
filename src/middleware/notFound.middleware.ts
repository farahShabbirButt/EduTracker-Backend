import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../common/responses/index.js';

export const notFoundMiddleware = (req: Request, res: Response) => {
  const formatted = ApiError.format(null, {
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: StatusCodes.NOT_FOUND,
  });
  res.status(StatusCodes.NOT_FOUND).json(ApiError.sendResponse(formatted));
};

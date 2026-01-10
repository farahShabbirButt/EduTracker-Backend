import { ApiError } from '../common/responses/apiError.js';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodSchema } from 'zod';

export const ZodValidator = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  // Perform safe parsing
  const result = schema.safeParse(req.body);

  // If validation fails, return a structured error response
  if (!result.success) {
    return res.status(StatusCodes.BAD_REQUEST).json(
      ApiError.format({
        message: result?.error?.issues[0]?.message,
        code: StatusCodes.BAD_REQUEST,
      }),
    );
  }

  // If validation passes, modify the request body and call the next middleware
  req.body = result.data;

  // Ensure we call next to proceed with the request processing
  return next();
};

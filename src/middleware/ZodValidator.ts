import { ApiError } from '../common/responses/apiError.js';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodSchema } from 'zod';

export const ZodValidator = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    throw ApiError.format(result.error.issues, {
      code: StatusCodes.BAD_REQUEST,
      message: 'Validation failed',
    });
  }

  // Replace body with parsed & coerced data
  req.body = result.data;
  next();
};

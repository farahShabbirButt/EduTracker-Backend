import { ApiError } from '../common/responses/apiError.js';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodSchema } from 'zod';

export const ZodValidator = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    req.log.info(
      { issues: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) },
      'Validation failed',
    );

    return res.status(StatusCodes.BAD_REQUEST).json(
      ApiError.format({
        message: result.error.issues[0]?.message,
        code: StatusCodes.BAD_REQUEST,
      }),
    );
  }

  // Optionally assign back (useful if you use transforms/defaults)
  const data = result.data as Partial<Pick<Request, 'body' | 'params' | 'query'>>;
  if (data.body !== undefined) req.body = data.body;
  if (data.params !== undefined) req.params = data.params;
  if (data.query !== undefined) {
    Object.assign(req.query, data.query);
  }
  return next();
};

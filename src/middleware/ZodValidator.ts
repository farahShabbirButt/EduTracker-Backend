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
    console.info('ERROR in validation', result.error.issues);
    console.info('BODY', req.body);
    console.info('PARAMS', req.params);
    console.info('QUERY', req.query);

    return res.status(StatusCodes.BAD_REQUEST).json(
      ApiError.format({
        message: result.error.issues[0]?.message,
        code: StatusCodes.BAD_REQUEST,
      }),
    );
  }

  // Optionally assign back (useful if you use transforms/defaults)
  const data: any = result.data;
  if (data.body !== undefined) req.body = data.body;
  if (data.params !== undefined) req.params = data.params;
  if (data.query !== undefined) {
    Object.assign(req.query, data.query);
  }
  return next();
};

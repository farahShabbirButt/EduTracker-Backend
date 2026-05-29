import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../common/responses/index.js';

// Safety net for any error that escapes a controller's try/catch.
// Structured IAPIErrorResponse errors are passed through; everything else is wrapped as a generic 500.
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const isStructured =
    err && typeof err === 'object' && 'success' in err && (err as IAPIErrorResponse).success === false;

  if (isStructured) {
    const structured = err as IAPIErrorResponse;
    const status = structured.code || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(status).json(ApiError.sendResponse(structured));
    return;
  }

  console.error('Unhandled error:', err);
  const formatted = ApiError.format(err);
  const status = formatted.code || StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(status).json(ApiError.sendResponse(formatted));
};

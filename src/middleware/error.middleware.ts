import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../common/responses/index.js';

// Prisma (and other third-party) errors carry non-numeric `code` values like 'P2002'.
// res.status() throws on anything that isn't a valid HTTP status integer, so every
// status we send must be coerced through this guard first.
const toHttpStatus = (code: unknown): number =>
  typeof code === 'number' && Number.isInteger(code) && code >= 100 && code <= 599
    ? code
    : StatusCodes.INTERNAL_SERVER_ERROR;

// Safety net for any error that escapes a controller's try/catch.
// Structured IAPIErrorResponse errors are passed through; everything else is wrapped as a generic 500.
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const isStructured =
    err && typeof err === 'object' && 'success' in err && (err as IAPIErrorResponse).success === false;

  if (isStructured) {
    const structured = err as IAPIErrorResponse;
    const status = toHttpStatus(structured.code);
    // Pass the normalised status back through so the JSON body's own `status` field
    // (built by ApiError.sendResponse as `res.code || 500`) can't disagree with the
    // HTTP status line — e.g. a raw Prisma 'P2002' must not leak into the body as-is.
    res.status(status).json(ApiError.sendResponse({ ...structured, code: status }));
    return;
  }

  console.error('Unhandled error:', err);
  const formatted = ApiError.format(err);
  const status = toHttpStatus(formatted.code);
  res.status(status).json(ApiError.sendResponse({ ...formatted, code: status }));
};

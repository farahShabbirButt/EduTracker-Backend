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
  if (err?.type === 'entity.too.large') {
    const tooLarge = ApiError.format({ message: 'Request is too large', code: StatusCodes.REQUEST_TOO_LONG });
    res
      .status(StatusCodes.REQUEST_TOO_LONG)
      .json(ApiError.sendResponse({ ...tooLarge, code: StatusCodes.REQUEST_TOO_LONG }));
    return;
  }

  // Not logged: this error's message, stack and body all quote the request, which can hold a password
  if (err?.type === 'entity.parse.failed') {
    const invalidJson = ApiError.format({ message: 'Invalid request', code: StatusCodes.BAD_REQUEST });
    res.status(StatusCodes.BAD_REQUEST).json(ApiError.sendResponse({ ...invalidJson, code: StatusCodes.BAD_REQUEST }));
    return;
  }

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

  // The detail goes to the log only: a raw Prisma message carries file paths and queries.
  // The request logger writes it with the request's own line, so a 500 logs once.
  res.err = err;
  const formatted = ApiError.format({ message: 'Something went wrong. Please try again' });
  const status = toHttpStatus(formatted.code);
  res.status(status).json(ApiError.sendResponse({ ...formatted, code: status }));
};

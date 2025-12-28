import { ApiError } from '../../common/responses/apiError.js';
import { ApiSuccess } from '../../common/responses/apiSuccess.js';
import { Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export abstract class BaseController {
  protected sendErrorResponse(res: Response, apiError: IAPIErrorResponse): Response {
    let statusCode = apiError.code || StatusCodes.INTERNAL_SERVER_ERROR;

    try {
      getReasonPhrase(statusCode);
    } catch {
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }

    return res.status(statusCode).json(ApiError.sendResponse(apiError));
  }

  protected sendSuccessResponse(res: Response, apiSuccess: IAPISuccessResponse): Response {
    const statusCode = apiSuccess.code || StatusCodes.OK;

    return res.status(statusCode).json(ApiSuccess.sendResponse(apiSuccess));
  }
}

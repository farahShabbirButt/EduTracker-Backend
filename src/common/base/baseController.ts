import { ApiSuccess } from '../../common/responses/apiSuccess.js';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export abstract class BaseController {
  protected sendSuccessResponse(res: Response, apiSuccess: IAPISuccessResponse): Response {
    const statusCode = apiSuccess.code || StatusCodes.OK;

    return res.status(statusCode).json(ApiSuccess.sendResponse(apiSuccess));
  }
}

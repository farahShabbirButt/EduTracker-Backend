import { StatusCodes } from 'http-status-codes';
import { SERVER_ERROR } from './index.js';

export class ApiError {
  public static format(
    error: any,

    errorModule: IError = SERVER_ERROR,
  ): IAPIErrorResponse {
    const message = error?.message
      ? error?.message
      : Array.isArray(error) && error[0]?.message
        ? error[0]?.message
        : errorModule?.message;
    return {
      ...{
        message: message,
        code: error?.code || errorModule?.code || 500,
        success: false,
        error:
          (error?.message && error?.code) || (Array.isArray(error) && error[0]?.code && error[0]?.message)
            ? error
            : errorModule,
      },
      ...(error?.documentation && {
        documentation: error?.documentation,
      }),
      ...(error?.description && {
        description: error?.description,
      }),
    };
  }
  public static sendResponse(res: IAPIErrorResponse) {
    return {
      ...{
        success: res.success,
        message: res.message,
        status: res.code || StatusCodes.INTERNAL_SERVER_ERROR,
        error: res.error ? res.error : {},
      },
    };
  }
}

export class ApiSuccess {
  public static format(success: IAPISuccessResponse): IAPISuccessResponse {
    return {
      ...{
        message: 'Operation is successfully executed',
        userMessage: success?.userMessage || 'Your request has been processed successfully',
        code: success.code,
        keyName: success.keyName,
        success: true,
        [success.keyName]: success[success.keyName] || [],
      },
      ...(success.pagination && {
        pagination: success.pagination,
      }),
      ...(success.documentation && {
        documentation: success.documentation,
      }),
      ...(success.description && {
        description: success.description,
      }),
    };
  }

  public static sendResponse(res: IAPISuccessResponse) {
    return {
      ...{
        message: res.message,
        userMessage: res.userMessage,
        keyName: res.keyName,
        [res.keyName]: res[res.keyName],
        success: true,
        ...(res.pagination && {
          pagination: res.pagination,
        }),
      },
    };
  }
}

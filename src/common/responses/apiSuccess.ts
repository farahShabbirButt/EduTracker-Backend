export class ApiSuccess {
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

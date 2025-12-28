interface IResponse {
  message?: string;
  userMessage?: string;
  code: number;
  codeAsString?: string;
  description?: string;
  documentation?: string;
  success?: boolean;
}

interface IError {
  code?: number;
  message?: string;
}

interface IPagination {
  totalCount: number;
  totalPage: number;
  currentPage: string;
  resultCount: number;
  nextPage: string;
  previousPage: string;
}

interface IAPISuccessResponse extends Omit<IResponse, 'codeAsString'> {
  keyName: string;
  [key: string]: any;
  pagination?: IPagination;
}

interface IAPIErrorResponse extends Omit<IResponse, 'codeAsString' | 'userMessage'> {
  error?: IError | IError[];
}

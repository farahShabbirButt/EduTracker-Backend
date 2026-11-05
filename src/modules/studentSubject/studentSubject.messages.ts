import { StatusCodes } from 'http-status-codes';

export const INVALID_ELECTIVE_SUBJECTS = Object.freeze({
  message: 'One or more selected elective subjects are invalid for the selected class',
  code: StatusCodes.BAD_REQUEST,
});

import { StatusCodes } from 'http-status-codes';

export const SUBJECT_CREATED_SUCCESSFULLY = Object.freeze({
  message: 'Subject created Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_ALREADY_EXISTS = Object.freeze({
  message: 'Subject already exist with the same name',
  code: StatusCodes.CONFLICT,
});

export const SUBJECT_CREATION_FAILURE = Object.freeze({
  message: 'Subject creation failed',
  code: StatusCodes.BAD_REQUEST,
});

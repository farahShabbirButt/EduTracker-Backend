import { StatusCodes } from 'http-status-codes';

export const STUDENT_NOT_FOUND = Object.freeze({
  message: 'Student not found',
  code: StatusCodes.NOT_FOUND,
});

export const CONDUCT_UPSERTED_SUCCESSFULLY = Object.freeze({
  message: 'Conduct saved successfully',
  code: StatusCodes.OK,
});

export const CONDUCT_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Conduct fetched successfully',
  code: StatusCodes.OK,
});

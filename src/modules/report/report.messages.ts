import { StatusCodes } from 'http-status-codes';

export const STUDENT_NOT_FOUND = Object.freeze({
  message: 'Student not found',
  code: StatusCodes.NOT_FOUND,
});

export const INSTITUTE_NOT_CONFIGURED = Object.freeze({
  message: 'School details are missing. Add them in Settings',
  code: StatusCodes.NOT_FOUND,
});

export const REPORT_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Report fetched successfully',
  code: StatusCodes.OK,
});

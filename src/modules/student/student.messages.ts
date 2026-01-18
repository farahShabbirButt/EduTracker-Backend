import { StatusCodes } from 'http-status-codes';

export const CLASS_NOT_FOUND = Object.freeze({
  message: 'Class not found',
  code: StatusCodes.NOT_FOUND,
});

export const STUDENT_ALREADY_EXISTS = Object.freeze({
  message: 'Student with this roll number already exists in the selected class',
  code: StatusCodes.CONFLICT,
});

export const STUDENT_CREATED_SUCCESSFULLY = Object.freeze({
  message: 'Student created successfully',
  code: StatusCodes.OK,
});

export const STUDENT_CREATION_FAILURE = Object.freeze({
  message: 'Failed to create student',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

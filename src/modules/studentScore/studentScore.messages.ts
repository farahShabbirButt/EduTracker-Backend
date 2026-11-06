import { StatusCodes } from 'http-status-codes';

export const MARKS_SAVED_SUCCESSFULLY = Object.freeze({
  message: 'Marks saved successfully',
  code: StatusCodes.OK,
});

export const MARKS_EXCEED_TOTAL = Object.freeze({
  message: 'Marks obtained cannot exceed the maximum marks for this subject',
  code: StatusCodes.BAD_REQUEST,
});

export const CLASS_NOT_FOUND = Object.freeze({
  message: 'Class not found',
  code: StatusCodes.NOT_FOUND,
});

export const TEST_NOT_FOUND = Object.freeze({
  message: 'Test not found for selected class',
  code: StatusCodes.NOT_FOUND,
});

export const SUBJECT_NOT_IN_TEST = Object.freeze({
  message: 'This subject is not configured for the selected test',
  code: StatusCodes.BAD_REQUEST,
});

export const STUDENT_SCORE_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Students and their marks fetched successfully',
  code: StatusCodes.OK,
});

export const STUDENT_NOT_ON_SUBJECT = Object.freeze({
  message: 'One of these students does not take that subject',
  code: StatusCodes.BAD_REQUEST,
});

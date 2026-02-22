import { StatusCodes } from 'http-status-codes';

export const MARKS_SAVED_SUCCESSFULLY = Object.freeze({
  message: 'Marks saved successfully',
  code: StatusCodes.OK,
});

export const MARKS_SAVE_FAILURE = Object.freeze({
  message: 'Failed to save marks',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

export const MARKS_EXCEED_TOTAL = Object.freeze({
  message: 'Marks obtained cannot exceed total marks of test',
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

export const SUBJECT_NOT_FOUND = Object.freeze({
  message: 'Subject not found for selected class',
  code: StatusCodes.NOT_FOUND,
});

export const STUDENT_SCORE_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Students and their marks fetched successfully',
  code: StatusCodes.OK,
});
export const STUDENT_SCORE_FETCH_FAILUE = Object.freeze({
  message: 'Failed to fetch student and their marks',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

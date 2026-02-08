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
export const STUDENT_NOT_FOUND = Object.freeze({
  message: 'Student not found',
  code: StatusCodes.NOT_FOUND,
});

export const STUDENT_UPDATED_SUCCESSFULLY = Object.freeze({
  message: 'Student updated successfully',
  code: StatusCodes.OK,
});

export const STUDENT_UPDATE_FAILURE = Object.freeze({
  message: 'Failed to update student',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});
export const STUDENT_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Student fetched successfully',
  code: StatusCodes.OK,
});

export const STUDENTS_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Students fetched successfully',
  code: StatusCodes.OK,
});

export const STUDENT_FETCH_FAILURE = Object.freeze({
  message: 'Failed to fetch student data',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

export const STUDENT_DELETED_SUCCESSFULLY = Object.freeze({
  message: 'Student deleted successfully',
  code: StatusCodes.OK,
});

export const STUDENT_DELETION_FAILURE = Object.freeze({
  message: 'Failed to delete student',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

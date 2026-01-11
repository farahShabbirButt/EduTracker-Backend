import { StatusCodes } from 'http-status-codes';

export const SUBJECTS_ASSIGNED_SUCCESSFULLY = {
  message: 'Subjects assigned to class successfully',
  code: StatusCodes.OK,
};

export const SUBJECT_ASSIGNMENT_FAILED = {
  message: 'Failed to assign subjects to class',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const CLASS_NOT_FOUND = {
  message: 'Class not found or inactive',
  code: StatusCodes.NOT_FOUND,
};

export const SUBJECT_NOT_FOUND = {
  message: 'One or more subjects not found or inactive',
  code: StatusCodes.NOT_FOUND,
};

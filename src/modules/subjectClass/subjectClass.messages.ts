import { StatusCodes } from 'http-status-codes';

export const SUBJECTS_ASSIGNED_SUCCESSFULLY = {
  message: 'Subjects assigned to class successfully',
  code: StatusCodes.OK,
};

export const SUBJECT_ASSIGNMENT_FAILED = {
  message: 'Failed to assign subjects to class',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

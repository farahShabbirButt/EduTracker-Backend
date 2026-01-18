import { StatusCodes } from 'http-status-codes';

export const STUDENTS_ASSIGNED_SUBJECTS_SUCCESSFULLY = {
  message: 'Subjects assigned to Students successfully',
  code: StatusCodes.OK,
};

export const SUBJECT_ASSIGNMENT_FAILED = {
  message: 'Failed to assign subjects to students',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};
export const INVALID_ELECTIVE_SUBJECTS = Object.freeze({
  message: 'One or more selected elective subjects are invalid for the selected class',
  code: StatusCodes.BAD_REQUEST,
});

import { StatusCodes } from 'http-status-codes';

export const SUBJECT_CREATED_SUCCESSFULLY = Object.freeze({
  message: 'Subject created Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_ALREADY_EXISTS = Object.freeze({
  message: 'Subject already exist with the same name',
  code: StatusCodes.CONFLICT,
});

export const SUBJECTS_LIST_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Subjects fecthed Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Subject fetched Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_NOT_FOUND = Object.freeze({
  message: 'Subject not found',
  code: StatusCodes.NOT_FOUND,
});

export const SUBJECT_UPDATED_SUCCESSFULLY = Object.freeze({
  message: 'Subject updated Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_DELETED_SUCCESSFULLY = Object.freeze({
  message: 'Subject deleted Successfully',
  code: StatusCodes.OK,
});

export const CLASS_NOT_FOUND = Object.freeze({
  message: 'Class not found',
  code: StatusCodes.NOT_FOUND,
});

export const SUBJECT_HAS_MARKS = {
  message: 'This subject has marks on tests, so it can not be deleted',
  code: StatusCodes.CONFLICT,
};

export const SUBJECT_ON_TESTS = {
  message: "This subject is on tests, so it can't become compulsory. Tick it for each student instead",
  code: StatusCodes.CONFLICT,
};

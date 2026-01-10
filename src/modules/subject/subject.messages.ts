import { StatusCodes } from 'http-status-codes';

export const SUBJECT_CREATED_SUCCESSFULLY = Object.freeze({
  message: 'Subject created Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_ALREADY_EXISTS = Object.freeze({
  message: 'Subject already exist with the same name',
  code: StatusCodes.CONFLICT,
});

export const SUBJECT_CREATION_FAILURE = Object.freeze({
  message: 'Subject creation failed',
  code: StatusCodes.BAD_REQUEST,
});

export const SUBJECTS_LIST_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Subjects fecthed Successfully',
  code: StatusCodes.OK,
});

export const SUBJECTS_LIST_FETCHING_FAILURE = Object.freeze({
  message: 'Subjects fetching failed',
  code: StatusCodes.BAD_REQUEST,
});

export const SUBJECT_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Subject fetched Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_FETCH_FAILURE = Object.freeze({
  message: 'Subject fetching failed',
  code: StatusCodes.BAD_REQUEST,
});

export const SUBJECT_NOT_FOUND = Object.freeze({
  message: 'Subject not found',
  code: StatusCodes.NOT_FOUND,
});

export const SUBJECT_UPDATED_SUCCESSFULLY = Object.freeze({
  message: 'Subject updated Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_UPDATE_FAILURE = Object.freeze({
  message: 'Subject updation failed',
  code: StatusCodes.BAD_REQUEST,
});

export const SUBJECT_DELETED_SUCCESSFULLY = Object.freeze({
  message: 'Subject deleted Successfully',
  code: StatusCodes.OK,
});

export const SUBJECT_DELETED_FAILURE = Object.freeze({
  message: 'Subject deletion failed',
  code: StatusCodes.BAD_REQUEST,
});

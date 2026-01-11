import { StatusCodes } from 'http-status-codes';

export const CLASS_CREATED_SUCCESSFULLY = {
  message: 'Class created successfully',
  code: StatusCodes.CREATED,
};

export const CLASS_CREATION_FAILURE = {
  message: 'Failed to create class',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const CLASS_ALREADY_EXISTS = {
  message: 'Class with the same name already exists and is active',
  code: StatusCodes.BAD_REQUEST,
};

export const CLASSES_LIST_FETCHED_SUCCESSFULLY = {
  message: 'Classes list fetched successfully',
  code: StatusCodes.OK,
};

export const CLASSES_LIST_FETCHING_FAILURE = {
  message: 'Failed to fetch classes list',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const CLASS_FETCHED_SUCCESSFULLY = {
  message: 'Class fetched successfully',
  code: StatusCodes.OK,
};

export const CLASS_FETCH_FAILURE = {
  message: 'Failed to fetch class',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const CLASS_UPDATED_SUCCESSFULLY = {
  message: 'Class updated successfully',
  code: StatusCodes.OK,
};

export const CLASS_UPDATE_FAILURE = {
  message: 'Failed to update class',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const CLASS_DELETED_SUCCESSFULLY = {
  message: 'Class deleted successfully',
  code: StatusCodes.OK,
};

export const CLASS_DELETED_FAILURE = {
  message: 'Failed to delete class',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const CLASS_NOT_FOUND = {
  message: 'Class not found or inactive',
  code: StatusCodes.NOT_FOUND,
};

export const SUBJECTS_LIST_FETCHED_SUCCESSFULLY = {
  message: 'Subjects list fetched successfully',
  code: StatusCodes.OK,
};

export const SUBJECT_FETCH_FAILURE = {
  message: 'Failed to fetch subjects',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

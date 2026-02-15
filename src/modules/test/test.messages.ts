import { StatusCodes } from 'http-status-codes';

export const MONTH_YEAR_REQUIRED = Object.freeze({
  message: 'Month and Year are required for monthly tests',
  code: StatusCodes.BAD_REQUEST,
});

export const TEST_CREATED_SUCCESSFULLY = Object.freeze({
  message: 'Test created successfully',
  code: StatusCodes.OK,
});

export const TEST_UPDATED_SUCCESSFULLY = Object.freeze({
  message: 'Test updated successfully',
  code: StatusCodes.OK,
});

export const TEST_DELETED_SUCCESSFULLY = Object.freeze({
  message: 'Test deleted successfully',
  code: StatusCodes.OK,
});

export const TEST_ALREADY_EXISTS = Object.freeze({
  message: 'Test already exists with the same name, month, year and type for this class',
  code: StatusCodes.BAD_REQUEST,
});

export const TEST_NOT_FOUND = Object.freeze({
  message: 'Test not found',
  code: StatusCodes.NOT_FOUND,
});

export const CLASS_NOT_FOUND = Object.freeze({
  message: 'Class not found',
  code: StatusCodes.NOT_FOUND,
});

export const TEST_CREATION_FAILURE = Object.freeze({
  message: 'Test creation failed',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

export const TEST_UPDATE_FAILURE = Object.freeze({
  message: 'Test update failed',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

export const TEST_DELETION_FAILURE = Object.freeze({
  message: 'Test deletion failed',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

export const TEST_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Test fecthed Successfully',
  code: StatusCodes.OK,
});
export const TEST_FETCH_FAILURE = Object.freeze({
  message: 'Failed to fetch test(s)',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

export const TESTS_LIST_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Tests fecthed Successfully',
  code: StatusCodes.OK,
});

export const TESTS_LIST_FETCHING_FAILURE = Object.freeze({
  message: 'TestTs fetching failed',
  code: StatusCodes.BAD_REQUEST,
});

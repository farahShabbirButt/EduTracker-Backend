import { StatusCodes } from 'http-status-codes';

export const GRADE_SCALE_CREATED_SUCCESSFULLY = {
  message: 'Grade scale created successfully',
  code: StatusCodes.CREATED,
};

export const GRADE_SCALE_CREATION_FAILURE = {
  message: 'Failed to create grade scale',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const GRADE_SCALES_FETCHED_SUCCESSFULLY = {
  message: 'Grade scales fetched successfully',
  code: StatusCodes.OK,
};

export const GRADE_SCALES_FETCHING_FAILURE = {
  message: 'Failed to fetch grade scales',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const GRADE_SCALE_FETCHED_SUCCESSFULLY = {
  message: 'Grade scale fetched successfully',
  code: StatusCodes.OK,
};

export const GRADE_SCALE_FETCH_FAILURE = {
  message: 'Failed to fetch grade scale',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const GRADE_SCALE_UPDATED_SUCCESSFULLY = {
  message: 'Grade scale updated successfully',
  code: StatusCodes.OK,
};

export const GRADE_SCALE_UPDATE_FAILURE = {
  message: 'Failed to update grade scale',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const GRADE_SCALE_DELETED_SUCCESSFULLY = {
  message: 'Grade scale deleted successfully',
  code: StatusCodes.OK,
};

export const GRADE_SCALE_DELETED_FAILURE = {
  message: 'Failed to delete grade scale',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
};

export const GRADE_SCALE_NOT_FOUND = {
  message: 'Grade scale not found',
  code: StatusCodes.NOT_FOUND,
};

export const GRADE_SCALE_OVERLAPS = {
  message: 'Grade scale range overlaps with an existing grade scale',
  code: StatusCodes.BAD_REQUEST,
};

export const GRADE_SCALE_INVALID_RANGE = {
  message: 'minPercentage must be less than maxPercentage',
  code: StatusCodes.BAD_REQUEST,
};

export const NO_GRADE_FOR_PERCENTAGE = {
  message: 'No grade scale found for the given percentage',
  code: StatusCodes.NOT_FOUND,
};

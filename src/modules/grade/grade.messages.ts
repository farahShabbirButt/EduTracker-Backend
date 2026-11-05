import { StatusCodes } from 'http-status-codes';

export const GRADE_SCALE_CREATED_SUCCESSFULLY = {
  message: 'Grade scale created successfully',
  code: StatusCodes.CREATED,
};

export const GRADE_SCALES_FETCHED_SUCCESSFULLY = {
  message: 'Grade scales fetched successfully',
  code: StatusCodes.OK,
};

export const GRADE_SCALE_UPDATED_SUCCESSFULLY = {
  message: 'Grade scale updated successfully',
  code: StatusCodes.OK,
};

export const GRADE_SCALE_DELETED_SUCCESSFULLY = {
  message: 'Grade scale deleted successfully',
  code: StatusCodes.OK,
};

export const GRADE_SCALE_NOT_FOUND = {
  message: 'Grade scale not found',
  code: StatusCodes.NOT_FOUND,
};

export const GRADE_SCALE_OVERLAPS = {
  message: 'Grade scale range overlaps with an existing grade scale',
  code: StatusCodes.BAD_REQUEST,
};

export const NO_GRADE_FOR_PERCENTAGE = {
  message: 'No grade scale found for the given percentage',
  code: StatusCodes.NOT_FOUND,
};

export const GRADE_SCALE_MIN_ABOVE_MAX = {
  message: 'Minimum percentage must be less than maximum percentage',
  code: StatusCodes.BAD_REQUEST,
};

export const GRADE_SCALE_LOWEST = {
  message: "The lowest band is the failing one, so it can't be deleted. Edit it instead",
  code: StatusCodes.CONFLICT,
};

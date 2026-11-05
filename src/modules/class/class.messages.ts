import { StatusCodes } from 'http-status-codes';

export const CLASS_CREATED_SUCCESSFULLY = {
  message: 'Class created successfully',
  code: StatusCodes.CREATED,
};

export const CLASS_ALREADY_EXISTS = {
  message: 'Class with the same name already exists and is active',
  code: StatusCodes.BAD_REQUEST,
};

export const CLASSES_LIST_FETCHED_SUCCESSFULLY = {
  message: 'Classes list fetched successfully',
  code: StatusCodes.OK,
};

export const CLASS_FETCHED_SUCCESSFULLY = {
  message: 'Class fetched successfully',
  code: StatusCodes.OK,
};

export const CLASS_UPDATED_SUCCESSFULLY = {
  message: 'Class updated successfully',
  code: StatusCodes.OK,
};

export const CLASS_DELETED_SUCCESSFULLY = {
  message: 'Class deleted successfully',
  code: StatusCodes.OK,
};

export const CLASS_HAS_STUDENTS = {
  message: 'This class has students. Move or delete them first',
  code: StatusCodes.CONFLICT,
};

export const CLASS_HAS_MARKS = {
  message: 'Students who left this class still have marks on its tests, so it can not be deleted',
  code: StatusCodes.CONFLICT,
};

export const CLASS_NOT_FOUND = {
  message: 'Class not found or inactive',
  code: StatusCodes.NOT_FOUND,
};

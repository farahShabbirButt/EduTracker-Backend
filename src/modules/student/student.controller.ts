import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { StudentService } from './index.js';

class StudentController extends BaseController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await StudentService.createStudent({
        ...req.body,
        createdBy: req.user!.externalId,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentExternalId } = req.params;

      const result = await StudentService.updateStudent(studentExternalId, req.body);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentExternalId } = req.params;

      const result = await StudentService.deleteStudent(studentExternalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  getStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentExternalId } = req.params;

      const result = await StudentService.getStudentById(studentExternalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  getStudentsByClassId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classExternalId } = req.params;

      const result = await StudentService.getStudentsByClassId(classExternalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  getAllStudents = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await StudentService.getAllStudents();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new StudentController();

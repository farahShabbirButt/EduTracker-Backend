import { Request, Response } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { StudentService } from './index.js';

class StudentController extends BaseController {
  create = async (req: Request, res: Response) => {
    try {
      const result = await StudentService.createStudent({
        ...req.body,
        createdBy: req.headers['user-external-id'] as string,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  update = async (req: Request, res: Response) => {
    try {
      const { studentExternalId } = req.params;

      const result = await StudentService.updateStudent(studentExternalId, req.body);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  deleteStudent = async (req: Request, res: Response) => {
    try {
      const { studentExternalId } = req.params;

      const result = await StudentService.deleteStudent(studentExternalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  getStudentById = async (req: Request, res: Response) => {
    try {
      const { studentExternalId } = req.params;

      const result = await StudentService.getStudentById(studentExternalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };

  getStudentsByClassId = async (req: Request, res: Response) => {
    try {
      const { classExternalId } = req.params;

      const result = await StudentService.getStudentsByClassId(classExternalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };

  getAllStudents = async (_req: Request, res: Response) => {
    try {
      const result = await StudentService.getAllStudents();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
}

export default new StudentController();

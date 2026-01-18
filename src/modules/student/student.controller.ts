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
  //   getAll = async (_req: Request, res: Response) => {
  //     try {
  //       const result = await StudentService.getAllClasses();
  //       return this.sendSuccessResponse(res, result);
  //     } catch (error) {
  //       console.error('Error caught:', error);
  //       return this.sendErrorResponse(res, error as IAPIErrorResponse);
  //     }
  //   };
  //   getById = async (req: Request, res: Response) => {
  //     try {
  //       const { externalId } = req.params;

  //       const result = await StudentService.getClassById(externalId);
  //       return this.sendSuccessResponse(res, result);
  //     } catch (error) {
  //       return this.sendErrorResponse(res, error as IAPIErrorResponse);
  //     }
  //   };
  //   update = async (req: Request, res: Response) => {
  //     try {
  //       const { externalId } = req.params;

  //       const result = await StudentService.updateClass(externalId, req.body);

  //       return this.sendSuccessResponse(res, result);
  //     } catch (error) {
  //       return this.sendErrorResponse(res, error as IAPIErrorResponse);
  //     }
  //   };

  //   delete = async (req: Request, res: Response) => {
  //     try {
  //       const { externalId } = req.params;

  //       const result = await StudentService.deleteClass(externalId);
  //       return this.sendSuccessResponse(res, result);
  //     } catch (error) {
  //       return this.sendErrorResponse(res, error as IAPIErrorResponse);
  //     }
  //   };
}

export default new StudentController();

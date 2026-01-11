import { Request, Response } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { ClassService } from './index.js';

class ClassController extends BaseController {
  create = async (req: Request, res: Response) => {
    try {
      const result = await ClassService.createClass({
        ...req.body,
        createdBy: req.headers['user-external-id'] as string,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  getAll = async (_req: Request, res: Response) => {
    try {
      const result = await ClassService.getAllClasses();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      console.error('Error caught:', error);
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  getById = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      const result = await ClassService.getClassById(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  update = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      const result = await ClassService.updateClass(externalId, req.body);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      const result = await ClassService.deleteClass(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  getSubjectsByClass = async (req: Request, res: Response) => {
    try {
      const { classExternalId } = req.params;

      const result = await ClassService.getSubjectsByClass(classExternalId);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
}

export default new ClassController();

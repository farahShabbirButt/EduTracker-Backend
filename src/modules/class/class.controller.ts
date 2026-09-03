import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { ClassService } from './index.js';

class ClassController extends BaseController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ClassService.createClass({
        ...req.body,
        createdBy: req.user!.externalId,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ClassService.getAllClasses();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await ClassService.getClassById(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await ClassService.updateClass(externalId, req.body);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await ClassService.deleteClass(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  getSubjectsByClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classExternalId } = req.params;

      const result = await ClassService.getSubjectsByClass(classExternalId);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new ClassController();

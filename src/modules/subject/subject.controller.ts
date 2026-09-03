import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { SubjectService } from './index.js';

class SubjectController extends BaseController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SubjectService.createSubject({
        ...req.body,
        createdBy: req.user!.externalId,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  //TODO: handle pagination later if needed
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SubjectService.getAllSubjects(req.query as any);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await SubjectService.getSubjectById(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await SubjectService.updateSubject(externalId, req.body);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await SubjectService.deleteSubject(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new SubjectController();

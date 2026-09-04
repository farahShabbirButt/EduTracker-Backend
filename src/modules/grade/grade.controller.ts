import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { GradeService } from './index.js';

class GradeController extends BaseController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await GradeService.createGradeScale({
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
      const result = await GradeService.getAllGradeScales();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await GradeService.updateGradeScale(externalId, {
        ...req.body,
        updatedBy: req.user!.externalId,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await GradeService.deleteGradeScale(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new GradeController();

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { InstituteService } from './index.js';

class InstituteController extends BaseController {
  get = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await InstituteService.getInstitute();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  save = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await InstituteService.saveInstitute({ ...req.body, updatedBy: req.user!.externalId });
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new InstituteController();

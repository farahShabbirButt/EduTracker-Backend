import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { ConductService } from './index.js';

class ConductController extends BaseController {
  getForClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classExternalId } = req.params;
      const { month, year } = req.query;

      const result = await ConductService.getClassConduct(classExternalId, Number(month), Number(year));

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  saveForClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ConductService.saveClassConduct(req.params.classExternalId, req.body, req.user!.externalId);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new ConductController();

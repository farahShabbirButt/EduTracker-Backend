import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { ConductService } from './index.js';

class ConductController extends BaseController {
  upsert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentExternalId } = req.params;

      const result = await ConductService.upsertConduct(studentExternalId, {
        ...req.body,
        createdBy: req.user!.externalId,
        updatedBy: req.user!.externalId,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentExternalId } = req.params;
      const { month, year } = req.query;

      const result = await ConductService.getConduct(studentExternalId, Number(month), Number(year));

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new ConductController();

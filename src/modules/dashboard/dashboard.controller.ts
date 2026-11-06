import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { DashboardService } from './index.js';

class DashboardController extends BaseController {
  get = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await DashboardService.getDashboard();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new DashboardController();

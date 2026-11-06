import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { IGetMarksGridQuery, StudentScoreService } from './index.js';

class StudentScoreController extends BaseController {
  getMarksGrid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await StudentScoreService.getMarksGrid(req.query as unknown as IGetMarksGridQuery);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  saveMarksGrid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await StudentScoreService.saveMarksGrid(req.body, req.user!.externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new StudentScoreController();

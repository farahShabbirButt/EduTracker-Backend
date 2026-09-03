import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { StudentScoreService } from './index.js';

class StudentScoreController extends BaseController {
  enterMarks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await StudentScoreService.enterMarks(req.body);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  getMarksEntryStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await StudentScoreService.getMarksEntryStudents(req.query as any);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new StudentScoreController();

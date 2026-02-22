import { Request, Response } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { StudentScoreService } from './index.js';

class StudentScoreController extends BaseController {
  enterMarks = async (req: Request, res: Response) => {
    try {
      const result = await StudentScoreService.enterMarks(req.body);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  getMarksEntryStudents = async (req: Request, res: Response) => {
    try {
      const result = await StudentScoreService.getMarksEntryStudents(req.query as any);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
}

export default new StudentScoreController();

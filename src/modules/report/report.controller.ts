import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { ReportMode, ReportService } from './index.js';

class ReportController extends BaseController {
  getStudentReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentExternalId } = req.params;
      const { mode, year } = req.query as unknown as { mode: ReportMode; year: number };

      const result = await ReportService.getStudentReport(studentExternalId, mode, Number(year));

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new ReportController();

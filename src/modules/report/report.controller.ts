import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { ReportMode, ReportService } from './index.js';

class ReportController extends BaseController {
  getStudentReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentExternalId } = req.params;
      const { mode, fromMonth, fromYear, toMonth, toYear } = req.query as unknown as { mode: ReportMode } & Record<
        'fromMonth' | 'fromYear' | 'toMonth' | 'toYear',
        string
      >;

      const result = await ReportService.getStudentReport(studentExternalId, mode, {
        from: { month: Number(fromMonth), year: Number(fromYear) },
        to: { month: Number(toMonth), year: Number(toYear) },
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new ReportController();

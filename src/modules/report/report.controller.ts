import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { IReportQuery, ReportService } from './index.js';

class ReportController extends BaseController {
  getStudentReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentExternalId } = req.params;
      // Query values arrive as the strings Express parsed, not the validator's output
      const q = req.query as Record<string, string | undefined>;

      const query: IReportQuery =
        q.mode === 'SESSION'
          ? {
              mode: 'SESSION',
              fromTestExternalId: q.fromTestExternalId!,
              toTestExternalId: q.toTestExternalId!,
              earlierAsRow: q.earlierAsRow === 'true',
            }
          : {
              mode: 'MONTHLY',
              period: {
                from: { month: Number(q.fromMonth), year: Number(q.fromYear) },
                to: { month: Number(q.toMonth), year: Number(q.toYear) },
              },
            };

      const result = await ReportService.getStudentReport(studentExternalId, query);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new ReportController();

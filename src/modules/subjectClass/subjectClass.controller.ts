import { Request, Response } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { SubjectClassService } from './index.js';

class SubjectClassController extends BaseController {
  assignSubjectsToClass = async (req: Request, res: Response) => {
    try {
      const result = await SubjectClassService.assignSubjectsToClass({
        ...req.body,
        createdBy: req.headers['user-external-id'] as string | undefined,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
}

export default new SubjectClassController();

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { SubjectClassService } from './index.js';

class SubjectClassController extends BaseController {
  assignSubjectsToClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SubjectClassService.assignSubjectsToClass({
        ...req.body,
        createdBy: req.user!.externalId,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new SubjectClassController();

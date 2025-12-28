import { Request, Response } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { SubjectService } from './index.js';

class SubjectController extends BaseController {
  create = async (req: Request, res: Response) => {
    try {
      const result = await SubjectService.createSubject({
        ...req.body,
        createdBy: req.headers['user-external-id'] as string,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
}

export default new SubjectController();

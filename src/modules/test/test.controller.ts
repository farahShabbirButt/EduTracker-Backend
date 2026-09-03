import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { TestService } from './index.js';

class TestController extends BaseController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await TestService.createTest({
        ...req.body,
        createdBy: req.user!.externalId,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  //TODO: handle pagination later if needed
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await TestService.getAllTests(req.query);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await TestService.getTestById(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await TestService.updateTest(externalId, req.body);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalId } = req.params;

      const result = await TestService.deleteTest(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new TestController();

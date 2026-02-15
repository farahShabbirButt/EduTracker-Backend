import { Request, Response } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { TestService } from './index.js';

class TestController extends BaseController {
  create = async (req: Request, res: Response) => {
    try {
      const result = await TestService.createTest({
        ...req.body,
        createdBy: req.headers['user-external-id'] as string,
      });

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  //TODO: handle pagination later if needed
  getAll = async (_req: Request, res: Response) => {
    try {
      const result = await TestService.getAllTests();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      console.error('Error caught:', error);
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  getById = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      const result = await TestService.getTestById(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  update = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      const result = await TestService.updateTest(externalId, req.body);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      const result = await TestService.deleteTest(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
}

export default new TestController();

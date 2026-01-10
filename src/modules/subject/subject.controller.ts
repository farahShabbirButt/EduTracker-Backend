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
  //TODO: handle pagination later if needed
  getAll = async (_req: Request, res: Response) => {
    try {
      const result = await SubjectService.getAllSubjects();
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      console.error('Error caught:', error);
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  getById = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      const result = await SubjectService.getSubjectById(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
  update = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      console.info('AAS', externalId, 'ASSA', req.body);
      const result = await SubjectService.updateSubject(externalId, req.body);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      console.error('Error Caught', error);
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { externalId } = req.params;

      const result = await SubjectService.deleteSubject(externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return this.sendErrorResponse(res, error as IAPIErrorResponse);
    }
  };
}

export default new SubjectController();

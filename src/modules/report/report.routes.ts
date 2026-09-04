import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { ReportController, ReportValidation } from './index.js';

const router = Router();

router.get(
  '/student/:studentExternalId',
  ZodValidator(ReportValidation.getStudentReportValidation),
  ReportController.getStudentReport,
);

export default router;

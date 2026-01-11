import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { SubjectClassController, SubjectClassValidation } from './index.js';

const router = Router();

router.post(
  '/assign',
  ZodValidator(SubjectClassValidation.assignSubjectsToClassValidation),
  SubjectClassController.assignSubjectsToClass,
);

export default router;

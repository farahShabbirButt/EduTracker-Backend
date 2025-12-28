import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { SubjectController, SubjectValidation } from './index.js';

const router = Router();
router.post('/', ZodValidator(SubjectValidation.createSubjectValidation), SubjectController.create);

export default router;

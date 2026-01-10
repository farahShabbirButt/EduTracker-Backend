import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { SubjectController, SubjectValidation } from './index.js';

const router = Router();
router.post('/', ZodValidator(SubjectValidation.createSubjectValidation), SubjectController.create);
router.get('/', SubjectController.getAll);
router.get('/:externalId', SubjectController.getById);
router.put('/:externalId', ZodValidator(SubjectValidation.updateSubjectValidation), SubjectController.update);
router.delete('/:externalId', SubjectController.delete);

export default router;

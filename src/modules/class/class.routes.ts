import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { ClassController, ClassValidation } from './index.js';

const router = Router();

router.get('/:classExternalId/subjects', ClassController.getSubjectsByClass);
router.post('/', ZodValidator(ClassValidation.createClassValidation), ClassController.create);

router.put('/:id', ZodValidator(ClassValidation.updateClassValidation), ClassController.update);

router.get('/', ClassController.getAll);
router.get('/:externalId', ClassController.getById);
router.delete('/:externalId', ClassController.delete);

export default router;

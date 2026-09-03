import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { TestController, TestValidation } from './index.js';

const router = Router();

router.post('/', ZodValidator(TestValidation.createTestValidation), TestController.create);
router.get('/', ZodValidator(TestValidation.getAllTestValidation), TestController.getAll);
router.get('/:externalId', TestController.getById);
router.get('/:externalId/subjects', TestController.getSubjects);
router.put('/:externalId', ZodValidator(TestValidation.updateTestValidation), TestController.update);
router.put('/:externalId/subjects', ZodValidator(TestValidation.setTestSubjectsValidation), TestController.setSubjects);
router.delete('/:externalId', TestController.delete);

export default router;

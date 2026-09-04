import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { GradeController, GradeValidation } from './index.js';

const router = Router();

router.post('/', ZodValidator(GradeValidation.createGradeScaleValidation), GradeController.create);
router.get('/', GradeController.getAll);
router.put('/:externalId', ZodValidator(GradeValidation.updateGradeScaleValidation), GradeController.update);
router.delete('/:externalId', GradeController.delete);

export default router;
